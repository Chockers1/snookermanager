import { developmentEdge } from '../tourDevelopment';
import type { GameState } from '../../hooks/useGameState';
export function scoutingReport(state: GameState, name: string) {
  const opponent = state.worldPlayers.find(p => p.playerName === name);
  const id = opponent?.id;
  const matches = state.matches.filter(m => m.opponentId ? m.opponentId === id : m.opponentName === name).filter(m => m.result !== 'In Progress');
  const watched = id ? state.realism?.scouting[id]?.watched.length ?? 0 : 0;
  const practice = id ? state.careerDepth?.practiceHistory?.[id]?.sessions ?? 0 : 0;
  const samples = matches.length + watched + Math.min(4, practice);
  const uncertainty = Math.max(2, 12 - samples * 2);
  const ability = opponent?.overallRating === undefined ? undefined : opponent.overallRating + developmentEdge(opponent.skillDevelopment);
  // Round the estimate itself so its midpoint cannot expose an exact hidden rating.
  const estimate = Math.round((ability ?? 65) / 5) * 5;
  const observations = id ? state.careerDepth?.relationships[id] : undefined;
  const recorded = observations?.tactics ?? {};
  return { id, samples, watched, practice, uncertainty, confidence: Math.min(90, 35 + samples * 9),
    ability: ability == null ? 'Unknown' : `${Math.max(1, estimate - uncertainty)}–${Math.min(99, estimate + uncertainty)}`,
    evidence: matches.length < 3 ? ['At least three direct meetings are needed for a scoring assessment.'] : [`Opponent highest break averaged ${Math.round(matches.reduce((n, m) => n + m.opponentHighestBreak, 0) / matches.length)} across ${matches.length} meetings.`, `${matches.filter(m => m.playerFrames + m.opponentFrames === m.bestOf).length} meetings reached a deciding frame; results do not prove a mental trait.`],
    note: samples < 3 ? 'Small sample: treat these ranges as uncertain. No reliable tactical conclusion yet.' : `${matches.length} direct matches, ${watched} watched matches and ${practice} shared sessions inform this report.`,
    observedPlans: Object.entries(recorded).filter(([, count]) => count > 0).map(([plan, count]) => `${plan}: ${count} encounters`) };
}
export function watchableMatch(state: GameState, opponentId: string) {
  const opponent = state.worldPlayers.find(p => p.id === opponentId && !p.retired);
  if (!opponent) return null;
  const watched = state.realism?.scouting[opponentId]?.watched ?? [];
  for (const e of Object.values(state.rollingRankings?.events ?? {}).filter(e => e.applied && e.completedOn <= state.currentDate).sort((a, b) => b.completedOn.localeCompare(a.completedOn))) {
    for (const round of e.bracket) for (const m of round.matches) {
      const key = `${e.key}:${m.id}`;
      if ([m.top.name, m.bottom.name].includes(opponent.playerName) && typeof m.top.score === 'number' && typeof m.bottom.score === 'number' && !watched.includes(key)) return { key, event: e.name, round: round.label, match: m };
    }
  }
  return null;
}

/** Results shown to the player come from completed matches, never invented form. */
export function recordedOpponentResults(state: GameState, name: string) {
  const results: { id: string; date: string; opponent: string; result: 'W' | 'L' | 'D'; score: string }[] = [];
  for (const event of Object.values(state.rollingRankings?.events ?? {}).filter(e => e.applied && e.completedOn <= state.currentDate).sort((a, b) => b.completedOn.localeCompare(a.completedOn))) {
    for (const round of [...event.bracket].reverse()) for (const match of round.matches) {
      if (![match.top.name, match.bottom.name].includes(name) || typeof match.top.score !== 'number' || typeof match.bottom.score !== 'number') continue;
      const [own, other] = match.top.name === name ? [match.top, match.bottom] : [match.bottom, match.top];
      results.push({ id: `${event.key}:${match.id}`, date: event.completedOn, opponent: other.name, result: own.score === other.score ? 'D' : own.score! > other.score! ? 'W' : 'L', score: `${own.score}–${other.score}` });
    }
  }
  return results.slice(0, 4);
}
