import { afterEach, expect, it, vi } from 'vitest';
import { createStarterState, getNextEligibleTournament, enterTournamentState, bookTravelState, confirmTournamentPreparationState, continueToNextTournamentState, startLiveMatchState, resolveCompletedLiveFrame, simulateCareerFrameOutcome, advanceLiveVisit, playOutLiveFrame } from '../hooks/useGameState';
import { getDefaultPreparationAllocations } from './tournamentPreparation';
afterEach(()=>vi.restoreAllMocks());
type Live = ReturnType<typeof advanceLiveVisit>;
function frame(): Live {
 let s=createStarterState();const t=getNextEligibleTournament(s)!;
 s=enterTournamentState(s,t.id);s=bookTravelState(s,t.id);
 s=confirmTournamentPreparationState(s,t.id,'balanced',getDefaultPreparationAllocations(),[]);
 s=continueToNextTournamentState(s);s=startLiveMatchState(s,t.id);
 if(!s.liveMatch)throw new Error(s.lastAction);
 return {...s.liveMatch,special:undefined,sessions:undefined,playerFrames:0,opponentFrames:0,frameHistory:[],bestOf:1,framesNeeded:1,tableState:{redsRemaining:0,coloursRemaining:[]},ballsRemaining:0};
}
it('never rerolls a completed simulated frame or adds unearned points',()=>{
 const live=frame();vi.spyOn(Math,'random').mockReturnValue(0.999);
 const settled=resolveCompletedLiveFrame({...live,playerPoints:94,opponentPoints:40,plannedMatchWinChance:1},'Simmed');
 expect(settled.frameHistory[0]).toMatchObject({player:'94',opponent:'40',winner:live.playerName});expect(settled.playerFrames).toBe(1);
});
it('keeps genuine foul-inflated totals and awards only seven for a tied black',()=>{
 const live=frame();
 expect(resolveCompletedLiveFrame({...live,playerPoints:104,opponentPoints:94},'Simmed').frameHistory[0]).toMatchObject({player:'104',opponent:'94'});
 vi.spyOn(Math,'random').mockReturnValue(0);
 expect(resolveCompletedLiveFrame({...live,playerPoints:70,opponentPoints:70},'Simmed').frameHistory[0]).toMatchObject({player:'77',opponent:'70'});
});
it('concedes without inventing points, including a level or leading score',()=>{
 const live=frame();for(const playerPoints of [0,50]){
 const settled=resolveCompletedLiveFrame({...live,playerPoints,opponentPoints:0},'Played','Player');
 expect(settled.frameHistory[0]).toMatchObject({player:String(playerPoints),opponent:'0',winner:live.opponentName});expect(settled.opponentFrames).toBe(1);
 }
});
it('quick frames share one table budget and every break fits its score',()=>{
 let seed=847;vi.spyOn(Math,'random').mockImplementation(()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32});
 for(let i=0;i<4000;i++){
 const f=simulateCareerFrameOutcome(50,30+i%71,30+(i*3)%71,i%2===0);
 expect(f.playerPoints+f.opponentPoints).toBeLessThanOrEqual(147);
 expect(f.playerBreak).toBeLessThanOrEqual(f.playerPoints);expect(f.opponentBreak).toBeLessThanOrEqual(f.opponentPoints);
 expect(f.playerPoints>f.opponentPoints).toBe(f.playerWonFrame);
 }
});
it('a live simulated final pot settles at the points actually scored',()=>{
 const live=frame();vi.spyOn(Math,'random').mockReturnValue(0);
 const settled=advanceLiveVisit({...live,playerAtTable:live.playerName,playerPoints:94,opponentPoints:40,tableState:{redsRemaining:0,coloursRemaining:['Black'],ballOn:'Colours'},ballsRemaining:1},'Pot Attempt','simulated','shot');
 expect(settled.frameHistory[0]).toMatchObject({player:'101',opponent:'40',winner:live.playerName});
});

for (const actor of ['Player', 'Opponent'] as const) for (const granularity of ['shot', 'visit'] as const) {
 it(`lets ${actor} finish a century after securing the frame in ${granularity} play`, () => {
  const base=frame();
  let live: Live={...base,playerAtTable:actor==='Player'?base.playerName:base.opponentName,
   playerPoints:actor==='Player'?96:0,opponentPoints:actor==='Opponent'?96:0,
   currentBreak:96,playerHighestBreak:actor==='Player'?96:0,opponentHighestBreak:actor==='Opponent'?96:0,
   playerFifties:actor==='Player'?1:0,playerCenturies:0,
   tableState:{redsRemaining:1,coloursRemaining:['Yellow','Green','Brown','Blue','Pink','Black'] as typeof base.tableState.coloursRemaining,ballOn:'Red' as const},ballsRemaining:8};
  vi.spyOn(Math,'random').mockReturnValue(0);
  const first=advanceLiveVisit(live,'Pot Attempt','simulated',granularity);
  expect(first.status).toBe('In Progress');
  expect(first.frameHistory).toHaveLength(0);
  live=first;
  for(let turns=0;turns<20&&live.status!=='Completed';turns++) live=advanceLiveVisit(live,'Break Build','simulated',granularity);
  expect(live.status).toBe('Completed');
  expect(live.frameHistory).toHaveLength(1);
  expect(actor==='Player'?live.playerHighestBreak:live.opponentHighestBreak).toBeGreaterThanOrEqual(100);
  expect(actor==='Player'?live.playerHighestBreak:live.opponentHighestBreak).toBeLessThanOrEqual(147);
  expect(live.playerCenturies).toBe(actor==='Player'?1:0);
  if(actor==='Player')expect(live.playerFifties).toBe(1);
 });
}
it('closes a secured frame after the scoring player misses',()=>{
 const base=frame();vi.spyOn(Math,'random').mockReturnValue(0.999);
 const next=advanceLiveVisit({...base,playerAtTable:base.playerName,playerPoints:96,opponentPoints:0,currentBreak:96,playerHighestBreak:96,
  tableState:{redsRemaining:0,coloursRemaining:['Blue','Pink','Black'],ballOn:'Colours'},ballsRemaining:3},'Pot Attempt','simulated','shot');
 expect(next.status).toBe('Completed');expect(next.playerHighestBreak).toBe(96);expect(next.playerCenturies).toBe(0);
});
it('does not turn a 110-point frame made in separate visits into a century',()=>{
 const base=frame();
 const settled=resolveCompletedLiveFrame({...base,playerPoints:110,opponentPoints:0,playerHighestBreak:60,playerCenturies:0,currentBreak:50},'Simmed');
 expect(settled.playerHighestBreak).toBe(60);expect(settled.playerCenturies).toBe(0);
});

it('keeps confidence changes symmetric while either player stays in a break',()=>{
 const base=frame();vi.spyOn(Math,'random').mockReturnValue(0);
 for(const actor of [base.playerName,base.opponentName]){
  const next=advanceLiveVisit({...base,playerAtTable:actor,playerConfidence:85,opponentConfidence:85,
   tableState:{redsRemaining:10,coloursRemaining:['Yellow','Green','Brown','Blue','Pink','Black'],ballOn:'Red'},ballsRemaining:26},'Pot Attempt','simulated','shot');
  expect(next.playerConfidence).toBe(85);expect(next.opponentConfidence).toBe(85);
 }
});
it('Sim Frame and individual shots resolve the same frame with the same randomness',()=>{
 const base=frame();
 const live: Live={...base,tableState:{redsRemaining:15,coloursRemaining:['Yellow','Green','Brown','Blue','Pink','Black'] as typeof base.tableState.coloursRemaining,ballOn:'Red' as const},ballsRemaining:36};
 let seed=1251;
 vi.spyOn(Math,'random').mockImplementation(()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;});
 const accelerated=playOutLiveFrame(live,'simulated');
 seed=1251;let shots=live;
 for(let i=0;i<400&&shots.status!=='Completed';i++) shots=advanceLiveVisit(shots,undefined,'simulated','shot');
 expect(accelerated.status).toBe('Completed');
 expect(accelerated.frameHistory).toEqual(shots.frameHistory);
 expect(accelerated.playerHighestBreak).toBe(shots.playerHighestBreak);
 expect(accelerated.opponentHighestBreak).toBe(shots.opponentHighestBreak);
 expect(accelerated.playerCenturies).toBe(shots.playerCenturies);
 expect(accelerated.playerFatigue).toBe(shots.playerFatigue);
});
