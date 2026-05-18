import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import spotRoutes from './routes/spots.js';
import settingsRoutes from './routes/settings.js';
import weatherRoutes from './routes/weather.js';
import db from './db/index.js';
import { getWeatherData, isGoodConditions } from './services/weather.js';
import { notifyAll } from './services/notifications.js';
import { kmhToBeaufort } from './utils/beaufort.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/spots', spotRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/weather', weatherRoutes);

async function checkWeatherForAllSpots() {
  console.log('Running weather check...');
  const spots: any[] = db.prepare('SELECT * FROM spots').all();
  const settingsRows: any[] = db.prepare('SELECT * FROM settings').all();
  const settings: any = {};
  settingsRows.forEach(row => settings[row.key] = row.value);

  // Apply defaults if settings are missing
  if (!settings.minBeaufort) settings.minBeaufort = 2;
  if (!settings.maxBeaufort) settings.maxBeaufort = 4;

  for (const spot of spots) {
    // Check snooze
    if (spot.snooze_until && new Date(spot.snooze_until) > new Date()) {
      continue;
    }

    try {
      const weather = await getWeatherData(spot.lat, spot.lon);
      const isGood = isGoodConditions(weather, settings);

      const lastCheck: any = db.prepare('SELECT is_good FROM weather_history WHERE spot_id = ? ORDER BY last_check DESC LIMIT 1').get(spot.id);

      db.prepare('INSERT INTO weather_history (spot_id, is_good, summary) VALUES (?, ?, ?)').run(
        spot.id,
        isGood ? 1 : 0,
        `${kmhToBeaufort(weather.windSpeed)} Bft, ${weather.temp}°C`
      );

      // Notify if changed to good
      if (isGood && (!lastCheck || lastCheck.is_good === 0)) {
        const bft = kmhToBeaufort(weather.windSpeed);
        const body = `⛵ Good sailing at ${spot.name}! \nWind: ${bft} Bft, Temp: ${weather.temp}°C, Waves: ${weather.waveHeight || 'N/A'}m.`;
        await notifyAll(settings, `Sailing Alert: ${spot.name}`, body);
      }
    } catch (error) {
      console.error(`Failed to check weather for ${spot.name}`, error);
    }
  }
}

// Every 4 hours
cron.schedule('0 */4 * * *', checkWeatherForAllSpots);

app.post('/api/refresh', async (req, res) => {
  await checkWeatherForAllSpots();
  res.json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
