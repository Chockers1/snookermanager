import { createStarterState } from '../src/hooks/useGameState';
import type { GameState } from '../src/hooks/useGameState';
export function seasonEntryFixture() {
  const state=createStarterState();state.season='2027/28';state.currentDate='2027-07-01';state.week=58;
  state.seasonReview=null;state.liveMatch=null;state.player.cash=196380;
  state.player.worldRanking=18;state.player.rankingLabel='World Ranking';state.player.careerStage='Top 32 Professional';
  Object.assign(state.careerSystems.pro,{hasTourCard:true,worldRank:18,retainedViaRanking:true,currentTier:'Top 32 Professional'});
  const human=state.competitionTables.world.find(r=>r.playerName===state.player.fullName)!;
  const others=state.competitionTables.world.filter(r=>r.playerName!==state.player.fullName);
  human.points=(others[16].points+others[17].points)/2;
  state.competitionTables.world=[...others.slice(0,17),human,...others.slice(17)].map((r,i)=>({...r,ranking:i+1}));
  state.rollingRankings=undefined;
  const shift=(date:string)=>String(Number(date.slice(0,4))+1)+date.slice(4);
  state.tournaments=state.tournaments.map(t=>({...t,startDate:shift(t.startDate),endDate:t.endDate?shift(t.endDate):undefined,status:'Available'}));
  state.tournamentProgress={tournamentId:null,currentRound:'Last 16',draw:[],completedRounds:[],rankingBaseline:{}};
  state.travel={bookings:{}};
  state.history.tournamentHistory=[{id:'prior-professional-results',season:'2026/27',tournamentId:'prior-professional',tournamentName:'Previous Professional Results',eventType:'Ranking',stageId:null,tourCircuit:'Main Tour',location:'England',startDate:'2027-04-17',status:'Completed',result:'Lost in Last 32',rounds:['Last 32'],matchesPlayed:38,wins:23,losses:15,prizeMoney:239650,rankingPoints:239650,highestBreak:109,centuries:7,fatigueChange:0,entryFee:0,bookedTravelCost:0}] satisfies GameState['history']['tournamentHistory'];
  return state;
}
