import { expect, test } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { initialAttributeHistory, recordAttributeHistory } from '../src/game/attributeHistory';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';

for (const width of [1280,390]) test('attribute comparisons and reload at '+width+'px',async({page})=>{
  let state=createStarterState();state.currentDate='2024-05-11';state.attributes.technical['Long Potting']=40;state.attributeHistory=initialAttributeHistory(state);
  for(const [date,value] of [['2025-05-11',50],['2025-11-11',60],['2026-02-11',70],['2026-05-11',80]] as const) state=recordAttributeHistory({...state,currentDate:date,attributes:{...state.attributes,technical:{...state.attributes.technical,'Long Potting':value}}});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width,height:844});
  await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('attribute-fixture')){localStorage.setItem(key,value);sessionStorage.setItem('attribute-fixture','1')}},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
  const open=async()=>{await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();await page.evaluate(()=>{history.pushState({},'','/player/attributes');dispatchEvent(new PopStateEvent('popstate'))})};
  await open();
  const row=page.getByTestId('attribute-Long Potting');
  for(const [label,delta] of [['Since start','+40'],['3 months','+10'],['6 months','+20'],['12 months','+30'],['24 months','+40']] as const){await page.getByRole('button',{name:label,exact:true}).click();await expect(row).toContainText(delta)}
  await page.getByRole('button',{name:'All',exact:true}).click();await expect(row).toContainText('+40');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.reload();await page.getByRole('button',{name:/Continue Career/}).click();await page.evaluate(()=>{history.pushState({},'','/player/attributes');dispatchEvent(new PopStateEvent('popstate'))});
  await expect(row).toContainText('+40');expect((await readCareerSave(page)).attributeHistory!.careerStart!.attributes.technical['Long Potting']).toBe(40);
  expect(errors).toEqual([]);
});

test('recover year-one attributes from an older save without restoring old gameplay',async({page})=>{
  const old=createStarterState();old.attributeHistory=undefined;old.attributes.technical['Long Potting']=40;old.trainingCondition.seasonStartAttributes.technical['Long Potting']=35;
  const state=structuredClone(old);state.currentDate='2026-06-01';state.attributes.technical['Long Potting']=60;state.trainingCondition.seasonStartAttributes.technical['Long Potting']=60;
  // An older season baseline is no longer present in the current save.
  old.season='2025/26';
  await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('recovery-fixture')){localStorage.setItem(key,value);sessionStorage.setItem('recovery-fixture','1')}},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
  await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();await page.evaluate(()=>{history.pushState({},'','/player/attributes');dispatchEvent(new PopStateEvent('popstate'))});
  await expect(page.getByTestId('attribute-coverage')).toContainText('Partial history');
  const before=await readCareerSave(page);
  await page.getByLabel('Older career save').setInputFiles({name:'older.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(old))});
  await expect(page.getByRole('status')).toContainText('Earlier attribute history recovered');
  await expect(page.getByTestId('attribute-Long Potting')).toContainText('+25');
  const after=await readCareerSave(page);
  expect({...after,attributeHistory:undefined}).toEqual({...before,attributeHistory:undefined});
});
