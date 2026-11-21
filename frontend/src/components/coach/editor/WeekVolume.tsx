import { useState } from 'react';
import type { Program } from '@/lib/coach/coachPrograms';
import { weekVolume } from '@/lib/coach/weekBoard';
import { usePrescribing } from './prescribing';

const KEY = 'coach-week-volume-open';
const kg = (value: number) => `${value.toLocaleString('es-ES')} kg`;

/** Work sets per muscle group for the week on screen, against the week before. */
export function WeekVolume({ program, last }: { program: Program; last: Program | null }) {
  const { muscleOf } = usePrescribing();
  const [open, setOpen] = useState(() => localStorage.getItem(KEY) === '1');
  const volume = weekVolume(program, last, muscleOf);
  if (!volume.groups.length) return null;
  const jumps = volume.groups.filter((group) => group.jump);
  return (
    <details
      className="week-volume"
      open={open}
      onToggle={(e) => {
        const next = e.currentTarget.open;
        setOpen(next);
        localStorage.setItem(KEY, next ? '1' : '0');
      }}
    >
      <summary>
        <strong>Carga de la semana</strong>
        <span>
          {volume.sets} series de trabajo
          {volume.tonnage > 0 && ` · ${kg(volume.tonnage)} estimados`}
          {volume.tonnage > 0 &&
            !!volume.tonnageBefore &&
            ` (semana pasada ${kg(volume.tonnageBefore)})`}
        </span>
        {jumps.length > 0 && (
          <span className="week-volume-jump">
            Sube más de un 30 %:{' '}
            {jumps.map((group) => `${group.label} (${group.before} → ${group.sets})`).join(', ')}
          </span>
        )}
      </summary>
      <ul aria-label="Series por grupo muscular">
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
    </details>
  );
}
