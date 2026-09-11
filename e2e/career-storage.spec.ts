import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
import {encodeCareerSave} from '../src/game/saveStorage';

async function blank(page:Page){
 await page.route('**/storage-probe.html',r=>r.fulfill({contentType:'text/html',body:'<title>Storage test</title>'}));
 await page.goto('/storage-probe.html');
}
test('migrates legacy saves once, preserves unrelated settings and reloads durable entries',async({page})=>{
 await blank(page);
 const result=await page.evaluate(async()=>{
  const path='/src/game/saveStorage.ts',api=await import(path);
  localStorage.setItem(api.ACTIVE_SAVE_KEY,'original');localStorage.setItem(api.SAVE_SLOT_PREFIX+'old','named');localStorage.setItem('unrelated-setting','keep');
  await api.prepareCareerStorage();
  await api.commitCareerStorage([[api.ACTIVE_SAVE_KEY,'updated']]);
  localStorage.setItem(api.ACTIVE_SAVE_KEY,'stale');await api.prepareCareerStorage();
  return {active:api.readCareerStorage(api.ACTIVE_SAVE_KEY),slot:await api.readSavedCareer(api.SAVE_SLOT_PREFIX+'old'),legacy:localStorage.getItem(api.ACTIVE_SAVE_KEY),setting:localStorage.getItem('unrelated-setting')};
 });
 expect(result).toEqual({active:'updated',slot:'named',legacy:null,setting:'keep'});
 await page.reload();expect(await page.evaluate(async()=>{const p='/src/game/saveStorage.ts',api=await import(p);await api.prepareCareerStorage();return api.readCareerStorage(api.ACTIVE_SAVE_KEY);})).toBe('updated');
});
test('aborted migration leaves original bytes available for retry',async({page})=>{
 await blank(page);
 const result=await page.evaluate(async()=>{
  const path='/src/game/saveStorage.ts',api=await import(path);localStorage.setItem(api.ACTIVE_SAVE_KEY,'original');
  const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw new DOMException('Full','QuotaExceededError')};
  let error='';try{await api.prepareCareerStorage()}catch(e){error=(e as Error).message}finally{IDBObjectStore.prototype.put=put}
  const preserved=localStorage.getItem(api.ACTIVE_SAVE_KEY);await api.prepareCareerStorage();return {error,preserved,retry:api.readCareerStorage(api.ACTIVE_SAVE_KEY)};
 });
 expect(result.error).toContain('Original saves are preserved');expect(result.preserved).toBe('original');expect(result.retry).toBe('original');
});
test('a failed slot transaction leaves every previous value intact and deletion is atomic',async({page})=>{
 await blank(page);
 const result=await page.evaluate(async()=>{
  const path='/src/game/saveStorage.ts',api=await import(path);await api.prepareCareerStorage();
  const a=api.ACTIVE_SAVE_KEY,index=api.SAVE_SLOT_INDEX_KEY,slot=api.SAVE_SLOT_PREFIX+'new';await api.commitCareerStorage([[a,'previous'],[index,'old index']]);
  const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,key){if(key===index)throw new DOMException('Full','QuotaExceededError');return put.call(this,value,key)};
  let error='';try{await api.commitCareerStorage([[slot,'new'],[a,'new'],[index,'new index']])}catch(e){error=(e as Error).message}finally{IDBObjectStore.prototype.put=put}
  const preserved={active:api.readCareerStorage(a),index:api.readCareerStorage(index),slot:await api.readSavedCareer(slot)};
  await api.commitCareerStorage([[slot,'copy']]);await api.commitCareerStorage([[slot,null]]);return {error,preserved,deleted:await api.readSavedCareer(slot)};
 });
 expect(result.error).toContain('previous save is preserved');expect(result.preserved).toEqual({active:'previous',index:'old index',slot:null});expect(result.deleted).toBeNull();
});
test('long career can create a named copy and load it after a browser reload',async({page})=>{
 test.setTimeout(240000);
 const source=process.env.LONG_CAREER_SAVE;
 test.skip(!source || !fs.existsSync(source),'Set LONG_CAREER_SAVE to a real audit checkpoint');
 const started=Date.now();
 const state=JSON.parse(fs.readFileSync(source!,'utf8')),payload=encodeCareerSave(state);
 await blank(page);
 const result=await page.evaluate(async ({payload,metadata})=>{
  const p='/src/game/saveStorage.ts',api=await import(p);await api.prepareCareerStorage();
  await api.commitCareerStorage([[api.SAVE_SLOT_PREFIX+'long-copy',payload],[api.ACTIVE_SAVE_KEY,payload],[api.ACTIVE_SAVE_SLOT_KEY,'long-copy'],[api.SAVE_SLOT_INDEX_KEY,JSON.stringify([{id:'long-copy',name:'Long career',...metadata,updatedAt:new Date().toISOString()}])]]);
  return {matches:(await api.readSavedCareer(api.SAVE_SLOT_PREFIX+'long-copy'))===payload,legacy:localStorage.getItem(api.ACTIVE_SAVE_KEY),length:payload.length};
 },{payload,metadata:{playerName:state.player.fullName,date:state.currentDate,season:state.season}});
 expect(result.matches).toBe(true);expect(result.legacy).toBeNull();
 await page.reload();expect(await page.evaluate(async payload=>{const p='/src/game/saveStorage.ts',api=await import(p);await api.prepareCareerStorage();return api.readCareerStorage(api.ACTIVE_SAVE_KEY)===payload && await api.readSavedCareer(api.SAVE_SLOT_PREFIX+'long-copy')===payload;},payload)).toBe(true);
 await page.goto('/');await page.getByRole('button',{name:/Continue Career/}).click();
 await expect(page.locator('#main-content')).toBeVisible({timeout:90000});
 await expect(page.getByText('Saving…',{exact:true})).toBeHidden({timeout:90000});
 const review=page.getByRole('button',{name:'Close review',exact:true});if(await review.isVisible())await review.click();
 await page.evaluate(()=>{history.pushState({},'', '/saves');dispatchEvent(new PopStateEvent('popstate'))});
 await page.getByLabel('Save slot name').fill('Long career UI copy');await page.getByRole('button',{name:'Create Copy',exact:true}).click();
 await expect(page.getByRole('status').filter({hasText:'Created and switched'})).toBeVisible({timeout:90000});
 await expect(page.getByText('Saving…',{exact:true})).toBeHidden({timeout:90000});
 await page.reload();await page.getByRole('button',{name:/Continue Career/}).click();
 await expect(page.locator('#main-content')).toBeVisible({timeout:90000});
 await expect(page.getByText('Saving…',{exact:true})).toBeHidden({timeout:90000});
 const restored=await page.evaluate(async()=>{const p='/src/game/saveStorage.ts',api=await import(p);const raw=await api.readSavedCareer(api.SAVE_SLOT_PREFIX+api.readActiveSaveSlotId());const s=JSON.parse(api.decodeCareerSave(raw));return {player:s.player.fullName,date:s.currentDate,season:s.season};});
 expect(restored).toEqual({player:state.player.fullName,date:state.currentDate,season:state.season});
 console.log(JSON.stringify({longCareerStorage:{source,characters:result.length,utf16Bytes:result.length*2,indexedDB:true,namedCopy:true,reload:true,elapsedSeconds:(Date.now()-started)/1000}}));
});

test('old recovery database upgrades without listing full payloads or changing their bytes',async({page})=>{
 await blank(page);
 const result=await page.evaluate(async()=>{
  const legacy={id:'legacy',careerId:'career',reason:'Automatic',savedAt:'2026-09-01',player:'Audit',season:'2026/27',date:'2026-09-01',rank:20,matches:25,progress:'Between events',fingerprint:'old',checksum:123,payload:'preserved legacy bytes'};
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('snooker-career-recovery-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('snapshots',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  await new Promise<void>((resolve,reject)=>{const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').put(legacy);tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error)});db.close();
  const p='/src/game/recoverySaves.ts',api=await import(p);const summaries=await api.listRecoverySummaries();
  const getAll=IDBObjectStore.prototype.getAll;let payloadScans=0;
  IDBObjectStore.prototype.getAll=function(...args:Parameters<typeof getAll>){if(this.name==='snapshots')payloadScans++;return getAll.apply(this,args)};
  await api.listRecoverySummaries();const restored=await api.getRecoverySave('legacy');IDBObjectStore.prototype.getAll=getAll;
  return {summaries,payloadScans,payload:restored.payload};
 });
 expect(result.summaries).toHaveLength(1);expect(result.summaries[0]).not.toHaveProperty('payload');expect(result.payloadScans).toBe(0);expect(result.payload).toBe('preserved legacy bytes');
});

test('blocked recovery upgrade preserves old backups and succeeds after the other window closes',async({page})=>{
 await blank(page);
 const result=await page.evaluate(async()=>{
  const old=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('snooker-career-recovery-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('snapshots',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  const p='/src/game/recoverySaves.ts',api=await import(p);let error='';try{await api.listRecoverySummaries()}catch(e){error=(e as Error).message}
  old.close();const summaries=await api.listRecoverySummaries();return {error,count:summaries.length};
 });
 expect(result.error).toContain('another game window');expect(result.count).toBe(0);
});
