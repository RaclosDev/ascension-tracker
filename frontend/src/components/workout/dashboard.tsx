import { lazy, Suspense, useMemo, useState } from 'react';
import { addDays, format, isToday, isYesterday, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight, Play, Repeat2, X } from 'lucide-react';
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
import '@/styles/workout-sheets.css';

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

/** Los tres primeros ejercicios de una sesión, para reconocerla sin abrirla. */
function exerciseLine(
  exercises: { exerciseId: string }[] | undefined,
  name: (id: string) => string | undefined,
) {
  const names = (exercises ?? []).map((e) => name(e.exerciseId)).filter((n): n is string => !!n);
  const rest = names.length - 3;
  return names.slice(0, 3).join(' · ') + (rest > 0 ? ` +${rest}` : '');
}

/** Una fila de las hojas de empezar y repetir: cuándo, qué y una cifra. */
function SessionRow({
  when,
  name,
  detail,
  figure,
  note,
  onClick,
}: {
  when?: string;
  name: string;
  detail: string;
  figure: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={when ? 'ws-row' : 'ws-row ws-row-plain'} onClick={onClick}>
      {when && <span className="ws-when">{when}</span>}
      <span className="ws-main">
        <span className="ws-name">{name}</span>
        {detail && <span className="ws-detail">{detail}</span>}
      </span>
      <span className="ws-aside">
        <span className="ws-figure">{figure}</span>
        <span className="ws-note">{note}</span>
      </span>
      <ArrowRight size={16} className="ws-go" aria-hidden="true" />
    </button>
  );
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
  const exerciseName = (id: string) => catalog.get(id)?.name;
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
          <div className="workout-sheet ws" role="dialog" aria-labelledby="ws-repeat-title">
            <div className="workout-sheet-handle" />
            <header className="workout-sheet-header ws-head">
              <div>
                <p className="ws-eyebrow">Mismos ejercicios y series</p>
                <h2 id="ws-repeat-title" className="workout-sheet-title">
                  Repetir entreno
                </h2>
              </div>
              <button
                type="button"
                className="workout-sheet-close"
                onClick={() => setRepeatOpen(false)}
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </header>
            <div className="workout-sheet-body">
              <ul className="ws-list">
                {history.slice(0, 10).map((w: CompletedWorkout) => (
                  <li key={w.id}>
                    <SessionRow
                      when={whenLabel(w.finishedAt)}
                      name={w.name}
                      detail={exerciseLine(w.exercises, exerciseName)}
                      figure={formatKg(sessionVolume(w.exercises))}
                      note={`${w.exercises?.length || 0} ejercicios`}
                      onClick={() => {
                        startFromHistory(w);
                        setRepeatOpen(false);
                      }}
                    />
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
          <div className="workout-sheet ws" role="dialog" aria-labelledby="ws-start-title">
            <div className="workout-sheet-handle" />
            <header className="workout-sheet-header ws-head">
              <div>
                <p className="ws-eyebrow">Nuevo entreno</p>
                <h2 id="ws-start-title" className="workout-sheet-title">
                  Empezar entreno
                </h2>
              </div>
              <button
                type="button"
                className="workout-sheet-close"
                onClick={() => setStartModalOpen(false)}
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </header>
            <div className="workout-sheet-body">
              <button
                type="button"
                className="ws-empty"
                onClick={() => {
                  startEmpty();
                  setStartModalOpen(false);
                }}
              >
                <span className="ws-empty-icon" aria-hidden="true">
                  <Play size={18} />
                </span>
                <span className="ws-main">
                  <span className="ws-name">Entreno vacío</span>
                  <span className="ws-detail">Añades los ejercicios sobre la marcha</span>
                </span>
                <ArrowRight size={18} className="ws-go" aria-hidden="true" />
              </button>

              {templates?.length > 0 && (
                <section className="ws-section" aria-labelledby="ws-templates">
                  <h3 id="ws-templates" className="ws-label">
                    Plantillas <span>{templates.length}</span>
                  </h3>
                  <ul className="ws-list">
                    {templates.map((t: Template) => (
                      <li key={t.id}>
                        <SessionRow
                          name={t.name}
                          detail={exerciseLine(t.exercises, exerciseName)}
                          figure={`${t.exercises?.length || 0}`}
                          note="ejercicios"
                          onClick={() => {
                            startFromTemplate(t, history);
                            setStartModalOpen(false);
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {history?.length > 0 && (
                <section className="ws-section" aria-labelledby="ws-recent">
                  <h3 id="ws-recent" className="ws-label">
                    Repetir uno reciente
                  </h3>
                  <ul className="ws-list">
                    {history.slice(0, 3).map((w: CompletedWorkout) => (
                      <li key={w.id}>
                        <SessionRow
                          when={whenLabel(w.finishedAt)}
                          name={w.name}
                          detail={exerciseLine(w.exercises, exerciseName)}
                          figure={formatDuration(w.finishedAt - w.startedAt)}
                          note={`${w.exercises?.length || 0} ejercicios`}
                          onClick={() => {
                            startFromHistory(w);
                            setStartModalOpen(false);
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
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
