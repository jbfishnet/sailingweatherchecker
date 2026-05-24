import { describe, it, expect } from 'vitest';
import { kmhToBeaufort } from '../src/utils/beaufort.js';

describe('Beaufort Conversion', () => {
  it('should correctly convert kmh to Beaufort', () => {
    expect(kmhToBeaufort(0)).toBe(0);
    expect(kmhToBeaufort(5)).toBe(1);
    expect(kmhToBeaufort(11)).toBe(2);
    expect(kmhToBeaufort(19)).toBe(3);
    expect(kmhToBeaufort(25)).toBe(4);
    expect(kmhToBeaufort(45)).toBe(6);
    expect(kmhToBeaufort(120)).toBe(12);
  });
});
