import { useMemo, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { useClientData, useClientCustomExercises } from '../../lib/coach/api';
import { useExerciseCatalog, getExerciseMap } from '../../lib/workout/exercises';
import { ActivityHeatmap } from '../workout/heatmap';
import { BodyHeatmap } from '../workout/body-heatmap';
import { formatDay, formatKg, sessionVolume } from '../../lib/workout/format';
import type { CompletedWorkout } from '../../lib/workout/types';
import { Section, Stat, QueryState, num } from './ClientSection';
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

interface WorkoutPage {
  content: CompletedWorkout[];
}

interface WorkoutStats {
  totalWorkouts: number;
  totalDurationSeconds: number;
  totalVolume: number;
  totalSets: number;
}

export default function TrainingSection({ linkId }: { linkId: string }) {
  const history = useClientData<WorkoutPage>(linkId, 'workouts?page=0&size=10', true);
  const stats = useClientData<WorkoutStats>(linkId, 'workouts/stats', true);
  const [since] = useState(() => Date.now() - YEAR_MS);
  const recent = useClientData<CompletedWorkout[]>(linkId, `workouts/recent?since=${since}`, true);
  const custom = useClientCustomExercises(linkId);
  const catalog = useExerciseCatalog();
  const exerciseMap = useMemo(
    () => getExerciseMap(custom.data ?? [], catalog.data ?? []),
    [custom.data, catalog.data],
  );
  const s = stats.data;

  return (
    <Section title="Entrenamiento" icon={<Dumbbell size={18} aria-hidden />}>
      {s && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <Stat label="Entrenos" value={num(s.totalWorkouts)} />
          <Stat label="Horas" value={num(s.totalDurationSeconds / 3600)} />
          <Stat label="Series" value={num(s.totalSets)} />
          <Stat label="Volumen" value={formatKg(s.totalVolume)} />
        </div>
      )}
      <QueryState isLoading={recent.isLoading} isError={recent.isError} />
      {recent.data && recent.data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 mb-4">
          <ActivityHeatmap history={recent.data} />
          <BodyHeatmap history={recent.data} customExercises={custom.data ?? []} />
        </div>
      )}
      <h3 className="text-sm font-bold text-foreground mb-2">Últimos entrenamientos</h3>
      <QueryState isLoading={history.isLoading} isError={history.isError} />
      {history.data?.content.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>Aún no ha registrado entrenamientos.</p>
      )}
      <ul className="flex flex-col gap-3">
        {history.data?.content.map((workout) => (
          <li
            key={workout.id}
            className="border-t pt-3"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex justify-between gap-2">
              <span className="font-bold text-foreground">{workout.name || 'Entrenamiento'}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{formatDay(workout.startedAt)}</span>
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {(workout.exercises ?? [])
                .map((ex) => exerciseMap.get(ex.exerciseId)?.name ?? 'Ejercicio')
                .join(' · ')}
            </div>
            <div className="text-sm text-foreground">
              Volumen {formatKg(sessionVolume(workout.exercises ?? []))}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
