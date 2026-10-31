import React from 'react';
import { Repeat2, Trash2, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { BodyHeatmap } from './body-heatmap';
import {
  completedSets,
  formatDay,
  formatDuration,
  formatKg,
  sessionVolume,
  formatVariant,
} from '@/lib/workout/format';
import { capitalizeFirst } from '@/utils/dateHelper';

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
  const names = w.exercises.map((e: import('@/lib/workout/types').WorkoutExercise) => {
    const base = catalog.get(e.exerciseId)?.name ?? 'Ejercicio';
    const v = formatVariant(e.variant);
    return v ? `${base} ${v}` : base;
  });

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
          <h2
            style={{
              fontSize: '1.15rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {w.name}
          </h2>
          <p
            style={{
              marginTop: '0.15rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}
          >
            {capitalizeFirst(formatDay(w.finishedAt))}
          </p>

          <div
            style={{
              marginTop: '0.75rem',
              display: 'flex',
              gap: '1rem',
              background: 'rgba(255,255,255,0.02)',
              padding: '0.5rem',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Volumen
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {formatKg(sessionVolume(w.exercises))}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Series
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {completedSets(w.exercises)}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Tiempo
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {formatDuration(w.finishedAt - w.startedAt)}
              </span>
            </div>
          </div>

          <p
            style={{
              marginTop: '0.75rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {names.join(' · ')}
          </p>
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
