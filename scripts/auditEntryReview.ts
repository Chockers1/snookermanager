import {getTournamentEntryAccess,withdrawTournamentState,type GameState} from '../src/hooks/useGameState';
import {rankingEventKey} from '../src/game/rollingRankings';

/** The audit manager must reconsider provisional entries once selection is locked.
 * This is an explicit manager withdrawal using normal refunds, not a game-side
 * automatic cancellation. Waiting for match day can miss an earlier qualifier. */
export function reviewLockedAuditEntry(state: GameState): GameState {
  const invalid = state.tournaments.find(t => t.status === 'Entered'
    && state.currentDate < t.startDate
    && Boolean(state.rollingRankings?.seedings[rankingEventKey(t)])
    && !getTournamentEntryAccess(state,t).allowed);
  return invalid ? withdrawTournamentState(state,invalid.id) : state;
}
