import { lazy, Suspense, useMemo, useState } from 'react';
import { addDays, format, isToday, isYesterday, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight, Clock3, Dumbbell, Play, Repeat2, X } from 'lucide-react';
import { ActivityHeatmap } from '@/components/workout/heatmap';
import { MuscleRecovery } from '@/components/workout/muscle-recovery';
import { BodyHeatmap } from '@/components/workout/body-heatmap';
import { getExerciseMap } from '@/lib/workout/exercises';
import { completedSets, formatDuration, formatKg, sessionVolume } from '@/lib/workout/format';
import type { Template, CompletedWorkout } from '@/lib/workout/types';
import { useWorkoutStore } from '@/lib/workout/store';
import { useRecentWorkouts, useWorkoutTemplates, useCustomExercises } from '@/lib/workout/api';
import { Skeleton } from '@/components/ui/skeleton';
import { PowerliftingCard } from '@/components/workout/PowerliftingCard';
import { useMyCoaches } from '@/lib/coach/api';

// Outside the precache like the coach pages: it needs the network, and offline it just renders nothing.
const TodayProgramCard = lazy(() =>
  import('@/components/workout/TodayProgramCard')
    .then((m) => ({ default: m.TodayProgramCard }))
    .catch(() => ({ default: () => null })),
);

const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** «Hoy», «Ayer» o «Lun 17»: lo justo para situar una sesión reciente. */
function whenLabel(ts: number) {
  if (isToday(ts)) return 'Hoy';
  if (isYesterday(ts)) return 'Ayer';
  const label = format(ts, 'EEE d', { locale: es });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Lo hecho esta semana (de lunes a hoy) frente a la anterior. */
function useWeek(history: CompletedWorkout[]) {
  return useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 }).getTime();
    const prevStart = addDays(start, -7).getTime();
    const week = history.filter((w) => w.finishedAt >= start);
    const prev = history.filter((w) => w.finishedAt >= prevStart && w.finishedAt < start);
    const days = DAY_LETTERS.map((letter, i) => {
      const from = addDays(start, i).getTime();
      const to = addDays(start, i + 1).getTime();
      return {
        letter,
        date: from,
        done: week.some((w) => w.finishedAt >= from && w.finishedAt < to),
        today: isToday(from),
      };
    });
    return {
      count: week.length,
      prevCount: prev.length,
      volume: week.reduce((n, w) => n + sessionVolume(w.exercises), 0),
      time: week.reduce((n, w) => n + (w.finishedAt - w.startedAt), 0),
      sets: week.reduce((n, w) => n + completedSets(w.exercises), 0),
      days,
    };
  }, [history]);
}

function compareLabel(count: number, prev: number) {
  if (prev === 0) {
    return count > 0 ? 'La semana pasada no entrenaste' : 'Aún sin entrenos esta semana';
  }
  const diff = count - prev;
  if (diff === 0) return `Igual que la semana pasada (${prev})`;
  return `${Math.abs(diff)} ${diff > 0 ? 'más' : 'menos'} que la semana pasada (${prev})`;
}

function Dashboard() {
  const coaches = useMyCoaches();
  const showPowerlifting =
    coaches.data != null &&
    (coaches.data.length === 0 ||
      coaches.data.some((coach) => coach.powerliftingEnabled && coach.permissions.training));
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
  const week = useWeek(history);

  const [startModalOpen, setStartModalOpen] = useState(false);
  const [repeatOpen, setRepeatOpen] = useState(false);

  if (isLoadingHistory) {
    return (
      <div className="wk" aria-busy="true">
        <Skeleton className="h-[190px] w-full rounded-xl" />
        <div className="wk-grid">
          <div className="wk-main">
            <Skeleton className="h-[260px] w-full rounded-xl" />
            <Skeleton className="h-[220px] w-full rounded-xl" />
          </div>
          <Skeleton className="h-[320px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="wk">
      <section className="card wk-hero" aria-labelledby="wk-week-title">
        <div className="wk-hero-week">
          <div className="wk-week-head">
            <div>
              <h2 id="wk-week-title" className="wk-eyebrow">
                Esta semana
              </h2>
              <p className="wk-count">
                {week.count}
                <span>{week.count === 1 ? 'entreno' : 'entrenos'}</span>
              </p>
              <p className="wk-compare">{compareLabel(week.count, week.prevCount)}</p>
            </div>
            <div className="wk-quick">
              {history.length > 0 && !active && (
                <button
                  type="button"
                  className="btn btn-secondary wk-quick-repeat"
                  onClick={() => setRepeatOpen(true)}
                  aria-label="Repetir un entreno"
                  title="Repetir un entreno"
                >
                  <Repeat2 size={18} aria-hidden />
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary wk-quick-start"
                onClick={() => (active ? setTab('train') : setStartModalOpen(true))}
                aria-label={active ? 'Continuar entreno' : 'Empezar entrenamiento'}
              >
                <Play size={16} fill="currentColor" aria-hidden />
                {active ? 'Continuar' : 'Empezar'}
              </button>
            </div>
          </div>
          <ol className="wk-days" aria-label="Días entrenados esta semana">
            {week.days.map((d) => (
              <li
                key={d.letter}
                data-done={d.done || undefined}
                data-today={d.today || undefined}
                title={format(d.date, "EEEE d 'de' MMMM", { locale: es })}
              >
                <span aria-hidden="true">{d.letter}</span>
                <span className="sr-only">
                  {format(d.date, 'EEEE', { locale: es })}: {d.done ? 'entrenado' : 'sin entreno'}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <dl className="wk-stats">
          <div>
            <dt>Volumen</dt>
            <dd className="tabular-nums">{formatKg(week.volume)}</dd>
          </div>
          <div>
            <dt>Tiempo</dt>
            <dd className="tabular-nums">{week.time > 0 ? formatDuration(week.time) : '—'}</dd>
          </div>
          <div>
            <dt>Series</dt>
            <dd className="tabular-nums">{week.sets}</dd>
          </div>
        </dl>

        <div className="wk-actions">
          {active ? (
            <button
              type="button"
              className="btn btn-primary wk-start"
              onClick={() => setTab('train')}
            >
              <Play size={18} fill="currentColor" aria-hidden /> Continuar entreno
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-primary wk-start"
                onClick={() => setStartModalOpen(true)}
              >
                <Play size={18} fill="currentColor" aria-hidden /> Empezar entrenamiento
              </button>
              {history.length > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary wk-repeat"
                  onClick={() => setRepeatOpen(true)}
                >
                  <Repeat2 size={16} aria-hidden />
                  <span className="wk-repeat-label">Repetir entreno</span>
                </button>
              )}
            </>
          )}
        </div>
      </section>

      {!active && (
        <Suspense fallback={null}>
          <TodayProgramCard exerciseName={(id) => catalog.get(id)?.name ?? id} />
        </Suspense>
      )}

      {repeatOpen && (
        <>
          <div
            className="workout-sheet-overlay"
            aria-hidden="true"
            onClick={() => setRepeatOpen(false)}
          />
          <div className="workout-sheet" role="dialog" aria-label="Repetir un entreno">
            <div className="workout-sheet-handle" />
            <div className="workout-sheet-header">
              <span className="workout-sheet-title">Repetir entreno</span>
              <button
                className="workout-sheet-close"
                onClick={() => setRepeatOpen(false)}
                aria-label="Cerrar"
              >
                <X size={22} />
              </button>
            </div>
            <div className="workout-sheet-body">
              <ul className="wk-repeat-list">
                {history.slice(0, 10).map((w: CompletedWorkout) => (
                  <li key={w.id}>
                    <button
                      type="button"
                      className="start-workout-option start-workout-option-secondary"
                      onClick={() => {
                        startFromHistory(w);
                        setRepeatOpen(false);
                      }}
                    >
                      <div className="start-workout-option-icon">
                        <Repeat2 size={18} />
                      </div>
                      <div className="wk-repeat-text">
                        <div className="start-workout-option-title">{w.name}</div>
                        <div className="start-workout-option-desc">
                          {whenLabel(w.finishedAt)} · {w.exercises?.length || 0} ejercicios ·{' '}
                          {formatKg(sessionVolume(w.exercises))}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {startModalOpen && (
        <>
          <div
            className="workout-sheet-overlay"
            aria-hidden="true"
            onClick={() => setStartModalOpen(false)}
          />
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

      <div className="wk-grid">
        <div className="wk-main">
          <section className="wk-body" aria-label="Recuperación y músculos trabajados">
            <MuscleRecovery history={history} customExercises={customExercises} />
            <BodyHeatmap history={history} customExercises={customExercises} />
          </section>

          {showPowerlifting && <PowerliftingCard />}

          <section className="card wk-panel" aria-labelledby="wk-activity-title">
            <header className="wk-panel-head">
              <h3 id="wk-activity-title" className="wk-title">
                Actividad
              </h3>
              <span className="wk-note">Volumen por día, dos meses</span>
            </header>
            <ActivityHeatmap history={history} />
          </section>
        </div>

        <aside className="card wk-panel wk-recent" aria-labelledby="wk-recent-title">
          <header className="wk-panel-head">
            <h3 id="wk-recent-title" className="wk-title">
              Recientes
            </h3>
            <button type="button" className="wk-link" onClick={() => setTab('history')}>
              Ver todo <ArrowRight size={14} aria-hidden />
            </button>
          </header>
          {history.length === 0 ? (
            <p className="wk-empty">
              Todavía no hay sesiones. Empieza un entrenamiento vacío o usa una plantilla.
            </p>
          ) : (
            <ul className="wk-recent-list">
              {history.slice(0, 6).map((w: CompletedWorkout) => (
                <li key={w.id}>
                  <button
                    type="button"
                    className="wk-recent-item"
                    onClick={() => {
                      setDetailId(w.id);
                      setTab('history');
                    }}
                  >
                    <span className="wk-recent-when">{whenLabel(w.finishedAt)}</span>
                    <span className="wk-recent-name">
                      <strong>{w.name}</strong>
                      <small>
                        {w.exercises
                          .slice(0, 3)
                          .map((e) => catalog.get(e.exerciseId)?.name ?? 'Ejercicio')
                          .join(' · ')}
                        {w.exercises.length > 3 ? ` · +${w.exercises.length - 3}` : ''}
                      </small>
                    </span>
                    <span className="wk-recent-figs tabular-nums">
                      <strong>{formatKg(sessionVolume(w.exercises))}</strong>
                      <small>{formatDuration(w.finishedAt - w.startedAt)}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
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

export default Dashboard;
