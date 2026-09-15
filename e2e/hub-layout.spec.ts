import {expect,test} from '@playwright/test';
import {createStarterState,enterTournamentState} from '../src/hooks/useGameState';
import {betweenMatchFixture} from '../test-support/betweenMatchFixture';
import {ACTIVE_SAVE_KEY,encodeCareerSave} from '../src/game/saveStorage';
import {ACCESSIBILITY_KEY} from '../src/game/accessibility';
for(const kind of ['knockout','groups'])for(const [width,height,scale] of [[1920,1080,100],[1366,768,130],[1280,720,100],[390,844,100]])test(`hub ${kind} fits ${width} at ${scale}%`,async({page})=>{
 let state=kind==='knockout'?betweenMatchFixture().state:createStarterState();
 if(kind==='groups'){const event=state.tournaments.find(t=>t.name==='Championship League Invitational')!;state=enterTournamentState(state,event.id);}
 state.firstWeekGuide={version:1,dismissed:true,completed:[],skipped:[]};
 await page.setViewportSize({width,height});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({key,value,accessibility,scale})=>{localStorage.setItem(key,value);localStorage.setItem(accessibility,JSON.stringify({textScale:scale,reducedMotion:true}));},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state),accessibility:ACCESSIBILITY_KEY,scale});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();
 await page.evaluate(()=>{history.pushState({},'','/tournaments/hub');dispatchEvent(new PopStateEvent('popstate'))});
 const primary=page.locator('.hub-play');await expect(primary).toBeVisible();
 for(const tab of ['Draw','Preparation','Match briefing','Event details']){
  await page.getByRole('tab',{name:tab,exact:true}).click();await expect(page.getByRole('tabpanel',{name:tab,exact:true})).toBeVisible();
  expect(await page.locator('main').evaluate(el=>el.scrollHeight<=el.clientHeight+2&&el.scrollWidth<=el.clientWidth+2)).toBe(true);
  await expect(primary).toBeInViewport();await expect(page.locator('.hub-workspace-footer')).toBeInViewport();
  if(tab==='Draw'){const canvas=page.locator('.hub-draw-canvas');expect((await canvas.boundingBox())!.height).toBeGreaterThan(width<768?100:230);await expect(kind==='groups'?page.getByRole('table',{name:'Group table'}):page.getByTestId('tournament-bracket')).toBeVisible();}
  if(tab==='Event details'){await page.getByText('Round rules and format',{exact:true}).click();await expect(page.getByText('Entry criteria',{exact:true})).toBeVisible();}
  await page.screenshot({path:`artifacts/hub-redesign-${kind}-${width}-${tab.replaceAll(' ','-')}.png`});
 }
 await page.getByRole('tab',{name:'Draw',exact:true}).focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:'Preparation',exact:true})).toHaveAttribute('aria-selected','true');
 expect(errors).toEqual([]);
});
