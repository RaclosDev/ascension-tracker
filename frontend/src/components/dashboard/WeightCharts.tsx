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

export interface WeightPoint {
  date: string;
  weight: number;
  label: string;
}
export interface DeltaPoint {
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

export function WeightTrendChart({
  data,
  goalWeight,
  height = 300,
}: {
  data: WeightPoint[];
  goalWeight?: number;
  height?: number;
}) {
  const span = data.length > 1 ? (time(data.at(-1)!.date) - time(data[0].date)) / DAY : 0;
  const [range, setRange] = useState(() => (span > 100 ? '90' : 'all'));
  const shown = useMemo(() => {
    const all = withWeeklyMean(data);
    if (range === 'all' || all.length === 0) return all;
    const from = time(all.at(-1)!.date) - Number(range) * DAY;
    return all.filter((p) => time(p.date) >= from);
  }, [data, range]);
  // The goal line only joins the scale when it is close; far away it would flatten the curve.
  const weights = shown.map((p) => p.weight);
  const lo = Math.min(...weights);
  const hi = Math.max(...weights);
  const reach = Math.max(2, hi - lo);
  const goalInView = goalWeight != null && goalWeight >= lo - reach && goalWeight <= hi + reach;
  const low = Math.floor(Math.min(lo, goalInView ? goalWeight : lo) - 0.3);
  const high = Math.ceil(Math.max(hi, goalInView ? goalWeight : hi) + 0.3);

  return (
    <section className="trend-panel" aria-labelledby="trend-title">
      <header className="trend-head">
        <h2 id="trend-title" className="panel-title">
          Evolución
        </h2>
        <div className="trend-legend" aria-hidden>
          <span className="legend-key legend-daily" /> Diario
          <span className="legend-key legend-mean" /> Media 7 días
          {goalInView && (
            <>
              <span className="legend-key legend-goal" /> Meta
            </>
          )}
        </div>
        <SegmentedControl
          value={range}
          onChange={setRange}
          options={RANGES}
          className="segmented-sm"
        />
      </header>
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
                dot={
                  shown.length < 40 ? { r: 2, fill: 'var(--text-muted)', strokeWidth: 0 } : false
                }
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
  const shown = data.slice(-12);
  const values = shown.map((d) => d.delta);
  const top = Math.max(0, ...values);
  const bottom = Math.min(0, ...values);
  const pad = Math.max(0.1, (top - bottom) * 0.15);
  const toward = (delta: number) => (gaining ? delta >= 0 : delta <= 0);
  return (
    <section className="change-panel" aria-labelledby="change-title">
      <header className="trend-head">
        <h2 id="change-title" className="panel-title">
          Cambio semanal
        </h2>
        <span className="panel-note">Media de cada semana frente a la anterior</span>
      </header>
      <div style={{ height }}>
        {shown.length === 0 ? (
          <p className="chart-empty">Hace falta más de una semana con registros.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shown} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={grid} />
              <XAxis dataKey="week" tick={tick} tickLine={false} axisLine={false} />
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
                formatter={(v) => [
                  `${Number(v) > 0 ? '+' : ''}${Number(v).toFixed(2)} kg`,
                  'Cambio',
                ]}
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
    </section>
  );
}
