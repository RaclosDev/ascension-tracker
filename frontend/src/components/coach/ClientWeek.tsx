import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { type CoachClient } from '@/lib/coach/api';
import { useClientAssignments } from '@/lib/coach/coachPrograms';
import { overlapsWeek, shiftWeek, useCoachWeek, weekDate } from '@/lib/coach/weeks';
import { WeekReview } from './WeekReview';
import { WeekEditor } from './WeekEditor';

export default function ClientWeek({ link }: { link: CoachClient }) {
  const [params] = useSearchParams();
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
  return (
    <div className="flex flex-col gap-4">
      <div className="card flex flex-wrap gap-4 items-end">
        <label className="flex flex-col gap-1 min-w-0">
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
        <label className="flex flex-col gap-1 min-w-0">
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
        <div className="grid gap-4 items-start xl:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.2fr)]">
          <WeekReview linkId={link.linkId} week={reviewWeek} assignments={assignments.data} />
          <WeekEditor
            key={`${link.linkId}:${planningWeek}`}
            saved={draft.data}
            source={previous}
            canEdit={link.permissions.editTraining}
            reload={() => draft.refetch()}
          />
        </div>
      )}
    </div>
  );
}
