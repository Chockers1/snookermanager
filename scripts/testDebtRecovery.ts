import {createPlayerIdentitySeed,createPlayerSliderCatalog,createPlayerBackgroundCatalog} from '../src/data/gameContent';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createNewCareerState,advanceWeekState} from '../src/hooks/useGameState';
import {careerDepthAction} from '../src/game/careerDepth';
import {nextClubWorkDate} from '../src/game/careerBudget';
import {depthOf} from '../src/game/careerDepth/shared';
const results=[];
for(const [path,age] of [['start-regional-youth',13],['start-elite-amateur',17],['start-q-tour',18],['start-rookie-pro',18]] as const){
 let state=createNewCareerState({...createPlayerIdentitySeed,fullName:createPlayerIdentitySeed.name,handedness:createPlayerIdentitySeed.handedness as 'Right-handed'|'Left-handed',sliders:createPlayerSliderCatalog.map(s=>({...s})),backgroundId:createPlayerBackgroundCatalog[1].id,startingLevelId:path,age});
 state={...state,player:{...state.player,cash:-500},finance:{...state.finance,baseCashFlow:0,cashFlow:0},sponsors:[],coachContracts:[]};
 const startedOn=state.currentDate;let steps=0;
 while(state.player.cash<0&&steps<80){
  const pending=depthOf(state).commitments.some(c=>c.kind==='club-work'&&c.status==='scheduled');
  if(!pending){const date=nextClubWorkDate(state);assert.ok(date,'Available work date while in debt');state=careerDepthAction(state,{type:'commitment',kind:'club-work',startDate:date});assert.ok(depthOf(state).commitments.some(c=>c.kind==='club-work'&&c.status==='scheduled'),'Work accepted with negative funds')}
  state=advanceWeekState(state);steps++;
 }
 const shifts=depthOf(state).commitments.filter(c=>c.kind==='club-work'&&c.status==='completed');
 assert.ok(state.player.cash>=0,'Recovered without match winnings, sponsors or allowance');
 assert.equal(state.history.matchLog.length,0);assert.equal(shifts.length,5);assert.equal(state.player.cash,100);
 results.push({path,age,startingCash:-500,endingCash:state.player.cash,startedOn,recoveredOn:state.currentDate,days:Math.round((Date.parse(state.currentDate)-Date.parse(startedOn))/86400000),completedShifts:shifts.length,clubWorkIncome:shifts.reduce((n,c)=>n+c.income,0),matches:state.history.matchLog.length,calendarSteps:steps});
}
fs.mkdirSync('artifacts/simulations',{recursive:true});fs.writeFileSync('artifacts/simulations/debt-recovery-stress.json',JSON.stringify({policy:'Synthetic £500 debt; no baseline income, sponsors, staff or match prizes; reserve paid club work and advance through real calendar actions.',results},null,2));console.log(JSON.stringify(results,null,2));
