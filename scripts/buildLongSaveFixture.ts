import fs from 'node:fs';
import {advanceWeekState,processRankingCalendar,startNextSeasonState,type GameState} from '../src/hooks/useGameState';
import {depthOf} from '../src/game/careerDepth/shared';
const source='artifacts/simulations/15-season-start-age-12-start-club-junior-middle-support-simulation-seed-104729-gameplay-entry-v2-save.json';
let state=JSON.parse(fs.readFileSync(source,'utf8')) as GameState;
for(let extra=0;extra<10;extra++){
 if(state.seasonReview?.pending)state=startNextSeasonState(state);
 const year=Number(state.season.slice(0,4))+1;
 state={...state,currentDate:`${year}-06-29`,liveMatch:null,tournaments:state.tournaments.map(t=>({...t,status:'Skipped'})),careerDepth:{...depthOf(state),stories:depthOf(state).stories.filter(s=>s.status!=='pending'),nextSettlementDate:`${year}-06-30`}};
 state=processRankingCalendar(state);
 const before=state.season;
 for(let i=0;i<4&&state.season===before;i++)state=advanceWeekState(state);
 if(state.season===before)throw new Error('Rollover did not advance: '+state.lastAction);
 console.log(16+extra,state.currentDate,Object.keys(state.rollingRankings!.events).length);
}
fs.writeFileSync('artifacts/release-readiness/25-season-performance-save.json',JSON.stringify(state));
console.log('Performance-only fixture: 15 managed career seasons plus 10 CPU-world seasons. Calendar jumps are not a balance test.');
