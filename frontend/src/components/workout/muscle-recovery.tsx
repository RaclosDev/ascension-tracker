import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
  const [modalOpen, setModalOpen] = useState(false);
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

  const allMuscles = Object.entries(INDIVIDUAL_MUSCLES)
    .map(([key, group]) => {
      const score = fatigueScores[key];
      const fatiguePct = Math.min(100, Math.round((score / MAX_SETS_FATIGUE) * 100));
      const recoveryPct = 100 - fatiguePct;
      return { key, label: group.label, recoveryPct, fatiguePct };
    })
    .sort((a, b) => a.recoveryPct - b.recoveryPct);

  const musclesToRecover = allMuscles.filter((m) => m.recoveryPct < 100);
  const displayedMuscles = musclesToRecover.slice(0, 8);

  return (
    <>
      <div
        className="card flex flex-col justify-between h-full min-h-[190px]"
        style={{ padding: '0.5rem 0.45rem' }}
      >
        <div>
          <div className="flex items-center justify-between px-0.5 mb-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1 text-left group cursor-pointer hover:opacity-85 transition-opacity"
              aria-label="Ver detalle de recuperación muscular"
            >
              <h3
                className="text-xs sm:text-sm font-bold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Recuperación
              </h3>
              <ChevronRight
                size={13}
                className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
              />
            </button>
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
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 sm:gap-x-2.5 sm:gap-y-2">
              {displayedMuscles.map(({ key, label, recoveryPct }) => {
                let barColor = 'var(--color-success)';
                if (recoveryPct < 30) barColor = 'var(--color-fat)';
                else if (recoveryPct < 60) barColor = 'var(--color-carbs)';

                return (
                  <div key={key} className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-baseline justify-between text-[10.5px] leading-tight">
                      <span
                        className="font-medium truncate"
                        style={{ color: 'var(--text-primary)' }}
                        title={label}
                      >
                        {label}
                      </span>
                      <span
                        className="text-[9.5px] font-bold font-mono tabular-nums ml-1 flex-shrink-0"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {recoveryPct}%
                      </span>
                    </div>
                    <div
                      className="w-full h-1 sm:h-1.5 rounded-full overflow-hidden"
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

        {musclesToRecover.length > 8 ? (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="text-[10px] font-semibold text-center mt-1.5 w-full text-[var(--accent-primary-light)] hover:underline flex items-center justify-center gap-0.5 cursor-pointer"
          >
            +{musclesToRecover.length - 8} más · Ver todos
          </button>
        ) : (
          musclesToRecover.length > 0 && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="text-[10px] font-medium text-center mt-1 w-full text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
            >
              Ver detalle
            </button>
          )
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md p-5 bg-[var(--bg-card)] border border-[var(--border-medium)] rounded-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-[var(--text-primary)]">
              <span>Recuperación Muscular</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                Ventana 72h
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--text-secondary)]">
              Estimación del nivel de recuperación según el volumen e intensidad de tus últimas
              sesiones.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-2">
            {allMuscles.map(({ key, label, recoveryPct }) => {
              let barColor = 'var(--color-success)';
              let statusBadge = {
                text: 'Listo',
                bg: 'rgba(34, 197, 94, 0.15)',
                color: '#4ade80',
              };

              if (recoveryPct < 30) {
                barColor = 'var(--color-fat)';
                statusBadge = {
                  text: 'Fatiga alta',
                  bg: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                };
              } else if (recoveryPct < 60) {
                barColor = 'var(--color-carbs)';
                statusBadge = {
                  text: 'En recuperación',
                  bg: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                };
              } else if (recoveryPct < 100) {
                barColor = 'var(--accent-primary)';
                statusBadge = {
                  text: 'Casi listo',
                  bg: 'rgba(0, 133, 255, 0.15)',
                  color: 'var(--accent-primary-light)',
                };
              }

              return (
                <div
                  key={key}
                  className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--text-primary)]">{label}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: statusBadge.bg, color: statusBadge.color }}
                      >
                        {statusBadge.text}
                      </span>
                      <span className="font-mono font-bold text-xs text-[var(--text-primary)]">
                        {recoveryPct}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden bg-[var(--bg-primary)]">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${recoveryPct}%`, background: barColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default MuscleRecovery;
