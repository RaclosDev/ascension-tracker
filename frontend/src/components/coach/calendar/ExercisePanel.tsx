import { useContext, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, Dumbbell, Plus } from 'lucide-react';
import { useClientCustomExercises } from '@/lib/coach/api';
import { bestSet, companions, setText, type ExerciseUse } from '@/lib/coach/exerciseHistory';
import { useCustomExercises } from '@/lib/workout/api';
import { getExerciseMap, useExerciseCatalog } from '@/lib/workout/exercises';
import type { CompletedWorkout, Exercise } from '@/lib/workout/types';
import { ExerciseSearch } from '../editor/ExerciseSearch';
import { AthleteHistory } from '../editor/prescribing';

const SHOWN = 8;

/** Where the exercises of a session come from: the search, and what this athlete already trains. */
export function ExercisePanel({
  linkId,
  athlete,
  workouts,
  current,
  disabled,
  dragType,
  onAdd,
}: {
  linkId: string;
  /** First name, for the headings. */
  athlete: string;
  /** The athlete's recent sessions, newest first. */
  workouts: CompletedWorkout[];
  /** Exercises already in the session. */
  current: string[];
  disabled: boolean;
  dragType: string;
  onAdd: (exercise: Pick<Exercise, 'id' | 'name'>) => void;
}) {
  const history = useContext(AthleteHistory);
  const { data: catalog } = useExerciseCatalog();
  const { data: mine } = useCustomExercises();
  const { data: theirs } = useClientCustomExercises(linkId);
  const names = useMemo(
    () => getExerciseMap([...(theirs ?? []), ...(mine ?? [])], catalog),
    [theirs, mine, catalog],
  );
  const known = history.filter((use) => names.has(use.exerciseId));
  // What the athlete trains next to the exercises already written, before the plain ranking.
  const paired = companions(workouts, current)
    .flatMap((id) => known.find((use) => use.exerciseId === id) ?? [])
    .slice(0, 5);
  const rest = known.filter((use) => !paired.includes(use)).slice(0, SHOWN);
  const list = (title: string, uses: ExerciseUse[]) =>
    uses.length > 0 && (
      <section className="ex-group" aria-label={title}>
        <h4>{title}</h4>
        <ul>
          {uses.map((use) => {
            const info = names.get(use.exerciseId);
            const name = info?.name ?? use.exerciseId;
            const added = current.includes(use.exerciseId);
            const best = bestSet(use.last.sets);
            return (
              <li key={use.exerciseId}>
                <button
                  type="button"
                  className="ex-item"
                  disabled={disabled}
                  draggable={!disabled}
                  data-added={added ? '' : undefined}
                  aria-label={`Añadir ${name}`}
                  title="Clic para añadirlo, o arrástralo a la sesión o a otro día"
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      dragType,
                      JSON.stringify({ kind: 'exercise', id: use.exerciseId, name }),
                    );
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => onAdd({ id: use.exerciseId, name })}
                >
                  <span className="exs-thumb" aria-hidden="true">
                    {info?.gifUrl ? (
                      <img src={info.gifUrl} alt="" loading="lazy" />
                    ) : (
                      <Dumbbell size={15} />
                    )}
                  </span>
                  <span className="ex-item-text">
                    <strong>{name}</strong>
                    <small>
                      {best && `${setText(best)} · `}
                      {format(use.last.date, 'd MMM', { locale: es })} · {use.times}{' '}
                      {use.times === 1 ? 'vez' : 'veces'}
                    </small>
                  </span>
                  {added ? <Check size={15} aria-hidden /> : <Plus size={15} aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  return (
    <aside className="ex-panel" aria-label="Ejercicios para la sesión">
      <h3 className="sr-only">Añadir ejercicios</h3>
      <fieldset disabled={disabled} className="ex-search">
        <ExerciseSearch limit={5} dragType={dragType} onPick={onAdd} />
      </fieldset>
      {list('Suele hacerlos en la misma sesión', paired)}
      {list(`Los que más entrena ${athlete}`, rest)}
      {known.length === 0 && (
        <p className="ex-none">
          Cuando {athlete} registre entrenos verás aquí sus ejercicios más usados, con lo que hizo
          la última vez.
        </p>
      )}
    </aside>
  );
}
