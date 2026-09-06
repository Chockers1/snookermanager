import { expect,test } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { initializeRollingRankings } from '../src/game/rollingRankings';
import { ACTIVE_SAVE_KEY,encodeCareerSave } from '../src/game/saveStorage';
for(const viewport of [{width:1920,height:920},{width:1280,height:720},{width:390,height:844}])test('ranking cards contain their content at '+viewport.width,async({page})=>{
 const state=initializeRollingRankings(createStarterState());
 const due=new Date(Date.parse(state.currentDate+'T12:00:00Z')+10*86400000).toISOString().slice(0,10);
 const key='layout-pending:'+state.currentDate;
 state.rollingRankings!.events[key]={key,tournamentId:'layout-pending',name:'English Open',season:state.season,completedOn:due,ranking:true,applied:false,bracket:[]};
 state.rollingRankings!.earnings.push({id:key+':human',eventKey:key,playerName:state.player.fullName,amount:16500,earnedOn:due,expiresOn:'2030-01-01',season:state.season});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize(viewport);
 await page.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();await page.evaluate(()=>{history.pushState({},'','/rankings');dispatchEvent(new PopStateEvent('popstate'))});
 await page.getByRole('button',{name:'World Ranking',exact:true}).click();
 await expect(page.getByRole('region',{name:'Pending ranking credit'})).toBeVisible();
 const insights=page.getByLabel('Ranking insights');
 for(const title of ['Ranking Movement','Next Target','Recent Ranking Sources','Event Scenarios','Form']){
 const heading=insights.getByRole('heading',{name:title,exact:true});await heading.scrollIntoViewIfNeeded();await expect(heading).toBeVisible();
 const card=heading.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " card ")][1]');
 expect(await card.evaluate(el=>el.scrollHeight<=el.clientHeight+2),title+' overflows vertically').toBe(true);
 expect(await card.evaluate(el=>el.scrollWidth<=el.clientWidth+2),title+' overflows horizontally').toBe(true);
 }
 const form=insights.getByRole('heading',{name:'Form',exact:true}).locator('..');
 expect(await form.evaluate(el=>{const box=el.getBoundingClientRect();return [...el.querySelectorAll('span')].every(dot=>dot.getBoundingClientRect().bottom<=box.bottom)})).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:'artifacts/rankings-cards-'+viewport.width+'.png',fullPage:true});expect(errors).toEqual([]);
});
