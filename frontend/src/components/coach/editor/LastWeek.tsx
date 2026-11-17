import { Copy, GripVertical } from 'lucide-react';
import { WEEKDAY_LABELS, type Program, type ProgramDay } from '@/lib/coach/coachPrograms';
import { PrescriptionSummary } from '../PrescriptionSummary';

/** The sessions the coach prescribed the week before, ready to copy or drag into the new week. */
export function LastWeek({
  week,
  dragType,
  disabled,
  onCopy,
}: {
  week: Program;
  dragType: string;
  disabled: boolean;
  onCopy: (day: ProgramDay) => void;
}) {
  return (
    <ul className="week-last">
      {week.days.map((day) => {
        const weekday = WEEKDAY_LABELS[day.dayIndex - 1];
        return (
          <li
            key={day.dayIndex}
            draggable={!disabled}
            onDragStart={(e) => {
              e.dataTransfer.setData(
                dragType,
                JSON.stringify({ kind: 'day', dayIndex: day.dayIndex }),
              );
              e.dataTransfer.effectAllowed = 'copy';
            }}
          >
            <div className="week-last-head">
              <GripVertical size={16} aria-hidden />
              <div className="min-w-0">
                <strong>
                  {weekday} · {day.name || 'Sesión sin nombre'}
                </strong>
                <small>
                  {day.exercises.length} {day.exercises.length === 1 ? 'ejercicio' : 'ejercicios'} ·{' '}
                  {day.exercises.reduce((sum, exercise) => sum + exercise.sets, 0)} series
                </small>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={disabled}
                aria-label={`Copiar ${day.name || 'la sesión'} al ${weekday.toLocaleLowerCase('es')}`}
                onClick={() => onCopy(day)}
              >
                <Copy size={15} aria-hidden /> Copiar
              </button>
            </div>
            <ol>
              {day.exercises.map((exercise, i) => (
                <li key={i}>
                  <span>{exercise.exerciseName ?? exercise.exerciseId}</span>
                  <div className="week-last-dose">
                    <PrescriptionSummary exercise={exercise} />
                  </div>
                </li>
              ))}
            </ol>
          </li>
        );
      })}
    </ul>
  );
}
