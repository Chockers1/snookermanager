import { expect, test } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY } from '../src/game/saveStorage';

test('match preview rounds fractional condition values for display', async ({ page }) => {
  const state = createStarterState();
  state.player.confidence = 88.69999999999999;
  state.player.fatigue = 82.19999999999999;
  await page.addInitScript(({ key, save }) => localStorage.setItem(key, save), {
    key: ACTIVE_SAVE_KEY, save: JSON.stringify(state),
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Continue Career/ }).click();
  await page.evaluate(() => {
    window.history.pushState({}, '', '/match/preview');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.getByRole('heading', { name: 'Match Preview', exact: true })).toBeVisible();
  const confidence = page.locator('p').filter({ hasText: /^Confidence$/ }).first().locator('..');
  const fatigue = page.locator('p').filter({ hasText: /^Fatigue$/ }).first().locator('..');
  await expect(confidence).toHaveText('Confidence89%');
  await expect(fatigue).toHaveText('Fatigue82%');
  await expect(page.locator('body')).not.toContainText('88.69999999999999');
  await expect(page.locator('body')).not.toContainText('82.19999999999999');
});
