import {expect,test} from '@playwright/test';
import {createStarterState,finishSeasonState} from '../src/hooks/useGameState';
import {ACTIVE_SAVE_KEY,encodeCareerSave} from '../src/game/saveStorage';
import {ACCESSIBILITY_KEY} from '../src/game/accessibility';
import {readCareerSave} from './read-career-save';
for(const completed of [false,true])for(const [width,height,scale] of [[1920,1080,100],[1366,768,130],[1280,720,100],[390,844,100]])test(`season review ${completed?'completed':'live'} fits ${width} at ${scale}%`,async({page})=>{
 test.setTimeout(90000);
 let state=createStarterState();state.firstWeekGuide={version:1,dismissed:true,completed:[],skipped:[]};
 if(completed){state.currentDate='2027-06-29';state.tournaments=state.tournaments.map(t=>({...t,status:'Skipped'}));state=finishSeasonState(state);expect(state.seasonReview?.pending).toBe(true);state.seasonReview!.popupDismissed=true;}
 await page.setViewportSize({width,height});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({key,value,accessibility,scale})=>{localStorage.setItem(key,value);localStorage.setItem(accessibility,JSON.stringify({textScale:scale,reducedMotion:true}));},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state),accessibility:ACCESSIBILITY_KEY,scale});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();await expect(page.getByRole('heading',{name:completed?'Season Review':'Upcoming & Recent Results',exact:true})).toBeVisible();
 await page.evaluate(()=>{history.pushState({},'','/season-review');dispatchEvent(new PopStateEvent('popstate'))});
 await expect(page.getByRole('heading',{name:'Season Review',exact:true})).toBeVisible();
 const before=await readCareerSave(page);
 if(completed&&before.seasonReview?.completedSeason.closingRankingLabel==='World Ranking'){
  const finalRank=before.seasonReview.finalRankings?.find(row=>row.playerName===before.player.fullName)?.ranking;
  if(finalRank)await expect(page.getByRole('region',{name:'Season summary'}).locator('article').filter({hasText:'Closing ranking'})).toContainText('#'+finalRank);
 }
 for(const tab of ['Overview','Results','Development','Around the tour','Next season']){
  await page.getByRole('tab',{name:tab,exact:true}).click();await expect(page.getByRole('tabpanel',{name:tab,exact:true})).toBeVisible();
  expect(await page.locator('main').evaluate(el=>el.scrollHeight<=el.clientHeight+2&&el.scrollWidth<=el.clientWidth+2)).toBe(true);
  await expect(page.getByRole('button',{name:completed?'Start New Season':'Finish Season',exact:true})).toBeInViewport();
  expect(await page.getByRole('tabpanel').innerText()).not.toMatch(/\d+\.\d{3,}/);
  if(tab==='Around the tour'&&completed){await expect(page.getByRole('heading',{name:'Final World Rankings',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Major Tournament Winners',exact:true})).toBeVisible();}
  await page.screenshot({path:`artifacts/season-redesign-${completed?'completed':'live'}-${width}-${tab.replaceAll(' ','-')}.png`});
 }
 await page.getByRole('tab',{name:'Overview',exact:true}).focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:'Results',exact:true})).toHaveAttribute('aria-selected','true');
 const after=await readCareerSave(page);expect(after.player.cash).toBe(before.player.cash);expect(after.currentDate).toBe(before.currentDate);expect(after.seasonReview).toEqual(before.seasonReview);
 expect(errors).toEqual([]);
});
