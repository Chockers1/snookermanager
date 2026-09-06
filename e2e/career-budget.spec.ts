import { expect,test } from '@playwright/test';
import {createStarterState} from '../src/hooks/useGameState';
import {ACTIVE_SAVE_KEY,encodeCareerSave} from '../src/game/saveStorage';
import {readCareerSave} from './read-career-save';
for(const width of [1280,390])test('cash recovery booking at '+width+'px',async({page})=>{
 const state=createStarterState();state.player.cash=-10;state.trainingAppliedWeek=null;
 await page.setViewportSize({width,height:844});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('budget-test')){localStorage.setItem(key,value);sessionStorage.setItem('budget-test','1');}},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
 await page.evaluate(()=>{history.pushState({},'','/finance');dispatchEvent(new PopStateEvent('popstate'));});
 await expect(page.getByText('Cash needs attention',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:/Book club work/}).click();
 await expect.poll(async()=> (await readCareerSave(page)).careerDepth?.commitments.filter(c=>c.kind==='club-work').length).toBe(1);
 expect((await readCareerSave(page)).player.cash).toBe(-10);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(errors).toEqual([]);
});
