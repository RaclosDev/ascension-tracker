import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useExerciseCatalog } from '@/lib/workout/catalog-query';
import { useCustomExercises } from '@/lib/workout/api';
import { getExerciseMap } from '@/lib/workout/exercises';
import { useWorkoutStore } from '@/lib/workout/store';
import type { ActiveWorkout } from '@/lib/workout/types';

interface Props {
  workout: ActiveWorkout;
  onClose: () => void;
  onReturn: () => void;
  onSave: () => void;
}

export function IncompleteSetsDialog({ workout, onClose, onReturn, onSave }: Props) {
  const { data: catalog } = useExerciseCatalog();
  const { data: custom = [] } = useCustomExercises();
  const exercises = getExerciseMap(custom, catalog);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const pending = workout.exercises
    .map((row, rowIndex) => ({
      row,
      rowIndex,
      sets: row.sets.map((set, index) => ({ set, index })).filter(({ set }) => !set.completed),
    }))
    .filter(({ sets }) => sets.length > 0);
  const count = pending.reduce((total, row) => total + row.sets.length, 0);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="flex flex-col">
        <DialogHeader>
          <DialogTitle>Quedan series sin completar</DialogTitle>
          <DialogDescription>
            {count === 1
              ? 'Esta serie se guardará como no realizada.'
              : `Estas ${count} series se guardarán como no realizadas.`}{' '}
            Puedes añadir un motivo o volver al entrenamiento para completarlas.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto flex flex-col gap-4">
          {pending.map(({ row, rowIndex, sets }) => (
            <fieldset key={row.id} className="min-w-0 border rounded-lg p-3">
              <legend className="px-1 font-semibold">
                {exercises.get(row.exerciseId)?.name ?? `Ejercicio ${rowIndex + 1}`}
              </legend>
              {sets.map(({ set, index }) => {
                const key = `${row.id}/${set.id}`;
                return (
                  <label key={set.id} className="flex flex-col gap-1 mt-2 text-sm">
                    Serie {index + 1} · motivo (opcional)
                    <input
                      className="form-input min-h-11 w-full"
                      maxLength={200}
                      value={reasons[key] ?? set.skipReason ?? ''}
                      onChange={(event) =>
                        setReasons((current) => ({ ...current, [key]: event.target.value }))
                      }
                      placeholder="Falta de tiempo, molestias, ajuste de la sesión…"
                    />
                  </label>
                );
              })}
            </fieldset>
          ))}
        </div>
        <DialogFooter className="shrink-0">
          <button type="button" className="btn btn-secondary" onClick={onReturn}>
            Volver al entrenamiento
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const { updateSet } = useWorkoutStore.getState();
              for (const { row, sets } of pending)
                for (const { set } of sets) {
                  const reason = reasons[`${row.id}/${set.id}`];
                  if (reason !== undefined)
                    updateSet(row.id, set.id, { skipReason: reason.trim() });
                }
              onSave();
            }}
          >
            Guardar sin completar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
