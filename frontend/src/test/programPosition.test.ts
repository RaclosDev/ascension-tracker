import { describe, expect, it } from 'vitest';
import type { ProgramAssignment } from '@/lib/coach/coachPrograms';
import { programPosition } from '@/lib/coach/weeks';

const assignment = (over: Partial<ProgramAssignment>): ProgramAssignment => ({
  id: 'a',
  programId: 'p',
  sourceProgramId: 'lib',
  programName: 'Hipertrofia',
  weeks: 4,
  startDate: '2027-01-04',
  status: 'ACTIVE',
  createdAt: '2026-11-20T00:00:00Z',
  endedAt: null,
  effectiveUntil: null,
  ...over,
});

describe('programPosition', () => {
  const original = assignment({ id: 'orig', effectiveUntil: '2027-01-11' });
  const published = assignment({
    id: 'week',
    sourceProgramId: null,
    weeks: 1,
    startDate: '2027-01-11',
    effectiveUntil: '2027-01-18',
  });
  const rest = assignment({ id: 'rest', weeks: 2, startDate: '2027-01-18' });

  it('counts from where the program started', () => {
    expect(programPosition([original], original, '2027-01-04')).toEqual({ week: 1, weeks: 4 });
  });

  it('keeps the numbering after a week published by hand splits the program', () => {
    const all = [original, published, rest];
    expect(programPosition(all, rest, '2027-01-18')).toEqual({ week: 3, weeks: 4 });
    expect(programPosition(all, rest, '2027-01-25')).toEqual({ week: 4, weeks: 4 });
  });

  it('ignores the same library program assigned again on its own', () => {
    const again = assignment({ id: 'again', startDate: '2027-03-01' });
    expect(programPosition([original, again], again, '2027-03-08')).toEqual({ week: 2, weeks: 4 });
  });
});
