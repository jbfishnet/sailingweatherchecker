import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

router.get('/', (req, res) => {
  const spots = db.prepare('SELECT * FROM spots').all();
  res.json(spots);
});

router.post('/', (req, res) => {
  const { name, lat, lon } = req.body;
  const info = db.prepare('INSERT INTO spots (name, lat, lon) VALUES (?, ?, ?)').run(name, lat, lon);
  res.json({ id: info.lastInsertRowid, name, lat, lon });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM spots WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

router.post('/:id/snooze', (req, res) => {
  const { until } = req.body; // ISO string
  db.prepare('UPDATE spots SET snooze_until = ? WHERE id = ?').run(until, req.params.id);
  res.json({ status: 'ok' });
});

export default router;
