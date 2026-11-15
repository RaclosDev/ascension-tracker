import type { TodayDay } from '@/lib/coach/today';
import { prescribedSet } from '@/lib/coach/prescription';
import { matchVariant } from '@/lib/workout/format';
import type { CompletedWorkout, Exercise, WorkoutSet } from '@/lib/workout/types';
import { TechniqueVideoLink } from '../workout/TechniqueVideo';
import { WorkoutExerciseDetail } from '../workout/WorkoutExerciseDetail';
import '../../styles/coach-workout-comparison.css';

type Target = ReturnType<typeof prescribedSet>;

function number(value?: string) {
  return value?.trim() ? Number(value.replace(',', '.')) : NaN;
}

function recordedEffort(set?: WorkoutSet) {
  return set?.rir?.trim()
    ? { kind: 'RIR', value: set.rir }
    : set?.rpe?.trim()
      ? { kind: 'RPE', value: set.rpe }
      : null;
}

function effortValue(
  effort: { kind: string; value: number | string } | null | undefined,
  heading: string,
) {
  if (!effort) return '—';
  return effort.kind === heading ? String(effort.value) : `${effort.kind} ${effort.value}`;
}

function RecordedValue({ value, changed }: { value: string; changed: boolean }) {
  if (!changed) return value || '—';
  return (
    <mark
      className="coach-workout-difference"
      title={value && value !== '—' ? 'Distinto de lo pautado' : 'Sin registrar'}
    >
      {value && value !== '—' ? value : 'Sin dato'}
      <span className="sr-only"> (distinto de lo pautado)</span>
    </mark>
  );
}

function ComparisonRow({
  target,
  actual,
  index,
  effortHeading,
  cardio,
}: {
  target?: Target;
  actual?: WorkoutSet;
  index: number;
  effortHeading: string | null;
  cardio: boolean;
}) {
  const effort = recordedEffort(actual);
  const reps = number(actual?.reps);
  const targetLoad =
    target?.weight != null && target.loadLabel === `${target.weight} kg`
      ? target.weight
      : target?.loadLabel;
  const status = !actual
    ? 'Sin registrar'
    : !actual.completed
      ? 'Sin completar'
      : !target
        ? 'Serie añadida'
        : null;
  const kind =
    target?.kindLabel ??
    (actual?.type === 'warmup'
      ? 'Calentamiento'
      : actual?.type === 'drop'
        ? 'Descendente'
        : actual?.type === 'failure'
          ? 'Al fallo'
          : null);
  const setNote = target?.notes?.trim();
  const skipReason = !actual?.completed && actual?.skipReason?.trim();
  return (
    <>
      <tr>
        <th scope="row">
          <span className="coach-workout-series-number">{index + 1}</span>
          {kind && <small>{kind}</small>}
        </th>
        <td>{targetLoad ?? '—'}</td>
        <td>{target?.repsLabel ?? '—'}</td>
        {effortHeading && <td>{effortValue(target?.effort, effortHeading)}</td>}
        {actual?.completed ? (
          <>
            <td className="coach-workout-recorded-start">
              <RecordedValue
                value={cardio ? (actual.distance ?? '') : actual.weight}
                changed={target?.weight != null && number(actual.weight) !== target.weight}
              />
              {status && <small className="coach-workout-difference">{status}</small>}
            </td>
            <td>
              <RecordedValue
                value={cardio ? (actual.duration ?? '') : actual.reps}
                changed={
                  target?.min != null &&
                  (!Number.isFinite(reps) || reps < target.min || reps > (target.max ?? target.min))
                }
              />
            </td>
            {effortHeading && (
              <td>
                <RecordedValue
                  value={effortValue(effort, effortHeading)}
                  changed={
                    target?.effort != null &&
                    (effort?.kind !== target.effort.kind ||
                      number(effort?.value) !== target.effort.value)
                  }
                />
              </td>
            )}
          </>
        ) : (
          <td colSpan={effortHeading ? 3 : 2} className="coach-workout-recorded-start">
            <span className="coach-workout-difference">{status}</span>
          </td>
        )}
      </tr>
      {(setNote || skipReason) && (
        <tr className="coach-workout-set-notes">
          <td colSpan={effortHeading ? 7 : 5}>
            <dl className="coach-workout-notes">
              {setNote && (
                <div>
                  <dt>Nota del entrenador · Serie {index + 1}</dt>
                  <dd>{setNote}</dd>
                </div>
              )}
              {skipReason && (
                <div>
                  <dt>Motivo del atleta · Serie {index + 1}</dt>
                  <dd>{skipReason}</dd>
                </div>
              )}
            </dl>
          </td>
        </tr>
      )}
    </>
  );
}

export function WorkoutComparison({
  workout,
  plan,
  catalog,
}: {
  workout: CompletedWorkout;
  plan: TodayDay;
  catalog: Map<string, Exercise>;
}) {
  const unmatched = [...workout.exercises];
  const exercises = plan.exercises.map((target) => {
    const index = unmatched.findIndex(
      (exercise) =>
        exercise.exerciseId === target.exerciseId &&
        matchVariant(exercise.variant, {
          grip: target.variantGrip,
          machine: target.variantMachine,
        }),
    );
    const recorded = index < 0 ? undefined : unmatched.splice(index, 1)[0];
    return { target, recorded };
  });
  const comparisons = [
    ...exercises,
    ...unmatched.map((recorded) => ({ target: undefined, recorded })),
  ];

  const groups = comparisons.map(({ target, recorded }, index) => {
    const id = target?.exerciseId ?? recorded?.exerciseId ?? '';
    const meta = catalog.get(id);
    const name = target?.exerciseName ?? meta?.name ?? 'Ejercicio';
    const variant = target
      ? { grip: target.variantGrip ?? undefined, machine: target.variantMachine ?? undefined }
      : recorded?.variant;
    const warmups = recorded?.sets.filter((set) => set.type === 'warmup') ?? [];
    const work = recorded?.sets.filter((set) => set.type !== 'warmup') ?? [];
    const rows: { target?: Target; actual?: WorkoutSet }[] = target
      ? Array.from({ length: target.sets }, (_, i) => {
          const expected = prescribedSet(target, i);
          return { target: expected, actual: (expected.warmup ? warmups : work).shift() };
        })
      : [];
    const paired = new Set(rows.map(({ actual }) => actual?.id));
    for (const actual of recorded?.sets ?? []) {
      if (!paired.has(actual.id)) rows.push({ actual });
    }
    const cardio =
      rows.some(({ actual }) => actual?.distance || actual?.duration) &&
      !rows.some(
        ({ actual, target }) =>
          actual?.weight || actual?.reps || target?.weight != null || target?.min != null,
      );
    const methods = new Set<string>();
    for (const { target, actual } of rows) {
      if (target?.effort) methods.add(target.effort.kind);
      const effort = recordedEffort(actual);
      if (effort) methods.add(effort.kind);
    }
    return {
      key: recorded?.id ?? `target-${index}`,
      target,
      recorded,
      name,
      meta,
      variant,
      rows,
      cardio,
      effortHeading: methods.size > 1 ? 'Esfuerzo' : ([...methods][0] ?? null),
    };
  });
  const sessionPlanNote = plan.notes?.trim();
  const sessionWorkoutNote = workout.notes?.trim();

  return (
    <div className="coach-workout-comparison">
      {(sessionPlanNote || sessionWorkoutNote) && (
        <dl className="coach-workout-notes coach-workout-session-notes">
          {sessionPlanNote && (
            <div>
              <dt>Nota del entrenador</dt>
              <dd>{sessionPlanNote}</dd>
            </div>
          )}
          {sessionWorkoutNote && (
            <div>
              <dt>Comentario del atleta</dt>
              <dd>{sessionWorkoutNote}</dd>
            </div>
          )}
        </dl>
      )}
      <p className="coach-workout-comparison-legend">
        <mark className="coach-workout-difference">Diferencia con la pauta</mark>
      </p>
      {groups.map(({ key, target, recorded, name, meta, variant, rows, cardio, effortHeading }) => {
        const columnCount = effortHeading ? 3 : 2;
        const headings = [cardio ? 'Km' : 'Kg', cardio ? 'Tiempo' : 'Reps'];
        if (effortHeading) headings.push(effortHeading);
        const planNote = target?.notes?.trim();
        const workoutNote = recorded?.notes?.trim();
        return (
          <WorkoutExerciseDetail
            key={key}
            heading="h2"
            className="card"
            name={name}
            imageUrl={meta?.gifUrl}
            variant={variant}
            superset={Boolean(recorded?.supersetId)}
          >
            <div className="coach-workout-comparison-table">
              <table className="coach-table">
                <caption className="sr-only">Series de {name}</caption>
                <colgroup>
                  <col className="coach-workout-comparison-series" />
                </colgroup>
                <colgroup span={columnCount} />
                <colgroup span={columnCount} />
                <thead>
                  <tr>
                    <th scope="col" rowSpan={2}>
                      Serie
                    </th>
                    <th scope="colgroup" colSpan={columnCount}>
                      Pautado
                    </th>
                    <th
                      scope="colgroup"
                      colSpan={columnCount}
                      className="coach-workout-recorded-start"
                    >
                      Registrado
                    </th>
                  </tr>
                  <tr>
                    {['pautado', 'registrado'].flatMap((group) =>
                      headings.map((label, index) => (
                        <th
                          scope="col"
                          key={`${group}-${label}`}
                          className={
                            group === 'registrado' && index === 0
                              ? 'coach-workout-recorded-start'
                              : undefined
                          }
                        >
                          {label}
                        </th>
                      )),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ target, actual }, i) => (
                    <ComparisonRow
                      key={actual?.id ?? i}
                      target={target}
                      actual={actual}
                      index={i}
                      effortHeading={effortHeading}
                      cardio={cardio}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            {(planNote || workoutNote) && (
              <dl className="coach-workout-notes coach-workout-exercise-notes">
                {planNote && (
                  <div>
                    <dt>Nota del entrenador</dt>
                    <dd>{planNote}</dd>
                  </div>
                )}
                {workoutNote && (
                  <div>
                    <dt>Nota del atleta</dt>
                    <dd>{workoutNote}</dd>
                  </div>
                )}
              </dl>
            )}
            {recorded && <TechniqueVideoLink exercise={recorded} />}
          </WorkoutExerciseDetail>
        );
      })}
    </div>
  );
}
