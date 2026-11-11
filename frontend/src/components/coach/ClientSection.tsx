import type { ReactNode } from 'react';
import type { WeekSummary } from '../../types/api';
import { formatCoachDate } from '../../lib/coach/api';

const numFmt = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });
export const num = (value: number | null | undefined, unit = '') =>
  value == null || !Number.isFinite(value) ? 'Sin datos' : `${numFmt.format(value)}${unit}`;

export function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card">
      <h2 className="card-title flex items-center gap-2">
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>
      <div className="text-lg font-bold text-foreground">{value}</div>
    </div>
  );
}

export function QueryState({ isLoading, isError }: { isLoading: boolean; isError: boolean }) {
  if (isLoading) return <p style={{ color: 'var(--text-secondary)' }}>Cargando…</p>;
  if (isError) return <p role="alert">No se pudieron cargar estos datos.</p>;
  return null;
}

export function WeeklyList({ weeks, unit }: { weeks: WeekSummary[]; unit: string }) {
  const recent = weeks.slice(-6).reverse();
  if (recent.length === 0) return <p style={{ color: 'var(--text-secondary)' }}>Sin registros.</p>;
  return (
    <ul className="flex flex-col gap-1">
      {recent.map((week) => (
        <li key={week.weekStart} className="flex justify-between gap-2">
          <span style={{ color: 'var(--text-secondary)' }}>
            Semana del {formatCoachDate(week.weekStart)}
          </span>
          <span className="text-foreground">{num(week.average, unit)}</span>
        </li>
      ))}
    </ul>
  );
}
