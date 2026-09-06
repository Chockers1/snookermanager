import { test, expect } from '@playwright/test';
import { createNewCareerState, createStarterState, enterTournamentState, bookTravelState, confirmTournamentPreparationState } from '../src/hooks/useGameState';
import { createPlayerIdentitySeed, createPlayerSliderCatalog, createPlayerBackgroundCatalog } from '../src/data/gameContent';
import { getDefaultPreparationAllocations } from '../src/game/tournamentPreparation';
import { reconcileRealism } from '../src/game/realism';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
function amateur() {
  const state = createNewCareerState({ fullName: createPlayerIdentitySeed.name, nationality: 'NZL', age: 18, handedness: 'Right-handed', cueStyle: createPlayerIdentitySeed.cueStyle, playingStyle: createPlayerIdentitySeed.playingStyle, personalityArchetype: createPlayerIdentitySeed.personalityArchetype, sliders: createPlayerSliderCatalog.map(s => ({ ...s })), backgroundId: createPlayerBackgroundCatalog[0].id, startingLevelId: 'start-q-school' });
  state.player.cash=100000; state.equipment=createStarterState().equipment; return state;
}
test('New Zealand Q Tour shows groups and updates the table after a match',async({page})=>{
  let state=amateur(); const event=state.tournaments.find(t=>t.id==='pc-29')!; state.tournaments=[event];
  state=enterTournamentState(state,event.id); state=bookTravelState(state,event.id); state=confirmTournamentPreparationState(state,event.id,'balanced',getDefaultPreparationAllocations(),[]); state=reconcileRealism({...state,currentDate:event.startDate});
  await page.setViewportSize({width:1440,height:1000});
  await page.addInitScript(({key,save})=>localStorage.setItem(key,save),{key:ACTIVE_SAVE_KEY,save:encodeCareerSave(state)});
  await page.goto('/'); await page.getByRole('button',{name:/Continue Career/}).click();
  await page.evaluate(()=>{history.pushState({},'', '/tournaments/hub');dispatchEvent(new PopStateEvent('popstate'));});
  const groups=page.getByRole('region',{name:'Group standings and fixtures'});
  await expect(groups).toContainText('0 of 4 matches');
  await expect(page.getByText(/Six months of regional residence required/)).toBeVisible();
  await page.getByRole('button',{name:'Quick Sim',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Match Review'})).toBeVisible();
  await expect(page.getByRole('region',{name:'Group standings and fixtures'})).toContainText('1 of 4 matches');
  await page.screenshot({path:'test-results/pathway-nz-groups.png',fullPage:true});
});
test('rankings separate regional Q Tour, Q School and seniors lists',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message)); const state=amateur();
  await page.addInitScript(({key,save})=>localStorage.setItem(key,save),{key:ACTIVE_SAVE_KEY,save:encodeCareerSave(state)});
  await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
  await page.evaluate(()=>{history.pushState({},'', '/rankings');dispatchEvent(new PopStateEvent('popstate'));});
  await page.getByRole('button',{name:'Q Tour Ranking',exact:true}).click();
  await page.getByLabel('Pathway standings').selectOption('Asia Pacific');
  await expect(page.getByLabel('Pathway standings')).toHaveValue('Asia Pacific');
  await page.getByRole('button',{name:'Q School OOM',exact:true}).click();
  await page.getByLabel('Pathway standings').selectOption('Q School Asia');
  await page.getByRole('button',{name:'Senior Ranking',exact:true}).click();
  await page.getByLabel('Pathway standings').selectOption('Race to the Crucible');
  await expect(page.getByText(/Recorded results only/)).toBeVisible();
  await page.screenshot({path:'test-results/pathway-rankings.png',fullPage:true});expect(errors).toEqual([]);
});
