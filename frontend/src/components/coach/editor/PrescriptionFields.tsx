import type { PrescribedLoad, ProgramExercise, SetTarget } from '@/lib/coach/coachPrograms';

const SET_KINDS = {
  WORK: 'Trabajo',
  WARMUP: 'Calentamiento',
  TOP: 'Top set',
  BACKOFF: 'Back-off',
};
const number = (s: string) => (s === '' ? null : Number(s));
function LoadFields({
  value,
  onChange,
}: {
  value?: PrescribedLoad | null;
  onChange: (value: PrescribedLoad | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-xs">
        Tipo de carga
        <select
          value={value?.mode ?? 'TEXT'}
          onChange={(e) =>
            onChange(
              e.target.value === 'TEXT'
                ? null
                : {
                    mode: e.target.value as PrescribedLoad['mode'],
                    amount: 0,
                    unit: value?.unit ?? 'TOTAL',
                    ...(e.target.value === 'PERCENT_TM' ? { lift: 'squat', increment: 2.5 } : {}),
                  },
            )
          }
        >
          <option value="TEXT">Texto libre</option>
          <option value="KG">kg</option>
          <option value="PERCENT_TM">% del TM</option>
        </select>
      </label>
      {value && (
        <>
          <label className="text-xs">
            {value.mode === 'KG' ? 'Carga (kg)' : 'Porcentaje del TM'}
            <input
              className="w-24"
              type="number"
              min={0}
              max={value.mode === 'KG' ? 2000 : 200}
              step={0.25}
              value={value.amount}
              onChange={(e) =>
                onChange({
                  ...value,
                  amount: Number(e.target.value),
                  resolvedKg: null,
                  referenceKg: null,
                  referenceDate: null,
                })
              }
            />
          </label>
          <label className="text-xs">
            Unidad
            <select
              value={value.unit}
              onChange={(e) =>
                onChange({ ...value, unit: e.target.value as PrescribedLoad['unit'] })
              }
            >
              <option value="TOTAL">Peso total</option>
              <option value="EACH">Por mancuerna / lado</option>
            </select>
          </label>
          {value.mode === 'PERCENT_TM' && (
            <>
              <label className="text-xs">
                Referencia
                <select
                  value={value.lift ?? 'squat'}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      lift: e.target.value as PrescribedLoad['lift'],
                      resolvedKg: null,
                      referenceKg: null,
                      referenceDate: null,
                    })
                  }
                >
                  <option value="squat">TM sentadilla</option>
                  <option value="bench">TM banca</option>
                  <option value="deadlift">TM peso muerto</option>
                </select>
              </label>
              <label className="text-xs">
                Redondeo (kg)
                <input
                  className="w-24"
                  type="number"
                  min={0.25}
                  max={20}
                  step={0.25}
                  value={value.increment ?? 2.5}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      increment: Number(e.target.value),
                      resolvedKg: null,
                      referenceKg: null,
                      referenceDate: null,
                    })
                  }
                />
              </label>
              <p className="text-xs basis-full">
                Al publicar se usa el TM del alumno y se guarda la referencia utilizada.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
export function PrescriptionFields({
  exercise,
  onChange,
}: {
  exercise: ProgramExercise;
  onChange: (value: ProgramExercise) => void;
}) {
  const detailed = !!exercise.prescription?.sets?.length;
  const setLoad = (load: PrescribedLoad | null) =>
    onChange({ ...exercise, prescription: { ...exercise.prescription, load } });
  const setRows = (sets: SetTarget[] | null) =>
    onChange({ ...exercise, prescription: { ...exercise.prescription, sets } });
  return (
    <div className="flex flex-col gap-3">
      <LoadFields value={exercise.prescription?.load} onChange={setLoad} />
      {!exercise.prescription?.load && (
        <label className="text-xs">
          Carga indicada en texto
          <input
            maxLength={60}
            value={exercise.loadHint ?? ''}
            placeholder="Por ejemplo: mancuerna ligera"
            onChange={(e) => onChange({ ...exercise, loadHint: e.target.value || null })}
          />
        </label>
      )}
      <label className="flex gap-2 items-center text-sm">
        <input
          type="checkbox"
          checked={detailed}
          onChange={(e) =>
            setRows(
              e.target.checked
                ? Array.from({ length: exercise.sets }, () => ({
                    kind: 'WORK',
                    reps: exercise.repsMin ?? exercise.repsMax,
                    rpe: exercise.targetRpe,
                    rir: exercise.targetRpe == null ? exercise.targetRir : null,
                    load: null,
                  }))
                : null,
            )
          }
        />
        Diferenciar calentamiento, top set y back-offs
      </label>
      {detailed && (
        <ol className="flex flex-col gap-2" aria-label="Pauta por serie">
          {exercise.prescription?.sets?.map((set, i) => {
            const update = (patch: Partial<SetTarget>) =>
              setRows(
                exercise.prescription?.sets?.map((s, n) => (n === i ? { ...s, ...patch } : s)) ??
                  [],
              );
            return (
              <li
                key={i}
                className="border rounded p-2 flex flex-col gap-2"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex flex-wrap gap-2 items-end">
                  <strong>Serie {i + 1}</strong>
                  <label className="text-xs">
                    Tipo
                    <select
                      value={set.kind}
                      onChange={(e) => update({ kind: e.target.value as SetTarget['kind'] })}
                    >
                      {Object.entries(SET_KINDS).map(([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs">
                    Reps
                    <input
                      className="w-20"
                      type="number"
                      min={1}
                      max={100}
                      value={set.reps ?? ''}
                      onChange={(e) => update({ reps: number(e.target.value) })}
                    />
                  </label>
                  <label className="text-xs">
                    Esfuerzo
                    <select
                      value={set.rir != null ? 'RIR' : 'RPE'}
                      onChange={(e) =>
                        update(
                          e.target.value === 'RIR' ? { rir: 2, rpe: null } : { rpe: 8, rir: null },
                        )
                      }
                    >
                      <option>RPE</option>
                      <option>RIR</option>
                    </select>
                  </label>
                  <label className="text-xs">
                    {set.rir != null ? 'RIR' : 'RPE'}
                    <input
                      className="w-20"
                      type="number"
                      min={set.rir != null ? 0 : 1}
                      max={10}
                      step={set.rir != null ? 1 : 0.5}
                      value={set.rir ?? set.rpe ?? ''}
                      onChange={(e) =>
                        update(
                          set.rir != null
                            ? { rir: number(e.target.value) }
                            : { rpe: number(e.target.value) },
                        )
                      }
                    />
                  </label>
                </div>
                <LoadFields value={set.load} onChange={(load) => update({ load })} />
                {!set.load && <p className="text-xs">Usa la carga general del ejercicio.</p>}
                <label className="text-xs">
                  Indicación de esta serie
                  <input
                    maxLength={500}
                    value={set.notes ?? ''}
                    onChange={(e) => update({ notes: e.target.value })}
                  />
                </label>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
