import { describe, it, expect } from 'vitest';
import { formatRestFriendly, formatRest, formatDuration, formatKg } from './format';

describe('formatRestFriendly', () => {
  it('formats 0 or negative values as 0s', () => {
    expect(formatRestFriendly(0)).toBe('0s');
    expect(formatRestFriendly(-10)).toBe('0s');
  });

  it('formats durations under 60 seconds as Xs', () => {
    expect(formatRestFriendly(15)).toBe('15s');
    expect(formatRestFriendly(30)).toBe('30s');
    expect(formatRestFriendly(45)).toBe('45s');
  });

  it('formats exact minutes as Xm without 0s', () => {
    expect(formatRestFriendly(60)).toBe('1m');
    expect(formatRestFriendly(120)).toBe('2m');
    expect(formatRestFriendly(180)).toBe('3m');
    expect(formatRestFriendly(240)).toBe('4m');
    expect(formatRestFriendly(300)).toBe('5m');
  });

  it('formats combined minutes and seconds as Xm Ys', () => {
    expect(formatRestFriendly(90)).toBe('1m 30s');
    expect(formatRestFriendly(150)).toBe('2m 30s');
    expect(formatRestFriendly(75)).toBe('1m 15s');
    expect(formatRestFriendly(210)).toBe('3m 30s');
    expect(formatRestFriendly(315)).toBe('5m 15s');
  });
});

describe('formatRest', () => {
  it('formats MM:SS correctly', () => {
    expect(formatRest(0)).toBe('0:00');
    expect(formatRest(30)).toBe('0:30');
    expect(formatRest(60)).toBe('1:00');
    expect(formatRest(90)).toBe('1:30');
    expect(formatRest(120)).toBe('2:00');
  });
});

describe('formatDuration', () => {
  it('formats duration in mm:ss or hh:mm:ss', () => {
    expect(formatDuration(45000)).toBe('00:45');
    expect(formatDuration(75000)).toBe('01:15');
    expect(formatDuration(3661000)).toBe('1:01:01');
  });
});

describe('formatKg', () => {
  it('formats numbers with kg suffix', () => {
    expect(formatKg(50)).toContain('50');
    expect(formatKg(50)).toContain('kg');
  });
});
