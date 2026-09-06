import type { BracketMatchup, BracketPlayer, BracketRound, Tournament } from '../types/game';
import { resolveTournamentFormat } from '../data/tournamentFormats';
import { createChampionshipDraw, createGroupStage, resolveChampionshipStage, applyGroupResult, groupTable, groupsInRound, fixtureComplete, nextGroupFixture, championshipEarnings, unresolvedAmateurTies } from './championshipLeague';

const clean = (p: BracketPlayer): BracketPlayer => ({ ...p, score: undefined });
const winner = (m: BracketMatchup) => clean(m.top.score! > m.bottom.score! ? m.top : m.bottom);
const contains = (m: BracketMatchup, p: string) => m.top.name === p || m.bottom.name === p;
const clone = (draw: BracketRound[]) => structuredClone(draw);

export function roundRobin(label: string, players: BracketPlayer[], mode: NonNullable<BracketRound['groupRule']>, advance: number, bestOf: number): BracketRound {
  const rotation: (BracketPlayer | null)[] = [...players];
  if (rotation.length % 2) rotation.push(null);
  const matches: BracketMatchup[] = [];
  for (let day = 0; day < rotation.length - 1; day++) {
    for (let pair = 0; pair < rotation.length / 2; pair++) {
      const a = rotation[pair], b = rotation[rotation.length - 1 - pair];
      if (a && b) matches.push({ id: `${label}:${day}:${pair}`, group: label, matchday: day, top: clean(a), bottom: clean(b) });
    }
    rotation.splice(1, 0, rotation.pop()!);
  }
  return { label, matches, groupRule: mode, groupAdvance: advance, bestOf };
}
function knockoutRound(label: string, players: BracketPlayer[], bestOf: number): BracketRound {
  return { label, bestOf, matches: Array.from({ length: players.length / 2 }, (_, i) => ({ id: `${label}:${i}`, top: clean(players[2 * i]), bottom: clean(players[2 * i + 1]) })) };
}
export function createGroupCompetition(t: Tournament, players: BracketPlayer[]): BracketRound[] {
  const f = resolveTournamentFormat(t);
  if (f.groupMode === 'ranking') return createChampionshipDraw(players);
  const draw: BracketRound[] = f.roundStructure.map(label => ({ label, matches: [], bestOf: f.roundBestOf![label] }));
  if (f.groupMode === 'invitational') {
    // The playable invitation starts in Group 1; reserve entrants join later CPU groups.
    players = [...players.filter(p => p.highlighted), ...players.filter(p => !p.highlighted)];
    draw[0] = { ...roundRobin(draw[0].label, players.slice(0, 7), 'winsFrames', 4, 5), reservePlayers: players.slice(7).map(clean) };
  } else if (f.groupMode === 'league') {
    draw[0] = roundRobin(draw[0].label, players, 'league', 1, f.roundBestOf![draw[0].label]!);
  } else if (f.groupSize && f.groupSize !== 4) {
    const count = Math.ceil(players.length / f.groupSize);
    const groups = Array.from({ length: count }, () => [] as BracketPlayer[]);
    players.forEach((p, i) => groups[Math.floor(i / count) % 2 ? count - 1 - i % count : i % count].push(p));
    const matches = groups.flatMap((g, i) => roundRobin('Group ' + (i + 1), g, 'amateur', 2, draw[0].bestOf!).matches.map(m => ({ ...m, group: 'Group ' + (i + 1) })));
    draw[0] = { ...draw[0], matches, groupRule: 'amateur', groupAdvance: 2 };
  } else {
    draw[0] = { ...createGroupStage(draw[0].label, players), groupRule: 'amateur', groupAdvance: 2, bestOf: f.roundBestOf![draw[0].label] };
    draw[0].matches.forEach((m, i) => { m.matchday = Math.floor((i % 6) / 2); });
  }
  return draw;
}
function cpu(m: BracketMatchup, bestOf: number, random: () => number) {
  const chance = Math.max(.18, Math.min(.82, .5 + (m.bottom.rank - m.top.rank) * .003 + ((m.top.developmentEdge ?? 0) - (m.bottom.developmentEdge ?? 0)) / 100));
  let a = 0, b = 0;
  while (a < Math.floor(bestOf / 2) + 1 && b < Math.floor(bestOf / 2) + 1) { if (random() < chance) a++; else b++; }
  return { ...m, top: { ...m.top, score: a }, bottom: { ...m.bottom, score: b }, topBreaks: [Math.round(20 + random() * 115)], bottomBreaks: [Math.round(20 + random() * 115)] };
}
function seedNext(draw: BracketRound[], t: Tournament, index: number) {
  const f = resolveTournamentFormat(t), round = draw[index], next = draw[index + 1];
  if (!next || next.matches.length || !round.matches.length || !round.matches.every(fixtureComplete)) return;
  if (f.groupMode === 'invitational') {
    if (index % 3 === 0) {
      const table = groupTable(round.matches, 'winsFrames');
      draw[index + 1] = knockoutRound(next.label, [table[0], table[3], table[1], table[2]], 5);
    } else if (index % 3 === 1) {
      draw[index + 1] = knockoutRound(next.label, round.matches.map(winner), 5);
    } else if (index === 20) {
      const winners = Array.from({ length: 7 }, (_, i) => winner(draw[i * 3 + 2].matches[0]));
      draw[index + 1] = roundRobin(next.label, winners, 'winsFrames', 4, 5);
    } else {
      const group = draw[index - 2], champion = winner(round.matches[0]).name;
      const survivors = groupTable(group.matches, 'winsFrames').slice(0, 5).filter(p => p.name !== champion);
      const newcomers = draw[0].reservePlayers?.slice((index - 2) / 3 * 3, (index - 2) / 3 * 3 + 3) ?? [];
      draw[index + 1] = roundRobin(next.label, [...survivors, ...newcomers], 'winsFrames', 4, 5);
    }
  } else if (round.groupRule) {
    const groups = groupsInRound(round).map(g => groupTable(g.matches, round.groupRule, round.groupTieOrder?.[g.name]));
    // Pair group winners against runners-up from a different group, in opposite halves.
    const entrants = groups.flatMap((g, i) => [g[0], groups[(i + groups.length / 2) % groups.length][1]]);
    draw[index + 1] = knockoutRound(next.label, entrants, next.bestOf!);
  } else {
    draw[index + 1] = knockoutRound(next.label, round.matches.map(winner), next.bestOf!);
  }
}
export function settleAmateurGroupTies(round: BracketRound, random = Math.random) {
  if (round.groupRule !== 'amateur' || !round.matches.every(fixtureComplete)) return;
  round.groupTieOrder ??= {}; round.groupTieMatches ??= [];
  for (const group of groupsInRound(round)) {
    if (round.groupTieOrder[group.name]) continue;
    const order = groupTable(group.matches, 'amateur').map(p => p.name);
    for (const tied of unresolvedAmateurTies(group.matches)) {
      const records = tied.map(name => ({ name, wins: 0, difference: 0 }));
      let pending = [records];
      for (let replay = 0; pending.length && replay < 1000; replay++) {
        for (const cluster of pending) for (let i = 0; i < cluster.length; i++) for (let j = i + 1; j < cluster.length; j++) {
          let a = 0, b = 0;
          // Each deciding unit is a re-spotted black, not a full frame.
          while (a < 3 && b < 3) { if (random() < .5) a++; else b++; }
          cluster[i].wins += a > b ? 1 : 0; cluster[j].wins += b > a ? 1 : 0;
          cluster[i].difference += a - b; cluster[j].difference += b - a;
          round.groupTieMatches.push({ group: group.name, top: cluster[i].name, bottom: cluster[j].name, topFrames: a, bottomFrames: b });
        }
        const unresolved = new Map<string, typeof records>();
        for (const r of records) { const key = r.wins + ':' + r.difference; unresolved.set(key, [...(unresolved.get(key) ?? []), r]); }
        pending = [...unresolved.values()].filter(r => r.length > 1);
      }
      if (pending.length) throw new Error('Group black-ball tie-break did not resolve');
      records.sort((a, b) => b.wins - a.wins || b.difference - a.difference);
      const positions = tied.map(name => order.indexOf(name)).sort((a, b) => a - b);
      positions.forEach((pos, i) => { order[pos] = records[i].name; });
    }
    round.groupTieOrder[group.name] = order;
  }
}
export function resolveGroupCompetitionStage(draw: BracketRound[], t: Tournament, label: string, random = Math.random) {
  if (resolveTournamentFormat(t).groupMode === 'ranking') return resolveChampionshipStage(draw, label, random);
  const i = draw.findIndex(r => r.label === label);
  if (i < 0) return draw;
  draw[i].matches = draw[i].matches.map(m => fixtureComplete(m) ? m : cpu(m, draw[i].bestOf ?? resolveTournamentFormat(t).roundBestOf![label]!, random));
  settleAmateurGroupTies(draw[i], random);
  seedNext(draw, t, i);
  return draw;
}
export function applyGroupCompetitionResult(source: BracketRound[], t: Tournament, label: string, player: string, opponent: string, a: number, b: number, breaksA: number[], breaksB: number[]) {
  if (resolveTournamentFormat(t).groupMode === 'ranking') return applyGroupResult(source, label, player, opponent, a, b, breaksA, breaksB);
  const draw = clone(source), i = draw.findIndex(r => r.label === label), fixture = nextGroupFixture(draw, label, player);
  if (i < 0 || !fixture || !contains(fixture, opponent)) return { draw, nextRound: label };
  const top = fixture.top.name === player;
  Object.assign(fixture, { top: { ...fixture.top, score: top ? a : b }, bottom: { ...fixture.bottom, score: top ? b : a }, topBreaks: top ? breaksA : breaksB, bottomBreaks: top ? breaksB : breaksA });
  draw[i].matches = draw[i].matches.map(m => !fixtureComplete(m) && !contains(m, player) && (m.matchday ?? 0) <= (fixture.matchday ?? 0) ? cpu(m, draw[i].bestOf!, Math.random) : m);
  if (nextGroupFixture(draw, label, player)) return { draw, nextRound: label };
  resolveGroupCompetitionStage(draw, t, label);
  // A rolling-group winner waits for the Winners Group; survivors re-enter later groups.
  // Resolve only stages without the human until their next scheduled fixture exists.
  for (let next = i + 1; next < draw.length; next++) {
    if (draw[next].matches.some(m => contains(m, player))) return { draw, nextRound: draw[next].label };
    resolveGroupCompetitionStage(draw, t, draw[next].label);
  }
  return { draw, nextRound: null };
}
export function groupCompetitionChampion(draw: BracketRound[], t: Tournament) {
  if (resolveTournamentFormat(t).groupMode === 'league') {
    return draw[0]?.matches.every(fixtureComplete) ? groupTable(draw[0].matches, 'league')[0]?.name : undefined;
  }
  const final = draw.at(-1)?.matches[0];
  return final && fixtureComplete(final) ? winner(final).name : undefined;
}
export function invitationalEarnings(draw: BracketRound[], player: string) {
  let total = 0;
  draw.forEach((round, i) => {
    for (const m of round.matches.filter(fixtureComplete)) {
      if (contains(m, player)) total += (m.top.name === player ? m.top.score! : m.bottom.score!) * (i % 3 ? 300 : i >= 21 ? 200 : 100);
    }
    if (i % 3 === 2 && round.matches[0] && fixtureComplete(round.matches[0])) {
      const final = round.matches[0], won = winner(final).name === player;
      if (contains(final, player)) total += i >= 21 ? won ? 10000 : 5000 : won ? 3000 : 2000;
      else if (draw[i - 1].matches.some(m => contains(m, player))) total += i >= 21 ? 3000 : 1000;
      const groupMatches = draw.slice(i - 2, i + 1).flatMap(r => r.matches);
      const high = Math.max(...groupMatches.flatMap(m => [...(m.topBreaks ?? []), ...(m.bottomBreaks ?? [])]));
      const tied = [...new Set(groupMatches.flatMap(m => [...((m.topBreaks ?? []).includes(high) ? [m.top.name] : []), ...((m.bottomBreaks ?? []).includes(high) ? [m.bottom.name] : [])]))];
      if (tied.includes(player)) total += (i >= 21 ? 1000 : 500) / tied.length;
    }
  });
  return Math.round(total);
}
export function groupCompetitionAward(draw: BracketRound[], t: Tournament, player: string, award: (t: Tournament, round: string, champion: boolean) => { prizeMoney: number; rankingPoints: number }) {
  const mode = resolveTournamentFormat(t).groupMode;
  if (mode === 'ranking') return { prizeMoney: championshipEarnings(draw, player), rankingPoints: 0 };
  if (mode === 'invitational') return { prizeMoney: invitationalEarnings(draw, player), rankingPoints: 0 };
  const last = [...draw].reverse().find(r => r.matches.some(m => contains(m, player)));
  return award(t, last?.label ?? draw[0].label, groupCompetitionChampion(draw, t) === player);
}
