import type { FoodLog } from '../types/api';
import type { CompletedWorkout } from '../lib/workout/types';
import type { CoachClient } from '../lib/coach/api';
import type { Checkin } from '../lib/coach/checkins';
import type { ClientStatus } from '../lib/coach/clientStatus';
import type { Program, ProgramDay, ProgramExercise } from '../lib/coach/coachPrograms';
import type { AdherenceDay, AdherenceWeek } from '../lib/coach/nutritionAdherence';
import type {
  DayTargets,
  NutritionPlan,
  NutritionPlanVersion,
  PlannedMeal,
} from '../lib/coach/nutritionPlan';
import type { PowerMeet } from '../lib/coach/powerMeets';
import type { SavedPowerProfile } from '../lib/coach/powerlifting';
import type { DayComment } from '../lib/coach/sessions';
import { shiftWeek, weekDate, type SavedWeek, type WeekContent } from '../lib/coach/weeks';
import { iso, round, seeded, weekly, weightDashboard, weightList } from './series';

/**
 * Lucía Vega, la atleta de ejemplo del panel de entrenador: un bloque de fuerza de ocho semanas
 * hacia una competición, con sus sesiones hechas, su diario de comidas, su peso y sus seguimientos.
 */

const LINK = 'tour-lucia';
const BASE = `/coach/clients/${LINK}`;
const rand = seeded(20260415);
let sequence = 5000;
const nextId = () => ++sequence;

const today = iso(new Date());
const current = weekDate();
/** Desde cuándo la entrena Laura. */
const since = shiftWeek(current, -6);
const blockStart = shiftWeek(current, -5);
const planChange = shiftWeek(current, -3);
const at = (week: string, days: number) => {
  const [y, m, d] = week.split('-').map(Number);
  return iso(new Date(y, m - 1, d + days, 12));
};
const timeAt = (date: string, hour: number) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, hour, 30).getTime();
};
const plates = (kg: number) => Math.round(kg / 2.5) * 2.5;
const training = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return [1, 3, 5].includes(new Date(y, m - 1, d).getDay());
};

// ── Bloque ─────────────────────────────────────────────────────────────────

const INTENTS: WeekContent['intent'][] = [
  'BUILD',
  'BUILD',
  'BUILD',
  'DELOAD',
  'BUILD',
  'BUILD',
  'TEST',
  'COMPETE',
];
const SETS = [4, 4, 4, 3, 4, 4, 3, 2];
const REPS = [5, 5, 4, 5, 4, 3, 2, 2];
const RPE = [7, 7.5, 8, 6, 8, 8.5, 9, 6];
const TOP = {
  squat: [90, 92.5, 95, 80, 95, 97.5, 102.5, 90],
  bench: [50, 52.5, 52.5, 45, 55, 57.5, 60, 52.5],
  deadlift: [115, 117.5, 120, 105, 122.5, 125, 132.5, 115],
};
const EXERCISES = {
  squat: ['base-cuadriceps-sentadilla-libre-barra', 'Sentadilla'],
  bench: ['base-pecho-press-de-pecho-plano-barra', 'Press de banca'],
  deadlift: ['base-lumbares-peso-muerto-tradicional-barra', 'Peso muerto'],
  front: ['base-cuadriceps-sentadilla-frontal-barra', 'Sentadilla frontal'],
  rdl: ['base-femorales-peso-muerto-rumano-barra', 'Peso muerto rumano'],
  row: ['base-espalda_alta-remo-con-barra-barra', 'Remo con barra'],
  ohp: ['base-hombros-press-militar-barra', 'Press militar'],
  pullup: ['base-dorsales-dominadas-peso-corporal', 'Dominadas'],
  lunge: ['base-cuadriceps-zancadas-mancuernas', 'Zancadas'],
} as const;

const exercise = (
  key: keyof typeof EXERCISES,
  sets: number,
  reps: number,
  rpe: number,
  kg: number,
  restSeconds: number,
  notes: string | null = null,
  unit: 'TOTAL' | 'EACH' = 'TOTAL',
): ProgramExercise => ({
  exerciseId: EXERCISES[key][0],
  exerciseName: EXERCISES[key][1],
  sets,
  repsMin: reps,
  repsMax: reps,
  targetRpe: rpe,
  targetRir: null,
  restSeconds,
  loadHint: null,
  supersetGroup: null,
  notes,
  prescription: kg ? { load: { mode: 'KG', amount: kg, unit } } : null,
});

function days(w: number): ProgramDay[] {
  const accessory = (kg: number) =>
    INTENTS[w] === 'DELOAD' ? plates(kg * 0.85) : kg + 2.5 * Math.floor(w / 2);
  const day = (dayIndex: number, name: string, notes: string, exercises: ProgramExercise[]) => ({
    week: 1,
    dayIndex,
    name,
    notes,
    exercises,
  });
  if (INTENTS[w] === 'COMPETE')
    return [
      day(1, 'Sentadilla y banca ligeras', 'Solo técnica: nada cerca del fallo.', [
        exercise('squat', 2, 2, 6, TOP.squat[w], 180, 'Ritmo de competición, con voces.'),
        exercise('bench', 2, 2, 6, TOP.bench[w], 150, 'Pausa marcada en el pecho.'),
      ]),
      day(3, 'Peso muerto ligero', 'Última sesión con carga.', [
        exercise('deadlift', 2, 2, 6, TOP.deadlift[w], 180),
        exercise('bench', 2, 3, 6, plates(TOP.bench[w] * 0.9), 120),
      ]),
      day(5, 'Activación', 'Calienta como el día de la competición y vete a casa.', [
        exercise('squat', 2, 1, 5, 70, 120),
        exercise('bench', 2, 1, 5, 40, 120),
      ]),
    ];
  const test = INTENTS[w] === 'TEST';
  return [
    day(
      1,
      'Sentadilla y banca',
      test ? 'Dobles pesados: para si la técnica se rompe.' : 'Calienta subiendo de 20 en 20 kg.',
      [
        exercise(
          'squat',
          SETS[w],
          REPS[w],
          RPE[w],
          TOP.squat[w],
          240,
          'Profundidad por debajo de la paralela.',
        ),
        exercise('bench', SETS[w], REPS[w] + 2, RPE[w] - 1, TOP.bench[w] - 5, 180),
        exercise('row', 3, 8, 7, accessory(42.5), 120),
        exercise('lunge', 3, 10, 7, accessory(12), 90, null, 'EACH'),
      ],
    ),
    day(3, 'Peso muerto y press', 'Agarre mixto solo en las series pesadas.', [
      exercise('deadlift', SETS[w] - 1, REPS[w], RPE[w], TOP.deadlift[w], 240),
      exercise('ohp', 3, 6, 7.5, accessory(30), 120),
      exercise('pullup', 3, 6, 8, 0, 120),
    ]),
    day(5, 'Banca y frontal', 'Pausa de un segundo en el pecho en todas las series.', [
      exercise('bench', SETS[w], REPS[w], RPE[w], TOP.bench[w], 180),
      exercise('front', 3, 5, 7, plates(TOP.squat[w] * 0.72), 150),
      exercise('rdl', 3, 8, 7, plates(TOP.deadlift[w] * 0.68), 120),
    ]),
  ];
}

const INTENT_NAMES = {
  BUILD: 'Acumulación',
  MAINTAIN: 'Mantenimiento',
  DELOAD: 'Descarga',
  TEST: 'Test',
  COMPETE: 'Competición',
} as const;
const DECISIONS = [
  'Arrancamos con RPE 7: todas las series salieron limpias.',
  'Subimos 2,5 kg en los básicos.',
  'Bajamos a 4 repeticiones; la última serie de sentadilla llegó a RPE 8,5.',
  'Semana de descarga tras tres de carga.',
  'Vuelve con buenas sensaciones: seguimos subiendo.',
  'Si el miércoles el peso muerto va rápido, la semana que viene hacemos dobles a RPE 9.',
  'Dobles pesados para decidir las aperturas.',
  '',
];
const NOTES = [
  'Le cuesta mantener la espalda alta en la banca: insistir en la retracción.',
  '',
  'Duerme peor por el trabajo; vigilar el RPE.',
  '',
  '',
  'Rodilla izquierda bien. Pide más trabajo de espalda alta.',
  'Decidir aperturas con los dobles del lunes y el miércoles.',
  'Pendiente: confirmar horario del pesaje.',
];

const savedWeeks: SavedWeek[] = INTENTS.map((intent, w) => {
  const weekStart = shiftWeek(blockStart, w);
  const draft = w === INTENTS.length - 1;
  const program: Program = {
    id: null,
    name: `Semana ${w + 1} · ${INTENT_NAMES[intent]}`,
    notes: 'Apunta el RPE de cada serie; si una pasa de 9, quita peso en la siguiente.',
    weeks: 1,
    days: days(w),
    status: draft ? 'DRAFT' : 'READY',
  };
  return {
    linkId: LINK,
    weekStart,
    version: 2,
    assignmentId: null,
    publishedVersion: draft ? null : 2,
    updatedAt: `${at(weekStart, -2)}T19:00:00Z`,
    content: { program, privateNotes: NOTES[w], intent, decision: DECISIONS[w] },
  };
});
const meetDate = at(savedWeeks.at(-1)!.weekStart, 5);

// ── Entrenos hechos ────────────────────────────────────────────────────────

const workouts: CompletedWorkout[] = [];
savedWeeks.forEach((week, w) => {
  for (const day of week.content.program.days) {
    const date = at(week.weekStart, day.dayIndex - 1);
    // Se saltó el viernes de la descarga.
    if (date > today || (INTENTS[w] === 'DELOAD' && day.dayIndex === 5)) continue;
    const startedAt = timeAt(date, date === today ? 7 : 18);
    const finishedAt = startedAt + (62 + Math.round(rand() * 25)) * 60_000;
    if (finishedAt > Date.now()) continue;
    const id = `lucia-workout-${date}`;
    const modified = w === 4 && day.dayIndex === 3;
    workouts.push({
      id,
      name: day.name,
      startedAt,
      finishedAt,
      notes: modified ? 'Hoy solo dos series de dominadas: me molestaba el codo.' : '',
      programDayId: `lucia-day-${w}-${day.dayIndex}`,
      programOrigin: modified ? 'PRESCRIBED_MODIFIED' : 'PRESCRIBED',
      exercises: day.exercises.map((item, e) => {
        const sets = modified && item.exerciseId === EXERCISES.pullup[0] ? 2 : item.sets;
        const kg = item.prescription?.load?.amount;
        return {
          id: `${id}-e${e}`,
          exerciseId: item.exerciseId,
          notes: '',
          sets: Array.from({ length: sets }, (_, s) => {
            const reps = (item.repsMax ?? 5) - (s === sets - 1 && rand() < 0.25 ? 1 : 0);
            const rpe =
              (item.targetRpe ?? 7) + (s === sets - 1 ? 0.5 : 0) - (rand() < 0.3 ? 0.5 : 0);
            return {
              id: `${id}-e${e}-s${s}`,
              type: 'normal' as const,
              weight: kg ? String(kg) : '',
              reps: String(reps),
              rpe: String(Math.min(rpe, 10)),
              completed: true,
            };
          }),
        };
      }),
    });
  }
});
{
  // Una sesión libre en el fin de semana de la descarga.
  const date = at(shiftWeek(blockStart, 3), 5);
  const startedAt = timeAt(date, 11);
  workouts.push({
    id: `lucia-workout-${date}`,
    name: 'Accesorios en casa',
    startedAt,
    finishedAt: startedAt + 40 * 60_000,
    notes: 'Lo que tocaba el viernes, en versión corta.',
    exercises: [
      ['lunge', '10', '12'],
      ['pullup', '', '6'],
    ].map(([key, weight, reps], e) => ({
      id: `lucia-free-e${e}`,
      exerciseId: EXERCISES[key as keyof typeof EXERCISES][0],
      notes: '',
      sets: Array.from({ length: 3 }, (_, s) => ({
        id: `lucia-free-e${e}-s${s}`,
        type: 'normal' as const,
        weight,
        reps,
        completed: true,
      })),
    })),
  });
}
workouts.sort((x, y) => y.startedAt - x.startedAt);

const comments = new Map<string, string>([
  [
    `lucia-workout-${at(shiftWeek(current, -1), 0)}`,
    'Muy buena sentadilla: la profundidad es la misma en todas las series.',
  ],
  [
    `lucia-workout-${at(shiftWeek(current, -1), 4)}`,
    'La pausa de la banca, perfecta. El viernes que viene probamos 57,5.',
  ],
  [
    `lucia-workout-${at(shiftWeek(blockStart, 4), 2)}`,
    'Bien hecho parar con el codo. Si sigue molestando, cambiamos a jalón.',
  ],
]);

const workoutStats = () => {
  let totalDurationSeconds = 0;
  let totalVolume = 0;
  let totalSets = 0;
  for (const workout of workouts) {
    totalDurationSeconds += Math.round((workout.finishedAt - workout.startedAt) / 1000);
    for (const item of workout.exercises)
      for (const set of item.sets) {
        totalSets++;
        totalVolume += (Number(set.weight) || 0) * (Number(set.reps) || 0);
      }
  }
  return { totalWorkouts: workouts.length, totalDurationSeconds, totalVolume, totalSets };
};

// ── Peso y pasos ───────────────────────────────────────────────────────────

const weights = new Map<string, number>();
const steps = new Map<string, number>();
{
  const total = Math.round((Date.parse(today) - Date.parse(since)) / 86_400_000);
  for (let i = 0; i <= total; i++) {
    const date = at(since, i);
    const trend = 64.6 - (i / total) * 1.4;
    if (i > total - 2 || rand() > 0.15) weights.set(date, round(trend + (rand() - 0.5) * 0.6));
    if (date < today && rand() > 0.08)
      steps.set(date, Math.round((training(date) ? 7500 : 9000) + rand() * 3500));
  }
}

// ── Comidas ────────────────────────────────────────────────────────────────

// nombre, kcal, proteína, hidratos y grasa por 100 g
const FOODS: [string, number, number, number, number][] = [
  ['Copos de avena', 372, 13, 60, 7],
  ['Leche semidesnatada', 46, 3.3, 4.8, 1.6],
  ['Plátano', 89, 1.1, 23, 0.3],
  ['Huevos', 143, 12.6, 0.7, 9.5],
  ['Pan de centeno', 259, 8.5, 48, 3.3],
  ['Pechuga de pavo', 104, 22, 0, 1.5],
  ['Arroz basmati cocido', 130, 2.7, 28, 0.3],
  ['Aceite de oliva virgen extra', 884, 0, 0, 100],
  ['Calabacín', 17, 1.2, 3.1, 0.3],
  ['Skyr natural', 63, 11, 4, 0.2],
  ['Arándanos', 57, 0.7, 14, 0.3],
  ['Merluza', 86, 18, 0, 1.3],
  ['Boniato asado', 90, 2, 21, 0.2],
  ['Garbanzos cocidos', 139, 7.6, 23, 2.4],
  ['Proteína de suero', 380, 78, 6, 5],
  ['Quinoa cocida', 120, 4.4, 21, 1.9],
  ['Almendras', 579, 21, 22, 50],
];
const MEAL_NAMES = ['Desayuno', 'Comida', 'Merienda', 'Cena'];
// [comida, alimento, gramos]
const TRAINING_MENUS: [number, number, number][][] = [
  [
    [0, 0, 60],
    [0, 1, 250],
    [0, 2, 120],
    [1, 5, 150],
    [1, 6, 250],
    [1, 8, 200],
    [1, 7, 10],
    [2, 9, 170],
    [2, 10, 100],
    [2, 14, 25],
    [3, 11, 200],
    [3, 12, 250],
    [3, 7, 10],
  ],
  [
    [0, 4, 80],
    [0, 3, 120],
    [0, 2, 100],
    [1, 13, 250],
    [1, 15, 150],
    [1, 8, 150],
    [1, 7, 10],
    [2, 9, 170],
    [2, 16, 20],
    [2, 14, 25],
    [3, 5, 150],
    [3, 6, 200],
    [3, 7, 10],
  ],
];
const REST_MENU: [number, number, number][] = [
  [0, 9, 200],
  [0, 0, 40],
  [0, 10, 100],
  [1, 11, 200],
  [1, 15, 150],
  [1, 8, 200],
  [1, 7, 10],
  [2, 16, 20],
  [2, 2, 100],
  [3, 3, 120],
  [3, 4, 60],
  [3, 8, 150],
  [3, 7, 5],
];

const PLANS = {
  old: {
    training: { kcal: 2025, protein: 120, carbs: 240, fat: 65 },
    rest: { kcal: 1825, protein: 120, carbs: 190, fat: 65 },
  },
  active: {
    training: { kcal: 2105, protein: 130, carbs: 250, fat: 65 },
    rest: { kcal: 1845, protein: 130, carbs: 185, fat: 65 },
  },
};
const targetOf = (date: string): DayTargets | null => {
  if (date < since) return null;
  const plan = date >= planChange ? PLANS.active : PLANS.old;
  return training(date) ? plan.training : plan.rest;
};

const menuKcal = (menu: [number, number, number][]) =>
  menu.reduce((sum, [, food, grams]) => sum + (FOODS[food][1] * grams) / 100, 0);

const logs: FoodLog[] = [];
{
  const total = Math.round((Date.parse(today) - Date.parse(since)) / 86_400_000);
  for (let i = 0; i <= total; i++) {
    const date = at(since, i);
    const target = targetOf(date)!;
    const menu = training(date) ? TRAINING_MENUS[i % 2] : REST_MENU;
    const scale = (target.kcal / menuKcal(menu)) * (0.93 + rand() * 0.13);
    // Algún día sin apuntar, como en la vida real; hoy solo lleva desayuno y comida.
    if (date < today && rand() < 0.1) continue;
    for (const [mealIndex, food, base] of menu) {
      if (date === today && mealIndex > 1) continue;
      const [product, kcal, protein, carbs, fat] = FOODS[food];
      const grams = Math.max(5, Math.round((base * scale) / 5) * 5);
      const ratio = grams / 100;
      logs.push({
        id: nextId(),
        date,
        mealIndex,
        mealKey: `meal-${mealIndex + 1}`,
        mealName: MEAL_NAMES[mealIndex],
        product,
        quantity: grams,
        kcal: Math.round(kcal * ratio),
        protein: round(protein * ratio),
        carbs: round(carbs * ratio),
        fat: round(fat * ratio),
      });
    }
  }
}

const intakeOf = (date: string) => {
  const day = logs.filter((log) => log.date === date);
  if (!day.length) return null;
  return day.reduce(
    (sum, log) => ({
      kcal: sum.kcal + log.kcal,
      protein: round(sum.protein + log.protein),
      carbs: round(sum.carbs + log.carbs),
      fat: round(sum.fat + log.fat),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
};

function adherence(weeks: number): AdherenceWeek[] {
  return Array.from({ length: weeks }, (_, n) => {
    const weekStart = shiftWeek(current, n - weeks + 1);
    const days: AdherenceDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = at(weekStart, i);
      if (date > today) break;
      const target = targetOf(date);
      const intake = intakeOf(date);
      days.push({
        date,
        dayType: target ? (training(date) ? 'TRAINING' : 'REST') : null,
        target,
        intake,
        onTarget:
          !!target &&
          !!intake &&
          Math.abs(intake.kcal - target.kcal) <= target.kcal * 0.1 &&
          intake.protein >= target.protein * 0.9,
      });
    }
    const planned = days.filter((day) => day.target);
    const logged = planned.filter((day) => day.intake);
    const pct = (key: 'kcal' | 'protein') => {
      const want = logged.reduce((sum, day) => sum + day.target![key], 0);
      const got = logged.reduce((sum, day) => sum + day.intake![key], 0);
      return want ? Math.round((got / want) * 100) : null;
    };
    return {
      weekStart,
      plannedDays: planned.length,
      loggedDays: logged.length,
      onTargetDays: logged.filter((day) => day.onTarget).length,
      kcalPct: pct('kcal'),
      proteinPct: pct('protein'),
      days,
    };
  });
}

const coach = { name: 'Laura Díaz', email: 'laura@example.test', picture: null };
const meal = (
  dayType: PlannedMeal['dayType'],
  slotName: string,
  name: string,
  description: string,
  [kcal, protein, carbs, fat]: number[],
): PlannedMeal => ({
  dayType,
  slotName,
  recipeId: `lucia-recipe-${nextId()}`,
  name,
  description,
  servings: 1,
  kcal,
  protein,
  carbs,
  fat,
});
const activePlan: NutritionPlan = {
  id: 'lucia-plan-2',
  coach,
  ...PLANS.active,
  notes:
    'Más hidratos los días de entreno, sobre todo en la comida de antes de la sesión. ' +
    'Proteína repartida en cuatro tomas.',
  createdAt: `${planChange}T09:00:00Z`,
  meals: [
    meal('TRAINING', 'Desayuno', 'Avena con plátano', 'Avena, leche y plátano.', [445, 18, 76, 8]),
    meal(
      'TRAINING',
      'Comida',
      'Pavo con arroz',
      'Pavo, arroz basmati y calabacín.',
      [600, 39, 74, 13],
    ),
    meal(
      'TRAINING',
      'Merienda',
      'Skyr con arándanos',
      'Con un cacito de proteína.',
      [260, 39, 22, 2],
    ),
    meal(
      'TRAINING',
      'Cena',
      'Merluza con boniato',
      'Boniato asado y un hilo de aceite.',
      [480, 41, 53, 13],
    ),
    meal('REST', 'Desayuno', 'Skyr con avena', 'Skyr, avena y arándanos.', [330, 28, 46, 4]),
    meal('REST', 'Comida', 'Merluza con quinoa', 'Quinoa y calabacín salteado.', [480, 44, 36, 15]),
    meal(
      'REST',
      'Cena',
      'Huevos con pan de centeno',
      'Tortilla francesa y verdura.',
      [400, 22, 33, 19],
    ),
  ],
};
const oldPlan: NutritionPlan = {
  ...activePlan,
  id: 'lucia-plan-1',
  ...PLANS.old,
  notes: 'Primeras semanas: mismas comidas todos los días y aprender a pesar.',
  createdAt: `${since}T09:00:00Z`,
  meals: activePlan.meals.filter((item) => item.dayType === 'TRAINING'),
};
const history: NutritionPlanVersion[] = [
  {
    id: activePlan.id,
    ...PLANS.active,
    status: 'ACTIVE',
    createdAt: activePlan.createdAt,
    endedAt: null,
  },
  {
    id: oldPlan.id,
    ...PLANS.old,
    status: 'ENDED',
    createdAt: oldPlan.createdAt,
    endedAt: activePlan.createdAt,
  },
];

// ── Seguimiento ────────────────────────────────────────────────────────────

const weightWeeks = weekly(weights, 2);
const averageOf = (weekStart: string) =>
  weightWeeks.find((week) => week.weekStart === weekStart)?.average ?? null;
const ANSWERS = [
  [
    'Las sentadillas: he cogido confianza con la profundidad.',
    'El press de banca, la última serie.',
  ],
  ['Comer más los días de entreno sin pasarme.', 'El peso muerto del miércoles.'],
  ['La descarga me ha sentado genial.', 'Nada en especial.'],
  [
    'He dormido mejor y se nota en el gimnasio.',
    'La sentadilla del lunes, la última serie a RPE 9.',
  ],
];
const checkins: Checkin[] = ANSWERS.map(([good, hard], n) => {
  const weekStart = shiftWeek(current, n - ANSWERS.length);
  const createdAt = `${at(weekStart, 6)}T17:00:00Z`;
  const last = n === ANSWERS.length - 1;
  return {
    id: `lucia-checkin-${n}`,
    linkId: LINK,
    weekStart,
    weightAvg: averageOf(weekStart) ?? 63.5,
    energy: [3, 3, 4, 4][n],
    sleep: [2, 3, 4, 4][n],
    trainingAdherence: [5, 5, 4, 5][n],
    dietAdherence: [4, 4, 4, 5][n],
    answers: [
      { question: '¿Qué ha ido bien?', answer: good },
      { question: '¿Qué sesión te ha costado más?', answer: hard },
    ],
    notes: last ? 'Me noto fuerte. ¿Hacemos dobles la semana que viene?' : '',
    coachReply: last ? null : 'Buena semana. Seguimos con el plan y apunta el RPE de cada serie.',
    repliedAt: last ? null : `${at(weekStart, 7)}T09:00:00Z`,
    createdAt,
    updatedAt: createdAt,
    updates: [],
    submissionStatus: 'FINAL' as const,
  };
}).reverse();

const dayComments: DayComment[] = [
  [
    at(shiftWeek(current, -1), 5),
    'Día libre: paseo largo y quince minutos de movilidad de cadera.',
  ],
  [at(current, 1), 'Descanso activo. Si hay agujetas de la sentadilla, bici suave veinte minutos.'],
].map(([date, text]) => ({ date, text, updatedAt: `${date}T08:00:00Z` }));

const status = (): ClientStatus => {
  const recent = averageOf(shiftWeek(current, -1));
  const before = averageOf(shiftWeek(current, -4));
  return {
    linkId: LINK,
    level: 'GREEN',
    lastActivity: today,
    lastWorkout: iso(new Date(workouts[0].startedAt)),
    lastCheckin: checkins[0].createdAt.slice(0, 10),
    nextWeekStatus: 'SCHEDULED',
    pendingReplies: 1,
    weightChange: recent !== null && before !== null ? round(recent - before, 1) : null,
    signals: [],
  };
};

// ── Powerlifting ───────────────────────────────────────────────────────────

const lastMeet = at(shiftWeek(current, -22), 5);
const strongWeek = shiftWeek(blockStart, 2);
const power: SavedPowerProfile = {
  linkId: LINK,
  version: 3,
  updatedAt: `${blockStart}T10:00:00Z`,
  profile: {
    enabled: true,
    equipment: 'CLASSIC',
    federation: 'AEP',
    trainingMax: { squat: 110, bench: 65, deadlift: 140 },
    exerciseMappings: [],
    notes:
      'Objetivo: 310 kg de total en el autonómico, categoría -63 kg. ' +
      'Prioridades: profundidad en la sentadilla y pausa en la banca.',
    marks: [
      {
        id: 'm1',
        lift: 'SQUAT',
        kg: 100,
        date: lastMeet,
        context: 'COMPETITION',
        reference: 'Open de primavera',
      },
      {
        id: 'm2',
        lift: 'BENCH',
        kg: 57.5,
        date: lastMeet,
        context: 'COMPETITION',
        reference: 'Open de primavera',
      },
      {
        id: 'm3',
        lift: 'DEADLIFT',
        kg: 127.5,
        date: lastMeet,
        context: 'COMPETITION',
        reference: 'Open de primavera',
      },
      {
        id: 'm4',
        lift: 'SQUAT',
        kg: 105,
        date: at(strongWeek, 0),
        context: 'TRAINING',
        reference: 'Single a RPE 8,5',
      },
      {
        id: 'm5',
        lift: 'BENCH',
        kg: 60,
        date: at(strongWeek, 4),
        context: 'TRAINING',
        reference: 'Single a RPE 8,5',
      },
      {
        id: 'm6',
        lift: 'DEADLIFT',
        kg: 135,
        date: at(strongWeek, 2),
        context: 'TRAINING',
        reference: 'Single a RPE 9',
      },
    ],
  },
};
type Attempt = PowerMeet['content']['attempts'][number];
const attempts = (rows: [Attempt['lift'], number, number | null, Attempt['result']][]): Attempt[] =>
  rows.map(([lift, plannedKg, actualKg, result], i) => ({
    lift,
    number: (i % 3) + 1,
    plannedKg,
    actualKg,
    result,
    recordAttempt: false,
  }));
const meets: PowerMeet[] = [
  {
    id: 'lucia-meet-autonomico',
    linkId: LINK,
    version: 2,
    updatedAt: `${current}T09:00:00Z`,
    content: {
      name: 'Campeonato autonómico',
      date: meetDate,
      equipment: 'CLASSIC',
      federation: 'AEP',
      category: '-63 kg',
      rules: 'IPF_2026',
      targetTotal: 310,
      notes: 'Pesaje dos horas antes. Las terceras se deciden con las segundas.',
      archived: false,
      blocks: [
        {
          id: 'lucia-meet-b1',
          name: 'Fuerza',
          start: blockStart,
          end: at(shiftWeek(blockStart, 5), 6),
          goal: 'Subir los tres básicos con RPE controlado.',
        },
        {
          id: 'lucia-meet-b2',
          name: 'Puesta a punto',
          start: shiftWeek(blockStart, 6),
          end: meetDate,
          goal: 'Dobles pesados, aperturas y llegar fresca.',
        },
      ],
      attempts: attempts([
        ['SQUAT', 97.5, null, 'PENDING'],
        ['SQUAT', 102.5, null, 'PENDING'],
        ['SQUAT', 107.5, null, 'PENDING'],
        ['BENCH', 57.5, null, 'PENDING'],
        ['BENCH', 60, null, 'PENDING'],
        ['BENCH', 62.5, null, 'PENDING'],
        ['DEADLIFT', 127.5, null, 'PENDING'],
        ['DEADLIFT', 135, null, 'PENDING'],
        ['DEADLIFT', 140, null, 'PENDING'],
      ]),
    },
  },
  {
    id: 'lucia-meet-primavera',
    linkId: LINK,
    version: 4,
    updatedAt: `${lastMeet}T20:00:00Z`,
    content: {
      name: 'Open de primavera',
      date: lastMeet,
      equipment: 'CLASSIC',
      federation: 'AEP',
      category: '-63 kg',
      rules: 'IPF_2026',
      targetTotal: 285,
      notes: 'Primera competición. Tercera de banca nula por no esperar la orden de press.',
      archived: true,
      blocks: [],
      attempts: attempts([
        ['SQUAT', 92.5, 92.5, 'VALID'],
        ['SQUAT', 97.5, 97.5, 'VALID'],
        ['SQUAT', 100, 100, 'VALID'],
        ['BENCH', 52.5, 52.5, 'VALID'],
        ['BENCH', 57.5, 57.5, 'VALID'],
        ['BENCH', 60, 60, 'INVALID'],
        ['DEADLIFT', 115, 115, 'VALID'],
        ['DEADLIFT', 122.5, 122.5, 'VALID'],
        ['DEADLIFT', 127.5, 127.5, 'VALID'],
      ]),
    },
  },
];

// ── Rutas ──────────────────────────────────────────────────────────────────

const emptyWeek = (weekStart: string): SavedWeek => ({
  linkId: LINK,
  weekStart,
  version: 0,
  assignmentId: null,
  publishedVersion: null,
  updatedAt: null,
  content: {
    program: {
      id: null,
      name: 'Semana sin preparar',
      notes: null,
      weeks: 1,
      days: [],
      status: 'DRAFT',
    },
    privateNotes: '',
    intent: 'BUILD',
    decision: '',
  },
});

function workoutPage(query: URLSearchParams) {
  const page = Number(query.get('page') ?? 0);
  const size = Number(query.get('size') ?? 10);
  const origin = query.get('origin') ?? 'ALL';
  const search = (query.get('search') ?? '').trim().toLowerCase();
  const list = workouts.filter(
    (workout) =>
      (origin === 'ALL' || (origin === 'FREE') === !workout.programDayId) &&
      workout.name.toLowerCase().includes(search),
  );
  return {
    content: list.slice(page * size, (page + 1) * size),
    number: page,
    size,
    totalPages: Math.ceil(list.length / size),
    totalElements: list.length,
  };
}

/** Lo que Lucía tiene de propio; el resto lo sigue contestando el recorrido guiado. */
export function luciaResponse(path: string, query: URLSearchParams, tour: () => unknown): unknown {
  if (path === '/coach/clients')
    return (tour() as CoachClient[]).map((client) =>
      client.linkId === LINK ? { ...client, since } : client,
    );
  if (path === '/coach/clients/status')
    return (tour() as ClientStatus[]).map((item) => (item.linkId === LINK ? status() : item));
  if (path === BASE) return { ...(tour() as CoachClient), since };
  if (!path.startsWith(`${BASE}/`)) return tour();
  const [a, b, c] = path.slice(BASE.length + 1).split('/');

  switch (a) {
    case 'status':
      return status();
    case 'checkins':
      if (!b) return checkins;
      break;
    case 'block': {
      const from = query.get('from') ?? blockStart;
      const to = shiftWeek(from, Number(query.get('weeks') ?? 8));
      return {
        block: { name: 'Bloque de fuerza · hacia el autonómico', startWeek: blockStart, weeks: 8 },
        weeks: savedWeeks.filter((week) => week.weekStart >= from && week.weekStart < to),
      };
    }
    case 'weeks':
      return savedWeeks.find((week) => week.weekStart === b) ?? emptyWeek(b);
    case 'programs':
      if (!b) return [];
      break;
    case 'workouts':
      if (!b) return workoutPage(query);
      if (b === 'custom-exercises') return [];
      if (b === 'stats') return workoutStats();
      if (b === 'recent')
        return workouts.filter((workout) => workout.startedAt >= Number(query.get('since') ?? 0));
      if (c === 'comment') return comments.has(b) ? { text: comments.get(b) } : '';
      if (c === 'prescription') return '';
      if (!c) return workouts.find((workout) => workout.id === b) ?? tour();
      break;
    case 'weights':
      if (b === 'weekly') return weightWeeks;
      if (b === 'dashboard') return weightDashboard(weights, 64.6, 63);
      if (!b) return weightList(weights);
      break;
    case 'steps':
      if (b === 'weekly') return weekly(steps, 0);
      break;
    case 'nutrition':
      if (b === 'logs') return logs.filter((log) => log.date === query.get('date'));
      if (b === 'calories') {
        const totals = new Map<string, number>();
        for (const log of logs) totals.set(log.date, (totals.get(log.date) ?? 0) + log.kcal);
        return weekly(totals, 0);
      }
      break;
    case 'targets':
      return {
        kcal: PLANS.active.training.kcal,
        customProteinGrams: PLANS.active.training.protein,
        customFatGrams: PLANS.active.training.fat,
        customCarbsGrams: PLANS.active.training.carbs,
      };
    case 'nutrition-plan':
      if (!b) return activePlan;
      if (b === 'adherence') return adherence(Math.min(12, Number(query.get('weeks') ?? 4)));
      if (b === 'history' && !c) return history;
      if (b === 'history') return c === oldPlan.id ? oldPlan : activePlan;
      break;
    case 'powerlifting':
      if (!b) return power;
      if (b === 'meets') return meets;
      break;
    case 'day-comments': {
      const from = query.get('from') ?? '';
      const to = query.get('to') ?? '9999';
      return dayComments.filter((item) => item.date >= from && item.date <= to);
    }
  }
  return tour();
}
