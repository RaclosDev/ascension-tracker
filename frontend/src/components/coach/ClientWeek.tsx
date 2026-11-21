import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { SegmentedControl } from '../ui/segmented-control';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { type CoachClient } from '@/lib/coach/api';
import type { AvoidedExercise } from '@/lib/coach/setup';
import { useAssignedProgram, useClientAssignments } from '@/lib/coach/coachPrograms';
import {
  overlapsWeek,
  programPosition,
  shiftWeek,
  useCoachWeek,
  weekDate,
  weekFrom,
  type SavedWeek,
} from '@/lib/coach/weeks';
import { useAthleteLinks } from './AthleteShell';
import { useAthleteCalendar } from '@/lib/coach/calendar';
import { AthleteCalendar } from './calendar/AthleteCalendar';
import { WeekReview } from './WeekReview';
import { WeekEditor } from './WeekEditor';
import { BlockView } from './BlockView';
import { AthleteAvoided, AthleteEffort } from './editor/prescribing';
import { DatePicker } from '@/components/ui/date-picker';

const NONE: AvoidedExercise[] = [];

/** The calendar keeps its place while the plan of the week that was just opened arrives. */
function PendingCalendar({
  link,
  from,
  focus,
  onSelect,
}: {
  link: CoachClient;
  from: string;
  focus: string;
  onSelect: (week: string, day: number | null) => void;
}) {
  const calendar = useAthleteCalendar(link, from, 4);
  return (
    <div className="cal-body">
      <p role="status" className="sr-only">
        Cargando semana…
      </p>
      <AthleteCalendar
        weeks={calendar.weeks}
        focus={focus}
        selected={null}
        loading
        onSelect={onSelect}
      />
    </div>
  );
}

/** Today when the week is the current one; otherwise its first session, or Monday. */
function openingDay(week: SavedWeek) {
  if (week.weekStart === weekDate()) return ((new Date().getDay() + 6) % 7) + 1;
  return Math.min(8, ...week.content.program.days.map((d) => d.dayIndex)) % 8 || 1;
}

export default function ClientWeek({ link }: { link: CoachClient }) {
  const [params, setParams] = useSearchParams();
  const vista = params.get('vista');
  const view = vista === 'revision' ? 'review' : vista === 'bloque' ? 'block' : 'prepare';
  const setView = (next: string, replace = true) =>
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        if (next === 'review') updated.set('vista', 'revision');
        else if (next === 'block') updated.set('vista', 'bloque');
        else updated.delete('vista');
        return updated;
      },
      { replace },
    );
  const { recordHref } = useAthleteLinks(link.linkId);
  const requested = params.get('semana');
  const selected =
    requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) && !Number.isNaN(Date.parse(requested))
      ? weekDate(new Date(`${requested}T12:00:00`))
      : null;
  const [reviewWeek, setReviewWeek] = useState(() =>
    selected ? shiftWeek(selected, -1) : weekDate(),
  );
  const [planningWeek, setPlanningWeek] = useState(() =>
    selected && selected >= weekDate() && selected <= shiftWeek(weekDate(), 52)
      ? selected
      : shiftWeek(weekDate(), 1),
  );
  // Four weeks on screen: the one before the open week, to see where the athlete comes from.
  const [from, setFrom] = useState(() => shiftWeek(planningWeek, -1));
  if (planningWeek < from) setFrom(planningWeek);
  else if (planningWeek > shiftWeek(from, 3)) setFrom(shiftWeek(planningWeek, -3));
  // Undefined until the coach picks or closes a day: the calendar opens on the most useful one.
  const [day, setDay] = useState<number | null>();
  // On a wide screen the open day takes the room and the calendar folds into a strip of days;
  // the coach can go back to the calendar, and it survives changing day or week.
  const [wide, setWide] = useState(
    () => window.matchMedia?.('(min-width: 1100px)').matches ?? false,
  );
  const pick = (week: string, next: number | null) => {
    if (week > shiftWeek(weekDate(), 52)) return;
    setPlanningWeek(week);
    setDay(week === planningWeek || next ? next : undefined);
  };
  const assignments = useClientAssignments(link.linkId);
  const draft = useCoachWeek(link.linkId, planningWeek);
  const previous = assignments.data?.find((a) => overlapsWeek(a, shiftWeek(planningWeek, -1)));
  // A week never prepared by hand opens with what the running program already has for it.
  const covering = assignments.data?.find(
    (a) => a.status !== 'ENDED' && a.weeks > 1 && overlapsWeek(a, planningWeek),
  );
  const coveringAt = covering && programPosition(assignments.data ?? [], covering, planningWeek);
  // Publishing replaces only this week; the program picks up again the next Monday.
  const programGoesOn =
    covering && coveringAt && coveringAt.week < coveringAt.weeks ? covering.programName : undefined;
  const fromProgram = draft.data?.version === 0 ? covering : undefined;
  const programPlan = useAssignedProgram(link.linkId, fromProgram?.id ?? '');
  const programWeek =
    fromProgram && programPlan.data
      ? {
          name: fromProgram.programName,
          ...programPosition(assignments.data ?? [], fromProgram, planningWeek),
        }
      : undefined;
  const saved: SavedWeek | undefined =
    draft.data && programWeek && programPlan.data && fromProgram
      ? {
          ...draft.data,
          content: {
            ...draft.data.content,
            program: weekFrom(programPlan.data, fromProgram, planningWeek),
          },
        }
      : draft.data;
  const preparing = view === 'prepare';
  const week = preparing ? planningWeek : reviewWeek;
  const setWeek = preparing
    ? (next: string) => {
        setPlanningWeek(next);
        setDay(undefined);
      }
    : setReviewWeek;
  const max = preparing ? shiftWeek(weekDate(), 52) : undefined;
  const openWeek = (target: string) => {
    if (target < weekDate()) {
      setReviewWeek(target);
      setView('review', false);
    } else {
      setPlanningWeek(target);
      setView('prepare', false);
    }
  };
  const ready =
    preparing &&
    !assignments.isPending &&
    !draft.isPending &&
    !(fromProgram && programPlan.isPending) &&
    !assignments.isError &&
    !draft.isError;
  const toolbar = (
    <div className="week-toolbar">
      <SegmentedControl
        value={view}
        onChange={setView}
        options={[
          { value: 'prepare', label: 'Calendario' },
          { value: 'block', label: 'Bloque' },
          { value: 'review', label: 'Revisar lo hecho' },
        ]}
      />
      <div className="week-toolbar-picker" hidden={view === 'block'}>
        <button
          type="button"
          className="btn btn-secondary"
          aria-label="Semana anterior"
          onClick={() => setWeek(shiftWeek(week, -1))}
        >
          <ArrowLeft size={16} aria-hidden />
        </button>
        <label hidden={preparing} className="flex flex-col gap-1 min-w-0">
          Semana que revisas
          <DatePicker
            className="form-input min-h-11"
            value={reviewWeek}
            required
            onChange={(value) => {
              if (value) setReviewWeek(weekDate(new Date(`${value}T12:00:00`)));
            }}
          />
        </label>
        <label hidden={!preparing} className="flex flex-col gap-1 min-w-0">
          Semana abierta
          <DatePicker
            className="form-input min-h-11"
            value={planningWeek}
            max={shiftWeek(weekDate(), 52)}
            required
            onChange={(value) => {
              if (value) setWeek(weekDate(new Date(`${value}T12:00:00`)));
            }}
          />
        </label>
        <button
          type="button"
          className="btn btn-secondary"
          aria-label="Semana siguiente"
          disabled={!!max && week >= max}
          onClick={() => setWeek(shiftWeek(week, 1))}
        >
          <ArrowRight size={16} aria-hidden />
        </button>
        {week !== weekDate() && (
          <button type="button" className="btn btn-secondary" onClick={() => setWeek(weekDate())}>
            Hoy
          </button>
        )}
      </div>
      {view === 'review' && (
        <Link className="week-toolbar-link" to={recordHref('registro')}>
          Ver lo que registró el atleta →
        </Link>
      )}
    </div>
  );
  if (view === 'block')
    return (
      <div className="coach-planning-workspace flex flex-col gap-4">
        <AthleteEffort.Provider value={link.setup?.effortMethod ?? null}>
          <BlockView link={link} lead={toolbar} onOpenWeek={openWeek} />
        </AthleteEffort.Provider>
      </div>
    );
  return (
    <div className="coach-planning-workspace flex flex-col gap-4">
      {!ready && toolbar}
      {assignments.isPending || draft.isPending || (fromProgram && programPlan.isPending) ? (
        <PendingCalendar link={link} from={from} focus={planningWeek} onSelect={pick} />
      ) : assignments.isError || draft.isError ? (
        <p role="alert">
          No se pudo cargar la planificación.{' '}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              void assignments.refetch();
              void draft.refetch();
            }}
          >
            Reintentar
          </button>
        </p>
      ) : (
        <div className="min-w-0">
          <div hidden={view !== 'review'}>
            <WeekReview link={link} week={reviewWeek} assignments={assignments.data} />
          </div>
          <div hidden={view !== 'prepare'}>
            <AthleteEffort.Provider value={link.setup?.effortMethod ?? null}>
              <AthleteAvoided.Provider value={link.notes?.avoidedExercises ?? NONE}>
                <WeekEditor
                  key={`${link.linkId}:${planningWeek}`}
                  saved={saved!}
                  source={previous}
                  programWeek={programWeek}
                  programGoesOn={programGoesOn}
                  canEdit={link.permissions.editTraining && planningWeek >= weekDate()}
                  reload={() => draft.refetch()}
                  lead={toolbar}
                  link={link}
                  from={from}
                  day={day === undefined ? openingDay(saved!) : day}
                  onSelect={pick}
                  wide={wide}
                  onWide={setWide}
                />
              </AthleteAvoided.Provider>
            </AthleteEffort.Provider>
          </div>
        </div>
      )}
    </div>
  );
}
