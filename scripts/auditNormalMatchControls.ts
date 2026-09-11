import fs from 'node:fs';
import {createStarterState,enterTournamentState,bookTravelState,confirmTournamentPreparationState,startLiveMatchState,playOutLiveFrame,buildLiveVisitProfile,type GameState} from '../src/hooks/useGameState';
import {getDefaultPreparationAllocations} from '../src/game/tournamentPreparation';
import {pendingMatchBreak,resolveSessionBreak,sessionPlan} from '../src/game/realism/sessions';
let s=createStarterState();s.player.cash=100000;const t=s.tournaments.find(t=>t.name==='Shanghai Masters')!;s=enterTournamentState(s,t.id);s=bookTravelState(s,t.id);s=confirmTournamentPreparationState(s,t.id,'balanced',getDefaultPreparationAllocations(),[]);s=startLiveMatchState({...s,currentDate:t.startDate},t.id);if(!s.liveMatch)throw Error(s.lastAction);
const attrs=structuredClone(s.attributes);for(const group of Object.values(attrs))for(const key of Object.keys(group))group[key]=90;
const profile=buildLiveVisitProfile({side:'player',name:'Human',sourceKind:'attributes',attributes:attrs,confidence:75,fatigue:30,equipmentBonus:0,sourceRankBand:'Control'}).visitProfile;
const rows=[];
for(const archetype of ['Serial Scorer','Tactical Grinder','Counter Puncher','Tempo Disruptor'] as const){
 let wins=0,frames=0,won=0,centuries=0;const n=Number(process.env.CONTROL_SAMPLES??200);let example;
 for(let i=0;i<n;i++){
  const original=Math.random;let seed=104729+i*997;Math.random=process.env.CONTROL_RNG==='mulberry'?()=>{seed+=0x6d2b79f5;let v=seed;v=Math.imul(v^(v>>>15),v|1);v^=v+Math.imul(v^(v>>>7),v|61);return ((v^(v>>>14))>>>0)/4294967296}:()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  try{
   let live:NonNullable<GameState['liveMatch']>={...structuredClone(s.liveMatch),bestOf:35,round:'Final',framesNeeded:18,playerName:'Human',opponentName:'Opponent',playerAtTable:i%2?'Opponent':'Human',frameStarterName:i%2?'Opponent':'Human',playerVisitProfile:profile,opponentVisitProfile:profile,playerFatigue:30,opponentFatigue:30,playerConfidence:75,opponentConfidence:75,playerClutch:90,opponentClutch:90,plannedWinChance:50,plannedMatchWinChance:50,plannedPlayerStrength:90,plannedOpponentStrength:90,opponentArchetype:archetype,tacticalPlan:'Balanced',opponentApproach:'Measured',tacticalEdge:0,conditionEffect:0,venue:undefined,sessions:sessionPlan(35),formIssue:undefined};
   for(let step=0;step<300&&live.status==='In Progress';step++)live=pendingMatchBreak(live)?resolveSessionBreak(live,'review'):playOutLiveFrame(live,'simulated');
   if(live.status!=='Completed')throw Error('Incomplete match');wins+=Number(live.playerFrames>live.opponentFrames);frames+=live.playerFrames+live.opponentFrames;won+=live.playerFrames;centuries+=live.playerCenturies;example??={playerFatigue:live.playerFatigue,opponentFatigue:live.opponentFatigue,score:live.playerFrames+'-'+live.opponentFrames};
  }finally{Math.random=original}
 }
 rows.push({archetype,n,wins,winPercent:wins/n*100,framePercent:won/frames*100,centuries,example});console.log(rows.at(-1));
}
fs.writeFileSync('artifacts/career-v012/normal-match-controls'+(process.env.CONTROL_RNG?'-'+process.env.CONTROL_RNG:'')+'.json',JSON.stringify({method:'Normal Match Centre shot engine, equal 90 attributes, confidence 75, fatigue30, equipment0, balanced player tactics, alternate opening side. Normal opponent decisions, equal physical session recovery.',rows},null,2));
