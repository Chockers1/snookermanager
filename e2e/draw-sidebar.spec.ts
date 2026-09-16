import { expect, test } from '@playwright/test';
import { bookTravelState, confirmTournamentPreparationState, continueToNextTournamentState, createStarterState, enterTournamentState, simulateTournamentMatchState } from '../src/hooks/useGameState';
import { getDefaultPreparationAllocations } from '../src/game/tournamentPreparation';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';

function completedFixture() {
  let state = createStarterState();
  const event = state.tournaments.find(t => t.name === 'Shanghai Masters')!;
  state = enterTournamentState(state, event.id);
  state = bookTravelState(state, event.id);
  state = confirmTournamentPreparationState(state, event.id, 'balanced', getDefaultPreparationAllocations(), []);
  state = continueToNextTournamentState(state);
  let seed = 90210;
  const original = Math.random;
  try {
    Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    state = simulateTournamentMatchState({ ...state, player: { ...state.player, confidence:25, fatigue:100 } }, event.id);
  } finally { Math.random = original; }
  expect(state.tournaments.find(t => t.id === event.id)?.status).toBe('Completed');
  if (state.firstWeekGuide) state.firstWeekGuide.dismissed = true;
  return {state, event};
}

for (const [width,height] of [[1920,1080],[1366,768],[1280,720],[390,844]]) {
  test(`completed draw sidebar fits at ${width}x${height}`, async ({page}) => {
    const {state,event}=completedFixture();
    await page.setViewportSize({width,height});
    await page.addInitScript(({key,value}) => localStorage.setItem(key,value),{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
    await page.goto('/');
    await page.getByRole('button',{name:/Continue Career/}).click();
    await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();
    await page.evaluate(id => {history.pushState({},'','/tournaments/draw?tournament='+id);dispatchEvent(new PopStateEvent('popstate'));}, event.id);
    const sidebar=page.getByLabel('Draw outlook and navigation');
    await expect(sidebar.getByRole('heading',{name:'Current Position'})).toBeVisible();
    for (const tab of ['Summary','Opponents']) {
      await sidebar.getByRole('tab',{name:tab,exact:true}).click();
      if (width >= 1280) {
        expect(await page.locator('main').evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
        expect(await sidebar.locator('.draw-outlook-panel,.draw-opponent-card').evaluateAll(els => els.filter(el => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1).map(el => el.className))).toEqual([]);
        expect(await sidebar.evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
        await expect(sidebar.getByRole('button',{name:'Back to Dashboard',exact:true})).toBeInViewport();
        await expect(sidebar.getByRole('button',{name:'View Rankings',exact:true})).toBeInViewport();
      }
      expect(await page.locator('main').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      await page.screenshot({path:`artifacts/draw-sidebar/${width}x${height}-${tab}.png`,fullPage:true});
    }
    await expect(sidebar.locator('.draw-opponent-card')).toHaveCount(4);
    await expect(sidebar.locator('.draw-opponent-card a').first()).toHaveAttribute('href',/players\//);
    await sidebar.getByRole('tab',{name:'Opponents',exact:true}).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(sidebar.getByRole('heading',{name:'Current Position'})).toBeVisible();
    if (width === 1366) {
      await page.evaluate(() => {localStorage.setItem('snooker-accessibility-v1',JSON.stringify({textScale:130}));dispatchEvent(new Event('snooker-accessibility'));});
      await expect(page.locator('html')).toHaveAttribute('data-text-scale','130');
      expect(await page.locator('main').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    }
    await sidebar.getByRole('button',{name:'View Rankings',exact:true}).click();
    await expect(page).toHaveURL(/rankings/);
  });
}
