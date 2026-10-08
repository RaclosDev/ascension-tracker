import { VariantSelector } from './variant-selector';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContentFullScreen,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Dumbbell, Trophy, Activity, Calendar } from 'lucide-react';
import { useRecentWorkouts } from '@/lib/workout/api';
import { useWorkoutStore } from '@/lib/workout/store';
import { MUSCLE_LABEL, type Exercise } from '@/lib/workout/types';
import { formatKg, formatVariant } from '@/lib/workout/format';

interface Props {
  exercise: Exercise | null;
  onClose: () => void;
}

export function ExerciseDetailsModal({ exercise, onClose }: Props) {
  const { data: history = [] } = useRecentWorkouts(365);
  const globalMachines = useWorkoutStore((s) => s.globalMachines);
  const globalGrips = useWorkoutStore((s) => s.globalGrips);
  const exerciseVariants = useWorkoutStore((s) => s.exerciseVariants);
  const addGlobalMachine = useWorkoutStore((s) => s.addGlobalMachine);
  const addGlobalGrip = useWorkoutStore((s) => s.addGlobalGrip);
  const addExerciseVariant = useWorkoutStore((s) => s.addExerciseVariant);
  const customGifs = useWorkoutStore((s) => s.exerciseGifs);
  const [filterGrip, setFilterGrip] = useState<string>('ALL');
  const [filterMachine, setFilterMachine] = useState<string>('ALL');

  const customGripsArray = useMemo(() => {
    return exercise ? exerciseVariants[exercise.id]?.grips || [] : [];
  }, [exercise, exerciseVariants]);

  const customMachinesArray = useMemo(() => {
    return exercise ? exerciseVariants[exercise.id]?.machines || [] : [];
  }, [exercise, exerciseVariants]);

  const { historicalGrips, historicalMachines } = useMemo(() => {
    if (!exercise) return { historicalGrips: [], historicalMachines: [] };
    const grips = new Set<string>();
    const machines = new Set<string>();

    for (const w of history) {
      for (const ex of w.exercises) {
        if (ex.exerciseId !== exercise.id) continue;
        if (ex.variant?.machine) {
          machines.add(ex.variant.machine);
        }
        if (ex.variant?.grip) {
          grips.add(ex.variant.grip);
        }
      }
    }
    return {
      historicalGrips: Array.from(new Set([...Array.from(grips), ...customGripsArray])).sort(),
      historicalMachines: Array.from(
        new Set([...Array.from(machines), ...customMachinesArray]),
      ).sort(),
    };
  }, [exercise, history, customGripsArray, customMachinesArray]);

  const handleAddGrip = (val: string) => {
    if (!exercise) return;
    addGlobalGrip(val);
    addExerciseVariant(exercise.id, 'grip', val);
  };
  const handleAddMachine = (val: string) => {
    if (!exercise) return;
    addGlobalMachine(val);
    addExerciseVariant(exercise.id, 'machine', val);
  };

  const stats = useMemo(() => {
    if (!exercise) return null;

    let maxWeight = 0;
    const maxWeightPerRange = {
      '1-5': 0,
      '6-10': 0,
      '11-15': 0,
      '16+': 0,
    };
    const sessions: Array<{
      date: number;
      name: string;
      variant?: string;
      sets: Array<{ weight: string; reps: string }>;
    }> = [];

    for (const session of history) {
      const exDatas = session.exercises.filter((e: any) => {
        if (e.exerciseId !== exercise.id) return false;
        if (filterGrip !== 'ALL' && e.variant?.grip !== filterGrip) return false;
        if (filterMachine !== 'ALL' && e.variant?.machine !== filterMachine) return false;
        return true;
      });

      for (const exData of exDatas) {
        const validSets = exData.sets.filter((s: any) => s.completed);
        if (validSets.length === 0) continue;

        const sessionSets: Array<{ weight: string; reps: string }> = [];

        for (const set of validSets) {
          const w = Number.parseFloat(set.weight);
          const r = Number.parseFloat(set.reps);

          sessionSets.push({ weight: set.weight, reps: set.reps });

          if (Number.isFinite(w) && w > maxWeight) {
            maxWeight = w;
          }

          if (Number.isFinite(w) && Number.isFinite(r)) {
            if (r >= 1 && r <= 5) maxWeightPerRange['1-5'] = Math.max(maxWeightPerRange['1-5'], w);
            else if (r >= 6 && r <= 10)
              maxWeightPerRange['6-10'] = Math.max(maxWeightPerRange['6-10'], w);
            else if (r >= 11 && r <= 15)
              maxWeightPerRange['11-15'] = Math.max(maxWeightPerRange['11-15'], w);
            else if (r >= 16) maxWeightPerRange['16+'] = Math.max(maxWeightPerRange['16+'], w);
          }
        }

        sessions.push({
          date: session.finishedAt,
          name: session.name || 'Entrenamiento',
          variant: formatVariant(exData.variant),
          sets: sessionSets,
        });
      }
    }

    return {
      maxWeight,
      maxWeightPerRange,
      sessions: sessions.sort(
        (
          a: { date: { getTime: () => number } | number },
          b: { date: { getTime: () => number } | number },
        ) => {
          const dateA = typeof a.date === 'number' ? a.date : a.date.getTime();
          const dateB = typeof b.date === 'number' ? b.date : b.date.getTime();
          return dateB - dateA;
        },
      ),
    };
  }, [exercise, history, filterGrip, filterMachine]);

  if (!exercise) return null;

  return (
    <Dialog
      open={!!exercise}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          // Reset filters when closing
          setTimeout(() => {
            setFilterGrip('ALL');
            setFilterMachine('ALL');
          }, 300);
        }
      }}
    >
      <DialogContentFullScreen
        style={{
          padding: 0,
          background: 'var(--bg-primary)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <DialogHeader style={{ display: 'none' }}>
          <DialogTitle>Detalles de {exercise.name}</DialogTitle>
          <DialogDescription>Estadísticas e historial del ejercicio.</DialogDescription>
        </DialogHeader>

        {/* Header Section */}
        <div
          style={{
            padding: 'calc(env(safe-area-inset-top, 44px) + 1.5rem) 1.5rem 1.5rem 1.5rem',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          {customGifs[exercise.id] !== 'none' && (customGifs[exercise.id] || exercise.gifUrl) ? (
            <img
              src={customGifs[exercise.id] || exercise.gifUrl}
              alt={exercise.name}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '12px',
                objectFit: 'cover',
                background: 'var(--bg-primary)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          ) : (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '12px',
                background: 'var(--bg-primary)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Dumbbell size={28} style={{ color: 'var(--text-secondary)' }} />
            </div>
          )}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {exercise.name}
            </h2>
            <p
              style={{
                marginTop: '0.25rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                textTransform: 'capitalize',
                fontWeight: 600,
                letterSpacing: '0.05em',
              }}
            >
              {MUSCLE_LABEL[exercise.muscle]} · {exercise.equipment}{' '}
              {exercise.custom ? '· Personalizado' : ''}
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {/* Filters */}
          {(historicalGrips.length > 0 ||
            historicalMachines.length > 0 ||
            exercise.equipment === 'maquina' ||
            exercise.equipment === 'polea' ||
            exercise.equipment === 'multipower') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label
                  style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}
                >
                  Agarre (Filtro)
                </label>
                <VariantSelector
                  type="grip"
                  value={filterGrip === 'ALL' ? undefined : filterGrip}
                  onChange={(val) => setFilterGrip(val || 'ALL')}
                  historicalOptions={historicalGrips}
                  globalOptions={globalGrips}
                  onAddOption={handleAddGrip}
                />
              </div>

              {(historicalMachines.length > 0 ||
                exercise.equipment === 'maquina' ||
                exercise.equipment === 'polea' ||
                exercise.equipment === 'multipower') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label
                    style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}
                  >
                    Máquina (Filtro)
                  </label>
                  <VariantSelector
                    type="machine"
                    value={filterMachine === 'ALL' ? undefined : filterMachine}
                    onChange={(val) => setFilterMachine(val || 'ALL')}
                    historicalOptions={historicalMachines}
                    globalOptions={globalMachines}
                    onAddOption={handleAddMachine}
                  />
                </div>
              )}
            </div>
          )}

          {/* PRs and Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div
              className="card"
              style={{
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                background:
                  'linear-gradient(145deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%)',
                border: '1px solid rgba(255,215,0,0.2)',
              }}
            >
              <Trophy size={20} style={{ color: '#FBBF24' }} />
              <p
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                }}
              >
                Peso Máximo
              </p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {stats?.maxWeight ? formatKg(stats.maxWeight) : ''}
              </p>
            </div>

            <div
              className="card"
              style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  justifyContent: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                <Activity size={20} style={{ color: 'var(--color-primary)' }} />
                <p
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                  }}
                >
                  Récords x Reps
                </p>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  width: '100%',
                }}
              >
                {Object.entries(stats?.maxWeightPerRange || {}).map(([range, weight]) => (
                  <div
                    key={range}
                    style={{
                      background: 'var(--bg-primary)',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      textAlign: 'center',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.2rem',
                      }}
                    >
                      {range} reps
                    </div>
                    <div
                      style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}
                    >
                      {weight > 0 ? formatKg(weight) : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Muscles Section */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Activity size={18} style={{ color: 'var(--color-primary)' }} />
              Implicación Muscular
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(() => {
                const syns = (
                  exercise.synergists && Object.keys(exercise.synergists).length > 0
                    ? Object.entries(exercise.synergists).sort(
                        ([, a], [, b]) => (b as number) - (a as number),
                      )
                    : [[exercise.muscle, 10]]
                ) as [string, number][];

                return syns.map(([muscle, score]) => (
                  <div key={muscle} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        width: '100px',
                        textTransform: 'capitalize',
                        flexShrink: 0,
                      }}
                    >
                      {MUSCLE_LABEL[muscle as import('@/lib/workout/types').MuscleGroup] || muscle}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: '10px',
                        background: 'var(--bg-primary)',
                        borderRadius: '5px',
                        overflow: 'hidden',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${(Number(score) / 10) * 100}%`,
                          background:
                            Number(score) >= 8
                              ? 'var(--gradient-primary)'
                              : Number(score) >= 5
                                ? 'var(--accent-primary-light)'
                                : 'var(--text-muted)',
                          borderRadius: '5px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        width: '30px',
                        textAlign: 'right',
                        flexShrink: 0,
                      }}
                    >
                      {score}/10
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* History List */}
          <div>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Calendar size={18} style={{ color: 'var(--text-secondary)' }} />
              Historial de Sesiones
            </h3>

            {stats?.sessions.length === 0 ? (
              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  padding: '2rem 0',
                }}
              >
                No hay sesiones para estos filtros.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stats?.sessions.map((session, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.75rem',
                        gap: '0.5rem',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {session.name}
                      </p>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {format(session.date, 'd MMM yyyy', { locale: es })}
                        </p>
                        {session.variant && (
                          <p
                            style={{
                              fontSize: '0.7rem',
                              color: 'var(--color-primary)',
                              marginTop: '0.1rem',
                              fontWeight: 500,
                            }}
                          >
                            {session.variant}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {session.sets.map((set, setIdx) => (
                        <span
                          key={setIdx}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: 'rgba(255,255,255,0.05)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {set.weight} × {set.reps}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContentFullScreen>
    </Dialog>
  );
}
