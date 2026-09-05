import { expect, test, type Page } from '@playwright/test';
import { readCareerSave } from './read-career-save';
import { ACTIVE_SAVE_KEY } from '../src/game/saveStorage';
import { createStarterState, getNextEligibleTournament } from '../src/hooks/useGameState';
import { reconcileCareerDepth } from '../src/game/careerDepth';
import { depthOf, plusDays } from '../src/game/careerDepth/shared';
import { commitmentQuote } from '../src/game/careerDepth/commitments';

test('blocked entry names its commitment and can be resolved without bypassing gates', async ({ page }) => {
  const state = createStarterState();
  const event = getNextEligibleTournament(state)!;
  state.player.confidence = 79.39999999999999;
  state.careerDepth = { ...depthOf(state), commitments: [commitmentQuote(state, 'exhibition', event.startDate)] };
  await open(page, '/tournaments/hub', state);
  await expect(page.getByText(/Entry blocked: Paid exhibition/)).toBeVisible();
  await expect(page.locator('#main-content')).toContainText('79% confidence');
  await expect(page.locator('#main-content')).not.toContainText('79.39999999999999');
  await page.getByRole('button', { name: 'Manage Calendar Clash', exact: true }).click();
  const editor = page.getByRole('dialog', { name: 'Plan your season and commitments' });
  await expect(editor).toBeVisible();
  expect((await saved(page)).tournaments.find(t => t.id === event.id)?.status).not.toBe('Entered');
  await editor.getByRole('button', { name: 'Cancel (no refund)', exact: true }).click();
  await editor.getByRole('button', { name: 'Close editor', exact: true }).click();
  await page.evaluate(() => { history.pushState({}, '', '/tournaments/hub'); dispatchEvent(new PopStateEvent('popstate')); });
  await page.getByRole('button', { name: 'Enter Tournament', exact: true }).click();
  await expect(page.locator('#main-content').getByRole('button', { name: 'Book Travel', exact: true })).toBeVisible();
  expect((await saved(page)).tournaments.find(t => t.id === event.id)?.status).toBe('Entered');
});

async function open(page: Page, route: string, state = createStarterState()) {
  await page.addInitScript(({ key, save }) => {
    if (!sessionStorage.getItem('career-depth-fixture')) {
      localStorage.setItem(key, save);
      sessionStorage.setItem('career-depth-fixture', '1');
    }
  }, { key: ACTIVE_SAVE_KEY, save: JSON.stringify(state) });
  await page.goto('/');
  await page.getByRole('button', { name: /Continue Career/ }).click();
  await page.evaluate(url => { history.pushState({}, '', url); dispatchEvent(new PopStateEvent('popstate')); }, route);
}
async function saved(page: Page) { return readCareerSave(page); }
function pressureStory() {
  let state = createStarterState();
  const template = state.matches[0];
  const opponent = state.worldPlayers[0];
  state = { ...state, matches: [], inbox: [] };
  for (let i = 0; i < 3; i++) state = reconcileCareerDepth({ ...state, matches: [{ ...template, id: `pressure-${i}`, tournamentId: `fake-${i}`, playedOn: state.currentDate, opponentName: opponent.playerName, opponentId: opponent.id, opponentRanking: 24, bestOf: 7, playerFrames: 3, opponentFrames: 4, result: 'Lost' }, ...state.matches] });
  return state;
}

test('major story choice persists through reading, reload and follow-up navigation', async ({ page }) => {
  await open(page, '/inbox', pressureStory());
  await expect(page.getByRole('region', { name: 'Career decision' })).toBeVisible();
  await page.getByRole('button', { name: 'Pressure programme', exact: true }).click();
  await expect.poll(async () => (await saved(page)).careerDepth?.project?.kind).toBe('pressure');
  await page.reload();
  await page.getByRole('button', { name: /Continue Career/ }).click();
  await page.evaluate(() => { history.pushState({}, '', '/training'); dispatchEvent(new PopStateEvent('popstate')); });
  await page.getByText(/Development & practice/).click();
  await expect(page.getByText('Pressure-management programme', { exact: false }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start project', exact: true })).toBeDisabled();
  expect((await saved(page)).careerDepth?.stories[0].status).toBe('resolved');
});

test('calendar approval executes entry and travel only within the user budget', async ({ page }) => {
  let state = createStarterState();
  const event = getNextEligibleTournament(state)!;
  state = { ...state, currentDate: plusDays(event.startDate, -14), player: { ...state.player, cash: 20000 }, careerDepth: { ...depthOf(state), nextSettlementDate: plusDays(event.startDate, -7) } };
  await open(page, '/calendar', state);
  await page.getByText(/Season strategy & commitments/).click();
  await page.getByLabel(`Approve ${event.name}`, { exact: true }).check();
  await page.getByLabel('Spending ceiling', { exact: true }).fill('3000');
  await page.getByLabel('Minimum cash reserve', { exact: true }).fill('500');
  await page.getByRole('button', { name: 'Approve six-week schedule' }).click();
  await page.getByRole('button', { name: 'Handle next entry & travel' }).click();
  await expect.poll(async () => Boolean((await saved(page)).travel.bookings[event.id])).toBe(true);
  const snapshot = await saved(page);
  expect(snapshot.travel.bookings[event.id].preparation).toBeUndefined();
  expect(snapshot.careerDepth?.schedule?.spent).toBeLessThanOrEqual(3000);
  const cash = snapshot.player.cash;
  await page.getByRole('button', { name: 'Handle next entry & travel' }).click();
  expect((await saved(page)).player.cash).toBe(cash);
});

for (const viewport of [{ width: 1920, height: 1080 }, { width: 1280, height: 720 }, { width: 768, height: 1024 }]) {
  test(`career controls fit ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await open(page, '/training');
    await page.getByText(/Development & practice/).click();
    await page.getByLabel('Development project', { exact: true }).selectOption('safety');
    await page.getByRole('button', { name: 'Start project', exact: true }).click();
    await expect.poll(async () => (await saved(page)).careerDepth?.project?.kind).toBe('safety');
    await page.getByRole('button', { name: 'Cancel project', exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: 'Cancel project', exact: true })).toBeVisible();
    await page.screenshot({ path: `artifacts/career-depth-training-${viewport.width}.png` });
    await page.evaluate(() => { history.pushState({}, '', '/calendar'); dispatchEvent(new PopStateEvent('popstate')); });
    await page.getByText(/Season strategy & commitments/).click();
    await page.getByRole('button', { name: 'Reserve commitment', exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: 'Reserve commitment', exact: true })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}
