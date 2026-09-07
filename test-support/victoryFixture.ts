import { createStarterState, enterTournamentState, bookTravelState, confirmTournamentPreparationState, startLiveMatchState, finalizeLiveMatch } from '../src/hooks/useGameState';
import { getDefaultPreparationAllocations } from '../src/game/tournamentPreparation';

export function victoryFixture() {
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
    const final = state.liveMatch.round === 'Final';
    const target = Math.ceil(state.liveMatch.bestOf / 2);
    const frames = ['68-7','68-29','33-70','0-94','91-0','74-53','59-76','0-92','107-8','0-94','25-87','0-90','85-0','0-105','89-0','87-7','89-0','0-85','106-0'].map((score,i) => {
      const [player,opponent] = score.split('-');
      return {frame:`F${i+1}`,player,opponent,winner:Number(player)>Number(opponent)?state.player.fullName:state.liveMatch!.opponentName};
    });
    state = finalizeLiveMatch(state, { ...state.liveMatch, playerFrames: target, opponentFrames: final ? target-1 : 1, status: 'Completed', ...(final ? {frameHistory:frames, playerHighestBreak:106, playerCenturies:1} : {}) });
  }
  state.matches[0].confidenceChange = 1.9000000000000057;
  return { state, event, match: state.matches[0] };
}
