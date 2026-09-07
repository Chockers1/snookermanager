import type { GameState } from '../hooks/useGameState';
import type { Match } from '../types/game';
import { careerLegacyOf } from './careerLegacy';
export function victoryCelebration(state: GameState, match: Match | undefined) {
  if (!match || match.result !== 'Won') return null;
  const season = match.season ?? state.season;
  const record = state.history.tournamentHistory.find(h => h.tournamentId === match.tournamentId && h.season === season);
  if (!record || record.status !== 'Completed' || record.result !== 'Winner' || !record.matchesPlayed || record.eventType === 'Q School' || /qualif(?:ier|ication|ying)|play[ -]?off/i.test(record.tournamentName)) return null;
  const exhibition = record.eventType === 'Exhibition';
  if (!exhibition && record.canonicalResult?.isTitle === false) return null;
  const key = `${record.tournamentId}:${record.startDate}`;
  const earning = state.rollingRankings?.earnings.find(e => e.eventKey === key && e.playerName === state.player.fullName);
  const event = state.rollingRankings?.events[key];
  const tournament = state.tournaments.find(t => t.id === record.tournamentId && t.startDate === record.startDate);
  const ranking = !exhibition && (event?.ranking ?? ['World Ranking', 'One-Year'].includes(tournament?.rankingType ?? ''));
  const trophies = careerLegacyOf(state).trophies;
  const trophy = trophies.find(t => t.tournamentId === record.tournamentId && t.season === season);
  const rankingTitles = trophies.filter(t => ['World Ranking', 'One-Year'].includes(t.rankingType ?? ''));
  const milestone = exhibition ? 'Exhibition achievement recorded' : ranking && rankingTitles.length === 1 && trophy ? 'First recorded ranking title' : trophies.length === 1 && trophy ? 'Your first recorded trophy' : trophy ? `Career trophy number ${trophies.length}` : 'Tournament victory recorded';
  const decider = match.bestOf > 1 && match.playerFrames + match.opponentFrames === match.bestOf && match.playerFrames === match.opponentFrames + 1;
  const frames = match.frameHistory ?? [];
  let a = 0, b = 0, largestDeficit = 0;
  for (const frame of frames) { if (frame.winner === 'Player' || frame.winner === match.playerName) a++; else b++; largestDeficit = Math.max(largestDeficit, b-a); }
  const completeFrames = frames.length === match.playerFrames + match.opponentFrames;
  const deciding = decider && completeFrames ? frames.at(-1) : undefined;
  const highlight = completeFrames && largestDeficit >= 2 ? `From ${largestDeficit} frames behind to champion${decider ? ' in a deciding-frame finish' : ''}.` : decider ? 'A deciding-frame victory. You held your nerve when the title was on the line.' : match.opponentFrames === 0 ? 'A whitewash in the final. A commanding finish to your tournament.' : 'You finished the job on the biggest day of the tournament.';
  return { key:`${state.worldSeed}:${state.player.id}:${record.id}`, name:record.tournamentName, season, location:record.location,
    player:match.playerName, opponent:match.opponentName, score:`${match.playerFrames}–${match.opponentFrames}`, prize:record.prizeMoney,
    exhibition, ranking, milestone, trophyRecorded:!exhibition && Boolean(trophy), highlight,
    frameHighlight:deciding ? `Deciding frame: ${deciding.player}–${deciding.opponent}` : undefined,
    breakHighlight:match.centuries ? `${match.centuries} ${match.centuries === 1 ? 'century' : 'centuries'} in the final · highest break ${match.highestBreak}` : `Highest break in the final: ${match.highestBreak}`,
    credit:earning?.amount, publication:earning?.earnedOn ?? event?.completedOn ?? record.endDate,
    pending:Boolean((earning?.earnedOn ?? event?.completedOn ?? record.endDate ?? '') > state.currentDate),
    bracketRoute:`/tournaments/draw?tournament=${encodeURIComponent(record.tournamentId)}`,
    headline:exhibition ? 'Exhibition victory' : /^world championship$/i.test(record.tournamentName) ? 'World champion' : 'Champion',
  };
}
