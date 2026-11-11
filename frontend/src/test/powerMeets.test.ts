import { describe, expect, it } from 'vitest';
import { attemptWarning, meetTotals, type PowerAttempt } from '../lib/coach/powerMeets';

const attempt = (patch: Partial<PowerAttempt>): PowerAttempt => ({
  lift: 'SQUAT',
  number: 1,
  plannedKg: 200,
  actualKg: null,
  result: 'PENDING',
  recordAttempt: false,
  ...patch,
});
describe('competition totals', () => {
  it('never turns a partial result or planned weights into a valid total', () => {
    const attempts = [
      attempt({ actualKg: 190, result: 'VALID' }),
      attempt({ lift: 'BENCH', actualKg: 110, result: 'VALID' }),
      attempt({ lift: 'DEADLIFT', actualKg: 230, result: 'INVALID' }),
    ];
    expect(meetTotals(attempts)).toEqual({
      planned: 600,
      actual: null,
      finished: true,
      validLifts: 2,
    });
    attempts.push(attempt({ lift: 'DEADLIFT', number: 2, actualKg: 230, result: 'VALID' }));
    attempts.push(attempt({ number: 2, actualKg: 210, result: 'INVALID' }));
    expect(meetTotals(attempts).actual).toBe(530);
  });
  it('labels a total provisional while any attempt is pending', () => {
    const attempts = [
      attempt({ actualKg: 200, result: 'VALID' }),
      attempt({ lift: 'BENCH', actualKg: 120, result: 'VALID' }),
      attempt({ lift: 'DEADLIFT', actualKg: 240, result: 'VALID' }),
      attempt({ number: 2 }),
    ];
    expect(meetTotals(attempts)).toMatchObject({ actual: 560, finished: false });
  });
  it('does not count zero, negative or non-finite values', () => {
    expect(
      meetTotals([attempt({ actualKg: Infinity, plannedKg: -1, result: 'VALID' })]),
    ).toMatchObject({ planned: null, actual: null, validLifts: 0 });
  });
});
describe('optional IPF guidance', () => {
  it('warns about ordinary weights and successful progression without imposing rules on other meets', () => {
    expect(attemptWarning(attempt({ plannedKg: 201 }), undefined, 'CUSTOM')).toBeNull();
    expect(attemptWarning(attempt({ plannedKg: 201 }), undefined, 'IPF_2026')).toContain('2,5');
    expect(
      attemptWarning(attempt({ plannedKg: 201, recordAttempt: true }), undefined, 'IPF_2026'),
    ).toBeNull();
    expect(
      attemptWarning(
        attempt({ plannedKg: 200 }),
        attempt({ actualKg: 200, result: 'VALID' }),
        'IPF_2026',
      ),
    ).toContain('progresión');
    expect(
      attemptWarning(
        attempt({ plannedKg: 200 }),
        attempt({ actualKg: 200, result: 'INVALID' }),
        'IPF_2026',
      ),
    ).toBeNull();
  });
});
