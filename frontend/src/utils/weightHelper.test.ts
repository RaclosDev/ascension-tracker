import { describe, it, expect } from 'vitest';
import { parseSafeWeight } from './weightHelper';

describe('weightHelper', () => {
  it('parses correct weights', () => {
    expect(parseSafeWeight('80.5')).toBe(80.5);
    expect(parseSafeWeight('80,5')).toBe(80.5);
    expect(parseSafeWeight(80.5)).toBe(80.5);
  });

  it('handles invalid weights', () => {
    expect(parseSafeWeight('')).toBeNull();
    expect(parseSafeWeight(null)).toBeNull();
    expect(parseSafeWeight(undefined)).toBeNull();
    expect(parseSafeWeight('invalid')).toBeNull();
    expect(parseSafeWeight('-5')).toBeNull();
    expect(parseSafeWeight('5000')).toBeNull();
  });
});
