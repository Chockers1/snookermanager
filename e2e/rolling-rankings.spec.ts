import { expect, test } from '@playwright/test';
import { createStarterState, processRankingCalendar } from '../src/hooks/useGameState';
import { initializeRollingRankings } from '../src/game/rollingRankings';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';

test('shows settled CPU events and money rankings, with no duplicate settlement after reload', async ({ page }) => {
  const initial = createStarterState();
  initial.currentDate = '2026-09-01';
  initial.rollingRankings = undefined;
  initial.tournaments = [{ ...initial.tournaments.find(t => t.type === 'Ranking')!, id: 'browser-ranking', name: 'Browser Ranking Open', formatId: 'ukMajor', rankingType: 'World Ranking', startDate: '2026-09-08', endDate: '2026-09-10', status: 'Skipped', winnerPrize: 10000 }];
  const state = processRankingCalendar({ ...initializeRollingRankings(initial), currentDate: '2026-09-11' });
  await page.addInitScript(({ key, value }) => {
    if (!sessionStorage.getItem('rankings-test')) {
      localStorage.clear(); localStorage.setItem(key, value); sessionStorage.setItem('rankings-test', '1');
    }
  }, { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state) });
  await page.goto('/');
  await page.getByRole('button', { name: /Continue Career/ }).click();
  await page.getByRole('link', { name: 'Rankings', exact: true }).click();
  await expect(page.getByRole('columnheader', { name: 'Ranking earnings', exact: true })).toBeVisible();
  await expect(page.getByText(/1 ranking events settled this season/)).toBeVisible();
  const before = (await readCareerSave(page)).rollingRankings;
  await page.reload();
  await page.getByRole('button', { name: /Continue Career/ }).click();
  const after = (await readCareerSave(page)).rollingRankings;
  expect(after?.earnings).toEqual(before?.earnings);
  expect(after?.events).toEqual(before?.events);
});
