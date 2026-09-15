import {expect,test} from '@playwright/test';
import {createStarterState} from '../src/hooks/useGameState';
import {ACTIVE_SAVE_KEY,encodeCareerSave} from '../src/game/saveStorage';
import {ACCESSIBILITY_KEY} from '../src/game/accessibility';
import {readCareerSave} from './read-career-save';

for(const [width,height,scale] of [[1920,1080,100],[1366,768,130],[1280,720,100],[390,844,100]])test(`settings fits ${width} at ${scale}%`,async({page})=>{
 const state=createStarterState();state.firstWeekGuide={version:1,dismissed:true,completed:[],skipped:[]};delete state.difficulty;
 await page.setViewportSize({width,height});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({key,value,accessibility,scale})=>{localStorage.setItem(key,value);localStorage.setItem(accessibility,JSON.stringify({textScale:scale,reducedMotion:true}));},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state),accessibility:ACCESSIBILITY_KEY,scale});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();
 await page.evaluate(()=>{history.pushState({},'','/settings');dispatchEvent(new PopStateEvent('popstate'))});
 for(const tab of ['Display','Controls','Career','Support']){
  await page.getByRole('tab',{name:tab,exact:true}).click();await expect(page.getByRole('tabpanel',{name:tab,exact:true})).toBeVisible();
  expect(await page.locator('main').evaluate(el=>el.scrollHeight<=el.clientHeight+2&&el.scrollWidth<=el.clientWidth+2)).toBe(true);
  if(width>=768)for(const body of await page.locator('.settings-card-body').all()){
   const size=await body.evaluate(el=>({height:el.clientHeight,content:el.scrollHeight,width:el.clientWidth,contentWidth:el.scrollWidth}));
   expect(size.content,tab).toBeLessThanOrEqual(size.height+2);expect(size.contentWidth,tab).toBeLessThanOrEqual(size.width+2);
  }
  if(tab==='Career'){
   await expect(page.getByLabel('Career difficulty',{exact:true})).toContainText('Standard');await expect(page.getByRole('combobox',{name:'Career difficulty'})).toHaveCount(0);
   await expect(page.getByLabel('Career difficulty',{exact:true}).getByRole('radio')).toHaveCount(0);
  }
  await page.screenshot({path:`artifacts/settings-redesign-${width}-${tab}.png`});
 }
 await page.getByLabel('What went wrong?').fill('Keep this description between settings tabs.');
 await page.getByRole('tab',{name:'Display',exact:true}).click();await page.getByRole('tab',{name:'Support',exact:true}).click();await expect(page.getByLabel('What went wrong?')).toHaveValue('Keep this description between settings tabs.');
 expect(errors).toEqual([]);
});

for(const difficulty of ['Relaxed','Standard','Demanding'])test(`new career selects and retains locked ${difficulty} difficulty`,async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:/New Career/}).click();await page.locator('input').first().fill('Difficulty Test');
 for(let step=0;step<3;step++)await page.getByRole('button',{name:/Continue/}).click();
 await page.getByRole('radio',{name:difficulty,exact:true}).check();await expect(page.getByText('Choose carefully:',{exact:false})).toContainText('fixed for this career');
 await page.getByRole('button',{name:'Start Career',exact:true}).click();await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();
 const before=await readCareerSave(page);expect(before.difficulty).toBe(difficulty.toLowerCase());
 await page.reload();await page.getByRole('button',{name:/Continue Career/}).click();await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();
 await page.evaluate(()=>{history.pushState({},'','/settings');dispatchEvent(new PopStateEvent('popstate'))});await page.getByRole('tab',{name:'Career',exact:true}).click();
 const mode=page.getByLabel('Career difficulty',{exact:true});await expect(mode).toContainText(difficulty);await expect(mode).toContainText('Locked');await expect(mode.locator('select,input,button')).toHaveCount(0);
 const after=await readCareerSave(page);expect(after.difficulty).toBe(before.difficulty);expect(after.player.cash).toBe(before.player.cash);
});
