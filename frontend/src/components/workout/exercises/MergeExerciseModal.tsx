import { useState, useEffect, useMemo } from 'react';
import { Search, AlertTriangle, Plus, Image as ImageIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/api/client';
import {
  Dialog,
  DialogContentFullScreen,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { EQUIPMENT_OPTIONS, MUSCLE_OPTIONS } from '@/lib/workout/equipmentOptions';
import { normalizeString } from '@/lib/workout/format';
import { MUSCLE_LABEL, type Equipment, type Exercise, type MuscleGroup } from '@/lib/workout/types';
import { calculateMergeMatchScore } from '@/utils/stringMetrics';

export interface MergeExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceExercise: Exercise | null;
  allExercises: Exercise[];
  history: Array<{ exercises: Array<{ exerciseId: string }>; startedAt: number; id?: string }>;
  customExercises: Exercise[];
  hiddenEquipments?: string[];
  customGifs?: Record<string, string>;
  aliases?: Record<string, string>;
}

export function MergeExerciseModal({
  isOpen,
  onClose,
  sourceExercise,
  allExercises,
  history,
  customExercises,
  hiddenEquipments = [],
  customGifs = {},
  aliases = {},
}: MergeExerciseModalProps) {
  const queryClient = useQueryClient();
  const [targetQuery, setTargetQuery] = useState('');
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'ALL'>('ALL');
  const [filterEquip, setFilterEquip] = useState<Equipment | 'ALL'>('ALL');
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTargetQuery('');
      setFilterMuscle('ALL');
      setFilterEquip('ALL');
      setConfirmTargetId(null);
      setIsMerging(false);
    }
  }, [isOpen]);

  const targetList = useMemo(() => {
    if (!sourceExercise) return [];

    const ignoreWords = new Set([
      'smith',
      'machine',
      'barbell',
      'dumbbell',
      'cable',
      'band',
      'kettlebell',
    ]);
    const sourceWords = normalizeString(sourceExercise.name)
      .split(/[\s()]+/)
      .filter((w: string) => w.length > 2 && !ignoreWords.has(w));

    const isSearchingOrFiltering =
      Boolean(targetQuery.trim()) || filterMuscle !== 'ALL' || filterEquip !== 'ALL';

    return allExercises
      .filter((ex) => !hiddenEquipments.includes(ex.equipment))
      .filter((ex) => ex.id !== sourceExercise.id)
      .filter((ex) => filterMuscle === 'ALL' || ex.muscle === filterMuscle)
      .filter((ex) => filterEquip === 'ALL' || ex.equipment === filterEquip)
      .filter((ex) => {
        const q = normalizeString(targetQuery.trim());
        if (!q) return true;
        const queryWords = q.split(/\s+/);
        const targetName = normalizeString(aliases[ex.id] || ex.name);
        const originalName = normalizeString(ex.name);
        const muscleName = normalizeString(
          MUSCLE_LABEL[ex.muscle as keyof typeof MUSCLE_LABEL] || '',
        );
        const equipName = normalizeString(ex.equipment);
        const tagsName = normalizeString((ex.tags || []).join(' '));
        return queryWords.every(
          (w: string) =>
            targetName.includes(w) ||
            originalName.includes(w) ||
            muscleName.includes(w) ||
            equipName.includes(w) ||
            tagsName.includes(w),
        );
      })
      .map((ex) => {
        const score = calculateMergeMatchScore({
          sourceName: sourceExercise.name,
          sourceMuscle: sourceExercise.muscle,
          sourceEquipment: sourceExercise.equipment,
          targetName: ex.name,
          targetMuscle: ex.muscle,
          targetEquipment: ex.equipment,
          sourceTokens: sourceWords,
          isSearchingOrFiltering,
        });
        return { ex, score };
      })
      .filter((item) => isSearchingOrFiltering || item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.ex);
  }, [
    sourceExercise,
    allExercises,
    hiddenEquipments,
    targetQuery,
    filterMuscle,
    filterEquip,
    aliases,
  ]);

  async function handleConfirmMerge() {
    if (!sourceExercise || !confirmTargetId || isMerging) return;

    setIsMerging(true);
    const toastId = toast.loading('Fusionando ejercicios...');

    try {
      const sourceId = sourceExercise.id;
      const toUpdate = history.filter((w) => w.exercises.some((e) => e.exerciseId === sourceId));

      const workoutPromises = toUpdate.map((w) => {
        const updated = {
          ...w,
          exercises: w.exercises.map((e) =>
            e.exerciseId === sourceId ? { ...e, exerciseId: confirmTargetId } : e,
          ),
        };
        if ('id' in updated && typeof updated.id === 'string' && updated.id.includes('-')) {
          return api.put(`/workouts/${updated.id}`, updated);
        } else {
          return api.post('/workouts', updated);
        }
      });
      await Promise.all(workoutPromises);

      // Fetch and update templates containing the source exercise
      try {
        const { data: templates = [] } =
          await api.get<
            Array<{
              id: string;
              name: string;
              exercises: Array<{ exerciseId: string; variant?: unknown }>;
            }>
          >('/workouts/templates');
        const templatesToUpdate = templates.filter((tpl) =>
          tpl.exercises.some((e) => e.exerciseId === sourceId),
        );
        if (templatesToUpdate.length > 0) {
          const templatePromises = templatesToUpdate.map((tpl) => {
            const updatedTpl = {
              ...tpl,
              exercises: tpl.exercises.map((e) =>
                e.exerciseId === sourceId ? { ...e, exerciseId: confirmTargetId } : e,
              ),
            };
            return api.post('/workouts/templates', updatedTpl);
          });
          await Promise.all(templatePromises);
          queryClient.invalidateQueries({ queryKey: ['workoutTemplates'] });
        }
      } catch (templateErr) {
        console.error(
          'Error updating templates during merge:',
          templateErr instanceof Error ? templateErr.message : String(templateErr),
        );
      }

      const isCustom = customExercises.some((e) => e.id === sourceId);
      if (isCustom) {
        await api.delete(`/workouts/custom-exercises/${sourceId}`);
      }

      queryClient.invalidateQueries({ queryKey: ['workoutHistory'] });
      queryClient.invalidateQueries({ queryKey: ['recentWorkouts'] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workoutTemplates'] });
      if (isCustom) {
        queryClient.invalidateQueries({ queryKey: ['customExercises'] });
      }

      toast.success('Fusión completada con éxito', { id: toastId });
      onClose();
    } catch (err: unknown) {
      console.error('Error merging exercises:', err instanceof Error ? err.message : String(err));
      toast.error('Error al fusionar ejercicios', { id: toastId });
    } finally {
      setIsMerging(false);
    }
  }

  const confirmTargetExercise = confirmTargetId
    ? allExercises.find((e) => e.id === confirmTargetId)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContentFullScreen
        style={{
          padding:
            'calc(env(safe-area-inset-top, 44px) + 1.5rem) 1.5rem calc(env(safe-area-inset-bottom, 20px) + 1.5rem) 1.5rem',
          background: 'var(--bg-primary)',
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Fusionar Ejercicio
          </DialogTitle>
          <DialogDescription style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Busca y selecciona el ejercicio que quieras conservar. Todos los entrenamientos
            asociados a{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{sourceExercise?.name}</strong> se
            pasarán al nuevo ejercicio.
          </DialogDescription>
        </DialogHeader>

        {!confirmTargetId ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginTop: '1rem',
              marginBottom: '1rem',
              flex: 1,
              minHeight: 0,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ position: 'relative' }}>
                <label htmlFor="merge-exercise-target-search" className="sr-only">
                  Buscar ejercicio de destino
                </label>
                <Search
                  size={16}
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)',
                  }}
                />
                <input
                  id="merge-exercise-target-search"
                  type="search"
                  aria-label="Buscar ejercicio de destino para fusión"
                  className="form-input"
                  value={targetQuery}
                  onChange={(e) => setTargetQuery(e.target.value)}
                  placeholder="Buscar ejercicio de destino..."
                  style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.25rem' }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <label htmlFor="merge-muscle-filter" className="sr-only">
                  Filtrar por grupo muscular
                </label>
                <select
                  id="merge-muscle-filter"
                  aria-label="Filtrar por grupo muscular"
                  className="form-input"
                  value={filterMuscle}
                  onChange={(e) => setFilterMuscle(e.target.value as MuscleGroup | 'ALL')}
                  style={{ width: '50%', padding: '0.5rem', fontSize: '0.8rem' }}
                >
                  <option value="ALL">Músculo (Todos)</option>
                  {MUSCLE_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <label htmlFor="merge-equipment-filter" className="sr-only">
                  Filtrar por equipamiento
                </label>
                <select
                  id="merge-equipment-filter"
                  aria-label="Filtrar por equipamiento"
                  className="form-input"
                  value={filterEquip}
                  onChange={(e) => setFilterEquip(e.target.value as Equipment | 'ALL')}
                  style={{ width: '50%', padding: '0.5rem', fontSize: '0.8rem' }}
                >
                  <option value="ALL">Material (Todos)</option>
                  {EQUIPMENT_OPTIONS.filter((eq) => !hiddenEquipments.includes(eq.id)).map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {targetList.length > 0 ? (
              <>
                {!targetQuery.trim() && (
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Sugerencias:
                  </p>
                )}
                <ul
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    listStyle: 'none',
                    margin: 0,
                    padding: '0 0.25rem 0 0',
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                  }}
                >
                  {targetList.map((ex) => (
                    <li key={ex.id}>
                      <button
                        type="button"
                        onClick={() => setConfirmTargetId(ex.id)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.75rem 1rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {customGifs[ex.id] !== 'none' && (customGifs[ex.id] || ex.gifUrl) ? (
                            <img
                              src={customGifs[ex.id] || ex.gifUrl}
                              alt={ex.name}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                background: 'var(--bg-primary)',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '8px',
                                background: 'var(--bg-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <ImageIcon size={18} style={{ color: 'var(--text-secondary)' }} />
                            </div>
                          )}
                          <div>
                            <p
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                fontSize: '0.95rem',
                                margin: 0,
                              }}
                            >
                              {ex.name}
                              {ex.custom && (
                                <span className="text-[0.55rem] px-1 py-[0.1rem] bg-[var(--accent-primary-light)] text-[var(--bg-primary)] rounded-sm uppercase tracking-wide font-bold">
                                  Custom
                                </span>
                              )}
                            </p>
                            <p
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                                textTransform: 'capitalize',
                                marginTop: '0.1rem',
                                marginBottom: 0,
                              }}
                            >
                              {MUSCLE_LABEL[ex.muscle as keyof typeof MUSCLE_LABEL]} ·{' '}
                              {ex.equipment}
                            </p>
                          </div>
                        </div>
                        <Plus size={16} style={{ color: 'var(--text-secondary)' }} />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p
                style={{
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  padding: '1.5rem',
                }}
              >
                Escribe para buscar el ejercicio destino.
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginTop: '1rem',
              marginBottom: '1rem',
              flex: 1,
              minHeight: 0,
            }}
          >
            <div
              style={{
                padding: '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <AlertTriangle
                  size={20}
                  style={{ color: 'var(--color-danger)', flexShrink: 0, marginTop: '0.1rem' }}
                />
                <div>
                  <h4
                    style={{
                      color: 'var(--color-danger)',
                      fontWeight: 600,
                      margin: 0,
                      fontSize: '0.95rem',
                    }}
                  >
                    Confirmar Fusión
                  </h4>
                  <p
                    style={{
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      marginTop: '0.5rem',
                      lineHeight: 1.5,
                    }}
                  >
                    Estás a punto de mover todos los datos de{' '}
                    <strong>{sourceExercise?.name}</strong> hacia{' '}
                    <strong>{confirmTargetExercise?.name}</strong>.
                  </p>
                  <p
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      marginTop: '0.5rem',
                      lineHeight: 1.5,
                    }}
                  >
                    Esta acción no se puede deshacer y el ejercicio original será eliminado.
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
                marginTop: '0.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => setConfirmTargetId(null)}
                className="btn btn-secondary"
                disabled={isMerging}
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={handleConfirmMerge}
                className="btn btn-danger"
                disabled={isMerging}
              >
                {isMerging ? 'Fusionando...' : 'Fusionar Definitivamente'}
              </button>
            </div>
          </div>
        )}
      </DialogContentFullScreen>
    </Dialog>
  );
}
