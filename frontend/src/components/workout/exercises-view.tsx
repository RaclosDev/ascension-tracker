import '@/styles/exercise-library.css';
import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { BASE_EXERCISES, EXERCISE_CATALOG } from '@/lib/workout/exercises';
import type { Equipment, Exercise, MuscleGroup } from '@/lib/workout/types';
import {
  useCustomExercises,
  useSaveCustomExercise,
  useUpdateCustomExercise,
  useDeleteCustomExercise,
  useRecentWorkouts,
  useWorkoutPreferencesActions,
  useUpdateWorkoutPreferences,
} from '@/lib/workout/api';

import { useExerciseFilters } from '@/hooks/workout/useExerciseFilters';
import { ExerciseCardItem } from './exercises/ExerciseCardItem';
import { ExerciseFilterBar } from './exercises/ExerciseFilterBar';
import { CreateExerciseModal } from './exercises/CreateExerciseModal';
import { MergeExerciseModal } from './exercises/MergeExerciseModal';
import { DeleteExerciseModal } from './exercises/DeleteExerciseModal';
import { ChangeGifModal } from './exercises/ChangeGifModal';
import { RenameExerciseModal } from './exercises/RenameExerciseModal';
import { ExerciseVariantsTab } from './exercises/ExerciseVariantsTab';
import { ExercisesLoadingSkeleton } from './exercises/ExercisesLoadingSkeleton';
import { ExerciseDetailsModal } from './exercise-details-modal';
import { TabAction } from './tab-action';

export default function ExercisesView() {
  const { data: customExercises = [], isLoading } = useCustomExercises();
  const { data: recentWorkouts = [] } = useRecentWorkouts(180);
  const saveExerciseMutation = useSaveCustomExercise();
  const updateExerciseMutation = useUpdateCustomExercise();
  const deleteExerciseMutation = useDeleteCustomExercise();

  const { prefs, setExerciseAlias, addGlobalMachine, addGlobalGrip, setExerciseGif } =
    useWorkoutPreferencesActions();
  const { mutate: updatePrefs } = useUpdateWorkoutPreferences();

  const hiddenEquipments = prefs?.hiddenEquipments || [];
  const aliases = prefs?.exerciseAliases || {};
  const customGifs = prefs?.exerciseGifs || {};
  const globalMachines = prefs?.globalMachines || [];
  const globalGrips = prefs?.globalGrips || [];

  const filterState = useExerciseFilters({
    customExercises,
    hiddenEquipments,
    aliases,
    recentWorkouts,
  });
  const { filter, filteredExercises, lastUsedMap, usageCountMap } = filterState;

  const [creating, setCreating] = useState(false);
  const [initialVariantName, setInitialVariantName] = useState<string | undefined>(undefined);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null);
  const [mergingExercise, setMergingExercise] = useState<Exercise | null>(null);
  const [changeGifId, setChangeGifId] = useState<string | null>(null);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const allExercises = useMemo(
    () => [...BASE_EXERCISES, ...customExercises, ...EXERCISE_CATALOG],
    [customExercises],
  );

  const handleCreateOrUpdate = (payload: {
    name: string;
    muscle: MuscleGroup;
    equipment: Equipment;
    gifUrl?: string;
  }) => {
    if (editingExercise) {
      updateExerciseMutation.mutate({ ...editingExercise, ...payload });
      if (payload.gifUrl !== undefined) {
        setExerciseGif(editingExercise.id, payload.gifUrl);
      }
      setEditingExercise(null);
    } else {
      const tempId = Date.now().toString();
      saveExerciseMutation.mutate({ ...payload, id: tempId } as Exercise, {
        onSuccess: (saved: Exercise) => {
          if (payload.gifUrl) {
            setExerciseGif(saved?.id || tempId, payload.gifUrl);
          }
        },
      });
      setCreating(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingExercise) {
      deleteExerciseMutation.mutate(deletingExercise.id);
      setDeletingExercise(null);
    }
  };

  if (isLoading) return <ExercisesLoadingSkeleton />;

  return (
    <div className="flex flex-col gap-4">
      <TabAction>
        <button
          type="button"
          onClick={() => {
            setInitialVariantName(undefined);
            setCreating(true);
          }}
          className="btn btn-primary tab-action-btn"
        >
          <Plus size={16} aria-hidden /> <span className="tab-action-label">Crear ejercicio</span>
        </button>
      </TabAction>

      <section className="card ex-panel">
        <ExerciseFilterBar {...filterState} hiddenEquipments={hiddenEquipments} />

        {filter === 'variantes' ? (
          <ExerciseVariantsTab
            globalGrips={globalGrips}
            globalMachines={globalMachines}
            onAddGrip={addGlobalGrip}
            onRemoveGrip={(g) =>
              updatePrefs((current) => ({
                ...current,
                globalGrips: current.globalGrips.filter((x) => x !== g),
              }))
            }
            onAddMachine={addGlobalMachine}
            onRemoveMachine={(m) =>
              updatePrefs((current) => ({
                ...current,
                globalMachines: current.globalMachines.filter((x) => x !== m),
              }))
            }
          />
        ) : filteredExercises.length === 0 ? (
          <p className="wk-empty">Ningún ejercicio coincide con la búsqueda.</p>
        ) : (
          <ul className="ex-list">
            {filteredExercises.map((ex) => (
              <ExerciseCardItem
                key={ex.id}
                exercise={ex}
                alias={aliases[ex.id]}
                customGif={customGifs[ex.id]}
                lastUsedTimestamp={lastUsedMap.get(ex.id)}
                usageCount={usageCountMap.get(ex.id)}
                isMenuOpen={menuOpenId === ex.id}
                onToggleMenu={() => setMenuOpenId(menuOpenId === ex.id ? null : ex.id)}
                onSelect={setSelectedExercise}
                onEdit={setEditingExercise}
                onRename={(e) => setRenameTargetId(e.id)}
                onAddVariant={(e) => {
                  setInitialVariantName(`${aliases[e.id] || e.name} ()`);
                  setCreating(true);
                }}
                onChangeGif={(e) => setChangeGifId(e.id)}
                onMerge={setMergingExercise}
                onDelete={setDeletingExercise}
              />
            ))}
          </ul>
        )}
      </section>

      <CreateExerciseModal
        isOpen={creating || !!editingExercise}
        onClose={() => {
          setCreating(false);
          setEditingExercise(null);
          setInitialVariantName(undefined);
        }}
        initialData={
          editingExercise
            ? {
                ...editingExercise,
                gifUrl: customGifs[editingExercise.id] || editingExercise.gifUrl,
              }
            : null
        }
        initialName={initialVariantName}
        hiddenEquipments={hiddenEquipments}
        onSubmit={handleCreateOrUpdate}
      />

      <MergeExerciseModal
        isOpen={!!mergingExercise}
        onClose={() => setMergingExercise(null)}
        sourceExercise={mergingExercise}
        allExercises={allExercises}
        history={recentWorkouts}
        customExercises={customExercises}
        hiddenEquipments={hiddenEquipments}
        customGifs={customGifs}
        aliases={aliases}
      />

      <DeleteExerciseModal
        isOpen={!!deletingExercise}
        onClose={() => setDeletingExercise(null)}
        exercise={deletingExercise}
        usageCount={deletingExercise ? usageCountMap.get(deletingExercise.id) : 0}
        onConfirm={handleDeleteConfirm}
      />

      <ChangeGifModal
        isOpen={!!changeGifId}
        onClose={() => setChangeGifId(null)}
        exerciseId={changeGifId}
        onSelectGif={(id, url) => {
          setExerciseGif(id, url);
          setChangeGifId(null);
        }}
      />

      <RenameExerciseModal
        isOpen={!!renameTargetId}
        onClose={() => setRenameTargetId(null)}
        exerciseId={renameTargetId}
        currentName={
          renameTargetId
            ? aliases[renameTargetId] ||
              allExercises.find((e) => e.id === renameTargetId)?.name ||
              ''
            : ''
        }
        onSave={(id, alias) => {
          setExerciseAlias(id, alias);
          setRenameTargetId(null);
        }}
      />

      <ExerciseDetailsModal exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />
    </div>
  );
}
