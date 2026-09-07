import { expect, test, type Page } from '@playwright/test';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { createStarterState, getNextEligibleTournament, enterTournamentState, bookTravelState, confirmTournamentPreparationState, continueToNextTournamentState, startLiveMatchState, finalizeLiveMatch } from '../src/hooks/useGameState';
import { getDefaultPreparationAllocations } from '../src/game/tournamentPreparation';
import { readCareerSave } from './read-career-save';
function ready() {
  let state = createStarterState(); const event=getNextEligibleTournament(state)!;
  state=enterTournamentState(state,event.id);state=bookTravelState(state,event.id);
  state=confirmTournamentPreparationState(state,event.id,'balanced',getDefaultPreparationAllocations(),[]);
  state=continueToNextTournamentState(state); return {state,event};
}
async function open(page:Page,state:ReturnType<typeof createStarterState>,route:string) {
  await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('insights-fixture')){localStorage.clear();localStorage.setItem(key,value);sessionStorage.setItem('insights-fixture','1')}},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
  await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
  await page.evaluate(route=>{history.pushState({},'',route);dispatchEvent(new PopStateEvent('popstate'))},route);
}
test('pre-match goals and coach approach carry into play and survive reload',async({page})=>{
  const {state}=ready();state.player.fatigue=70;
  await page.setViewportSize({width:1280,height:720});
  await open(page,state,'/match/preview');
  await expect(page.getByRole('group',{name:'Personal match objectives'})).toBeVisible();
  await page.locator('summary').filter({hasText:'Tactics & schedule'}).click();
  await expect(page.getByText('Suggested approach: Safety')).toBeVisible();
  await page.getByRole('button',{name:'Use coach’s approach'}).click();
  await page.getByRole('button',{name:'Start Match',exact:true}).click();
  await expect(page.getByLabel('Live personal objectives')).toBeVisible();
  const started=await readCareerSave(page);expect(started.liveMatch?.tacticalPlan).toBe('Safety');
  expect(started.liveMatch?.objectives?.length).toBeGreaterThan(0);
  await page.reload();await page.getByRole('button',{name:/Continue Career/}).click();
  expect((await readCareerSave(page)).liveMatch?.objectives).toEqual(started.liveMatch?.objectives);
});
test('post-match evidence and completed goals open a real training project on a phone',async({page})=>{
  const initial=ready(); const event=initial.event; let state=startLiveMatchState(initial.state,event.id);
  state=finalizeLiveMatch(state,{...state.liveMatch!,status:'Completed',playerFrames:state.liveMatch!.framesNeeded,opponentFrames:0,playerHighestBreak:100});
  await page.setViewportSize({width:390,height:844});await open(page,state,'/match/result');
  const review=page.getByRole('region',{name:'Match review and development'});
  await expect(review).toBeVisible();await expect(review.getByText(/Achieved ·/).first()).toBeVisible();
  await review.getByRole('button',{name:'Start recommended project'}).click();
  expect((await readCareerSave(page)).careerDepth?.project?.status).toBe('active');
  await expect(review.getByRole('button',{name:'Development project already active'})).toBeDisabled();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1)).toBe(true);
});

for (const width of [390, 1280]) test('live condition values follow interval recovery and frame play at ' + width, async ({ page }) => {
  const initial = ready();
  const state = startLiveMatchState(initial.state, initial.event.id);
  state.liveMatch = { ...state.liveMatch!, bestOf: 11, framesNeeded: 6, currentFrame: 5,
    playerFrames: 1, opponentFrames: 3, playerPoints: 0, opponentPoints: 0, currentBreak: 0,
    playerConfidence: 87.12, playerFatigue: 56.78, opponentConfidence: 72.34, opponentFatigue: 48.56, pressureValue: 35.34,
    sessions: { frames: [11], overnightAfter: [], completedBreaks: [] } };
  await page.setViewportSize({ width, height: 900 });
  await open(page, state, '/match/live');
  await page.getByRole('button', { name: /Mental reset/ }).click();
  const condition = page.getByLabel('Live player condition', { exact: true });
  await expect(condition).toContainText('89.12%');
  await expect(condition).toContainText('54.78%');
  await expect(condition).toContainText('32.34%');
  expect(await condition.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const opponentCondition = page.getByLabel('Live opponent condition', { exact: true });
  await expect(opponentCondition).toContainText('72.34%');
  await expect(opponentCondition).toContainText('46.56%');
  await expect(opponentCondition).toContainText('32.34%');
  expect(await opponentCondition.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.getByRole('button', { name: /Sim Frame/ }).click();
  await expect.poll(async () => (await readCareerSave(page)).liveMatch?.currentFrame).toBe(6);
  const live = (await readCareerSave(page)).liveMatch!;
  for (const [label, value] of [['Confidence', live.playerConfidence], ['Fatigue', live.playerFatigue], ['Match pressure', live.pressureValue]] as const) {
    await expect(condition.locator('div').filter({ has: page.locator('dt', { hasText: label }) })).toContainText(value.toFixed(2) + '%');
  }
  for (const [label, value] of [['Confidence', live.opponentConfidence], ['Fatigue', live.opponentFatigue], ['Match pressure', live.pressureValue]] as const) {
    await expect(opponentCondition.locator('div').filter({ has: page.locator('dt', { hasText: label }) })).toContainText(value.toFixed(2) + '%');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
