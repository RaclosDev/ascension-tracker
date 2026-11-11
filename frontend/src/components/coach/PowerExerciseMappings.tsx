import { useState } from 'react';
import { useClientData, useClientCustomExercises } from '@/lib/coach/api';
import { POWER_LABELS, POWER_LIFTS, type PowerExerciseMapping } from '@/lib/coach/powerlifting';
import { useExerciseCatalog, BASE_EXERCISES } from '@/lib/workout/exercises';
import type { CompletedWorkout } from '@/lib/workout/types';

export function PowerExerciseMappings({
  linkId,
  value,
  onChange,
}: {
  linkId: string;
  value: PowerExerciseMapping[];
  onChange: (value: PowerExerciseMapping[]) => void;
}) {
  const [since] = useState(() => Date.now() - 364 * 86400000);
  const query = useClientData<CompletedWorkout[]>(linkId, `workouts/recent?since=${since}`, true);
  const catalog = useExerciseCatalog();
  const custom = useClientCustomExercises(linkId);
  const rows = [
    ...new Map(
      (query.data ?? [])
        .flatMap((w) => w.exercises)
        .map((e) => [
          JSON.stringify([e.exerciseId, e.variant?.grip ?? '', e.variant?.machine ?? '']),
          e,
        ]),
    ).values(),
  ];
  return (
    <details>
      <summary className="cursor-pointer font-semibold">
        Clasificar ejercicios y variantes para S/B/D
      </summary>
      <p className="coach-description">
        Clasifica tus ejercicios personalizados y variantes registrados. Las variantes quedan fuera
        de las marcas de competición salvo que actives su filtro en Seguimiento.
      </p>
      {query.isPending && <p>Cargando ejercicios registrados…</p>}
      {query.isError && (
        <p role="alert">
          No se pudieron cargar los ejercicios.{' '}
          <button type="button" onClick={() => void query.refetch()}>
            Reintentar
          </button>
        </p>
      )}
      {!query.isPending && !query.isError && !rows.length && (
        <p>Las variantes aparecerán cuando el alumno registre entrenamientos.</p>
      )}
      <div className="flex flex-col gap-2 mt-3">
        {rows.map((row) => {
          const matches = (m: PowerExerciseMapping) =>
            m.exerciseId === row.exerciseId &&
            (m.grip ?? '') === (row.variant?.grip ?? '') &&
            (m.machine ?? '') === (row.variant?.machine ?? '');
          const mapping = value.find(matches);
          const name =
            [...(custom.data ?? []), ...BASE_EXERCISES, ...(catalog.data ?? [])].find(
              (e) => e.id === row.exerciseId,
            )?.name ?? row.exerciseId;
          return (
            <label className="flex flex-wrap justify-between gap-2" key={row.id}>
              <span>
                {name}
                {row.variant?.grip && ` · ${row.variant.grip}`}
                {row.variant?.machine && ` · ${row.variant.machine}`}
              </span>
              <select
                value={mapping ? `${mapping.lift}:${mapping.kind}` : 'AUTO'}
                onChange={(event) => {
                  const [lift, kind] = event.target.value.split(':');
                  const rest = value.filter((m) => !matches(m));
                  onChange(
                    event.target.value === 'AUTO'
                      ? rest
                      : [
                          ...rest,
                          {
                            exerciseId: row.exerciseId,
                            grip: row.variant?.grip ?? null,
                            machine: row.variant?.machine ?? null,
                            lift: lift as PowerExerciseMapping['lift'],
                            kind: kind as PowerExerciseMapping['kind'],
                          },
                        ],
                  );
                }}
              >
                <option value="AUTO">Clasificación del catálogo</option>
                {POWER_LIFTS.flatMap((lift) =>
                  (['COMPETITION', 'VARIATION'] as const).map((kind) => (
                    <option key={`${lift}:${kind}`} value={`${lift}:${kind}`}>
                      {POWER_LABELS[lift]} · {kind === 'COMPETITION' ? 'competición' : 'variante'}
                    </option>
                  )),
                )}
                <option value="SQUAT:EXCLUDE">Excluir de S/B/D</option>
              </select>
            </label>
          );
        })}
      </div>
    </details>
  );
}
