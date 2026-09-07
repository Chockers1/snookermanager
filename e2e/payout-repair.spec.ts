import {expect,test,type Page} from '@playwright/test';
import {payoutRepairFixture} from '../test-support/payoutRepairFixture';
import {ACTIVE_SAVE_KEY,encodeCareerSave} from '../src/game/saveStorage';
import {readCareerSave} from './read-career-save';
const records=(page:Page)=>page.evaluate(async()=>{const path='/src/game/recoverySaves.ts';return (await import(path)).listRecoverySaves()});
test('backs up original awards before publishing the repair and does not repay on reload',async({page})=>{
 test.setTimeout(120000);const {state}=payoutRepairFixture(), original=encodeCareerSave(state);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('prize-fixture')){localStorage.setItem(key,value);sessionStorage.setItem('prize-fixture','1')}},{key:ACTIVE_SAVE_KEY,value:original});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
 await expect.poll(async()=>(await records(page)).filter((r:{reason:string})=>r.reason==='Before prize correction').length).toBe(1);
 const backup=(await records(page)).find((r:{reason:string})=>r.reason==='Before prize correction');expect(backup.payload).toBe(original);
 await expect.poll(async()=>(await readCareerSave(page)).payoutRepair?.version).toBe(1);
 const saved=await readCareerSave(page);expect(saved.player.cash).toBe(state.player.cash-26000);
 await page.reload();await page.getByRole('button',{name:/Continue Career/}).click();
 await expect.poll(async()=>(await readCareerSave(page)).player.cash).toBe(saved.player.cash);
 expect((await readCareerSave(page)).finance.ledger).toEqual(saved.finance.ledger);
 await page.evaluate(()=>{history.pushState({},'', '/inbox');dispatchEvent(new PopStateEvent('popstate'))});
 await page.getByText('Prize awards and rankings corrected',{exact:true}).first().click();await expect(page.getByRole('heading',{name:'Prize awards and rankings corrected'})).toBeVisible();
 await expect(page.getByText(/Previous award £56,000/)).toBeVisible();expect(errors).toEqual([]);
});
test('failed correction backup leaves the original active save intact',async({page})=>{
 test.setTimeout(120000);const {state}=payoutRepairFixture(), original=encodeCareerSave(state);
 await page.addInitScript(({key,value})=>{localStorage.setItem(key,value);const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,key){if(value?.reason==='Before prize correction')throw new DOMException('Full','QuotaExceededError');return put.call(this,value,key)}},{key:ACTIVE_SAVE_KEY,value:original});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
 await expect(page.getByText(/Check Save Manager before closing/)).toBeAttached();
 expect(await page.evaluate(key=>localStorage.getItem(key),ACTIVE_SAVE_KEY)).toBe(original);
 expect((await records(page)).filter((r:{reason:string})=>r.reason==='Before prize correction')).toHaveLength(0);
});
