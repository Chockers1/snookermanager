import {expect,test,type Page} from '@playwright/test';
import {createStarterState} from '../src/hooks/useGameState';
import {ACTIVE_SAVE_KEY,ACTIVE_SAVE_SLOT_KEY,encodeCareerSave} from '../src/game/saveStorage';
import {readCareerSave,readStoredCareerValue} from './read-career-save';
async function records(page:Page){return page.evaluate(async()=>{const path='/src/game/recoverySaves.ts';return (await import(path)).listRecoverySaves()})}
const navigate=(page:Page,path:string)=>page.evaluate(path=>{history.pushState({},'',path);dispatchEvent(new PopStateEvent('popstate'))},path);
test('rotating snapshots, corrupt backup rejection and restore as a separate copy',async({page})=>{
 test.setTimeout(120000);const state=createStarterState();state.seasonReview=null;const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();await expect.poll(async()=> (await records(page)).length).toBeGreaterThan(0);
 const oldSlot=await readStoredCareerValue(page,ACTIVE_SAVE_SLOT_KEY);const original=await readCareerSave(page);
 await page.evaluate(async({slot,payload})=>{const path='/src/game/recoverySaves.ts',storagePath='/src/game/saveStorage.ts';const api=await import(path),storage=await import(storagePath);const s=JSON.parse(payload);for(let i=1;i<=8;i++){s.currentDate='2026-09-'+String(i).padStart(2,'0');await api.storeRecoverySave(slot,storage.encodeCareerSave(s),'Automatic')}},{slot:oldSlot,payload:JSON.stringify(original)});
 expect((await records(page)).filter((r:{reason:string})=>r.reason==='Automatic')).toHaveLength(6);
 // A failed insertion must leave the existing rotation intact.
 const beforeFailure=(await records(page)).map((r:{id:string})=>r.id);
 const failure=await page.evaluate(async({slot,payload})=>{const path='/src/game/recoverySaves.ts',storagePath='/src/game/saveStorage.ts';const api=await import(path),storage=await import(storagePath);const s=JSON.parse(payload);s.currentDate='2026-09-30';const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw new DOMException('Full','QuotaExceededError')};try{await api.storeRecoverySave(slot,storage.encodeCareerSave(s),'Automatic');return ''}catch(e){return (e as Error).message}finally{IDBObjectStore.prototype.put=put}},{slot:oldSlot,payload:JSON.stringify(original)});
 expect(failure).toContain('Backup could not be saved');expect((await records(page)).map((r:{id:string})=>r.id)).toEqual(beforeFailure);
 await page.evaluate(async()=>{const db=await new Promise<IDBDatabase>((resolve)=>{const r=indexedDB.open('snooker-career-recovery-v1');r.onsuccess=()=>resolve(r.result)});await new Promise<void>((resolve)=>{const tx=db.transaction('snapshots','readwrite'),store=tx.objectStore('snapshots'),r=store.getAll();r.onsuccess=()=>{const latest=r.result.sort((a,b)=>b.savedAt.localeCompare(a.savedAt))[0];store.put({...latest,payload:latest.payload+'damage'})};tx.oncomplete=()=>resolve()});db.close()});
 await navigate(page,'/saves');await page.getByRole('tab',{name:'Automatic backups',exact:true}).click();const panel=page.getByRole('region',{name:'Save recovery'});await expect(panel.getByRole('button',{name:'Restore copy'})).toHaveCount(6);await panel.getByRole('button',{name:'Restore copy'}).first().click();await expect(panel.getByRole('status')).toContainText('integrity check');expect(await readStoredCareerValue(page,ACTIVE_SAVE_SLOT_KEY)).toBe(oldSlot);
 await panel.getByRole('button',{name:'Restore copy'}).nth(1).click();await expect(panel.getByRole('status')).toContainText('new career copy');expect(await readStoredCareerValue(page,ACTIVE_SAVE_SLOT_KEY)).not.toBe(oldSlot);expect((await readCareerSave(page)).currentDate).toBe('2026-09-07');expect(await readStoredCareerValue(page,'snooker-career-manager-slot-'+oldSlot)).toBeTruthy();await expect.poll(async()=>(await records(page)).some((r:{reason:string})=>r.reason==='Before restore')).toBe(true);expect(errors).toEqual([]);
});
test('season rollover preserves the completed old season before publishing the new one',async({page})=>{
 test.setTimeout(150000);const state=createStarterState();state.currentDate='2027-04-17';state.tournaments=state.tournaments.map(t=>({...t,status:'Skipped'}));
 await page.addInitScript(({key,value})=>{if(!sessionStorage.getItem('rollover-fixture')){localStorage.setItem(key,value);sessionStorage.setItem('rollover-fixture','1')}},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();await expect.poll(async()=>(await records(page)).length).toBeGreaterThan(0);
 await page.evaluate(()=>{const original=IDBObjectStore.prototype.put;Object.defineProperty(window,'restoreRecoveryWrites',{value:()=>{IDBObjectStore.prototype.put=original},configurable:true});IDBObjectStore.prototype.put=function(value,key){if(value?.reason==='Before season rollover')throw new DOMException('Full','QuotaExceededError');return original.call(this,value,key)}});
 await page.getByRole('button',{name:'Finish Season',exact:true}).click();const dialog=page.getByRole('dialog',{name:'2026/27 Season Review'});await expect(dialog).toBeVisible({timeout:60000});await expect(page.getByText(/Check Save Manager before closing/)).toBeAttached();expect((await readCareerSave(page)).season).toBe('2026/27');expect((await readCareerSave(page)).currentDate).toBe('2027-04-17');await page.evaluate(()=>Reflect.get(window,'restoreRecoveryWrites')());await dialog.getByRole('button',{name:'Start New Season'}).click();await expect.poll(async()=>(await readCareerSave(page)).season,{timeout:60000}).toBe('2027/28');
 const saved=await records(page);const pre=saved.find((r:{reason:string})=>r.reason==='Before season rollover');expect(pre).toMatchObject({season:'2026/27',date:'2027-06-30'});await navigate(page,'/saves');await page.getByRole('tab',{name:'Automatic backups',exact:true}).click();await expect(page.getByRole('region',{name:'Save recovery'})).toContainText('Before season rollover');
 await page.reload();await page.getByText('Restore automatic backup',{exact:true}).click();await expect(page.getByRole('region',{name:'Save recovery'})).toContainText('2027-06-30');
});

test('background saves preserve training and inbox reads made during compression',async({page})=>{
 test.setTimeout(120000);const state=createStarterState();state.trainingAppliedWeek=-1;state.health.activeIssue=null;
 state.tournaments=state.tournaments.map(t=>({...t,status:'Skipped'}));
 await page.addInitScript(({key,value})=>{
  if(!sessionStorage.getItem('async-fixture')){localStorage.setItem(key,value);sessionStorage.setItem('async-fixture','1')}
  const NativeWorker=window.Worker;
  window.Worker=class extends NativeWorker{postMessage(message:unknown){setTimeout(()=>super.postMessage(message),1500)}};
 },{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
 await expect(page.getByText('Saving…',{exact:true})).toBeVisible();
 await expect(page.getByText('Saving…',{exact:true})).toBeHidden({timeout:60000});
 await navigate(page,'/training');await page.getByRole('button',{name:/Safety & Tactical/}).click();
 await page.getByRole('button',{name:'Apply Plan',exact:true}).click();
 await expect(page.getByText('Saving…',{exact:true})).toBeVisible();
 await navigate(page,'/inbox');await page.getByRole('button',{name:'Mark All Read',exact:true}).click();
 await navigate(page,'/saves');await expect(page.getByRole('button',{name:'Create Copy',exact:true})).toBeDisabled();
 await expect(page.getByText('Saving…',{exact:true})).toBeHidden({timeout:60000});
 await expect(page.getByRole('button',{name:'Create Copy',exact:true})).toBeEnabled();
 const saved=await readCareerSave(page);expect(saved.trainingAppliedWeek).toBe(saved.week);expect(saved.inbox.every(message=>message.read)).toBe(true);
 await page.reload();await page.getByRole('button',{name:/Continue Career/}).click();
 const loaded=await readCareerSave(page);expect(loaded.trainingAppliedWeek).toBe(saved.trainingAppliedWeek);expect(loaded.inbox.every(message=>message.read)).toBe(true);
});


test('interrupted compression warns on refresh and keeps the last committed career after forced closure', async ({page,context}) => {
 test.setTimeout(120000);
 const state=createStarterState();state.trainingAppliedWeek=-1;state.health.activeIssue=null;
 await context.addInitScript(({key,value})=>{
  if(!localStorage.getItem(key))localStorage.setItem(key,value);
  const Native=window.Worker;
  window.Worker=class extends Native{postMessage(message:unknown){setTimeout(()=>super.postMessage(message),5000)}};
 },{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
 await readCareerSave(page);
 const committed=await readStoredCareerValue(page,ACTIVE_SAVE_KEY);
 await navigate(page,'/training');await page.getByRole('button',{name:/Safety & Tactical/}).click();await page.getByRole('button',{name:'Apply Plan',exact:true}).click();
 await expect(page.getByText('Saving…',{exact:true})).toBeVisible();
 const warning=page.waitForEvent('dialog');void page.reload().catch(()=>null);
 const dialog=await warning;expect(dialog.type()).toBe('beforeunload');await dialog.dismiss();
 expect(await readStoredCareerValue(page,ACTIVE_SAVE_KEY)).toBe(committed);
 await page.close({runBeforeUnload:false});
 const reopened=await context.newPage();await reopened.goto('/');
 expect(await readStoredCareerValue(reopened,ACTIVE_SAVE_KEY)).toBe(committed);
 await reopened.getByRole('button',{name:/Continue Career/}).click();
 expect((await readCareerSave(reopened)).trainingAppliedWeek).toBe(-1);
 await reopened.close();
});

test('damaged active save exposes recovery without overwriting its original bytes', async ({page}) => {
 await page.addInitScript(key=>localStorage.setItem(key,'damaged-save'),ACTIVE_SAVE_KEY);
 await page.goto('/');await expect(page.getByRole('alert')).toContainText('original is preserved');
 await page.getByRole('button',{name:/Continue Career/}).click();
 await expect(page.getByText('Your career starts here.')).toBeVisible();
 expect(await readStoredCareerValue(page,ACTIVE_SAVE_KEY)).toBe('damaged-save');
 await page.getByText('Restore automatic backup',{exact:true}).click();
 await expect(page.getByRole('region',{name:'Save recovery'})).toBeVisible();
});
