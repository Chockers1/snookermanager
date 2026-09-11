import fs from 'node:fs';
import assert from 'node:assert/strict';
import {repairGameState,getTournamentEntryAccess,advanceWeekState,startNextSeasonState,type GameState} from '../src/hooks/useGameState';
const source=process.argv[2],compactPath=process.argv[3];
let full=JSON.parse(fs.readFileSync(source,'utf8')) as GameState,compact=JSON.parse(fs.readFileSync(compactPath,'utf8')) as GameState;
function run<T>(fn:()=>T){const random=Math.random,now=Date.now;let seed=12345;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};Date.now=()=>1789100000000;try{return fn()}finally{Math.random=random;Date.now=now}}
function gameplay(s:GameState){return {player:s.player,attributes:s.attributes,finance:s.finance,equipment:s.equipment,careerSystems:s.careerSystems,competitionTables:s.competitionTables,worldPlayers:s.worldPlayers.map(p=>{const {seasons,archivedSelectionSeasons,...rest}=p;void seasons;void archivedSelectionSeasons;return rest}),history:s.history,careerDepth:s.careerDepth,tournaments:s.tournaments,season:s.season,currentDate:s.currentDate,training:s.training};}
const checks=[];
full=run(()=>repairGameState(full));compact=run(()=>repairGameState(compact));assert.deepEqual(gameplay(compact),gameplay(full));checks.push('Repaired save gameplay fields');
for(const event of full.tournaments)assert.deepEqual(getTournamentEntryAccess(compact,event),getTournamentEntryAccess(full,event),event.name);checks.push('All '+full.tournaments.length+' tournament entry routes');
const year=Number(full.season.slice(0,4))+1;
function boundary(s:GameState):GameState{return {...s,currentDate:`${year}-06-29`,seasonReview:null,liveMatch:null,tournaments:s.tournaments.map(t=>({...t,status:'Skipped'})),careerDepth:{...s.careerDepth!,stories:[],nextSettlementDate:`${year}-07-02`}};}
const fullWeek=run(()=>advanceWeekState(boundary(full))),compactWeek=run(()=>advanceWeekState(boundary(compact)));
assert.notEqual(fullWeek.season,full.season,'The test must actually cross a season boundary');
assert.deepEqual(gameplay(compactWeek),gameplay(fullWeek));checks.push('Seeded year-end advancement, CPU results/cards/development and finances');
const fullNext=run(()=>startNextSeasonState(fullWeek)),compactNext=run(()=>startNextSeasonState(compactWeek));assert.deepEqual(gameplay(compactNext),gameplay(fullNext));assert.equal(fullNext.seasonReview,null);checks.push('Open the next season');
fs.writeFileSync('artifacts/career-v012/archive-gameplay.json',JSON.stringify({source,compactPath,checks,date:full.currentDate,nextDate:fullNext.currentDate,season:full.season,nextSeason:fullNext.season},null,2));console.log(checks);
