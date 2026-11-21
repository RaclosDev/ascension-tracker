import { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { WeightEntry } from '../../../types/api';

const DAY = 86_400_000;
const kg = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
const day = (t: number) => format(t, 'd MMM', { locale: es });

/** Every weigh-in as a faint dot, and the 7-day average as the line that tells the trend. */
export default function MetricsWeightChart({ entries }: { entries: WeightEntry[] }) {
  const data = useMemo(() => {
    const points = [...entries]
      .map((e) => ({ t: new Date(e.date + 'T00:00:00').getTime(), weight: e.weight }))
      .sort((a, b) => a.t - b.t);
    return points.map((p) => {
      const week = points.filter((q) => q.t <= p.t && q.t > p.t - 7 * DAY);
      return { ...p, avg: week.reduce((sum, q) => sum + q.weight, 0) / week.length };
    });
  }, [entries]);
  const weights = data.map((p) => p.weight);
  const lo = Math.floor(Math.min(...weights) - 0.3);
  const hi = Math.ceil(Math.max(...weights) + 0.3);
  const step = Math.max(1, Math.ceil((hi - lo) / 5));
  const ticks = Array.from({ length: Math.floor((hi - lo) / step) + 1 }, (_, i) => lo + i * step);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          tickFormatter={day}
          tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          minTickGap={28}
        />
        <YAxis
          domain={[lo, ticks.at(-1) ?? hi]}
          ticks={ticks}
          tickFormatter={(v: number) => kg.format(v)}
          tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip
          cursor={{ stroke: 'var(--border-medium)' }}
          content={({ active, payload }) => {
            const point = active && payload?.[0]?.payload;
            if (!point) return null;
            return (
              <div className="metrics-tip">
                <span>{format(point.t, "EEEE d 'de' MMM", { locale: es })}</span>
                <strong>{kg.format(point.weight)} kg</strong>
                <small>Media 7 días · {kg.format(point.avg)} kg</small>
              </div>
            );
          }}
        />
        <Line
          dataKey="weight"
          stroke="none"
          isAnimationActive={false}
          dot={{ r: 2.5, fill: 'var(--text-secondary)', strokeWidth: 0, fillOpacity: 0.55 }}
          activeDot={{ r: 4, fill: 'var(--text-primary)', strokeWidth: 0 }}
        />
        <Line
          dataKey="avg"
          type="monotone"
          stroke="var(--accent-primary)"
          strokeWidth={2.5}
          dot={false}
          activeDot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
