import { describe, it, expect } from 'vitest';
import {
  formatRestFriendly,
  formatRest,
  formatDuration,
  formatKg,
  matchVariant,
  previousSetLabel,
  previousFill,
} from './format';

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

describe('matchVariant', () => {
  it('returns true when both variants are undefined or empty', () => {
    expect(matchVariant(undefined, undefined)).toBe(true);
    expect(matchVariant({}, {})).toBe(true);
    expect(matchVariant(undefined, { grip: '', machine: '' })).toBe(true);
    expect(
      matchVariant(
        { grip: null as unknown as string, machine: null as unknown as string },
        undefined,
      ),
    ).toBe(true);
  });

  it('matches regardless of case or surrounding whitespace', () => {
    expect(matchVariant({ grip: '  Prono  ' }, { grip: 'prono' })).toBe(true);
    expect(matchVariant({ machine: 'Hammer Strength' }, { machine: 'hammer strength' })).toBe(true);
  });

  it('matches backend DTO null values against frontend undefined/missing values', () => {
    const backendVariant = { grip: 'neutro', machine: null as unknown as string };
    const frontendVariant = { grip: 'Neutro' };
    expect(matchVariant(backendVariant, frontendVariant)).toBe(true);
  });

  it('returns false when grips or machines differ', () => {
    expect(matchVariant({ grip: 'prono' }, { grip: 'supino' })).toBe(false);
    expect(matchVariant({ machine: 'M1' }, { machine: 'M2' })).toBe(false);
  });
});

describe('previousSetLabel and previousFill with variants', () => {
  const history = [
    {
      id: 'w1',
      name: 'Torso',
      startedAt: 1000,
      finishedAt: 2000,
      exercises: [
        {
          id: 'ex1',
          exerciseId: 'bench-press',
          variant: { grip: 'neutro', machine: null as unknown as string },
          notes: '',
          sets: [
            { id: 's1', type: 'normal' as const, weight: '80', reps: '10', completed: true },
            { id: 's2', type: 'normal' as const, weight: '85', reps: '8', completed: true },
          ],
        },
      ],
    },
  ];

  it('correctly matches previous sets when backend returned null for machine', () => {
    const label = previousSetLabel('bench-press', { grip: 'Neutro' }, 0, history);
    expect(label).toBe('80 × 10');

    const fill = previousFill('bench-press', { grip: 'Neutro' }, 1, history);
    expect(fill).toEqual({ weight: '85', reps: '8' });
  });

  it('returns empty when variant does not match', () => {
    const label = previousSetLabel('bench-press', { grip: 'Prono' }, 0, history);
    expect(label).toBe('');
  });
});
