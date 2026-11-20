import { useMemo, useState } from 'react';
import { useClientData } from '../../lib/coach/api';
import { powerProgress } from '../../lib/coach/powerProgress';
import type { PowerProfile } from '../../lib/coach/powerlifting';
import { LIFT_LABELS, type Lift } from '../../lib/powerlifting';
import type { CompletedWorkout } from '../../lib/workout/types';
import { QueryErrorNotice } from '../QueryErrorNotice';
import { Select } from '@/components/ui/select';

const DAY = 24 * 60 * 60 * 1000;
const number = (value: number) => value.toLocaleString('es-ES', { maximumFractionDigits: 1 });
const date = (value: number) => new Date(value).toLocaleDateString('es-ES');

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
  const selected = progress.find((p) => p.lift === lift)!;
  const highestVolume = Math.max(1, ...selected.weeks.map((w) => w.volume));
  return (
    <div className="pw-progress">
      <div className="pw-toolbar">
        <div className="pw-toolbar-text">
          <h3>Seguimiento de los tres básicos</h3>
          <p className="pw-hint">
            Del {date(since)} al {date(now)} · cargas en kg
          </p>
        </div>
        <label className="pw-check">
          <input
            type="checkbox"
            checked={includeVariations}
            onChange={(event) => setIncludeVariations(event.target.checked)}
          />
          Incluir variantes clasificadas por el entrenador
        </label>
        <label className="pw-field">
          Periodo de seguimiento
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
      <p className="pw-hint">
        Series completadas de sentadilla con barra, banca plana con barra y peso muerto convencional
        o sumo del catálogo. No incluye calentamientos ni ejercicios personalizados sin identificar.
      </p>
      {query.isPending ? (
        <p role="status">Cargando sesiones de powerlifting…</p>
      ) : query.isError ? (
        <QueryErrorNotice pending={query.isFetching} retry={() => void query.refetch()} />
      ) : (
        <>
          <div className="pw-lifts">
            {progress.map((p) => {
              const tm = profile.trainingMax[p.lift];
              return (
                <section key={p.lift} aria-label={LIFT_LABELS[p.lift]} className="card pw-card">
                  <h4 className="pw-lift-name">{LIFT_LABELS[p.lift]}</h4>
                  {p.sets === 0 ? (
                    <p className="pw-empty">Sin series válidas en este periodo.</p>
                  ) : (
                    <>
                      <div className="pw-lift-hero">
                        <span>Mejor 1RM estimado</span>
                        <strong>{p.estimate ? `${number(p.estimate.kg)} kg` : '—'}</strong>
                        <small>
                          {p.estimate ? date(p.estimate.date) : 'Sin series de 1 a 10 repeticiones'}
                        </small>
                      </div>
                      <dl className="pw-lift-stats">
                        <div>
                          <dt>Series</dt>
                          <dd>
                            {p.sets}
                            <small>
                              {' '}
                              · {p.reps} {p.reps === 1 ? 'repetición' : 'repeticiones'}
                            </small>
                          </dd>
                        </div>
                        <div>
                          <dt>Volumen (carga × repeticiones)</dt>
                          <dd>{number(p.volume)} kg</dd>
                        </div>
                        <div>
                          <dt>Mejor repetición única registrada</dt>
                          <dd>
                            {p.single ? (
                              <>
                                {number(p.single.weight)} kg<small> · {date(p.single.date)}</small>
                              </>
                            ) : (
                              <small>Sin series de una repetición</small>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt>Carga máxima de una serie</dt>
                          <dd>
                            {number(p.maxLoad)} kg
                            <small>
                              {tm && tm > 0
                                ? ` · ${number((p.maxLoad / tm) * 100)} % del máximo de trabajo actual (${number(tm)} kg)`
                                : ' · Máximo de trabajo sin definir'}
                            </small>
                          </dd>
                        </div>
                        <div>
                          <dt>RPE medio registrado</dt>
                          <dd>
                            {p.rpe === null ? (
                              <small>Sin RPE registrado</small>
                            ) : (
                              <>
                                {number(p.rpe)}
                                <small>
                                  {' '}
                                  / 10 · {p.rpeCount} de {p.sets}{' '}
                                  {p.sets === 1 ? 'serie' : 'series'}
                                </small>
                              </>
                            )}
                          </dd>
                        </div>
                      </dl>
                    </>
                  )}
                </section>
              );
            })}
          </div>
          <p className="pw-hint">
            1RM estimado con Epley para series de 2 a 10 repeticiones; en series de una repetición
            se usa la carga realizada. Redondeo a 0,5 kg. Las mejores series pueden ser de días
            distintos y no forman un total de competición. El porcentaje usa el máximo de trabajo
            actual, no el histórico.
          </p>
          <section className="card pw-card" aria-label="Carga semanal">
            <div className="pw-toolbar">
              <div className="pw-toolbar-text">
                <h3>Carga semanal</h3>
                <p className="pw-hint">
                  Semanas con registros, de lunes a domingo según la fecha local. Los extremos
                  incluyen solo los días del periodo seleccionado.
                </p>
              </div>
              <label className="pw-field">
                Levantamiento
                <Select
                  className="form-input min-h-11"
                  value={lift}
                  onChange={(e) => setLift(e.target.value as Lift)}
                >
                  {Object.entries(LIFT_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            {selected.weeks.length === 0 ? (
              <p className="pw-empty">No hay carga registrada para este levantamiento.</p>
            ) : (
              <ol className="pw-weeks">
                {selected.weeks.map((w) => (
                  <li key={w.week}>
                    <strong>Semana del {date(new Date(`${w.week}T12:00:00`).getTime())}</strong>
                    <span className="pw-weeks-bar" aria-hidden="true">
                      <span style={{ width: `${(w.volume / highestVolume) * 100}%` }} />
                    </span>
                    <span className="pw-weeks-volume">{number(w.volume)} kg de volumen</span>
                    <small>
                      {w.sets} {w.sets === 1 ? 'serie' : 'series'} · {w.reps}{' '}
                      {w.reps === 1 ? 'repetición' : 'repeticiones'} · Carga máxima{' '}
                      {number(w.maxLoad)} kg ·{' '}
                      {w.rpe === null
                        ? 'RPE sin datos'
                        : `RPE ${number(w.rpe)} (${w.rpeCount} ${w.rpeCount === 1 ? 'serie' : 'series'})`}
                    </small>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </div>
  );
}
