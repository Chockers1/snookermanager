import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {encodeCareerSave,decodeCareerSave} from '../src/game/saveStorage';
const source=process.argv[2],label=process.argv[3]??'50';
if(!source)throw new Error('Pass a raw career snapshot path. Uses isolated browser storage.');
const original=JSON.parse(fs.readFileSync(source,'utf8'));
const browser=await chromium.launch();
try {
 const page=await browser.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4174');
 const result=await page.evaluate(async({payload})=>{
  const storage=await import(/* @vite-ignore */'/src/game/saveStorage.ts');
  const archive=await import(/* @vite-ignore */'/src/game/careerArchive.ts');
  await storage.prepareCareerStorage();
  const original=JSON.parse(await storage.decodeCareerSaveAsync(payload));
  const start=performance.now();const compact=await archive.archiveCareerHistory(original);const convertedMs=performance.now()-start;
  const portable=await archive.materializeCareerHistory(compact);
  const again=await archive.archiveCareerHistory(compact);if(again!==compact)throw new Error('Archive conversion was not idempotent.');
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('snooker-career-saves-v1',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  const entries=await new Promise<Array<[string,string]>>((resolve,reject)=>{const tx=db.transaction('entries','readonly'),store=tx.objectStore('entries'),keys=store.getAllKeys(),values=store.getAll();tx.oncomplete=()=>resolve(keys.result.map((key,i)=>[String(key),values.result[i]]));tx.onerror=()=>reject(tx.error)});db.close();
  return {compact:storage.encodeCareerSave(compact),portable:storage.encodeCareerSave(portable),entries,convertedMs};
 },{payload:encodeCareerSave(original)});
 assert.deepStrictEqual(JSON.parse(decodeCareerSave(result.portable)),original);
 assert.equal(errors.length,0,errors.join('\n'));
 const out=path.resolve('artifacts/career-v012');fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,`archive-${label}-bundle.json`),JSON.stringify({payload:result.compact,entries:result.entries}));
 fs.writeFileSync(path.join(out,`archive-${label}-save.json`),decodeCareerSave(result.compact));
 const report={source,lossless:true,rawBefore:Buffer.byteLength(JSON.stringify(original)),rawAfter:Buffer.byteLength(decodeCareerSave(result.compact)),compressedActive:result.compact.length,archiveChunks:result.entries.length,archiveBytes:result.entries.reduce((n,[,v])=>n+v.length,0),migrationMs:result.convertedMs,errors};
 fs.writeFileSync(path.join(out,`archive-${label}-verification.json`),JSON.stringify(report,null,2));console.log(report);
}finally{await browser.close()}
