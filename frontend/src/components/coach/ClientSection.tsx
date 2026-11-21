import type { ReactNode } from 'react';

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
