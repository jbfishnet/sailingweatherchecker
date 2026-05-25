import express from 'express';
import cors from 'cors';
import spotRoutes from './routes/spots.js';
import settingsRoutes from './routes/settings.js';
import weatherRoutes from './routes/weather.js';
import geocodeRoutes from './routes/geocode.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/spots', spotRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/geocode', geocodeRoutes);

app.get('/', (req, res) => {
  res.send('<h1>Sailing Weather Backend</h1><p>The API is running.</p>');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
