import fs from 'node:fs';
import path from 'node:path';
import {chromium, type Page, type Locator} from '@playwright/test';
import {encodeCareerSave,decodeCareerSave} from '../src/game/saveStorage';
import type {GameState} from '../src/hooks/useGameState';
const source=process.argv[2];if(!source)throw new Error('Supply a save JSON file');
const label=process.argv[3]??'long-save';const base=process.env.PERFORMANCE_BASE_URL??'http://127.0.0.1:4175';
const state=JSON.parse(decodeCareerSave(fs.readFileSync(source,'utf8'))) as GameState;
// Only dismiss the review overlay in the isolated fixture; preserve the career records.
state.seasonReview=null;
const player=[...state.worldPlayers].sort((a,b)=>b.seasons.length-a.seasons.length)[0];
const out=path.resolve('artifacts/release-readiness',label);fs.mkdirSync(out,{recursive:true});
const payload=encodeCareerSave(state);
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;const samples:{rate:number;pass:number;action:string;ms:number}[]=[];const errors:string[]=[];
const clickTime=async(locator:Locator)=>locator.evaluate(el=>new Promise<number>(resolve=>{const start=performance.now();(el as HTMLElement).click();requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(performance.now()-start)));}));
async function route(page:Page,url:string,heading:string){const start=Date.now();await page.evaluate(url=>{history.pushState({},'',url);dispatchEvent(new PopStateEvent('popstate'));},url);if(heading==='Inbox')await page.getByLabel('Inbox messages').waitFor();else await page.getByRole('heading',{name:heading,exact:true}).first().waitFor();await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));return Date.now()-start;}
try{
for(const rate of (process.env.PERFORMANCE_RATES??'1,4').split(',').map(Number))for(let pass=1;pass<=Number(process.env.PERFORMANCE_PASSES??3);pass++){
 browser=await chromium.launch();
 const context=await browser.newContext({viewport:{width:1366,height:768}});const page=await context.newPage();page.setDefaultTimeout(180000);
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate});
 await page.route('**/performance-storage.html',r=>r.fulfill({contentType:'text/html',body:'<title>Isolated performance storage</title>'}));
 await page.goto(base+'/performance-storage.html');
 await page.evaluate(async payload=>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('snooker-career-saves-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('entries');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  await new Promise<void>((resolve,reject)=>{const tx=db.transaction('entries','readwrite');tx.objectStore('entries').put(payload,'snooker-career-manager-state-v1');tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error)});db.close();
 },payload);
 const record=(action:string,ms:number)=>{samples.push({rate,pass,action,ms:Math.round(ms)});fs.writeFileSync(path.join(out,'samples.json'),JSON.stringify({samples,errors},null,2));console.log(label,rate,pass,action,Math.round(ms));};
 if(process.env.PERFORMANCE_PROFILE==='1'){await cdp.send('Profiler.enable');await cdp.send('Profiler.start');}
 const cold=Date.now();await page.goto(base);await page.getByRole('button',{name:/Continue Career/}).waitFor();record('Cold launcher ready',Date.now()-cold);const launch=Date.now();await page.getByRole('button',{name:/Continue Career/}).click();await page.locator('#main-content').waitFor();await page.getByText('Your career starts here.',{exact:true}).waitFor({state:'hidden'});await page.getByText('Upcoming & Recent Results',{exact:true}).waitFor();await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));record('Continue saved career',Date.now()-launch);record('Cold navigation to career ready',Date.now()-cold);
 if(process.env.PERFORMANCE_PROFILE==='1'){const {profile}=await cdp.send('Profiler.stop');fs.writeFileSync(path.join(out,`cold-${rate}-${pass}.cpuprofile`),JSON.stringify(profile));}
 record('Open inbox',await route(page,'/inbox','Inbox'));
 const messages=page.getByLabel('Inbox messages').getByRole('button');
 for(let i=0;i<Math.min(4,await messages.count());i++){
 if(i===0&&process.env.PERFORMANCE_PROFILE==='1'){await cdp.send('Profiler.enable');await cdp.send('Profiler.start');}
 record('Select inbox message '+(i+1),await clickTime(messages.nth(i)));
 if(i===0&&process.env.PERFORMANCE_PROFILE==='1'){const {profile}=await cdp.send('Profiler.stop');fs.writeFileSync(path.join(out,`inbox-${rate}-${pass}.cpuprofile`),JSON.stringify(profile));}
 }
 record('Open calendar',await route(page,'/calendar','Tournament Calendar'));
 record('Calendar month view',await clickTime(page.getByRole('button',{name:'Month view',exact:true})));
 record('Calendar next month',await clickTime(page.getByRole('button',{name:'Next month',exact:true})));
 record('Calendar previous month',await clickTime(page.getByRole('button',{name:'Previous month',exact:true})));
 record('Calendar list view',await clickTime(page.getByRole('button',{name:'List view',exact:true})));
 record('Open season planning',await clickTime(page.getByRole('button',{name:/Season strategy & commitments/})));
 await page.getByRole('dialog',{name:'Plan your season and commitments'}).waitFor();
 const planStart=Date.now();await page.getByLabel('Planner tour',{exact:true}).selectOption('All tours');await page.getByLabel('Planning view',{exact:true}).selectOption('season');await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));record('Planning all tours and season priorities',Date.now()-planStart);
 await page.getByRole('button',{name:'Close editor',exact:true}).click();
 record('Open rankings',await route(page,'/rankings','Rankings'));
 for(const name of ['One-Year Ranking','Youth Ranking','Amateur Ranking','Q Tour Ranking','Q School OOM','Senior Ranking','World Ranking'])record(name+' tab',await clickTime(page.getByRole('button',{name,exact:true})));
 record('Open qualification races',await clickTime(page.getByRole('button',{name:/Qualification races · defending earnings/})));
 await page.getByRole('dialog',{name:'Qualification and tour survival'}).waitFor();await page.getByRole('button',{name:'Close editor',exact:true}).click();
 record('Open player history',await route(page,'/players/'+encodeURIComponent(player.id),player.playerName));
 const select=page.getByLabel('Player history season');const values=await select.locator('option').evaluateAll(options=>options.map(o=>(o as HTMLOptionElement).value));
 if(values.length>1){const start=Date.now();await select.selectOption(values.at(-1)!);await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));record('Select oldest player season',Date.now()-start);}
 if(rate===1&&pass===1)await page.screenshot({path:path.join(out,'player-history.png'),fullPage:true});
 if(process.env.PERFORMANCE_LIFE_PANELS==='1'){
  record('Open team records',await route(page,'/career/teams','Club & national pairs'));
  record('Open training',await route(page,'/training','Build This Week'));
  record('Open form assessment',await clickTime(page.getByRole('button',{name:/Form assessment/})));
  await page.getByRole('dialog',{name:'Form evidence and recovery'}).waitFor();await page.getByRole('button',{name:'Close editor',exact:true}).click();
  record('Open staff',await route(page,'/staff/coaches','Coach Market'));
  record('Open staff movement',await clickTime(page.getByRole('button',{name:/Staff ambitions, renewals/})));
  await page.getByRole('dialog',{name:'Staff commitments and movement'}).waitFor();await page.getByRole('button',{name:'Close editor',exact:true}).click();
 }
 await page.getByText('Saving…',{exact:true}).waitFor({state:'hidden',timeout:180000});
 const warnings=await page.getByText(/Check Save Manager before closing|Autosave failed|could not be saved|storage is full|not saved:/i).allTextContents();errors.push(...warnings);
 await context.storageState({path:path.join(out,'browser-state.json')});await cdp.detach();await context.close();await browser.close();browser=undefined;
 fs.writeFileSync(path.join(out,'samples.json'),JSON.stringify({samples,errors},null,2));
 console.log(label,rate,pass,'complete',JSON.stringify(samples.filter(s=>s.rate===rate&&s.pass===pass)));
}
}finally{await browser?.close();}
const summary=[...new Set(samples.map(s=>s.rate+':'+s.action))].map(key=>{const rows=samples.filter(s=>s.rate+':'+s.action===key);const times=rows.map(r=>r.ms).sort((a,b)=>a-b);return{rate:rows[0].rate,action:rows[0].action,medianMs:times[Math.floor(times.length/2)],maxMs:times.at(-1)};});
const result={source:path.basename(source),date:state.currentDate,seasons:new Set(Object.values(state.rollingRankings?.events??{}).map(e=>e.season)).size,events:Object.keys(state.rollingRankings?.events??{}).length,bytes:fs.statSync(source).size,mode:'Production Chromium; 1366x768; 1x and simulated 4x CPU slowdown, not physical laptop certification',samples,summary,errors:[...new Set(errors)]};
fs.writeFileSync(path.join(out,'performance-results.json'),JSON.stringify(result,null,2));fs.writeFileSync(path.join(out,'performance-report.md'),['# Long-save performance',result.mode,`Save: ${result.source}; ${result.seasons} seasons; ${result.events} events.`, '', '| CPU slowdown | Action | Median ms | Max ms |','| --- | --- | ---: | ---: |',...summary.map(r=>`| ${r.rate}x | ${r.action} | ${r.medianMs} | ${r.maxMs} |`),'',`Errors: ${result.errors.join('; ')||'None'}`].join('\n'));console.log(JSON.stringify(result.summary));if(errors.length)process.exitCode=1;
