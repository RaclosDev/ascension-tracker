import type { ReactNode } from 'react';

interface Props {
  start: number;
  current: number;
  goal: number;
  /** «9 ene 2027», or empty when the current pace does not reach the goal. */
  arrival: string;
  /** The control that picks the pace the arrival is projected with. */
  pace: ReactNode;
}

const kg = (n: number) => n.toFixed(1);

/** Start → now → goal on one rule, with what is left and when it would be reached. */
export function GoalTrack({ start, current, goal, arrival, pace }: Props) {
  const total = goal - start;
  const done = current - start;
  const pct = total === 0 ? 100 : Math.max(0, Math.min(100, (done / total) * 100));
  const left = Math.abs(goal - current);
  const reached = total === 0 || done / total >= 1 || left < 0.05;

  return (
    <div className="goal-track">
      <div className="goal-track-head">
        <span className="panel-title">Meta</span>
        <span className="goal-track-pct tabular-nums">{Math.round(pct)}%</span>
      </div>
      <div
        className="goal-track-rule"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label="Progreso hacia la meta"
      >
        <span className="goal-track-fill" style={{ width: `${pct}%` }} />
        <span className="goal-track-now" style={{ left: `${pct}%` }} />
      </div>
      <div className="goal-track-ends tabular-nums">
        <span>{kg(start)} kg</span>
        <span>{kg(goal)} kg</span>
      </div>
      <dl className="goal-track-facts">
        <div>
          <dt>Faltan</dt>
          <dd className="tabular-nums">{reached ? '—' : `${kg(left)} kg`}</dd>
        </div>
        <div>
          <dt>Llegada</dt>
          <dd>{reached ? 'Meta alcanzada' : arrival || 'Sin fecha al ritmo actual'}</dd>
        </div>
      </dl>
      {!reached && <div className="goal-track-pace">Proyectado a {pace}</div>}
    </div>
  );
}
