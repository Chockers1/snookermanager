import { createStarterState, enterTournamentState, bookTravelState, confirmTournamentPreparationState, startLiveMatchState, finalizeLiveMatch } from '../src/hooks/useGameState';
import { getDefaultPreparationAllocations } from '../src/game/tournamentPreparation';

export function postEventRankingFixture() {
  let state = createStarterState();
  state.player.cash = 100000;
  const event = state.tournaments.find(t => t.name === 'Wuhan Open')!;
  state = enterTournamentState(state, event.id);
  state = bookTravelState(state, event.id);
  state = confirmTournamentPreparationState(state, event.id, 'balanced', getDefaultPreparationAllocations(), []);
  state.currentDate = event.startDate;
  for (let i = 0; i < 10 && state.tournamentProgress.currentRound; i++) {
    state = startLiveMatchState(state, event.id);
    if (!state.liveMatch) throw new Error(state.lastAction);
    const semi = state.liveMatch.round === 'Semi Final';
    const target = Math.ceil(state.liveMatch.bestOf / 2);
    state = finalizeLiveMatch(state, { ...state.liveMatch, playerFrames: semi ? 1 : target, opponentFrames: semi ? target : 1, status: 'Completed' });
  }
  const message = state.inbox.find(m => m.subject === `Post-event report: ${event.name}`)!;
  if (!message?.eventFinance) throw new Error('Missing post-event report');
  return { state, event, message, finance: message.eventFinance };
}
