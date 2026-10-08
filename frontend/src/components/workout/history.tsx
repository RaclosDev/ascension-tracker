import { Repeat2, Trash2, Edit3, Dumbbell } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContentFullScreen } from '@/components/ui/dialog';
import {} from '@/components/ui/alert-dialog';
import { BodyHeatmap } from '@/components/workout/body-heatmap';
import toast from 'react-hot-toast';
import { EmptyCard } from '@/components/workout/dashboard';
import { getExerciseMap } from '@/lib/workout/exercises';
import {
  completedSets,
  formatDay,
  formatDuration,
  formatKg,
  isPrSet,
  sessionVolume,
  formatVariant,
} from '@/lib/workout/format';
import { useWorkoutStore } from '@/lib/workout/store';
import { SET_TYPE_LABEL } from '@/lib/workout/types';

import { useWorkoutHistory, useDeleteWorkout, useCustomExercises } from '@/lib/workout/api';

export function HistoryView() {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useWorkoutHistory();
  const history = data?.pages.flatMap((page) => page.content) ?? [];
  const { data: customExercises = [] } = useCustomExercises();
  const deleteWorkout = useDeleteWorkout();

  const startFromHistory = useWorkoutStore((s) => s.startFromHistory);
  const editWorkout = useWorkoutStore((s) => s.editWorkout);
  const active = useWorkoutStore((s) => s.active);
  const deleteHistory = (id: string) => deleteWorkout.mutate(id);
  const detailId = useWorkoutStore((s) => s.detailId);
  const setDetailId = useWorkoutStore((s) => s.setDetailId);
  const settings = useWorkoutStore((s) => s.settings);
  const showRpe = settings?.showRpe ?? false;
  const customGifs = useWorkoutStore((s) => s.exerciseGifs);
  const catalog = getExerciseMap(customExercises);
  const detail = history.find((w: any) => w.id === detailId) ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {isLoading ? (
        <ul
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: 0,
            margin: 0,
            listStyle: 'none',
          }}
        >
          {[1, 2, 3].map((i) => (
            <li key={i}>
              <article className="card" style={{ padding: '1rem', overflow: 'hidden' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div
                  style={{
                    marginTop: '1rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                  }}
                >
                  <Skeleton className="h-12 w-full rounded-md" />
                  <Skeleton className="h-12 w-full rounded-md" />
                  <Skeleton className="h-12 w-full rounded-md" />
                </div>
                <div className="mt-4 flex gap-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : history.length === 0 ? (
        <EmptyCard
          title="El diario está vacío"
          body="Las sesiones terminadas aparecen aquí, con volumen y cada serie."
        />
      ) : (
        <ul
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: 0,
            margin: 0,
            listStyle: 'none',
          }}
        >
          {history.map((w: any) => {
            const names = w.exercises.map((e: any) => {
              const base = catalog.get(e.exerciseId)?.name ?? 'Ejercicio';
              const v = formatVariant(e.variant);
              return v ? `${base} ${v}` : base;
            });
            return (
              <li key={w.id}>
                <article
                  className="card"
                  style={{ padding: 0, overflow: 'hidden', display: 'flex' }}
                >
                  <button
                    type="button"
                    onClick={() => setDetailId(w.id)}
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
                        textTransform: 'capitalize',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {formatDay(w.finishedAt)}
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
                            fontSize: '0.7rem',
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
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
                            fontSize: '0.7rem',
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
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
                            fontSize: '0.7rem',
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
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
                      width: '125px',
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
                        gap: '0.25rem',
                        flexWrap: 'nowrap',
                        justifyContent: 'center',
                      }}
                    >
                      <button
                        onClick={() => {
                          if (active) {
                            toast.error('Termina el entreno actual primero');
                            return;
                          }
                          editWorkout(w);
                        }}
                        className="btn btn-secondary"
                        style={{
                          padding: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '32px',
                        }}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => startFromHistory(w)}
                        className="btn btn-secondary"
                        style={{
                          padding: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '32px',
                        }}
                      >
                        <Repeat2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteHistory(w.id)}
                        className="btn btn-secondary"
                        style={{
                          padding: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '32px',
                          color: 'var(--color-danger)',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
          {hasNextPage && (
            <button
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '1rem',
                marginTop: '1rem',
                fontWeight: 600,
                display: 'flex',
                justifyContent: 'center',
              }}
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Cargando...' : 'Cargar más entrenamientos'}
            </button>
          )}
        </ul>
      )}

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
                      textTransform: 'capitalize',
                      marginTop: '0.2rem',
                    }}
                  >
                    {formatDay(detail.finishedAt)}
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
                <Stat
                  label="Duración"
                  value={formatDuration(detail.finishedAt - detail.startedAt)}
                />
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
                {detail.exercises.map((ex: any) => {
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
                        {(meta && customGifs[meta.id]) || meta?.gifUrl ? (
                          <img
                            src={customGifs[meta.id] || meta.gifUrl}
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
                                letterSpacing: '0.5px',
                                marginRight: '0.4rem',
                                display: 'inline-block',
                                marginBottom: '0.2rem',
                              }}
                            >
                              SUPER
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
                          {ex.sets.map((s: any, i: any) => {
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
                                    {SET_TYPE_LABEL[s.type as keyof typeof SET_TYPE_LABEL] || normalCount + 1}
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
                                  isPrSet(
                                    ex.exerciseId,
                                    ex.variant,
                                    s.weight,
                                    history,
                                    detail.id,
                                  ) ? (
                                    <span className="text-[0.65rem] font-bold text-[var(--color-success)] bg-emerald-500/15 px-1.5 py-1 rounded-sm">
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
                  deleteHistory(detail.id);
                  setDetailId(null);
                }}
              >
                <Trash2 size={20} />
                Borrar Entrenamiento
              </button>
            </div>
          </DialogContentFullScreen>
        ) : null}
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        style={{
          fontSize: '0.65rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
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




