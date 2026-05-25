import { Router } from 'express';
import axios from 'axios';

const router = Router();

// Nominatim requires a User-Agent — proxying through backend satisfies that requirement.
router.get('/', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'q is required' });

  // Direct coordinate paste: "53.5, 9.9" or "53.5,9.9"
  const coordMatch = q.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (coordMatch) {
    return res.json([{
      lat: coordMatch[1],
      lon: coordMatch[2],
      display_name: `${coordMatch[1]}, ${coordMatch[2]}`,
      name: `${coordMatch[1]}, ${coordMatch[2]}`,
    }]);
  }

  try {
    const result = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { format: 'json', limit: 5, q },
      headers: { 'User-Agent': 'SailingWeatherChecker/1.0 (https://github.com/fishbeef/sailingweatherchecker)' },
    });
    res.json(result.data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
