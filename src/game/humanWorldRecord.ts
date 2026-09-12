import type { GameState } from '../hooks/useGameState';
type CareerSeasonRecord = GameState['history']['seasonRecords'][number];
type WorldPlayerSeasonRecord = GameState['worldPlayers'][number]['seasons'][number];

/** Human season summaries count actual matches across every circuit, including draws. */
export function humanSeasonStats(record: CareerSeasonRecord) {
  return {
    matches: record.matchesPlayed, wins: record.wins, losses: record.losses,
    draws: Math.max(0, record.matchesPlayed - record.wins - record.losses),
    titles: record.titles, prizeMoney: record.prizeMoney,
  };
}

export function repairHumanSeasonRows(state: GameState, rows: WorldPlayerSeasonRecord[]) {
  const summaries = new Map(state.history.seasonRecords.map(r => [r.season, r]));
  return rows.map(row => {
    const summary = summaries.get(row.season);
    const stats = summary ? humanSeasonStats(summary) : { matches: Math.max(row.matches, row.wins + row.losses + (row.draws ?? 0)) };
    return Object.entries(stats).some(([key,value]) => row[key as keyof WorldPlayerSeasonRecord] !== value) ? { ...row, ...stats } : row;
  });
}

/** Repair loaded human copies without replaying events or loading archived brackets.
 * Unknown older history is retained; only known draw counts extend the W/L lower bound. */
export function repairHumanWorldRecord(state: GameState): GameState {
  const player = state.worldPlayers.find(p => p.playerName === state.player.fullName);
  if (!player) return state;
  const seasons = repairHumanSeasonRows(state, player.seasons);
  const summaries = state.history.seasonRecords;
  const knownDraws = summaries.reduce((n,r) => n + Math.max(0,r.matchesPlayed-r.wins-r.losses),0);
  const wins = Math.max(player.wins, summaries.reduce((n,r) => n+r.wins,0));
  const losses = Math.max(player.losses, summaries.reduce((n,r) => n+r.losses,0));
  const totalMatches = Math.max(player.totalMatches, wins + losses + knownDraws, summaries.reduce((n,r) => n+r.matchesPlayed,0));
  if (wins === player.wins && losses === player.losses && totalMatches === player.totalMatches && seasons.every((r,i) => r === player.seasons[i])) return state;
  return { ...state, worldPlayers: state.worldPlayers.map(p => p === player ? { ...p, totalMatches, wins, losses, seasons } : p) };
}
