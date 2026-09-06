import { afterEach, expect, it, vi } from 'vitest';
import { createStarterState, getNextEligibleTournament, enterTournamentState, bookTravelState, confirmTournamentPreparationState, continueToNextTournamentState, startLiveMatchState, resolveCompletedLiveFrame, simulateCareerFrameOutcome, advanceLiveVisit } from '../hooks/useGameState';
import { getDefaultPreparationAllocations } from './tournamentPreparation';
afterEach(()=>vi.restoreAllMocks());
function frame() {
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
