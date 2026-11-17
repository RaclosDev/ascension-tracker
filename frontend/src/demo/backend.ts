import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { FoodLog, Meal, Recipe, SavedFood, UserSettings } from '../types/api';
import type { CompletedWorkout, Exercise, Template } from '../lib/workout/types';
import { DEMO_COACH, DEMO_TOKEN } from './mode';

/** Servidor ficticio de la demo: todo vive en memoria y se pierde al recargar. */

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Json = Record<string, unknown>;

const HISTORY_DAYS = 70;
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayAt = (offset: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - offset);
  return d;
};
const daysAgo = (offset: number) => iso(dayAt(offset));
const mondayOf = (d: Date) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
  return copy;
};
const round = (value: number, decimals = 1) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

// Generador con semilla fija: la demo enseña siempre los mismos datos.
let seed = 20261117;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

let sequence = 1000;
const nextId = () => ++sequence;

// ── Ajustes ────────────────────────────────────────────────────────────────

let settings: UserSettings = {
  startWeight: 84,
  goalWeight: 78,
  weeklyGoal: -0.4,
  startDate: daysAgo(HISTORY_DAYS),
  kcal: 2300,
  macroStrategy: 'balanced',
  age: 29,
  heightCm: 178,
  sex: 'M',
  activityFactor: 1.55,
  appModules: 'FULL',
};

let workoutPreferences: Json = {
  defaultRestSeconds: 90,
  showRpe: false,
  hiddenEquipments: [],
  exerciseGifs: {},
  restTimers: {},
};

const MACROS = { kcal: 2300, protein: 165, carbs: 250, fat: 72 };

// ── Peso y pasos ───────────────────────────────────────────────────────────

const weights = new Map<string, number>();
const steps = new Map<string, number>();
for (let offset = HISTORY_DAYS; offset >= 0; offset--) {
  const date = daysAgo(offset);
  const trend = 84 - (HISTORY_DAYS - offset) * 0.05;
  if (offset < 2 || rand() > 0.12) weights.set(date, round(trend + (rand() - 0.5) * 0.7));
  if (offset > 0 && rand() > 0.08) steps.set(date, Math.round(6500 + rand() * 5500));
}

function weekly(values: Map<string, number>, decimals: number) {
  const dates = [...values.keys()].sort();
  if (dates.length === 0) return [];
  const [y, m, d] = dates[0].split('-').map(Number);
  const cursor = mondayOf(new Date(y, m - 1, d, 12));
  const last = mondayOf(dayAt(0));
  const weeks = [];
  let previous: number | null = null;
  while (cursor <= last) {
    const days: (number | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(cursor);
      day.setDate(day.getDate() + i);
      days.push(values.get(iso(day)) ?? null);
    }
    const valid = days.filter((v): v is number => v !== null);
    const average = valid.length
      ? round(valid.reduce((a, b) => a + b, 0) / valid.length, decimals)
      : null;
    weeks.push({
      weekStart: iso(cursor),
      days,
      average,
      delta: average !== null && previous !== null ? round(average - previous, decimals) : null,
      entries: valid.length,
    });
    if (average !== null) previous = average;
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
}

function weightList() {
  return [...weights.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, weight], index) => ({ id: index + 1, date, weight }));
}

function dashboard() {
  const list = weightList();
  const weeks = weekly(weights, 2).filter((week) => week.average !== null);
  const current = list.at(-1)?.weight ?? settings.startWeight;
  const deltas = weeks.filter((week) => week.delta !== null);
  const avgWeeklyChange = deltas.length
    ? round(deltas.reduce((sum, week) => sum + (week.delta ?? 0), 0) / deltas.length, 2)
    : 0;
  const best = deltas.reduce<(typeof deltas)[number] | null>(
    (min, week) => (!min || (week.delta ?? 0) < (min.delta ?? 0) ? week : min),
    null,
  );
  const remaining = round(current - settings.goalWeight, 1);
  const total = settings.startWeight - settings.goalWeight;
  const weeksLeft = avgWeeklyChange < 0 ? Math.ceil(remaining / -avgWeeklyChange) : 12;
  let streak = 0;
  while (weights.has(daysAgo(streak))) streak++;
  return {
    currentWeight: current,
    currentWeeklyAverage: weeks.at(-1)?.average ?? current,
    totalEntries: list.length,
    totalLost: round(current - settings.startWeight, 1),
    remaining,
    progress: total ? round(((settings.startWeight - current) / total) * 100, 1) : 0,
    estimatedDate: iso(dayAt(-weeksLeft * 7)),
    avgWeeklyChange,
    weeksActive: weeks.length,
    bestWeekDelta: best?.delta ?? 0,
    bestWeekDate: best?.weekStart ?? daysAgo(0),
    streak,
    streakDays: [6, 5, 4, 3, 2, 1, 0].map((offset) => ({
      date: daysAgo(offset),
      hasData: weights.has(daysAgo(offset)),
    })),
  };
}

// ── Nutrición ──────────────────────────────────────────────────────────────

const defaultMeals = (): Meal[] =>
  ['Desayuno', 'Comida', 'Merienda', 'Cena'].map((name, index) => ({
    id: index + 1,
    mealKey: `meal-${index + 1}`,
    name,
    icon: '',
    sortOrder: index,
    isDefault: true,
  }));
let meals = defaultMeals();

// nombre, kcal, proteína, hidratos y grasa por 100 g
const FOODS: [string, number, number, number, number][] = [
  ['Copos de avena', 372, 13, 60, 7],
  ['Leche semidesnatada', 46, 3.3, 4.8, 1.6],
  ['Plátano', 89, 1.1, 23, 0.3],
  ['Huevos', 143, 12.6, 0.7, 9.5],
  ['Pan integral', 247, 13, 41, 3.4],
  ['Pechuga de pollo', 110, 23, 0, 1.2],
  ['Arroz basmati cocido', 130, 2.7, 28, 0.3],
  ['Aceite de oliva virgen extra', 884, 0, 0, 100],
  ['Brócoli', 34, 2.8, 7, 0.4],
  ['Yogur griego natural', 97, 9, 4, 5],
  ['Nueces', 654, 15, 14, 65],
  ['Salmón', 208, 20, 0, 13],
  ['Patata cocida', 87, 1.9, 20, 0.1],
  ['Ensalada mixta', 20, 1.3, 3, 0.2],
  ['Lentejas cocidas', 116, 9, 20, 0.4],
  ['Proteína de suero', 380, 78, 6, 5],
  ['Ternera magra', 137, 21, 0, 5.5],
  ['Pasta integral cocida', 124, 5, 25, 1.1],
  ['Manzana', 52, 0.3, 14, 0.2],
  ['Atún al natural', 108, 24, 0, 1],
];

// [comida, alimento, gramos]
const MENUS: [number, number, number][][] = [
  [
    [0, 0, 70],
    [0, 1, 250],
    [0, 2, 120],
    [1, 5, 180],
    [1, 6, 220],
    [1, 8, 150],
    [1, 7, 10],
    [2, 9, 200],
    [2, 10, 25],
    [3, 11, 160],
    [3, 12, 250],
    [3, 13, 150],
  ],
  [
    [0, 3, 120],
    [0, 4, 80],
    [0, 18, 150],
    [1, 14, 300],
    [1, 6, 150],
    [1, 13, 150],
    [1, 7, 10],
    [2, 15, 30],
    [2, 2, 120],
    [3, 16, 170],
    [3, 17, 220],
    [3, 8, 150],
  ],
  [
    [0, 9, 250],
    [0, 0, 50],
    [0, 10, 20],
    [1, 17, 280],
    [1, 19, 120],
    [1, 7, 12],
    [2, 4, 60],
    [2, 3, 110],
    [3, 5, 170],
    [3, 12, 300],
    [3, 13, 150],
  ],
];

const foodLog = (date: string, mealIndex: number, food: number, grams: number): FoodLog => {
  const [product, kcal, protein, carbs, fat] = FOODS[food];
  const ratio = grams / 100;
  return {
    id: nextId(),
    date,
    mealIndex,
    mealKey: `meal-${mealIndex + 1}`,
    mealName: defaultMeals()[mealIndex].name,
    product,
    quantity: grams,
    kcal: Math.round(kcal * ratio),
    protein: round(protein * ratio),
    carbs: round(carbs * ratio),
    fat: round(fat * ratio),
  };
};

let logs: FoodLog[] = [];
for (let offset = HISTORY_DAYS; offset >= 0; offset--) {
  const scale = 1 + rand() * 0.25;
  for (const [mealIndex, food, grams] of MENUS[offset % MENUS.length]) {
    // Hoy solo están el desayuno y la comida: queda sitio para probar a registrar.
    if (offset === 0 && mealIndex > 1) continue;
    logs.push(foodLog(daysAgo(offset), mealIndex, food, Math.round((grams * scale) / 5) * 5));
  }
}

let savedFoods: SavedFood[] = [0, 5, 6, 9, 11, 15, 16, 17].map((index) => {
  const [name, kcalPer100g, proteinPer100g, carbsPer100g, fatPer100g] = FOODS[index];
  return { id: nextId(), name, kcalPer100g, proteinPer100g, carbsPer100g, fatPer100g };
});

let recipes: Recipe[] = [
  {
    id: nextId(),
    name: 'Bol de avena y plátano',
    description: 'Avena, leche, plátano y nueces.',
    totalKcal: 520,
    totalProtein: 21,
    totalCarbs: 76,
    totalFat: 15,
  },
  {
    id: nextId(),
    name: 'Pollo con arroz y brócoli',
    description: 'El táper de toda la vida.',
    totalKcal: 620,
    totalProtein: 51,
    totalCarbs: 72,
    totalFat: 13,
  },
  {
    id: nextId(),
    name: 'Tortilla francesa con tostadas',
    description: 'Tres huevos y dos rebanadas de pan integral.',
    totalKcal: 430,
    totalProtein: 27,
    totalCarbs: 33,
    totalFat: 20,
  },
];

const caloriesByDay = () => {
  const totals = new Map<string, number>();
  for (const log of logs) totals.set(log.date, (totals.get(log.date) ?? 0) + log.kcal);
  return totals;
};

const consumed = (date: string) =>
  logs
    .filter((log) => log.date === date)
    .reduce(
      (sum, log) => ({
        kcal: sum.kcal + log.kcal,
        protein: round(sum.protein + log.protein),
        carbs: round(sum.carbs + log.carbs),
        fat: round(sum.fat + log.fat),
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    );

function recentLogs() {
  const seen = new Set<string>();
  const recent: FoodLog[] = [];
  for (const log of [...logs].reverse()) {
    if (seen.has(log.product)) continue;
    seen.add(log.product);
    recent.push(log);
    if (recent.length === 20) break;
  }
  return recent;
}

// ── Entrenamientos ─────────────────────────────────────────────────────────

// [ejercicio, kg iniciales, repeticiones, series]
const ROUTINES: { name: string; exercises: [string, number, number, number][] }[] = [
  {
    name: 'Empuje',
    exercises: [
      ['base-pecho-press-de-pecho-plano-barra', 70, 8, 4],
      ['base-hombros-press-militar-barra', 42.5, 8, 3],
      ['base-hombros-elevaciones-laterales-mancuernas', 10, 14, 3],
      ['base-triceps-extension-de-triceps-polea', 25, 12, 3],
    ],
  },
  {
    name: 'Tirón',
    exercises: [
      ['base-dorsales-dominadas-peso-corporal', 0, 8, 4],
      ['base-espalda_alta-remo-con-barra-barra', 60, 10, 3],
      ['base-dorsales-jalon-al-pecho-polea', 55, 12, 3],
      ['base-biceps-curl-de-biceps-barra', 27.5, 10, 3],
    ],
  },
  {
    name: 'Pierna',
    exercises: [
      ['base-cuadriceps-sentadilla-libre-barra', 90, 6, 4],
      ['base-femorales-peso-muerto-rumano-barra', 80, 8, 3],
      ['base-cuadriceps-prensa-de-piernas-maquina', 160, 12, 3],
      ['base-femorales-curl-femoral-tumbado-maquina', 40, 12, 3],
    ],
  },
];

let workouts: CompletedWorkout[] = [];
for (let offset = HISTORY_DAYS; offset >= 1; offset--) {
  const day = dayAt(offset);
  const routine = [1, 3, 5].indexOf(day.getDay());
  if (routine < 0) continue;
  const week = Math.floor((HISTORY_DAYS - offset) / 7);
  const startedAt = new Date(day).setHours(18, 30, 0, 0);
  const id = `demo-workout-${offset}`;
  workouts.push({
    id,
    name: ROUTINES[routine].name,
    startedAt,
    finishedAt: startedAt + (55 + Math.round(rand() * 20)) * 60_000,
    notes: '',
    exercises: ROUTINES[routine].exercises.map(([exerciseId, kg, reps, sets], e) => ({
      id: `${id}-e${e}`,
      exerciseId,
      notes: '',
      sets: Array.from({ length: sets }, (_, s) => ({
        id: `${id}-e${e}-s${s}`,
        type: 'normal' as const,
        weight: kg ? String(kg + Math.floor(week / 2) * 2.5) : '',
        reps: String(Math.max(reps - (s > 1 ? 1 : 0) + (week % 2), 1)),
        completed: true,
      })),
    })),
  });
}

let templates: Template[] = ROUTINES.map((routine, index) => ({
  id: `demo-template-${index + 1}`,
  name: routine.name,
  exercises: routine.exercises.map(([exerciseId]) => ({ exerciseId })),
}));

let customExercises: Exercise[] = [
  {
    id: 'demo-custom-landmine',
    name: 'Press landmine',
    muscle: 'hombros',
    equipment: 'barra',
    custom: true,
  },
];

// ── Rutas ──────────────────────────────────────────────────────────────────

const consentAnswer = { granted: true, version: 'demo', at: `${daysAgo(HISTORY_DAYS)}T10:00:00Z` };
const READ_ONLY = 'En la demo esta parte es solo de lectura.';
const AI_OFF = 'La IA no está disponible en la demo.';

function crud<T extends { id?: number | string }>(
  items: T[],
  method: string,
  id: string | undefined,
  body: unknown,
  newId: () => number | string = nextId,
): { items: T[]; result: unknown } {
  if (method === 'get') return { items, result: items };
  if (method === 'post') {
    const created = { ...(body as T), id: (body as T).id ?? newId() };
    return { items: [...items, created], result: created };
  }
  const index = items.findIndex((item) => String(item.id) === id);
  if (index < 0) throw new HttpError(404, 'No encontrado');
  if (method === 'delete') return { items: items.filter((_, i) => i !== index), result: '' };
  const updated = { ...items[index], ...(body as T), id: items[index].id };
  return { items: items.map((item, i) => (i === index ? updated : item)), result: updated };
}

async function route(
  method: string,
  path: string,
  query: URLSearchParams,
  body: unknown,
): Promise<unknown> {
  const data = (body ?? {}) as Json;
  const [, a, b, c] = path.split('/');
  const read = method === 'get';

  if (a === 'auth') {
    if (b === 'refresh') return { token: DEMO_TOKEN };
    if (b === 'logout') return '';
    throw new HttpError(403, 'No disponible en la demo.');
  }
  if (a === 'version') return { version: 'demo' };
  if (a === 'consents')
    return {
      version: 'demo',
      consents: {
        TERMS: consentAnswer,
        PRIVACY: consentAnswer,
        HEALTH_DATA: consentAnswer,
        AI_HEALTH: consentAnswer,
      },
    };
  if (a === 'settings') {
    if (!read) settings = { ...settings, ...(data as Partial<UserSettings>) };
    return settings;
  }
  if (a === 'workout-preferences') {
    if (!read) workoutPreferences = { ...workoutPreferences, ...data };
    return workoutPreferences;
  }
  if (a === 'push') {
    if (b === 'vapid-key') throw new HttpError(404, 'Sin notificaciones en la demo.');
    return '';
  }
  if (a === 'passkeys') {
    if (read) return [];
    throw new HttpError(403, 'No disponible en la demo.');
  }
  if (a === 'progress-photos') {
    if (read) return { enabled: false, photos: [] };
    throw new HttpError(403, 'Las fotos no están disponibles en la demo.');
  }
  if (a === 'admin') {
    if (b === 'me') return { admin: false };
    throw new HttpError(403, 'No disponible en la demo.');
  }
  if (a === 'user') {
    if (b === 'export')
      return new Blob(
        [JSON.stringify({ settings, weights: weightList(), workouts, logs }, null, 2)],
        { type: 'application/json' },
      );
    throw new HttpError(403, 'No disponible en la demo.');
  }
  if (a === 'food-external') throw new HttpError(404, 'Producto no encontrado en la demo.');
  if (a === 'contact-requests') return '';

  if (a === 'weights' || a === 'steps') {
    const values = a === 'weights' ? weights : steps;
    if (b === 'dashboard') return dashboard();
    if (b === 'weekly') return weekly(values, a === 'weights' ? 2 : 0);
    if (read) return weightList();
    if (method === 'delete') {
      values.delete(b);
      return '';
    }
    const date = String(data.date ?? daysAgo(0));
    values.set(date, Number(a === 'weights' ? data.weight : data.steps));
    return { id: nextId(), date, ...data };
  }

  if (a === 'nutrition') {
    if (b === 'calories') return weekly(caloriesByDay(), 0);
    if (b === 'macros') return MACROS;
    if (b === 'ai') {
      if (c === 'assistant-summary') {
        const date = query.get('date') ?? daysAgo(0);
        const eaten = consumed(date);
        return {
          date,
          target: MACROS,
          consumed: eaten,
          remaining: {
            kcal: MACROS.kcal - eaten.kcal,
            protein: round(MACROS.protein - eaten.protein),
            carbs: round(MACROS.carbs - eaten.carbs),
            fat: round(MACROS.fat - eaten.fat),
          },
          meals,
        };
      }
      throw new HttpError(503, AI_OFF);
    }
    if (b === 'meals') {
      if (c === 'reset') meals = defaultMeals();
      else if (method === 'put' && Array.isArray(body))
        meals = (body as Meal[]).map((meal, index) => ({
          ...meal,
          id: meal.id ?? nextId(),
          mealKey: meal.mealKey ?? `meal-${nextId()}`,
          sortOrder: meal.sortOrder ?? index,
        }));
      else if (method === 'post') {
        const id = nextId();
        const meal = { ...(data as unknown as Meal), id, mealKey: `meal-${id}` };
        meals = [...meals, { ...meal, sortOrder: meals.length }];
        return meal;
      } else if (method === 'delete') meals = meals.filter((meal) => String(meal.id) !== c);
      return meals;
    }
    if (b === 'logs') {
      if (read && c === 'recent') return recentLogs();
      if (read) return logs.filter((log) => log.date === query.get('date'));
      if (method === 'post' && Array.isArray(body)) {
        const created = (body as FoodLog[]).map((log) => ({ ...log, id: nextId() }));
        logs = [...logs, ...created];
        return created;
      }
      const next = crud(logs, method, c, body);
      logs = next.items;
      return next.result;
    }
    if (b === 'my-foods') {
      const next = crud(savedFoods, method, c, body);
      savedFoods = next.items;
      return next.result;
    }
    if (b === 'recipes') {
      const next = crud(recipes, method, c, body);
      recipes = next.items;
      return next.result;
    }
  }

  if (a === 'workouts') {
    if (b === 'templates') {
      const next = crud(templates, method, c, body, () => `demo-template-${nextId()}`);
      templates = next.items;
      return next.result;
    }
    if (b === 'custom-exercises') {
      const next = crud(customExercises, method, c, body, () => `demo-custom-${nextId()}`);
      customExercises = next.items;
      return next.result;
    }
    if (b === 'import' || b === 'exercises') throw new HttpError(403, READ_ONLY);
    const sorted = () => [...workouts].sort((x, y) => y.startedAt - x.startedAt);
    if (read && b === 'recent') {
      const since = Number(query.get('since') ?? 0);
      return sorted().filter((workout) => workout.startedAt >= since);
    }
    if (read) {
      const page = Number(query.get('page') ?? 0);
      const size = Number(query.get('size') ?? 10);
      return {
        content: sorted().slice(page * size, (page + 1) * size),
        number: page,
        size,
        totalPages: Math.ceil(workouts.length / size),
        totalElements: workouts.length,
      };
    }
    const next = crud(workouts, method, b, body, () => `demo-workout-${nextId()}`);
    workouts = next.items;
    return next.result;
  }

  if (a === 'coaching') {
    if (read && b === 'nutrition-plan') return '';
    if (read && (b === 'today' || b === 'coaches' || b === 'access-log')) return [];
    throw new HttpError(404, 'No encontrado');
  }

  if (a === 'coach') {
    if (!DEMO_COACH) {
      if (read && b === 'profile') return { coach: false };
      throw new HttpError(403, 'Entra en /demo/entrenador para ver el panel de entrenador.');
    }
    if (!read) throw new HttpError(403, READ_ONLY);
    // La zona de entrenador enseña los atletas de ejemplo del recorrido guiado.
    const { tourResponse } = await import('../components/coach/tour/CoachTourPreview');
    try {
      return tourResponse(path);
    } catch {
      throw new HttpError(404, 'Sin datos en la demo.');
    }
  }

  throw new HttpError(404, `Sin datos en la demo: ${path}`);
}

const parseBody = (raw: unknown): unknown => {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

export async function demoAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const url = new URL(config.url ?? '/', 'https://demo.invalid');
  for (const [key, value] of Object.entries((config.params ?? {}) as Json)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  const method = (config.method ?? 'get').toLowerCase();
  // Un respiro mínimo para que los estados de carga se vean como en la app real.
  await new Promise((resolve) => setTimeout(resolve, 80));
  try {
    const data = await route(method, url.pathname, url.searchParams, parseBody(config.data));
    return {
      data: data instanceof Blob ? data : structuredClone(data),
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config,
    };
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Error en la demo';
    throw new AxiosError(message, 'ERR_BAD_REQUEST', config, null, {
      data: { message, error: message },
      status,
      statusText: message,
      headers: new AxiosHeaders(),
      config,
    });
  }
}
