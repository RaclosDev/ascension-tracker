import { useMemo, useState, useEffect } from 'react';
import Model, { IExerciseData, Muscle } from 'react-body-highlighter';
import type { CompletedWorkout, Exercise } from '../../lib/workout/types';
import { getExerciseMap } from '../../lib/workout/exercises';

const MUSCLE_MAP: Record<string, Muscle[]> = {
  pecho: ['chest'],
  espalda_alta: ['upper-back'],
  dorsales: ['upper-back', 'lower-back'],
  lumbares: ['lower-back'],
  trapecios: ['trapezius'],
  cuadriceps: ['quadriceps'],
  femorales: ['hamstring'],
  gluteos: ['gluteal'],
  gemelos: ['calves'],
  abductores: ['abductors'],
  aductores: ['adductor'],
  hombros: ['front-deltoids', 'back-deltoids'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  antebrazos: ['forearm'],
  abdominales: ['abs', 'obliques'],
  cardio: [],
};

interface BodyHeatmapProps {
  history: CompletedWorkout[];
  customExercises?: Exercise[];
  hideTitle?: boolean;
}

export function BodyHeatmap({
  history,
  customExercises = [],
  hideTitle = false,
}: BodyHeatmapProps) {
  const catalog = useMemo(() => getExerciseMap(customExercises), [customExercises]);

  const bodyData = useMemo(() => {
    // If history is just 1 item, we are showing a specific workout, so ignore the 7-day filter
    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const recentWorkouts =
      history.length === 1
        ? history
        : history.filter((w: CompletedWorkout) => now - w.finishedAt <= oneWeekMs);

    const data: IExerciseData[] = [];

    // Tally sets per muscle
    recentWorkouts.forEach((workout) => {
      workout.exercises.forEach((ex) => {
        const setsCount = ex.sets.filter((s) => s.completed).length;
        if (setsCount === 0) return;

        const dbEx = catalog.get(ex.exerciseId);
        if (!dbEx) return;

        const primaryMuscle = dbEx.muscle?.toLowerCase() || '';
        const synergists = dbEx.synergists;

        // Add data points to increase heat intensity based on sets and synergists scores
        if (synergists) {
          Object.entries(synergists).forEach(([synMuscle, score]) => {
            const mappedMuscles = MUSCLE_MAP[synMuscle.toLowerCase()];
            if (mappedMuscles) {
              const heatPoints = Math.round((setsCount * score) / 5);
              for (let i = 0; i < heatPoints; i++) {
                data.push({ name: 'Workout', muscles: mappedMuscles });
              }
            }
          });
        } else {
          const mappedMuscles = MUSCLE_MAP[primaryMuscle];
          if (mappedMuscles) {
            for (let i = 0; i < setsCount; i++) {
              data.push({ name: 'Workout', muscles: mappedMuscles });
            }
          }
        }
      });
    });
    return data;
  }, [history, catalog]);

  const colors = ['#86efac', '#4ade80', '#22c55e', '#16a34a', '#dc2626'];
  const modelProps = {
    data: bodyData,
    highlightedColors: colors,
    style: { width: '100%', height: '100%', display: 'flex', justifyContent: 'center' },
  };

  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 10);
    return () => clearTimeout(t);
  }, []);

  if (hideTitle) {
    return (
      <div className="flex gap-1 w-full justify-center items-center h-[140px]">
        {isReady && (
          <>
            <div className="flex-1 max-w-[66px] aspect-[1/2]">
              <Model type="anterior" {...modelProps} />
            </div>
            <div className="flex-1 max-w-[66px] aspect-[1/2]">
              <Model type="posterior" {...modelProps} />
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="card flex flex-col justify-between items-center h-full min-h-[190px] p-3 sm:p-4">
      <div className="w-full flex items-center justify-between px-1 mb-1">
        <h3
          className="text-xs sm:text-sm font-bold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Zonas Activas
        </h3>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{ color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.05)' }}
        >
          7 días
        </span>
      </div>

      <div className="flex flex-row items-center justify-center gap-1.5 w-full my-auto">
        {/* Vista Frontal */}
        <div className="flex-1 min-w-0 max-w-[76px] sm:max-w-[88px] aspect-[1/2] flex items-center justify-center">
          {isReady && <Model type="anterior" {...modelProps} />}
        </div>
        {/* Vista Posterior */}
        <div className="flex-1 min-w-0 max-w-[76px] sm:max-w-[88px] aspect-[1/2] flex items-center justify-center">
          {isReady && <Model type="posterior" {...modelProps} />}
        </div>
      </div>

      <div
        className="flex items-center justify-center gap-2 text-[10px] font-medium"
        style={{ color: 'var(--text-secondary)' }}
      >
        <span>Frente</span>
        <span>•</span>
        <span>Espalda</span>
      </div>
    </div>
  );
}
