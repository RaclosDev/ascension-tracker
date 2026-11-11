import { WorkoutReview } from './WorkoutReview';
import { CommentBox } from './ProgramSessions';
import { useMemo, useState, useDeferredValue } from 'react';
import { Dumbbell } from 'lucide-react';
import { useClientData, useClientCustomExercises } from '../../lib/coach/api';
import { useExerciseCatalog, getExerciseMap } from '../../lib/workout/exercises';
import { ActivityHeatmap } from '../workout/heatmap';
import { BodyHeatmap } from '../workout/body-heatmap';
import { formatDay, formatKg } from '../../lib/workout/format';
import type { CompletedWorkout } from '../../lib/workout/types';
import { Section, Stat, QueryState, num } from './ClientSection';
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

interface WorkoutPage {
  content: CompletedWorkout[];
  totalPages: number;
  totalElements: number;
}

interface WorkoutStats {
  totalWorkouts: number;
  totalDurationSeconds: number;
  totalVolume: number;
  totalSets: number;
}

export default function TrainingSection({ linkId }: { linkId: string }) {
  const [page, setPage] = useState(0);
  const [origin, setOrigin] = useState('ALL');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const history = useClientData<WorkoutPage>(
    linkId,
    `workouts?page=${page}&size=10&origin=${origin}&search=${encodeURIComponent(deferredSearch)}`,
    true,
  );
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
      <h3 className="text-sm font-bold text-foreground mb-2">Historial de entrenamientos</h3>
      <div data-tour="training-history" className="flex flex-wrap gap-3 mb-3">
        <label>
          Buscar por nombre
          <input
            type="search"
            maxLength={120}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <label>
          Origen
          <select
            value={origin}
            onChange={(e) => {
              setOrigin(e.target.value);
              setPage(0);
            }}
          >
            <option value="ALL">Todos</option>
            <option value="PRESCRIBED">Pautados</option>
            <option value="FREE">Libres</option>
          </select>
        </label>
      </div>
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
            <details>
              <summary className="cursor-pointer py-2">
                <strong>{workout.name || 'Entrenamiento'}</strong> · {formatDay(workout.startedAt)}{' '}
                · {workout.programDayId ? 'Pautado' : 'Libre'}
              </summary>
              <WorkoutReview
                workout={workout}
                exerciseName={(id) => exerciseMap.get(id)?.name ?? 'Ejercicio'}
              />
              <HistoryComment
                linkId={linkId}
                workoutId={workout.id}
                contexts={workout.exercises.map((exercise) => ({
                  name: exerciseMap.get(exercise.exerciseId)?.name ?? 'Ejercicio',
                  sets: exercise.sets.length,
                  videoSeconds: exercise.videoSeconds,
                }))}
              />
            </details>
          </li>
        ))}
      </ul>
      {history.data && history.data.totalPages > 1 && (
        <nav className="flex gap-3 items-center mt-4" aria-label="Páginas de entrenamientos">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </button>
          <span>
            Página {page + 1} de {history.data.totalPages} · {history.data.totalElements}{' '}
            entrenamientos
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page + 1 >= history.data.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Siguiente
          </button>
        </nav>
      )}
      <details className="mt-5">
        <summary className="cursor-pointer py-3 font-bold">Estadísticas y actividad</summary>{' '}
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
      </details>
    </Section>
  );
}

function HistoryComment({
  linkId,
  workoutId,
  contexts,
}: {
  linkId: string;
  workoutId: string;
  contexts: { name: string; sets: number; videoSeconds?: number | null }[];
}) {
  const comment = useClientData<{ text: string }>(
    linkId,
    `workouts/${encodeURIComponent(workoutId)}/comment`,
    true,
  );
  if (comment.isPending) return <p role="status">Cargando comentario…</p>;
  if (comment.isError)
    return (
      <p role="alert">
        No se pudo cargar el comentario.{' '}
        <button type="button" className="btn btn-secondary" onClick={() => void comment.refetch()}>
          Reintentar
        </button>
      </p>
    );
  return (
    <CommentBox
      key={comment.data.text}
      linkId={linkId}
      workoutId={workoutId}
      assignmentId="history"
      saved={comment.data.text || null}
      contexts={contexts}
    />
  );
}
