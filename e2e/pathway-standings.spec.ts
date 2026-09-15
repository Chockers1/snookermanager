import {expect,test} from '@playwright/test';
import {createStarterState,processRankingCalendar} from '../src/hooks/useGameState';
import {ACTIVE_SAVE_KEY,encodeCareerSave} from '../src/game/saveStorage';
for(const endOfSeason of [false,true])test('regional pathway standings '+(endOfSeason?'after all events':'before first events'),async({page})=>{
 const opening=createStarterState();
 const state=processRankingCalendar({...opening,seasonReview:null,currentDate:endOfSeason?'2027-06-29':'2026-08-12',tournaments:opening.tournaments.map(t=>({...t,status:'Skipped'}))});
 state.firstWeekGuide = {version:1,dismissed:true,completed:[],skipped:[]};
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
 await page.evaluate(()=>{history.pushState({},'','/rankings');dispatchEvent(new PopStateEvent('popstate'))});
 for(const [tab,regions] of [['Q Tour Ranking',['Europe','Asia Pacific','Middle East','Americas']],['Q School OOM',['Q School UK','Q School Asia']]] as const){
  await page.getByRole('button',{name:tab,exact:true}).click();
  for(const region of regions){
   await page.getByLabel('Pathway standings').selectOption(region);
   const table=page.getByRole('table').first();
   if(endOfSeason||region==='Asia Pacific'){
    await expect(table.getByRole('row')).not.toHaveCount(2);
    await expect(table.getByRole('link').first()).toBeVisible();
   }else{
    await expect(page.getByText(/No published standings yet/)).toBeVisible();
    await expect(page.getByLabel('Pathway standings')).toHaveValue(region);
    const first=table.getByRole('row').nth(1);await expect(first.getByRole('cell').nth(0)).toHaveText('—');await expect(first.getByRole('cell').nth(7)).toHaveText('0');
   }
  }
 }
 expect(errors).toEqual([]);
});
