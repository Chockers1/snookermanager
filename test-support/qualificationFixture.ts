import { createStarterState, enterTournamentState, bookTravelState, confirmTournamentPreparationState, startLiveMatchState, finalizeLiveMatch } from '../src/hooks/useGameState';
import { getDefaultPreparationAllocations } from '../src/game/tournamentPreparation';
import { plusDays } from '../src/game/careerDepth/shared';
export function qualificationFixture(won = true) {
  let state = createStarterState();
  const event = state.tournaments.find(t => t.name === 'International Championship Qualifying')!;
  state.currentDate = plusDays(event.startDate, -8);
  state.player.cash = 100000;
  state.tournaments = state.tournaments.map(t => ({ ...t, status: 'Available' }));
  state = enterTournamentState(state, event.id);
  state = bookTravelState(state, event.id);
  state = confirmTournamentPreparationState(state, event.id, 'balanced', getDefaultPreparationAllocations(), []);
  state.currentDate = event.startDate;
  state = startLiveMatchState(state, event.id);
  if (!state.liveMatch) throw Error(state.lastAction);
  return finalizeLiveMatch(state, { ...state.liveMatch, status: 'Completed', playerFrames: won ? 6 : 1, opponentFrames: won ? 1 : 6 });
}
