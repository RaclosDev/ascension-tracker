import { useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useClientData } from '../../lib/coach/api';
import { useNutritionAdherence, type AdherenceDay } from '../../lib/coach/nutritionAdherence';
import { shiftWeek, weekDate } from '../../lib/coach/weeks';
import type { FoodLog, WeekSummary } from '../../types/api';
import { QueryErrorNotice } from '../QueryErrorNotice';

/** How far back the adherence of the plan is kept in view. */
const WEEKS = 12;
const STATES = {
  on: 'En objetivo',
  off: 'Fuera de objetivo',
  logged: 'Registrado',
  today: 'Día en curso',
  empty: 'Sin registro',
  future: 'Pendiente',
} as const;
type DayState = keyof typeof STATES;
const MACROS = [
  { key: 'kcal', label: 'Calorías', unit: 'kcal' },
  { key: 'protein', label: 'Proteína', unit: 'g' },
  { key: 'carbs', label: 'Carbohidratos', unit: 'g' },
  { key: 'fat', label: 'Grasa', unit: 'g' },
] as const;
const round = (value: number) => Math.round(value).toLocaleString('es-ES');
const capital = (text: string) => text.charAt(0).toLocaleUpperCase('es') + text.slice(1);

function sum(logs: FoodLog[]) {
  return logs.reduce(
    (total, log) => ({
      kcal: total.kcal + (Number(log.kcal) || 0),
      protein: total.protein + (Number(log.protein) || 0),
      carbs: total.carbs + (Number(log.carbs) || 0),
      fat: total.fat + (Number(log.fat) || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

/** The athlete's food diary, a week at a time: each day against its target, one open by meals. */
export function NutritionDiary({ linkId }: { linkId: string }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const current = weekDate();
  const [week, setWeek] = useState(current);
  const [picked, setPicked] = useState(today);
  const adherence = useNutritionAdherence(linkId, WEEKS);
  const weekly = useClientData<WeekSummary[]>(linkId, 'nutrition/calories/weekly', true);
  const planned = adherence.data?.find((item) => item.weekStart === week);
  const logged = weekly.data?.find((item) => item.weekStart === week);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = format(addDays(parseISO(week), index), 'yyyy-MM-dd');
    const day = planned?.days.find((item) => item.date === date);
    const future = date > today;
    const kcal = future ? null : (day?.intake?.kcal ?? logged?.days[index] ?? null);
    const state: DayState = future
      ? 'future'
      : kcal === null
        ? 'empty'
        : !day?.target
          ? 'logged'
          : day.onTarget
            ? 'on'
            : date === today
              ? 'today'
              : 'off';
    return { date, day, kcal, state };
  });
  const selected = days.find((item) => item.date === picked) ?? days[0];
  const move = (step: number) => {
    const next = shiftWeek(week, step);
    setWeek(next);
    // Keep the same weekday open, without ever landing on a day still to come.
    const same = format(addDays(parseISO(picked), 7 * step), 'yyyy-MM-dd');
    setPicked(same > today ? today : same);
  };

  return (
    <div className="diary">
      <div className="diary-bar">
        <div className="diary-nav">
          <button
            type="button"
            className="btn btn-secondary"
            aria-label="Semana anterior"
            disabled={week <= shiftWeek(current, 1 - WEEKS)}
            onClick={() => move(-1)}
          >
            <ArrowLeft size={16} aria-hidden />
          </button>
          <p className="diary-week" aria-live="polite">
            {format(parseISO(week), 'd MMM', { locale: es })} –{' '}
            {format(addDays(parseISO(week), 6), 'd MMM', { locale: es })}
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            aria-label="Semana siguiente"
            disabled={week >= current}
            onClick={() => move(1)}
          >
            <ArrowRight size={16} aria-hidden />
          </button>
          {week !== current && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setWeek(current);
                setPicked(today);
              }}
            >
              Hoy
            </button>
          )}
        </div>
        <p className="diary-summary">
          {planned && planned.plannedDays > 0
            ? [
                `${planned.onTargetDays} de ${planned.loggedDays} días registrados en objetivo`,
                planned.kcalPct !== null && `kcal ${planned.kcalPct} %`,
                planned.proteinPct !== null && `proteína ${planned.proteinPct} %`,
              ]
                .filter(Boolean)
                .join(' · ')
            : logged?.average
              ? `Media de ${round(logged.average)} kcal al día · sin pauta esta semana`
              : 'Sin pauta ni registros esta semana'}
        </p>
      </div>
      <ol className="diary-days">
        {days.map(({ date, day, kcal, state }) => (
          <li key={date}>
            <button
              type="button"
              className="diary-day"
              data-state={state}
              aria-pressed={date === selected.date}
              aria-label={`${capital(format(parseISO(date), "EEEE d 'de' MMMM", { locale: es }))}: ${
                kcal === null ? STATES[state] : `${round(kcal)} kcal, ${STATES[state]}`
              }`}
              onClick={() => setPicked(date)}
            >
              <span className="diary-day-name">
                {capital(format(parseISO(date), 'EEEEEE', { locale: es }))}
                <b>{format(parseISO(date), 'd')}</b>
                {date === today && <i>Hoy</i>}
              </span>
              <span className="diary-day-kcal">
                {kcal === null ? '—' : round(kcal)}
                {day?.target && <small> / {round(day.target.kcal)}</small>}
              </span>
              <span className="diary-day-state">{STATES[state]}</span>
            </button>
          </li>
        ))}
      </ol>
      <DiaryDay key={selected.date} linkId={linkId} date={selected.date} day={selected.day} />
    </div>
  );
}

function DiaryDay({ linkId, date, day }: { linkId: string; date: string; day?: AdherenceDay }) {
  const future = date > format(new Date(), 'yyyy-MM-dd');
  const query = useClientData<FoodLog[]>(linkId, `nutrition/logs?date=${date}`, !future);
  const logs = query.data ?? [];
  const meals = new Map<string, FoodLog[]>();
  for (const log of logs) {
    const key = log.mealKey ?? JSON.stringify([log.mealIndex, log.mealName]);
    meals.set(key, [...(meals.get(key) ?? []), log]);
  }
  const total = sum(logs);
  const target = day?.target ?? null;

  return (
    <section className="diary-detail" aria-label="Día abierto">
      <header className="diary-detail-head">
        <h3>{capital(format(parseISO(date), "EEEE d 'de' MMMM", { locale: es }))}</h3>
        <p>
          {day?.dayType
            ? day.dayType === 'TRAINING'
              ? 'Día de entreno'
              : 'Día de descanso'
            : 'Sin pauta ese día'}
        </p>
      </header>
      {(logs.length > 0 || target) && (
        <dl className="diary-totals">
          {MACROS.map((macro) => {
            const goal = target?.[macro.key];
            const value = total[macro.key];
            return (
              <div key={macro.key}>
                <dt>{macro.label}</dt>
                <dd>
                  <b>{logs.length ? round(value) : '—'}</b>
                  {goal != null ? ` / ${round(goal)} ${macro.unit}` : ` ${macro.unit}`}
                </dd>
                {goal != null && goal > 0 && (
                  <span className="diary-meter" aria-hidden>
                    <span style={{ width: `${Math.min(100, (value / goal) * 100)}%` }} />
                  </span>
                )}
              </div>
            );
          })}
        </dl>
      )}
      {future ? (
        <p className="diary-empty">Aún no ha llegado ese día.</p>
      ) : query.isPending ? (
        <p role="status">Cargando comidas…</p>
      ) : query.isError ? (
        <QueryErrorNotice retry={() => void query.refetch()} pending={query.isFetching} />
      ) : logs.length === 0 ? (
        <p className="diary-empty">
          Nada registrado ese día. No equivale a haber consumido cero calorías.
        </p>
      ) : (
        <div className="diary-meals">
          {[...meals].map(([key, items]) => {
            const subtotal = sum(items);
            return (
              <section key={key} className="diary-meal">
                <header>
                  <h4>{items[0].mealName || `Comida ${(items[0].mealIndex ?? 0) + 1}`}</h4>
                  <p>
                    <b>{round(subtotal.kcal)} kcal</b> · P {round(subtotal.protein)} · C{' '}
                    {round(subtotal.carbs)} · G {round(subtotal.fat)} g
                  </p>
                </header>
                <ul>
                  {items.map((log, index) => (
                    <li key={log.id ?? index}>
                      <span>
                        {log.product} <small>{round(log.quantity)} g</small>
                      </span>
                      <span>{round(log.kcal)} kcal</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
