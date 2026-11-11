// Capturas móviles del README con la interfaz React real y datos ficticios.
// La API se simula: no hace falta backend, cuenta de Google ni Gemini.
// Uso: con `npm run dev -- --host localhost --port 5173` en frontend/, desde la raíz:
//      node docs/screenshots/capture.mjs
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../frontend/package.json', import.meta.url));
const { chromium, expect } = require('@playwright/test');
const ts = require('typescript');
const origin = process.argv[2] ?? 'http://localhost:5173';
const output = fileURLToPath(new URL('./', import.meta.url));

// Reutiliza las fixtures de navegador del repositorio para la sesión y los ajustes.
const asModule = (source) =>
  'data:text/javascript;base64,' +
  Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText).toString('base64');
const fixtures = asModule(await readFile(new URL('../../frontend/tests/helpers/fixtures.ts', import.meta.url), 'utf8'));
const auth = await readFile(new URL('../../frontend/tests/helpers/auth.ts', import.meta.url), 'utf8');
const { setupAuthMocks } = await import(asModule(auth.replace("'./fixtures'", JSON.stringify(fixtures))));

// ---------- Datos de demo ----------
const DAY = 86_400_000;
const today = new Date();
today.setHours(0, 0, 0, 0);
const iso = (d) => d.toLocaleDateString('en-CA');
const daysAgo = (n) => new Date(today.getTime() - n * DAY);
const monday = (d) => new Date(d.getTime() - ((d.getDay() + 6) % 7) * DAY);

// Peso: de 85,0 a 81,2 kg en 8 semanas, con el ruido normal de una báscula.
const noise = [0.3, -0.2, 0.1, 0.4, -0.1, 0.2, -0.3];
const weightOn = (n) => +(81.2 + n * 0.068 + noise[n % 7] * 0.6).toFixed(1);
const weights = Array.from({ length: 56 }, (_, i) => ({ id: 100 + i, date: iso(daysAgo(55 - i)), weight: weightOn(55 - i) }));

const weekly = (valueOn, weeks = 8) => {
  const start = monday(today);
  return Array.from({ length: weeks }, (_, w) => {
    const ws = new Date(start.getTime() - w * 7 * DAY);
    const days = Array.from({ length: 7 }, (_, d) => {
      const date = new Date(ws.getTime() + d * DAY);
      return date > today ? null : valueOn(Math.round((today - date) / DAY));
    });
    const vals = days.filter((v) => v != null);
    const average = vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
    return { weekStart: iso(ws), average, entries: vals.length, days };
  }).map((w, i, all) => ({ ...w, delta: all[i + 1]?.average != null ? +(w.average - all[i + 1].average).toFixed(1) : 0 }));
};
const stepsOn = (n) => [9840, 11230, 7650, 12410, 8920, 10350, 6480][n % 7];
const kcalOn = (n) => [2010, 1945, 2120, 1890, 2060, 1980, 2230][n % 7];

const meals = [
  { mealIndex: 0, product: 'Avena con yogur griego y arándanos', quantity: 320, kcal: 486, protein: 32, carbs: 62, fat: 11 },
  { mealIndex: 0, product: 'Café con leche', quantity: 250, kcal: 92, protein: 6, carbs: 9, fat: 3 },
  { mealIndex: 1, product: 'Pechuga de pollo a la plancha', quantity: 200, kcal: 330, protein: 62, carbs: 0, fat: 7 },
  { mealIndex: 1, product: 'Arroz basmati', quantity: 180, kcal: 234, protein: 5, carbs: 51, fat: 1 },
  { mealIndex: 1, product: 'Ensalada con aceite de oliva', quantity: 150, kcal: 138, protein: 2, carbs: 6, fat: 12 },
  { mealIndex: 2, product: 'Salmón al horno', quantity: 160, kcal: 333, protein: 34, carbs: 0, fat: 21 },
  { mealIndex: 2, product: 'Patata asada', quantity: 200, kcal: 172, protein: 4, carbs: 38, fat: 0 },
].map((m, i) => ({ id: 900 + i, date: iso(today), portionsJson: null, ...m }));

// Entrenamientos: rutina torso/pierna 4 días por semana durante 6 semanas.
const ROUTINES = {
  'Torso A': [
    ['base-pecho-press-de-pecho-plano-barra', 80, 8],
    ['base-espalda_alta-remo-con-barra-barra', 70, 10],
    ['base-hombros-press-militar-barra', 50, 8],
    ['base-dorsales-dominadas-peso-corporal', 0, 10],
  ],
  'Pierna A': [
    ['base-cuadriceps-sentadilla-libre-barra', 100, 6],
    ['base-femorales-peso-muerto-rumano-barra', 90, 10],
    ['base-cuadriceps-sentadilla-hack-maquina', 120, 12],
  ],
  'Torso B': [
    ['base-pecho-press-inclinado-mancuernas', 30, 10],
    ['base-dorsales-dominadas-peso-corporal', 0, 8],
    ['base-biceps-curl-de-biceps-barra', 35, 12],
  ],
  'Pierna B': [
    ['base-lumbares-peso-muerto-tradicional-barra', 140, 5],
    ['base-cuadriceps-sentadilla-frontal-barra', 80, 8],
    ['base-femorales-peso-muerto-rumano-mancuernas', 32, 12],
  ],
};
const order = ['Torso A', 'Pierna A', 'Torso B', 'Pierna B'];
const trainingDays = [1, 3, 5, 6]; // días atrás dentro de cada semana
let seq = 0;
const recent = [];
for (let week = 0; week < 6; week++) {
  trainingDays.forEach((offset, i) => {
    const name = order[i];
    const startedAt = daysAgo(week * 7 + offset).getTime() + 18.5 * 3_600_000;
    recent.push({
      id: `demo-${++seq}`,
      name,
      startedAt,
      finishedAt: startedAt + 68 * 60_000,
      notes: '',
      exercises: ROUTINES[name].map(([exerciseId, kg, reps], e) => ({
        id: `demo-${seq}-${e}`,
        exerciseId,
        notes: '',
        sets: Array.from({ length: 3 }, (_, s) => ({
          id: `demo-${seq}-${e}-${s}`,
          type: 'normal',
          weight: kg ? String(Math.max(kg - week * 2.5, 20)) : '',
          reps: String(reps - (s === 2 ? 1 : 0)),
          completed: true,
        })),
      })),
    });
  });
}
const templates = order.map((name, i) => ({
  id: `tpl-${i}`,
  name,
  exercises: ROUTINES[name].map(([exerciseId]) => ({ exerciseId })),
}));

const dashboard = {
  avgWeight: 82.6,
  currentWeight: weightOn(0),
  currentWeeklyAverage: 81.4,
  totalEntries: weights.length,
  totalLost: -3.8,
  remaining: 3.2,
  progress: 54.3,
  estimatedDate: iso(new Date(today.getTime() + 56 * DAY)),
  avgWeeklyChange: -0.48,
  weeksActive: 8,
  bestWeekDelta: -0.9,
  bestWeekDate: iso(daysAgo(35)),
  streak: 12,
  streakDays: [],
};

async function mockDemoApi(page) {
  const json = (data) => (route) => route.fulfill({ json: data });
  await setupAuthMocks(page);
  await page.route('**/api/passkeys', json([{ id: 'demo-passkey', name: 'Este dispositivo', createdAt: '2026-11-01T12:00:00Z' }]));
  await page.route('**/api/coach/profile', json({ coach: false }));
  // Las rutas registradas después tienen prioridad sobre las fixtures base.
  await page.route('**/exercises.json**', (route) => route.continue());
  await page.route('**/exercises-base.json**', (route) => route.continue());
  await page.route('**/api/weights/dashboard**', json(dashboard));
  await page.route('**/api/weights/weekly**', json(weekly(weightOn)));
  await page.route(/\/api\/weights(\?.*)?$/, json(weights));
  await page.route('**/api/steps/weekly**', json(weekly(stepsOn)));
  await page.route('**/api/nutrition/calories/weekly**', json(weekly(kcalOn)));
  await page.route('**/api/nutrition/macros**', json({ kcal: 2000, protein: 160, carbs: 200, fat: 65 }));
  await page.route('**/api/nutrition/logs**', json(meals));
  await page.route('**/api/workouts/recent**', json(recent));
  await page.route('**/api/workouts/templates**', json(templates));
  await page.route('**/api/coaching/today**', json(null));
  await page.route('**/api/coaching/coaches', json([]));
  await page.route('**/api/progress-photos**', json([]));
}

async function mockCoachApi(page) {
  const json = (data) => (route) => route.fulfill({ json: data });
  const clients = ['Ana García', 'Bruno Martín', 'Carla López'].map((name, i) => ({
    linkId: `showcase-${i}`,
    client: { name, email: `alumno${i}@example.invalid`, picture: null },
    permissions: { training: true, nutrition: true, body: true, editTraining: true, editNutrition: true },
    since: '2026-11-01T10:00:00Z',
  }));
  await page.route('**/api/coach/profile', json({ coach: true }));
  await page.route('**/api/coach/invitations', json([]));
  await page.route('**/api/coach/clients', json(clients));
  await page.route('**/api/coach/clients/status', json(clients.map((client, i) => ({
    linkId: client.linkId,
    level: i === 1 ? 'RED' : 'GREEN',
    lastActivity: iso(daysAgo(i + 1)),
    pendingReplies: i === 0 ? 1 : 0,
    weightChange: i === 0 ? -0.4 : null,
    signals: i === 1 ? [{ reason: 'CHECKIN_MISSING', level: 'RED', value: 2 }] : [],
  }))));
  await page.route('**/api/coach/clients/showcase-0/checkins', json([{
    id: 'showcase-checkin',
    linkId: 'showcase-0',
    weekStart: iso(monday(today)),
    weightAvg: 80.2,
    energy: 4,
    sleep: 3,
    trainingAdherence: 4,
    dietAdherence: 4,
    answers: [{ question: '¿Cómo te has encontrado esta semana?', answer: 'Con más energía. He completado las cuatro sesiones y mejorado el press de banca.' }],
    notes: null,
    coachReply: null,
    repliedAt: null,
    createdAt: `${iso(daysAgo(1))}T10:00:00Z`,
    updatedAt: `${iso(daysAgo(1))}T10:00:00Z`,
  }]));
}

// ---------- Captura ----------
const browser = await chromium.launch();
// Miniaturas de ejercicios: dataset público enlazado desde exercises-base.json.
const allowedOrigins = [origin, 'https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://raw.githubusercontent.com'];
// Hora fija de media tarde para que la fecha y el cronómetro del entreno sean verosímiles.
const at = (h, m) => new Date(today.getTime() + (h * 60 + m) * 60_000);
const contextOptions = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: 'es-ES',
  colorScheme: 'dark', // la app sigue el tema del sistema por defecto
  reducedMotion: 'reduce',
  serviceWorkers: 'block',
};
try {
  const failures = [];
  const open = async (withSession) => {
    const context = await browser.newContext(contextOptions);
    await context.clock.setFixedTime(at(18, 40));
    const page = await context.newPage();
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.startsWith('/api/')) {
        failures.push(url.pathname);
        return route.fulfill({ status: 501, json: {} });
      }
      if (!allowedOrigins.includes(url.origin)) return route.abort();
      return route.continue();
    });
    if (withSession) await mockDemoApi(page);
    else {
      await page.route('**/api/auth/config**', (route) => route.fulfill({ json: { googleClientId: 'demo' } }));
      await page.route('**/api/auth/refresh**', (route) => route.fulfill({ status: 401, json: {} }));
      await page.route('**/api/public/info**', (route) => route.fulfill({ json: { plans: [], annualMonths: 12, contactEmail: null } }));
    }
    page.on('pageerror', (error) => failures.push(error.message));
    return page;
  };
  const capture = async (page, name) => {
    await page.evaluate(async () => {
      await Promise.all(['400 16px Inter', '400 16px Anton'].map((font) => document.fonts.load(font)));
      await document.fonts.ready;
      for (const family of ['Inter', 'Anton']) {
        if (![...document.fonts].some((font) => font.family.replaceAll('"', '').replaceAll("'", '') === family && font.status === 'loaded')) {
          throw new Error(`No se ha cargado la fuente ${family}`);
        }
      }
      window.scrollTo(0, 0);
    });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${output}/${name}.png`, animations: 'disabled' });
    console.log(`✓ ${name}.png`);
  };

  const guest = await open(false);
  await guest.goto(origin + '/');
  await guest.waitForLoadState('networkidle');
  await capture(guest, 'landing');
  await guest.context().close();

  const page = await open(true);
  await page.goto(origin + '/dashboard');
  await expect(page.locator('.kpi-card').first()).toBeVisible();
  await capture(page, 'dashboard');

  await page.goto(origin + '/tracking');
  await page.waitForLoadState('networkidle');
  await capture(page, 'tracking');

  await page.goto(origin + '/nutrition');
  await page.waitForLoadState('networkidle');
  await capture(page, 'nutrition');

  await page.goto(origin + '/workout');
  await page.waitForLoadState('networkidle');
  await capture(page, 'training');

  await page.getByRole('button', { name: /empezar entrenamiento/i }).click();
  await page.locator('.start-workout-option').filter({ hasText: 'Torso A' }).first().click();
  await expect(page.locator('.exercise-card-header').first()).toBeVisible();
  await page.getByRole('button', { name: 'Completar serie' }).nth(0).click();
  await page.getByRole('button', { name: 'Completar serie' }).nth(0).click();
  await page.context().clock.setFixedTime(at(19, 12));
  await page.waitForTimeout(1500);
  await capture(page, 'workout');

  const coach = await open(true);
  await mockCoachApi(coach);
  await coach.goto(origin + '/entrenador');
  await expect(coach.getByRole('heading', { name: 'Pendiente de ti' })).toBeVisible();
  await capture(coach, 'coach');

  await coach.goto(origin + '/entrenador/alumnos');
  await expect(coach.getByRole('searchbox', { name: 'Buscar alumno' })).toBeVisible();
  await capture(coach, 'coach-clients');

  await coach.goto(origin + '/entrenador/alumnos/showcase-0?seccion=revisiones');
  await expect(coach.getByRole('heading', { name: 'Revisiones semanales' })).toBeVisible();
  await capture(coach, 'coach-review');

  if (failures.length) throw new Error('Llamadas sin simular o errores: ' + [...new Set(failures)].join(', '));
} finally {
  await browser.close();
}
