import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Dumbbell, Scale, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../../api/client';
import { parseSafeWeight } from '../../utils/weightHelper';
import { useTodayPlans } from '../../lib/coach/today';
import { useLocalToday } from '../../hooks/use-local-today';
import type { FoodLog, Macros, WeightEntry } from '../../types/api';
import '../../styles/athlete-workout.css';
import '../../styles/athlete-overview.css';

export interface HomeOverviewProps {
  todayDateStr: string;
  todayWeight?: number;
  previousWeight?: number;
  currentWeight: number;
  weights: WeightEntry[];
  start: number;
  goal: number;
  arrival: string;
  rate: number;
  ratePicker: ReactNode;
  weeklyAverage?: number;
  change: number;
  streak: number;
  showNutrition: boolean;
  chart: ReactNode;
}

const LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function useWeighIn({ todayDateStr, todayWeight, currentWeight }: HomeOverviewProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: (val: number) => api.post('/weights', { date: todayDateStr, weight: val }),
    onSuccess: (_, val) => {
      toast.success(`Peso guardado: ${val} kg`);
      setDraft(null);
      ['weights', 'dashboard', 'weekSummaries', 'trackingWeeks'].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      );
    },
    onError: () => toast.error('No se pudo guardar el peso'),
  });
  const submit = () => {
    const val = parseSafeWeight(draft ?? '');
    if (val === null) {
      toast.error('Introduce un peso válido en kg (ej: 80.5)');
      return;
    }
    save.mutate(val);
  };
  return {
    editing: draft !== null,
    draft: draft ?? '',
    setDraft,
    open: () => setDraft((todayWeight ?? currentWeight).toString()),
    cancel: () => setDraft(null),
    submit,
    pending: save.isPending,
    label: todayWeight === undefined ? 'Registrar' : 'Actualizar',
  };
}
type WeighIn = ReturnType<typeof useWeighIn>;

function WeightInput({ w }: { w: WeighIn }) {
  return (
    <input
      autoFocus
      type="text"
      inputMode="decimal"
      aria-label="Peso de hoy en kilogramos"
      className="tabular-nums"
      value={w.draft}
      onChange={(e) => w.setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') w.submit();
        if (e.key === 'Escape') w.cancel();
      }}
    />
  );
}

/** The weight as the big figure; it turns into its own field while editing. */
function WeightFigure({ w, value }: { w: WeighIn; value: number }) {
  return (
    <p className={`wk-count${w.editing ? ' hv-edit' : ''}`}>
      {w.editing ? <WeightInput w={w} /> : value.toFixed(1)}
      <span>kg</span>
    </p>
  );
}

function WeighButtons({ w, secondary = false }: { w: WeighIn; secondary?: boolean }) {
  return w.editing ? (
    <>
      <button type="button" className="btn btn-secondary" onClick={w.cancel} disabled={w.pending}>
        Cancelar
      </button>
      <button type="button" className="btn btn-primary" onClick={w.submit} disabled={w.pending}>
        Guardar
      </button>
    </>
  ) : (
    <button
      type="button"
      className={`btn ${secondary ? 'btn-secondary' : 'btn-primary'}`}
      onClick={w.open}
    >
      {w.label}
    </button>
  );
}

function vsPrevious({ todayWeight, previousWeight }: HomeOverviewProps) {
  if (todayWeight === undefined) return 'Hoy todavía no te has pesado';
  if (previousWeight === undefined) return 'Tu primer registro';
  const d = Math.round((todayWeight - previousWeight) * 100) / 100;
  if (d === 0) return 'Igual que el último registro';
  return `${Math.abs(d).toFixed(2)} kg ${d < 0 ? 'menos' : 'más'} que el último registro`;
}

/** Monday to Sunday of this week, marking the days with a weigh-in. */
function WeekRow({ weights, todayDateStr }: HomeOverviewProps) {
  const today = new Date(todayDateStr + 'T00:00:00');
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const logged = new Set(weights.map((w) => w.date));
  return (
    <ol className="wk-days" aria-label="Días con peso registrado esta semana">
      {LETTERS.map((letter, i) => {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        const iso = format(day, 'yyyy-MM-dd');
        return (
          <li
            key={iso}
            data-done={logged.has(iso) || undefined}
            data-today={iso === todayDateStr || undefined}
          >
            {letter}
          </li>
        );
      })}
    </ol>
  );
}

function GoalRule({ start, goal, currentWeight }: HomeOverviewProps) {
  const total = goal - start;
  const pct =
    total === 0 ? 100 : Math.max(0, Math.min(100, ((currentWeight - start) / total) * 100));
  return (
    <>
      <div
        className="goal-track-rule"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label="Progreso hacia la meta"
      >
        <span className="goal-track-fill" style={{ width: `${pct}%` }} />
        <span className="goal-track-now" style={{ left: `${pct}%` }} />
      </div>
      <div className="goal-track-ends tabular-nums">
        <span>{start.toFixed(1)} kg</span>
        <span>{Math.round(pct)} % hecho</span>
        <span>{goal.toFixed(1)} kg</span>
      </div>
    </>
  );
}

function useToday(showNutrition: boolean) {
  const { data: plans } = useTodayPlans();
  const date = useLocalToday();
  const { data: food } = useQuery({
    queryKey: ['nutrition', 'today-summary', date],
    enabled: showNutrition,
    queryFn: async () => {
      const [macros, logs] = await Promise.all([
        api.get<Macros>(`/nutrition/macros?date=${date}`),
        api.get<FoodLog[]>(`/nutrition/logs?date=${date}`),
      ]);
      const eaten = logs.data.reduce((sum, log) => sum + log.kcal, 0);
      return { eaten: Math.round(eaten), target: Math.round(macros.data.kcal) };
    },
    staleTime: 60 * 1000,
  });
  const active = plans?.find((p) => p.phase === 'ACTIVE' && p.day);
  const workout = active?.completedWorkoutId
    ? { title: 'Hecho', detail: active.day?.name ?? '', action: 'Ver' }
    : active?.day
      ? { title: active.day.name, detail: active.programName, action: 'Empezar' }
      : { title: 'Libre', detail: 'Sin sesión programada', action: 'Entrenar' };
  return { food, workout };
}

/** Today as rows: the figure on the left, the action on the right. */
function TodayRows({ p, w }: { p: HomeOverviewProps; w?: WeighIn }) {
  const { food, workout } = useToday(p.showNutrition);
  const pct = food && food.target > 0 ? Math.min(100, (food.eaten / food.target) * 100) : 0;
  return (
    <ul className="hv-rows">
      {w && (
        <li>
          <Scale size={18} aria-hidden="true" />
          <div className="hv-row-main">
            <span className="hv-row-label">Peso</span>
            <span className={`hv-row-figure tabular-nums${w.editing ? ' hv-edit' : ''}`}>
              {w.editing ? <WeightInput w={w} /> : (p.todayWeight ?? p.currentWeight).toFixed(1)}
              <small>kg</small>
            </span>
            <span className="hv-row-note">{vsPrevious(p)}</span>
          </div>
          <div className="hv-row-actions">
            <WeighButtons w={w} />
          </div>
        </li>
      )}
      {p.showNutrition && (
        <li>
          <Utensils size={18} aria-hidden="true" />
          <div className="hv-row-main">
            <span className="hv-row-label">Comidas</span>
            <span className="hv-row-figure tabular-nums">
              {food ? food.eaten : '—'}
              <small>{food && food.target > 0 ? `de ${food.target} kcal` : 'kcal'}</small>
            </span>
            {food && food.target > 0 && (
              <span className="hv-bar" aria-hidden="true">
                <span style={{ width: `${pct}%` }} />
              </span>
            )}
          </div>
          <Link to="/nutrition" className="btn btn-secondary">
            Anotar
          </Link>
        </li>
      )}
      <li>
        <Dumbbell size={18} aria-hidden="true" />
        <div className="hv-row-main">
          <span className="hv-row-label">Entreno</span>
          <span className="hv-row-figure">{workout.title}</span>
          <span className="hv-row-note">{workout.detail}</span>
        </div>
        <Link to="/workout" className="btn btn-secondary">
          {workout.action}
        </Link>
      </li>
    </ul>
  );
}

function ChartPanel({ p }: { p: HomeOverviewProps }) {
  return (
    <section className="card wk-panel hv-chart" aria-label="Evolución del peso">
      {p.chart}
    </section>
  );
}

const shortDate = (arrival: string) => arrival.replace(/ \d{4}$/, '');
const kg = (v: number) => `${v.toFixed(1)} kg`;

/** Las cifras de la meta, en dos columnas junto al peso de hoy. */
function GoalStats(p: HomeOverviewProps) {
  const moved = p.currentWeight - p.start;
  const gaining = p.goal > p.start;
  const towardGoal = gaining ? moved : -moved;
  const stats: [string, string][] = [
    [
      gaining ? 'Total ganado' : 'Total perdido',
      `${towardGoal < 0 ? '−' : ''}${kg(Math.abs(moved))}`,
    ],
    ['Faltan', kg(Math.abs(p.goal - p.currentWeight))],
    ['Llegada', p.arrival ? shortDate(p.arrival) : '—'],
    ['Kg por semana', p.rate.toFixed(2)],
    ['Media semanal', p.weeklyAverage ? kg(p.weeklyAverage) : '—'],
    ['Racha', `${p.streak} ${p.streak === 1 ? 'día' : 'días'}`],
  ];
  return (
    <dl className="wk-stats hv-stats">
      {stats.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd className="tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A · Como Entreno: el peso de hoy manda, con la semana y seis cifras de la meta. */
export function HomeOverview(p: HomeOverviewProps) {
  const w = useWeighIn(p);
  return (
    <div className="wk">
      <section className="card wk-hero hv-today" aria-label="Peso de hoy">
        <div className="wk-hero-week">
          <div className="wk-week-head">
            <div>
              <h2 className="wk-eyebrow">Peso de hoy</h2>
              <WeightFigure w={w} value={p.todayWeight ?? p.currentWeight} />
              <p className="wk-compare">{vsPrevious(p)}</p>
            </div>
            <div className="hv-weigh">
              <WeighButtons w={w} secondary />
            </div>
          </div>
          <WeekRow {...p} />
        </div>
        <GoalStats {...p} />
      </section>
      <div className="wk-grid hv-grid">
        <section className="card wk-panel" aria-labelledby="hv-goal-a">
          <header className="wk-panel-head">
            <h3 id="hv-goal-a" className="wk-title">
              Meta
            </h3>
            <span className="wk-note hv-pace">Proyectado a {p.ratePicker}</span>
          </header>
          <GoalRule {...p} />
        </section>
        <section className="card wk-panel wk-recent" aria-labelledby="hv-today-a">
          <header className="wk-panel-head">
            <h3 id="hv-today-a" className="wk-title">
              Hoy
            </h3>
          </header>
          <TodayRows p={p} />
        </section>
        <ChartPanel p={p} />
      </div>
    </div>
  );
}
