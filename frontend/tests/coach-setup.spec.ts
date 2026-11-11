import { coachSettings } from './helpers/coachSettings';
import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';
import type { CoachSetup } from '../src/lib/coach/setup';
import type { CoachFollowup } from '../src/lib/coach/coachSchedule';

for (const width of [1440, 390]) {
  test(`coach configures an existing client and invites another at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await setupAuthMocks(page);
    await page.route('**/api/passkeys', (route) => route.fulfill({ json: [] }));
    let setup: CoachSetup | null = null;
    let followup: CoachFollowup = {
      schedule: { day: 7, time: '18:00', timeZone: 'Europe/Madrid', paused: false },
      startedAt: '2026-11-01T10:00:00Z',
      nextDueAt: '2026-11-15T17:00:00Z',
    };
    await page.route('**/api/coach/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace('/api/coach/', '');
      if (path.endsWith('/checkin-template'))
        return route.fulfill({ json: { questions: [], custom: false } });
      if (path === 'profile') return route.fulfill({ json: { coach: true } });
      if (path === 'settings') return route.fulfill({ json: coachSettings });
      const client = {
        linkId: 'l1',
        client: { name: 'Ana García', email: 'ana@example.com', picture: null },
        since: '2026-11-01T10:00:00Z',
        setup,
        followup,
        permissions: {
          training: false,
          nutrition: false,
          body: true,
          editTraining: false,
          editNutrition: false,
        },
      };
      if (path === 'clients') return route.fulfill({ json: [client] });
      if (path === 'clients/l1') return route.fulfill({ json: client });
      if (path === 'clients/l1/status')
        return route.fulfill({
          json: {
            linkId: 'l1',
            level: 'GREEN',
            lastActivity: null,
            pendingReplies: 0,
            signals: [],
            weightChange: null,
          },
        });
      if (path === 'clients/status')
        return route.fulfill({
          json: [
            {
              linkId: 'l1',
              level: 'GREEN',
              lastActivity: null,
              pendingReplies: 0,
              signals: [],
              weightChange: null,
            },
          ],
        });
      if (path === 'clients/l1/schedule') {
        followup = { ...followup, schedule: route.request().postDataJSON() };
        return route.fulfill({ json: followup });
      }
      if (path === 'clients/l1/setup') {
        setup = route.request().postDataJSON();
        return route.fulfill({ json: setup });
      }
      if (path === 'invitations' && route.request().method() === 'POST') {
        const request = route.request().postDataJSON();
        expect(request.setup.services).toEqual({
          training: true,
          nutrition: false,
          progress: false,
        });
        expect(request.permissions.nutrition).toBe(false);
        return route.fulfill({
          status: 201,
          json: { id: 'i1', token: 'a'.repeat(43), expiresAt: '2026-11-18T00:00:00Z' },
        });
      }
      return route.fulfill({ json: [] });
    });
    await page.goto('/entrenador/alumnos/l1');
    await page.getByRole('link', { name: 'Configurar servicio' }).click();
    await page
      .getByLabel('Objetivo del servicio (opcional)')
      .fill('Preparar la primera competición');
    await page.getByLabel('Días disponibles por semana (opcional)').fill('4');
    await page.getByLabel('Material disponible (opcional)').fill('Rack, barra y discos');
    await page.getByLabel(/He revisado con el alumno/).check();
    await page.getByRole('button', { name: 'Guardar servicio' }).click();
    await expect(page.getByText('Servicio guardado', { exact: true })).toBeVisible();
    await page.getByLabel('Día de revisión').selectOption('3');
    await page.getByLabel('Hora de revisión').fill('17:30');
    await page.getByLabel('Zona horaria').fill('Atlantic/Canary');
    await page.getByLabel('Pausar seguimiento').check();
    await page.getByRole('button', { name: 'Guardar agenda' }).click();
    await expect(page.getByRole('button', { name: 'Guardar agenda' })).toBeDisabled();
    await page.reload();
    await expect(page.getByLabel('Pausar seguimiento')).toBeChecked();
    await expect(page.getByLabel('Día de revisión')).toHaveValue('3');
    await expect(page.getByLabel('Hora de revisión')).toHaveValue('17:30');
    await expect(page.getByLabel('Zona horaria')).toHaveValue('Atlantic/Canary');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page
      .getByRole('button', { name: 'Guardar agenda' })
      .locator('xpath=ancestor::form')
      .screenshot({ path: testInfo.outputPath('review-schedule.png'), animations: 'disabled' });
    await page.getByLabel('Pausar seguimiento').uncheck();
    await page.getByRole('button', { name: 'Guardar agenda' }).click();
    await expect(page.getByRole('button', { name: 'Guardar agenda' })).toBeDisabled();
    await page.getByRole('link', { name: 'Resumen', exact: true }).click();
    await expect(
      page.getByText('4 días de entrenamiento por semana', { exact: true }),
    ).toBeVisible();
    const context = page.locator('.coach-client-context');
    await expect(
      context.getByText('Preparar la primera competición', { exact: true }),
    ).toBeHidden();
    await context.locator('summary').click();
    await expect(
      context.getByText('Preparar la primera competición', { exact: true }),
    ).toBeVisible();
    await expect(context.getByText('Rack, barra y discos', { exact: true })).toBeVisible();
    await expect(page.getByText(/Falta autorización para entrenamiento/)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: testInfo.outputPath('service-summary.png'), fullPage: true });
    await page.getByRole('link', { name: 'Volver a alumnos' }).click();
    await page
      .getByRole('button', { name: /Invitar alumno/ })
      .first()
      .click();
    await page.getByLabel('Nombre del alumno (opcional)').fill('Bruno');
    await page.getByRole('button', { name: 'Crear enlace de invitación' }).click();
    await expect(page.getByLabel('Enlace de invitación')).toHaveValue(/a{43}/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}
