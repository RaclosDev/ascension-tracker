import type { CompletedWorkout } from '@/lib/workout/types';
import type { ProgramExercise } from '@/lib/coach/coachPrograms';
import { TechniqueVideoLink } from '../workout/TechniqueVideo';

export function WorkoutReview({
  workout,
  exerciseName,
  prescribed = [],
}: {
  workout: CompletedWorkout;
  exerciseName: (id: string) => string;
  prescribed?: ProgramExercise[];
}) {
  const sets = workout.exercises.flatMap((exercise) => exercise.sets);
  const done = sets.filter((set) => set.completed);
  const effort = done.filter((set) => set.rpe?.trim() || set.rir?.trim());
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        {done.length}/{sets.length} series completadas · Esfuerzo registrado en {effort.length}/
        {done.length} series
      </p>
      {workout.notes && (
        <blockquote className="border-l-2 pl-3 whitespace-pre-wrap">
          <strong>Comentario del atleta</strong>
          <p>{workout.notes}</p>
        </blockquote>
      )}
      {done.length < sets.length && (
        <p className="text-sm">
          Hay series sin completar. Consulta las notas del atleta antes de ajustar la carga.
        </p>
      )}
      {workout.exercises.map((exercise, index) => {
        const matches = prescribed.filter(
          (p) =>
            p.exerciseId === exercise.exerciseId &&
            (p.variantGrip ?? '') === (exercise.variant?.grip ?? '') &&
            (p.variantMachine ?? '') === (exercise.variant?.machine ?? ''),
        );
        const target = matches.length === 1 ? matches[0] : undefined;
        return (
          <section key={exercise.id} className="min-w-0">
            <h5 className="font-bold">
              {index + 1}. {target?.exerciseName ?? exerciseName(exercise.exerciseId)}
            </h5>
            <TechniqueVideoLink exercise={exercise} />
            {exercise.notes && (
              <p className="text-sm whitespace-pre-wrap my-2">
                <strong>Notas del ejercicio:</strong> {exercise.notes}
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <caption className="sr-only">Series de {exerciseName(exercise.exerciseId)}</caption>
                <thead>
                  <tr>
                    <th scope="col">Serie</th>
                    <th scope="col">Carga</th>
                    <th scope="col">Reps</th>
                    <th scope="col">Esfuerzo</th>
                    <th scope="col">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {exercise.sets.map((set, i) => {
                    const rir = !!set.rir?.trim();
                    const actual = rir ? Number(set.rir) : set.rpe?.trim() ? Number(set.rpe) : NaN;
                    const detailed = target?.prescription?.sets;
                    const targetSet =
                      detailed?.length === exercise.sets.length ? detailed[i] : undefined;
                    const expected = detailed?.length
                      ? rir
                        ? targetSet?.rir
                        : targetSet?.rpe
                      : rir
                        ? target?.targetRir
                        : target?.targetRpe;
                    const delta =
                      set.completed &&
                      set.type !== 'warmup' &&
                      expected != null &&
                      Number.isFinite(actual)
                        ? actual - expected
                        : null;
                    return (
                      <tr
                        key={set.id}
                        className="border-t"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        <th scope="row" className="py-2 font-normal">
                          {i + 1}
                          {set.type === 'warmup'
                            ? ' · calentamiento'
                            : set.type === 'drop'
                              ? ' · descendente'
                              : set.type === 'failure'
                                ? ' · fallo'
                                : ''}
                        </th>
                        <td>{set.weight ? `${set.weight} kg` : '—'}</td>
                        <td>{set.reps || '—'}</td>
                        <td>
                          {rir ? `RIR ${set.rir}` : set.rpe ? `RPE ${set.rpe}` : '—'}
                          {delta != null && delta !== 0 && (
                            <span className="block" style={{ color: 'var(--color-warning)' }}>
                              {delta > 0 ? '+' : ''}
                              {delta} vs pautado
                            </span>
                          )}
                        </td>
                        <td>
                          {set.completed ? 'Completada' : 'Sin completar'}
                          {!set.completed && set.skipReason && (
                            <p className="text-xs whitespace-pre-wrap">{set.skipReason}</p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
