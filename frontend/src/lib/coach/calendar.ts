import { useMemo } from 'react';
import { addDays, differenceInCalendarWeeks, format, parseISO } from 'date-fns';
import type { WeekSummary } from '@/types/api';
import type { CompletedWorkout } from '@/lib/workout/types';
import { useClientData, type CoachClient } from './api';
import { useCoachBlock, weekState, type WeekState } from './blocks';
import { useClientCheckins, type Checkin } from './checkins';
import { findDay, type Program, type ProgramDay } from './coachPrograms';
import { useNutritionAdherence, type AdherenceDay } from './nutritionAdherence';
import { useCoachNutritionPlan, type DayTargets } from './nutritionPlan';
import type { DayComment } from './sessions';
import { shiftWeek, useProgramWeeks, weekDate, type SavedWeek } from './weeks';

export interface CalendarDay {
  /** yyyy-MM-dd */
  date: string;
  weekStart: string;
  /** 1 = Monday. */
  dayIndex: number;
  today: boolean;
  past: boolean;
  /** What the coach planned for the day. */
  session: ProgramDay | null;
  /** What the athlete logged that day. */
  workouts: CompletedWorkout[];
  target: DayTargets | null;
  intake: AdherenceDay['intake'];
  onTarget: boolean;
  weight: number | null;
  steps: number | null;
  /** The weekly follow-up the athlete sent that day. */
  checkin: Checkin | null;
  /** What the athlete added to a follow-up that day, after sending it. */
  updates: string[];
  /** What the coach said about a day without a session. */
  comment: string | null;
}

export interface CalendarWeek {
  weekStart: string;
  state: WeekState | null;
  saved: SavedWeek | null;
  /** The library program the week falls in when nobody has prepared it by hand. */
  programName: string | null;
  days: CalendarDay[];
}

/** Everything that happens to an athlete, day by day: plan, logged sessions, food and body records. */
export function useAthleteCalendar(
  link: CoachClient,
  from: string,
  count: number,
  /** The week being edited: its draft replaces what the server last saved. */
  live?: { weekStart: string; program: Program },
) {
  const id = link.linkId;
  const { training, body, nutrition } = link.permissions;
  const block = useCoachBlock(id, from, count);
  const { find: programWeek } = useProgramWeeks(id, training);
  const since = parseISO(from).getTime();
  const workouts = useClientData<CompletedWorkout[]>(
    id,
    `workouts/recent?since=${since}`,
    training,
  );
  const weights = useClientData<WeekSummary[]>(id, 'weights/weekly', body);
  const steps = useClientData<WeekSummary[]>(id, 'steps/weekly', body);
  const current = weekDate();
  const back = differenceInCalendarWeeks(parseISO(current), parseISO(from), { weekStartsOn: 1 });
  const adherence = useNutritionAdherence(
    id,
    Math.min(12, Math.max(1, back + 1)),
    nutrition && back >= 0,
  );
  const plan = useCoachNutritionPlan(id, nutrition);
  const checkins = useClientCheckins(id);
  const comments = useClientData<DayComment[]>(
    id,
    `day-comments?from=${from}&to=${format(addDays(parseISO(from), count * 7 - 1), 'yyyy-MM-dd')}`,
    true,
  );

  const weeks = useMemo<CalendarWeek[]>(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const eaten = new Map(
      (adherence.data ?? []).flatMap((week) => week.days).map((day) => [day.date, day]),
    );
    const done = new Map<string, CompletedWorkout[]>();
    for (const workout of workouts.data ?? []) {
      const date = format(new Date(workout.startedAt), 'yyyy-MM-dd');
      done.set(date, [...(done.get(date) ?? []), workout]);
    }
    // A follow-up without a readable date belongs to no day rather than breaking the calendar.
    const local = (instant: string) => {
      const at = new Date(instant);
      return Number.isNaN(at.getTime()) ? '' : format(at, 'yyyy-MM-dd');
    };
    const sent = new Map(
      (checkins.data ?? []).map((checkin) => [local(checkin.createdAt), checkin]),
    );
    const added = new Map<string, string[]>();
    for (const checkin of checkins.data ?? [])
      for (const update of checkin.updates ?? [])
        if (update.role === 'CLIENT') {
          const date = local(update.createdAt);
          added.set(date, [...(added.get(date) ?? []), update.body]);
        }
    const said = new Map((comments.data ?? []).map((comment) => [comment.date, comment.text]));
    const summary = (list: WeekSummary[] | undefined, week: string, i: number) =>
      list?.find((item) => item.weekStart === week)?.days[i] ?? null;
    return Array.from({ length: count }, (_, n) => {
      const weekStart = shiftWeek(from, n);
      const saved = block.data?.weeks?.find((week) => week.weekStart === weekStart) ?? null;
      const covered = !saved || saved.version === 0 ? programWeek(weekStart) : null;
      const program =
        live?.weekStart === weekStart ? live.program : (covered?.program ?? saved?.content.program);
      return {
        weekStart,
        saved,
        programName: covered ? covered.assignment.programName : null,
        state: saved && !covered ? weekState(saved, current) : null,
        days: Array.from({ length: 7 }, (_, i) => {
          const date = format(addDays(parseISO(weekStart), i), 'yyyy-MM-dd');
          const session = (program && findDay(program, 1, i + 1)) ?? null;
          const food = eaten.get(date);
          return {
            date,
            weekStart,
            dayIndex: i + 1,
            today: date === today,
            past: date < today,
            session,
            workouts: done.get(date) ?? [],
            // Days ahead have no adherence yet: they show what the plan asks for that kind of day.
            target:
              food?.target ??
              (date >= today && plan.data ? (session ? plan.data.training : plan.data.rest) : null),
            intake: food?.intake ?? null,
            onTarget: food?.onTarget ?? false,
            weight: summary(weights.data, weekStart, i),
            steps: summary(steps.data, weekStart, i),
            checkin: sent.get(date) ?? null,
            updates: added.get(date) ?? [],
            comment: said.get(date) ?? null,
          };
        }),
      };
    });
  }, [
    from,
    count,
    current,
    block.data,
    programWeek,
    live?.weekStart,
    live?.program,
    workouts.data,
    weights.data,
    steps.data,
    adherence.data,
    plan.data,
    checkins.data,
    comments.data,
  ]);
  return { weeks, isLoading: block.isPending, isError: block.isError, refetch: block.refetch };
}
