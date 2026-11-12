import { coachSettings } from './helpers/coachSettings';
import { test, expect, type Page } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

async function setupCoach(page: Page, empty = false) {
  await setupAuthMocks(page);
  await page.route('**/api/passkeys', (route) => route.fulfill({ json: [] }));
  const clients = ['Ana García', 'Bruno Martín', 'Carla López'].map((name, i) => ({
    linkId: `l${i}`,
    client: { name, email: `atleta${i}@example.com`, picture: null },
    permissions: {
      training: true,
      nutrition: true,
      body: true,
      editTraining: true,
      editNutrition: true,
    },
    since: '2026-11-01T10:00:00Z',
    followup: {
      schedule: { day: i + 1, time: '18:00', timeZone: 'Europe/Madrid', paused: false },
      startedAt: '2026-11-01T10:00:00Z',
      nextDueAt: '2026-11-16T17:00:00Z',
    },
    setup: {
      services: { training: true, nutrition: i === 2, progress: false },
      goal: 'Ganar fuerza',
      experience: '',
      trainingDays: 3,
      equipment: '',
      reviewed: true,
    },
  }));
  let reply: string | null = null;
  let questions = ['¿Cómo te has encontrado esta semana?'];
  const checkin = () => ({
    id: 'c1',
    linkId: 'l0',
    weekStart: '2026-11-02',
    weightAvg: 80.2,
    energy: 4,
    sleep: 3,
    trainingAdherence: 4,
    dietAdherence: 4,
    answers: [
      {
        question: '¿Cómo te has encontrado esta semana?',
        answer: 'Con más energía en los entrenamientos.',
      },
    ],
    notes: null,
    coachReply: reply,
    repliedAt: reply ? '2026-11-11T10:00:00Z' : null,
    createdAt: '2026-11-08T10:00:00Z',
    updatedAt: '2026-11-08T10:00:00Z',
  });
  await page.route('**/api/coach/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace('/api/coach/', '');
    if (path === 'profile') return route.fulfill({ json: { coach: true } });
    if (path.endsWith('/powerlifting'))
      return route.fulfill({ json: { profile: { enabled: false } } });
    if (path.includes('/weeks/'))
      return route.fulfill({
        json: {
          linkId: path.split('/')[1],
          weekStart: path.split('/')[3],
          version: 0,
          assignmentId: null,
          publishedVersion: null,
          updatedAt: null,
          content: {
            program: { id: null, name: 'Semana', notes: null, weeks: 1, days: [], status: 'DRAFT' },
            privateNotes: '',
            intent: 'BUILD',
            decision: '',
          },
        },
      });
    if (path === 'settings') return route.fulfill({ json: coachSettings });
    if (path === 'clients') return route.fulfill({ json: empty ? [] : clients });
    const client = clients.find((c) => path === `clients/${c.linkId}`);
    if (client) return route.fulfill({ json: client });
    if (/^clients\/l[0-2]\/status$/.test(path))
      return route.fulfill({
        json: {
          linkId: path.split('/')[1],
          level: 'GREEN',
          lastActivity: '2026-11-09',
          pendingReplies: path.includes('l0') && !reply ? 1 : 0,
          weightChange: null,
          signals: [],
        },
      });
    if (path === 'clients/status')
      return route.fulfill({
        json: empty
          ? []
          : clients.map((c, i) => ({
              linkId: c.linkId,
              level: i === 1 ? 'RED' : 'AMBER',
              lastActivity: '2026-11-09',
              pendingReplies: i === 0 && !reply ? 1 : 0,
              weightChange: null,
              signals:
                i === 1
                  ? [{ reason: 'CHECKIN_MISSING', level: 'RED', value: 2 }]
                  : i === 2
                    ? [{ reason: 'NO_NUTRITION_PLAN', level: 'AMBER', value: 0 }]
                    : [],
            })),
      });
    if (path === 'checkin-template') {
      if (route.request().method() === 'PUT') questions = route.request().postDataJSON().questions;
      return route.fulfill({ json: { questions, custom: true } });
    }
    if (path === 'clients/l0/checkins/c1/reply') {
      reply = route.request().postDataJSON().reply;
      return route.fulfill({ json: checkin() });
    }
    if (path === 'clients/l0/checkins') return route.fulfill({ json: [checkin()] });
    if (/clients\/l\d\/programs$/.test(path))
      return route.fulfill({
        json: [
          {
            id: 'a1',
            programName: 'Fuerza · bloque inicial',
            weeks: 4,
            startDate: '2026-11-02',
            status: 'ACTIVE',
          },
        ],
      });
    return route.fulfill({ json: [] });
  });
}

async function noHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
}

for (const width of [1440, 390]) {
  test(`coach reviews, roster and settings at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await setupCoach(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto('/entrenador');
    await expect(page.getByRole('heading', { name: 'Pendiente de ti' })).toBeVisible();
    await noHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath('dashboard.png'),
      fullPage: true,
      animations: 'disabled',
    });

    await page.getByRole('link', { name: /Check-ins por responder.*1/ }).click();
    await expect(page.getByRole('heading', { name: 'Revisiones', exact: true })).toBeVisible();
    await page.getByRole('link', { name: /Ana García.*por responder/ }).click();
    await expect(page.getByRole('heading', { name: 'Revisiones semanales' })).toBeVisible();
    await page.getByLabel('Tu respuesta').fill('Buen trabajo. Mantenemos el programa esta semana.');
    await page.getByRole('link', { name: 'Volver a revisiones' }).click();
    await page.getByRole('link', { name: /Ana García.*por responder/ }).click();
    await expect(page.getByLabel('Tu respuesta')).toHaveValue(
      'Buen trabajo. Mantenemos el programa esta semana.',
    );
    page.on('dialog', (dialog) => dialog.accept());
    await page.reload();
    await expect(page.getByLabel('Tu respuesta')).toHaveValue(
      'Buen trabajo. Mantenemos el programa esta semana.',
    );
    await page.getByRole('button', { name: 'Responder', exact: true }).click();
    await expect(page.getByText('Respuesta del entrenador', { exact: true })).toBeVisible();
    await noHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath('client-reviews.png'),
      fullPage: true,
      animations: 'disabled',
    });
    await page.getByRole('link', { name: 'Volver a revisiones' }).click();
    await expect(
      page.getByRole('heading', { name: 'No hay check-ins por responder' }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'Ver atletas' }).click();
    await page.getByRole('combobox', { name: 'Servicio', exact: true }).selectOption('nutrition');
    await expect(page.getByText('1 de 3 atletas')).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Preparar pauta nutricional' }).filter({ visible: true }),
    ).toBeVisible();
    await page.getByRole('combobox', { name: 'Servicio', exact: true }).selectOption('training');
    await page.getByRole('searchbox', { name: 'Buscar atleta' }).fill('garcia');
    await page.getByRole('combobox', { name: 'Ordenar' }).selectOption('name');
    await page.getByRole('checkbox', { name: 'Mostrar peso' }).click();
    await expect(page.getByRole('checkbox', { name: 'Mostrar peso' })).toBeChecked();
    await page
      .getByRole('link', { name: /^Ana García/ })
      .filter({ visible: true })
      .click();
    await expect(page.getByLabel('Semana que preparas')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Terminar relación' })).toHaveCount(0);
    await noHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath('client-summary.png'),
      fullPage: true,
      animations: 'disabled',
    });
    await page.getByRole('link', { name: 'Volver a atletas' }).click();
    await expect(page.getByRole('searchbox', { name: 'Buscar atleta' })).toHaveValue('garcia');
    await expect(page.getByRole('combobox', { name: 'Ordenar' })).toHaveValue('name');
    await expect(page.getByRole('combobox', { name: 'Servicio', exact: true })).toHaveValue(
      'training',
    );
    await expect(page.getByRole('checkbox', { name: 'Mostrar peso' })).toBeChecked();
    await noHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath('roster.png'),
      fullPage: true,
      animations: 'disabled',
    });

    if (width < 768) {
      const nav = page.getByRole('navigation', { name: 'Navegación inferior' });
      await expect(nav.getByRole('button')).toHaveCount(4);
      await nav.getByRole('button', { name: 'Más opciones' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Ajustes', exact: true }).click();
    } else {
      await page
        .getByRole('navigation', { name: 'Navegación principal' })
        .getByRole('button', { name: 'Ajustes', exact: true })
        .click();
    }
    await expect(page.getByRole('heading', { name: 'Ajustes del entrenador' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Pregunta 1' }).fill('¿Qué te gustaría revisar?');
    await page.getByRole('button', { name: 'Guardar preguntas' }).click();
    await expect(page.getByText('Preguntas guardadas')).toBeVisible();
    await page.reload();
    await expect(page.getByRole('textbox', { name: 'Pregunta 1' })).toHaveValue(
      '¿Qué te gustaría revisar?',
    );
    await noHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath('settings.png'),
      fullPage: true,
      animations: 'disabled',
    });
    expect(pageErrors).toEqual([]);
  });
}

test('new coach gets an invitation entry point with no invented metrics', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setupCoach(page, true);
  await page.goto('/entrenador');
  await expect(page.getByRole('heading', { name: 'Empieza por una invitación' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Atletas activos/ })).toHaveCount(0);
  await noHorizontalOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath('empty-dashboard.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Invitar atleta' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

for (const width of [1440, 390]) {
  test(`weekly review agenda at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await setupCoach(page);
    await page.goto('/entrenador/revisiones?vista=agenda');
    await expect(page.getByRole('heading', { name: 'Lunes' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Miércoles' })).toBeVisible();
    await page.getByLabel('Buscar revisión por atleta').fill('garcia');
    await expect(page.getByRole('link', { name: /Ana García.*Abrir revisión/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Miércoles' })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: testInfo.outputPath('review-agenda.png'),
      fullPage: true,
      animations: 'disabled',
    });
    await page.getByRole('link', { name: /Ana García.*Abrir revisión/ }).click();
    await expect(page).toHaveURL(/seccion=revisiones/);
    await page.getByRole('link', { name: 'Volver a revisiones' }).click();
    await expect(page.getByRole('button', { name: 'Agenda semanal' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
}

test('old athlete links open the renamed route with the selected section and fragment', async ({
  page,
}) => {
  await setupCoach(page);
  await page.goto('/entrenador/alumnos/l0?seccion=revisiones#seguimiento');
  await expect(page).toHaveURL(/\/entrenador\/atletas\/l0\?seccion=revisiones#seguimiento$/);
  await expect(page.getByRole('heading', { name: 'Revisiones semanales' })).toBeVisible();
});
