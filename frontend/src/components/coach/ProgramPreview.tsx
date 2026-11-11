import type { Program } from '../../lib/coach/coachPrograms';
import { WEEKDAY_LABELS } from '../../lib/coach/weekdays';
import { prescriptionText } from '../../lib/coach/today';

export function ProgramPreview({ program }: { program: Program }) {
  return (
    <section className="card min-w-0" aria-label="Vista previa del programa">
      <h2 className="font-bold text-lg break-words">{program.name || 'Programa sin nombre'}</h2>
      <p>
        {program.weeks} {program.weeks === 1 ? 'semana' : 'semanas'} · {program.days.length}{' '}
        {program.days.length === 1 ? 'sesión' : 'sesiones'}
      </p>
      {program.notes && <p className="whitespace-pre-wrap break-words mt-2">{program.notes}</p>}
      {!program.days.length && <p className="mt-3">Todavía no hay sesiones.</p>}
      <ol className="flex flex-col gap-3 mt-3">
        {program.days.map((day) => (
          <li key={`${day.week}-${day.dayIndex}`}>
            <details className="border-t pt-2" open={program.days.length <= 3}>
              <summary className="cursor-pointer py-2 font-semibold break-words">
                Semana {day.week} · {WEEKDAY_LABELS[day.dayIndex - 1]} · {day.name}
              </summary>
              {day.notes && <p className="whitespace-pre-wrap break-words mb-2">{day.notes}</p>}
              {!day.exercises.length && <p>Día sin ejercicios.</p>}
              <ol className="flex flex-col gap-2 text-sm">
                {day.exercises.map((exercise, index) => (
                  <li key={index} className="break-words">
                    <strong>{exercise.exerciseName || exercise.exerciseId}</strong>
                    <p>
                      {exercise.sets} × {prescriptionText({ ...exercise, notes: null }) || 'series'}
                    </p>
                    {(exercise.variantGrip || exercise.variantMachine) && (
                      <p>
                        {[exercise.variantGrip, exercise.variantMachine]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                    {exercise.supersetGroup && <p>Superserie {exercise.supersetGroup}</p>}
                    {exercise.notes && <p className="whitespace-pre-wrap">{exercise.notes}</p>}
                  </li>
                ))}
              </ol>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}
