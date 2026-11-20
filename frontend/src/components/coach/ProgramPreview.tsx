import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import type { Program, ProgramExercise, SetTarget } from '../../lib/coach/coachPrograms';
import { WEEKDAY_LABELS } from '../../lib/coach/weekdays';
import { effortOf, repsText, rowsOf } from '../../lib/coach/prescription';
import { restLabel } from '../../lib/coach/today';
import { useExerciseCatalog } from '../../lib/workout/catalog-query';
import type { Exercise } from '../../lib/workout/types';
import { WorkoutExerciseDetail } from '../workout/WorkoutExerciseDetail';
import '../../styles/program-preview.css';

const KIND_TAG: Record<SetTarget['kind'], string> = {
  WORK: '',
  WARMUP: 'Cal.',
  TOP: 'Top',
  BACKOFF: 'Back',
};
const LIFTS = { squat: 'sentadilla', bench: 'banca', deadlift: 'peso muerto' } as const;

function Load({ load }: { load: SetTarget['load'] }) {
  if (!load) return <span className="program-preview-empty">–</span>;
  const each = load.unit === 'EACH' ? <small> /manc.</small> : null;
  if (load.mode === 'KG')
    return (
      <>
        {load.amount}
        {each}
      </>
    );
  return (
    <>
      {load.resolvedKg != null ? load.resolvedKg : `${load.amount} %`}
      {each}
      <small className="block">
        {load.resolvedKg != null && `${load.amount} % `}
        {LIFTS[load.lift ?? 'squat']}
      </small>
    </>
  );
}

/** One exercise as the athlete sees it in their history: a card with a row per set. */
function PreviewExercise({
  exercise,
  meta,
}: {
  exercise: ProgramExercise;
  meta: Exercise | undefined;
}) {
  const rows = rowsOf(exercise);
  const effort = effortOf(rows, 'NONE');
  const kgHeading = rows.some((row) => row.load?.mode === 'PERCENT_TM') ? 'Carga' : 'Kg';
  let work = 0;
  return (
    <WorkoutExerciseDetail
      name={exercise.exerciseName || meta?.name || 'Ejercicio'}
      imageUrl={meta?.gifUrl}
      superset={exercise.supersetGroup != null}
      variant={{
        grip: exercise.variantGrip ?? undefined,
        machine: exercise.variantMachine ?? undefined,
      }}
    >
      {exercise.restSeconds != null && (
        <p className="program-preview-rest">
          <Clock size={13} aria-hidden /> Descanso {restLabel(exercise.restSeconds)}
        </p>
      )}
      {exercise.notes && <p className="program-preview-note">{exercise.notes}</p>}
      <table className="program-preview-sets">
        <thead>
          <tr>
            <th>Serie</th>
            <th>{kgHeading}</th>
            <th>Reps</th>
            {effort !== 'NONE' && <th>{effort}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const tag = KIND_TAG[row.kind];
            if (!tag) work++;
            const value = effort === 'RPE' ? row.rpe : row.rir;
            return (
              <tr key={i} data-kind={row.kind}>
                <td>
                  <span className="program-preview-tag">{tag || work}</span>
                </td>
                <td className="program-preview-value">
                  <Load load={row.load} />
                </td>
                <td className="program-preview-value">{repsText(row).replace('-', '–') || '–'}</td>
                {effort !== 'NONE' && <td>{value ?? '–'}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.some((row) => row.notes) && (
        <ul className="program-preview-set-notes">
          {rows.map((row, i) =>
            row.notes ? (
              <li key={i}>
                <strong>Serie {i + 1}</strong> {row.notes}
              </li>
            ) : null,
          )}
        </ul>
      )}
    </WorkoutExerciseDetail>
  );
}

export function ProgramPreview({ program }: { program: Program }) {
  const catalog = useExerciseCatalog();
  const byId = useMemo(
    () => new Map((catalog.data ?? []).map((exercise) => [exercise.id, exercise])),
    [catalog.data],
  );
  const days = [...program.days].sort((a, b) => a.week - b.week || a.dayIndex - b.dayIndex);
  return (
    <section className="card min-w-0 program-preview" aria-label="Vista previa del programa">
      <header className="program-preview-head">
        <h2>{program.name || 'Programa sin nombre'}</h2>
        <p>
          {program.weeks} {program.weeks === 1 ? 'semana' : 'semanas'} · {program.days.length}{' '}
          {program.days.length === 1 ? 'sesión' : 'sesiones'}
        </p>
        {program.notes && <p className="program-preview-note">{program.notes}</p>}
      </header>
      {!days.length && <p>Todavía no hay sesiones.</p>}
      {days.map((day) => {
        const sets = day.exercises.reduce((n, e) => n + rowsOf(e).length, 0);
        return (
          <section
            key={`${day.week}-${day.dayIndex}`}
            className="program-preview-day"
            aria-label={`${WEEKDAY_LABELS[day.dayIndex - 1]} · ${day.name}`}
          >
            <header>
              <h3>
                {program.weeks > 1 && `Semana ${day.week} · `}
                {WEEKDAY_LABELS[day.dayIndex - 1]} · {day.name}
              </h3>
              <p>
                {day.exercises.length} {day.exercises.length === 1 ? 'ejercicio' : 'ejercicios'} ·{' '}
                {sets} {sets === 1 ? 'serie' : 'series'}
              </p>
            </header>
            {day.notes && <p className="program-preview-note">{day.notes}</p>}
            {!day.exercises.length && <p>Día sin ejercicios.</p>}
            <div className="program-preview-grid">
              {day.exercises.map((exercise, index) => (
                <PreviewExercise
                  key={index}
                  exercise={exercise}
                  meta={byId.get(exercise.exerciseId)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}
