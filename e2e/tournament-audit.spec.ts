import { test, expect } from '@playwright/test';
import { createStarterState, enterTournamentState, bookTravelState, confirmTournamentPreparationState } from '../src/hooks/useGameState';
import { getDefaultPreparationAllocations } from '../src/game/tournamentPreparation';
import { reconcileRealism } from '../src/game/realism';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';

for (const eventId of ['pc-69', 'pc-67']) test(`audited rules and fixtures ${eventId}`, async ({ page }) => {
  let state = createStarterState(); state.player.cash = 100000;
  const event = state.tournaments.find(t => t.id === eventId)!; state.tournaments = [event];
  state = enterTournamentState(state, event.id); state = bookTravelState(state, event.id);
  state = confirmTournamentPreparationState(state, event.id, 'balanced', getDefaultPreparationAllocations(), []);
  state = reconcileRealism({ ...state, currentDate: event.startDate });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(({ key, save }) => localStorage.setItem(key, save), { key: ACTIVE_SAVE_KEY, save: encodeCareerSave(state) });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  await page.evaluate(() => { history.pushState({}, '', '/tournaments/hub'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.getByText('Round rules and format', { exact: true })).toBeVisible();
  await page.screenshot({ path: `test-results/audit-hub-${eventId}.png`, fullPage: true });
  if (eventId === 'pc-69') {
    const groups = page.getByRole('region', { name: 'Group standings and fixtures' });
    await expect(groups).toContainText('0 of 6 matches');
    await expect(groups.getByLabel('Group stage').locator('option')).toHaveCount(24);
    await page.getByRole('button', { name: 'Quick Sim', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Match Review' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Group standings and fixtures' })).toContainText('1 of 6 matches');
  } else {
    await expect(page.getByText(/10-minute frame; 15-second shot clock/)).toBeVisible();
    await page.getByRole('button', { name: 'Quick Sim', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Match Review' })).toBeVisible();
  }
  await page.screenshot({ path: `test-results/audited-${eventId}.png`, fullPage: true });
});
