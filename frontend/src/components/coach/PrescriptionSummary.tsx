import type { ProgramExercise } from '@/lib/coach/coachPrograms';
import { prescriptionText } from '@/lib/coach/today';
import { setText } from '@/lib/coach/prescription';

export function PrescriptionSummary({ exercise }: { exercise: ProgramExercise }) {
  if (exercise.prescription?.sets?.length)
    return (
      <ol className="text-sm flex flex-col gap-1">
        {exercise.prescription.sets.map((set, i) => (
          <li key={i}>
            {i + 1}. {setText(set, exercise)}
          </li>
        ))}
      </ol>
    );
  return (
    <span>
      {exercise.sets} × {prescriptionText({ ...exercise, notes: null }) || 'series'}
    </span>
  );
}
