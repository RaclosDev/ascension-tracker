import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, Plus, Timer, Trash2, X } from 'lucide-react';
import { SetAdjustmentBar } from '../workout/SetAdjustmentBar';
import MacroSummaryHeader from '../nutrition/MacroSummaryHeader';
import { MealFoodGroup } from '../nutrition/MealFoodGroup';
import { formatRest, formatRestFriendly } from '@/lib/workout/format';
import type { FoodLog, Meal } from '../../types/api';
import type { EditingLog } from '../../types/nutrition';
import { getBasePortion } from '../../utils/nutritionHelpers';
import '../../styles/athlete-nutrition.css';

// The hero's hands-on demos. They reuse the app's own markup and pieces (exercise card, set rows,
// adjustment bar, rest banner, macro header, meal groups) with local state only: nothing is saved,
// nothing touches the workout store and nothing reaches the server.

// ---------- Workout ----------

type DemoSet = { id: number; weight: string; reps: string; completed: boolean };
type DemoExercise = {
  id: string;
  name: string;
  variant: string;
  muscle: string;
  rest: number;
  previous: [number, number][];
  best: number;
  sets: DemoSet[];
};

const COLS = '50px minmax(0,1fr) minmax(0,1fr) 44px';

const START: DemoExercise[] = [
  {
    id: 'bench',
    name: 'Press de banca',
    variant: 'Agarre medio',
    muscle: 'Pecho',
    rest: 120,
    previous: [
      [80, 8],
      [80, 7],
    ],
    best: 80,
    sets: [],
  },
  {
    id: 'row',
    name: 'Remo con barra',
    variant: 'Agarre prono',
    muscle: 'Espalda',
    rest: 90,
    previous: [
      [70, 10],
      [70, 8],
    ],
    best: 70,
    sets: [],
  },
];

let nextSetId = 1;
const freshSets = (ex: DemoExercise): DemoExercise => ({
  ...ex,
  sets: ex.previous.map(() => ({ id: nextSetId++, weight: '', reps: '', completed: false })),
});

const prevLabel = (ex: DemoExercise, i: number) => {
  const p = ex.previous[i];
  return p ? `${p[0].toLocaleString('es-ES')} × ${p[1]}` : '';
};

type Stepper = { setId: number; field: 'weight' | 'reps' } | null;

function DemoSetRow({
  ex,
  s,
  index,
  stepper,
  setStepper,
  onChange,
  onToggle,
  onRemove,
}: {
  ex: DemoExercise;
  s: DemoSet;
  index: number;
  stepper: Stepper;
  setStepper: (next: Stepper | ((curr: Stepper) => Stepper)) => void;
  onChange: (patch: Partial<DemoSet>) => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prev = prevLabel(ex, index);
  const placeholderKg = prev === '' ? '0' : (prev.split('×')[0]?.trim() ?? '0');
  const placeholderReps = prev === '' ? '0' : (prev.split('×')[1]?.trim() ?? '0');
  const pr = s.completed && parseFloat(s.weight) > ex.best && ex.best > 0;
  const open = (field: 'weight' | 'reps') => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    if (!s.completed) setStepper({ setId: s.id, field });
  };
  const close = () => {
    blurTimeout.current = setTimeout(() => {
      setStepper((curr) => (curr?.setId === s.id ? null : curr));
    }, 300);
  };
  const keep = () => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
  };
  const base = (value: string, placeholder: string) =>
    parseFloat((value || placeholder).replace(',', '.')) || 0;
  const adjustWeight = (delta: number) =>
    onChange({ weight: String(Math.max(0, base(s.weight, placeholderKg) + delta)) });
  const adjustReps = (delta: number) =>
    onChange({ reps: String(Math.max(0, base(s.reps, placeholderReps) + delta)) });

  return (
    <div className="set-row-wrapper" style={{ position: 'relative' }}>
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '8px' }}>
        <div
          className={`set-row ${s.completed ? 'completed' : ''}`}
          style={{
            gridTemplateColumns: COLS,
            background: s.completed
              ? 'rgba(var(--accent-primary-rgb, 11, 95, 116), 0.05)'
              : 'var(--bg-card)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.05rem',
            }}
          >
            <span className="set-type-btn">{index + 1}</span>
            {prev !== '' && (
              <span
                style={{
                  fontSize: '0.55rem',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  maxWidth: '48px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1,
                }}
              >
                {prev}
              </span>
            )}
            {pr && (
              <span
                style={{
                  fontSize: '0.5rem',
                  fontWeight: 700,
                  color: 'var(--accent-primary-light)',
                }}
              >
                PR
              </span>
            )}
          </div>
          <input
            inputMode="decimal"
            aria-label={`Kg de la serie ${index + 1}`}
            value={s.weight}
            placeholder={placeholderKg}
            onFocus={(e) => {
              open('weight');
              e.currentTarget.select();
            }}
            onChange={(e) => onChange({ weight: e.target.value.replace(',', '.') })}
            onBlur={close}
            className={`set-input ${s.completed ? 'completed' : ''}`}
          />
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label={`Repeticiones de la serie ${index + 1}`}
            value={s.reps}
            placeholder={placeholderReps}
            onFocus={(e) => {
              open('reps');
              e.currentTarget.select();
            }}
            onChange={(e) => onChange({ reps: e.target.value.replace(/[^\d]/g, '') })}
            onBlur={close}
            className={`set-input ${s.completed ? 'completed' : ''}`}
          />
          <button
            type="button"
            className="desktop-row-delete-btn"
            title="Eliminar serie"
            aria-label={`Borrar serie ${index + 1}`}
            onClick={onRemove}
          >
            <Trash2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => {
              setStepper(null);
              onToggle();
            }}
            aria-label={s.completed ? 'Desmarcar serie' : 'Completar serie'}
            className={`set-check-btn ${s.completed ? 'checked' : ''}`}
            style={
              s.completed
                ? {
                    background: 'var(--accent-primary)',
                    borderColor: 'var(--accent-primary)',
                    color: 'var(--accent-text, #ffffff)',
                  }
                : undefined
            }
          >
            <Check size={16} strokeWidth={s.completed ? 3 : 2} />
          </button>
        </div>
      </div>
      {stepper?.setId === s.id && stepper.field === 'weight' && (
        <SetAdjustmentBar
          label="Kg"
          negative={[-5, -2.5, -1.25]}
          positive={[1.25, 2.5, 5]}
          onAdjust={adjustWeight}
          onInteract={keep}
        />
      )}
      {stepper?.setId === s.id && stepper.field === 'reps' && (
        <SetAdjustmentBar
          label="Reps"
          negative={[-2, -1]}
          positive={[1, 2, 5]}
          onAdjust={adjustReps}
          onInteract={keep}
        />
      )}
    </div>
  );
}

function DemoRestBanner({
  remaining,
  total,
  onAdd,
  onSkip,
}: {
  remaining: number;
  total: number;
  onAdd: (delta: number) => void;
  onSkip: () => void;
}) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;
  return (
    <div className="try-rest" role="timer" aria-live="off" aria-label="Descanso">
      <div className="try-rest__bar" style={{ width: `${pct}%` }} />
      <div className="try-rest__body">
        <div>
          <div className="try-rest__label">Descanso</div>
          <div className="try-rest__time">{formatRest(remaining)}</div>
        </div>
        <div className="try-rest__actions">
          <button type="button" className="btn btn-secondary" onClick={() => onAdd(-15)}>
            -15
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => onAdd(15)}>
            +15
          </button>
          <button type="button" className="btn btn-primary" onClick={onSkip}>
            Omitir
          </button>
        </div>
      </div>
    </div>
  );
}

export function WorkoutDemo({ tabs }: { tabs?: ReactNode }) {
  const [exercises, setExercises] = useState<DemoExercise[]>(() => START.map(freshSets));
  const [stepper, setStepper] = useState<Stepper>(null);
  const [rest, setRest] = useState<{ remaining: number; total: number } | null>(null);

  const resting = rest !== null;
  useEffect(() => {
    if (!resting) return;
    const t = setInterval(
      () => setRest((r) => (r && r.remaining > 1 ? { ...r, remaining: r.remaining - 1 } : null)),
      1000,
    );
    return () => clearInterval(t);
  }, [resting]);

  const updateSets = (exId: string, fn: (ex: DemoExercise) => DemoSet[]) =>
    setExercises((list) => list.map((ex) => (ex.id === exId ? { ...ex, sets: fn(ex) } : ex)));

  const toggle = (ex: DemoExercise, i: number) => {
    const s = ex.sets[i];
    if (!s) return;
    if (s.completed) {
      updateSets(ex.id, (e) => e.sets.map((x) => (x.id === s.id ? { ...x, completed: false } : x)));
      return;
    }
    // Like the app: an empty field takes the last time's value before the set is marked done.
    const prev = ex.previous[i] ?? ex.previous[ex.previous.length - 1];
    const weight = s.weight || (prev ? String(prev[0]) : '0');
    const reps = s.reps || (prev ? String(prev[1]) : '0');
    updateSets(ex.id, (e) =>
      e.sets.map((x) => (x.id === s.id ? { ...x, weight, reps, completed: true } : x)),
    );
    setRest({ remaining: ex.rest, total: ex.rest });
  };

  return (
    <article className="try-panel try-app" aria-label="Demo de entreno">
      {tabs}
      <div className="try-screen">
        {exercises.map((ex) => (
          <article key={ex.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="exercise-card-header">
              <div style={{ minWidth: 0 }}>
                <h3
                  className="exercise-card-name"
                  style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}
                >
                  <span>{ex.name}</span>
                  <span className="exercise-card-variant-badge">{ex.variant}</span>
                </h3>
                <div className="exercise-card-meta">
                  <span>{ex.muscle}</span>
                  <span className="exercise-card-meta-dot">•</span>
                  <span className="exercise-card-rest-pill" title="Tiempo de descanso">
                    <Timer size={12} className="exercise-card-rest-icon" />
                    {formatRestFriendly(ex.rest)}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ padding: '0.25rem 0.5rem 0.75rem' }}>
              <div className="set-grid-header" style={{ gridTemplateColumns: COLS }}>
                <span>#</span>
                <span>Kg</span>
                <span>Reps</span>
                <span />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {ex.sets.map((s, i) => (
                  <DemoSetRow
                    key={s.id}
                    ex={ex}
                    s={s}
                    index={i}
                    stepper={stepper}
                    setStepper={setStepper}
                    onChange={(patch) =>
                      updateSets(ex.id, (e) =>
                        e.sets.map((x) => (x.id === s.id ? { ...x, ...patch } : x)),
                      )
                    }
                    onToggle={() => toggle(ex, i)}
                    onRemove={() => updateSets(ex.id, (e) => e.sets.filter((x) => x.id !== s.id))}
                  />
                ))}
              </div>
              <button
                type="button"
                className="add-set-btn btn-press"
                disabled={ex.sets.length >= 6}
                onClick={() =>
                  updateSets(ex.id, (e) => {
                    const last = e.sets[e.sets.length - 1];
                    return [
                      ...e.sets,
                      {
                        id: nextSetId++,
                        weight: last?.weight ?? '',
                        reps: last?.reps ?? '',
                        completed: false,
                      },
                    ];
                  })
                }
              >
                <Plus size={16} />
                Añadir serie
              </button>
            </div>
          </article>
        ))}
      </div>
      {rest && (
        <DemoRestBanner
          remaining={rest.remaining}
          total={rest.total}
          onAdd={(d) =>
            setRest((r) =>
              r
                ? {
                    remaining: Math.max(0, r.remaining + d),
                    total: Math.max(r.total, r.remaining + d),
                  }
                : r,
            )
          }
          onSkip={() => setRest(null)}
        />
      )}
    </article>
  );
}

// ---------- Nutrition ----------

type DemoFood = {
  product: string;
  per100: { kcal: number; protein: number; carbs: number; fat: number };
  grams: number;
  portion?: { label: string; amount: number };
};

const FOODS: DemoFood[] = [
  {
    product: 'Copos de avena',
    per100: { kcal: 372, protein: 13.5, carbs: 58.7, fat: 7 },
    grams: 60,
  },
  {
    product: 'Plátano',
    per100: { kcal: 94, protein: 1.2, carbs: 20, fat: 0.3 },
    grams: 120,
    portion: { label: 'unidad', amount: 120 },
  },
  {
    product: 'Huevo',
    per100: { kcal: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
    grams: 120,
    portion: { label: 'huevo', amount: 60 },
  },
  {
    product: 'Pechuga de pollo',
    per100: { kcal: 110, protein: 23, carbs: 0, fat: 1.6 },
    grams: 150,
  },
  {
    product: 'Arroz blanco cocido',
    per100: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
    grams: 200,
  },
  {
    product: 'Yogur griego natural',
    per100: { kcal: 115, protein: 4, carbs: 4, fat: 9 },
    grams: 125,
    portion: { label: 'yogur', amount: 125 },
  },
  {
    product: 'Salmón',
    per100: { kcal: 208, protein: 20, carbs: 0, fat: 13 },
    grams: 150,
  },
];

const MEALS: Meal[] = [
  { name: 'Desayuno', icon: 'coffee', mealKey: 'breakfast' },
  { name: 'Comida', icon: 'utensils', mealKey: 'lunch' },
  { name: 'Cena', icon: 'moon', mealKey: 'dinner' },
];

// Yesterday's meals, for "copy from yesterday".
const YESTERDAY: Record<number, string[]> = {
  0: ['Copos de avena', 'Plátano'],
  1: ['Pechuga de pollo', 'Arroz blanco cocido'],
  2: ['Salmón', 'Yogur griego natural'],
};

const MACROS = { kcal: 2400, protein: 160, carbs: 270, fat: 75 };
const round1 = (n: number) => Math.round(n * 10) / 10;
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

let nextLogId = 1;
const toLog = (food: DemoFood, mealIndex: number, date: string, grams = food.grams): FoodLog => ({
  id: nextLogId++,
  date,
  mealIndex,
  product: food.product,
  quantity: grams,
  kcal: round1((food.per100.kcal * grams) / 100),
  protein: round1((food.per100.protein * grams) / 100),
  carbs: round1((food.per100.carbs * grams) / 100),
  fat: round1((food.per100.fat * grams) / 100),
  portionsJson: food.portion
    ? JSON.stringify([{ label: `1 ${food.portion.label}`, amount: food.portion.amount }])
    : undefined,
});

const noop = () => {};

export function NutritionDemo({ tabs }: { tabs?: ReactNode }) {
  const [date, setDate] = useState(todayIso);
  const [logs, setLogs] = useState<FoodLog[]>(() => [
    toLog(FOODS[0], 0, todayIso()),
    toLog(FOODS[1], 0, todayIso()),
  ]);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [picker, setPicker] = useState<number | null>(null);
  const [editing, setEditing] = useState<EditingLog | null>(null);
  const [editMode, setEditMode] = useState<'grams' | 'portions'>('grams');

  const dayLogs = useMemo(() => logs.filter((l) => l.date === date), [logs, date]);
  const consumed = dayLogs.reduce(
    (t, l) => ({
      kcal: t.kcal + l.kcal,
      protein: t.protein + l.protein,
      carbs: t.carbs + l.carbs,
      fat: t.fat + l.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const add = (food: DemoFood, mealIndex: number) => {
    setLogs((l) => [...l, toLog(food, mealIndex, date)]);
    setCollapsed((c) => ({ ...c, [mealIndex]: false }));
  };

  const editLog = (log: FoodLog) => {
    const q = log.quantity || 1;
    setEditMode(getBasePortion(log.portionsJson ?? null) ? 'portions' : 'grams');
    setEditing({
      ...log,
      _kcalPer100: (log.kcal / q) * 100,
      _protPer100: (log.protein / q) * 100,
      _carbsPer100: (log.carbs / q) * 100,
      _fatPer100: (log.fat / q) * 100,
    });
  };

  const changeQuantity = (qty: number | string) =>
    setEditing((e) => {
      if (!e) return e;
      const q = typeof qty === 'number' ? qty : parseFloat(qty) || 0;
      return {
        ...e,
        quantity: q,
        kcal: round1((e._kcalPer100 * q) / 100),
        protein: round1((e._protPer100 * q) / 100),
        carbs: round1((e._carbsPer100 * q) / 100),
        fat: round1((e._fatPer100 * q) / 100),
      };
    });

  return (
    <article className="try-panel try-app" aria-label="Demo de nutrición">
      {tabs}
      <div className="try-screen">
        <MacroSummaryHeader
          date={date}
          onDateChange={setDate}
          consumed={consumed}
          macros={MACROS}
        />
        {MEALS.map((meal, index) => (
          <div key={meal.mealKey}>
            <MealFoodGroup
              meal={meal}
              mealIndex={index}
              logs={dayLogs.filter((l) => l.mealIndex === index)}
              isCollapsed={!!collapsed[index]}
              isDragOver={false}
              editingLog={editing?.mealIndex === index ? editing : null}
              editInputMode={editMode}
              onToggleCollapse={(i) => setCollapsed((c) => ({ ...c, [i]: !c[i] }))}
              onCopyFromYesterday={(_e, i) => {
                const names = YESTERDAY[i] ?? [];
                setLogs((l) => [
                  ...l,
                  ...FOODS.filter((f) => names.includes(f.product)).map((f) => toLog(f, i, date)),
                ]);
                setCollapsed((c) => ({ ...c, [i]: false }));
              }}
              onOpenAddFoodModal={(i) => setPicker((p) => (p === i ? null : i))}
              onDragStart={noop}
              onDrag={noop}
              onDragOver={noop}
              onDragLeave={noop}
              onDrop={noop}
              onEditLog={editLog}
              onDeleteLog={(id) => setLogs((l) => l.filter((x) => x.id !== id))}
              onEditInputModeChange={setEditMode}
              onEditQuantityChange={changeQuantity}
              onUpdateLog={() => {
                if (!editing) return;
                const { id, quantity, kcal, protein, carbs, fat } = editing;
                const update = { quantity, kcal, protein, carbs, fat };
                setLogs((l) => l.map((x) => (x.id === id ? { ...x, ...update } : x)));
                setEditing(null);
              }}
              onCancelEdit={() => setEditing(null)}
            />
            {picker === index && (
              <div className="try-picker" role="dialog" aria-label={`Añadir a ${meal.name}`}>
                <div className="try-picker__head">
                  <span>Añadir a {meal.name}</span>
                  <button
                    type="button"
                    className="try-picker__close"
                    aria-label="Cerrar"
                    onClick={() => setPicker(null)}
                  >
                    <X size={16} />
                  </button>
                </div>
                <ul>
                  {FOODS.map((food) => (
                    <li key={food.product}>
                      <button
                        type="button"
                        onClick={() => {
                          add(food, index);
                          setPicker(null);
                        }}
                      >
                        <span>{food.product}</span>
                        <small>
                          {food.grams} g · {Math.round((food.per100.kcal * food.grams) / 100)} kcal
                        </small>
                        <Plus size={16} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}

type DemoTab = 'entreno' | 'comida';

// The hero's card: the two demos behind tabs printed on the sheet itself, like porrApp's.
export function HeroDemo() {
  const [tab, setTab] = useState<DemoTab>('entreno');
  const tabs = (
    <div className="try-tabs" role="tablist" aria-label="Elige una demo">
      {(
        [
          ['entreno', 'Entreno'],
          ['comida', 'Nutrición'],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="tab"
          className="try-tab"
          aria-selected={tab === value}
          onClick={() => setTab(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
  return tab === 'entreno' ? <WorkoutDemo tabs={tabs} /> : <NutritionDemo tabs={tabs} />;
}
