import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { SegmentedControl } from '../ui/segmented-control';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { type CoachClient } from '@/lib/coach/api';
import type { AvoidedExercise } from '@/lib/coach/setup';
import { useClientAssignments } from '@/lib/coach/coachPrograms';
import { overlapsWeek, shiftWeek, useCoachWeek, weekDate } from '@/lib/coach/weeks';
import { useAthleteLinks } from './AthleteShell';
import { SectionSkeleton } from './SectionSkeleton';
import { WeekReview } from './WeekReview';
import { WeekEditor } from './WeekEditor';
import { BlockView } from './BlockView';
import { AthleteAvoided, AthleteEffort } from './editor/prescribing';

const NONE: AvoidedExercise[] = [];

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
  const assignments = useClientAssignments(link.linkId);
  const draft = useCoachWeek(link.linkId, planningWeek);
  const previous = assignments.data?.find((a) => overlapsWeek(a, shiftWeek(planningWeek, -1)));
  const preparing = view === 'prepare';
  const week = preparing ? planningWeek : reviewWeek;
  const setWeek = preparing ? setPlanningWeek : setReviewWeek;
  const min = preparing ? weekDate() : undefined;
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
    !assignments.isError &&
    !draft.isError;
  const toolbar = (
    <div className="week-toolbar">
      <SegmentedControl
        value={view}
        onChange={setView}
        options={[
          { value: 'prepare', label: 'Preparar' },
          { value: 'block', label: 'Bloque' },
          { value: 'review', label: 'Revisar lo hecho' },
        ]}
      />
      <div className="week-toolbar-picker" hidden={view === 'block'}>
        <button
          type="button"
          className="btn btn-secondary"
          aria-label="Semana anterior"
          disabled={!!min && week <= min}
          onClick={() => setWeek(shiftWeek(week, -1))}
        >
          <ArrowLeft size={16} aria-hidden />
        </button>
        <label hidden={preparing} className="flex flex-col gap-1 min-w-0">
          Semana que revisas
          <input
            className="form-input min-h-11"
            type="date"
            value={reviewWeek}
            onChange={(e) => {
              if (e.target.value) setReviewWeek(weekDate(new Date(`${e.target.value}T12:00:00`)));
            }}
          />
        </label>
        <label hidden={!preparing} className="flex flex-col gap-1 min-w-0">
          Semana que preparas
          <input
            className="form-input min-h-11"
            type="date"
            value={planningWeek}
            min={weekDate()}
            max={shiftWeek(weekDate(), 52)}
            onChange={(e) => {
              if (e.target.value) setPlanningWeek(weekDate(new Date(`${e.target.value}T12:00:00`)));
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
      {assignments.isPending || draft.isPending ? (
        <SectionSkeleton label="Cargando semana…" />
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
            <WeekReview linkId={link.linkId} week={reviewWeek} assignments={assignments.data} />
          </div>
          <div hidden={view !== 'prepare'}>
            <AthleteEffort.Provider value={link.setup?.effortMethod ?? null}>
              <AthleteAvoided.Provider value={link.notes?.avoidedExercises ?? NONE}>
                <WeekEditor
                  key={`${link.linkId}:${planningWeek}`}
                  saved={draft.data}
                  source={previous}
                  canEdit={link.permissions.editTraining}
                  reload={() => draft.refetch()}
                  lead={toolbar}
                />
              </AthleteAvoided.Provider>
            </AthleteEffort.Provider>
          </div>
        </div>
      )}
    </div>
  );
}
