import type { Program } from '@/lib/coach/coachPrograms';
import { weekVolume } from '@/lib/coach/weekBoard';
import { usePrescribing } from './prescribing';

const kg = (value: number) => `${value.toLocaleString('es-ES')} kg`;

/** Work sets per muscle group for the week on screen, against the week before. */
export function WeekVolume({ program, last }: { program: Program; last: Program | null }) {
  const { muscleOf } = usePrescribing();
  const volume = weekVolume(program, last, muscleOf);
  if (!volume.groups.length) return null;
  const jumps = volume.groups.filter((group) => group.jump);
  return (
    <section className="week-volume" aria-label="Series por grupo muscular">
      <ul>
        {volume.groups.map((group) => {
          const change = group.before == null ? 0 : group.sets - group.before;
          return (
            <li key={group.id} data-jump={group.jump ? '' : undefined}>
              <span>{group.label}</span>
              <strong>{group.sets}</strong>
              {change !== 0 && (
                <small>
                  {change > 0 ? '+' : '−'}
                  {Math.abs(change)}
                  <span className="sr-only"> series respecto a la semana pasada</span>
                </small>
              )}
            </li>
          );
        })}
      </ul>
      <p>
        {volume.sets} series de trabajo
        {volume.tonnage > 0 && ` · ${kg(volume.tonnage)} estimados`}
        {volume.tonnage > 0 &&
          !!volume.tonnageBefore &&
          ` (semana pasada ${kg(volume.tonnageBefore)})`}
      </p>
      {jumps.length > 0 && (
        <p className="week-volume-jump">
          Sube más de un 30 % respecto a la semana pasada:{' '}
          {jumps.map((group) => `${group.label} (${group.before} → ${group.sets})`).join(', ')}.
        </p>
      )}
    </section>
  );
}
