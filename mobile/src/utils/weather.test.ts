// Mirrors frontend/src/utils/weather.test.ts, adapted to Jest (globals, no imports).
import {wmoToDescription, wmoToEmoji, windDirectionText, kmhToBeaufort} from './weather';

describe('wmoToDescription', () => {
  it('returns "Clear sky" for code 0', () => {
    expect(wmoToDescription(0)).toBe('Clear sky');
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
  it('falls back to "Code N" for unknown codes', () => {
    expect(wmoToDescription(999)).toBe('Code 999');
  });
});

describe('wmoToEmoji', () => {
  it('returns ☀️ for clear sky (0)', () => {
    expect(wmoToEmoji(0)).toBe('☀️');
  });
  it('returns ☁️ for overcast (3)', () => {
    expect(wmoToEmoji(3)).toBe('☁️');
  });
  it('returns 🌧️ for rain (61)', () => {
    expect(wmoToEmoji(61)).toBe('🌧️');
  });
  it('returns ❄️ for snow (71)', () => {
    expect(wmoToEmoji(71)).toBe('❄️');
  });
  it('returns ⛈️ for thunderstorm (95)', () => {
    expect(wmoToEmoji(95)).toBe('⛈️');
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
  it('wraps back to N near 360°', () => {
    expect(windDirectionText(360)).toBe('N');
  });
});

describe('kmhToBeaufort', () => {
  it('returns 0 for calm (<1 km/h)', () => {
    expect(kmhToBeaufort(0)).toBe(0);
  });
  it('returns 3 for ~15 km/h', () => {
    expect(kmhToBeaufort(15)).toBe(3);
  });
  it('returns 4 for ~25 km/h', () => {
    expect(kmhToBeaufort(25)).toBe(4);
  });
  it('caps at 12 for hurricane-force wind', () => {
    expect(kmhToBeaufort(200)).toBe(12);
  });
});
