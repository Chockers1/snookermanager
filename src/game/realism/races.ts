import type { GameState } from '../../hooks/useGameState';
import { rankingCutoffDate, rankingEventKey, rebuildRollingRankings } from '../rollingRankings';

function projectedTables(state: GameState, cutoff: string) {
  if (!state.rollingRankings) return state.competitionTables;
  return rebuildRollingRankings({ ...state, rollingRankings: { ...state.rollingRankings,
    earnings: state.rollingRankings.earnings.filter(e => e.earnedOn <= state.currentDate),
  } }, cutoff > state.currentDate ? cutoff : state.currentDate, false).competitionTables;
}
function defending(state: GameState, name: string, cutoff: string, oneYear = false) {
  return (state.rollingRankings?.earnings ?? []).filter(e => e.playerName === name &&
    e.earnedOn <= state.currentDate && e.expiresOn > state.currentDate && e.expiresOn <= cutoff &&
    (!oneYear || e.season === state.season)).reduce((n, e) => n + e.amount, 0);
}
export function qualificationRaces(state: GameState) {
  const events = state.tournaments.filter(t => t.startDate >= state.currentDate && ['masters', 'the masters', 'world grand prix', 'players championship', 'tour championship', 'world championship'].includes(t.name.toLowerCase()));
  return events.map(t => {
    const oneYear = /world grand prix|players championship|tour championship/i.test(t.name);
    const places = /world grand prix/i.test(t.name) ? 32 : /tour championship/i.test(t.name) ? 12 : 16;
    const cutoff = rankingCutoffDate(t), locked = state.rollingRankings?.seedings[rankingEventKey(t)];
    const confirmed = Boolean(locked && state.currentDate >= cutoff);
    const frozen = confirmed && locked ? oneYear ? locked.oneYear : locked.world : null;
    const tables = projectedTables(state, cutoff);
    const source = oneYear ? tables.oneYear : tables.world;
    const totalsAtCutoff = (name: string) => (state.rollingRankings?.earnings ?? []).filter(e => e.playerName === name && e.earnedOn <= cutoff && e.expiresOn > cutoff && (!oneYear || e.season === state.season)).reduce((sum, e) => sum + e.amount, 0);
    const rows = frozen
      ? Object.entries(frozen).map(([name, rank]) => ({ name, rank, total: totalsAtCutoff(name), defending: 0 })).sort((a, b) => a.rank - b.rank)
      : source.map(row => ({ name: row.playerName, rank: row.ranking, total: row.points, defending: defending(state, row.playerName, cutoff, oneYear) }));
    const player = rows.find(row => row.name === state.player.fullName), position = player?.rank ?? 0;
    const edge = rows.find(row => row.rank === places);
    return { id: t.id, name: /world championship/i.test(t.name) ? `${t.name} · direct seeding` : t.name, cutoff, places, position, confirmed, oneYear,
      status: !position ? 'Not on this ladder' : confirmed ? position <= places ? 'Inside locked field' : 'Outside locked field' : position <= places ? 'Provisionally inside' : 'Chasing qualification',
      defending: player?.defending ?? 0,
      gap: confirmed || position <= places ? 0 : Math.max(0, (edge?.total ?? 0) - (player?.total ?? 0) + 1),
      rivals: rows.filter(row => row.rank >= Math.max(1, places - 2) && row.rank <= places + 2),
      note: confirmed ? 'Ranking cut-off is locked; other eligibility and qualifying routes still apply.' : 'Scheduled expiries and ranking countback are included. Future winnings are unknown; World Championship places here refer to direct seeds.' };
  }).sort((a, b) => a.cutoff.localeCompare(b.cutoff));
}
export function survivalRace(state: GameState) {
  const main = state.tournaments.filter(t => /world championship/i.test(t.name) && !/qualif/i.test(t.name)).sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
  const cutoff = main?.endDate ?? main?.startDate;
  const tables = projectedTables(state, cutoff ?? state.currentDate);
  const rows = tables.world.map(row => ({ ...row, defending: defending(state, row.playerName, cutoff ?? state.currentDate), projected: row.points }));
  const player = rows.find(row => row.playerName === state.player.fullName), position = player?.ranking ?? 0;
  const excluded = new Set(rows.slice(0, 64).map(row => row.playerName));
  state.worldPlayers.filter(p => p.yearsRemaining > 1 || p.retired).forEach(p => excluded.add(p.playerName));
  if (state.careerSystems.pro.yearsRemaining > 1) excluded.add(state.player.fullName);
  const oneYearRescue = tables.oneYear.filter(row => !excluded.has(row.playerName)).slice(0, 4).map(row => row.playerName);
  return { cutoff, position, defending: player?.defending ?? 0,
    gap: position > 64 ? Math.max(0, (rows[63]?.projected ?? 0) - (player?.projected ?? 0) + 1) : 0,
    protectedCard: state.careerSystems.pro.yearsRemaining > 1, oneYearRescue,
    confirmed: Boolean(cutoff && state.currentDate >= cutoff), rivals: rows.slice(61, 67) };
}
