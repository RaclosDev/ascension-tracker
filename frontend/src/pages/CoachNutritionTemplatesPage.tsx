import { confirmAction } from '../lib/confirmation';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CoachPageHeader, CoachWorkspace } from '../components/coach/CoachWorkspace';
import { useDeleteNutritionTemplate, useNutritionTemplates } from '../lib/coach/nutritionTemplates';
import { apiErrorMessage, formatCoachDate } from '../lib/coach/api';

export default function CoachNutritionTemplatesPage() {
  const templates = useNutritionTemplates();
  const remove = useDeleteNutritionTemplate();
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const filtered = (templates.data ?? []).filter((item) =>
    item.name.toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es')),
  );
  return (
    <CoachWorkspace>
      <CoachPageHeader
        title="Biblioteca de pautas"
        description="Guarda pautas completas para copiarlas y adaptarlas desde la ficha de cada alumno."
      />
      <div className="flex flex-wrap gap-2">
        <Link className="btn btn-secondary" to="/entrenador/planificacion">
          Volver a Planificación
        </Link>
        <Link className="btn btn-primary" to="/entrenador/pautas/nueva">
          Crear pauta
        </Link>
      </div>
      <p>
        La biblioteca es privada. Editar o borrar una pauta no modifica las copias publicadas para
        tus alumnos.
      </p>
      <label className="flex flex-col gap-1">
        Buscar pauta
        <input
          type="search"
          className="form-input min-h-11"
          maxLength={120}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      {error && <p role="alert">{error}</p>}
      {templates.isPending ? (
        <p role="status">Cargando biblioteca…</p>
      ) : templates.isError ? (
        <div role="alert">
          No se pudo cargar la biblioteca.{' '}
          <button className="btn btn-secondary" onClick={() => void templates.refetch()}>
            Reintentar biblioteca
          </button>
        </div>
      ) : filtered.length ? (
        <div className="coach-resource-grid">
          {filtered.map((item) => (
            <article className="card min-w-0" key={item.id}>
              <h2 className="break-words">{item.name}</h2>
              <p>
                Entreno: {item.trainingKcal} kcal · Descanso: {item.restKcal} kcal
              </p>
              <p className="text-sm">Actualizada el {formatCoachDate(item.updatedAt)}</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  className="btn btn-secondary"
                  to={`/entrenador/pautas/${encodeURIComponent(item.id)}`}
                  aria-label={`Editar ${item.name}`}
                >
                  Editar pauta
                </Link>
                <button
                  className="btn btn-secondary"
                  disabled={remove.isPending}
                  aria-label={`Borrar ${item.name}`}
                  onClick={async () => {
                    if (
                      !(await confirmAction({
                        title: 'Borrar pauta de biblioteca',
                        description: `¿Borrar «${item.name}» de la biblioteca? Las pautas de tus alumnos se conservarán.`,
                        confirmLabel: 'Borrar pauta',
                        destructive: true,
                      }))
                    )
                      return;
                    setError(null);
                    remove.mutate(item, {
                      onError: (cause) => {
                        setError(apiErrorMessage(cause, 'No se pudo borrar la pauta.'));
                        void templates.refetch();
                      },
                    });
                  }}
                >
                  Borrar
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="card">
          <h2>{search.trim() ? 'Sin coincidencias' : 'Prepara tu primera pauta'}</h2>
          <p>
            {search.trim()
              ? 'Prueba con otro nombre.'
              : 'Define objetivos para entreno y descanso y añade comidas si las necesitas.'}
          </p>
        </section>
      )}
    </CoachWorkspace>
  );
}
