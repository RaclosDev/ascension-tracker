import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';
import type { Program, ProgramAssignment } from '../src/lib/coach/coachPrograms';

for (const width of [390, 1440]) {
  test(`coach publishes a recoverable individual adaptation at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await setupAuthMocks(page);
    await page.route('**/api/passkeys', (route) => route.fulfill({ json: [] }));
    const original: Program = {
      id: 'copy1',
      name: 'Fuerza original',
      notes: null,
      status: 'READY',
      weeks: 2,
      updatedAt: '2026-11-11T10:00:00Z',
      days: [
        {
          week: 1,
          dayIndex: 1,
          name: 'Torso',
          notes: null,
          exercises: [
            {
              exerciseId: 'bench-press',
              exerciseName: 'Press banca',
              sets: 3,
              repsMin: 6,
              repsMax: 8,
              targetRpe: 8,
              restSeconds: 120,
              notes: null,
              targetRir: null,
              loadHint: null,
              supersetGroup: null,
            },
          ],
        },
      ],
    };
    const assignments: ProgramAssignment[] = [
      {
        id: 'a1',
        programId: 'copy1',
        sourceProgramId: 'library1',
        programName: original.name,
        weeks: 2,
        status: 'ACTIVE',
        startDate: '2026-11-11',
        createdAt: '2026-11-11T10:00:00Z',
        endedAt: null,
      },
    ];
    let submitted: { program: Program; startDate: string } | null = null;
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/api/coach/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace('/api/coach/', '');
      if (path === 'profile') return route.fulfill({ json: { coach: true } });
      if (path.endsWith('/powerlifting'))
        return route.fulfill({ json: { profile: { enabled: false } } });
      if (path === 'clients/l1')
        return route.fulfill({
          json: {
            linkId: 'l1',
            client: { name: 'Ana García', email: 'ana@example.test', picture: null },
            since: '2026-11-01T10:00:00Z',
            permissions: {
              training: true,
              editTraining: true,
              body: false,
              nutrition: false,
              editNutrition: false,
            },
          },
        });
      if (path === 'clients/l1/programs') return route.fulfill({ json: assignments });
      if (path === 'clients/l1/programs/a1/plan') return route.fulfill({ json: original });
      if (path === 'clients/l1/programs/a1/adapt') {
        submitted = route.request().postDataJSON() as { program: Program; startDate: string };
        assignments[0] = { ...assignments[0], status: 'ENDED', endedAt: new Date().toISOString() };
        const next: ProgramAssignment = {
          ...assignments[0],
          id: 'a2',
          programId: 'copy2',
          programName: submitted.program.name,
          startDate: submitted.startDate,
          status: 'ACTIVE',
          endedAt: null,
        };
        assignments.unshift(next);
        return route.fulfill({ status: 201, json: next });
      }
      if (path === 'clients/l1/workouts') return route.fulfill({ json: { content: [] } });
      if (path === 'clients/l1/workouts/stats')
        return route.fulfill({
          json: { totalWorkouts: 0, totalDurationSeconds: 0, totalVolume: 0, totalSets: 0 },
        });
      return route.fulfill({ json: [] });
    });
    await page.goto('/entrenador/alumnos/l1?seccion=entrenamiento');
    await page.getByRole('link', { name: 'Adaptar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Adaptar programa' })).toBeVisible();
    await expect(page.getByText('Adaptación solo para', { exact: false })).toContainText(
      'Ana García',
    );
    await page.getByLabel('Nombre', { exact: true }).fill('Fuerza · adaptación Ana');
    await page.getByLabel('Series', { exact: true }).fill('5');
    await page.reload();
    await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue('Fuerza · adaptación Ana');
    await expect(page.getByLabel('Series', { exact: true })).toHaveValue('5');
    await page.getByRole('button', { name: 'Vista previa', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Vista previa del programa' })).toContainText(
      '5 × 6–8 reps',
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: info.outputPath('individual-preview.png'),
      fullPage: true,
      animations: 'disabled',
    });
    const lastExercise = page
      .getByRole('region', { name: 'Vista previa del programa' })
      .getByText('5 × 6–8 reps', { exact: false });
    await lastExercise.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await expect(lastExercise).toBeInViewport();
    await page.screenshot({
      path: info.outputPath('individual-session.png'),
      animations: 'disabled',
    });
    await page.getByRole('button', { name: 'Publicar adaptación' }).click();
    const confirmation = page.getByRole('dialog', { name: 'Publicar adaptación' });
    await expect(confirmation).toContainText('continúa hasta esa fecha');
    await confirmation.getByRole('button', { name: 'Publicar adaptación' }).click();
    await expect(page).toHaveURL(/alumnos\/l1\?seccion=entrenamiento$/);
    await expect(page.getByText('Fuerza · adaptación Ana', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Ver programas anteriores' }).click();
    await expect(page.getByText('Fuerza original', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Adaptar', exact: true })).toHaveCount(1);
    expect(submitted).toMatchObject({
      program: { name: 'Fuerza · adaptación Ana', days: [{ exercises: [{ sets: 5 }] }] },
    });
    expect(original.days[0].exercises[0].sets).toBe(3);
    expect(errors).toEqual([]);
  });
}
