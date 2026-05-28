import { WeatherData, DailyForecast } from '../types/weather.js';
import { kmhToBeaufort, beaufortToText } from './beaufort.js';

export interface SpotInfo {
  name: string;
  lat: number;
  lon: number;
}

function windDir(degrees: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(degrees / 22.5) % 16];
}

function wmoDesc(code: number): string {
  const map: Record<number, string> = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Icy fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
    80: 'Rain showers', 81: 'Showers', 82: 'Heavy showers',
    85: 'Snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm + hail', 99: 'Thunderstorm + hail',
  };
  return map[code] ?? `Code ${code}`;
}

function wmoEmoji(code: number): string {
  if (code === 0) return '&#9728;&#65039;';
  if (code <= 2) return '&#127804;&#65039;';
  if (code === 3) return '&#9729;&#65039;';
  if (code <= 48) return '&#127783;&#65039;';
  if (code <= 67) return '&#127783;&#65039;';
  if (code <= 77) return '&#10052;&#65039;';
  if (code <= 82) return '&#127782;&#65039;';
  if (code <= 86) return '&#127784;&#65039;';
  return '&#9928;&#65039;';
}

function wmoEmojiText(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  return '⛈️';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  });
}

function latLonStr(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}&#176;${latDir}, ${Math.abs(lon).toFixed(4)}&#176;${lonDir}`;
}

function forecastCard(day: DailyForecast, isFirst: boolean): string {
  const bft = kmhToBeaufort(day.windSpeedMax);
  const bftText = beaufortToText(bft);
  const dir = windDir(day.windDirection);
  const emoji = wmoEmoji(day.weatherCode);
  const desc = wmoDesc(day.weatherCode);
  const precipText = day.precipitationSum > 0
    ? `&#127783;&#65039; ${day.precipitationSum.toFixed(1)} mm`
    : '&#10003; No precipitation';
  const pad = isFirst ? 'padding:0 6px 0 0' : 'padding:0 0 0 6px';

  return `
      <td width="50%" style="${pad};vertical-align:top;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a2744;border-radius:12px;">
        <tr><td style="padding:20px;text-align:center;">
          <p style="margin:0;color:#7dd3fc;font-size:13px;font-weight:700;">${formatDate(day.date)}</p>
          <p style="margin:10px 0;font-size:36px;line-height:1;">${emoji}</p>
          <p style="margin:0;color:#e2e8f0;font-size:13px;">${desc}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
          <tr>
            <td style="color:#f97316;font-size:13px;font-weight:600;">&#8593; ${day.tempMax}&#176;C</td>
            <td style="color:#60a5fa;font-size:13px;font-weight:600;text-align:right;">&#8595; ${day.tempMin}&#176;C</td>
          </tr>
          </table>
          <p style="margin:10px 0 0;color:#a5f3fc;font-size:13px;">${bft} Bft &middot; ${bftText}</p>
          <p style="margin:3px 0 0;color:#94a3b8;font-size:12px;">${dir} &middot; ${Math.round(day.windSpeedMax)} km/h</p>
          <p style="margin:3px 0 0;color:#94a3b8;font-size:12px;">Gusts: ${Math.round(day.windGustsMax)} km/h</p>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;">${precipText}</p>
        </td></tr>
        </table>
      </td>`;
}

export function buildEmailHtml(spot: SpotInfo, weather: WeatherData): string {
  const bft = kmhToBeaufort(weather.windSpeed);
  const bftText = beaufortToText(bft);
  const dir = windDir(weather.windDirection);
  const desc = wmoDesc(weather.weatherCode);
  const emoji = wmoEmoji(weather.weatherCode);
  const timeStr = new Date(weather.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const forecast = weather.daily.slice(1, 3);

  const waveRow = weather.waveHeight !== undefined ? `
    <tr>
      <td colspan="2" style="padding:12px 0 0;vertical-align:top;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a2f5e;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 6px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">&#127754;&#65039; Wave Height</p>
          <p style="margin:0;color:#22d3ee;font-size:22px;font-weight:700;">${weather.waveHeight.toFixed(1)} m</p>
        </td></tr>
        </table>
      </td>
    </tr>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sailing Alert: ${spot.name}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f172a">
<tr><td align="center" style="padding:24px 12px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#0c2461 0%,#1565c0 55%,#006b7a 100%);border-radius:16px 16px 0 0;padding:36px 28px;text-align:center;">
    <p style="margin:0;font-size:52px;line-height:1;">&#9973;&#65039;</p>
    <h1 style="margin:12px 0 0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Sailing Alert</h1>
    <p style="margin:8px 0 0;color:#bae6fd;font-size:18px;font-weight:600;">${spot.name}</p>
    <p style="margin:8px 0 0;color:#7dd3fc;font-size:12px;">&#128205; ${latLonStr(spot.lat, spot.lon)}</p>
  </td></tr>

  <!-- Status Banner -->
  <tr><td bgcolor="#059669" style="padding:13px 28px;text-align:center;">
    <span style="color:#ffffff;font-weight:700;font-size:15px;">&#10004; Conditions are good for sailing right now!</span>
  </td></tr>

  <!-- Current Conditions -->
  <tr><td bgcolor="#0f2044" style="padding:28px;">
    <h2 style="margin:0 0 20px;color:#7dd3fc;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Current Conditions</h2>

    <!-- Weather overview row -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a2f5e;border-radius:12px;margin-bottom:16px;">
    <tr>
      <td style="padding:18px 0 18px 20px;font-size:48px;line-height:1;width:70px;vertical-align:middle;">${emoji}</td>
      <td style="padding:18px 16px 18px 12px;vertical-align:middle;">
        <p style="margin:0;color:#f1f5f9;font-size:19px;font-weight:700;">${desc}</p>
        <p style="margin:5px 0 0;color:#94a3b8;font-size:12px;">Updated ${timeStr}</p>
      </td>
    </tr>
    </table>

    <!-- Stats grid -->
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td width="50%" style="padding:0 6px 10px 0;vertical-align:top;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a2f5e;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 6px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">&#127777;&#65039; Temperature</p>
          <p style="margin:0;color:#f97316;font-size:28px;font-weight:700;line-height:1;">${weather.temp}&#176;C</p>
        </td></tr>
        </table>
      </td>
      <td width="50%" style="padding:0 0 10px 6px;vertical-align:top;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a2f5e;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 6px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">&#128168; Wind Speed</p>
          <p style="margin:0;color:#a5f3fc;font-size:28px;font-weight:700;line-height:1;">${bft} Bft</p>
          <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">${bftText} &middot; ${Math.round(weather.windSpeed)} km/h</p>
        </td></tr>
        </table>
      </td>
    </tr>
    <tr>
      <td width="50%" style="padding:0 6px 10px 0;vertical-align:top;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a2f5e;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 6px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">&#129517; Wind Direction</p>
          <p style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700;line-height:1;">${dir}</p>
          <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">${weather.windDirection}&#176; from North</p>
        </td></tr>
        </table>
      </td>
      <td width="50%" style="padding:0 0 10px 6px;vertical-align:top;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a2f5e;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 6px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">&#128168; Gusts</p>
          <p style="margin:0;color:#fbbf24;font-size:22px;font-weight:700;line-height:1;">${Math.round(weather.windGusts)} km/h</p>
        </td></tr>
        </table>
      </td>
    </tr>
    <tr>
      <td width="50%" style="padding:0 6px 0 0;vertical-align:top;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a2f5e;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 6px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">&#9729;&#65039; Cloud Cover</p>
          <p style="margin:0;color:#cbd5e1;font-size:22px;font-weight:700;line-height:1;">${weather.cloudCover}%</p>
        </td></tr>
        </table>
      </td>
      <td width="50%" style="padding:0 0 0 6px;vertical-align:top;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a2f5e;border-radius:10px;">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 6px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">&#127783;&#65039; Precipitation</p>
          <p style="margin:0;color:#60a5fa;font-size:22px;font-weight:700;line-height:1;">${weather.precipitation.toFixed(1)} mm</p>
        </td></tr>
        </table>
      </td>
    </tr>
    ${waveRow}
    </table>
  </td></tr>

  <!-- 2-Day Forecast -->
  <tr><td bgcolor="#0c1a38" style="padding:28px;">
    <h2 style="margin:0 0 16px;color:#7dd3fc;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">2-Day Forecast</h2>
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      ${forecast.map((day, i) => forecastCard(day, i === 0)).join('')}
    </tr>
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td bgcolor="#0a1628" style="border-radius:0 0 16px 16px;padding:20px 28px;text-align:center;border-top:2px solid #1e3a5f;">
    <p style="margin:0;color:#475569;font-size:12px;">&#9875; Sailing Weather Checker</p>
    <p style="margin:5px 0 0;color:#334155;font-size:11px;">Good sailing conditions were detected at your spot.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export function buildEmailText(spot: SpotInfo, weather: WeatherData): string {
  const bft = kmhToBeaufort(weather.windSpeed);
  const bftText = beaufortToText(bft);
  const dir = windDir(weather.windDirection);
  const desc = wmoDesc(weather.weatherCode);
  const emoji = wmoEmojiText(weather.weatherCode);
  const forecast = weather.daily.slice(1, 3);

  const latDir = spot.lat >= 0 ? 'N' : 'S';
  const lonDir = spot.lon >= 0 ? 'E' : 'W';
  const coords = `${Math.abs(spot.lat).toFixed(4)}°${latDir}, ${Math.abs(spot.lon).toFixed(4)}°${lonDir}`;

  let text = `⛵ Good sailing conditions at ${spot.name}!\n`;
  text += `📍 ${coords}\n\n`;
  text += `── Current Conditions ──────────────\n`;
  text += `${emoji} ${desc}\n`;
  text += `🌡️  Temperature:  ${weather.temp}°C\n`;
  text += `💨 Wind:         ${bft} Bft (${bftText}) from ${dir} at ${Math.round(weather.windSpeed)} km/h\n`;
  text += `💨 Gusts:        ${Math.round(weather.windGusts)} km/h\n`;
  text += `☁️  Cloud cover:  ${weather.cloudCover}%\n`;
  text += `🌧️  Precipitation: ${weather.precipitation.toFixed(1)} mm\n`;
  if (weather.waveHeight !== undefined) {
    text += `🌊 Wave height:  ${weather.waveHeight.toFixed(1)} m\n`;
  }

  text += `\n── 2-Day Forecast ──────────────────\n`;
  forecast.forEach(day => {
    const dBft = kmhToBeaufort(day.windSpeedMax);
    const dBftText = beaufortToText(dBft);
    const dDir = windDir(day.windDirection);
    const dEmoji = wmoEmojiText(day.weatherCode);
    const dDesc = wmoDesc(day.weatherCode);
    text += `\n${formatDate(day.date)}\n`;
    text += `${dEmoji} ${dDesc}  |  ↑${day.tempMax}°C  ↓${day.tempMin}°C\n`;
    text += `💨 ${dBft} Bft (${dBftText})  ${dDir}  ${Math.round(day.windSpeedMax)} km/h  |  Gusts: ${Math.round(day.windGustsMax)} km/h\n`;
    text += `🌧️  Precipitation: ${day.precipitationSum.toFixed(1)} mm\n`;
  });

  text += `\n────────────────────────────────────\n`;
  text += `⚓ Sailing Weather Checker\n`;

  return text;
}
