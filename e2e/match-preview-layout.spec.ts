import {expect,test} from '@playwright/test';
import {betweenMatchFixture} from '../test-support/betweenMatchFixture';
import {resolveTestDecisions} from '../test-support/resolveTestDecisions';
import {ACTIVE_SAVE_KEY,encodeCareerSave} from '../src/game/saveStorage';
import {ACCESSIBILITY_KEY} from '../src/game/accessibility';
import {readCareerSave} from './read-career-save';
for(const [width,height,scale] of [[1920,1080,100],[1366,768,130],[1280,720,100],[390,844,100]])test(`match preview workspace fits ${width} at ${scale}%`,async({page})=>{
 const state=resolveTestDecisions(betweenMatchFixture().state);state.firstWeekGuide={version:1,dismissed:true,completed:[],skipped:[]};
 await page.setViewportSize({width,height});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({key,value,accessibility,scale})=>{localStorage.setItem(key,value);localStorage.setItem(accessibility,JSON.stringify({textScale:scale,reducedMotion:true}));},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state),accessibility:ACCESSIBILITY_KEY,scale});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();
 await page.evaluate(()=>{history.pushState({},'','/match/preview');dispatchEvent(new PopStateEvent('popstate'))});
 const tactics=page.getByTestId('tactical-plan');await expect(tactics).toBeVisible();
 for(const tab of ['Matchup','Scouting','Equipment & event']){
  await page.getByRole('tab',{name:tab,exact:true}).click();await expect(page.getByRole('tabpanel',{name:tab,exact:true})).toBeVisible();
  expect(await page.locator('main').evaluate(el=>el.scrollHeight<=el.clientHeight+2&&el.scrollWidth<=el.clientWidth+2)).toBe(true);
  await expect(page.getByRole('button',{name:'Start Match',exact:true})).toBeInViewport();await expect(tactics).toBeInViewport();
  for(const option of ['Attack','Balanced','Safety','Composed','Confident','Counter','Steady','Quick'])await expect(tactics.getByRole('button',{name:option,exact:true})).toBeInViewport();
  expect((await page.locator('.preview-content').boundingBox())!.height).toBeGreaterThan(width<768?180:240);
  await expect(page.getByText('Danger zone',{exact:true})).toHaveCount(0);await expect(page.getByText('Personal match objectives',{exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:/Conditions & scouting/})).toHaveCount(0);
  if(tab==='Matchup' && width>=768){
   const analysis=page.locator('.preview-analysis');
   expect(await analysis.locator('.care-panel-body').evaluate(el=>el.scrollHeight<=el.clientHeight+2)).toBe(true);
   await expect(analysis.getByRole('article')).toHaveCount(3);
   for(const article of await analysis.getByRole('article').all()) await expect(article).toBeInViewport();
   await expect(analysis.getByRole('button',{name:'View comparison →'})).toBeInViewport();
  }
  if(tab==='Scouting'){
   const cards=page.locator('.preview-attribute-card');
   await expect(cards).toHaveCount(6);
   if(width>=768){
    for(const card of await cards.all()) await expect(card).toBeInViewport({ratio:1});
    for(const body of await page.locator('.preview-scouting .care-panel-body').all()){
     const overflow=await body.evaluate(el=>({vertical:el.scrollHeight-el.clientHeight,horizontal:el.scrollWidth-el.clientWidth}));
     expect(overflow.vertical).toBeLessThanOrEqual(2);expect(overflow.horizontal).toBeLessThanOrEqual(2);
    }
   }
   expect(await page.locator('.preview-scouting').evaluate(el=>el.scrollWidth<=el.clientWidth+2)).toBe(true);
  }
  await page.screenshot({path:`artifacts/preview-redesign-${width}-${tab.replaceAll(' ','-')}.png`});
 }
 await tactics.getByRole('button',{name:'Safety',exact:true}).click();await tactics.getByRole('button',{name:'Counter',exact:true}).click();await tactics.getByRole('button',{name:'Quick',exact:true}).click();
 await page.getByRole('tab',{name:'Matchup',exact:true}).focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:'Scouting',exact:true})).toHaveAttribute('aria-selected','true');
 await expect(tactics.getByRole('button',{name:'Safety',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Start Match',exact:true}).click();await expect(page).toHaveURL(/\/match\/live$/);
 await expect.poll(async()=> (await readCareerSave(page)).liveMatch?.tacticalPlan).toBe('Safety');
 const live=(await readCareerSave(page)).liveMatch!;expect(live.mentalFocus).toBe('Counter');expect(live.tempo).toBe('Quick');expect(errors).toEqual([]);
});
