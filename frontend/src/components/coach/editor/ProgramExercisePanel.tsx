import '../../../styles/coach-calendar.css';
import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Check, Dumbbell, Plus } from 'lucide-react';
import api from '@/api/client';
import {
  useCoachPrograms,
  type Program,
  type ProgramDay,
  type ProgramExercise,
} from '@/lib/coach/coachPrograms';
import { useCustomExercises } from '@/lib/workout/api';
import { getExerciseMap, useExerciseCatalog } from '@/lib/workout/exercises';
import type { Exercise } from '@/lib/workout/types';
import { Select } from '@/components/ui/select';
import { ExerciseSearch } from './ExerciseSearch';

/** Library programs read to rank exercises; the most recently edited are the coach's current habits. */
const SOURCES = 30;
const SHOWN = 10;

export const PROGRAM_DRAG_TYPE = 'application/x-ascension-program-exercise';

interface Use {
  id: string;
  name: string;
  /** Times prescribed across the programs read. */
  times: number;
  /** The most recent prescription, to show what it usually looks like. */
  sample: ProgramExercise;
}

const prescription = (e: ProgramExercise) => {
  const reps =
    e.repsMin == null
      ? ''
      : e.repsMax && e.repsMax !== e.repsMin
        ? `${e.repsMin}-${e.repsMax}`
        : `${e.repsMin}`;
  return reps ? `${e.sets}×${reps}` : `${e.sets} series`;
};

/** Counts every exercise prescribed in these programs, most used first. */
function ranking(programs: Program[]): Use[] {
  const uses = new Map<string, Use>();
  for (const program of programs)
    for (const day of program.days)
      for (const exercise of day.exercises) {
        const use = uses.get(exercise.exerciseId);
        if (use) use.times += 1;
        else
          uses.set(exercise.exerciseId, {
            id: exercise.exerciseId,
            name: exercise.exerciseName ?? exercise.exerciseId,
            times: 1,
            sample: exercise,
          });
      }
  return [...uses.values()].sort((a, b) => b.times - a.times || a.name.localeCompare(b.name, 'es'));
}

/** The exercises this coach prescribes most in the library, ranked from their programs. */
function useCoachExerciseRanking(current: Program) {
  const { data: summaries } = useCoachPrograms();
  const ids = useMemo(
    () =>
      (Array.isArray(summaries) ? [...summaries] : [])
        .filter((p) => p.id !== current.id)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, SOURCES)
        .map((p) => p.id),
    [summaries, current.id],
  );
  const programs = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['coach', 'programs', id],
      staleTime: 5 * 60_000,
      queryFn: async () =>
        (await api.get<Program>(`/coach/programs/${encodeURIComponent(id)}`)).data,
    })),
    combine: (results) => results.flatMap((r) => (r.data ? [r.data] : [])),
  });
  return useMemo(() => ranking([current, ...programs]), [current, programs]);
}

export interface PanelTarget {
  days: ProgramDay[];
  labels: string[];
  /** Day of the week the panel adds to. */
  dayIndex: number | null;
  onTarget: (dayIndex: number) => void;
}

/** Side panel of the program editor: search, and the exercises the coach uses most, to click or drag onto a day. */
export function ProgramExercisePanel({
  program,
  target,
  disabled,
  onAdd,
}: {
  program: Program;
  target: PanelTarget;
  disabled: boolean;
  onAdd: (exercise: Pick<Exercise, 'id' | 'name'>) => void;
}) {
  const ranked = useCoachExerciseRanking(program);
  const { data: catalog } = useExerciseCatalog();
  const { data: mine } = useCustomExercises();
  const names = useMemo(() => getExerciseMap(mine ?? [], catalog), [mine, catalog]);
  const day = target.days.find((d) => d.dayIndex === target.dayIndex);
  const current = day?.exercises.map((e) => e.exerciseId) ?? [];
  const blocked = disabled || !day;
  const shown = ranked.slice(0, SHOWN);

  return (
    <aside className="ex-panel program-ex-panel" aria-label="Ejercicios para el programa">
      <h3 className="sr-only">Añadir ejercicios</h3>
      <label className="program-ex-target">
        <span>Añadir a</span>
        <Select
          aria-label="Día al que se añaden los ejercicios"
          value={target.dayIndex ?? ''}
          disabled={disabled || target.days.length === 0}
          onChange={(e) => target.onTarget(Number(e.target.value))}
        >
          {target.days.length === 0 && <option value="">Sin días esta semana</option>}
          {target.days.map((d) => (
            <option key={d.dayIndex} value={d.dayIndex}>
              {target.labels[d.dayIndex - 1]} · {d.name || 'Sesión sin nombre'}
            </option>
          ))}
        </Select>
      </label>
      {target.days.length === 0 && (
        <p className="ex-none">
          Añade un día a la semana o arrastra un ejercicio a un día de descanso.
        </p>
      )}
      <fieldset disabled={disabled} className="ex-search">
        <ExerciseSearch
          limit={5}
          dragType={PROGRAM_DRAG_TYPE}
          onPick={(exercise) => !blocked && onAdd(exercise)}
        />
      </fieldset>
      {shown.length > 0 ? (
        <section className="ex-group" aria-label="Los que más usas en tus programas">
          <h4>Los que más usas en tus programas</h4>
          <ul>
            {shown.map((use) => {
              const info = names.get(use.id);
              const name = info?.name ?? use.name;
              const added = current.includes(use.id);
              return (
                <li key={use.id}>
                  <button
                    type="button"
                    className="ex-item"
                    disabled={disabled}
                    draggable={!disabled}
                    data-added={added ? '' : undefined}
                    aria-label={`Añadir ${name}`}
                    title="Clic para añadirlo al día elegido, o arrástralo a cualquier día"
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        PROGRAM_DRAG_TYPE,
                        JSON.stringify({ kind: 'exercise', id: use.id, name }),
                      );
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() => !blocked && onAdd({ id: use.id, name })}
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
                        {prescription(use.sample)} · {use.times} {use.times === 1 ? 'vez' : 'veces'}
                      </small>
                    </span>
                    {added ? <Check size={15} aria-hidden /> : <Plus size={15} aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <p className="ex-none">
          Cuando tengas ejercicios en tus programas verás aquí los que más usas, para añadirlos con
          un clic.
        </p>
      )}
    </aside>
  );
}
