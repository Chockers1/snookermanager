import { createStarterState, enterTournamentState, bookTravelState, confirmTournamentPreparationState, startLiveMatchState, finalizeLiveMatch } from '../src/hooks/useGameState';
import { getDefaultPreparationAllocations } from '../src/game/tournamentPreparation';

export function betweenMatchFixture() {
  let state = createStarterState();
  state.player.cash = 100000;
  const event = state.tournaments.find(t => t.name === 'Shanghai Masters')!;
  state = enterTournamentState(state, event.id);
  state = bookTravelState(state, event.id);
  state = confirmTournamentPreparationState(state, event.id, 'balanced', getDefaultPreparationAllocations(), []);
  state = startLiveMatchState({ ...state, currentDate: event.startDate }, event.id);
  if (!state.liveMatch) throw new Error(state.lastAction);
  state = finalizeLiveMatch(state, { ...state.liveMatch, playerFrames: Math.ceil(state.liveMatch.bestOf / 2), opponentFrames: 1, status: 'Completed' });
  state.player.fatigue = 60;
  state.player.confidence = 70;
  state.trainingCondition.strain = 10;
  return { state, event };
}
