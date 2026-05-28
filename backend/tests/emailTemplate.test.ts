/**
 * Unit tests for buildEmailHtml() and buildEmailText().
 * No external dependencies — pure string-generation functions.
 */
import { describe, it, expect } from 'vitest';
import { buildEmailHtml, buildEmailText } from '../src/utils/emailTemplate.js';
import type { WeatherData } from '../src/types/weather.js';

const mockSpot = { name: 'Kiel Fjord', lat: 54.3233, lon: 10.1228 };

const mockWeather: WeatherData = {
  time: '2026-05-28T10:00:00',
  temp: 19,
  windSpeed: 22,
  windDirection: 225,
  windGusts: 31,
  cloudCover: 15,
  precipitation: 0,
  weatherCode: 1,
  waveHeight: 0.4,
  daily: [
    { date: '2026-05-28', weatherCode: 1,  tempMax: 21, tempMin: 12, windSpeedMax: 25, windGustsMax: 35, windDirection: 225, precipitationSum: 0   },
    { date: '2026-05-29', weatherCode: 2,  tempMax: 22, tempMin: 13, windSpeedMax: 28, windGustsMax: 38, windDirection: 247, precipitationSum: 0   },
    { date: '2026-05-30', weatherCode: 3,  tempMax: 18, tempMin: 11, windSpeedMax: 32, windGustsMax: 44, windDirection: 270, precipitationSum: 1.2 },
  ],
};

// ── buildEmailHtml ────────────────────────────────────────────────────────────

describe('buildEmailHtml', () => {
  it('returns a valid HTML document string', () => {
    const html = buildEmailHtml(mockSpot, mockWeather);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  it('contains the spot name', () => {
    const html = buildEmailHtml(mockSpot, mockWeather);
    expect(html).toContain('Kiel Fjord');
  });

  it('contains the temperature value', () => {
    const html = buildEmailHtml(mockSpot, mockWeather);
    expect(html).toContain('19');
  });

  it('contains Bft (Beaufort scale notation)', () => {
    const html = buildEmailHtml(mockSpot, mockWeather);
    expect(html).toContain('Bft');
  });

  it('contains the wind direction (SW for 225°)', () => {
    const html = buildEmailHtml(mockSpot, mockWeather);
    expect(html).toContain('SW');
  });

  it('contains the 2-day forecast section header', () => {
    const html = buildEmailHtml(mockSpot, mockWeather);
    expect(html).toContain('2-Day Forecast');
  });

  it('renders both forecast day cards (Partly cloudy + Overcast)', () => {
    const html = buildEmailHtml(mockSpot, mockWeather);
    // daily[1] = weatherCode 2 → "Partly cloudy"; daily[2] = weatherCode 3 → "Overcast"
    expect(html).toContain('Partly cloudy');
    expect(html).toContain('Overcast');
  });

  it('shows wave height when waveHeight is defined', () => {
    const html = buildEmailHtml(mockSpot, mockWeather);
    expect(html).toContain('Wave Height');
    expect(html).toContain('0.4');
  });

  it('omits wave height section when waveHeight is undefined', () => {
    const noWave: WeatherData = { ...mockWeather, waveHeight: undefined };
    const html = buildEmailHtml(mockSpot, noWave);
    expect(html).not.toContain('Wave Height');
  });

  it('contains the coordinates', () => {
    const html = buildEmailHtml(mockSpot, mockWeather);
    expect(html).toContain('54.3233');
    expect(html).toContain('10.1228');
  });

  it('contains the good-conditions banner', () => {
    const html = buildEmailHtml(mockSpot, mockWeather);
    expect(html).toContain('good for sailing');
  });
});

// ── buildEmailText ────────────────────────────────────────────────────────────

describe('buildEmailText', () => {
  it('contains the spot name', () => {
    const text = buildEmailText(mockSpot, mockWeather);
    expect(text).toContain('Kiel Fjord');
  });

  it('contains temperature in °C', () => {
    const text = buildEmailText(mockSpot, mockWeather);
    expect(text).toContain('19°C');
  });

  it('contains Bft wind reading', () => {
    const text = buildEmailText(mockSpot, mockWeather);
    expect(text).toContain('Bft');
  });

  it('contains the 2-Day Forecast header', () => {
    const text = buildEmailText(mockSpot, mockWeather);
    expect(text).toContain('2-Day Forecast');
  });

  it('contains wave height when present', () => {
    const text = buildEmailText(mockSpot, mockWeather);
    expect(text).toContain('Wave height');
    expect(text).toContain('0.4');
  });

  it('omits wave height line when waveHeight is undefined', () => {
    const noWave: WeatherData = { ...mockWeather, waveHeight: undefined };
    const text = buildEmailText(mockSpot, noWave);
    expect(text).not.toContain('Wave height');
  });

  it('contains Sailing Weather Checker footer', () => {
    const text = buildEmailText(mockSpot, mockWeather);
    expect(text).toContain('Sailing Weather Checker');
  });
});
