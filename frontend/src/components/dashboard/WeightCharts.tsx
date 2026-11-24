import { useMemo, useState } from 'react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SegmentedControl } from '../ui/segmented-control';
import { InfoTip } from '../ui/InfoTip';

export interface WeightPoint {
  date: string;
  weight: number;
  label: string;
}
export interface DeltaPoint {
  /** Lunes de la semana, para recortar por periodo. */
  date?: string;
  week: string;
  delta: number;
}

const tick = { fill: 'var(--text-muted)', fontSize: 11 };
const grid = 'var(--border-subtle)';
const tooltipStyle = {
  contentStyle: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-medium)',
    borderRadius: 6,
    fontSize: 12,
  },
  labelStyle: { color: 'var(--text-primary)', fontWeight: 600 },
  itemStyle: { color: 'var(--text-secondary)' },
};

const RANGES = [
  { value: '30', label: '1M' },
  { value: '90', label: '3M' },
  { value: '180', label: '6M' },
  { value: 'all', label: 'Todo' },
];

const DAY = 86_400_000;
const time = (iso: string) => new Date(`${iso}T00:00:00`).getTime();

/** Mean of the entries in the seven days up to each one: the line to read, over the daily noise. */
function withWeeklyMean(points: WeightPoint[]) {
  return points.map((p, i) => {
    const end = time(p.date);
    let sum = 0;
    let n = 0;
    for (let j = i; j >= 0 && end - time(points[j].date) < 7 * DAY; j--) {
      sum += points[j].weight;
      n++;
    }
    return { ...p, mean: Math.round((sum / n) * 100) / 100 };
  });
}

type TrendPoint = WeightPoint & { mean: number };

const defaultRange = (data: WeightPoint[]) => {
  const span = data.length > 1 ? (time(data.at(-1)!.date) - time(data[0].date)) / DAY : 0;
  return span > 100 ? '90' : 'all';
};

/** Keeps the points of the last `range` days, counted back from the newest one. */
function inRange<T extends { date?: string }>(points: T[], range: string): T[] {
  const last = points.at(-1)?.date;
  if (range === 'all' || !last) return points;
  const from = time(last) - Number(range) * DAY;
  return points.filter((p) => !p.date || time(p.date) >= from);
}

/** The goal line only joins the scale when it is close; far away it would flatten the curve. */
function trendScale(shown: TrendPoint[], goalWeight?: number) {
  const weights = shown.map((p) => p.weight);
  const lo = Math.min(...weights);
  const hi = Math.max(...weights);
  const reach = Math.max(2, hi - lo);
  const goalInView = goalWeight != null && goalWeight >= lo - reach && goalWeight <= hi + reach;
  return {
    goalInView,
    low: Math.floor(Math.min(lo, goalInView ? goalWeight : lo) - 0.3),
    high: Math.ceil(Math.max(hi, goalInView ? goalWeight : hi) + 0.3),
  };
}

function TrendInfo({ goalInView }: { goalInView: boolean }) {
  return (
    <InfoTip label="Qué significan las líneas de la gráfica" align="start">
      <span>
        <strong>
          <span className="legend-key legend-daily" aria-hidden="true" />
          Diario
        </strong>
        Cada vez que te pesas. Sube y baja por el agua y la comida del día.
      </span>
      <span>
        <strong>
          <span className="legend-key legend-mean" aria-hidden="true" />
          Media 7 días
        </strong>
        La media de los pesajes de la última semana: la línea que de verdad cuenta.
      </span>
      {goalInView && (
        <span>
          <strong>
            <span className="legend-key legend-goal" aria-hidden="true" />
            Meta
          </strong>
          Tu peso objetivo. Solo aparece cuando está cerca de tus registros.
        </span>
      )}
    </InfoTip>
  );
}

function ChangeInfo({ gaining }: { gaining: boolean }) {
  return (
    <InfoTip label="Cómo se lee el cambio semanal" align="start">
      <span>Cada barra compara la media de una semana con la de la semana anterior.</span>
      <span>
        <strong>
          <span className="legend-swatch legend-toward" aria-hidden="true" />
          Hacia tu meta
        </strong>
        {gaining ? 'La media subió.' : 'La media bajó.'}
      </span>
      <span>
        <strong>
          <span className="legend-swatch legend-away" aria-hidden="true" />
          En contra
        </strong>
        {gaining ? 'La media bajó.' : 'La media subió.'}
      </span>
    </InfoTip>
  );
}

function TrendBody({
  shown,
  goalWeight,
  height,
}: {
  shown: TrendPoint[];
  goalWeight?: number;
  height: number;
}) {
  const { goalInView, low, high } = trendScale(shown, goalWeight);
  return (
    <div style={{ height }}>
      {shown.length === 0 ? (
        <p className="chart-empty">Registra tu peso para ver la evolución.</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={shown} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={grid} />
            <XAxis
              dataKey="label"
              tick={tick}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              width={44}
              tick={tick}
              tickLine={false}
              axisLine={false}
              domain={[low, high]}
              allowDecimals={false}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(v, name) => [
                `${Number(v).toFixed(2)} kg`,
                name === 'mean' ? 'Media 7 días' : 'Peso',
              ]}
            />
            {goalInView && (
              <ReferenceLine
                y={goalWeight}
                stroke="var(--color-success)"
                strokeDasharray="6 4"
                strokeOpacity={0.7}
              />
            )}
            <Area
              type="monotone"
              dataKey="weight"
              stroke="var(--text-muted)"
              strokeOpacity={0.45}
              strokeWidth={1}
              fill="url(#trendFill)"
              dot={shown.length < 40 ? { r: 2, fill: 'var(--text-muted)', strokeWidth: 0 } : false}
              activeDot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="mean"
              stroke="var(--accent-primary)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--accent-primary)' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function ChangeBody({
  shown,
  gaining,
  height,
}: {
  shown: DeltaPoint[];
  gaining: boolean;
  height: number;
}) {
  const values = shown.map((d) => d.delta);
  const top = Math.max(0, ...values);
  const bottom = Math.min(0, ...values);
  const pad = Math.max(0.1, (top - bottom) * 0.15);
  const toward = (delta: number) => (gaining ? delta >= 0 : delta <= 0);
  return (
    <div style={{ height }}>
      {shown.length === 0 ? (
        <p className="chart-empty">Hace falta más de una semana con registros.</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={shown} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={grid} />
            <XAxis
              dataKey="week"
              tick={tick}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={20}
            />
            <YAxis
              width={44}
              tick={tick}
              tickLine={false}
              axisLine={false}
              domain={[
                Math.floor((bottom - (bottom < 0 ? pad : 0)) * 10) / 10,
                Math.ceil((top + (top > 0 ? pad : 0)) * 10) / 10,
              ]}
              tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`}
            />
            <Tooltip
              {...tooltipStyle}
              cursor={{ fill: 'var(--bg-glass)' }}
              formatter={(v) => [`${Number(v) > 0 ? '+' : ''}${Number(v).toFixed(2)} kg`, 'Cambio']}
            />
            <ReferenceLine y={0} stroke="var(--border-medium)" />
            <Bar dataKey="delta" radius={[3, 3, 3, 3]} maxBarSize={28}>
              {shown.map((d, i) => (
                <Cell
                  key={i}
                  fill={toward(d.delta) ? 'var(--color-success)' : 'var(--color-danger)'}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function RangePicker({ range, onChange }: { range: string; onChange: (r: string) => void }) {
  return (
    <SegmentedControl value={range} onChange={onChange} options={RANGES} className="segmented-sm" />
  );
}

export function WeightTrendChart({
  data,
  goalWeight,
  height = 300,
}: {
  data: WeightPoint[];
  goalWeight?: number;
  height?: number;
}) {
  const [range, setRange] = useState(() => defaultRange(data));
  const shown = useMemo(() => inRange(withWeeklyMean(data), range), [data, range]);
  return (
    <section className="trend-panel" aria-labelledby="trend-title">
      <header className="trend-head">
        <h2 id="trend-title" className="panel-title">
          Evolución
        </h2>
        <TrendInfo goalInView={trendScale(shown, goalWeight).goalInView} />
        <RangePicker range={range} onChange={setRange} />
      </header>
      <TrendBody shown={shown} goalWeight={goalWeight} height={height} />
    </section>
  );
}

/** Change of the weekly mean, week by week; the bars that go toward the goal are the green ones. */
export function WeeklyChangeChart({
  data,
  gaining = false,
  height = 200,
}: {
  data: DeltaPoint[];
  gaining?: boolean;
  height?: number;
}) {
  return (
    <section className="change-panel" aria-labelledby="change-title">
      <header className="trend-head">
        <h2 id="change-title" className="panel-title">
          Cambio semanal
        </h2>
        <ChangeInfo gaining={gaining} />
      </header>
      <ChangeBody shown={data.slice(-12)} gaining={gaining} height={height} />
    </section>
  );
}

const VIEWS = [
  { value: 'trend', label: 'Peso' },
  { value: 'change', label: 'Cambio semanal' },
] as const;
type View = (typeof VIEWS)[number]['value'];

/**
 * Evolución del Inicio: varias gráficas en la misma tarjeta, que se alternan con las pestañas
 * o deslizando, y comparten el periodo elegido.
 */
export function WeightEvolution({
  weights,
  deltas,
  goalWeight,
  gaining = false,
  height = 280,
}: {
  weights: WeightPoint[];
  deltas: DeltaPoint[];
  goalWeight?: number;
  gaining?: boolean;
  height?: number;
}) {
  const [range, setRange] = useState(() => defaultRange(weights));
  const [view, setView] = useState<View>('trend');
  const [touchX, setTouchX] = useState<number | null>(null);
  const trend = useMemo(() => inRange(withWeeklyMean(weights), range), [weights, range]);
  const change = useMemo(() => inRange(deltas, range), [deltas, range]);
  const step = (dir: 1 | -1) => {
    const next = VIEWS[VIEWS.findIndex((v) => v.value === view) + dir];
    if (next) setView(next.value);
  };
  return (
    <section className="trend-panel evo" aria-labelledby="evo-title">
      <header className="trend-head evo-head">
        <h2 id="evo-title" className="panel-title">
          Evolución
        </h2>
        {view === 'trend' ? (
          <TrendInfo goalInView={trendScale(trend, goalWeight).goalInView} />
        ) : (
          <ChangeInfo gaining={gaining} />
        )}
        <RangePicker range={range} onChange={setRange} />
        <div className="evo-tabs" role="tablist" aria-label="Gráfica">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              type="button"
              role="tab"
              id={`evo-tab-${v.value}`}
              aria-selected={view === v.value}
              aria-controls="evo-panel"
              tabIndex={view === v.value ? 0 : -1}
              onClick={() => setView(v.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') step(1);
                if (e.key === 'ArrowLeft') step(-1);
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </header>
      <div
        id="evo-panel"
        role="tabpanel"
        aria-labelledby={`evo-tab-${view}`}
        onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX === null) return;
          const dx = e.changedTouches[0].clientX - touchX;
          if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1);
          setTouchX(null);
        }}
      >
        {view === 'trend' ? (
          <TrendBody shown={trend} goalWeight={goalWeight} height={height} />
        ) : (
          <ChangeBody shown={change} gaining={gaining} height={height} />
        )}
      </div>
    </section>
  );
}
