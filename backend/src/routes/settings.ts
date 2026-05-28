import { Router } from 'express';
import db from '../db/index.js';
import { sendEmail, sendSendGrid, sendWhatsApp, sendTeams } from '../services/notifications.js';

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

export default router;
