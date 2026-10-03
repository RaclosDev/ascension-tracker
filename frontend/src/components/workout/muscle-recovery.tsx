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
  Object.keys(INDIVIDUAL_MUSCLES).forEach((m) => (fatigueScores[m] = 0));

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
    .filter((m) => m.recoveryPct < 100);

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        height: '100%',
      }}
    >
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Estado de Recuperación
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Basado en el volumen de las últimas 72 horas.
        </p>
      </div>

      {musclesToRecover.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            padding: '1rem 0',
          }}
        >
          Â¡Todos tus mÃºsculos estÃ¡n al 100% recuperados! ðŸ’ª
        </div>
      ) : (
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem 1rem' }}
        >
          {musclesToRecover.map(({ key, group, recoveryPct }) => {
            let barColor = 'var(--color-success)';
            if (recoveryPct < 30) barColor = 'var(--color-fat)';
            else if (recoveryPct < 60) barColor = 'var(--color-carbs)';

            return (
              <div key={key}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem',
                    fontSize: '0.8rem',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {group.label}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    {recoveryPct}%
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${recoveryPct}%`,
                      height: '100%',
                      background: barColor,
                      borderRadius: '3px',
                      transition: 'width 1s ease-in-out, background 0.5s',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}




