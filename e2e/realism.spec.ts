import { expect, test, type Page } from '@playwright/test';
import { createStarterState, getNextEligibleTournament, enterTournamentState, bookTravelState, getTravelPackageEstimate, confirmTournamentPreparationState, startLiveMatchState, type GameState } from '../src/hooks/useGameState';
import { getDefaultPreparationAllocations } from '../src/game/tournamentPreparation';
import { realismOf, reconcileRealism } from '../src/game/realism';
import { sessionPlan } from '../src/game/realism/sessions';
import { updateWorldDigest } from '../src/game/realism/digest';
import { depthOf } from '../src/game/careerDepth/shared';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';

async function open(page: Page, route: string, state: GameState) {
  await page.addInitScript(({ key, save }) => {
    if (!sessionStorage.getItem('realism-fixture')) {
      localStorage.setItem(key, save);
      sessionStorage.setItem('realism-fixture', '1');
    }
  }, { key: ACTIVE_SAVE_KEY, save: encodeCareerSave(state) });
  await page.goto('/');
  await page.getByRole('button', { name: /Continue Career/ }).click();
  await page.evaluate(url => { history.pushState({}, '', url); dispatchEvent(new PopStateEvent('popstate')); }, route);
}
function seed() {
  const state = createStarterState();
  return { ...state, player: { ...state.player, cash: 50000 }, careerDepth: { ...depthOf(state), stories: [], commitments: [] }, realism: { ...realismOf(state), digest: [], seenEvents: [], seenMatches: state.matches.map(m => m.id) } };
}
function liveSeed() {
  let state: GameState = seed();
  const event = getNextEligibleTournament(state)!;
  state = confirmTournamentPreparationState(bookTravelState(enterTournamentState(state, event.id), event.id), event.id, 'balanced', getDefaultPreparationAllocations(), []);
  state = reconcileRealism({ ...state, currentDate: event.startDate });
  return startLiveMatchState(state, event.id);
}
test('interval pauses simulation, offers evidence and saves its choice exactly once', async ({ page }) => {
  const state = liveSeed();
  state.liveMatch = { ...state.liveMatch!, bestOf: 17, framesNeeded: 9, sessions: sessionPlan(17), playerFrames: 2, opponentFrames: 2, currentFrame: 5, playerPoints: 0, opponentPoints: 0, currentBreak: 0, playerFatigue: 35 };
  await open(page, '/match/live', state);
  const dialog = page.getByRole('dialog', { name: 'Mid-session interval' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Potting:');
  await page.screenshot({ path: 'test-results/realism-interval.png', fullPage: true });
  await dialog.getByRole('button', { name: /Rest and hydrate/ }).click();
  await expect(dialog).not.toBeVisible();
  await expect.poll(async () => (await readCareerSave(page)).liveMatch?.sessions?.completedBreaks.length).toBe(1);
  expect((await readCareerSave(page)).liveMatch!.playerFatigue).toBe(31);
  await page.reload();
  await page.getByRole('button', { name: /Continue Career/ }).click();
  await page.evaluate(() => { history.pushState({}, '', '/match/live'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.getByRole('dialog')).not.toBeVisible();
  expect((await readCareerSave(page)).liveMatch!.playerFatigue).toBe(31);
  await page.getByRole('button', { name: /^Sim Match/ }).click();
  await expect(page.getByRole('dialog', { name: /interval|Session break/ })).toBeVisible();
});
test('overnight recovery persists without advancing the career date', async ({ page }) => {
  const state = liveSeed();
  state.liveMatch = { ...state.liveMatch!, bestOf: 35, framesNeeded: 18, sessions: sessionPlan(35), playerFrames: 9, opponentFrames: 8, currentFrame: 18, playerPoints: 0, opponentPoints: 0, currentBreak: 0, playerFatigue: 45 };
  await open(page, '/match/live', state);
  const dialog = page.getByRole('dialog', { name: 'Overnight session break' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /Mental reset/ }).click();
  await expect.poll(async () => (await readCareerSave(page)).liveMatch?.sessions?.completedBreaks.length).toBe(1);
  const saved = await readCareerSave(page);
  expect(saved.currentDate).toBe(state.currentDate);
  expect(saved.liveMatch!.playerFatigue).toBe(35);
});
test('training base shows costs and retains the selected membership after reload', async ({ page }) => {
  const state = seed();
  state.tournaments = [];
  await page.setViewportSize({ width: 1280, height: 720 });
  await open(page, '/training', state);
  await page.getByRole('button', { name: /Training base ·/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Training base and relocation' });
  await dialog.getByRole('button', { name: /Dedicated rented table/ }).click();
  await expect(dialog).toContainText('£90/week');
  await dialog.getByRole('button', { name: 'Confirm base and costs' }).click();
  await expect.poll(async () => (await readCareerSave(page)).realism?.base).toBe('rented');
  expect((await readCareerSave(page)).player.cash).toBe(state.player.cash - 180);
  await expect(dialog).toContainText('cash after joining £49,820');
  await page.screenshot({ path: 'test-results/realism-training-base.png', fullPage: true });
  await dialog.getByRole('button', { name: 'Close editor' }).click();
  await page.reload();
  await page.getByRole('button', { name: /Continue Career/ }).click();
  expect((await readCareerSave(page)).realism?.base).toBe('rented');
});
test('international travel and conditions show costs, dates and the booking state', async ({ page }) => {
  let state: GameState = seed();
  const event = getNextEligibleTournament(state)!;
  state = enterTournamentState(state, event.id);
  await open(page, '/travel', state);
  await page.getByRole('button', { name: /arrival \d{4}/ }).click();
  const journey = page.getByRole('dialog', { name: 'Journey and acclimatisation' });
  await expect(journey).toContainText('Depart');
  await expect(journey).toContainText('recommended acclimatisation');
  await page.screenshot({ path: 'test-results/realism-travel.png', fullPage: true });
  await journey.getByRole('button', { name: 'Close editor' }).click();
  await page.evaluate(() => { history.pushState({}, '', '/tournaments/hub'); dispatchEvent(new PopStateEvent('popstate')); });
  await page.getByRole('button', { name: /Conditions & scouting/ }).click();
  const conditions = page.getByRole('dialog', { name: 'Conditions and scouting evidence' });
  await expect(conditions).toContainText('Cloth speed');
  await expect(conditions).toContainText('estimated OVR');
  await expect(conditions).toContainText('Small sample');
});
test('qualification races are reachable and describe provisional and protected places', async ({ page }) => {
  await open(page, '/rankings', seed());
  await page.getByRole('button', { name: /Qualification races/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Qualification and tour survival' });
  await expect(dialog).toContainText('Tour survival · top 64');
  await expect(dialog).toContainText('defending');
  await expect(dialog).toContainText('cut-off');
  await expect(dialog).not.toContainText('Regional Youth Masters');
  await page.screenshot({ path: 'test-results/realism-races.png', fullPage: true });
});
test('recorded tour digest appears in Inbox without duplicating after reload', async ({ page }) => {
  let state: GameState = seed();
  const opponent = state.worldPlayers[0];
  const key = 'browser-digest';
  state.rollingRankings!.events[key] = { key, tournamentId: key, name: 'Recorded Invitational', season: state.season, completedOn: state.currentDate, ranking: false, applied: true, bracket: [{ label: 'Final', matches: [{ id: key, top: { name: opponent.playerName, rank: 45, nation: 'ENG', score: 6 }, bottom: { name: 'Seeded opponent', rank: 4, nation: 'ENG', score: 3 } }] }] };
  state = updateWorldDigest(state);
  await open(page, '/inbox', state);
  await expect(page.getByText('Around the tour', { exact: true }).first()).toBeVisible();
  await expect(page.locator('#main-content')).toContainText('Recorded Invitational');
  const before = (await readCareerSave(page)).realism!.digest;
  await page.reload();
  await page.getByRole('button', { name: /Continue Career/ }).click();
  expect((await readCareerSave(page)).realism!.digest).toEqual(before);
});


test('hotel choices show nightly rates and a range, then charge the initial stay', async ({ page }) => {
  let state = seed();
  const event = getNextEligibleTournament(state)!;
  state = enterTournamentState(state, event.id);
  await open(page, '/travel', state);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByText('Trip estimate · early exit to final')).toBeVisible();
  await expect(page.getByText('Pay on booking')).toBeVisible();
  await expect(page.getByRole('button', { name: /night.*stay/ }).first()).toBeVisible();
  await page.screenshot({ path: 'test-results/hotel-stay-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const travel = page.getByLabel('Travel option').filter({ visible: true });
  const hotel = page.getByLabel('Hotel option').filter({ visible: true });
  await expect(hotel).toBeVisible();
  await expect(hotel.locator('option').first()).toContainText('/night');
  const expected = getTravelPackageEstimate(state, await travel.inputValue(), await hotel.inputValue(), event.id);
  await page.getByRole('button', { name: 'Confirm Travel', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/hotel-stay-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Confirm Travel', exact: true }).click();
  await expect.poll(async () => (await readCareerSave(page)).travel.bookings[event.id]?.totalCost).toBe(expected.minCost);
  expect((await readCareerSave(page)).player.cash).toBeCloseTo(state.player.cash - expected.minCost, 2);
});
