import app from './app.js';
import dotenv from 'dotenv';
import cron from 'node-cron';
import db from './db/index.js';
import { getWeatherData, isGoodConditions } from './services/weather.js';
import { notifyAll } from './services/notifications.js';
import { kmhToBeaufort } from './utils/beaufort.js';
import { buildEmailHtml, buildEmailText } from './utils/emailTemplate.js';

dotenv.config();
const port = process.env.PORT || 3001;

async function checkWeatherForAllSpots() {
  console.log('Running weather check...');
  const spots: any[] = db.prepare('SELECT * FROM spots').all();
  const settingsRows: any[] = db.prepare('SELECT * FROM settings').all();
  const settings: any = {};
  settingsRows.forEach(row => settings[row.key] = row.value);

  if (!settings.minBeaufort) settings.minBeaufort = 2;
  if (!settings.maxBeaufort) settings.maxBeaufort = 4;

  for (const spot of spots) {
    if (spot.snooze_until && new Date(spot.snooze_until) > new Date()) continue;

    try {
      const weather = await getWeatherData(spot.lat, spot.lon);
      const isGood = isGoodConditions(weather, settings);

      const lastCheck: any = db.prepare('SELECT is_good FROM weather_history WHERE spot_id = ? ORDER BY last_check DESC LIMIT 1').get(spot.id);

      db.prepare('INSERT INTO weather_history (spot_id, is_good, summary) VALUES (?, ?, ?)').run(
        spot.id,
        isGood ? 1 : 0,
        `${kmhToBeaufort(weather.windSpeed)} Bft, ${weather.temp}°C`
      );

      if (isGood && (!lastCheck || lastCheck.is_good === 0)) {
        const text = buildEmailText(spot, weather);
        const html = buildEmailHtml(spot, weather);
        await notifyAll(settings, `Sailing Alert: ${spot.name}`, text, html);
      }
    } catch (error) {
      console.error(`Failed to check weather for ${spot.name}`, error);
    }
  }
}

cron.schedule('0 */4 * * *', checkWeatherForAllSpots);

app.post('/api/refresh', async (req, res) => {
  await checkWeatherForAllSpots();
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
