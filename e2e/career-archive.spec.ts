import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
async function open(page:Page){
 await page.goto('/');
 const fixture=await page.evaluate(async()=>{
  const game=await import('/src/hooks/useGameState.ts');const storage=await import('/src/game/saveStorage.ts');const archive=await import('/src/game/careerArchive.ts');
  let s=game.createStarterState();s.seasonReview=null;
  const p=s.worldPlayers.find((p:{playerName:string})=>p.playerName!==s.player.fullName)!;
  const sample={season:'2010/11',matches:1,wins:1,losses:0,draws:0,prizeMoney:100,titles:1,hasTourCard:false,worldRank:null,oneYearRank:null,amateurRank:1,qTourRank:null,qSchoolRank:null,seniorRank:null,youthRank:null,rankingPoints:0,proWins:0,proLosses:0,mainTourEvents:0,yearsRemaining:0,retainedViaRanking:false,cardSource:null,tourSurvivalStatus:'Amateur',status:'Amateur'};
  p.seasons=Array.from({length:16},(_,i)=>({...sample,season:`${2025-i}/${String(2026-i).slice(2)}`}));
  s.rollingRankings.events.archive={key:'archive',tournamentId:'archive',name:'Historical exhibition',season:'2010/11',completedOn:'2011-04-01',ranking:false,eventType:'Exhibition',applied:true,prizeVersion:1,prizeAwards:{[p.playerName]:100},bracket:[{label:'Final',matches:[{id:'old-final',top:{name:p.playerName,score:2},bottom:{name:'Historical Opponent',score:0}}]}]};
  s=game.repairGameState(s);await storage.prepareCareerStorage();const compact=await archive.archiveCareerHistory(s);
  await storage.prepareCareerStorage();await storage.commitCareerStorage([[storage.ACTIVE_SAVE_KEY,storage.encodeCareerSave(compact)]]);
  return {id:p.id,name:p.playerName,cash:s.player.cash};
 });
 await page.addInitScript(()=>{const original=IDBObjectStore.prototype.get;Object.assign(window,{archiveReads:0});IDBObjectStore.prototype.get=function(key){if(String(key).startsWith('snooker-history-v1:'))(window as Window & {archiveReads:number}).archiveReads++;return original.call(this,key)}});
 await page.reload();await page.getByRole('button',{name:/Continue Career/}).click();await expect(page.locator('#main-content')).toBeVisible();await expect(page.getByText('Saving…',{exact:true})).toBeHidden();return fixture;
}
async function route(page:Page,url:string){await page.evaluate(url=>{history.pushState({},'',url);dispatchEvent(new PopStateEvent('popstate'))},url)}
test('loads historical data only when requested and restores full archived draws',async({page})=>{
 const f=await open(page);expect(await page.evaluate(()=>(window as Window & {archiveReads:number}).archiveReads)).toBe(0);
 await route(page,'/players/'+f.id);await page.getByRole('tab',{name:'Results',exact:true}).click();await expect(page.getByLabel('Player history season').locator('option[value="2010/11"]')).toHaveCount(1);
 await page.getByLabel('Player history season').selectOption('2010/11');await expect(page.locator('summary').filter({hasText:'Historical exhibition'})).toBeVisible();await page.locator('summary').filter({hasText:'Historical exhibition'}).click();await expect(page.getByText('Historical Opponent',{exact:true})).toBeVisible();
 await route(page,'/career/stats');await page.locator('#season-archive > summary').click();await page.getByLabel('Archive season').selectOption('2010/11');await page.getByRole('button',{name:/Historical exhibition/}).click();await expect(page.locator('#season-archive').getByText('Historical Opponent',{exact:true})).toBeVisible();
});
test('portable export includes all chunks and difficulty survives reload without cash grants',async({page,browser})=>{
 await open(page);await route(page,'/settings');await page.getByLabel('Career difficulty',{exact:true}).selectOption('demanding');await expect(page.getByText('Saving…',{exact:true})).toBeHidden();
 await route(page,'/saves');const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Export Career',exact:true}).click();const file=await downloaded;const state=JSON.parse(fs.readFileSync((await file.path())!,'utf8'));
 expect(state.historyArchive).toBeUndefined();expect(state.rollingRankings.events.archive.bracket[0].matches[0].top.score).toBe(2);expect(state.difficulty).toBe('demanding');
 const independent=await browser.newContext();const receiver=await independent.newPage();
 try {
  await receiver.goto(new URL('/',page.url()).href);
  await receiver.locator('input[type="file"]').setInputFiles({name:'portable.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(state))});
  await expect(receiver.locator('#main-content')).toBeVisible();await expect(receiver.getByText('Saving…',{exact:true})).toBeHidden();
  await route(receiver,'/career/stats');await receiver.locator('#season-archive > summary').click();await receiver.getByLabel('Archive season').selectOption('2010/11');await receiver.getByRole('button',{name:/Historical exhibition/}).click();await expect(receiver.locator('#season-archive').getByText('Historical Opponent',{exact:true})).toBeVisible();
 } finally {await independent.close();}

 const cash=state.player.cash;await page.reload();await page.getByRole('button',{name:/Continue Career/}).click();await expect(page.locator('#main-content')).toBeVisible();await route(page,'/settings');await expect(page.getByLabel('Career difficulty',{exact:true})).toHaveValue('demanding');
 const saved=await page.evaluate(async()=>{const storage=await import('/src/game/saveStorage.ts');await storage.prepareCareerStorage();return JSON.parse(storage.decodeCareerSave(storage.readCareerStorage(storage.ACTIVE_SAVE_KEY)))});expect(saved.player.cash).toBe(cash);
});

test('difficulty and financial estimates remain keyboard accessible at largest text size',async({page})=>{
 await open(page);await route(page,'/settings');await page.getByLabel('Text size',{exact:true}).selectOption('130');
 const mode=page.getByLabel('Career difficulty',{exact:true});await mode.focus();await page.keyboard.press('Home');await page.keyboard.press('Enter');await expect(mode).toHaveValue('relaxed');
 await expect(page.getByText(/150% of background weekly support/)).toBeVisible();
 await route(page,'/finance');await expect(page.getByRole('heading',{name:'Recurring Monthly Estimate',exact:true})).toBeVisible();
 await expect(page.getByText('Season opening cash',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
 await page.screenshot({path:'artifacts/career-v012/finance-large-text.png',fullPage:true});
});


test('rejects an incomplete internal archive import and preserves the current career',async({page})=>{
 await open(page);await route(page,'/saves');
 const before=await page.evaluate(async()=>{const storage=await import('/src/game/saveStorage.ts');await storage.prepareCareerStorage();return JSON.parse(storage.decodeCareerSave(storage.readCareerStorage(storage.ACTIVE_SAVE_KEY)))});
 const incomplete=structuredClone(before);incomplete.historyArchive.seasons['2010/11']='snooker-history-v1:missing';incomplete.player.cash=1;
 await page.locator('input[type="file"]').setInputFiles({name:'incomplete.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(incomplete))});
 await expect(page.getByLabel('Save recovery').getByRole('alert').filter({hasText:'Import failed. Your current career is preserved.'})).toBeVisible();
 const after=await page.evaluate(async()=>{const storage=await import('/src/game/saveStorage.ts');await storage.prepareCareerStorage();return JSON.parse(storage.decodeCareerSave(storage.readCareerStorage(storage.ACTIVE_SAVE_KEY)))});
 expect(after.player.cash).toBe(before.player.cash);expect(after.historyArchive).toEqual(before.historyArchive);
});
