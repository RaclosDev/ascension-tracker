import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Search,
  Dumbbell,
  Link as LinkIcon,
  AlertTriangle,
  Image as ImageIcon,
  MoreVertical,
} from 'lucide-react';
import { EXERCISE_CATALOG, BASE_EXERCISES } from '@/lib/workout/exercises';
import type { Exercise } from '@/lib/workout/types';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/api/client';

import { normalizeString } from '@/lib/workout/format';
import { MUSCLE_LABEL, type MuscleGroup, type Equipment } from '@/lib/workout/types';
import { ExerciseDetailsModal } from './exercise-details-modal';
import {
  Dialog,
  DialogContent,
  DialogContentFullScreen,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let i = 1; i <= a.length; i++) matrix[0][i] = i;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export const EQUIPMENT_OPTIONS = [
  { id: 'banda', label: 'Banda Elástica' },
  { id: 'barra', label: 'Barra' },
  { id: 'kettlebell', label: 'Kettlebell' },
  { id: 'mancuernas', label: 'Mancuernas' },
  { id: 'maquina', label: 'Máquina' },
  { id: 'multipower', label: 'Multipower (Smith)' },
  { id: 'peso corporal', label: 'Peso Corporal' },
  { id: 'polea', label: 'Polea' },
].sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label, 'es'));

export const MUSCLE_OPTIONS = Object.entries(MUSCLE_LABEL)
  .map(([id, label]) => ({ id, label }))
  .sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label, 'es'));

import { Skeleton } from '@/components/ui/skeleton';
import {
  useCustomExercises,
  useSaveCustomExercise,
  useDeleteCustomExercise,
  useRecentWorkouts,
  useWorkoutPreferencesActions,
  useUpdateWorkoutPreferences,
} from '@/lib/workout/api';

export function ExercisesView() {
  const { data: customExercises = [], isLoading } = useCustomExercises();
  const saveExerciseMutation = useSaveCustomExercise();
  const deleteExerciseMutation = useDeleteCustomExercise();

  const queryClient = useQueryClient();

  const deleteCustomExercise = (id: string) => deleteExerciseMutation.mutate(id);
  const addCustomExercise = (ex: Partial<Exercise>) =>
    saveExerciseMutation.mutate({ ...ex, id: Date.now().toString() } as Exercise);
  const updateCustomExercise = (id: string, patch: Partial<Exercise>) => {
    const ex = customExercises.find((e: import('@/lib/workout/types').Exercise) => e.id === id);
    if (ex) saveExerciseMutation.mutate({ ...ex, ...patch });
  };

  const { prefs, setExerciseAlias, addGlobalMachine, addGlobalGrip, setExerciseGif } =
    useWorkoutPreferencesActions();
  const { mutate: updatePrefs } = useUpdateWorkoutPreferences();
  const aliases = prefs?.exerciseAliases || {};
  const customGifs = prefs?.exerciseGifs || {};
  const hiddenEquipments = prefs?.hiddenEquipments || [];
  const globalMachines = prefs?.globalMachines || [];
  const globalGrips = prefs?.globalGrips || [];

  const removeGlobalMachine = (name: string) => {
    if (!prefs) return;
    updatePrefs({ ...prefs, globalMachines: prefs.globalMachines.filter((m) => m !== name) });
  };
  const removeGlobalGrip = (name: string) => {
    if (!prefs) return;
    updatePrefs({ ...prefs, globalGrips: prefs.globalGrips.filter((g) => g !== name) });
  };
  const [newGrip, setNewGrip] = useState('');
  const [newMachine, setNewMachine] = useState('');

  const { data: recentWorkouts = [] } = useRecentWorkouts(180);
  const history = recentWorkouts;

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'basicos' | 'todos' | 'custom' | 'variantes'>('basicos');
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'ALL'>('ALL');
  const [filterEquip, setFilterEquip] = useState<Equipment | 'ALL'>('ALL');
  const [creating, setCreating] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [mergeSourceId, setMergeSourceId] = useState<string | null>(null);
  const [mergeTargetQuery, setMergeTargetQuery] = useState('');
  const [mergeFilterMuscle, setMergeFilterMuscle] = useState<MuscleGroup | 'ALL'>('ALL');
  const [mergeFilterEquip, setMergeFilterEquip] = useState<Equipment | 'ALL'>('ALL');
  const [mergeConfirmTargetId, setMergeConfirmTargetId] = useState<string | null>(null);
  const [changeGifId, setChangeGifId] = useState<string | null>(null);
  const [changeGifQuery, setChangeGifQuery] = useState('');

  useEffect(() => {
    if (!mergeSourceId) {
      setMergeTargetQuery('');
      setMergeFilterMuscle('ALL');
      setMergeFilterEquip('ALL');
      setMergeConfirmTargetId(null);
    }
  }, [mergeSourceId]);

  // Form state
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState<MuscleGroup>('pecho');
  const [newEquip, setNewEquip] = useState<Equipment>('barra');
  const [newImage, setNewImage] = useState<string | undefined>(undefined);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameInputValue, setRenameInputValue] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate last used times and usage count
  const lastUsedMap = new Map<string, number>();
  const usageCountMap = new Map<string, number>();
  history.forEach((w: { exercises: Array<{ exerciseId: string }>; startedAt: number }) => {
    w.exercises.forEach((ex) => {
      const current = lastUsedMap.get(ex.exerciseId) || 0;
      if (w.startedAt > current) {
        lastUsedMap.set(ex.exerciseId, w.startedAt);
      }
      usageCountMap.set(ex.exerciseId, (usageCountMap.get(ex.exerciseId) || 0) + 1);
    });
  });

  const list = (
    filter === 'custom' ? customExercises : filter === 'basicos' ? BASE_EXERCISES : EXERCISE_CATALOG
  )
    .filter(
      (ex: import('@/lib/workout/types').Exercise) => !hiddenEquipments.includes(ex.equipment),
    )
    .filter((ex: import('@/lib/workout/types').Exercise) => {
      const q = normalizeString(query.trim());
      if (!q) return true;
      const queryWords = q.split(/\s+/);
      const targetName = normalizeString(aliases[ex.id] || ex.name);
      const originalName = normalizeString(ex.name);
      const muscleName = normalizeString(MUSCLE_LABEL[ex.muscle as keyof typeof MUSCLE_LABEL]);
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
    .filter(
      (ex: import('@/lib/workout/types').Exercise) =>
        filterMuscle === 'ALL' || ex.muscle === filterMuscle,
    )
    .filter(
      (ex: import('@/lib/workout/types').Exercise) =>
        filterEquip === 'ALL' || ex.equipment === filterEquip,
    )
    .sort((a: { id: string }, b: { id: string }) => {
      const aTime = lastUsedMap.get(a.id) || 0;
      const bTime = lastUsedMap.get(b.id) || 0;
      if (aTime !== bTime) {
        return bTime - aTime;
      }
      return 0; // fallback to original order
    });

  function handleCreate() {
    if (!newName.trim()) return;
    addCustomExercise({
      name: newName.trim(),
      muscle: newMuscle,
      equipment: newEquip,
      gifUrl: newImage,
    });
    setCreating(false);
    setNewName('');
    setNewImage(undefined);
  }

  function handleUpdate() {
    if (!editingExercise || !newName.trim()) return;
    updateCustomExercise(editingExercise.id, {
      name: newName.trim(),
      muscle: newMuscle,
      equipment: newEquip,
      gifUrl: newImage,
    });
    setEditingExercise(null);
    setNewName('');
    setNewImage(undefined);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setNewImage(dataUrl);
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleConfirmMerge() {
    if (!mergeSourceId || !mergeConfirmTargetId) return;

    const toastId = toast.loading('Fusionando ejercicios...');

    try {
      // Find all workouts using the source exercise
      const toUpdate = history.filter((w: { exercises: Array<{ exerciseId: string }> }) =>
        w.exercises.some((e) => e.exerciseId === mergeSourceId),
      );

      for (const w of toUpdate) {
        const updated = {
          ...w,
          exercises: w.exercises.map((e: import('@/lib/workout/types').WorkoutExercise) =>
            e.exerciseId === mergeSourceId ? { ...e, exerciseId: mergeConfirmTargetId } : e,
          ),
        };
        if ('id' in updated && typeof updated.id === 'string' && updated.id.includes('-')) {
          await api.put(`/workouts/${updated.id}`, updated);
        } else {
          await api.post('/workouts', updated);
        }
      }

      // If source was a custom exercise, delete it
      const isCustom = customExercises.some(
        (e: import('@/lib/workout/types').Exercise) => e.id === mergeSourceId,
      );
      if (isCustom) {
        await api.delete(`/workouts/custom-exercises/${mergeSourceId}`);
      }

      queryClient.invalidateQueries({ queryKey: ['workoutHistory'] });
      queryClient.invalidateQueries({ queryKey: ['recentWorkouts'] });
      if (isCustom) {
        queryClient.invalidateQueries({ queryKey: ['customExercises'] });
      }

      toast.success('Fusión completada con éxito', { id: toastId });
    } catch (err: unknown) {
      console.error('Error merging exercises:', err);
      toast.error('Error al fusionar ejercicios', { id: toastId });
    }

    setMergeSourceId(null);
    setMergeConfirmTargetId(null);
    setMergeTargetQuery('');
    setMergeFilterMuscle('ALL');
    setMergeFilterEquip('ALL');
  }

  function handleRename() {
    if (renameTargetId && renameInputValue.trim()) {
      setExerciseAlias(renameTargetId, renameInputValue.trim());
    }
    setRenameTargetId(null);
    setRenameInputValue('');
  }

  const allExercises = [...BASE_EXERCISES, ...customExercises, ...EXERCISE_CATALOG];
  const sourceExercise = mergeSourceId ? allExercises.find((e) => e.id === mergeSourceId) : null;

  let mergeTargetList: Exercise[] = [];
  if (sourceExercise) {
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
      mergeTargetQuery.trim() || mergeFilterMuscle !== 'ALL' || mergeFilterEquip !== 'ALL';

    mergeTargetList = allExercises
      .filter((ex) => !hiddenEquipments.includes(ex.equipment))
      .filter((ex) => ex.id !== mergeSourceId)
      .filter((ex) => mergeFilterMuscle === 'ALL' || ex.muscle === mergeFilterMuscle)
      .filter((ex) => mergeFilterEquip === 'ALL' || ex.equipment === mergeFilterEquip)
      .filter((ex) => {
        const q = normalizeString(mergeTargetQuery.trim());
        if (!q) return true;
        const queryWords = q.split(/\s+/);
        const targetName = normalizeString(aliases[ex.id] || ex.name);
        const originalName = normalizeString(ex.name);
        const muscleName = normalizeString(MUSCLE_LABEL[ex.muscle as keyof typeof MUSCLE_LABEL]);
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
        let score = 0;
        if (ex.muscle === sourceExercise.muscle) score += 50; // Heavily prioritize same muscle group
        if (ex.equipment === sourceExercise.equipment) score += 20; // Prioritize same equipment

        const targetName = ex.name.toLowerCase();
        for (const w of sourceWords) {
          if (targetName.includes(w)) score += 5; // Word match
        }

        const dist = levenshtein(sourceExercise.name.toLowerCase(), targetName);
        score -= dist * 0.1; // Small penalty as tie-breaker for name similarity

        if (isSearchingOrFiltering) score += 1000;

        return { ex, score };
      })
      .filter((item) => isSearchingOrFiltering || item.score > 0)
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
      .map((item) => item.ex);
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginBottom: '-0.5rem',
          }}
        >
          <Skeleton className="h-8 w-24 rounded-md" />
        </header>

        <section
          className="card"
          style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Skeleton className="h-10 w-full rounded-md" />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Skeleton className="h-10 flex-1 rounded-md" />
              <Skeleton className="h-10 flex-1 rounded-md" />
            </div>
          </div>

          <ul
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              padding: 0,
              margin: 0,
              listStyle: 'none',
            }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem',
                  borderRadius: '10px',
                }}
              >
                <Skeleton className="h-10 w-10 rounded-md" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          marginBottom: '-0.5rem',
        }}
      >
        <button
          onClick={() => setCreating(true)}
          className="btn btn-primary btn-sm"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            whiteSpace: 'nowrap',
            padding: '0.4rem 0.75rem',
          }}
        >
          <Plus size={16} />
          Crear
        </button>
      </header>

      <section
        className="card"
        style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
              }}
            />
            <input
              className="form-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar press, sentadilla"
              style={{ width: '100%', padding: '0.45rem 0.5rem 0.45rem 2rem', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select
              className="form-input"
              value={filterMuscle}
              onChange={(e) =>
                setFilterMuscle(e.target.value as import('@/lib/workout/types').MuscleGroup | 'ALL')
              }
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}
            >
              <option value="ALL">Músculo (Todos)</option>
              {MUSCLE_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              className="form-input"
              value={filterEquip}
              onChange={(e) =>
                setFilterEquip(e.target.value as import('@/lib/workout/types').Equipment | 'ALL')
              }
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}
            >
              <option value="ALL">Material (Todos)</option>
              {EQUIPMENT_OPTIONS.filter((eq) => !hiddenEquipments.includes(eq.id)).map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.label}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              background: 'var(--bg-secondary)',
              padding: '0.2rem',
              borderRadius: '8px',
            }}
          >
            <button
              onClick={() => setFilter('basicos')}
              style={{
                flex: 1,
                padding: '0.3rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: filter === 'basicos' ? 'var(--color-primary)' : 'transparent',
                color: filter === 'basicos' ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              Básicos
            </button>
            <button
              onClick={() => setFilter('todos')}
              style={{
                flex: 1,
                padding: '0.3rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: filter === 'todos' ? 'var(--color-primary)' : 'transparent',
                color: filter === 'todos' ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('custom')}
              style={{
                flex: 1,
                padding: '0.3rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: filter === 'custom' ? 'var(--color-primary)' : 'transparent',
                color: filter === 'custom' ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              Personalizados
            </button>
          </div>
        </div>

        {filter === 'variantes' ? (
          <div
            style={{ padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}
          >
            <div>
              <h3
                style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}
              >
                Agarres Guardados
              </h3>
              <div
                style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}
              >
                {globalGrips.length === 0 && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    No hay agarres guardados.
                  </div>
                )}
                {globalGrips.map((g) => (
                  <div
                    key={g}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.4rem 0.8rem',
                      background: 'var(--bg-elevated)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span>{g}</span>
                    <button
                      onClick={() => removeGlobalGrip(g)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-danger)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  value={newGrip}
                  onChange={(e) => setNewGrip(e.target.value)}
                  placeholder="Añadir agarre..."
                  className="form-input"
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium)',
                    background: 'transparent',
                  }}
                />
                <button
                  onClick={() => {
                    if (newGrip.trim()) {
                      addGlobalGrip(newGrip.trim());
                      setNewGrip('');
                    }
                  }}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}
                >
                  Añadir
                </button>
              </div>
            </div>

            <div>
              <h3
                style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}
              >
                Máquinas / Marcas
              </h3>
              <div
                style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}
              >
                {globalMachines.length === 0 && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    No hay máquinas guardadas.
                  </div>
                )}
                {globalMachines.map((m) => (
                  <div
                    key={m}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.4rem 0.8rem',
                      background: 'var(--bg-elevated)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span>{m}</span>
                    <button
                      onClick={() => removeGlobalMachine(m)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-danger)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  value={newMachine}
                  onChange={(e) => setNewMachine(e.target.value)}
                  placeholder="Añadir máquina..."
                  className="form-input"
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium)',
                    background: 'transparent',
                  }}
                />
                <button
                  onClick={() => {
                    if (newMachine.trim()) {
                      addGlobalMachine(newMachine.trim());
                      setNewMachine('');
                    }
                  }}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}
                >
                  Añadir
                </button>
              </div>
            </div>
          </div>
        ) : list.length === 0 ? (
          <div
            style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}
          >
            <p>No hay ejercicios que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <ul
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              listStyle: 'none',
              margin: 0,
              padding: 0,
            }}
          >
            {list.map((ex: import('@/lib/workout/types').Exercise) => (
              <li
                key={ex.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.75rem',
                  background: 'var(--bg-glass)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '10px',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                <button
                  onClick={() => setSelectedExercise(ex)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flex: 1,
                    minWidth: 0,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    padding: 0,
                  }}
                >
                  {customGifs[ex.id] !== 'none' && (customGifs[ex.id] || ex.gifUrl) ? (
                    <img
                      src={customGifs[ex.id] || ex.gifUrl}
                      alt=""
                      loading="lazy"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        background: 'var(--bg-primary)',
                        flexShrink: 0,
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
                        flexShrink: 0,
                      }}
                    >
                      <Dumbbell size={18} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                  )}
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <h3
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {aliases[ex.id] || ex.name}
                      {ex.custom && (
                        <span className="text-[0.6rem] px-1.5 py-0.5 bg-[var(--accent-primary-light)] text-[var(--bg-primary)] rounded-sm uppercase tracking-wide font-bold shrink-0">
                          Custom
                        </span>
                      )}
                    </h3>
                    <p
                      style={{
                        marginTop: '0.15rem',
                        fontSize: '0.7rem',
                        color: 'var(--text-secondary)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {MUSCLE_LABEL[ex.muscle as keyof typeof MUSCLE_LABEL]} · {ex.equipment}
                      {lastUsedMap.has(ex.id) && (
                        <span style={{ color: 'var(--accent-primary-light)' }}>
                          {' '}
                          · {usageCountMap.get(ex.id)}× ·{' '}
                          {new Date(lastUsedMap.get(ex.id)!).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </p>
                  </div>
                </button>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === ex.id ? null : ex.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '0.4rem',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    aria-label="Más opciones"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {menuOpenId === ex.id && (
                    <div
                      ref={menuRef}
                      onClick={() => setMenuOpenId(null)}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        zIndex: 50,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '10px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                        minWidth: '180px',
                        padding: '0.35rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.15rem',
                      }}
                    >
                      <button
                        onClick={() => {
                          if (ex.custom) {
                            setEditingExercise(ex);
                            setNewName(ex.name);
                            setNewMuscle(ex.muscle);
                            setNewEquip(ex.equipment);
                            setNewImage(ex.gifUrl);
                          } else {
                            setRenameTargetId(ex.id);
                            setRenameInputValue(aliases[ex.id] || ex.name);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          width: '100%',
                          padding: '0.6rem 0.75rem',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          textAlign: 'left',
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                        {ex.custom ? 'Editar' : 'Renombrar'}
                      </button>
                      <button
                        onClick={() => {
                          setNewName((aliases[ex.id] || ex.name) + ' ()');
                          setNewMuscle(ex.muscle);
                          setNewEquip(ex.equipment);
                          setNewImage(ex.gifUrl);
                          setCreating(true);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          width: '100%',
                          padding: '0.6rem 0.75rem',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          textAlign: 'left',
                        }}
                      >
                        <Plus size={16} />
                        Añadir Variante
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setChangeGifId(ex.id);
                          setMenuOpenId(null);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          width: '100%',
                          padding: '0.6rem 0.75rem',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          textAlign: 'left',
                        }}
                      >
                        <ImageIcon size={16} />
                        Cambiar GIF
                      </button>

                      {ex.custom && (
                        <>
                          <button
                            onClick={() => setMergeSourceId(ex.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              width: '100%',
                              padding: '0.6rem 0.75rem',
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              borderRadius: '8px',
                              fontSize: '0.85rem',
                              textAlign: 'left',
                            }}
                          >
                            <LinkIcon size={16} />
                            Fusionar
                          </button>
                          <div
                            style={{
                              height: '1px',
                              background: 'var(--border-subtle)',
                              margin: '0.2rem 0.5rem',
                            }}
                          />
                          <button
                            onClick={() => deleteCustomExercise(ex.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              width: '100%',
                              padding: '0.6rem 0.75rem',
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              borderRadius: '8px',
                              fontSize: '0.85rem',
                              textAlign: 'left',
                            }}
                          >
                            <Trash2 size={16} />
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContentFullScreen
          style={{
            padding:
              'calc(env(safe-area-inset-top, 44px) + 1.5rem) 1.5rem calc(env(safe-area-inset-bottom, 20px) + 1.5rem) 1.5rem',
            background: 'var(--bg-primary)',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Crear Ejercicio / Variante
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Añade un nuevo ejercicio personalizado a tu catálogo.
            </DialogDescription>
          </DialogHeader>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginTop: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label
                style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}
              >
                Nombre
              </label>
              <input
                className="form-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Triceps pushdown (cuerda)"
                autoFocus
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label
                  style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}
                >
                  Músculo
                </label>
                <select
                  className="form-input"
                  value={newMuscle}
                  onChange={(e) => setNewMuscle(e.target.value as MuscleGroup)}
                >
                  {MUSCLE_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label
                  style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}
                >
                  Equipamiento
                </label>
                <select
                  className="form-input"
                  value={newEquip}
                  onChange={(e) => setNewEquip(e.target.value as Equipment)}
                >
                  {EQUIPMENT_OPTIONS.filter((eq) => !hiddenEquipments.includes(eq.id)).map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                marginTop: '0.5rem',
              }}
            >
              <label
                style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}
              >
                Foto de la Máquina (Opcional)
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  background: 'var(--bg-secondary)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px dashed var(--border-color)',
                }}
              >
                {newImage ? (
                  <img
                    src={newImage}
                    alt="Preview"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      background: 'var(--bg-primary)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      background: 'var(--bg-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ImageIcon size={20} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                La imagen se optimizará automáticamente para no ocupar espacio.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setCreating(false)} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="btn btn-primary"
              style={{ opacity: newName.trim() ? 1 : 0.5 }}
            >
              Guardar
            </button>
          </div>
        </DialogContentFullScreen>
      </Dialog>

      <Dialog open={!!changeGifId} onOpenChange={(o) => !o && setChangeGifId(null)}>
        <DialogContentFullScreen
          style={{
            padding:
              'calc(env(safe-area-inset-top, 44px) + 1.5rem) 1.5rem calc(env(safe-area-inset-bottom, 20px) + 1.5rem) 1.5rem',
            background: 'var(--bg-primary)',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Seleccionar GIF
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Busca y selecciona un ejercicio del catálogo para usar su GIF.
            </DialogDescription>
          </DialogHeader>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              marginTop: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div className="search-bar" style={{ marginBottom: '1rem' }}>
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar ejercicio..."
                className="search-input"
                value={changeGifQuery}
                onChange={(e) => setChangeGifQuery(e.target.value)}
              />
            </div>
            {EXERCISE_CATALOG.filter(
              (ex) => ex.gifUrl && ex.name.toLowerCase().includes(changeGifQuery.toLowerCase()),
            )
              .slice(0, 50)
              .map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => {
                    if (changeGifId && ex.gifUrl) {
                      setExerciseGif(changeGifId, ex.gifUrl);
                      setChangeGifId(null);
                      setChangeGifQuery('');
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <img
                    src={ex.gifUrl}
                    alt=""
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {ex.name}
                  </div>
                </button>
              ))}
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setChangeGifId(null)} className="btn btn-secondary">
              Cancelar
            </button>
          </div>
        </DialogContentFullScreen>
      </Dialog>

      <Dialog open={!!editingExercise} onOpenChange={(o) => !o && setEditingExercise(null)}>
        <DialogContentFullScreen
          style={{
            padding:
              'calc(env(safe-area-inset-top, 44px) + 1.5rem) 1.5rem calc(env(safe-area-inset-bottom, 20px) + 1.5rem) 1.5rem',
            background: 'var(--bg-primary)',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Editar Ejercicio Personalizado
            </DialogTitle>
          </DialogHeader>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginTop: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label
                style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}
              >
                Nombre
              </label>
              <input
                className="form-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label
                  style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}
                >
                  Músculo
                </label>
                <select
                  className="form-input"
                  value={newMuscle}
                  onChange={(e) => setNewMuscle(e.target.value as MuscleGroup)}
                >
                  {MUSCLE_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label
                  style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}
                >
                  Equipamiento
                </label>
                <select
                  value={newEquip}
                  onChange={(e) => setNewEquip(e.target.value as Equipment)}
                  className="form-input"
                >
                  {EQUIPMENT_OPTIONS.filter((eq) => !hiddenEquipments.includes(eq.id)).map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                marginTop: '0.5rem',
              }}
            >
              <label
                style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}
              >
                Foto de la Máquina (Opcional)
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  background: 'var(--bg-secondary)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px dashed var(--border-color)',
                }}
              >
                {newImage ? (
                  <img
                    src={newImage}
                    alt="Preview"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      background: 'var(--bg-primary)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      background: 'var(--bg-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ImageIcon size={20} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setEditingExercise(null)} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleUpdate}
              disabled={!newName.trim()}
              className="btn btn-primary"
              style={{ opacity: newName.trim() ? 1 : 0.5 }}
            >
              Actualizar
            </button>
          </div>
        </DialogContentFullScreen>
      </Dialog>

      <ExerciseDetailsModal exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />

      <Dialog open={!!mergeSourceId} onOpenChange={(o) => !o && setMergeSourceId(null)}>
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
              <strong style={{ color: 'var(--text-primary)' }}>
                {allExercises.find((e) => e.id === mergeSourceId)?.name}
              </strong>{' '}
              se pasarán al nuevo ejercicio.
            </DialogDescription>
          </DialogHeader>

          {!mergeConfirmTargetId ? (
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
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-secondary)',
                    }}
                  />
                  <input
                    className="form-input"
                    value={mergeTargetQuery}
                    onChange={(e) => setMergeTargetQuery(e.target.value)}
                    placeholder="Buscar ejercicio de destino..."
                    style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.25rem' }}
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    className="form-input"
                    value={mergeFilterMuscle}
                    onChange={(e) =>
                      setMergeFilterMuscle(
                        e.target.value as import('@/lib/workout/types').MuscleGroup | 'ALL',
                      )
                    }
                    style={{ width: '50%', padding: '0.5rem', fontSize: '0.8rem' }}
                  >
                    <option value="ALL">Músculo (Todos)</option>
                    {MUSCLE_OPTIONS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="form-input"
                    value={mergeFilterEquip}
                    onChange={(e) =>
                      setMergeFilterEquip(
                        e.target.value as import('@/lib/workout/types').Equipment | 'ALL',
                      )
                    }
                    style={{ width: '50%', padding: '0.5rem', fontSize: '0.8rem' }}
                  >
                    <option value="ALL">Material (Todos)</option>
                    {EQUIPMENT_OPTIONS.filter((eq) => !hiddenEquipments.includes(eq.id)).map(
                      (eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              {mergeTargetList.length > 0 ? (
                <>
                  {!mergeTargetQuery.trim() && (
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
                    {mergeTargetList.map((ex) => (
                      <li key={ex.id}>
                        <button
                          onClick={() => setMergeConfirmTargetId(ex.id)}
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
                      <strong>{allExercises.find((e) => e.id === mergeSourceId)?.name}</strong>{' '}
                      hacia{' '}
                      <strong>
                        {allExercises.find((e) => e.id === mergeConfirmTargetId)?.name}
                      </strong>
                      .
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
                <button onClick={() => setMergeConfirmTargetId(null)} className="btn btn-secondary">
                  Atrás
                </button>
                <button onClick={handleConfirmMerge} className="btn btn-danger">
                  Fusionar Definitivamente
                </button>
              </div>
            </div>
          )}
        </DialogContentFullScreen>
      </Dialog>

      <Dialog open={!!renameTargetId} onOpenChange={(o) => !o && setRenameTargetId(null)}>
        <DialogContent
          className="card"
          style={{
            padding: '1.5rem',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            maxWidth: '400px',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Renombrar Ejercicio
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Este nombre se mostrará en lugar del original.
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <input
              className="form-input"
              value={renameInputValue}
              onChange={(e) => setRenameInputValue(e.target.value)}
              placeholder="Ej: Press Pecho Multipower"
              style={{ width: '100%', padding: '0.75rem' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setRenameTargetId(null)} className="btn btn-secondary">
                Cancelar
              </button>
              <button
                onClick={handleRename}
                className="btn btn-primary"
                disabled={!renameInputValue.trim()}
              >
                Guardar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
