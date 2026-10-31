import { Page } from '@playwright/test';
import {
  SETTINGS_FIXTURE,
  WEIGHTS_DASHBOARD_FIXTURE,
  WEIGHTS_LIST_FIXTURE,
  WEIGHTS_WEEKLY_FIXTURE,
  STEPS_WEEKLY_FIXTURE,
  NUTRITION_CALORIES_WEEKLY_FIXTURE,
  NUTRITION_MACROS_FIXTURE,
  NUTRITION_MEALS_FIXTURE,
} from './fixtures';

export const FAKE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwibmFtZSI6IlRlc3QgVXNlciIsImV4cCI6OTk5OTk5OTk5OX0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

/**
 * Mocks the complete authentication flow and standard API endpoints
 * to simulate an authenticated user with valid settings across all pages.
 */
export async function setupAuthMocks(page: Page): Promise<void> {
  await page.route('**/api/push/rest-timer', (route) => route.fulfill({ status: 200, body: '' }));
  await page.route('**/api/push/rest-timer/cancel', (route) =>
    route.fulfill({ status: 200, body: '' }),
  );
  await page.route('**/api/nutrition/ai/assistant-summary?*', (route) =>
    route.fulfill({
      status: 200,
      json: {
        date: new URL(route.request().url()).searchParams.get('date'),
        target: { kcal: 2000, protein: 150, carbs: 200, fat: 66 },
        consumed: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
        remaining: { kcal: 2000, protein: 150, carbs: 200, fat: 66 },
        meals: NUTRITION_MEALS_FIXTURE,
      },
    }),
  );

  // 1. Auth config (Google Client ID)
  await page.route('**/api/auth/config**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: { googleClientId: 'fake-test-client-id' },
    });
  });

  // 2. Auth refresh (Proactive JWT session)
  await page.route('**/api/auth/refresh**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: { token: FAKE_JWT },
    });
  });

  // 3. User settings (Prevents OnboardingScreen)
  await page.route('**/api/settings**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: SETTINGS_FIXTURE,
    });
  });

  // 4. App version
  await page.route('**/api/version**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: { version: '1.0.0' },
    });
  });

  // 5. Dashboard weights & KPI
  await page.route('**/api/weights/dashboard**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: WEIGHTS_DASHBOARD_FIXTURE,
    });
  });

  // 6. Weekly weights
  await page.route('**/api/weights/weekly**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: WEIGHTS_WEEKLY_FIXTURE,
    });
  });

  // 7. Weights list and single weight mutations
  await page.route(/\/api\/weights(\?.*)?$/, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: WEIGHTS_LIST_FIXTURE,
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { id: 10, date: '2026-10-12', weight: 81.2 },
      });
    }
  });

  // 8. Weekly steps
  await page.route('**/api/steps/weekly**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: STEPS_WEEKLY_FIXTURE,
    });
  });

  // 9. Weekly calories
  await page.route('**/api/nutrition/calories/weekly**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: NUTRITION_CALORIES_WEEKLY_FIXTURE,
    });
  });

  // 10. Nutrition macros & meals
  await page.route('**/api/nutrition/macros**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: NUTRITION_MACROS_FIXTURE,
    });
  });

  await page.route('**/api/nutrition/meals**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: NUTRITION_MEALS_FIXTURE,
    });
  });

  // 11. Nutrition food logs, my-foods & recipes
  await page.route('**/api/nutrition/logs**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [],
    });
  });

  await page.route('**/api/nutrition/my-foods**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [],
    });
  });

  await page.route('**/api/nutrition/recipes**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [],
    });
  });

  // 12. Static exercise catalogs
  await page.route('**/exercises.json**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [
        {
          id: 'bench-press',
          name: 'Press de Banca Plano',
          muscle: 'pecho',
          equipment: 'barra',
        },
      ],
    });
  });

  await page.route('**/exercises-base.json**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [
        {
          id: 'base-pecho-press-de-pecho-plano-barra',
          name: 'Press de Pecho Plano con Barra',
          muscle: 'pecho',
          equipment: 'barra',
        },
      ],
    });
  });

  // 13. Workout endpoints
  await page.route('**/api/workouts/recent**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [],
    });
  });

  await page.route('**/api/workouts/templates**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [],
    });
  });

  await page.route('**/api/workouts/custom-exercises**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: [],
    });
  });

  await page.route('**/api/workout-preferences**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          defaultRestSeconds: 90,
          showRpe: false,
          hiddenEquipments: [],
          exerciseGifs: {},
          restTimers: {},
        },
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: route.request().postDataJSON() || {},
      });
    }
  });
}
