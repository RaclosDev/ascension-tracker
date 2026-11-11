import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import type { ProgramExercise } from './coachPrograms';
import type { PrescribedDay } from '../workout/store';
import { loadText, resolvedWeight, setText } from './prescription';

/** Mirrors the backend ProgramDtos.TodayDay: the prescribed day, with its id for linking the workout. */
export interface TodayDay {
  id: string;
  week: number;
  dayIndex: number;
  name: string;
  notes: string | null;
  exercises: ProgramExercise[];
}

/** One active program on a date, as the client sees it. */
export interface TodayPlan {
  assignmentId: string;
  programId: string;
  programName: string;
  programNotes?: string | null;
  coachName: string | null;
  startDate: string;
  weeks: number;
  phase: 'UPCOMING' | 'ACTIVE' | 'FINISHED';
  week: number | null;
  dayIndex: number | null;
  day: TodayDay | null;
  completedWorkoutId: string | null;
  /** This week's other days not done yet, so a session can be moved to today. */
  otherDays: TodayDay[];
}

/** The device's calendar day: the server's may differ near midnight. */
export function localIsoDate(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const todayKey = (date: string) => ['coaching', 'today', date] as const;

export function useTodayPlans() {
  const date = localIsoDate();
  return useQuery({
    queryKey: todayKey(date),
    queryFn: async () => (await api.get<TodayPlan[]>('/coaching/today', { params: { date } })).data,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLeaveProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      await api.post(`/coaching/programs/${assignmentId}/end`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coaching', 'today'] }),
  });
}

const restLabel = (seconds: number) =>
  seconds >= 60
    ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
    : `${seconds} s`;

/** The coach's targets for one exercise, in one line: "6–8 reps · RPE 8 · descanso 2:00". */
export function prescriptionText(e: ProgramExercise): string {
  if (e.prescription?.sets?.length)
    return e.prescription.sets.map((s, i) => `${i + 1}: ${setText(s, e)}`).join(' / ');
  const parts: string[] = [];
  if (e.repsMin != null && e.repsMax != null && e.repsMin !== e.repsMax) {
    parts.push(`${e.repsMin}–${e.repsMax} reps`);
  } else if (e.repsMin != null || e.repsMax != null) {
    parts.push(`${e.repsMin ?? e.repsMax} reps`);
  }
  if (e.targetRpe != null) parts.push(`RPE ${e.targetRpe}`);
  if (e.targetRir != null) parts.push(`RIR ${e.targetRir}`);
  if (e.restSeconds != null) parts.push(`descanso ${restLabel(e.restSeconds)}`);
  if (e.prescription?.load) parts.push(loadText(e.prescription.load));
  else if (e.loadHint) parts.push(e.loadHint);
  if (e.notes) parts.push(e.notes);
  return parts.join(' · ');
}

/** What the workout store needs to start the day: targets go to each exercise's notes. */
export function toPrescribedDay(day: TodayDay): PrescribedDay {
  return {
    id: day.id,
    name: day.name,
    exercises: day.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      variant:
        e.variantGrip || e.variantMachine
          ? { grip: e.variantGrip ?? undefined, machine: e.variantMachine ?? undefined }
          : undefined,
      sets: e.sets,
      reps: e.repsMin ?? e.repsMax,
      targets: Array.from({ length: e.sets }, (_, i) => {
        const target = e.prescription?.sets?.[i];
        return {
          weight: resolvedWeight(target?.load ?? e.prescription?.load),
          reps: target?.reps ?? e.repsMin ?? e.repsMax,
          type: target?.kind === 'WARMUP' ? ('warmup' as const) : ('normal' as const),
        };
      }),
      notes: prescriptionText(e),
    })),
  };
}
