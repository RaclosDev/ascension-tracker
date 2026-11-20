import { describe, expect, it } from 'vitest';
import { blockLoad, blockProgram, publishable, weekState } from './blocks';
import type { Program, ProgramDay } from './coachPrograms';
import type { SavedWeek } from './weeks';

const session = (dayIndex: number, exerciseId = 'squat', sets = 3): ProgramDay =>
  ({
    week: 1,
    dayIndex,
    name: `Día ${dayIndex}`,
    notes: null,
    exercises: [
      {
        exerciseId,
        exerciseName: exerciseId,
        sets,
        reps: '5',
        notes: null,
      },
    ],
  }) as unknown as ProgramDay;

const week = (
  weekStart: string,
  days: ProgramDay[],
  version = 1,
  publishedVersion: number | null = null,
): SavedWeek => ({
  linkId: 'link',
  weekStart,
  content: {
    program: { id: null, name: weekStart, notes: null, weeks: 1, days } as Program,
    privateNotes: 'solo para el entrenador',
    intent: 'BUILD',
    decision: '',
  } as SavedWeek['content'],
  version,
  assignmentId: null,
  publishedVersion,
  updatedAt: null,
});

const TODAY = '2026-11-16';

describe('weekState', () => {
  it('tells apart what the athlete has from what is still a draft', () => {
    expect(weekState(week('2026-11-23', [], 0), TODAY)).toBe('empty');
    expect(weekState(week('2026-11-23', [session(1)], 2, 2), TODAY)).toBe('published');
    expect(weekState(week('2026-11-09', [session(1)], 2, 2), TODAY)).toBe('published');
    expect(weekState(week('2026-11-09', [session(1)]), TODAY)).toBe('past');
    expect(['draft', 'incomplete']).toContain(weekState(week('2026-11-23', [session(1)]), TODAY));
  });

  it('offers for publishing only saved weeks the athlete has not seen as they are', () => {
    const weeks = [
      week('2026-11-23', [], 0),
      week('2026-11-30', [session(1)], 3, 3),
      week('2026-11-09', [session(1)]),
    ];
    expect(publishable(weeks)).toEqual([]);
  });
});

describe('blockProgram', () => {
  it('keeps the weeks with sessions, numbered from the first one planned', () => {
    const program = blockProgram('Fuerza base', [
      week('2026-11-16', [], 0),
      week('2026-11-23', [session(1), session(3)]),
      week('2026-11-30', []),
      week('2026-12-07', [session(2)]),
      week('2026-12-14', [], 0),
    ]);
    expect(program.id).toBeNull();
    expect(program.name).toBe('Fuerza base');
    expect(program.notes).toBeNull();
    expect(program.weeks).toBe(3);
    expect(program.days.map((day) => [day.week, day.dayIndex])).toEqual([
      [1, 1],
      [1, 3],
      [3, 2],
    ]);
    expect(JSON.stringify(program)).not.toContain('solo para el entrenador');
  });
});

describe('blockLoad', () => {
  it('lines up each group across the weeks, heaviest first', () => {
    const muscleOf = (id: string) => (id === 'squat' ? 'legs' : 'chest') as never;
    const load = blockLoad(
      [
        week('2026-11-16', [session(1, 'squat', 4), session(2, 'bench', 2)]),
        week('2026-11-23', [], 0),
        week('2026-11-30', [session(1, 'squat', 6)]),
      ],
      muscleOf,
    );
    expect(load.groups.map((group) => group.sets)).toEqual([
      [4, 0, 6],
      [2, 0, 0],
    ]);
    expect(load.max).toBe(6);
    expect(load.weeks.map((item) => item.sets)).toEqual([6, 0, 6]);
  });
});
