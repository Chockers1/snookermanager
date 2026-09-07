import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {advanceWeekState,processRankingCalendar,startNextSeasonState,type GameState} from '../src/hooks/useGameState';
import {depthOf} from '../src/game/careerDepth/shared';
const source='artifacts/release-readiness/25-season-performance-save.json';
let base=JSON.parse(fs.readFileSync(source,'utf8')) as GameState;
if(base.seasonReview?.pending)base=startNextSeasonState(base);
const year=Number(base.season.slice(0,4))+1;
base={...base,currentDate:`${year}-06-29`,liveMatch:null,tournaments:base.tournaments.map(t=>({...t,status:'Skipped'})),careerDepth:{...depthOf(base),stories:depthOf(base).stories.filter(s=>s.status!=='pending'),nextSettlementDate:`${year}-06-30`}};
// Settle the CPU year outside the timing: measure the closing boundary, not a whole simulated season.
base=processRankingCalendar(base);
const samples=[];
for(let pass=1;pass<=3;pass++){
 const state=structuredClone(base);const start=performance.now();const closed=advanceWeekState(state);const closeMs=performance.now()-start;
 if(closed.season===state.season||!closed.seasonReview?.pending)throw new Error('Rollover blocked: '+closed.lastAction);
 const resumeStart=performance.now();const resumed=startNextSeasonState(closed);const resumeMs=performance.now()-resumeStart;
 if(resumed.seasonReview?.pending)throw new Error('Review still pending');
 samples.push({pass,closeMs:Math.round(closeMs),resumeMs:Math.round(resumeMs),from:state.season,to:resumed.season,date:resumed.currentDate});
}
const report={method:'Node engine on this host; 25-season performance fixture, prior CPU results settled; no browser/4x CPU emulation or compression included',samples};
fs.writeFileSync('artifacts/release-readiness/rollover-performance.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
