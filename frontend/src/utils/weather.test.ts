import { describe, it, expect } from 'vitest';
import { wmoToDescription, wmoToEmoji, windDirectionText, kmhToBeaufort } from './weather';

describe('wmoToDescription', () => {
  it('returns "Clear sky" for code 0', () => {
    expect(wmoToDescription(0)).toBe('Clear sky');
  });

  it('returns "Mainly clear" for code 1', () => {
    expect(wmoToDescription(1)).toBe('Mainly clear');
  });

  it('returns "Partly cloudy" for code 2', () => {
    expect(wmoToDescription(2)).toBe('Partly cloudy');
  });

  it('returns "Light rain" for code 61', () => {
    expect(wmoToDescription(61)).toBe('Light rain');
  });

  it('returns "Thunderstorm" for code 95', () => {
    expect(wmoToDescription(95)).toBe('Thunderstorm');
  });

  it('returns "Code 999" for unknown code', () => {
    expect(wmoToDescription(999)).toBe('Code 999');
  });
});

describe('wmoToEmoji', () => {
  it('returns ☀️ for code 0 (clear)', () => {
    expect(wmoToEmoji(0)).toBe('☀️');
  });

  it('returns 🌤️ for code 1 (mainly clear)', () => {
    expect(wmoToEmoji(1)).toBe('🌤️');
  });

  it('returns ☁️ for code 3 (overcast)', () => {
    expect(wmoToEmoji(3)).toBe('☁️');
  });

  it('returns 🌧️ for code 61 (rain)', () => {
    expect(wmoToEmoji(61)).toBe('🌧️');
  });

  it('returns ⛈️ for code 95 (thunderstorm)', () => {
    expect(wmoToEmoji(95)).toBe('⛈️');
  });

  it('returns ❄️ for code 71 (snow)', () => {
    expect(wmoToEmoji(71)).toBe('❄️');
  });
});

describe('windDirectionText', () => {
  it('returns N for 0°', () => {
    expect(windDirectionText(0)).toBe('N');
  });

  it('returns E for 90°', () => {
    expect(windDirectionText(90)).toBe('E');
  });

  it('returns S for 180°', () => {
    expect(windDirectionText(180)).toBe('S');
  });

  it('returns W for 270°', () => {
    expect(windDirectionText(270)).toBe('W');
  });

  it('returns SW for 225°', () => {
    expect(windDirectionText(225)).toBe('SW');
  });

  it('returns NE for 45°', () => {
    expect(windDirectionText(45)).toBe('NE');
  });

  it('returns N for 360° (wraps around)', () => {
    expect(windDirectionText(360)).toBe('N');
  });
});

describe('kmhToBeaufort', () => {
  it('returns 0 for calm (0 km/h)', () => {
    expect(kmhToBeaufort(0)).toBe(0);
  });

  it('returns 4 for moderate breeze (22 km/h)', () => {
    // 20–28 km/h → Beaufort 4
    expect(kmhToBeaufort(22)).toBe(4);
  });

  it('returns 4 for moderate breeze (25 km/h)', () => {
    expect(kmhToBeaufort(25)).toBe(4);
  });

  it('returns 12 for hurricane force (120 km/h)', () => {
    expect(kmhToBeaufort(120)).toBe(12);
  });
});
