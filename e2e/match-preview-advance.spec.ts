import { expect, test } from '@playwright/test';
import { createStarterState, enterTournamentState, bookTravelState, confirmTournamentPreparationState } from '../src/hooks/useGameState';
import { getDefaultPreparationAllocations } from '../src/game/tournamentPreparation';
import { depthOf, plusDays } from '../src/game/careerDepth/shared';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';

for (const blocked of [false, true]) test(`preview advances directly and starts safely (decision: ${blocked})`, async ({ page }) => {
  let state = createStarterState();
  state.player.cash = 100000;
  const event = state.tournaments.find(t => t.name === 'Shanghai Masters')!;
  state = enterTournamentState(state, event.id);
  state = bookTravelState(state, event.id);
  state = confirmTournamentPreparationState(state, event.id, 'balanced', getDefaultPreparationAllocations(), []);
  state.currentDate = plusDays(event.startDate, -1);
  state.careerDepth = { ...depthOf(state), stories: blocked ? [{
    id: 'story:preview:block', kind: 'breakthrough', title: 'A breakthrough victory',
    evidence: 'You beat a leading player.', createdDate: state.currentDate,
    expiresDate: plusDays(state.currentDate, 28), status: 'pending', updates: [],
    matchCount: state.matches.length, trainingWeeks: 0,
  }] : [] };
  await page.addInitScript(({ key, save }) => localStorage.setItem(key, save), { key: ACTIVE_SAVE_KEY, save: encodeCareerSave(state) });
  await page.goto('/');
  await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();
  await page.evaluate(() => { history.pushState({}, '', '/match/preview'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.getByRole('heading', { name: 'Match Preview', exact: true })).toBeVisible();
  if (blocked) {
    await expect(page.getByRole('button', { name: 'Advance to Tournament' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Resolve Inbox Decision', exact: true }).click();
    await expect(page).toHaveURL(/inbox\?message=story%3Apreview%3Ablock/);
    expect((await readCareerSave(page)).currentDate).toBe(state.currentDate);
    return;
  }
  await page.getByRole('button', { name: 'Advance to Tournament', exact: true }).click();
  await expect.poll(async () => (await readCareerSave(page)).currentDate).toBe(event.startDate);
  await expect(page).toHaveURL(/\/match\/preview$/);
  expect((await readCareerSave(page)).matches.length).toBe(state.matches.length);
  await page.getByRole('button', { name: 'Start Match', exact: true }).click();
  await expect(page).toHaveURL(/\/match\/live$/);
  await expect.poll(async () => (await readCareerSave(page)).liveMatch?.status).toBe('In Progress');
});
