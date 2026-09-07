import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {repairGameState, processRankingCalendar, seasonTitleEntries, type GameState} from '../src/hooks/useGameState';
import {encodeCareerSave,decodeCareerSave} from '../src/game/saveStorage';

const sources=process.argv.slice(2);
if(!sources.length)throw new Error('Supply save JSON paths. Originals are read only.');
const results=[];
for(const source of sources){
 const bytes=fs.readFileSync(source);const hash=createHash('sha256').update(bytes).digest('hex');
 const before=JSON.parse(decodeCareerSave(bytes.toString('utf8'))) as GameState;
 if(!before.player||!before.competitionTables)throw new Error('Not a career save: '+source);
 const start=performance.now();const repaired=repairGameState(before);const repairMs=performance.now()-start;
 const roundTrip=JSON.parse(decodeCareerSave(encodeCareerSave(repaired))) as GameState;
 const twice=repairGameState(roundTrip);const settled=processRankingCalendar(twice);
 const issues:string[]=[];
 if(twice.player.cash!==repaired.player.cash)issues.push('Repeated migration changed cash');
 if(twice.matches.length!==repaired.matches.length)issues.push('Repeated migration changed match count');
 if(twice.currentDate!==before.currentDate)issues.push('Migration moved the calendar');
 if(settled.player.cash!==twice.player.cash)issues.push('Repeated publication paid cash twice');
 for(const key of ['world','oneYear'] as const){
  const totals=new Map<string,number>();
  for(const e of settled.rollingRankings?.earnings??[]){
   if(e.earnedOn>settled.currentDate||e.expiresOn<=settled.currentDate||key==='oneYear'&&e.season!==settled.season)continue;
   totals.set(e.playerName,(totals.get(e.playerName)??0)+e.amount);
  }
  const rows=settled.competitionTables[key];
  if(new Set(rows.map(r=>r.playerName)).size!==rows.length)issues.push(key+': duplicate identities');
  rows.forEach((r,i)=>{if(Math.abs(r.points-(totals.get(r.playerName)??0))>.01)issues.push(key+': incorrect receipt total for '+r.playerName);if(r.ranking!==i+1||i>0&&r.points>rows[i-1].points)issues.push(key+': invalid order');});
 }
 for(const key of ['youth','amateur','qTour','qSchool','senior'] as const){
  const rows=settled.competitionTables[key];if(new Set(rows.map(r=>r.playerName)).size!==rows.length)issues.push(key+': duplicate identities');
 }
 const earnings=settled.rollingRankings?.earnings??[];
 if(new Set(earnings.map(e=>e.id)).size!==earnings.length)issues.push('Duplicate ranking receipt IDs');
 const records=settled.history.seasonRecords;
 for(const season of records){
  const entries=settled.history.tournamentHistory.filter(e=>e.season===season.season&&e.status==='Completed');
  // Compare only when retained records account for the full season's match volume.
  if(entries.reduce((n,e)=>n+e.matchesPlayed,0)===season.matchesPlayed && entries.length && season.titles!==seasonTitleEntries(settled,season.season).length)issues.push(season.season+': title total disagrees with complete history');
 }
 if(createHash('sha256').update(fs.readFileSync(source)).digest('hex')!==hash)issues.push('Source changed during audit');
 results.push({source:path.basename(source),date:before.currentDate,seasons:records.length,bytes:bytes.length,repairMs:Math.round(repairMs),cashBefore:before.player.cash,cashAfterMigration:repaired.player.cash,worldRows:settled.competitionTables.world.length,events:Object.keys(settled.rollingRankings?.events??{}).length,issues:[...new Set(issues)]});
}
fs.mkdirSync('artifacts/release-readiness',{recursive:true});fs.writeFileSync('artifacts/release-readiness/save-integrity.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
if(results.some(r=>r.issues.length))process.exitCode=1;
