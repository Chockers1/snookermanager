import type { GameState } from '../../hooks/useGameState';
import { careerMessage } from '../careerDepth/shared';
export function updateWorldDigest(state: GameState): GameState {
  const r = state.realism;
  if (!r) return state;
  const events = Object.values(state.rollingRankings?.events ?? {}).filter(e => e.applied && e.completedOn <= state.currentDate && !r.seenEvents.includes(e.key));
  const matches = state.matches.filter(m => m.result !== 'In Progress' && !r.seenMatches.includes(m.id));
  if (!events.length && !matches.length && r.worldReviewedOn === state.currentDate) return state;
  const lines: string[] = [];
  const worldConditions = Object.fromEntries(state.worldPlayers.map(p => [p.id, { injured: Boolean(p.injuryWeeks), retired: p.retired }]));
  for (const p of state.worldPlayers) {
    const before = r.worldConditions?.[p.id];
    if (before?.injured && !p.injuryWeeks && !p.retired) lines.push(`Return to the tour: ${p.playerName} has completed injury recovery.`);
    if (before && !before.retired && p.retired) lines.push(`Retirement: ${p.playerName} leaves the competitive tour, with ${p.titles} career titles.`);
  }
  for (const event of events) {
    const finals = event.bracket.at(-1)?.matches ?? [];
    if (finals.length === 1 && /^final$/i.test(event.bracket.at(-1)?.label ?? '')) {
      const f = finals[0];
      if (typeof f.top.score === 'number' && typeof f.bottom.score === 'number') {
        const [winner, loser] = f.top.score > f.bottom.score ? [f.top, f.bottom] : [f.bottom, f.top];
        lines.push(`${event.name}: ${winner.name} defeated ${loser.name} ${winner.score}–${loser.score}${winner.rank > 16 ? ' — an outsider takes the title' : ''}.`);
        const profile = state.worldPlayers.find(p => p.playerName === winner.name);
        if (profile && profile.age <= 23) lines.push(`Rising player: ${winner.name}, age ${profile.age}, is the ${event.name} champion.`);
      }
    } else if (finals.length) lines.push(`${event.name}: ${finals.length} qualifying sections completed; results now count toward the relevant ladder.`);
    const upset = event.bracket.flatMap(round => round.matches).find(m => typeof m.top.score === 'number' && typeof m.bottom.score === 'number' && ((m.top.rank <= 8 && m.bottom.rank >= 32 && m.bottom.score > m.top.score) || (m.bottom.rank <= 8 && m.top.rank >= 32 && m.top.score > m.bottom.score)));
    if (upset) lines.push(`Upset: ${upset.top.name} ${upset.top.score}–${upset.bottom.score} ${upset.bottom.name}; a top-eight seed was beaten.`);
    const rivals = Object.values(state.careerDepth?.relationships ?? {}).filter(x => x.rivalry);
    for (const rival of rivals) {
      const encounter = [...event.bracket].reverse().flatMap(round => round.matches).find(m => [m.top.name, m.bottom.name].includes(rival.name) && typeof m.top.score === 'number' && typeof m.bottom.score === 'number');
      if (encounter) lines.push(`Rival watch — ${event.name}: ${encounter.top.name} ${encounter.top.score}–${encounter.bottom.score} ${encounter.bottom.name}.`);
    }
  }
  let earlierBest = Math.max(0, ...state.matches.filter(x => r.seenMatches.includes(x.id)).map(x => x.highestBreak));
  for (const m of [...matches].reverse()) {
    if (m.highestBreak > earlierBest && m.highestBreak >= 50) lines.push(`Personal best: ${m.highestBreak} against ${m.opponentName}, ${state.tournaments.find(t => t.id === m.tournamentId)?.name ?? m.round}.`);
    earlierBest = Math.max(earlierBest, m.highestBreak);
  }
  const movement = state.rollingRankings?.movementWorld ?? {};
  const climber = Object.entries(movement).filter(([name, move]) => move >= 5 && name !== state.player.fullName).sort((a, b) => b[1] - a[1])[0];
  if (events.length && climber) lines.push(`Ranking mover: ${climber[0]} climbed ${climber[1]} places after the latest counting results.`);
  const next: GameState = { ...state, realism: { ...r, worldConditions, worldReviewedOn: state.currentDate, seenEvents: [...r.seenEvents, ...events.map(e => e.key)], seenMatches: [...r.seenMatches, ...matches.map(m => m.id)] } };
  if (!lines.length) return next;
  const id = `world-digest:${events.map(e => e.key).join('|') || matches.map(m => m.id).join('|') || state.currentDate}`;
  const digest = { id, date: state.currentDate, title: 'Around the tour', lines: lines.slice(0, 12) };
  next.realism = { ...next.realism!, digest: [digest, ...r.digest].slice(0, 52) };
  return careerMessage(next, id, digest.title, digest.lines.join('\n'), '/inbox');
}
