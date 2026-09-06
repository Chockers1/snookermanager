import { test, expect } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';

test('empty Tournament Hub has useful actions and no invented event or opponent', async ({ page }) => {
  const state = createStarterState();
  state.tournaments = [];
  state.player.nextEvent = 'Stale World Championship';
  await page.addInitScript(({ key, value }) => { localStorage.clear(); localStorage.setItem(key, value); }, { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state) });
  await page.goto('/');
  await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.getByText('Stale World Championship', { exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Tournament Hub', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No eligible tournament' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enter Tournament', exact: true })).toHaveCount(0);
  await expect(page.getByText('VS', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Tournament Bracket', { exact: true })).toHaveCount(0);
  const before = (await readCareerSave(page)).currentDate;
  await page.getByRole('button', { name: 'Advance One Week', exact: true }).click();
  await expect.poll(async () => (await readCareerSave(page)).currentDate).not.toBe(before);
  await page.getByRole('button', { name: 'View Tournament Calendar', exact: true }).click();
  await expect(page).toHaveURL(/\/calendar/);
});
