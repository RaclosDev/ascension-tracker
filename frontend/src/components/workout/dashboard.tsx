import { useState } from 'react';
import { ArrowRight, Clock3, Dumbbell, Play, X } from 'lucide-react';
import { ActivityHeatmap } from '@/components/workout/heatmap';
import { MuscleRecovery } from '@/components/workout/muscle-recovery';
import { BodyHeatmap } from '@/components/workout/body-heatmap';
import { getExerciseMap } from '@/lib/workout/exercises';
import { formatDuration, formatKg, sessionVolume } from '@/lib/workout/format';
import type { Template, CompletedWorkout, WorkoutExercise } from '@/lib/workout/types';
import { useWorkoutStore } from '@/lib/workout/store';
import { useRecentWorkouts, useWorkoutTemplates, useCustomExercises } from '@/lib/workout/api';
import { Skeleton } from '@/components/ui/skeleton';

export function Dashboard() {
  const { data: history = [], isLoading: isLoadingHistory } = useRecentWorkouts(60);
  const { data: templates = [] } = useWorkoutTemplates();
  const { data: customExercises = [] } = useCustomExercises();

  const startEmpty = useWorkoutStore((s) => s.startEmpty);
  const startFromTemplate = useWorkoutStore((s) => s.startFromTemplate);
  const startFromHistory = useWorkoutStore((s) => s.startFromHistory);
  const setTab = useWorkoutStore((s) => s.setTab);
  const setDetailId = useWorkoutStore((s) => s.setDetailId);
  const active = useWorkoutStore((s) => s.active);
  const catalog = getExerciseMap(customExercises);

  const [startModalOpen, setStartModalOpen] = useState(false);

  if (isLoadingHistory) {
    return (
      <div className="space-y-8">
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <div className="card">
            <Skeleton className="h-[150px] w-full" />
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
            }}
          >
            <Skeleton className="h-6 w-32" />
          </div>
          <ul
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              padding: 0,
              margin: 0,
              listStyle: 'none',
            }}
          >
            {[1, 2, 3].map((i) => (
              <li key={i}>
                <div
                  className="card"
                  style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.85rem 1rem',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div
                    style={{
                      textAlign: 'right',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                    }}
                  >
                    <Skeleton className="h-4 w-12 mb-2" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {!active && (
        <button
          onClick={() => setStartModalOpen(true)}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1.1rem',
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            borderRadius: '16px',
            marginBottom: '1.5rem',
            boxShadow: '0 8px 16px rgba(0, 133, 255, 0.25)',
          }}
        >
          <Play size={20} fill="currentColor" />
          Empezar Entrenamiento
        </button>
      )}

      {/* Start Workout Sheet */}
      {startModalOpen && (
        <>
          <div className="workout-sheet-overlay" onClick={() => setStartModalOpen(false)} />
          <div className="workout-sheet">
            <div className="workout-sheet-handle" />
            <div className="workout-sheet-header">
              <span className="workout-sheet-title">Empezar Entrenamiento</span>
              <button className="workout-sheet-close" onClick={() => setStartModalOpen(false)}>
                <X size={22} />
              </button>
            </div>
            <div className="workout-sheet-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Empty workout */}
                <button
                  className="start-workout-option start-workout-option-primary"
                  onClick={() => {
                    startEmpty();
                    setStartModalOpen(false);
                  }}
                >
                  <div className="start-workout-option-icon">
                    <Play size={22} />
                  </div>
                  <div>
                    <div className="start-workout-option-title">Entrenamiento Vacío</div>
                    <div className="start-workout-option-desc">
                      Empezar desde cero sin ejercicios predefinidos
                    </div>
                  </div>
                </button>

                {/* Templates */}
                {templates?.length > 0 && (
                  <>
                    <div className="start-workout-section-label" style={{ marginTop: '0.5rem' }}>
                      Plantillas
                    </div>
                    {templates.map((t: Template) => (
                      <button
                        key={t.id}
                        className="start-workout-option start-workout-option-secondary"
                        onClick={() => {
                          startFromTemplate(t, history);
                          setStartModalOpen(false);
                        }}
                      >
                        <div className="start-workout-option-icon">
                          <Dumbbell size={20} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="start-workout-option-title">{t.name}</div>
                          <div className="start-workout-option-desc">
                            {t.exercises?.length || 0} ejercicios
                          </div>
                        </div>
                        <ArrowRight
                          size={16}
                          style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                        />
                      </button>
                    ))}
                  </>
                )}

                {/* Recent workouts */}
                {history?.length > 0 && (
                  <>
                    <div className="start-workout-section-label" style={{ marginTop: '0.5rem' }}>
                      Repetir Reciente
                    </div>
                    {history.slice(0, 3).map((w: CompletedWorkout) => (
                      <button
                        key={w.id}
                        className="start-workout-option start-workout-option-secondary"
                        onClick={() => {
                          startFromHistory(w);
                          setStartModalOpen(false);
                        }}
                      >
                        <div className="start-workout-option-icon">
                          <Clock3 size={20} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                          <div
                            className="start-workout-option-title"
                            style={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {w.name}
                          </div>
                          <div className="start-workout-option-desc">
                            {formatDuration(w.finishedAt - w.startedAt)} ·{' '}
                            {w?.exercises?.length || 0} ejercicios
                          </div>
                        </div>
                        <ArrowRight
                          size={16}
                          style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                        />
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {active ? (
        <button
          type="button"
          onClick={() => setTab('train')}
          className="card"
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'left',
            cursor: 'pointer',
            marginBottom: '1rem',
          }}
        >
          <div>
            <p
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--color-success)',
              }}
            >
              En curso
            </p>
            <p
              style={{
                marginTop: '0.25rem',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              {active.name}
            </p>
            <p
              style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}
            >
              {active?.exercises?.length || 0} ejercicios · continuar
            </p>
          </div>
          <ArrowRight className="size-5 text-muted-foreground" />
        </button>
      ) : null}

      {/* The navigation cards for Ejercicios and Plantillas were removed since they are now top-level tabs */}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <MuscleRecovery history={history} customExercises={customExercises} />
        <BodyHeatmap history={history} customExercises={customExercises} />
      </section>

      <section style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Actividad
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>12 semanas</span>
          </div>
          <ActivityHeatmap history={history} />
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Recientes
          </h3>
          <button
            onClick={() => setTab('history')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Ver todo
          </button>
        </div>
        {history.length === 0 ? (
          <EmptyCard
            title="Todavía no hay sesiones"
            body="Empieza un entrenamiento vacío o usa una plantilla."
          />
        ) : (
          <ul
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              padding: 0,
              margin: 0,
              listStyle: 'none',
            }}
          >
            {history.slice(0, 4).map((w: CompletedWorkout) => {
              const names = w.exercises
                .slice(0, 4)
                .map((e: WorkoutExercise) => catalog.get(e.exerciseId)?.name ?? 'Ejercicio');
              return (
                <li key={w.id}>
                  <div
                    className="card"
                    style={{
                      display: 'flex',
                      width: '100%',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.85rem 1rem',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setDetailId(w.id);
                        setTab('history');
                      }}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'inherit',
                      }}
                    >
                      <p
                        style={{
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          fontSize: '0.9rem',
                        }}
                      >
                        {w.name}
                      </p>
                      <p
                        style={{
                          marginTop: '0.1rem',
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {names.join(' · ')}
                        {w.exercises.length > 4 ? '' : ''}
                      </p>
                    </button>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {formatKg(sessionVolume(w.exercises))}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {formatDuration(w.finishedAt - w.startedAt)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
      <p style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</p>
      <p
        style={{
          margin: '0.5rem auto 0',
          maxWidth: '400px',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        {body}
      </p>
    </div>
  );
}
