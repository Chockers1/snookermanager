import { expect, test } from '@playwright/test';
import { createStarterState, getNextEligibleTournament } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { scheduleCommitment } from '../src/game/careerDepth/commitments';
import { initializeCareerDepth } from '../src/game/careerDepth';
import { plusDays } from '../src/game/careerDepth/shared';
import { readCareerSave } from './read-career-save';

test('planner filters to main tour, keeps multiple bookings checked and saves later priorities', async ({ page }) => {
  let state = initializeCareerDepth(createStarterState());
  const original = getNextEligibleTournament(state)!;
  state.player.cash = 100000;
  state.careerSystems.pro.hasTourCard = true;
  state.tournaments = [7, 25, 80].map((offset, i) => ({ ...original, id: `planner-browser-${i}`,
    startDate: plusDays(state.currentDate, offset), endDate: plusDays(state.currentDate, offset + 2),
    entryDeadline: plusDays(state.currentDate, offset - 1), seedingCutoffDate: plusDays(state.currentDate, offset - 2), status: 'Available' }));
  state.tournaments.push({ ...state.tournaments[2], id: 'planner-youth', name: 'Hidden Junior Test', type: 'Junior' });
  state = scheduleCommitment(state, 'appearance', state.tournaments[0].startDate);
  await page.addInitScript(({ key, value }) => { localStorage.setItem(key, value); }, { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state) });
  await page.goto('/');
  await page.getByRole('button', { name: /Continue Career/ }).click();
  await page.evaluate(() => { history.pushState({}, '', '/calendar?commitments=1'); dispatchEvent(new PopStateEvent('popstate')); });
  const dialog = page.getByRole('dialog', { name: 'Plan your season and commitments' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Planner tour')).toHaveValue('Current tour');
  await expect(dialog).not.toContainText('Hidden Junior Test');
  const bookings = dialog.getByRole('checkbox', { name: /^Approve / });
  await expect(bookings).toHaveCount(2);
  await expect(bookings.nth(0)).toBeDisabled();
  await expect(bookings.nth(1)).toBeEnabled();
  await expect(dialog).toContainText('Sponsor appearance');
  await dialog.getByRole('button', { name: 'Cancel sponsor appearance to free these dates', exact: true }).click();
  await expect(bookings.nth(0)).toBeEnabled();
  await bookings.nth(0).check(); await bookings.nth(1).check();
  await expect(bookings.nth(0)).toBeChecked(); await expect(bookings.nth(1)).toBeChecked();
  await expect(dialog).toContainText('2 events selected');
  await dialog.getByRole('button', { name: 'Approve six-week schedule', exact: true }).click();
  await expect.poll(async () => (await readCareerSave(page)).careerDepth?.schedule?.eventIds.length).toBe(2);
  await dialog.getByLabel('Planning view').selectOption('season');
  const priorities = dialog.getByRole('checkbox', { name: /^Prioritise / });
  await expect(priorities).toHaveCount(3);
  await priorities.nth(0).check(); await priorities.nth(2).check();
  await expect(priorities.nth(0)).toBeChecked(); await expect(priorities.nth(2)).toBeChecked();
  await expect.poll(async () => (await readCareerSave(page)).careerDepth?.board?.priorities.length).toBe(2);
  await dialog.getByLabel('Planner tour').selectOption('All tours');
  await expect(dialog).toContainText('Hidden Junior Test');
});
