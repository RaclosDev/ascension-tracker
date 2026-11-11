import { useState } from 'react';
import type { Program } from '@/lib/coach/coachPrograms';
import { adjustProgram, type DoseAdjustment } from '@/lib/coach/bulkPrescription';
import { PrescriptionSummary } from '../PrescriptionSummary';

const INITIAL: DoseAdjustment = {
  day: null,
  exerciseId: null,
  kg: 0,
  percent: 0,
  reps: 0,
  rpe: 0,
  rir: 0,
};
export function BulkPrescription({
  program,
  onChange,
}: {
  program: Program;
  onChange: (program: Program) => void;
}) {
  const [delta, setDelta] = useState(INITIAL);
  const [preview, setPreview] = useState(false);
  const next = adjustProgram(program, delta);
  const changed = next.days.flatMap((day, di) =>
    day.exercises.flatMap((exercise, ei) =>
      JSON.stringify(exercise) !== JSON.stringify(program.days[di].exercises[ei])
        ? [
            {
              day: day.name,
              before: program.days[di].exercises[ei],
              after: exercise,
              key: `${di}:${ei}`,
            },
          ]
        : [],
    ),
  );
  const exercises = [
    ...new Map(program.days.flatMap((d) => d.exercises).map((e) => [e.exerciseId, e])).values(),
  ];
  const edit = (patch: Partial<DoseAdjustment>) => {
    setDelta({ ...delta, ...patch });
    setPreview(false);
  };
  return (
    <details className="card">
      <summary className="cursor-pointer font-semibold">Ajustar varias pautas a la vez</summary>
      <div className="flex flex-wrap gap-3 mt-3">
        <label>
          Sesión
          <select
            value={delta.day ?? ''}
            onChange={(e) => edit({ day: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">Todas las sesiones</option>
            {program.days.map((d) => (
              <option key={d.dayIndex} value={d.dayIndex}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ejercicio
          <select
            value={delta.exerciseId ?? ''}
            onChange={(e) => edit({ exerciseId: e.target.value || null })}
          >
            <option value="">Todos los ejercicios</option>
            {exercises.map((e) => (
              <option key={e.exerciseId} value={e.exerciseId}>
                {e.exerciseName}
              </option>
            ))}
          </select>
        </label>
        {(
          [
            { key: 'kg', label: 'Cambio de kg', step: 0.25 },
            { key: 'percent', label: 'Cambio de puntos % TM', step: 0.5 },
            { key: 'reps', label: 'Cambio de reps', step: 1 },
            { key: 'rpe', label: 'Cambio de RPE', step: 0.5 },
            { key: 'rir', label: 'Cambio de RIR', step: 1 },
          ] as const
        ).map((field) => (
          <label key={field.key}>
            {field.label}
            <input
              className="w-24"
              type="number"
              min={-100}
              max={100}
              step={field.step}
              value={delta[field.key]}
              onChange={(e) => edit({ [field.key]: Number(e.target.value) })}
            />
          </label>
        ))}
      </div>
      <p className="text-sm mt-2">
        Solo cambia valores ya pautados; el texto libre y los campos vacíos se conservan. Se
        respetan los límites de cada campo. Los porcentajes se recalculan con el TM al publicar.
      </p>
      <button
        type="button"
        className="btn btn-secondary mt-2"
        disabled={
          !Object.entries(delta).some(
            ([key, value]) => !['day', 'exerciseId'].includes(key) && value !== 0,
          )
        }
        onClick={() => setPreview(true)}
      >
        Previsualizar ajustes
      </button>
      {preview && (
        <div className="mt-3">
          <p>{changed.length} ejercicios con cambios</p>
          <div className="overflow-auto max-h-96">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Ejercicio</th>
                  <th>Antes</th>
                  <th>Después</th>
                </tr>
              </thead>
              <tbody>
                {changed.map((row) => (
                  <tr key={row.key}>
                    <th className="text-left p-2">
                      {row.day}
                      <br />
                      {row.after.exerciseName}
                    </th>
                    <td className="p-2">
                      <PrescriptionSummary exercise={row.before} />
                    </td>
                    <td className="p-2">
                      <PrescriptionSummary exercise={row.after} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="btn btn-primary mt-2"
            disabled={!changed.length}
            onClick={() => {
              onChange(next);
              setDelta(INITIAL);
              setPreview(false);
            }}
          >
            Aplicar al borrador
          </button>
        </div>
      )}
    </details>
  );
}
