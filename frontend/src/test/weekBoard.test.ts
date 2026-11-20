import { describe, expect, it } from 'vitest';
import {
  MAX_EXERCISES_PER_DAY,
  type Program,
  type ProgramExercise,
} from '@/lib/coach/coachPrograms';
import { sendDay, sendExercise, weekText, weekVolume } from '@/lib/coach/weekBoard';

const exercise = (exerciseId: string, sets = 3): ProgramExercise => ({
  exerciseId,
  exerciseName: exerciseId,
  sets,
  repsMin: 8,
  repsMax: 10,
  targetRpe: null,
  targetRir: 2,
  restSeconds: 120,
  loadHint: null,
  supersetGroup: null,
  notes: null,
  prescription: { load: { mode: 'KG', amount: 50, unit: 'TOTAL' } } as never,
});

const week = (...days: [number, string, ProgramExercise[]][]): Program => ({
  id: null,
  name: 'Semana',
  notes: null,
  weeks: 1,
  days: days.map(([dayIndex, name, exercises]) => ({
    week: 1,
    dayIndex,
    name,
    notes: null,
    exercises,
  })),
});

const names = (program: Program, dayIndex: number) =>
  program.days.find((day) => day.dayIndex === dayIndex)?.exercises.map((e) => e.exerciseId);

describe('weekBoard', () => {
  const base = week(
    [1, 'Torso', [exercise('press'), exercise('remo')]],
    [3, 'Pierna', [exercise('sentadilla')]],
  );

  it('copies a day onto a rest day and keeps the original', () => {
    const next = sendDay(base, 1, 5, false, 'replace')!;
    expect(names(next, 5)).toEqual(['press', 'remo']);
    expect(names(next, 1)).toEqual(['press', 'remo']);
    expect(next.days.map((day) => day.dayIndex)).toEqual([1, 3, 5]);
  });

  it('moves a day replacing or merging with the session already there', () => {
    const replaced = sendDay(base, 1, 3, true, 'replace')!;
    expect(replaced.days.map((day) => day.dayIndex)).toEqual([3]);
    expect(names(replaced, 3)).toEqual(['press', 'remo']);
    const merged = sendDay(base, 1, 3, false, 'merge')!;
    expect(names(merged, 3)).toEqual(['sentadilla', 'press', 'remo']);
    expect(merged.days.find((day) => day.dayIndex === 3)?.name).toBe('Pierna');
  });

  it('refuses a merge that would not fit in one day', () => {
    const full = week(
      [1, 'A', [exercise('press')]],
      [2, 'B', Array.from({ length: MAX_EXERCISES_PER_DAY }, (_, i) => exercise(`e${i}`))],
    );
    expect(sendDay(full, 1, 2, false, 'merge')).toBeNull();
    expect(sendExercise(full, 1, 0, 2, false)).toBeNull();
    expect(sendExercise(full, 2, 0, 2, false)).toBeNull();
  });

  it('sends one exercise to another day, creating the session when it was a rest day', () => {
    const moved = sendExercise(base, 1, 0, 4, true)!;
    expect(names(moved, 1)).toEqual(['remo']);
    expect(names(moved, 4)).toEqual(['press']);
    const copied = sendExercise(base, 1, 1, 3, false, 0)!;
    expect(names(copied, 3)).toEqual(['remo', 'sentadilla']);
    expect(names(copied, 1)).toEqual(['press', 'remo']);
  });

  it('reorders or duplicates inside the same day', () => {
    expect(names(sendExercise(base, 1, 0, 1, true, 1)!, 1)).toEqual(['remo', 'press']);
    expect(names(sendExercise(base, 1, 0, 1, false)!, 1)).toEqual(['press', 'press', 'remo']);
    expect(sendExercise(base, 1, 9, 2, true)).toBe(base);
  });

  it('counts work sets per muscle group and flags a jump over last week', () => {
    const muscleOf = (id: string) => (id === 'sentadilla' ? undefined : ('chest' as never));
    const last = week([1, 'Torso', [exercise('press', 4)]]);
    const volume = weekVolume(base, last, muscleOf);
    expect(volume.sets).toBe(9);
    expect(volume.tonnage).toBe(9 * 8 * 50);
    expect(volume.tonnageBefore).toBe(4 * 8 * 50);
    expect(volume.groups[0]).toMatchObject({ sets: 6, before: 4, jump: true });
    expect(volume.groups[1]).toMatchObject({
      id: 'other',
      label: 'Otros',
      sets: 3,
      before: 0,
      jump: false,
    });
    expect(weekVolume(base, null, muscleOf).groups[0].before).toBeNull();
  });

  it('writes the week as text', () => {
    const text = weekText(base, '2026-11-23');
    expect(text).toContain('Semana · semana del 23/11/2026');
    expect(text).toContain('Lunes 23/11 · Torso');
    expect(text).toContain('Miércoles 25/11 · Pierna');
    expect(text).toMatch(/1\. press: .+ · descanso /);
  });
});
