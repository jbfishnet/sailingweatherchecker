import { Router } from 'express';
import { getWeatherData } from '../services/weather.js';
import db from '../db/index.js';

const router = Router();

router.get('/:spotId', async (req, res) => {
  const spot: any = db.prepare('SELECT * FROM spots WHERE id = ?').get(req.params.spotId);
  if (!spot) return res.status(404).send();

  try {
    const weather = await getWeatherData(spot.lat, spot.lon);
    res.json(weather);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
