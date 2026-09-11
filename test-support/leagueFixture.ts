import { createNewCareerState, createStarterState, enterTournamentState, bookTravelState, confirmTournamentPreparationState } from '../src/hooks/useGameState';
import { getDefaultPreparationAllocations } from '../src/game/tournamentPreparation';
import { plusDays } from '../src/game/careerDepth/shared';
export function leagueFixture() {
 let state=createNewCareerState({fullName:'League Tester',nationality:'England',age:15,handedness:'Right-handed',cueStyle:'',playingStyle:'',personalityArchetype:'',sliders:[],backgroundId:'',startingLevelId:'start-club-junior'});
 state.player.cash=100000;state.equipment=createStarterState().equipment;
 for(const key of Object.keys(state.equipment.chalkStock))state.equipment.chalkStock[key]=100;
 const event=state.tournaments.find(t=>t.name==='Summer Junior Club League')!;
 state=enterTournamentState(state,event.id);state=bookTravelState(state,event.id);
 state=confirmTournamentPreparationState(state,event.id,'balanced',getDefaultPreparationAllocations(),[]);
 state.currentDate=event.startDate;
 state.careerDepth!.nextSettlementDate=plusDays(event.startDate,7);
 return {state,event};
}
