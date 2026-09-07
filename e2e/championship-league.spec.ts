import { test, expect, type Page } from '@playwright/test';
import { createStarterState, enterTournamentState, bookTravelState, confirmTournamentPreparationState, startLiveMatchState, finalizeLiveMatch, type GameState } from '../src/hooks/useGameState';
import { getDefaultPreparationAllocations } from '../src/game/tournamentPreparation';
import { reconcileRealism } from '../src/game/realism';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';
function fixture() {
  let state=createStarterState();state.player.cash=100000;
  const event=state.tournaments.find(t=>t.id==='pc-52')!;state.tournaments=[event];
  state=enterTournamentState(state,event.id);state=bookTravelState(state,event.id);
  state=confirmTournamentPreparationState(state,event.id,'balanced',getDefaultPreparationAllocations(),[]);
  return reconcileRealism({...state,currentDate:event.startDate});
}
async function open(page:Page,state:GameState,route='/tournaments/hub') {
  await page.addInitScript(({key,save})=>{if(!sessionStorage.getItem('groups-seeded')) {localStorage.setItem(key,save);sessionStorage.setItem('groups-seeded','1');}},{key:ACTIVE_SAVE_KEY,save:encodeCareerSave(state)});
  await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
  await page.evaluate(url=>{history.pushState({},'',url);dispatchEvent(new PopStateEvent('popstate'));},route);
}
test('group standings update after quick sim and survive reload',async({page})=>{
  const state=fixture();await page.setViewportSize({width:1440,height:1000});await open(page,state);
  const panel=page.getByRole('region',{name:'Group standings and fixtures'});
  await expect(page.getByRole('heading',{name:'Groups and Fixtures'})).toBeVisible();
  await expect(panel.getByLabel('Group',{exact:true}).locator('option')).toHaveCount(32);
  await expect(panel).toContainText('0 of 3 matches');
  await page.getByRole('button',{name:'Quick Sim',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Match Review'})).toBeVisible();
  await expect(page.getByRole('region',{name:'Group standings and fixtures'})).toContainText('1 of 3 matches');
  await expect(page.getByText('Match complete · your tournament continues')).toBeVisible();
  await page.screenshot({path:'test-results/championship-group-result.png',fullPage:true});
  const saved=await readCareerSave(page);expect(saved.tournamentProgress.completedRounds).toHaveLength(1);
  await page.reload();await page.getByRole('button',{name:/Continue Career/}).click();
  await page.evaluate(()=>{history.pushState({},'','/tournaments/hub');dispatchEvent(new PopStateEvent('popstate'));});
  await expect(page.getByRole('region',{name:'Group standings and fixtures'})).toContainText('1 of 3 matches');
  expect((await readCareerSave(page)).tournamentProgress.draw).toEqual(saved.tournamentProgress.draw);
  await page.screenshot({path:'test-results/championship-group-hub.png',fullPage:true});
});
test('a drawn match is shown as one point and the full draw offers every stage',async({page})=>{
  let state=fixture();state=startLiveMatchState(state,'pc-52');
  state=finalizeLiveMatch(state,{...state.liveMatch!,playerFrames:2,opponentFrames:2,status:'Completed'});
  await page.setViewportSize({width:390,height:844});await open(page,state,'/match/result');
  await expect(page.getByText('Match drawn · 1 point')).toBeVisible();
  await expect(page.getByRole('region',{name:'Group standings and fixtures'})).toContainText('1 point from 1 of 3 matches');
  await page.screenshot({path:'test-results/championship-group-mobile.png',fullPage:true});
  await page.evaluate(()=>{history.pushState({},'','/tournaments/draw');dispatchEvent(new PopStateEvent('popstate'));});
  await expect(page.getByRole('button',{name:'Full Draw',exact:true})).toBeVisible();
  await page.getByLabel('Group stage').selectOption('Stage Two Groups');
  await expect(page.getByLabel('Group stage')).toHaveValue('Stage Two Groups');
  await expect(page.getByText('Fixtures are drawn when the previous stage finishes.')).toBeVisible();
});
test('an existing unplayed knockout-shaped group draw upgrades on load',async({page})=>{
  const state=fixture();state.liveMatch=null;
  state.tournamentProgress.draw=state.tournamentProgress.draw.map(r=>({...r,matches:r.matches.slice(0,64).map(m=>({...m,group:undefined}))}));
  await open(page,state);
  await expect(page.getByRole('heading',{name:'Groups and Fixtures'})).toBeVisible();
  await expect(page.getByLabel('Group',{exact:true}).locator('option')).toHaveCount(32);
});
