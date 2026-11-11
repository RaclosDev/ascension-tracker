import { useMemo, useState } from 'react';
import { useClientData } from '../../lib/coach/api';
import { powerProgress } from '../../lib/coach/powerProgress';
import type { PowerProfile } from '../../lib/coach/powerlifting';
import { LIFT_LABELS, type Lift } from '../../lib/powerlifting';
import type { CompletedWorkout } from '../../lib/workout/types';
import { QueryErrorNotice } from '../QueryErrorNotice';

const DAY = 24 * 60 * 60 * 1000;
const number = (value: number) => value.toLocaleString('es-ES', { maximumFractionDigits: 1 });
const date = (value: number) => new Date(value).toLocaleDateString('es-ES');

export function PowerProgress({ linkId, profile }: { linkId: string; profile: PowerProfile }) {
  const [now] = useState(Date.now);
  const [weeks, setWeeks] = useState(12);
  const [lift, setLift] = useState<Lift>('squat');
  const query = useClientData<CompletedWorkout[]>(
    linkId,
    `workouts/recent?since=${now - 364 * DAY}`,
    true,
  );
  const since = now - weeks * 7 * DAY;
  const progress = useMemo(
    () => powerProgress(query.data ?? [], since, now),
    [query.data, since, now],
  );
  const selected = progress.find((p) => p.lift === lift)!;
  const highestVolume = Math.max(1, ...selected.weeks.map((w) => w.volume));
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-semibold text-xl">Seguimiento de los tres básicos</h3>
          <p className="coach-description">
            Del {date(since)} al {date(now)} · cargas en kg
          </p>
        </div>
        <label className="flex flex-col gap-1">
          Periodo de seguimiento
          <select
            className="form-input min-h-11"
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
          >
            <option value={4}>Últimas 4 semanas</option>
            <option value={12}>Últimas 12 semanas</option>
            <option value={52}>Últimas 52 semanas</option>
          </select>
        </label>
      </div>
      <p className="coach-description">
        Series completadas de sentadilla con barra, banca plana con barra y peso muerto convencional
        o sumo del catálogo. No incluye calentamientos ni ejercicios personalizados sin identificar.
      </p>
      {query.isPending ? (
        <p role="status">Cargando sesiones de powerlifting…</p>
      ) : query.isError ? (
        <QueryErrorNotice pending={query.isFetching} retry={() => void query.refetch()} />
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-3">
            {progress.map((p) => {
              const tm = profile.trainingMax[p.lift];
              return (
                <section
                  key={p.lift}
                  aria-label={LIFT_LABELS[p.lift]}
                  className="rounded-xl border border-[var(--border-color)] p-4 flex flex-col gap-3 min-w-0"
                >
                  <h4 className="font-semibold">{LIFT_LABELS[p.lift]}</h4>
                  {p.sets === 0 ? (
                    <p>Sin series válidas en este periodo.</p>
                  ) : (
                    <>
                      <p>
                        <strong>{p.sets}</strong> {p.sets === 1 ? 'serie' : 'series'} · {p.reps}{' '}
                        {p.reps === 1 ? 'repetición' : 'repeticiones'}
                      </p>
                      <dl className="flex flex-col gap-3">
                        <div>
                          <dt>Volumen (carga × repeticiones)</dt>
                          <dd className="font-semibold">{number(p.volume)} kg</dd>
                        </div>
                        <div>
                          <dt>Mejor repetición única registrada</dt>
                          <dd>
                            {p.single
                              ? `${number(p.single.weight)} kg · ${date(p.single.date)}`
                              : 'Sin series de una repetición'}
                          </dd>
                        </div>
                        <div>
                          <dt>Mejor 1RM estimado</dt>
                          <dd>
                            {p.estimate
                              ? `${number(p.estimate.kg)} kg · ${date(p.estimate.date)}`
                              : 'Sin series de 1 a 10 repeticiones'}
                          </dd>
                        </div>
                        <div>
                          <dt>Carga máxima de una serie</dt>
                          <dd>
                            {number(p.maxLoad)} kg
                            {tm && tm > 0
                              ? ` · ${number((p.maxLoad / tm) * 100)} % del máximo de trabajo actual (${number(tm)} kg)`
                              : ' · Máximo de trabajo sin definir'}
                          </dd>
                        </div>
                        <div>
                          <dt>RPE medio registrado</dt>
                          <dd>
                            {p.rpe === null
                              ? 'Sin RPE registrado'
                              : `${number(p.rpe)} / 10 · ${p.rpeCount} de ${p.sets} ${p.sets === 1 ? 'serie' : 'series'}`}
                          </dd>
                        </div>
                      </dl>
                    </>
                  )}
                </section>
              );
            })}
          </div>
          <p className="coach-description">
            1RM estimado con Epley para series de 2 a 10 repeticiones; en series de una repetición
            se usa la carga realizada. Redondeo a 0,5 kg. Las mejores series pueden ser de días
            distintos y no forman un total de competición. El porcentaje usa el máximo de trabajo
            actual, no el histórico.
          </p>
          <section className="flex flex-col gap-3" aria-label="Carga semanal">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h4 className="font-semibold">Carga semanal</h4>
              <label className="flex flex-col gap-1">
                Levantamiento
                <select
                  className="form-input min-h-11"
                  value={lift}
                  onChange={(e) => setLift(e.target.value as Lift)}
                >
                  {Object.entries(LIFT_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="coach-description">
              Semanas con registros, de lunes a domingo según la fecha local. Los extremos incluyen
              solo los días del periodo seleccionado.
            </p>
            {selected.weeks.length === 0 ? (
              <p>No hay carga registrada para este levantamiento.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {selected.weeks.map((w) => (
                  <li key={w.week} className="rounded-xl border border-[var(--border-color)] p-3">
                    <div className="flex flex-wrap justify-between gap-2">
                      <strong>Semana del {date(new Date(`${w.week}T12:00:00`).getTime())}</strong>
                      <span>{number(w.volume)} kg de volumen</span>
                    </div>
                    <div
                      className="h-2 bg-[var(--bg-secondary)] rounded mt-2 mb-2 overflow-hidden"
                      aria-hidden="true"
                    >
                      <div
                        className="h-full bg-[var(--text-primary)] rounded"
                        style={{ width: `${(w.volume / highestVolume) * 100}%` }}
                      />
                    </div>
                    <p>
                      {w.sets} {w.sets === 1 ? 'serie' : 'series'} · {w.reps}{' '}
                      {w.reps === 1 ? 'repetición' : 'repeticiones'} · Carga máxima{' '}
                      {number(w.maxLoad)} kg ·{' '}
                      {w.rpe === null
                        ? 'RPE sin datos'
                        : `RPE ${number(w.rpe)} (${w.rpeCount} ${w.rpeCount === 1 ? 'serie' : 'series'})`}
                    </p>
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
