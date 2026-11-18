import { lazy, Suspense, useState } from 'react';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiErrorMessage, type CoachClient } from '../../lib/coach/api';
import { useSaveCoachNotes, type AvoidedExercise } from '../../lib/coach/setup';
import { undoToast } from './undoToast';

const ExerciseSearch = lazy(() =>
  import('./editor/ExerciseSearch').then((module) => ({ default: module.ExerciseSearch })),
);

const MAX_AVOIDED = 40;

/** Exercises the coach will not prescribe to this athlete. The week editor warns when one shows up. */
export function AvoidedExercises({ link }: { link: CoachClient }) {
  const save = useSaveCoachNotes(link.linkId);
  const items = link.notes?.avoidedExercises ?? [];
  const [adding, setAdding] = useState(false);
  const store = (next: AvoidedExercise[], done?: string, undo?: AvoidedExercise[]) =>
    save.mutate(
      { pinnedNote: link.notes?.pinnedNote ?? null, avoidedExercises: next },
      {
        onSuccess: () => {
          if (!done) return;
          if (undo) undoToast(done, () => store(undo));
          else toast.success(done);
        },
        onError: (e) => toast.error(apiErrorMessage(e, 'No se pudo guardar')),
      },
    );
  return (
    <section className="card">
      <h2>Ejercicios vetados</h2>
      <p className="coach-description">
        Ejercicios que no quieres pautar a este atleta, por una lesión o porque no le van. Te
        avisamos si aparecen en su semana. Solo lo ves tú.
      </p>
      {items.length > 0 && (
        <ul className="avoided-list">
          {items.map((item) => {
            const name = item.name ?? item.exerciseId;
            return (
              <li key={item.exerciseId}>
                <strong>{name}</strong>
                <input
                  className="form-input"
                  aria-label={`Motivo para vetar ${name}`}
                  placeholder="Motivo (opcional)"
                  maxLength={200}
                  defaultValue={item.reason ?? ''}
                  onBlur={(e) => {
                    const reason = e.target.value.trim() || null;
                    if (reason !== item.reason)
                      store(
                        items.map((other) => (other === item ? { ...item, reason } : other)),
                        'Motivo guardado',
                      );
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary avoided-remove"
                  aria-label={`Quitar ${name} de los vetados`}
                  title="Quitar de los vetados"
                  disabled={save.isPending}
                  onClick={() =>
                    store(
                      items.filter((other) => other !== item),
                      `${name} ya no está vetado`,
                      items,
                    )
                  }
                >
                  <X size={16} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {adding ? (
        <div className="avoided-add">
          <Suspense fallback={<p className="coach-description">Cargando ejercicios…</p>}>
            <ExerciseSearch
              autoFocus
              purpose="vetar"
              onPick={(exercise) => {
                setAdding(false);
                if (items.some((item) => item.exerciseId === exercise.id)) {
                  toast.error(`${exercise.name} ya está vetado`);
                  return;
                }
                store(
                  [...items, { exerciseId: exercise.id, name: exercise.name, reason: null }],
                  `${exercise.name} vetado`,
                );
              }}
            />
          </Suspense>
          <button type="button" className="btn btn-secondary" onClick={() => setAdding(false)}>
            Cancelar
          </button>
        </div>
      ) : items.length >= MAX_AVOIDED ? (
        <p className="coach-description">Has llegado al máximo de {MAX_AVOIDED} ejercicios.</p>
      ) : (
        <button type="button" className="btn btn-secondary mt-3" onClick={() => setAdding(true)}>
          <Plus size={16} aria-hidden /> Vetar un ejercicio
        </button>
      )}
    </section>
  );
}
