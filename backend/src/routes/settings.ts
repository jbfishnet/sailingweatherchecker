import { Router } from 'express';
import db from '../db/index.js';
import { sendEmail, sendSendGrid, sendWhatsApp, sendTeams } from '../services/notifications.js';
import { buildEmailHtml, buildEmailText, SpotInfo } from '../utils/emailTemplate.js';
import { WeatherData } from '../types/weather.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings: any = {};
  rows.forEach((row: any) => { settings[row.key] = row.value; });
  if (Object.keys(settings).length === 0) {
    settings.minBeaufort = 2;
    settings.maxBeaufort = 4;
    settings.sunnyOnly = true;
    settings.minTemp = 15;
    settings.maxPrecipitation = 0;
    settings.maxGusts = 25;
    settings.maxWaveHeight = 1.0;
  }
  res.json(settings);
});

router.post('/', (req, res) => {
  const settings = req.body;
  const insert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const transaction = db.transaction((s: any) => {
    for (const [key, value] of Object.entries(s)) {
      insert.run(key, String(value));
    }
  });
  transaction(settings);
  res.json({ status: 'ok' });
});

const TEST_SUBJECT = 'Sailing Weather — Test Notification';
const TEST_BODY = 'This is a test notification from your Sailing Weather Checker. If you received this, the channel is working correctly.';

router.post('/test-notification', async (req, res) => {
  const s = req.body;

  const run = async (fn: () => Promise<void>): Promise<'ok' | string> => {
    try { await fn(); return 'ok'; }
    catch (e: any) { return e.message || 'error'; }
  };

  const [sendgrid, email, whatsapp, teams] = await Promise.all([
    s.sendgridApiKey && s.sendgridFrom && s.sendgridTo
      ? run(() => sendSendGrid(s, TEST_SUBJECT, TEST_BODY))
      : Promise.resolve('skipped'),
    s.emailHost && s.emailUser && s.emailTo
      ? run(() => sendEmail(s, TEST_SUBJECT, TEST_BODY))
      : Promise.resolve('skipped'),
    s.twilioSid && s.twilioToken && s.twilioTo
      ? run(() => sendWhatsApp(s, TEST_BODY))
      : Promise.resolve('skipped'),
    s.teamsWebhook
      ? run(() => sendTeams(s, TEST_BODY))
      : Promise.resolve('skipped'),
  ]);

  res.json({ sendgrid, email, whatsapp, teams });
});

// ── Simulate Email ────────────────────────────────────────────────────────────
// Sends a fully rendered HTML sailing-alert email using hardcoded sample data.
// Only fires email channels (SendGrid + SMTP) since those support HTML.

const SIMULATE_SPOT: SpotInfo = { name: 'Kiel Fjord (Preview)', lat: 54.3233, lon: 10.1228 };
const SIMULATE_SUBJECT = 'Sailing Alert Preview: Kiel Fjord';

function buildSimulateWeather(): WeatherData {
  const today = new Date();
  const day = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  return {
    time: today.toISOString(),
    temp: 19, windSpeed: 22, windDirection: 225, windGusts: 31,
    cloudCover: 15, precipitation: 0, weatherCode: 1, waveHeight: 0.4,
    daily: [
      { date: day(0), weatherCode: 1,  tempMax: 21, tempMin: 12, windSpeedMax: 25, windGustsMax: 35, windDirection: 225, precipitationSum: 0   },
      { date: day(1), weatherCode: 2,  tempMax: 22, tempMin: 13, windSpeedMax: 28, windGustsMax: 38, windDirection: 247, precipitationSum: 0   },
      { date: day(2), weatherCode: 3,  tempMax: 18, tempMin: 11, windSpeedMax: 32, windGustsMax: 44, windDirection: 270, precipitationSum: 1.2 },
      { date: day(3), weatherCode: 61, tempMax: 15, tempMin: 10, windSpeedMax: 40, windGustsMax: 55, windDirection: 293, precipitationSum: 5.8 },
      { date: day(4), weatherCode: 2,  tempMax: 17, tempMin: 10, windSpeedMax: 22, windGustsMax: 30, windDirection: 315, precipitationSum: 0.3 },
      { date: day(5), weatherCode: 1,  tempMax: 20, tempMin: 11, windSpeedMax: 20, windGustsMax: 27, windDirection: 202, precipitationSum: 0   },
      { date: day(6), weatherCode: 0,  tempMax: 23, tempMin: 13, windSpeedMax: 18, windGustsMax: 24, windDirection: 180, precipitationSum: 0   },
    ],
  };
}

router.post('/simulate-email', async (req, res) => {
  const s = req.body;
  const weather = buildSimulateWeather();
  const html = buildEmailHtml(SIMULATE_SPOT, weather);
  const text = buildEmailText(SIMULATE_SPOT, weather);

  const run = async (fn: () => Promise<void>): Promise<'ok' | string> => {
    try { await fn(); return 'ok'; }
    catch (e: any) { return e.message || 'error'; }
  };

  const [sendgrid, email] = await Promise.all([
    s.sendgridApiKey && s.sendgridFrom && s.sendgridTo
      ? run(() => sendSendGrid(s, SIMULATE_SUBJECT, text, html))
      : Promise.resolve('skipped'),
    s.emailHost && s.emailUser && s.emailTo
      ? run(() => sendEmail(s, SIMULATE_SUBJECT, text, html))
      : Promise.resolve('skipped'),
  ]);

  res.json({ sendgrid, email });
});

export default router;
