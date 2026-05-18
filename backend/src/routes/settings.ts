import { Router } from 'express';
import db from '../db/index.js';
import { notifyAll } from '../services/notifications.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings: any = {};
  rows.forEach((row: any) => {
    settings[row.key] = row.value;
  });
  // Set defaults if empty
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
  const transaction = db.transaction((settings) => {
    for (const [key, value] of Object.entries(settings)) {
      insert.run(key, String(value));
    }
  });
  transaction(settings);
  res.json({ status: 'ok' });
});

router.post('/test-notification', async (req, res) => {
  try {
    await notifyAll(req.body, 'Sailing Test', 'This is a test notification from your Sailing Weather Checker!');
    res.json({ status: 'ok' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
