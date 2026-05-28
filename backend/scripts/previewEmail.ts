import { writeFileSync } from 'fs';
import { buildEmailHtml, buildEmailText } from '../src/utils/emailTemplate.js';
import type { WeatherData } from '../src/types/weather.js';

// --- Example 1: Baltic Sea – perfect clear summer day ---
const balticSpot = { name: 'Kiel Fjord', lat: 54.3233, lon: 10.1228 };
const balticWeather: WeatherData = {
  time: '2026-05-28T10:00',
  temp: 19,
  windSpeed: 22,       // ~3 Bft
  windDirection: 225,  // SW
  windGusts: 31,
  cloudCover: 15,
  precipitation: 0,
  weatherCode: 1,      // Mainly clear
  waveHeight: 0.4,
  daily: [
    { date: '2026-05-28', weatherCode: 1,  tempMax: 21, tempMin: 12, windSpeedMax: 25, windGustsMax: 35, windDirection: 225, precipitationSum: 0   },
    { date: '2026-05-29', weatherCode: 2,  tempMax: 22, tempMin: 13, windSpeedMax: 28, windGustsMax: 38, windDirection: 247, precipitationSum: 0   },
    { date: '2026-05-30', weatherCode: 3,  tempMax: 18, tempMin: 11, windSpeedMax: 32, windGustsMax: 44, windDirection: 270, precipitationSum: 1.2 },
    { date: '2026-05-31', weatherCode: 61, tempMax: 15, tempMin: 10, windSpeedMax: 40, windGustsMax: 55, windDirection: 293, precipitationSum: 5.8 },
    { date: '2026-06-01', weatherCode: 2,  tempMax: 17, tempMin: 10, windSpeedMax: 22, windGustsMax: 30, windDirection: 315, precipitationSum: 0.3 },
    { date: '2026-06-02', weatherCode: 1,  tempMax: 20, tempMin: 11, windSpeedMax: 20, windGustsMax: 27, windDirection: 202, precipitationSum: 0   },
    { date: '2026-06-03', weatherCode: 0,  tempMax: 23, tempMin: 13, windSpeedMax: 18, windGustsMax: 24, windDirection: 180, precipitationSum: 0   },
  ],
};

// --- Example 2: Mediterranean – breezy partly cloudy day with waves ---
const medSpot = { name: 'Palma de Mallorca', lat: 39.5696, lon: 2.6502 };
const medWeather: WeatherData = {
  time: '2026-05-28T14:00',
  temp: 26,
  windSpeed: 28,       // ~4 Bft
  windDirection: 315,  // NW (Tramontane)
  windGusts: 42,
  cloudCover: 35,
  precipitation: 0,
  weatherCode: 2,      // Partly cloudy
  waveHeight: 0.9,
  daily: [
    { date: '2026-05-28', weatherCode: 2,  tempMax: 28, tempMin: 18, windSpeedMax: 30, windGustsMax: 44, windDirection: 315, precipitationSum: 0   },
    { date: '2026-05-29', weatherCode: 0,  tempMax: 30, tempMin: 19, windSpeedMax: 26, windGustsMax: 37, windDirection: 337, precipitationSum: 0   },
    { date: '2026-05-30', weatherCode: 1,  tempMax: 29, tempMin: 18, windSpeedMax: 22, windGustsMax: 31, windDirection: 292, precipitationSum: 0   },
    { date: '2026-05-31', weatherCode: 80, tempMax: 24, tempMin: 17, windSpeedMax: 35, windGustsMax: 52, windDirection: 270, precipitationSum: 3.4 },
    { date: '2026-06-01', weatherCode: 2,  tempMax: 27, tempMin: 17, windSpeedMax: 24, windGustsMax: 33, windDirection: 315, precipitationSum: 0   },
    { date: '2026-06-02', weatherCode: 1,  tempMax: 29, tempMin: 18, windSpeedMax: 20, windGustsMax: 27, windDirection: 337, precipitationSum: 0   },
    { date: '2026-06-03', weatherCode: 0,  tempMax: 31, tempMin: 19, windSpeedMax: 18, windGustsMax: 24, windDirection: 315, precipitationSum: 0   },
  ],
};

writeFileSync('/tmp/email-preview-baltic.html', buildEmailHtml(balticSpot, balticWeather));
writeFileSync('/tmp/email-preview-mediterranean.html', buildEmailHtml(medSpot, medWeather));

console.log('Plain text preview (Baltic):\n');
console.log(buildEmailText(balticSpot, balticWeather));
console.log('\n---\nPlain text preview (Mediterranean):\n');
console.log(buildEmailText(medSpot, medWeather));
console.log('\nHTML previews written to /tmp/email-preview-baltic.html and /tmp/email-preview-mediterranean.html');
