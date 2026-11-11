import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import api from '@/api/client';
import type { UserSettings, WeightEntry } from '@/types/api';
import { useRecentWorkouts } from '@/lib/workout/api';
import { bestLifts, dotsScore, LIFT_LABELS, type Lift } from '@/lib/powerlifting';
import { QueryErrorNotice } from '../QueryErrorNotice';

const LIFTS: Lift[] = ['squat', 'bench', 'deadlift'];

const formatKg = (kg: number) => `${kg.toLocaleString('es-ES', { maximumFractionDigits: 1 })} kg`;

export function PowerliftingCard() {
  const history = useRecentWorkouts(365);
  const settings = useQuery<UserSettings | null>({
    queryKey: ['settings'],
    queryFn: () => api.get<UserSettings | null>('/settings').then((r) => r.data || null),
    staleTime: Infinity,
  });
  const weights = useQuery<WeightEntry[]>({
    queryKey: ['weights'],
    queryFn: () => api.get<WeightEntry[]>('/weights').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const best = useMemo(() => bestLifts(history.data ?? []), [history.data]);
  const hasAll = LIFTS.every((l) => best[l]);
  const total = hasAll ? LIFTS.reduce((sum, l) => sum + (best[l]?.e1rm ?? 0), 0) : 0;
  const latestWeight = weights.data
    ?.filter((w) => Number.isFinite(w.weight) && w.weight > 0)
    .reduce<WeightEntry | undefined>(
      (latest, entry) => (!latest || entry.date > latest.date ? entry : latest),
      undefined,
    );
  const bodyweight = latestWeight?.weight ?? settings.data?.startWeight;
  const dots =
    hasAll && weights.isSuccess && settings.isSuccess
      ? dotsScore(total, bodyweight, settings.data?.sex)
      : null;
  const anyLift = LIFTS.some((l) => best[l]);

  return (
    <section className="card" style={{ marginBottom: '1.5rem' }} aria-labelledby="power-title">
      <div className="flex items-baseline justify-between mb-3">
        <h3
          id="power-title"
          className="flex items-center gap-2"
          style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}
        >
          <Trophy className="size-4" aria-hidden /> Powerlifting
        </h3>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>1RM estimado</span>
      </div>
      {history.isPending ? (
        <p role="status">Cargando registros de fuerza…</p>
      ) : history.isError ? (
        <QueryErrorNotice pending={history.isFetching} retry={() => void history.refetch()} />
      ) : !anyLift ? (
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Registra sentadilla, press banca o peso muerto con barra para consultar las mejores
          estimaciones de fuerza de los últimos 365 días.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-2">
            {LIFTS.map((lift) => (
              <div key={lift} className="flex flex-col">
                <dt style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {LIFT_LABELS[lift]}
                </dt>
                <dd className="font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {best[lift] ? formatKg(best[lift].e1rm) : '—'}
                </dd>
                {best[lift] && (
                  <dd className="text-xs text-[var(--text-secondary)]">
                    {new Date(best[lift].date).toLocaleDateString('es-ES')}
                    {best[lift].actual !== null && (
                      <span className="block">Mejor single: {formatKg(best[lift].actual)}</span>
                    )}
                  </dd>
                )}
              </div>
            ))}
          </dl>
          <p
            className="mt-3 tabular-nums"
            style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}
          >
            {hasAll ? (
              <>
                Suma de estimaciones{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{formatKg(total)}</strong>
                {dots != null && (
                  <>
                    {' · '}DOTS estimado{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>{dots}</strong>
                  </>
                )}
              </>
            ) : (
              'Registra los tres básicos para comparar sus estimaciones.'
            )}
          </p>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            Últimos 365 días. Epley para series de 2 a 10 repeticiones; una repetición usa la carga
            realizada. La suma combina días distintos y no es un total de competición.
            {dots !== null &&
              ` DOTS usa ${formatKg(bodyweight!)} ${latestWeight ? `del ${new Date(`${latestWeight.date}T12:00:00`).toLocaleDateString('es-ES')}` : 'del peso inicial configurado'}.`}
          </p>
          {(weights.isError || settings.isError) && (
            <p className="mt-2 text-sm" role="status">
              No se pudieron cargar los datos para DOTS.{' '}
              <button
                className="underline min-h-11"
                onClick={() => {
                  if (weights.isError) void weights.refetch();
                  if (settings.isError) void settings.refetch();
                }}
              >
                Reintentar
              </button>
            </p>
          )}
        </>
      )}
    </section>
  );
}
