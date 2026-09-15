import { expect, test } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { initialAttributeHistory, recordAttributeHistory } from '../src/game/attributeHistory';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { ACCESSIBILITY_KEY } from '../src/game/accessibility';
import { readCareerSave } from './read-career-save';

for (const [width,height,scale] of [[1920,1080,100],[1366,768,100],[1280,720,130],[390,844,100]]) test('attribute comparisons and reload at '+width+'px',async({page})=>{
  let state=createStarterState();state.firstWeekGuide={version:1,dismissed:true,completed:[],skipped:[]};state.currentDate='2024-05-11';state.attributes.technical['Long Potting']=40;state.attributeHistory=initialAttributeHistory(state);
  for(const [date,value] of [['2025-05-11',50],['2025-11-11',60],['2026-02-11',70],['2026-05-11',80]] as const) state=recordAttributeHistory({...state,currentDate:date,attributes:{...state.attributes,technical:{...state.attributes.technical,'Long Potting':value}}});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height});
  await page.addInitScript(({key,value,scale,access})=>{if(!sessionStorage.getItem('attribute-fixture')){localStorage.setItem(key,value);localStorage.setItem(access,JSON.stringify({textScale:scale,reducedMotion:true}));sessionStorage.setItem('attribute-fixture','1')}},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state),scale,access:ACCESSIBILITY_KEY});
  const open=async()=>{await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();await page.evaluate(()=>{history.pushState({},'','/player/attributes');dispatchEvent(new PopStateEvent('popstate'))})};
  await open();
  const toolbar=page.getByRole('group',{name:'Attribute display controls',exact:true});
  const grouped=(await toolbar.getByRole('button',{name:'Grouped',exact:true}).boundingBox())!;
  for(const name of ['Since start','This season','3 months','6 months','12 months','24 months','Recover from older save']){
    const box=(await toolbar.getByRole('button',{name,exact:true}).boundingBox())!;
    expect(Math.abs(box.y-grouped.y)).toBeLessThanOrEqual(1);
    expect(box.height).toBe(grouped.height);
    if(width>=1000)expect(box.x+box.width).toBeLessThanOrEqual(width);
  }
  await page.screenshot({path:`artifacts/attributes-toolbar-grouped-${width}.png`});
  const row=page.getByTestId('attribute-Long Potting');
  for(const [label,delta] of [['Since start','+40'],['3 months','+10'],['6 months','+20'],['12 months','+30'],['24 months','+40']] as const){await page.getByRole('button',{name:label,exact:true}).click();await expect(row).toContainText(delta)}
  await page.getByRole('button',{name:'All',exact:true}).click();await expect(row).toContainText('+40');
  expect(await page.locator('main').evaluate(el=>el.scrollHeight<=el.clientHeight+2)).toBe(true);
  const box=(await page.getByTestId('attributes-page').boundingBox())!;expect(box.y+box.height).toBeLessThanOrEqual(height);
  await page.screenshot({path:`artifacts/attributes-toolbar-all-${width}.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.reload();await page.getByRole('button',{name:/Continue Career/}).click();await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();await page.evaluate(()=>{history.pushState({},'','/player/attributes');dispatchEvent(new PopStateEvent('popstate'))});
  await expect(row).toContainText('+40');expect((await readCareerSave(page)).attributeHistory!.careerStart!.attributes.technical['Long Potting']).toBe(40);
  expect(errors).toEqual([]);
});

test('recover year-one attributes from an older save without restoring old gameplay',async({page})=>{
  const old=createStarterState();old.attributeHistory=undefined;old.attributes.technical['Long Potting']=40;old.trainingCondition.seasonStartAttributes.technical['Long Potting']=35;
  const state=structuredClone(old);state.currentDate='2026-06-01';state.attributes.technical['Long Potting']=60;state.trainingCondition.seasonStartAttributes.technical['Long Potting']=60;
  // An older season baseline is no longer present in the current save.
  old.season='2025/26';
  await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('recovery-fixture')){localStorage.setItem(key,value);sessionStorage.setItem('recovery-fixture','1')}},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
  await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();await page.evaluate(()=>{history.pushState({},'','/player/attributes');dispatchEvent(new PopStateEvent('popstate'))});
  await expect(page.getByTestId('attribute-coverage')).toContainText('Partial history');
  const before=await readCareerSave(page);
  await page.getByLabel('Older career save').setInputFiles({name:'older.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(old))});
  await expect(page.getByRole('status')).toContainText('Earlier attribute history recovered');
  await expect(page.getByTestId('attribute-Long Potting')).toContainText('+25');
  const after=await readCareerSave(page);
  expect({...after,attributeHistory:undefined}).toEqual({...before,attributeHistory:undefined});
});


for (const width of [1366,390]) test('fractional attributes stay at two decimals in every view at '+width+'px',async({page})=>{
 const state=createStarterState();state.attributes.technical['Long Potting']=47;state.attributes.technical['Safety Play']=34;state.attributes.physical['Shoulder Health']=99.98;state.attributes.mental.Focus=90;
 state.attributeHistory=initialAttributeHistory(state);
 state.attributes.technical['Long Potting']=47.11653333333334;state.attributes.technical['Safety Play']=34.03986666666667;state.attributes.physical['Shoulder Health']=100;state.attributes.mental.Focus=90.0828;
 await page.setViewportSize({width,height:900});
 await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('fraction-fixture')){localStorage.setItem(key,value);sessionStorage.setItem('fraction-fixture','1')}},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();await page.evaluate(()=>{history.pushState({},'','/player/attributes');dispatchEvent(new PopStateEvent('popstate'))});
 for(const view of ['Grouped','All']){
  await page.getByRole('button',{name:view,exact:true}).click();
  await expect(page.getByTestId('attribute-Long Potting').getByText('47.12',{exact:true})).toBeVisible();
  await expect(page.getByTestId('attribute-Long Potting').getByText('+0.12',{exact:true})).toBeVisible();
  await expect(page.getByTestId('attribute-Safety Play').getByText('+0.04',{exact:true})).toBeVisible();
  await expect(page.getByText(/\+0.26 gained/)).toBeVisible();
  await expect(page.getByRole('heading',{name:'Strengths',exact:true}).locator('..').getByText('100.00',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Development Gaps',exact:true}).locator('..').getByText('34.04',{exact:true})).toBeVisible();
  expect(await page.locator('#main-content').innerText()).not.toMatch(/\d+\.\d{3,}/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 const saved=await readCareerSave(page);expect(saved.attributes.technical['Long Potting']).toBe(47.11653333333334);
 await page.screenshot({path:`artifacts/career-v012/attributes-decimals-${width}.png`,fullPage:true});
 await page.evaluate(()=>{history.pushState({},'','/');dispatchEvent(new PopStateEvent('popstate'))});
 const training=page.getByRole('button',{name:/Training Week Overview/});
 const summary=page.getByRole('button',{name:/Attributes Summary/});
 await expect(training.getByText('47.12',{exact:true})).toBeVisible();
 await expect(summary.getByText('90.08',{exact:true})).toBeVisible();
 expect(await training.innerText()).not.toMatch(/\d+\.\d{3,}/);
 expect(await summary.innerText()).not.toMatch(/\d+\.\d{3,}/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:`artifacts/career-v012/dashboard-decimals-${width}.png`,fullPage:true});

});
