import fs from 'node:fs';
import path from 'node:path';
import {chromium} from '@playwright/test';
import {encodeCareerSave,decodeCareerSave,ACTIVE_SAVE_KEY,SAVE_SLOT_PREFIX} from '../src/game/saveStorage';
const source=process.argv[2],out=process.argv[3];
if(!source||!out)throw new Error('Supply save and report output');
const state=JSON.parse(decodeCareerSave(fs.readFileSync(source,'utf8'))),payload=encodeCareerSave(state);
const browser=await chromium.launch();
try{
 const page=await browser.newPage();
 await page.route('**/*',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Isolated save storage audit</title>'}));
 await page.goto('http://century-audit.test/');
 const result=await page.evaluate(({payload,active,slot})=>{
  const writes=[];for(const key of [active,slot]){try{localStorage.setItem(key,payload);writes.push({key,success:true,readBackMatches:localStorage.getItem(key)===payload});}catch(e){writes.push({key,success:false,error:(e as Error).name,message:(e as Error).message});}}
  return {characters:payload.length,utf16Bytes:payload.length*2,writes,keys:localStorage.length,userAgent:navigator.userAgent};
 },{payload,active:ACTIVE_SAVE_KEY,slot:SAVE_SLOT_PREFIX+'century-probe'});
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({source,date:state.currentDate,isolated:true,...result},null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
