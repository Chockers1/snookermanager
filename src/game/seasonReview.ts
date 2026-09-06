import type { GameState } from '../hooks/useGameState';
import { isAttachedQualifying, rankingEventKey } from './rollingRankings';

/** Only named champions from completed finals or surviving player title records. */
export function recordedSeasonWinners(state: GameState) {
  return state.tournaments.filter(event => !isAttachedQualifying(event) && !/qualif/i.test(event.name) &&
    (event.type === 'Major' || /^(world championship|uk championship|uk major|masters|tour championship|champion of champions)$/i.test(event.name)))
    .map(event => {
      const recorded = state.rollingRankings?.events[rankingEventKey(event)];
      const final = recorded?.applied && recorded.season === state.season ? recorded.bracket.at(-1) : undefined;
      const match = final?.label.toLowerCase() === 'final' && final.matches.length === 1 ? final.matches[0] : undefined;
      let winner: string | undefined;
      if (match && typeof match.top.score === 'number' && typeof match.bottom.score === 'number' && match.top.score !== match.bottom.score) {
        winner = match.top.score > match.bottom.score ? match.top.name : match.bottom.name;
      }
      if (!winner && state.history.tournamentHistory.some(h => h.tournamentId === event.id && h.season === state.season && h.result === 'Winner')) winner = state.player.fullName;
      return { tournamentName: event.name, winner: winner ?? 'Not recorded in this save', playerWon: winner === state.player.fullName };
    });
}
