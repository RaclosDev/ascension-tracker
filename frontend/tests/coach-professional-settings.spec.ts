import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';
import { coachSettings } from './helpers/coachSettings';
import type { ProfessionalSettings } from '../src/lib/coach/professionalSettings';
import type { InvitationRequest } from '../src/lib/coach/api';

for (const width of [390, 1440]) {
  test(`professional settings persist and initialise invitations at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await setupAuthMocks(page);
    await page.route('**/api/passkeys', (route) => route.fulfill({ json: [] }));
    let settings = structuredClone(coachSettings);
    let conflict = false;
    let invitation: InvitationRequest | null = null;
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/api/coach/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace('/api/coach/', '');
      const method = route.request().method();
      if (path === 'profile') return route.fulfill({ json: { coach: true } });
      if (path === 'settings' && method === 'PUT') {
        const request = route.request().postDataJSON() as ProfessionalSettings;
        if (conflict) {
          settings = {
            ...settings,
            version: settings.version + 1,
            presentation: 'Guardado desde otra sesión',
          };
          return route.fulfill({
            status: 409,
            json: { message: 'Los ajustes han cambiado en otra sesión.' },
          });
        }
        expect(request.version).toBe(settings.version);
        settings = { ...request, version: settings.version + 1 };
        return route.fulfill({ json: settings });
      }
      if (path === 'settings') return route.fulfill({ json: settings });
      if (path === 'checkin-template')
        return route.fulfill({ json: { questions: [], custom: false } });
      if (path === 'invitations' && method === 'POST') {
        invitation = route.request().postDataJSON() as InvitationRequest;
        expect(invitation.setup?.services).toEqual({
          training: false,
          nutrition: true,
          progress: false,
        });
        expect(invitation.permissions?.nutrition).toBe(true);
        expect(invitation.permissions?.training).toBe(false);
        return route.fulfill({
          status: 201,
          json: { id: 'i1', token: 'a'.repeat(43), expiresAt: '2026-11-18T12:00:00Z' },
        });
      }
      return route.fulfill({ json: [] });
    });
    await page.goto('/entrenador/ajustes');
    await page
      .getByLabel('Nombre profesional', { exact: true })
      .fill('Ana · Entrenamiento de fuerza');
    await page
      .getByLabel('Presentación para tus alumnos')
      .fill('Revisamos tu progreso cada semana.');
    await page.getByLabel('Mostrar mi foto de cuenta a mis alumnos').uncheck();
    await page.getByLabel('Entrenamiento', { exact: true }).uncheck();
    await page.getByLabel('Nutrición', { exact: true }).check();
    await page.getByLabel('Día de revisión inicial').selectOption('3');
    await page.getByLabel('Hora de revisión inicial').fill('17:30');
    await page.getByLabel('Zona horaria de las revisiones').fill('Atlantic/Canary');
    await page.reload();
    await expect(page.getByLabel('Nombre profesional', { exact: true })).toHaveValue(
      'Ana · Entrenamiento de fuerza',
    );
    await page.getByRole('button', { name: 'Guardar ajustes profesionales' }).click();
    await expect(
      page.getByRole('button', { name: 'Guardar ajustes profesionales' }),
    ).toBeDisabled();
    expect(settings.review.day).toBe(3);
    await page.getByLabel('Nombre profesional', { exact: true }).scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: info.outputPath('professional-settings.png'),
      animations: 'disabled',
    });

    conflict = true;
    await page.getByLabel('Presentación para tus alumnos').fill('Mi borrador se conserva');
    await page.getByRole('button', { name: 'Guardar ajustes profesionales' }).click();
    await expect(page.getByRole('alert')).toContainText('otra sesión');
    await expect(page.getByLabel('Presentación para tus alumnos')).toHaveValue(
      'Mi borrador se conserva',
    );
    await page.getByRole('button', { name: 'Consultar versión guardada' }).click();
    await expect(page.getByText('Hay una versión más reciente.', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Descartar borrador' }).click();
    await page
      .getByRole('dialog', { name: 'Descartar borrador' })
      .getByRole('button', { name: 'Descartar borrador' })
      .click();
    await expect(page.getByLabel('Presentación para tus alumnos')).toHaveValue(
      'Guardado desde otra sesión',
    );
    await page.goto('/entrenador/alumnos');
    await page.getByRole('button', { name: 'Invitar alumno' }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(
      dialog
        .getByRole('group', { name: 'Servicios acordados' })
        .getByLabel('Nutrición', { exact: true }),
    ).toBeChecked();
    await expect(
      dialog
        .getByRole('group', { name: 'Servicios acordados' })
        .getByLabel('Entrenamiento', { exact: true }),
    ).not.toBeChecked();
    await dialog.getByLabel('Nombre del alumno (opcional)').fill('Alumno nuevo');
    await dialog.getByRole('button', { name: 'Crear enlace de invitación' }).click();
    await expect(dialog.getByLabel('Enlace de invitación')).toBeVisible();
    expect(invitation).not.toBeNull();
    expect(errors).toEqual([]);
  });
}
