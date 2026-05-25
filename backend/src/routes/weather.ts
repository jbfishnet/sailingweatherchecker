import { Router } from 'express';
import { getWeatherData, isGoodConditions } from '../services/weather.js';
import db from '../db/index.js';

const router = Router();

router.get('/:spotId', async (req, res) => {
  const spot: any = db.prepare('SELECT * FROM spots WHERE id = ?').get(req.params.spotId);
  if (!spot) return res.status(404).send();

  try {
    const weather = await getWeatherData(spot.lat, spot.lon);

    const settingsRows: any[] = db.prepare('SELECT * FROM settings').all();
    const settings: any = {};
    settingsRows.forEach(row => { settings[row.key] = row.value; });
    if (!settings.minBeaufort) settings.minBeaufort = 2;
    if (!settings.maxBeaufort) settings.maxBeaufort = 4;

    const isGood = isGoodConditions(weather, settings);
    res.json({ ...weather, isGood });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
