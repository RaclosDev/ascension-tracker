import type { CompletedWorkout, Exercise } from '../../lib/workout/types';
import {
  completedSets,
  formatDay,
  formatDuration,
  formatKg,
  formatVariant,
  sessionVolume,
} from '../../lib/workout/format';
import { capitalizeFirst } from '../../utils/dateHelper';
import '../../styles/workout-session-summary.css';

export function WorkoutSessionStats({ workout }: { workout: CompletedWorkout }) {
  return (
    <dl className="workout-session-stats">
      <div>
        <dt>Volumen</dt>
        <dd>{formatKg(sessionVolume(workout.exercises))}</dd>
      </div>
      <div>
        <dt>Series</dt>
        <dd>{completedSets(workout.exercises)}</dd>
      </div>
      <div>
        <dt>Tiempo</dt>
        <dd>{formatDuration(workout.finishedAt - workout.startedAt)}</dd>
      </div>
    </dl>
  );
}

export function WorkoutSessionSummary({
  workout,
  catalog,
}: {
  workout: CompletedWorkout;
  catalog: Map<string, Exercise>;
}) {
  const names = workout.exercises.map((exercise) => {
    const name = catalog.get(exercise.exerciseId)?.name ?? 'Ejercicio';
    const variant = formatVariant(exercise.variant);
    return variant ? `${name} ${variant}` : name;
  });
  return (
    <div className="workout-session-summary">
      <h3>{workout.name || 'Entrenamiento'}</h3>
      <p className="workout-session-date">{capitalizeFirst(formatDay(workout.finishedAt))}</p>
      <WorkoutSessionStats workout={workout} />
      <p className="workout-session-exercises">{names.join(' · ')}</p>
    </div>
  );
}
