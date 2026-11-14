import type { ReactNode } from 'react';
import { Dumbbell } from 'lucide-react';
import type { WorkoutExercise } from '@/lib/workout/types';
import '../../styles/workout-exercise-detail.css';

type Variant = WorkoutExercise['variant'];

export function WorkoutExerciseVariant({ variant }: { variant?: Variant }) {
  const grip = variant?.grip?.trim();
  const machine = variant?.machine?.trim();
  if (!grip && !machine) return null;

  return (
    <dl className="workout-exercise-detail-variant">
      {grip && (
        <div>
          <dt>Agarre</dt>
          <dd>{grip}</dd>
        </div>
      )}
      {machine && (
        <div>
          <dt>Máquina</dt>
          <dd>{machine}</dd>
        </div>
      )}
    </dl>
  );
}

export function WorkoutExerciseDetail({
  name,
  imageUrl,
  variant,
  superset,
  heading: Heading = 'h3',
  className,
  children,
}: {
  name: string;
  imageUrl?: string;
  variant?: Variant;
  superset?: boolean;
  heading?: 'h2' | 'h3';
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={className ? `workout-exercise-detail ${className}` : 'workout-exercise-detail'}
    >
      <header className="workout-exercise-detail-heading">
        <span className="workout-exercise-detail-media" aria-hidden="true">
          {imageUrl ? <img src={imageUrl} alt="" /> : <Dumbbell size={18} />}
        </span>
        <div>
          {superset && <span className="workout-exercise-detail-superset">Superserie</span>}
          <Heading>{name}</Heading>
          <WorkoutExerciseVariant variant={variant} />
        </div>
      </header>
      {children}
    </article>
  );
}
