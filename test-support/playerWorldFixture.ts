import { createStarterState } from '../src/hooks/useGameState';
import { initializeRollingRankings } from '../src/game/rollingRankings';
import type { BracketRound, Tournament } from '../src/types/game';
import { historyEdition } from './tournamentHistoryFixture';
export function playerWorldFixture(){
 const state=initializeRollingRankings(createStarterState()); state.currentDate='2026-09-20';state.seasonReview=null;
 const [opponent,other]=state.worldPlayers.filter(p=>p.playerName!==state.player.fullName);opponent.nation='ENG';
 state.matches=[];state.realism=undefined;state.careerDepth=undefined;
 const event: Tournament={...state.tournaments[0],id:'profile-open',name:'Profile Open',type:'Exhibition',rankingType:undefined,location:'Sheffield',startDate:'2026-09-01',endDate:'2026-09-04',status:'Completed',winnerPrize:7500};
 const bracket:BracketRound[]=[{label:'Final',matches:[{id:'profile-final',top:{name:opponent.playerName,nation:'ENG',rank:60,score:3},bottom:{name:other.playerName,nation:other.nation,rank:2,score:2}}]}];
 state.tournaments=[event,...state.tournaments];
 state.rollingRankings!.events={'profile-open:2026-09-01':{key:'profile-open:2026-09-01',tournamentId:event.id,name:event.name,season:state.season,completedOn:event.endDate!,ranking:false,eventType:'Exhibition',bracket,applied:true}};
 const entry=historyEdition(event,state.season,'Winner');Object.assign(entry,{startDate:event.startDate,endDate:event.endDate,eventType:'Exhibition',prizeMoney:7500,rankingPoints:0});state.history.tournamentHistory=[entry];
 return {state,event,opponent,other,bracket};
}
