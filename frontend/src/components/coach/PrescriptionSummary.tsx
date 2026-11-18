import type { ProgramExercise } from '@/lib/coach/coachPrograms';
import { restLabel } from '@/lib/coach/today';
import { protocolText } from '@/lib/coach/prescription';

/** The dose as the athlete reads it, plus the notes the coach left on individual sets. */
export function PrescriptionSummary({ exercise }: { exercise: ProgramExercise }) {
  const notes = (exercise.prescription?.sets ?? [])
    .map((set, i) => ({ set: i + 1, text: set.notes }))
    .filter((note) => note.text);
  return (
    <span>
      {[
        protocolText(exercise),
        exercise.restSeconds != null && `descanso ${restLabel(exercise.restSeconds)}`,
      ]
        .filter(Boolean)
        .join(' · ')}
      {notes.map((note) => (
        <span key={note.set} className="block text-sm">
          Serie {note.set}: {note.text}
        </span>
      ))}
    </span>
  );
}
