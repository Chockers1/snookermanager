import { expect, test } from '@playwright/test';
import { createStarterState, getNextEligibleTournament } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';

for (const cause of ['chalk','cash'] as const) test(`calendar explains ${cause} and opens its solution without entering`, async ({page})=>{
 const state=createStarterState();state.tournaments=state.tournaments.map(t=>({...t,status:'Available'}));
 const event=getNextEligibleTournament(state)!;
 if(cause==='chalk') state.equipment.chalkStock[state.equipment.currentChalkId!]=0;
 else state.player.cash=-100;
 await page.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
 await page.evaluate(id=>{history.pushState({},'', '/calendar?tournament='+encodeURIComponent(id));dispatchEvent(new PopStateEvent('popstate'));},event.id);
 const label=cause==='chalk'?'Buy or equip chalk':'Open finances & club work';
 await expect(page.getByRole('link',{name:label+' →'})).toBeVisible();
 await page.getByRole('link',{name:label+' →'}).click();
 await expect(page).toHaveURL(cause==='chalk'?/equipment\/chalk-tips/:/finance/);
 const after=await readCareerSave(page);expect(after.player.cash).toBe(state.player.cash);
 expect(after.tournaments.find(t=>t.id===event.id)?.status).not.toBe('Entered');
});

test('training preview reports relevant fractional gains without overflowing its card',async({page})=>{
 const state=createStarterState();state.trainingAppliedWeek=-1;state.health.activeIssue=null;
 state.tournaments=state.tournaments.map(t=>({...t,status:'Skipped'}));
 await page.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
 await page.evaluate(()=>{history.pushState({},'', '/training');dispatchEvent(new PopStateEvent('popstate'));});
 await page.getByRole('button',{name:/Safety & Tactical/}).click();
 const card=page.locator('section').filter({has:page.getByRole('heading',{name:'Expected Development'})});
 await expect(card).toContainText('Safety Play');
 await expect(card).not.toContainText(/\d\.\d{3,}/);
 expect(await card.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
});

test('inbox entry explains an empty chalk stock and links directly to restocking',async({page})=>{
 const state=createStarterState();state.tournaments=state.tournaments.map(t=>({...t,status:'Available'}));const event=getNextEligibleTournament(state)!;
 state.equipment.chalkStock[state.equipment.currentChalkId!]=0;
 state.inbox=[{id:'entry-blocked',sender:'Tournament Office',subject:event.name+' entry',preview:'Review your entry.',priority:'High',date:'Today',read:false,tournamentReference:{id:event.id,startDate:event.startDate}}];
 await page.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
 await page.evaluate(()=>{history.pushState({},'', '/inbox?message=entry-blocked');dispatchEvent(new PopStateEvent('popstate'));});
 await expect(page.getByRole('link',{name:'Buy or equip chalk →'})).toBeVisible();
 await page.getByRole('button',{name:'Buy or equip chalk',exact:true}).click();await expect(page).toHaveURL(/equipment\/chalk-tips/);
});

test('finance offers a clearly priced emergency return when debt prevents ordinary travel',async({page})=>{
 const state=createStarterState();state.player.cash=-500;state.tournaments=state.tournaments.map(t=>({...t,status:'Skipped'}));
 const {realismOf}=await import('../src/game/realism');const {routeBetween}=await import('../src/game/realism/travel');
 state.realism={...realismOf(state),home:'Britain',location:'Berlin',journeys:{}};const fare=Math.round(45+routeBetween('Berlin','Britain').distanceKm*.065);
 await page.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
 await page.evaluate(()=>{history.pushState({},'', '/finance');dispatchEvent(new PopStateEvent('popstate'));});
 await page.getByRole('button',{name:/Current location · Berlin · home Britain/}).click();
 await expect(page.getByText('The full fare is added to your negative balance.',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:/Emergency return to Britain/}).click();
 await expect.poll(async()=>(await readCareerSave(page)).player.cash,{timeout:30000}).toBe(-500-fare);
});
