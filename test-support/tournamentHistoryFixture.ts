import { createStarterState, type GameState } from '../src/hooks/useGameState';
import type { Tournament } from '../src/types/game';
import type { TournamentArchiveEntry } from '../src/game/tournamentCareerHistory';
export function historyEdition(event: Tournament,season: string,result='Lost in Last 32'): TournamentArchiveEntry {
  const year=Number(season.slice(0,4));
  return {id:season+':'+event.id,season,tournamentId:event.id,tournamentName:event.name,eventType:event.eventClass??event.type,stageId:null,tourCircuit:event.tourCircuit??event.type,location:event.location,startDate:(year+1)+'-04-17',endDate:(year+1)+'-05-03',status:'Completed',result,rounds:['Last 32: Lost 8-10'],matchesPlayed:1,wins:0,losses:1,prizeMoney:12000,rankingPoints:12000,highestBreak:95,centuries:0,fatigueChange:0,entryFee:0,bookedTravelCost:0,roundResults:[{round:'Last 32',opponentName:'Malik Langford',result:'Lost',playerFrames:8,opponentFrames:10}]};
}
export function tournamentHistoryFixture(): GameState {
  const state=createStarterState(); state.season='2027/28';state.currentDate='2027-07-01';state.seasonReview=null;
  const shift=(date:string)=>String(Number(date.slice(0,4))+1)+date.slice(4);
  state.tournaments=state.tournaments.map(t=>({...t,startDate:shift(t.startDate),endDate:t.endDate?shift(t.endDate):undefined,status:'Available'}));
  const world=state.tournaments.find(t=>t.name==='World Championship')!;
  const older=historyEdition(world,'2024/25','Lost in Quarter Final');older.roundResults=[{round:'Last 32',opponentName:'Earlier Opponent',result:'Won',playerFrames:10,opponentFrames:5},{round:'Quarter Final',opponentName:'Historic Rival',result:'Lost',playerFrames:11,opponentFrames:13}];older.rounds=['Last 32: Won 10-5','Quarter Final: Lost 11-13'];older.matchesPlayed=2;older.wins=1;older.prizeMoney=17500;
  const skipped=historyEdition(world,'2025/26','Skipped');Object.assign(skipped,{status:'Skipped',roundResults:[],rounds:[],matchesPlayed:0,wins:0,losses:0,prizeMoney:0,highestBreak:0});
  const qualifier=historyEdition({...world,id:world.id+'-qual-test',name:'World Championship Qualifying',type:'Ranking'},'2026/27','Winner');
  state.history.tournamentHistory=[historyEdition(world,'2026/27'),skipped,older,qualifier];
  state.inbox=[{id:'world-history-invitation',sender:'Tournament Office',subject:'Invitation: '+world.name,preview:'Review the upcoming tournament.',date:'Today',priority:'High',read:false,actionLabel:'Review Event',actionRoute:'/calendar',tournamentReference:{id:world.id,startDate:world.startDate}}];
  return state;
}
