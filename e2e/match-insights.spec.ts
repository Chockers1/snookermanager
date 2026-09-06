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
  await expect(page.getByRole('region',{name:'Personal match objectives'})).toBeVisible();
  await page.locator('summary').filter({hasText:'Tactical & scheduling advice'}).click();
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
