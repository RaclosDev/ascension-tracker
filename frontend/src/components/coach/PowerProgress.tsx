import { useMemo, useState } from 'react';
import { useClientData } from '../../lib/coach/api';
import { powerProgress } from '../../lib/coach/powerProgress';
import type { PowerProfile } from '../../lib/coach/powerlifting';
import { LIFT_LABELS, type Lift } from '../../lib/powerlifting';
import type { CompletedWorkout } from '../../lib/workout/types';
import { QueryErrorNotice } from '../QueryErrorNotice';
import { Select } from '@/components/ui/select';
import { InfoTip } from '@/components/ui/InfoTip';

const DAY = 24 * 60 * 60 * 1000;
const number = (value: number) => value.toLocaleString('es-ES', { maximumFractionDigits: 1 });
const date = (value: number) => new Date(value).toLocaleDateString('es-ES');
const weekKey = (time: number) => {
  const monday = new Date(time);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday.toLocaleDateString('sv-SE');
};
/** Todas las semanas del periodo, también las que no tienen series, para que el eje sea el tiempo real. */
const allWeeks = (since: number, until: number) => {
  const keys: string[] = [];
  const cursor = new Date(`${weekKey(since)}T12:00:00`);
  const last = weekKey(until);
  while (cursor.toLocaleDateString('sv-SE') <= last) {
    keys.push(cursor.toLocaleDateString('sv-SE'));
    cursor.setDate(cursor.getDate() + 7);
  }
  return keys;
};
const weekDate = (week: string) =>
  new Date(`${week}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

/** Un levantamiento cada vez: sus cifras del periodo y la carga semanal en columnas. */
export function PowerProgress({ linkId, profile }: { linkId: string; profile: PowerProfile }) {
  const [now] = useState(Date.now);
  const [weeks, setWeeks] = useState(12);
  const [lift, setLift] = useState<Lift>('squat');
  const [includeVariations, setIncludeVariations] = useState(false);
  const query = useClientData<CompletedWorkout[]>(
    linkId,
    `workouts/recent?since=${now - 364 * DAY}`,
    true,
  );
  const since = now - weeks * 7 * DAY;
  const progress = useMemo(
    () =>
      powerProgress(
        query.data ?? [],
        since,
        now,
        profile.exerciseMappings ?? [],
        includeVariations,
      ),
    [query.data, since, now, profile.exerciseMappings, includeVariations],
  );
  const p = progress.find((row) => row.lift === lift)!;
  const tm = profile.trainingMax[lift];
  const chart = allWeeks(since, now).map(
    (week) =>
      p.weeks.find((w) => w.week === week) ?? {
        week,
        sets: 0,
        reps: 0,
        volume: 0,
        maxLoad: 0,
        rpe: null,
        rpeCount: 0,
      },
  );
  const highestVolume = Math.max(1, ...chart.map((w) => w.volume));
  // Cada cuántas columnas se rotula la fecha para que no se pisen.
  const labelEvery = Math.max(1, Math.ceil(chart.length / 13));
  return (
    <div className="pw-progress">
      <div className="pw-toolbar">
        <div className="pw-toolbar-text">
          <h3 className="pw-title-tip">
            Seguimiento de los tres básicos
            <InfoTip label="Cómo se calcula" align="start">
              Series completadas de los básicos del catálogo, sin calentamientos. 1RM estimado con
              Epley (2 a 10 reps), redondeado a 0,5 kg; el % usa el TM actual.
            </InfoTip>
          </h3>
          <p className="pw-hint">
            Del {date(since)} al {date(now)}
          </p>
        </div>
        <label className="pw-check">
          <input
            type="checkbox"
            checked={includeVariations}
            onChange={(event) => setIncludeVariations(event.target.checked)}
          />
          Incluir variantes
        </label>
        <label className="pw-field">
          Periodo
          <Select
            className="form-input min-h-11"
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
          >
            <option value={4}>Últimas 4 semanas</option>
            <option value={12}>Últimas 12 semanas</option>
            <option value={52}>Últimas 52 semanas</option>
          </Select>
        </label>
      </div>
      {query.isPending ? (
        <p role="status">Cargando sesiones de powerlifting…</p>
      ) : query.isError ? (
        <QueryErrorNotice pending={query.isFetching} retry={() => void query.refetch()} />
      ) : (
        <>
          <div className="pw-lift-picker" role="group" aria-label="Levantamiento">
            {progress.map((row) => (
              <button
                key={row.lift}
                type="button"
                className="card pw-lift-pick"
                aria-pressed={row.lift === lift}
                onClick={() => setLift(row.lift)}
              >
                <span className="pw-lift-pick-name">{LIFT_LABELS[row.lift]}</span>
                <strong>{row.estimate ? `${number(row.estimate.kg)} kg` : '—'}</strong>
                <small>
                  {row.sets
                    ? `1RM estimado · ${row.sets} ${row.sets === 1 ? 'serie' : 'series'}`
                    : 'Sin series en el periodo'}
                </small>
              </button>
            ))}
          </div>
          <section className="card pw-card" aria-label={LIFT_LABELS[lift]}>
            {p.sets === 0 ? (
              <p className="pw-empty">
                No hay series válidas de {LIFT_LABELS[lift].toLocaleLowerCase('es')} en este
                periodo.
              </p>
            ) : (
              <>
                <dl className="pw-lift-stats">
                  <div>
                    <dt>Mejor e1RM</dt>
                    <dd>
                      {p.estimate ? `${number(p.estimate.kg)} kg` : '—'}
                      <small>
                        {p.estimate ? date(p.estimate.date) : 'Sin series de 1 a 10 reps'}
                      </small>
                    </dd>
                  </div>
                  <div>
                    <dt>Mejor single</dt>
                    <dd>
                      {p.single ? `${number(p.single.weight)} kg` : '—'}
                      <small>{p.single ? date(p.single.date) : 'Sin series de 1 rep'}</small>
                    </dd>
                  </div>
                  <div>
                    <dt>Carga máxima</dt>
                    <dd>
                      {number(p.maxLoad)} kg
                      <small>
                        {tm && tm > 0
                          ? `${number((p.maxLoad / tm) * 100)} % del TM (${number(tm)} kg)`
                          : 'TM sin definir'}
                      </small>
                    </dd>
                  </div>
                  <div>
                    <dt>Series · reps</dt>
                    <dd>
                      {p.sets} · {p.reps}
                      <small>{number(p.volume)} kg de volumen</small>
                    </dd>
                  </div>
                  <div>
                    <dt>RPE medio</dt>
                    <dd>
                      {p.rpe === null ? '—' : number(p.rpe)}
                      <small>
                        {p.rpe === null
                          ? 'Sin RPE registrado'
                          : `${p.rpeCount} de ${p.sets} series`}
                      </small>
                    </dd>
                  </div>
                </dl>
                <div className="pw-chart-head">
                  <h4>Volumen semanal</h4>
                  <span className="pw-hint">toneladas por semana (kg × reps)</span>
                </div>
                {/* Con foco de teclado para poder desplazarlo cuando no cabe. */}
                <div className="pw-chart-scroll" tabIndex={0}>
                  <ol className="pw-chart" aria-label="Volumen semanal">
                    {chart.map((w, index) => {
                      const detail =
                        w.sets === 0
                          ? `Semana del ${weekDate(w.week)}: sin series`
                          : `Semana del ${weekDate(w.week)}: ${number(w.volume)} kg de volumen, ${w.sets} ${w.sets === 1 ? 'serie' : 'series'}, carga máxima ${number(w.maxLoad)} kg${w.rpe === null ? '' : `, RPE ${number(w.rpe)}`}`;
                      return (
                        <li key={w.week} title={detail}>
                          <span className="sr-only">{detail}</span>
                          <span className="pw-chart-value" aria-hidden="true">
                            {chart.length <= 16 && w.volume > 0
                              ? `${number(Math.round(w.volume / 100) / 10)} t`
                              : ''}
                          </span>
                          <span className="pw-chart-bar" aria-hidden="true">
                            <span style={{ height: `${(w.volume / highestVolume) * 100}%` }} />
                          </span>
                          <span className="pw-chart-label" aria-hidden="true">
                            {index % labelEvery === 0 ? weekDate(w.week) : ''}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
