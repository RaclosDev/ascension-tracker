import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { SegmentedControl } from '../ui/segmented-control';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { type CoachClient } from '@/lib/coach/api';
import { useClientAssignments } from '@/lib/coach/coachPrograms';
import { overlapsWeek, shiftWeek, useCoachWeek, weekDate } from '@/lib/coach/weeks';
import { useAthleteLinks } from './AthleteShell';
import { WeekReview } from './WeekReview';
import { WeekEditor } from './WeekEditor';

export default function ClientWeek({ link }: { link: CoachClient }) {
  const [view, setView] = useState('prepare');
  const [params] = useSearchParams();
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
  return (
    <div className="coach-planning-workspace flex flex-col gap-4">
      <div className="week-toolbar">
        <SegmentedControl
          value={view}
          onChange={setView}
          options={[
            { value: 'prepare', label: 'Preparar semana' },
            { value: 'review', label: 'Revisar semana anterior' },
          ]}
        />
        <div className="week-toolbar-picker">
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
                if (e.target.value)
                  setPlanningWeek(weekDate(new Date(`${e.target.value}T12:00:00`)));
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
        <Link className="week-toolbar-link" to={recordHref('registro')}>
          Ver lo que registró el atleta →
        </Link>
      </div>
      {assignments.isPending || draft.isPending ? (
        <p role="status">Cargando semana…</p>
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
            <WeekEditor
              key={`${link.linkId}:${planningWeek}`}
              saved={draft.data}
              source={previous}
              canEdit={link.permissions.editTraining}
              reload={() => draft.refetch()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
