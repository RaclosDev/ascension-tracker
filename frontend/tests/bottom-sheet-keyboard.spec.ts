import { test, expect } from '@playwright/test';
import { setupAuthMocks } from './helpers/auth';

test('mobile options keep keyboard focus in the sheet and restore it on Escape', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setupAuthMocks(page);
  await page.goto('/dashboard');
  const trigger = page.getByRole('button', { name: 'Más opciones', exact: true });
  await trigger.click();
  const sheet = page.getByRole('dialog', { name: 'Más opciones' });
  const buttons = sheet.getByRole('button');
  await expect(buttons.first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(buttons.last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(buttons.first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
