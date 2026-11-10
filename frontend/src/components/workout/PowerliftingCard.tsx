import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import api from '@/api/client';
import type { UserSettings, WeightEntry } from '@/types/api';
import { useRecentWorkouts } from '@/lib/workout/api';
import { bestLifts, dotsScore, LIFT_LABELS, type Lift } from '@/lib/powerlifting';

const LIFTS: Lift[] = ['squat', 'bench', 'deadlift'];

const formatKg = (kg: number) => `${kg.toLocaleString('es-ES', { maximumFractionDigits: 1 })} kg`;

/** Mejores marcas estimadas en los tres básicos del último año, su total y los DOTS. */
export function PowerliftingCard() {
  const { data: history = [] } = useRecentWorkouts(365);
  const { data: settings } = useQuery<UserSettings | null>({
    queryKey: ['settings'],
    queryFn: () => api.get<UserSettings | null>('/settings').then((r) => r.data || null),
    staleTime: Infinity,
  });
  const { data: weights } = useQuery<WeightEntry[]>({
    queryKey: ['weights'],
    queryFn: () => api.get<WeightEntry[]>('/weights').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const best = useMemo(() => bestLifts(history), [history]);
  const hasAll = LIFTS.every((l) => best[l]);
  const total = hasAll ? LIFTS.reduce((sum, l) => sum + (best[l]?.e1rm ?? 0), 0) : 0;
  const bodyweight = weights?.at(-1)?.weight ?? settings?.startWeight;
  const dots = hasAll ? dotsScore(total, bodyweight, settings?.sex) : null;
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
      {!anyLift ? (
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Registra sentadilla, press banca o peso muerto con barra y aquí verás tu 1RM estimado, tu
          total y tus puntos DOTS.
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
              </div>
            ))}
          </dl>
          <p
            className="mt-3 tabular-nums"
            style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}
          >
            {hasAll ? (
              <>
                Total <strong style={{ color: 'var(--text-primary)' }}>{formatKg(total)}</strong>
                {dots != null && (
                  <>
                    {' · '}DOTS <strong style={{ color: 'var(--text-primary)' }}>{dots}</strong>
                  </>
                )}
              </>
            ) : (
              'Registra los tres básicos para ver tu total y tus DOTS.'
            )}
          </p>
        </>
      )}
    </section>
  );
}
