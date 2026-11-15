import { useMemo } from 'react';
import { TechniqueVideoLink } from './TechniqueVideo';
import { WorkoutExerciseDetail } from './WorkoutExerciseDetail';
import { buildWorkoutRecords, beatsWorkoutRecord, workoutVariantKey } from '@/utils/workoutRecords';
import { Repeat2, Trash2 } from 'lucide-react';
import { Dialog, DialogContentFullScreen } from '@/components/ui/dialog';
import {
  completedSets,
  formatDay,
  formatDuration,
  formatKg,
  sessionVolume,
} from '@/lib/workout/format';
import { SET_TYPE_LABEL, type CompletedWorkout, type Exercise } from '@/lib/workout/types';
import { capitalizeFirst } from '@/utils/dateHelper';
import { useWorkoutComments } from '@/lib/coach/comments';
import { personName } from '@/lib/coach/api';

type Props = {
  detail: CompletedWorkout | null;
  history: CompletedWorkout[];
  catalog: Map<string, Exercise>;
  showRpe: boolean;
  setDetailId: (id: string | null) => void;
  setDeletingId: (id: string) => void;
  startFromHistory: (workout: CompletedWorkout) => void;
};

export function WorkoutHistoryDetail({
  detail,
  history,
  catalog,
  showRpe,
  setDetailId,
  setDeletingId,
  startFromHistory,
}: Props) {
  const records = useMemo(
    () => (detail ? buildWorkoutRecords(history, detail.id) : new Map<string, number>()),
    [history, detail],
  );
  return (
    <Dialog open={!!detail} onOpenChange={(o) => !o && setDetailId(null)}>
      {detail ? (
        <DialogContentFullScreen
          className="workout-detail-modal"
          style={{
            padding: '0',
            background: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: 'calc(env(safe-area-inset-top, 44px) + 1rem) 1rem 0.5rem 1rem',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 700,
                      margin: 0,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {detail.name}
                  </h2>
                </div>
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    marginTop: '0.2rem',
                  }}
                >
                  {capitalizeFirst(formatDay(detail.finishedAt))}
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '1rem',
                background: 'rgba(0,0,0,0.2)',
                padding: '0.75rem',
                borderRadius: '8px',
              }}
            >
              <Stat label="Duración" value={formatDuration(detail.finishedAt - detail.startedAt)} />
              <Stat label="Volumen" value={formatKg(sessionVolume(detail.exercises))} />
              <Stat label="Series" value={`${completedSets(detail.exercises)}`} />
            </div>

            {detail.notes ? (
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  borderLeft: '3px solid var(--accent-color)',
                }}
              >
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                    margin: 0,
                  }}
                >
                  "{detail.notes}"
                </p>
              </div>
            ) : null}
            <CoachComments workoutId={detail.id} />
          </div>

          <div
            style={{
              padding: '0.5rem 1rem 1rem 1rem',
              overflowY: 'auto',
              flex: 1,
              scrollbarWidth: 'thin',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {detail.exercises.map((ex: import('@/lib/workout/types').WorkoutExercise) => {
                const meta = catalog.get(ex.exerciseId);
                const isCardio = meta?.muscle === 'cardio';
                const best = records.get(workoutVariantKey(ex.exerciseId, ex.variant)) ?? 0;
                let normalCount = 0;
                return (
                  <WorkoutExerciseDetail
                    key={ex.id}
                    name={meta?.name ?? 'Ejercicio'}
                    imageUrl={meta?.gifUrl}
                    superset={Boolean(ex.supersetId)}
                  >
                    {ex.notes && (
                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-muted)',
                          marginBottom: '1rem',
                          fontStyle: 'italic',
                        }}
                      >
                        {ex.notes}
                      </p>
                    )}

                    <TechniqueVideoLink exercise={ex} />
                    <table className="detail-set-table">
                      <thead>
                        <tr>
                          <th>Serie</th>
                          <th>{isCardio ? 'Km' : 'Kg'}</th>
                          <th>{isCardio ? 'Tiempo' : 'Reps'}</th>
                          {showRpe && <th>Esfuerzo</th>}
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {ex.sets.map((s: import('@/lib/workout/types').WorkoutSet) => {
                          const setLabel = SET_TYPE_LABEL[s.type] || normalCount + 1;
                          if (s.type === 'normal') normalCount++;
                          return (
                            <tr
                              key={s.id}
                              style={{
                                opacity: s.completed ? 1 : 0.4,
                                transition: 'opacity 0.2s',
                              }}
                            >
                              <td>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    width: '24px',
                                    height: '24px',
                                    lineHeight: '24px',
                                    borderRadius: '6px',
                                    background: 'rgba(255,255,255,0.05)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                  }}
                                >
                                  {setLabel}
                                </span>
                              </td>
                              <td className="bold-val">
                                {isCardio ? s.distance || '' : s.weight || ''}
                              </td>
                              <td className="bold-val">
                                {isCardio ? s.duration || '' : s.reps || ''}
                              </td>
                              {showRpe && (
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                  {s.rir != null && s.rir !== ''
                                    ? `RIR ${s.rir}`
                                    : s.rpe
                                      ? `RPE ${s.rpe}`
                                      : ''}
                                </td>
                              )}
                              <td>
                                {s.completed && beatsWorkoutRecord(s.weight, best) ? (
                                  <span className="text-[0.65rem] font-bold text-[var(--accent-primary-light)] bg-[var(--accent-glow)] border border-[var(--accent-primary)]/30 px-1.5 py-0.5 rounded-full">
                                    PR
                                  </span>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </WorkoutExerciseDetail>
                );
              })}
            </div>

            <button
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                marginTop: '2rem',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '12px',
              }}
              onClick={() => startFromHistory(detail)}
            >
              <Repeat2 size={20} />
              Repetir Entrenamiento
            </button>

            <button
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                marginTop: '0.75rem',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '12px',
              }}
              onClick={() => setDetailId(null)}
            >
              Cerrar
            </button>

            <button
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                marginTop: '0.75rem',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '12px',
                color: 'var(--color-danger)',
              }}
              onClick={() => {
                setDeletingId(detail.id);
              }}
            >
              <Trash2 size={20} />
              Borrar Entrenamiento
            </button>
          </div>
        </DialogContentFullScreen>
      ) : null}
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
        }}
      >
        {label}
      </p>
      <p
        style={{
          marginTop: '0.15rem',
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}
      >
        {value}
      </p>
    </div>
  );
}

/** What the coach said about a workout done from their program. */
function CoachComments({ workoutId }: { workoutId: string }) {
  const comments = useWorkoutComments(workoutId);
  if (!comments.data?.length) return null;
  return (
    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {comments.data.map((c) => (
        <div
          key={c.coach.email}
          style={{
            padding: '0.75rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '8px',
            borderLeft: '3px solid var(--success, #22c55e)',
          }}
        >
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
            Comentario de {personName(c.coach)}
          </p>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {c.text}
          </p>
        </div>
      ))}
    </div>
  );
}
