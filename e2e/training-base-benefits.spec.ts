import { expect, test } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';

for (const width of [1366, 390]) test(`training location benefits are readable before booking at ${width}`, async ({ page }) => {
  const state = createStarterState();
  if (state.firstWeekGuide) state.firstWeekGuide.dismissed = true;
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ key, value }) => {
    if (!sessionStorage.getItem('base-benefits')) { localStorage.setItem(key, value); sessionStorage.setItem('base-benefits', '1'); }
  }, { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state) });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.getByRole('heading', { name: 'Upcoming & Recent Results', exact: true })).toBeVisible();
  await page.evaluate(() => { history.pushState({}, '', '/training'); dispatchEvent(new PopStateEvent('popstate')); });
  await page.getByRole('button', { name: 'Training base: Manage' }).click();
  const dialog = page.getByRole('dialog', { name: 'Training base and relocation' });
  const benefits = dialog.getByRole('region', { name: 'Location training benefits' });
  await expect(benefits).toContainText('Safety Play and Big Match Nerve');
  await dialog.getByLabel('Base location').selectOption('Wuhan');
  await expect(benefits).toContainText('Long Potting and Break Building · +6%');
  await expect(benefits).toContainText('Safety Play · −4%');
  await dialog.getByLabel('Base location').selectOption('Sydney');
  await expect(benefits).toContainText('Shoulder Health and Recovery Rate');
  await expect(benefits).toContainText('Break Building · −4%');
  await expect(dialog.getByRole('button', { name: 'Confirm base and costs' })).toBeEnabled();
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  expect(await benefits.innerText()).not.toMatch(/\d+\.\d{3,}/);
  await benefits.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `artifacts/training-base-benefits-${width}.png` });
  await dialog.getByRole('button', { name: 'Close editor' }).click();
  await expect(dialog).not.toBeVisible();
});
