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
      <article className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex' }}>
        <button
          type="button"
          onClick={handleSetDetail}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '1rem',
            textAlign: 'left',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
          }}
        >
          <WorkoutSessionSummary workout={w} catalog={catalog} />
        </button>

        <div
          style={{
            width: '130px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem 0.25rem',
            gap: '0.5rem',
          }}
        >
          <div style={{ width: '100%', opacity: 0.8 }}>
            <BodyHeatmap history={[w]} customExercises={customExercises} hideTitle />
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.35rem',
              flexWrap: 'nowrap',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={handleEdit}
              className="btn btn-secondary"
              style={{
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
              }}
              aria-label="Editar entrenamiento"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={handleStart}
              className="btn btn-secondary"
              style={{
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
              }}
              aria-label="Repetir entrenamiento"
            >
              <Repeat2 size={16} />
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-secondary"
              style={{
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                color: 'var(--color-danger)',
              }}
              aria-label="Borrar entrenamiento"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </article>
    </li>
  );
});
