import { useState } from 'react';
import { Minus, Plus, Trophy, X } from 'lucide-react';

// Two small hands-on demos in the landing's hero: nothing is saved and nothing reaches the server.

// Epley, the estimate the app uses to compare sets with different reps.
const estimate = (kg: number, reps: number) => (reps === 1 ? kg : kg * (1 + reps / 30));
const fmt = (n: number) => n.toLocaleString('es-ES', { maximumFractionDigits: 1 });

type LoggedSet = { kg: number; reps: number; record: boolean };

function Stepper({
  label,
  value,
  unit,
  onChange,
  step,
  min,
  max,
}: {
  label: string;
  value: number;
  unit: string;
  onChange: (v: number) => void;
  step: number;
  min: number;
  max: number;
}) {
  return (
    <div className="try-stepper" role="group" aria-label={label}>
      <span className="fam-label">{label}</span>
      <div className="try-stepper__row">
        <button
          type="button"
          className="try-stepper__btn"
          aria-label={`Menos ${unit}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - step))}
        >
          <Minus size={18} aria-hidden="true" />
        </button>
        <output className="try-stepper__value" aria-live="polite">
          {fmt(value)}
          <small> {unit}</small>
        </output>
        <button
          type="button"
          className="try-stepper__btn"
          aria-label={`Más ${unit}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + step))}
        >
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function BenchDemo() {
  const [best, setBest] = useState({ kg: 80, reps: 8 });
  const [kg, setKg] = useState(80);
  const [reps, setReps] = useState(8);
  const [sets, setSets] = useState<LoggedSet[]>([]);
  const last = sets[sets.length - 1];

  const log = () => {
    const record = estimate(kg, reps) > estimate(best.kg, best.reps) + 0.05;
    if (record) setBest({ kg, reps });
    setSets((s) => [...s, { kg, reps, record }].slice(-4));
  };

  return (
    <article className="try-panel" aria-labelledby="try-bench-title">
      <header className="try-panel__head">
        <h3 id="try-bench-title" className="fam-h3">
          Registra una serie
        </h3>
        <p className="try-panel__meta">Press de banca · agarre medio</p>
      </header>
      <p className="try-best">
        Récord actual{' '}
        <strong>
          {fmt(best.kg)} kg × {best.reps}
        </strong>{' '}
        <span>(1RM est. {fmt(Math.round(estimate(best.kg, best.reps)))} kg)</span>
      </p>
      <div className="try-steppers">
        <Stepper label="Peso" unit="kg" value={kg} onChange={setKg} step={2.5} min={20} max={200} />
        <Stepper
          label="Repeticiones"
          unit="reps"
          value={reps}
          onChange={setReps}
          step={1}
          min={1}
          max={20}
        />
      </div>
      <button type="button" className="fam-btn fam-btn--ink fam-btn--block" onClick={log}>
        Registrar serie
      </button>
      <div className="try-log" aria-live="polite">
        {last?.record && (
          <p className="try-stamp" key={sets.length}>
            <Trophy size={20} aria-hidden="true" />
            ¡Nuevo récord!
          </p>
        )}
        {sets.length === 0 ? (
          <p className="try-empty">Sube el peso o las repeticiones para batir tu récord.</p>
        ) : (
          <ol className="try-sets">
            {sets.map((s, i) => (
              <li key={i} className={s.record ? 'is-record' : undefined}>
                <span>
                  {fmt(s.kg)} kg × {s.reps}
                </span>
                <span>
                  {s.record ? 'Récord' : `1RM est. ${fmt(Math.round(estimate(s.kg, s.reps)))}`}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </article>
  );
}

const FOODS = [
  { name: 'Avena con plátano', kcal: 420, p: 14, c: 72, f: 8 },
  { name: 'Pollo con arroz', kcal: 610, p: 48, c: 70, f: 14 },
  { name: 'Ensalada de atún', kcal: 380, p: 30, c: 18, f: 20 },
  { name: 'Yogur con nueces', kcal: 260, p: 15, c: 12, f: 17 },
];
const GOAL = 2200;

export function MealsDemo() {
  const [meals, setMeals] = useState<{ id: number; food: (typeof FOODS)[number] }[]>([]);
  const [next, setNext] = useState(0);
  const total = meals.reduce(
    (t, { food }) => ({
      kcal: t.kcal + food.kcal,
      p: t.p + food.p,
      c: t.c + food.c,
      f: t.f + food.f,
    }),
    { kcal: 0, p: 0, c: 0, f: 0 },
  );
  const pct = Math.min(100, (total.kcal / GOAL) * 100);

  return (
    <article className="try-panel" aria-labelledby="try-meals-title">
      <header className="try-panel__head">
        <h3 id="try-meals-title" className="fam-h3">
          Añade una comida
        </h3>
        <p className="try-panel__meta">Objetivo de hoy · {GOAL.toLocaleString('es-ES')} kcal</p>
      </header>
      <div className="try-kcal" aria-live="polite">
        <p>
          <strong>{total.kcal.toLocaleString('es-ES')}</strong> kcal
          <span> · faltan {Math.max(0, GOAL - total.kcal).toLocaleString('es-ES')}</span>
        </p>
        <div
          className="try-bar"
          role="progressbar"
          aria-label="Calorías del día"
          aria-valuemin={0}
          aria-valuemax={GOAL}
          aria-valuenow={total.kcal}
        >
          <span style={{ width: `${pct}%` }} />
        </div>
        <dl className="try-macros">
          <div>
            <dt>Proteína</dt>
            <dd>{total.p} g</dd>
          </div>
          <div>
            <dt>Carbohidratos</dt>
            <dd>{total.c} g</dd>
          </div>
          <div>
            <dt>Grasa</dt>
            <dd>{total.f} g</dd>
          </div>
        </dl>
      </div>
      <div className="try-foods">
        {FOODS.map((food) => (
          <button
            key={food.name}
            type="button"
            className="try-food"
            onClick={() => {
              setMeals((m) => [...m, { id: next, food }]);
              setNext((n) => n + 1);
            }}
          >
            <Plus size={16} aria-hidden="true" />
            <span>{food.name}</span>
            <small>{food.kcal} kcal</small>
          </button>
        ))}
      </div>
      {meals.length > 0 && (
        <ul className="try-sets">
          {meals.map(({ id, food }) => (
            <li key={id}>
              <span>{food.name}</span>
              <button
                type="button"
                className="try-remove"
                aria-label={`Quitar ${food.name}`}
                onClick={() => setMeals((m) => m.filter((x) => x.id !== id))}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

type DemoTab = 'entreno' | 'comida';

// The hero's card: the two demos behind a switch, so the first screen stays one card tall.
export function HeroDemo() {
  const [tab, setTab] = useState<DemoTab>('entreno');
  return (
    <div className="try-hero">
      <div className="try-switch" role="group" aria-label="Elige una demo">
        {(
          [
            ['entreno', 'Entreno'],
            ['comida', 'Comida'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className="try-switch__btn"
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'entreno' ? <BenchDemo /> : <MealsDemo />}
      <p className="try-note">Sin cuenta: lo que registres aquí no se guarda.</p>
    </div>
  );
}
