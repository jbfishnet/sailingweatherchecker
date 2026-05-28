/**
 * Unit tests for isGoodConditions().
 * Tests all threshold combinations: wind Beaufort, gusts, temperature,
 * precipitation, wave height, and the sunnyOnly setting.
 */
import { describe, it, expect } from 'vitest';
import { isGoodConditions } from '../src/services/weather.js';
import type { WeatherData } from '../src/types/weather.js';

const base: WeatherData = {
  time: '2026-01-01T10:00',
  temp: 20,
  windSpeed: 22,    // → 3 Bft (Gentle breeze)
  windDirection: 225,
  windGusts: 28,
  cloudCover: 20,
  precipitation: 0,
  weatherCode: 1,   // Mainly clear
  waveHeight: 0.3,
  daily: [],
};

const settings = {
  minBeaufort: '2',
  maxBeaufort: '5',
  minTemp: '15',
  maxPrecipitation: '1',
  maxGusts: '35',
  maxWaveHeight: '1.0',
  sunnyOnly: 'false',
};

describe('isGoodConditions', () => {
  it('returns true when all conditions are within thresholds', () => {
    expect(isGoodConditions(base, settings)).toBe(true);
  });

  it('returns false when wind is below minBeaufort', () => {
    // windSpeed 1 km/h → 0 Bft, minBeaufort is 2
    expect(isGoodConditions({ ...base, windSpeed: 1 }, settings)).toBe(false);
  });

  it('returns false when wind exceeds maxBeaufort', () => {
    // windSpeed 70 km/h → 7 Bft, maxBeaufort is 5
    expect(isGoodConditions({ ...base, windSpeed: 70 }, settings)).toBe(false);
  });

  it('returns false when temperature is below minTemp', () => {
    expect(isGoodConditions({ ...base, temp: 10 }, settings)).toBe(false);
  });

  it('returns true when temperature equals minTemp', () => {
    expect(isGoodConditions({ ...base, temp: 15 }, settings)).toBe(true);
  });

  it('returns false when gusts exceed maxGusts', () => {
    expect(isGoodConditions({ ...base, windGusts: 40 }, settings)).toBe(false);
  });

  it('returns false when precipitation exceeds maxPrecipitation', () => {
    expect(isGoodConditions({ ...base, precipitation: 2 }, settings)).toBe(false);
  });

  it('returns true when precipitation equals maxPrecipitation', () => {
    expect(isGoodConditions({ ...base, precipitation: 1 }, settings)).toBe(true);
  });

  it('returns false when waveHeight exceeds maxWaveHeight', () => {
    expect(isGoodConditions({ ...base, waveHeight: 1.5 }, settings)).toBe(false);
  });

  it('returns true when maxWaveHeight is 0 (wave check disabled) even with large waves', () => {
    const noWaveLimit = { ...settings, maxWaveHeight: '0' };
    expect(isGoodConditions({ ...base, waveHeight: 5.0 }, noWaveLimit)).toBe(true);
  });

  it('returns true when waveHeight is undefined and maxWaveHeight is set', () => {
    // undefined waveHeight → treated as 0, which is ≤ maxWaveHeight
    expect(isGoodConditions({ ...base, waveHeight: undefined }, settings)).toBe(true);
  });

  it('returns false when sunnyOnly=true and cloudCover >= 30', () => {
    const sunny = { ...settings, sunnyOnly: 'true' };
    expect(isGoodConditions({ ...base, cloudCover: 30 }, sunny)).toBe(false);
  });

  it('returns false when sunnyOnly=true and weatherCode is overcast (3)', () => {
    const sunny = { ...settings, sunnyOnly: 'true' };
    expect(isGoodConditions({ ...base, weatherCode: 3, cloudCover: 25 }, sunny)).toBe(false);
  });

  it('returns true when sunnyOnly=true and cloudCover < 30 and weatherCode is 0 (clear)', () => {
    const sunny = { ...settings, sunnyOnly: 'true' };
    expect(isGoodConditions({ ...base, weatherCode: 0, cloudCover: 10 }, sunny)).toBe(true);
  });

  it('returns true when sunnyOnly=false regardless of cloud cover', () => {
    expect(isGoodConditions({ ...base, cloudCover: 100, weatherCode: 3 }, settings)).toBe(true);
  });
});
