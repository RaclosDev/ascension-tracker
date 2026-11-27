// Capturas móviles del README con la interfaz React real y datos ficticios.
// La API se simula en el navegador: no hace falta backend, cuenta de Google ni Gemini.
// Uso: con `npm run dev -- --host localhost --port 5173` en frontend/, desde la raíz:
//      node docs/screenshots/capture.mjs [origen] [captura ...]
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const require = createRequire(new URL('../../frontend/package.json', import.meta.url));
const { chromium, expect } = require('@playwright/test');
const [origin = 'http://localhost:5173', ...only] = process.argv.slice(2);
const output = fileURLToPath(new URL('./', import.meta.url));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');

// ---------- Personas ----------
// Retratos de stock de randomuser.me guardados en avatars/: la captura no depende de la red.
const portrait = (id) => `https://randomuser.me/api/portraits/${id.replace('-', '/')}.jpg`;
const person = (name, email, id) => ({ name, email, picture: portrait(id) });
const ATHLETE = person('Javier Ortega', 'javier@example.test', 'men-32');
const COACH = person('Laura Díaz', 'laura@example.test', 'women-75');
const session = ({ name, email, picture }) =>
  b64({ alg: 'none' }) + '.' + b64({ sub: email, email, name, picture, exp: 4102444800 }) + '.fixture';

// ---------- Fechas ----------
const DAY = 86_400_000;
// «Hoy» es el jueves de la semana en curso: la semana enseña varios días con registros.
const today = new Date();
today.setHours(0, 0, 0, 0);
today.setDate(today.getDate() - ((today.getDay() + 6) % 7) + 3);
const iso = (d) => d.toLocaleDateString('en-CA');
const daysAgo = (n) => iso(new Date(today.getTime() - n * DAY));
const monday = iso(new Date(today.getTime() - 3 * DAY));
const shiftWeek = (week, n) => iso(new Date(new Date(`${week}T12:00`).getTime() + n * 7 * DAY));
const at = (h, m) => new Date(today.getTime() + (h * 60 + m) * 60_000);

// ---------- Atletas del entrenador ----------
// Lucía Vega trae el bloque completo de la demo (src/demo/lucia.ts); el resto solo aparece en las listas.
const setup = (goal, experience, trainingDays, equipment, nutrition = true) => ({
  services: { training: true, nutrition, progress: true },
  goal,
  experience,
  trainingDays,
  equipment,
  reviewed: true,
});
const permissions = (nutrition = true) => ({ training: true, editTraining: true, nutrition, editNutrition: nutrition, body: true });
const ROSTER = [
  ['tour-lucia', person('Lucía Vega', 'lucia@example.test', 'women-46'), 6, setup('Preparar powerlifting', 'Intermedia', 3, 'Gimnasio completo')],
  ['tour-mateo', person('Mateo Gil', 'mateo@example.test', 'men-22'), 10, setup('Ganar masa muscular', 'Principiante', 4, 'Gimnasio completo')],
  ['ana', person('Ana García', 'ana@example.test', 'women-32'), 14, setup('Perder grasa', 'Intermedia', 3, 'Gimnasio completo')],
  ['bruno', person('Bruno Martín', 'bruno@example.test', 'men-75'), 4, setup('Primera media maratón', 'Avanzado', 3, 'Mancuernas', false)],
  ['carla', person('Carla López', 'carla@example.test', 'women-52'), 21, setup('Fuerza general', 'Principiante', 2, 'Casa con bandas')],
  ['diego', person('Diego Romero', 'diego@example.test', 'men-14'), 3, setup('Recomposición corporal', 'Intermedia', 4, 'Gimnasio completo')],
];
const clients = ROSTER.map(([linkId, client, weeks, clientSetup]) => ({
  linkId,
  client,
  since: shiftWeek(monday, -weeks),
  permissions: permissions(clientSetup.services.nutrition),
  setup: clientSetup,
}));
const STATUS = {
  'tour-mateo': { level: 'GREEN', lastActivity: daysAgo(0), lastWorkout: daysAgo(1), lastCheckin: daysAgo(4), nextWeekStatus: 'SCHEDULED', pendingReplies: 0, weightChange: 0.6, signals: [] },
  ana: { level: 'AMBER', lastActivity: daysAgo(1), lastWorkout: daysAgo(2), lastCheckin: daysAgo(4), nextWeekStatus: 'DRAFT', pendingReplies: 1, weightChange: -1.1, signals: [{ reason: 'FEW_FOOD_LOGS', level: 'AMBER', value: 4 }] },
  bruno: { level: 'GREEN', lastActivity: daysAgo(0), lastWorkout: daysAgo(0), lastCheckin: daysAgo(4), nextWeekStatus: 'SCHEDULED', pendingReplies: 0, weightChange: -0.3, signals: [] },
  carla: { level: 'RED', lastActivity: daysAgo(5), lastWorkout: daysAgo(6), lastCheckin: daysAgo(11), nextWeekStatus: 'MISSING', pendingReplies: 0, weightChange: null, signals: [{ reason: 'INACTIVE', level: 'RED', value: 5 }, { reason: 'CHECKIN_MISSING', level: 'AMBER', value: 1 }] },
  diego: { level: 'GREEN', lastActivity: daysAgo(0), lastWorkout: daysAgo(1), lastCheckin: daysAgo(4), nextWeekStatus: 'SCHEDULED', pendingReplies: 1, weightChange: -0.8, signals: [] },
};

// ---------- API simulada ----------
// Lo que no es propio de esta captura lo contesta el mismo servidor ficticio que usa /demo.
const demoAnswer = (page, coach, method, url, body) =>
  page.evaluate(
    async ({ coach, method, url, body }) => {
      const target = new URL(url);
      const path = target.pathname.replace(/^\/api/, '');
      try {
        if (coach && /^\/coach(\/|$)/.test(path)) {
          const [{ luciaResponse }, { tourResponse }] = await Promise.all([
            import('/src/demo/lucia.ts'),
            import('/src/components/coach/tour/CoachTourPreview.ts'),
          ]);
          return { status: 200, data: luciaResponse(path, target.searchParams, () => tourResponse(path)) ?? null };
        }
        const { demoAdapter } = await import('/src/demo/backend.ts');
        const response = await demoAdapter({ url: path + target.search, method, data: body ?? undefined });
        return { status: 200, data: response.data instanceof Blob ? null : response.data };
      } catch (error) {
        return { status: error?.response?.status ?? 404, data: { message: String(error?.message ?? error) } };
      }
    },
    { coach, method, url, body },
  );

async function mockApi(page, { coach }, failures) {
  const user = coach ? COACH : ATHLETE;
  // Guía del entrenador y propuesta de llave de acceso ya vistas, como en una cuenta en uso.
  await page.addInitScript((email) => {
    localStorage.setItem(`ascension:coach-tour:v2:${encodeURIComponent(email)}`, JSON.stringify({ status: 'dismissed', step: 0 }));
    localStorage.setItem(`ascension_passkey_prompt:${email}`, '1');
  }, user.email);
  await page.route((url) => url.origin === origin && url.pathname.startsWith('/api/'), async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/api/, '');
    const method = request.method().toLowerCase();
    const json = (data, status = 200) => route.fulfill({ status, json: data });
    if (path === '/auth/refresh') return json({ token: session(user) });
    if (path === '/auth/config') return json({ googleClientId: 'showcase' });
    if (path === '/push/vapid-key') return json({}, 404);
    if (path === '/passkeys') return json([{ id: 'passkey', name: 'Este teléfono', createdAt: `${daysAgo(40)}T12:00:00Z` }]);
    if (path === '/coach/profile') return json({ coach });
    if (path === '/account/email') return json({ verified: true, notice: null });
    if (coach) {
      if (path === '/coach/clients') return json(clients);
      if (path === '/coach/clients/status') {
        const lucia = await demoAnswer(page, true, 'get', `${url.origin}/api/coach/clients/tour-lucia/status`);
        return json(clients.map(({ linkId }) => (linkId === 'tour-lucia' ? lucia.data : { linkId, ...STATUS[linkId] })));
      }
      const client = clients.find(({ linkId }) => path === `/coach/clients/${linkId}`);
      if (client) return json(client);
      if (path === '/coach/home') {
        const meets = await demoAnswer(page, true, 'get', `${url.origin}/api/coach/clients/tour-lucia/powerlifting/meets`);
        return json({
          lifts: [
            { linkId: 'tour-lucia', exerciseId: 'base-cuadriceps-sentadilla-libre-barra', customName: null, workoutId: 'lucia-squat', date: daysAgo(3), weight: 102.5, reps: 3, e1rm: 112, trend: 2.5 },
            { linkId: 'diego', exerciseId: 'base-pecho-press-de-pecho-plano-barra', customName: null, workoutId: 'diego-bench', date: daysAgo(1), weight: 85, reps: 5, e1rm: 99, trend: 2 },
            { linkId: 'tour-mateo', exerciseId: 'base-lumbares-peso-muerto-tradicional-barra', customName: null, workoutId: 'mateo-deadlift', date: daysAgo(1), weight: 140, reps: 5, e1rm: 163, trend: 5 },
            { linkId: 'ana', exerciseId: 'base-cuadriceps-sentadilla-libre-barra', customName: null, workoutId: 'ana-squat', date: daysAgo(2), weight: 60, reps: 8, e1rm: 76, trend: 0 },
          ],
          meets: (meets.data ?? [])
            .filter((meet) => meet.content.date >= daysAgo(0))
            .map((meet) => ({ linkId: 'tour-lucia', id: meet.id, name: meet.content.name, date: meet.content.date })),
        });
      }
      if (path === '/coach/settings') {
        const answer = await demoAnswer(page, true, 'get', request.url());
        return json({ ...answer.data, displayName: 'Laura Díaz · Entrenadora', showAccountPhoto: true });
      }
    }
    const body = request.postData() ? request.postDataJSON() : undefined;
    const answer = await demoAnswer(page, coach, method, request.url(), body);
    if (answer.status >= 400) failures.push(`${method.toUpperCase()} ${path}: ${answer.data.message}`);
    return json(answer.data, answer.status);
  });
  // Ajustes al conjunto de datos de la demo: el atleta hace los tres básicos (la tarjeta de powerlifting
  // los muestra) con cargas coherentes entre sí.
  await page.route((url) => url.origin === origin && url.pathname === '/src/demo/backend.ts', async (route) => {
    const response = await route.fetch();
    // Vite sirve el módulo ya transformado: se sustituye la tupla [ejercicio, kg, reps, series] sin depender del formato.
    const routine = (id) => new RegExp(String.raw`\[\s*["']${id}["'],\s*[\d.]+,\s*\d+,\s*\d+\s*\]`);
    const source = (await response.text())
      .replace(routine('base-pecho-press-de-pecho-plano-barra'), '["base-pecho-press-de-pecho-plano-barra", 65, 8, 4]')
      .replace(routine('base-cuadriceps-sentadilla-libre-barra'), '["base-cuadriceps-sentadilla-libre-barra", 97.5, 6, 4]')
      .replace(routine('base-femorales-peso-muerto-rumano-barra'), '["base-lumbares-peso-muerto-tradicional-barra", 122.5, 5, 3]');
    // Hoy también lleva pasos: la demo los deja vacíos para que los apunte quien la prueba.
    const withSteps = source.replace(/steps\.set\(date, Math\.round\(6500 \+ rand\(\) \* 5500\)\);/, (call) => `${call} if (offset === 0) steps.set(date, 6342);`);
    if (withSteps === source) throw new Error('No se han podido completar los pasos de hoy');
    if (!withSteps.includes('peso-muerto-tradicional')) throw new Error('No se ha podido ajustar la rutina de la demo');
    await route.fulfill({ response, body: withSteps });
  });
  // Las fotos de perfil se sirven desde el repositorio.
  await page.route('https://randomuser.me/api/portraits/**', async (route) => {
    const [, gender, file] = new URL(route.request().url()).pathname.match(/portraits\/(\w+)\/(\d+\.jpg)$/);
    route.fulfill({ contentType: 'image/jpeg', body: await readFile(new URL(`./avatars/${gender}-${file}`, import.meta.url)) });
  });
}

// ---------- Captura ----------
const browser = await chromium.launch();
// Miniaturas de ejercicios: dataset público enlazado desde exercises-base.json.
const allowedOrigins = [origin, 'https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://raw.githubusercontent.com', 'https://randomuser.me'];
const contextOptions = {
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  locale: 'es-ES',
  timezoneId: 'Europe/Madrid',
  colorScheme: 'dark', // la app sigue el tema del sistema por defecto
  reducedMotion: 'reduce',
  serviceWorkers: 'block',
};
const failures = [];
const wanted = (name) => !only.length || only.includes(name);

const open = async (role, time) => {
  const context = await browser.newContext(contextOptions);
  // Hora fija: el atleta ya ha desayunado y comido; el entrenador revisa a última hora de la tarde.
  await context.clock.setFixedTime(time);
  const page = await context.newPage();
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (!allowedOrigins.includes(url.origin)) return route.abort();
    if (url.origin === origin && url.pathname.startsWith('/api/')) {
      failures.push(`${route.request().method()} ${url.pathname}: sin simular`);
      return route.fulfill({ status: 501, json: {} });
    }
    return route.continue();
  });
  if (role === 'guest') {
    await page.route('**/api/auth/config**', (route) => route.fulfill({ json: { googleClientId: 'showcase' } }));
    await page.route('**/api/auth/refresh**', (route) => route.fulfill({ status: 401, json: {} }));
    await page.route('**/api/public/info**', (route) => route.fulfill({ json: { plans: [], annualMonths: 12, contactEmail: null } }));
  } else {
    await mockApi(page, { coach: role === 'coach' }, failures);
  }
  page.on('pageerror', (error) => failures.push(error.message));
  return page;
};

const settle = async (page) => {
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await Promise.all(['400 16px Inter', '400 16px Anton'].map((font) => document.fonts.load(font)));
    await document.fonts.ready;
    for (const family of ['Inter', 'Anton']) {
      if (![...document.fonts].some((font) => font.family.replace(/["']/g, '') === family && font.status === 'loaded')) {
        throw new Error(`No se ha cargado la fuente ${family}`);
      }
    }
  });
  // Sin esqueletos de carga ni imágenes a medias (fotos de perfil, GIF de los ejercicios).
  await expect(page.locator('[aria-busy="true"], .skeleton, [class*="skeleton"]')).toHaveCount(0, { timeout: 10_000 });
  await expect
    .poll(() => page.evaluate(() => [...document.images].filter((img) => img.getBoundingClientRect().height > 0 && !(img.complete && img.naturalWidth > 0)).map((img) => img.src)), { timeout: 20_000 })
    .toEqual([]);
};

const capture = async (page, name) => {
  await settle(page);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.waitForTimeout(600);
  const shot = await page.screenshot({ animations: 'disabled' });
  // Se captura a 3× y se reduce a 860×1864 (2×) para que los PNG del repositorio no pesen tanto.
  const resize = await browser.newPage({ viewport: { width: 860, height: 1864 }, deviceScaleFactor: 1 });
  await resize.setContent(`<style>body{margin:0}img{display:block;width:860px;height:1864px}</style><img src="data:image/png;base64,${shot.toString('base64')}">`);
  await resize.locator('img').evaluate((img) => img.decode());
  await resize.screenshot({ path: `${output}/${name}.png` });
  await resize.close();
  console.log(`✓ ${name}.png`);
};

try {
  if (wanted('landing')) {
    const guest = await open('guest', at(18, 40));
    await guest.goto(origin + '/');
    await capture(guest, 'landing');
    await guest.context().close();
  }

  const athlete = await open('athlete', at(15, 10));
  for (const [name, path] of [
    ['dashboard', '/dashboard'],
    ['tracking', '/tracking'],
    ['nutrition', '/nutrition'],
    ['training', '/workout'],
  ]) {
    if (!wanted(name)) continue;
    await athlete.goto(origin + path);
    await capture(athlete, name);
  }

  if (wanted('workout')) {
    // Entreno en curso a partir de una plantilla, con las dos primeras series hechas.
    await athlete.context().clock.setFixedTime(at(18, 5));
    await athlete.goto(origin + '/workout');
    await settle(athlete);
    await athlete.getByRole('button', { name: 'Empezar entrenamiento' }).first().click();
    await athlete.getByRole('dialog').locator('.ws-section', { hasText: 'Plantillas' }).getByRole('button', { name: /Empuje/ }).first().click();
    await expect(athlete.locator('.exercise-card-header').first()).toBeVisible();
    await athlete.getByRole('button', { name: 'Completar serie' }).nth(0).click();
    await athlete.getByRole('button', { name: 'Completar serie' }).nth(0).click();
    await athlete.context().clock.setFixedTime(at(18, 23));
    await expect(athlete.locator('.workout-saved')).toBeEmpty({ timeout: 10_000 });
    await athlete.evaluate(() => scrollTo(0, 0));
    await capture(athlete, 'workout');
  }

  const coach = await open('coach', at(18, 40));
  for (const [name, path] of [
    ['coach', '/entrenador'],
    ['coach-clients', '/entrenador/atletas'],
    ['coach-nutrition', '/entrenador/atletas/tour-lucia?seccion=pauta'],
  ]) {
    if (!wanted(name)) continue;
    await coach.goto(origin + path);
    await capture(coach, name);
  }

  if (wanted('coach-review')) {
    // Seguimiento de la semana pasada pendiente de respuesta: valoraciones, respuestas y caja para contestar.
    await coach.goto(origin + '/entrenador/atletas/tour-lucia?seccion=revisiones');
    await settle(coach);
    await expect(coach.locator('.checkin-past-toggle[aria-expanded="true"]')).toHaveCount(1);
    await coach.locator('#checkin-past').evaluate((heading) => { heading.style.scrollMarginTop = '16px'; heading.scrollIntoView({ block: 'start' }); });
    await capture(coach, 'coach-review');
  }
} finally {
  await browser.close();
  if (failures.length) {
    console.error('Llamadas sin simular o errores:\n' + [...new Set(failures)].join('\n'));
    process.exitCode = 1;
  }
}
