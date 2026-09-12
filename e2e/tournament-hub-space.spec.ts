import { test, expect } from '@playwright/test';
import { resolveTestDecisions } from '../test-support/resolveTestDecisions';
import { betweenMatchFixture } from '../test-support/betweenMatchFixture';
import { finalizeLiveMatch, startLiveMatchState } from '../src/hooks/useGameState';
import { prepareBetweenMatchesState } from '../src/game/betweenMatches';
import { depthOf, plusDays } from '../src/game/careerDepth/shared';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';

for (const width of [1280, 1920, 390]) test(`busy semi-final hub preserves bracket space at ${width}`, async ({ page }) => {
  const initial = betweenMatchFixture();
  let state = initial.state;
  for (let i = 0; i < 5 && state.tournamentProgress.currentRound !== 'Semi Final'; i++) {
    state = startLiveMatchState(resolveTestDecisions(state), initial.event.id);
    if (!state.liveMatch) throw new Error(state.lastAction);
    state = finalizeLiveMatch(state, { ...state.liveMatch, playerFrames: state.liveMatch.framesNeeded, opponentFrames: 2, status: 'Completed' });
  }
  expect(state.tournamentProgress.currentRound).toBe('Semi Final');
  state = prepareBetweenMatchesState(state, 'review', initial.event.id);
  state.careerDepth = { ...depthOf(state), stories: [{ id: 'space-test-decision', kind: 'breakthrough', title: 'A breakthrough victory', evidence: 'A major win.', createdDate: state.currentDate, expiresDate: plusDays(state.currentDate, 7), status: 'pending', updates: [], matchCount: state.matches.length, trainingWeeks: 0 }] };
  await page.setViewportSize({ width, height: width === 1280 ? 720 : width === 390 ? 844 : 1080 });
  await page.addInitScript(({ key, save }) => localStorage.setItem(key, save), { key: ACTIVE_SAVE_KEY, save: encodeCareerSave(state) });
  await page.goto('/');
  await page.getByRole('button', { name: /Continue Career/ }).click();
  await page.evaluate(() => { history.pushState({}, '', '/tournaments/hub'); dispatchEvent(new PopStateEvent('popstate')); });
  const bracket = page.getByTestId('tournament-bracket');
  const preparation = page.locator('summary').filter({ hasText: 'Match preparation · Complete' });
  await expect(preparation).toBeVisible();
  await expect(page.getByRole('region', { name: 'Between-match preparation' })).not.toBeVisible();
  await expect(page.getByRole('link', { name: /Decision required/ })).toBeVisible();
  if (width >= 1280) {
    await expect(page.getByRole('button', { name: 'Resolve Inbox Decision' })).toBeInViewport();
    await expect(bracket).toBeInViewport();
    expect((await bracket.boundingBox())!.height).toBeGreaterThanOrEqual(270);
    expect(await page.locator('#main-content').evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
  }
  const height = (await bracket.boundingBox())!.height;
  await page.screenshot({ path: `test-results/hub-compact-${width}.png`, fullPage: true });
  await preparation.click();
  await expect(page.getByRole('region', { name: 'Between-match preparation' })).toContainText('Tactical review completed');
  await page.locator('summary').filter({ hasText: 'Match briefing · opponent & venue' }).click();
  await page.getByRole('button', { name: /Conditions & scouting/ }).click();
  await expect(page.getByRole('dialog', { name: 'Conditions and scouting evidence' })).toBeVisible();
  await page.getByRole('button', { name: 'Close editor' }).click();
  if (width >= 1280) expect((await bracket.boundingBox())!.height).toBeCloseTo(height, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
