import { Repeat2, Trash2, Dumbbell } from 'lucide-react';
import { Dialog, DialogContentFullScreen } from '@/components/ui/dialog';
import {
  completedSets,
  formatDay,
  formatDuration,
  formatKg,
  isPrSet,
  sessionVolume,
} from '@/lib/workout/format';
import { SET_TYPE_LABEL, type CompletedWorkout, type Exercise } from '@/lib/workout/types';
import { capitalizeFirst } from '@/utils/dateHelper';

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
                return (
                  <div
                    key={ex.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: '12px',
                      padding: '1rem',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '1rem',
                      }}
                    >
                      {meta?.gifUrl ? (
                        <img
                          src={meta.gifUrl}
                          alt=""
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            background: 'var(--bg-primary)',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: 'var(--bg-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Dumbbell size={18} style={{ color: 'var(--text-secondary)' }} />
                        </div>
                      )}
                      <div>
                        {ex.supersetId && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '0.1rem 0.3rem',
                              borderRadius: '4px',
                              background: 'rgba(168, 85, 247, 0.15)',
                              color: '#c084fc',
                              marginRight: '0.4rem',
                              display: 'inline-block',
                              marginBottom: '0.2rem',
                            }}
                          >
                            Superserie
                          </span>
                        )}
                        <h3
                          style={{
                            color: 'var(--text-primary)',
                            margin: 0,
                            fontSize: '1rem',
                            fontWeight: 600,
                            lineHeight: 1.2,
                          }}
                        >
                          {meta?.name ?? 'Ejercicio'}
                        </h3>
                      </div>
                    </div>

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

                    <table className="detail-set-table">
                      <thead>
                        <tr>
                          <th>Serie</th>
                          <th>{isCardio ? 'Km' : 'Kg'}</th>
                          <th>{isCardio ? 'Tiempo' : 'Reps'}</th>
                          {showRpe && <th>RPE</th>}
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {ex.sets.map((s: import('@/lib/workout/types').WorkoutSet, i: number) => {
                          let normalCount = 0;
                          for (let j = 0; j < i; j++) {
                            if (ex.sets[j].type === 'normal') normalCount++;
                          }
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
                                  {SET_TYPE_LABEL[s.type as keyof typeof SET_TYPE_LABEL] ||
                                    normalCount + 1}
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
                                  {s.rpe || ''}
                                </td>
                              )}
                              <td>
                                {s.completed &&
                                isPrSet(ex.exerciseId, ex.variant, s.weight, history, detail.id) ? (
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
                  </div>
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
