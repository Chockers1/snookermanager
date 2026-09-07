import fs from 'node:fs';
import path from 'node:path';
import {chromium, type Page, type Locator} from '@playwright/test';
import {encodeCareerSave,decodeCareerSave,ACTIVE_SAVE_KEY} from '../src/game/saveStorage';
import type {GameState} from '../src/hooks/useGameState';
const source=process.argv[2];if(!source)throw new Error('Supply a save JSON file');
const label=process.argv[3]??'long-save';const base=process.env.PERFORMANCE_BASE_URL??'http://127.0.0.1:4175';
const state=JSON.parse(decodeCareerSave(fs.readFileSync(source,'utf8'))) as GameState;
// Only dismiss the review overlay in the isolated fixture; preserve the career records.
state.seasonReview=null;
const player=[...state.worldPlayers].sort((a,b)=>b.seasons.length-a.seasons.length)[0];
const out=path.resolve('artifacts/release-readiness',label);fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch();const samples:{rate:number;pass:number;action:string;ms:number}[]=[];const errors:string[]=[];
const clickTime=async(locator:Locator)=>locator.evaluate(el=>new Promise<number>(resolve=>{const start=performance.now();(el as HTMLElement).click();requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(performance.now()-start)));}));
async function route(page:Page,url:string,heading:string){const start=Date.now();await page.evaluate(url=>{history.pushState({},'',url);dispatchEvent(new PopStateEvent('popstate'));},url);await page.getByRole('heading',{name:heading,exact:true}).first().waitFor();await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));return Date.now()-start;}
try{
for(const rate of [1,4])for(let pass=1;pass<=3;pass++){
 const context=await browser.newContext({viewport:{width:1366,height:768}});const page=await context.newPage();page.setDefaultTimeout(180000);
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate});
 await page.addInitScript(({key,value})=>{if(!localStorage.getItem(key))localStorage.setItem(key,value);},{key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
 const record=(action:string,ms:number)=>samples.push({rate,pass,action,ms:Math.round(ms)});
 await page.goto(base);const launch=Date.now();await page.getByRole('button',{name:/Continue Career/}).click();await page.locator('#main-content').waitFor();await page.getByText('Your career starts here.',{exact:true}).waitFor({state:'hidden'});record('Continue saved career',Date.now()-launch);
 record('Open calendar',await route(page,'/calendar','Tournament Calendar'));
 record('Calendar month view',await clickTime(page.getByRole('button',{name:'Month view',exact:true})));
 record('Calendar next month',await clickTime(page.getByRole('button',{name:'Next month',exact:true})));
 record('Calendar previous month',await clickTime(page.getByRole('button',{name:'Previous month',exact:true})));
 record('Open rankings',await route(page,'/rankings','Rankings'));
 for(const name of ['One-Year Ranking','Youth Ranking','Amateur Ranking','Q Tour Ranking','Q School OOM','Senior Ranking','World Ranking'])record(name+' tab',await clickTime(page.getByRole('button',{name,exact:true})));
 record('Open player history',await route(page,'/players/'+encodeURIComponent(player.id),player.playerName));
 const select=page.getByLabel('Player history season');const values=await select.locator('option').evaluateAll(options=>options.map(o=>(o as HTMLOptionElement).value));
 if(values.length>1){const start=Date.now();await select.selectOption(values.at(-1)!);await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));record('Select oldest player season',Date.now()-start);}
 if(rate===1&&pass===1)await page.screenshot({path:path.join(out,'player-history.png'),fullPage:true});
 await page.getByText('Saving…',{exact:true}).waitFor({state:'hidden',timeout:180000});
 const warnings=await page.getByText(/Check Save Manager before closing|Autosave failed|could not be saved|storage is full|not saved:/i).allTextContents();errors.push(...warnings);
 await context.storageState({path:path.join(out,'browser-state.json')});await context.close();
 fs.writeFileSync(path.join(out,'samples.json'),JSON.stringify({samples,errors},null,2));
 console.log(label,rate,pass,'complete',JSON.stringify(samples.filter(s=>s.rate===rate&&s.pass===pass)));
}
}finally{await browser.close();}
const summary=[...new Set(samples.map(s=>s.rate+':'+s.action))].map(key=>{const rows=samples.filter(s=>s.rate+':'+s.action===key);const times=rows.map(r=>r.ms).sort((a,b)=>a-b);return{rate:rows[0].rate,action:rows[0].action,medianMs:times[Math.floor(times.length/2)],maxMs:times.at(-1)};});
const result={source:path.basename(source),date:state.currentDate,seasons:new Set(Object.values(state.rollingRankings?.events??{}).map(e=>e.season)).size,events:Object.keys(state.rollingRankings?.events??{}).length,bytes:fs.statSync(source).size,mode:'Production Chromium; 1366x768; 1x and simulated 4x CPU slowdown, not physical laptop certification',samples,summary,errors:[...new Set(errors)]};
fs.writeFileSync(path.join(out,'performance-results.json'),JSON.stringify(result,null,2));fs.writeFileSync(path.join(out,'performance-report.md'),['# Long-save performance',result.mode,`Save: ${result.source}; ${result.seasons} seasons; ${result.events} events.`, '', '| CPU slowdown | Action | Median ms | Max ms |','| --- | --- | ---: | ---: |',...summary.map(r=>`| ${r.rate}x | ${r.action} | ${r.medianMs} | ${r.maxMs} |`),'',`Errors: ${result.errors.join('; ')||'None'}`].join('\n'));console.log(JSON.stringify(result.summary));if(errors.length)process.exitCode=1;
