import {expect,test} from '@playwright/test';
import {createStarterState} from '../src/hooks/useGameState';
import {ACTIVE_SAVE_KEY,encodeCareerSave} from '../src/game/saveStorage';
import {ACCESSIBILITY_KEY} from '../src/game/accessibility';
import {readCareerSave} from './read-career-save';
import {supportedConfidence} from '../src/game/confidenceSystem';
for (const [width,height,scale] of [[1920,1080,100],[1366,768,130],[1280,720,100],[390,844,100]]) test(`care workspaces fit at ${width} and ${scale}%`,async({page})=>{
 const state=createStarterState();state.firstWeekGuide={version:1,dismissed:true,completed:[],skipped:[]};
 await page.setViewportSize({width,height});const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(({key,value,accessibility,scale})=>{localStorage.setItem(key,value);localStorage.setItem(accessibility,JSON.stringify({textScale:scale,reducedMotion:true}));},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state),accessibility:ACCESSIBILITY_KEY,scale});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
 await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();
 for(const [route,tabs] of [['mental',['Overview','Recovery plans','Trends']],['health',['Overview','Treatments','History']]] as const){
  await page.evaluate(route=>{history.pushState({},'',`/${route}`);dispatchEvent(new PopStateEvent('popstate'))},route);
  for(const tab of tabs){
   await page.getByRole('tab',{name:tab,exact:true}).click();
   await expect(page.getByRole('tabpanel',{name:tab,exact:true})).toBeVisible();
   expect(await page.locator('main').evaluate(el=>el.scrollHeight<=el.clientHeight+2&&el.scrollWidth<=el.clientWidth+2)).toBe(true);
   await expect(page.locator('.wellbeing-footer')).toBeInViewport();
   if(route==='health' && tab==='Overview' && width>=768){
    for(const body of await page.locator('.health-overview .care-panel-body').all()){
     const dimensions=await body.evaluate(el=>({content:el.scrollHeight,available:el.clientHeight}));
     expect(dimensions.content).toBeLessThanOrEqual(dimensions.available+2);
    }
    await expect(page.getByRole('button',{name:'Adjust training',exact:true})).toBeInViewport();
    await expect(page.getByRole('button',{name:/^(Review|View) treatment options$/})).toBeInViewport();
   }
   if(route==='mental' && tab==='Overview' && width>=768){
    for(const body of await page.locator('.mental-overview .care-panel-body').all()){
     const dimensions=await body.evaluate(el=>({content:el.scrollHeight,available:el.clientHeight}));
     expect(dimensions.content).toBeLessThanOrEqual(dimensions.available+2);
     for(const stat of await body.locator('.care-stat-pair strong').all()) await expect(stat).toBeInViewport();
    }
    await expect(page.getByRole('button',{name:'Choose a recovery plan'})).toBeInViewport();
    await expect(page.getByRole('button',{name:'Open training',exact:true})).toBeInViewport();
   }
   for(const metric of await page.locator('.wellbeing-metrics article').all()){const card=await metric.boundingBox(),value=await metric.locator('strong').boundingBox();expect(value!.x).toBeGreaterThanOrEqual(card!.x);expect(value!.x+value!.width).toBeLessThanOrEqual(card!.x+card!.width);}
   expect(await page.getByRole('tabpanel').innerText()).not.toMatch(/\d+\.\d{3,}/);
   await page.screenshot({path:`artifacts/${route}-redesign-${width}-${tab.replaceAll(' ','-')}.png`});
  }
  await page.getByRole('tab',{name:'Overview',exact:true}).focus();await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab',{name:tabs[1],exact:true})).toHaveAttribute('aria-selected','true');
 }
 expect(errors).toEqual([]);
});
for(const route of ['mental','health'])test(`${route} selected recovery applies its displayed effects once`,async({page})=>{
 const state=createStarterState();state.firstWeekGuide={version:1,dismissed:true,completed:[],skipped:[]};state.player.fatigue=36;state.player.confidence=61.25;state.trainingCondition.strain=22;state.trainingCondition.burnout=12;state.player.cash=1000;state.recoveryPlanAvailableOn=undefined;state.health.treatmentReviewOn=undefined;
 await page.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();
 await page.evaluate(route=>{history.pushState({},'',`/${route}`);dispatchEvent(new PopStateEvent('popstate'))},route);
 await page.getByRole('tab',{name:route==='mental'?'Recovery plans':'Treatments',exact:true}).click();
 if(route==='health')await page.getByRole('button',{name:/Physio Treatment/}).click();
 await page.getByRole('button',{name:route==='mental'?'Apply selected plan':'Apply treatment',exact:true}).click();
 await expect(page.getByRole('button',{name:/Review on /})).toBeDisabled();
 const saved=await readCareerSave(page);expect(saved.currentDate).toBe(state.currentDate);
 expect(saved.player.fatigue).toBe(route==='mental'?26:27);expect(saved.player.cash).toBe(route==='mental'?1000:820);
 if(route==='mental')expect(saved.player.confidence).toBe(supportedConfidence(state.player.confidence,6));else expect(saved.trainingCondition.strain).toBe(0);
});
