import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';
import type { Program } from '../src/lib/coach/coachPrograms';
import type { SavedWeek } from '../src/lib/coach/weeks';

for (const width of [390, 1920]) {
  test(`coach copies, personalizes, recovers and publishes a week at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.clock.setFixedTime(new Date('2026-11-11T12:00:00Z'));
    await setupAuthMocks(page);
    await page.addInitScript((dark) => {
      localStorage.setItem('ascension_color_mode', dark ? 'dark' : 'light');
    }, width === 1920);
    await page.route('**/api/passkeys', (route) => route.fulfill({ json: [] }));
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('dialog', (dialog) => {
      expect(dialog.type()).toBe('beforeunload');
      void dialog.accept();
    });
    const previous: Program = {
      id: 'p1',
      name: 'Fuerza base',
      notes: 'Progresión gradual',
      weeks: 1,
      status: 'READY',
      days: [
        {
          week: 1,
          dayIndex: 1,
          name: 'Torso',
          notes: null,
          exercises: [
            {
              exerciseId: 'bench',
              exerciseName: 'Press banca',
              sets: 3,
              repsMin: 5,
              repsMax: 5,
              targetRpe: 8,
              targetRir: null,
              restSeconds: 120,
              loadHint: null,
              supersetGroup: null,
              notes: null,
              prescription: { load: { mode: 'KG', amount: 50, unit: 'TOTAL' } },
            },
          ],
        },
      ],
    };
    let saved: SavedWeek = {
      linkId: 'l1',
      weekStart: '2026-11-16',
      version: 0,
      assignmentId: null,
      publishedVersion: null,
      updatedAt: null,
      content: {
        program: { ...previous, id: null, days: [], status: 'DRAFT' },
        privateNotes: '',
        decision: '',
        intent: 'BUILD',
      },
    };
    await page.route('**/api/coach/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace('/api/coach/', '');
      if (path === 'profile') return route.fulfill({ json: { coach: true } });
      if (path === 'clients/l1')
        return route.fulfill({
          json: {
            linkId: 'l1',
            client: { name: 'Alumno de prueba', email: 'athlete@example.test' },
            since: '2026-10-01',
            setup: {
              trainingDays: 4,
              goal: 'Recuperar rendimiento y mejorar la técnica durante la descarga.',
              equipment: 'Gimnasio completo y discos fraccionados.',
            },
            permissions: {
              training: true,
              editTraining: true,
              body: false,
              nutrition: false,
              editNutrition: false,
            },
          },
        });
      if (path === 'clients/l1/powerlifting')
        return route.fulfill({ json: { profile: { enabled: false } } });
      if (path === 'clients/l1/programs')
        return route.fulfill({
          json: [
            {
              id: 'a1',
              programId: 'p1',
              sourceProgramId: null,
              programName: previous.name,
              weeks: 1,
              startDate: '2026-11-09',
              status: 'ACTIVE',
              createdAt: '2026-11-09',
              endedAt: null,
            },
            {
              id: 'old',
              programId: 'old-program',
              sourceProgramId: null,
              programName: 'Programa sustituido',
              weeks: 1,
              startDate: '2026-11-09',
              status: 'ENDED',
              createdAt: '2026-11-09',
              endedAt: '2026-11-10T10:00:00Z',
            },
          ],
        });
      if (path === 'clients/l1/checkins')
        return route.fulfill({ json: [{
          id: 'c1', linkId: 'l1', weekStart: '2026-11-09',
          energy: 2, sleep: 2, trainingAdherence: 4, dietAdherence: 4,
          notes: 'He dormido peor por los turnos. Necesito ajustar la próxima semana.',
          answers: [{ question: '¿Cómo te has encontrado?', answer: 'Más cansado en la última sesión.' }],
          coachReply: 'Mantendremos la descarga y revisaremos la recuperación.',
          updates: [],
        }] });
      if (path === 'clients/l1/programs/a1/plan') return route.fulfill({ json: previous });
      if (path === 'clients/l1/weeks/2026-11-16') {
        if (route.request().method() === 'PUT') {
          const request = route.request().postDataJSON();
          expect(request.expectedVersion).toBe(saved.version);
          saved = { ...saved, content: request.content, version: saved.version + 1 };
        }
        return route.fulfill({ json: saved });
      }
      if (path === 'clients/l1/weeks/2026-11-16/publish') {
        expect(route.request().postDataJSON()).toEqual({ expectedVersion: saved.version });
        saved = { ...saved, publishedVersion: saved.version, assignmentId: 'a2' };
        return route.fulfill({ json: saved });
      }
      return route.fulfill({ json: [] });
    });
    await page.goto('/entrenador/alumnos/l1');
    await expect(page.getByText('4 días de entrenamiento por semana')).toBeVisible();
    const goal = page.getByText('Recuperar rendimiento y mejorar la técnica durante la descarga.');
    await expect(goal).toBeHidden();
    await page.getByText('Objetivo y material', { exact: true }).click();
    await expect(goal).toBeVisible();
    await page.getByText('Objetivo y material', { exact: true }).click();
    await expect(page.getByText('He dormido peor por los turnos. Necesito ajustar la próxima semana.')).toBeVisible();
    const reply = page.getByText('Mantendremos la descarga y revisaremos la recuperación.');
    await expect(reply).toBeHidden();
    await page.getByText('Respuestas y conversación', { exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(reply).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(reply).toBeHidden();
    const previousPrograms = page.getByText('Programas anteriores de esta semana (1)', {
      exact: true,
    });
    const previousHeading = page.getByRole('heading', { name: 'Programa sustituido' });
    await expect(previousHeading).toBeHidden();
    await previousPrograms.click();
    await expect(previousHeading).toBeVisible();
    await previousPrograms.click();
    await page.getByRole('button', { name: 'Copiar semana anterior' }).click();
    const session = page.locator('.coach-day').filter({ hasText: 'Torso' });
    await expect(page.getByLabel('Nombre del día (Lunes 16/11)')).toBeHidden();
    await expect(session.locator(':scope > summary')).toContainText('1 ejercicio · 3 series');
    await page.screenshot({ path: info.outputPath('weekly-compact.png'), fullPage: true });
    await session.locator(':scope > summary').click();
    await expect(page.getByLabel('Nombre del día (Lunes 16/11)')).toHaveValue('Torso');
    await expect(page.getByPlaceholder('Añadir ejercicio: nombre o etiqueta')).toBeHidden();
    await page.getByText('Objetivo y notas de la semana', { exact: true }).click();
    await page
      .getByLabel('Comentario para el alumno')
      .fill('Descarga: mantén la técnica y reduce la fatiga.');
    await page.getByText('Notas privadas del entrenador', { exact: true }).click();
    await page
      .getByLabel('Notas privadas del entrenador')
      .fill('Revisar disponibilidad del miércoles.');
    await page.getByLabel('Objetivo de la semana').selectOption('DELOAD');
    await expect(page.getByLabel('Carga (kg)', { exact: true })).toBeHidden();
    await page.getByText('Editar pauta', { exact: true }).click();
    await page.getByLabel('Carga (kg)', { exact: true }).fill('45');
    await page.screenshot({ path: info.outputPath('weekly-editing.png'), fullPage: true });
    await page.reload();
    await page.locator('.coach-day > summary').filter({ hasText: 'Torso' }).click();
    await page.getByText('Editar pauta', { exact: true }).click();
    await page.getByText('Objetivo y notas de la semana', { exact: true }).click();
    await expect(page.getByLabel('Carga (kg)', { exact: true })).toHaveValue('45');
    await page.getByText('Notas privadas del entrenador', { exact: true }).click();
    await expect(page.getByLabel('Notas privadas del entrenador')).toHaveValue(
      'Revisar disponibilidad del miércoles.',
    );
    await page.getByRole('button', { name: 'Vista del alumno' }).click();
    const preview = page.getByRole('region', { name: 'Vista previa del programa' });
    await expect(preview).toContainText('45 kg');
    await expect(preview).not.toContainText('Revisar disponibilidad del miércoles.');
    await page.getByRole('button', { name: 'Publicar semana', exact: true }).click();
    const confirmation = page.getByRole('dialog', { name: 'Publicar semana' });
    await expect(confirmation).toContainText('3 series');
    await confirmation.getByRole('button', { name: 'Publicar semana', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Publicar semana', exact: true })).toBeDisabled();
    expect(saved.content.program.days[0].exercises[0].prescription?.load?.amount).toBe(45);
    expect(previous.days[0].exercises[0].prescription?.load?.amount).toBe(50);
    expect(saved.publishedVersion).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: info.outputPath('weekly-published.png'), fullPage: true });
    expect(errors).toEqual([]);
  });
}
