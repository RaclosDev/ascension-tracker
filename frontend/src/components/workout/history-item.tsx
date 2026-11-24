import React from 'react';
import { Repeat2, Trash2, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { BodyHeatmap } from './body-heatmap';
import { WorkoutSessionSummary } from './WorkoutSessionSummary';

export const HistoryItem = React.memo(function HistoryItem({
  w,
  catalog,
  customExercises,
  setDetailId,
  editWorkout,
  startFromHistory,
  deleteHistory,
  active,
}: {
  w: import('@/lib/workout/types').CompletedWorkout;
  catalog: Map<string, import('@/lib/workout/types').Exercise>;
  customExercises: import('@/lib/workout/types').Exercise[];
  setDetailId: (id: string | null) => void;
  editWorkout: (w: import('@/lib/workout/types').CompletedWorkout) => void;
  startFromHistory: (w: import('@/lib/workout/types').CompletedWorkout) => void;
  deleteHistory: (id: string) => void;
  active: import('@/lib/workout/types').ActiveWorkout | null;
}) {
  const handleSetDetail = React.useCallback(() => setDetailId(w.id), [setDetailId, w.id]);
  const handleEdit = React.useCallback(() => {
    if (active) {
      toast.error('Termina el entreno actual primero');
      return;
    }
    editWorkout(w);
  }, [active, editWorkout, w]);
  const handleStart = React.useCallback(() => startFromHistory(w), [startFromHistory, w]);
  const handleDelete = React.useCallback(() => deleteHistory(w.id), [deleteHistory, w.id]);

  return (
    <li>
      <article className="card wk-session">
        <div className="wk-session-body">
          <button type="button" className="wk-session-main" onClick={handleSetDetail}>
            <WorkoutSessionSummary workout={w} catalog={catalog} />
          </button>
          <div className="wk-session-map" aria-hidden="true">
            <BodyHeatmap history={[w]} customExercises={customExercises} hideTitle />
          </div>
        </div>
        <div className="wk-session-actions">
          <button
            type="button"
            onClick={handleStart}
            className="wk-link"
            aria-label="Repetir entrenamiento"
          >
            <Repeat2 size={16} aria-hidden="true" /> Repetir
          </button>
          <span>
            <button
              type="button"
              onClick={handleEdit}
              className="icon-btn"
              title="Editar"
              aria-label="Editar entrenamiento"
            >
              <Edit3 size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="icon-btn wk-session-delete"
              title="Borrar"
              aria-label="Borrar entrenamiento"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </span>
        </div>
      </article>
    </li>
  );
});
