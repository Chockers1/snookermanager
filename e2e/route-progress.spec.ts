import { test, expect } from '@playwright/test';
import { createStarterState, enterTournamentState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';

for (const groups of [true, false]) test('route progress opens ' + (groups ? 'invitational groups and knockout stages' : 'knockout columns'), async ({ page }) => {
  let state = createStarterState();
  const event = groups ? state.tournaments.find(t => t.name === 'Championship League Invitational')! : state.tournaments.find(t => t.name === 'Shanghai Masters')!;
  state = enterTournamentState(state, event.id);
  expect(state.tournamentProgress.tournamentId).toBe(event.id);
  const rounds = state.tournamentProgress.draw;
  expect(rounds.length).toBeGreaterThan(2);
  // Completed events must retain navigation, even after the human's route ends.
  state.tournaments = state.tournaments.map(t => t.id === event.id ? { ...t, status: 'Completed' } : t);
  state.tournamentProgress.currentRound = null;
  state.history.tournamentHistory = state.history.tournamentHistory.map(h => h.tournamentId === event.id ? { ...h, status: 'Completed', result: groups ? 'Eliminated in Group 3' : 'Lost in Quarter Final', bracket: rounds } : h);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state) });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  await page.evaluate(id => { history.pushState({}, '', '/tournaments/draw?tournament=' + id); dispatchEvent(new PopStateEvent('popstate')); }, event.id);
  const progress = page.getByRole('navigation', { name: 'Route Progress' });
  for (const round of [rounds.at(-1)!, rounds[0], rounds[1]]) {
    const button = progress.getByRole('button', { name: 'View ' + round.label, exact: true });
    await button.focus(); await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-current', 'location');
    if (groups) {
      await expect(page.getByLabel('Group stage', { exact: true })).toHaveValue(round.label);
      await expect(page.getByLabel('Group stage', { exact: true })).toBeFocused();
      await expect(page.getByLabel('Group stage', { exact: true })).toBeInViewport();
    } else {
      const column = page.getByRole('region', { name: round.label + ' bracket', exact: true });
      await expect(column).toBeFocused();
      await expect(column).toBeInViewport();
    }
  }
});
