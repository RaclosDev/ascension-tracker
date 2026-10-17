import { type CompletedWorkout, type Exercise } from '@/lib/workout/types';
import { getExerciseMap } from '@/lib/workout/exercises';

const INDIVIDUAL_MUSCLES: Record<string, { label: string }> = {
  pecho: { label: 'Pecho' },
  hombros: { label: 'Hombros' },
  triceps: { label: 'Tríceps' },
  dorsales: { label: 'Dorsales' },
  espalda_alta: { label: 'Espalda Alta' },
  biceps: { label: 'Bíceps' },
  trapecios: { label: 'Trapecios' },
  lumbares: { label: 'Lumbares' },
  antebrazos: { label: 'Antebrazos' },
  cuadriceps: { label: 'Cuádriceps' },
  gluteos: { label: 'Glúteos' },
  femorales: { label: 'Femorales' },
  gemelos: { label: 'Gemelos' },
  aductores: { label: 'Aductores' },
  abdominales: { label: 'Abdominales' },
};

const MAX_SETS_FATIGUE = 100; // 10 sets * 10 max points = 100 points for 100% fatigue on a single muscle
const RECOVERY_MS = 72 * 60 * 60 * 1000; // 72 hours

export function MuscleRecovery({
  history,
  customExercises = [],
}: {
  history: CompletedWorkout[];
  customExercises?: Exercise[];
}) {
  const catalog = getExerciseMap(customExercises);
  const now = Date.now();

  const fatigueScores: Record<string, number> = {};
  Object.keys(INDIVIDUAL_MUSCLES).forEach((m) => {
    fatigueScores[m] = 0;
  });

  // Calculate fatigue
  history.forEach((workout) => {
    const timeSince = now - workout.finishedAt;
    if (timeSince > RECOVERY_MS) return;

    // Fatigue weight decreases over 72 hours (1.0 at 0h, 0.0 at 72h)
    const weight = 1 - timeSince / RECOVERY_MS;

    workout.exercises.forEach((ex) => {
      const dbEx = catalog.get(ex.exerciseId);
      if (!dbEx) return;

      const muscle = dbEx.muscle?.toLowerCase() || '';
      const setsCount = ex.sets.filter((s) => s.completed).length;

      const applyFatigue = (targetMuscle: string, points: number) => {
        const fatigueAdded = setsCount * weight * points;
        if (fatigueScores[targetMuscle] !== undefined) {
          fatigueScores[targetMuscle] += fatigueAdded;
        }
      };

      if (dbEx.synergists) {
        Object.entries(dbEx.synergists).forEach(([synMuscle, score]) => {
          applyFatigue(synMuscle.toLowerCase(), score);
        });
      } else {
        // Fallback if no synergists exist: 10 points to the primary muscle
        applyFatigue(muscle, 10);
      }
    });
  });

  const musclesToRecover = Object.entries(INDIVIDUAL_MUSCLES)
    .map(([key, group]) => {
      const score = fatigueScores[key];
      const fatiguePct = Math.min(100, Math.round((score / MAX_SETS_FATIGUE) * 100));
      const recoveryPct = 100 - fatiguePct;
      return { key, group, recoveryPct };
    })
    .filter((m) => m.recoveryPct < 100)
    .sort((a, b) => a.recoveryPct - b.recoveryPct);

  const displayedMuscles = musclesToRecover.slice(0, 4);

  return (
    <div className="card p-2.5 sm:p-4 flex flex-col justify-between h-full min-h-[190px]">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3
            className="text-xs sm:text-sm font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Recuperación
          </h3>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{ color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.05)' }}
          >
            72h
          </span>
        </div>

        {musclesToRecover.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <span className="text-2xl mb-1">⚡</span>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              100% Listo
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              Músculos recuperados
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {displayedMuscles.map(({ key, group, recoveryPct }) => {
              let barColor = 'var(--color-success)';
              if (recoveryPct < 30) barColor = 'var(--color-fat)';
              else if (recoveryPct < 60) barColor = 'var(--color-carbs)';

              return (
                <div key={key} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-xs leading-none">
                    <span
                      className="font-medium truncate max-w-[85px] sm:max-w-[100px]"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {group.label}
                    </span>
                    <span
                      className="text-[11px] font-bold font-mono tabular-nums"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {recoveryPct}%
                    </span>
                  </div>
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${recoveryPct}%`, background: barColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {musclesToRecover.length > 4 && (
        <p
          className="text-[10px] font-medium text-center mt-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          +{musclesToRecover.length - 4} músculos más
        </p>
      )}
    </div>
  );
}
