import { useState } from 'react';
import { formatCoachDate } from '@/lib/coach/api';
import { useNutritionPlanHistory, useNutritionPlanVersion } from '@/lib/coach/nutritionPlan';
import { NutritionPlanSummary } from './NutritionPlanSummary';

export function NutritionPlanHistory({ linkId }: { linkId: string }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const history = useNutritionPlanHistory(linkId, open);
  return (
    <section className="mt-4 border-t pt-4">
      <button
        type="button"
        className="btn btn-secondary"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        Historial de pautas
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-sm">
            Últimas 20 versiones de esta relación. Cada una conserva los objetivos y las comidas
            publicados.
          </p>
          {history.isPending && <p role="status">Cargando historial…</p>}
          {history.isError && (
            <div role="alert">
              No se pudo cargar el historial.{' '}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void history.refetch()}
              >
                Reintentar historial
              </button>
            </div>
          )}
          {history.data?.length === 0 && <p>No hay pautas publicadas.</p>}
          <ul className="flex flex-col gap-2">
            {history.data?.map((version) => (
              <li key={version.id} className="border rounded-lg p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p>
                      {formatCoachDate(version.createdAt)} ·{' '}
                      {version.status === 'ACTIVE' ? 'Activa' : 'Finalizada'}
                    </p>
                    <p className="text-sm">
                      Entreno {version.training.kcal} kcal · Descanso {version.rest.kcal} kcal
                    </p>
                    {version.endedAt && (
                      <p className="text-xs">Finalizada el {formatCoachDate(version.endedAt)}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    aria-expanded={selected === version.id}
                    onClick={() => setSelected(selected === version.id ? null : version.id)}
                  >
                    {selected === version.id ? 'Cerrar versión' : 'Ver versión'}
                  </button>
                </div>
                {selected === version.id && (
                  <Version key={version.id} linkId={linkId} planId={version.id} />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Version({ linkId, planId }: { linkId: string; planId: string }) {
  const version = useNutritionPlanVersion(linkId, planId);
  if (version.isPending) return <p role="status">Cargando versión…</p>;
  if (version.isError)
    return (
      <div role="alert">
        No se pudo cargar esta versión.{' '}
        <button type="button" className="btn btn-secondary" onClick={() => void version.refetch()}>
          Reintentar versión
        </button>
      </div>
    );
  return (
    <div className="mt-3">
      <NutritionPlanSummary plan={version.data} />
    </div>
  );
}
