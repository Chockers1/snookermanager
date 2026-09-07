import type { GameState } from '../hooks/useGameState';

export function metadataFromState(state: GameState) {
  const event = state.tournaments.find(t => t.status === 'Entered');
  const matches = state.history.legacy?.matchesPlayed ?? state.history.matchLog.length;
  return { playerId: state.player.id, player: state.player.fullName, season: state.season,
    displaySeason: state.seasonReview?.pending ? state.seasonReview.completedSeason.season : state.season,
    date: state.currentDate, rank: state.player.worldRanking ?? 0, matches,
    reviewPending: Boolean(state.seasonReview?.pending), payoutRepaired: Boolean(state.payoutRepair),
    progress: state.seasonReview?.pending ? 'Season review ready · before starting ' + state.seasonReview.nextSeason : event ? event.name + ' · ' + event.status : 'Between events',
    fingerprint: [state.season, state.currentDate, matches, state.history.matchLog.length, state.liveMatch?.currentFrame, state.liveMatch?.playerFrames, state.liveMatch?.opponentFrames].join(':'),
  };
}
// Only small immutable summaries are retained, never whole historical careers.
const cache = new Map<string, ReturnType<typeof metadataFromState>>();
export function rememberSaveMetadata(payload: string, candidate: unknown) {
  const state = candidate as GameState;
  if (!state?.player?.fullName || !state.currentDate || !state.season || !Array.isArray(state.tournaments) || !Array.isArray(state.matches) || !state.history?.matchLog || !Array.isArray(state.worldPlayers)) return;
  cache.delete(payload); cache.set(payload, metadataFromState(state));
  while (cache.size > 3) cache.delete(cache.keys().next().value!);
}
export function cachedSaveMetadata(payload: string) { return cache.get(payload); }
