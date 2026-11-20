import { Dumbbell, MessageSquareQuote } from 'lucide-react';
import type { CompletedWorkout, WorkoutExercise, WorkoutSet } from '@/lib/workout/types';
import type { ProgramExercise, SetTarget } from '@/lib/coach/coachPrograms';
import { repsText, rowsOf } from '@/lib/coach/prescription';
import { BASE_EXERCISES, useExerciseCatalog } from '@/lib/workout/exercises';
import { TechniqueVideoLink } from '../workout/TechniqueVideo';
import { PrescriptionSummary } from './PrescriptionSummary';
import '../../styles/workout-review.css';

const TAGS: Partial<Record<WorkoutSet['type'], { tag: string; label: string }>> = {
  warmup: { tag: 'C', label: 'calentamiento' },
  drop: { tag: 'D', label: 'descendente' },
  failure: { tag: 'F', label: 'al fallo' },
};

const sameVariant = (p: ProgramExercise, e: WorkoutExercise) =>
  p.exerciseId === e.exerciseId &&
  (p.variantGrip ?? '') === (e.variant?.grip ?? '') &&
  (p.variantMachine ?? '') === (e.variant?.machine ?? '');

const num = (text?: string) => (text?.trim() ? Number(text.replace(',', '.')) : NaN);

/** The prescribed target of one set, in the editor's words: "8-10 · RPE 7 · 60 kg". */
function goalText(goal?: SetTarget) {
  if (!goal) return '—';
  const load = goal.load
    ? goal.load.mode === 'KG'
      ? `${goal.load.amount} kg`
      : goal.load.resolvedKg != null
        ? `${goal.load.resolvedKg} kg`
        : `${goal.load.amount} %`
    : '';
  const effort = goal.rpe != null ? `RPE ${goal.rpe}` : goal.rir != null ? `RIR ${goal.rir}` : '';
  return [repsText(goal), effort, load].filter(Boolean).join(' · ') || '—';
}

/** A logged workout read like the editor's exercise cards: each set's target beside what was done. */
export function WorkoutReview({
  workout,
  exerciseName,
  prescribed = [],
}: {
  workout: CompletedWorkout;
  exerciseName: (id: string) => string;
  prescribed?: ProgramExercise[];
}) {
  const catalog = useExerciseCatalog().data;
  const gifs = new Map(
    [...BASE_EXERCISES, ...(Array.isArray(catalog) ? catalog : [])].map((e) => [e.id, e.gifUrl]),
  );
  const sets = workout.exercises.flatMap((exercise) => exercise.sets);
  const done = sets.filter((set) => set.completed);
  const effort = done.filter((set) => set.rpe?.trim() || set.rir?.trim());
  const skipped = prescribed.filter((p) => !workout.exercises.some((e) => sameVariant(p, e)));
  return (
    <div className="wr">
      <dl className="wr-stats">
        <div data-short={done.length < sets.length || undefined}>
          <dt>Series hechas</dt>
          <dd>
            {done.length}/{sets.length}
          </dd>
        </div>
        <div>
          <dt>Con esfuerzo anotado</dt>
          <dd>
            {effort.length}/{done.length}
          </dd>
        </div>
        {skipped.length > 0 && (
          <div data-short="">
            <dt>Ejercicios sin hacer</dt>
            <dd>{skipped.length}</dd>
          </div>
        )}
      </dl>
      {workout.notes && (
        <blockquote className="wr-quote">
          <MessageSquareQuote size={16} aria-hidden />
          <div>
            <strong>Comentario del atleta</strong>
            <p>{workout.notes}</p>
          </div>
        </blockquote>
      )}
      <ol className="wr-list">
        {workout.exercises.map((exercise, index) => {
          const matches = prescribed.filter((p) => sameVariant(p, exercise));
          const target = matches.length === 1 ? matches[0] : undefined;
          const name = target?.exerciseName ?? exerciseName(exercise.exerciseId);
          // Each logged set faces its own target: warm-ups with warm-ups, work sets in order.
          const rows = target ? rowsOf(target) : [];
          const pools = {
            warm: rows.filter((row) => row.kind === 'WARMUP'),
            work: rows.filter((row) => row.kind !== 'WARMUP'),
          };
          const goals = exercise.sets.map((set) =>
            (set.type === 'warmup' ? pools.warm : pools.work).shift(),
          );
          // Work sets count 1, 2, 3… on their own; warm-ups and the rest carry their letter.
          let work = 0;
          const numbers = exercise.sets.map((set) => (TAGS[set.type] ? 0 : ++work));
          const completed = exercise.sets.filter((set) => set.completed).length;
          const variant = [exercise.variant?.machine, exercise.variant?.grip]
            .filter((v) => v?.trim())
            .join(' · ');
          const gif = gifs.get(exercise.exerciseId);
          return (
            <li key={exercise.id} className="wr-card">
              <header className="wr-head">
                <span className="wr-media" aria-hidden="true">
                  {gif ? <img src={gif} alt="" loading="lazy" /> : <Dumbbell size={16} />}
                </span>
                <span className="wr-name">
                  <strong>
                    {index + 1}. {name}
                  </strong>
                  {(variant || target) && (
                    <small>
                      {variant}
                      {variant && target && ' · '}
                      {target && <PrescriptionSummary exercise={target} />}
                    </small>
                  )}
                </span>
                <span
                  className="wr-count"
                  data-short={completed < exercise.sets.length || undefined}
                >
                  {completed}/{exercise.sets.length}
                </span>
              </header>
              {exercise.notes && <p className="wr-note">{exercise.notes}</p>}
              <TechniqueVideoLink exercise={exercise} />
              <table className="wr-sets" data-target={target ? '' : undefined}>
                <caption className="sr-only">Series de {name}</caption>
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="sr-only">Serie</span>
                    </th>
                    {target && <th scope="col">Pauta</th>}
                    <th scope="col">Reps</th>
                    <th scope="col">Esfuerzo</th>
                    <th scope="col">Carga</th>
                  </tr>
                </thead>
                <tbody>
                  {exercise.sets.map((set, i) => {
                    const goal = goals[i];
                    const rir = !!set.rir?.trim();
                    const actual = rir ? num(set.rir) : num(set.rpe);
                    const shortReps =
                      set.completed && goal?.reps != null && num(set.reps) < goal.reps;
                    const goalKg =
                      goal?.load?.mode === 'KG' ? goal.load.amount : goal?.load?.resolvedKg;
                    const shortLoad = set.completed && goalKg != null && num(set.weight) < goalKg;
                    const expected = rir ? goal?.rir : goal?.rpe;
                    const delta =
                      set.completed &&
                      set.type !== 'warmup' &&
                      expected != null &&
                      Number.isFinite(actual)
                        ? Math.round((actual - expected) * 10) / 10
                        : null;
                    const tag = TAGS[set.type];
                    return (
                      <tr key={set.id} data-skipped={set.completed ? undefined : ''}>
                        <th scope="row">
                          <span className="wr-num" data-kind={set.type}>
                            {tag?.tag ?? numbers[i]}
                          </span>
                          <span className="sr-only">
                            Serie {i + 1}
                            {tag ? `, ${tag.label}` : ''}
                            {set.completed ? '' : ', sin completar'}
                          </span>
                        </th>
                        {target && <td className="wr-goal">{goalText(goal)}</td>}
                        <td data-warn={shortReps || undefined}>
                          {set.reps || set.duration || '—'}
                          {shortReps && <span className="sr-only"> (por debajo del objetivo)</span>}
                        </td>
                        <td>
                          {rir ? `RIR ${set.rir}` : set.rpe ? `RPE ${set.rpe}` : '—'}
                          {delta != null && delta !== 0 && (
                            <span
                              className="wr-delta"
                              title={`${delta > 0 ? '+' : ''}${delta} frente a lo pautado`}
                            >
                              {delta > 0 ? '+' : ''}
                              {delta}
                            </span>
                          )}
                        </td>
                        <td data-warn={shortLoad || undefined}>
                          {set.weight
                            ? `${set.weight} kg`
                            : set.distance
                              ? `${set.distance} km`
                              : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {exercise.sets
                    .map((set, i) => ({ set, i }))
                    .filter(({ set }) => !set.completed && set.skipReason)
                    .map(({ set, i }) => (
                      <tr key={`${set.id}-why`} className="wr-why">
                        <td colSpan={target ? 5 : 4}>
                          Serie {i + 1} sin hacer: {set.skipReason}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </li>
          );
        })}
        {skipped.map((p, i) => (
          <PlannedCard
            key={`skipped-${i}`}
            exercise={p}
            name={p.exerciseName ?? exerciseName(p.exerciseId)}
            gif={gifs.get(p.exerciseId)}
            badge="No lo hizo"
          />
        ))}
      </ol>
    </div>
  );
}

function PlannedCard({
  exercise,
  name,
  gif,
  badge,
  index,
}: {
  exercise: ProgramExercise;
  name: string;
  gif?: string;
  badge?: string;
  index?: number;
}) {
  return (
    <li className="wr-card" data-skipped={badge ? '' : undefined}>
      <header className="wr-head">
        <span className="wr-media" aria-hidden="true">
          {gif ? <img src={gif} alt="" loading="lazy" /> : <Dumbbell size={16} />}
        </span>
        <span className="wr-name">
          <strong>
            {index != null && `${index + 1}. `}
            {name}
          </strong>
          <small>
            {[exercise.variantMachine, exercise.variantGrip].filter(Boolean).join(' · ')}
            {(exercise.variantMachine || exercise.variantGrip) && ' · '}
            <PrescriptionSummary exercise={exercise} />
          </small>
        </span>
        {badge && (
          <span className="wr-count" data-short="">
            {badge}
          </span>
        )}
      </header>
      {exercise.notes && <p className="wr-note">{exercise.notes}</p>}
    </li>
  );
}

/** What was prescribed for a day nobody logged: the same cards, without sets to compare. */
export function PlannedExercises({
  exercises,
  exerciseName,
}: {
  exercises: ProgramExercise[];
  exerciseName: (id: string) => string;
}) {
  const catalog = useExerciseCatalog().data;
  const gifs = new Map(
    [...BASE_EXERCISES, ...(Array.isArray(catalog) ? catalog : [])].map((e) => [e.id, e.gifUrl]),
  );
  return (
    <ol className="wr-list">
      {exercises.map((exercise, i) => (
        <PlannedCard
          key={i}
          index={i}
          exercise={exercise}
          name={exercise.exerciseName ?? exerciseName(exercise.exerciseId)}
          gif={gifs.get(exercise.exerciseId)}
        />
      ))}
    </ol>
  );
}
