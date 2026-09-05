import type { GameState, CompetitionTableRow } from '../hooks/useGameState';
import type { BracketRound, Tournament, RankingRow } from '../types/game';
import { resolveTournamentFormat } from '../data/tournamentFormats';

export type RankingEarning = {
  id: string; eventKey: string; playerName: string; amount: number;
  earnedOn: string; expiresOn: string; season: string; estimated?: boolean; fixedExpiry?: boolean;
};
export type RankingRevision = { date: string; world: Record<string, number>; oneYear: Record<string, number> };
export type RankedEvent = {
  key: string; tournamentId: string; name: string; season: string; completedOn: string;
  ranking: boolean; bracket: BracketRound[]; applied: boolean;
};
export type RollingRankingsState = {
  version: 1; initializedOn: string; processedThrough: string; earnings: RankingEarning[];
  events: Record<string, RankedEvent>; legacyEventKeys: string[];
  revisions: RankingRevision[]; seedings: Record<string, RankingRevision>;
  movementWorld: Record<string, number>; movementOneYear: Record<string, number>;
};

export const rankingEventKey = (t: Tournament) => `${t.id}:${t.startDate}`;
export function shiftYears(date: string, years: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().slice(0, 10);
}
function plusDays(date: string, days: number) {
  return new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}
export function countsForWorldRanking(t: Tournament) {
  return t.rankingType === 'World Ranking' || t.rankingType === 'One-Year';
}
export function isMajorQualifying(t: Tournament) {
  return ['ukMajorQualifying', 'worldChampionshipQualifying'].includes(resolveTournamentFormat(t).id);
}
export function qualifiedNames(bracket: BracketRound[]) {
  return (bracket.at(-1)?.matches ?? []).flatMap(m => typeof m.top.score === 'number' && typeof m.bottom.score === 'number' ? [m.top.score > m.bottom.score ? m.top.name : m.bottom.name] : []);
}
export function recordedMajorQualifiers(state: Pick<GameState, 'rollingRankings'> & Partial<Pick<GameState, 'season'>>, t: Tournament): string[] | null {
  const id = resolveTournamentFormat(t).id;
  const pattern = id === 'ukMajor' ? /uk (championship|major).*qualif/i : id === 'worldChampionshipMain' ? /world championship.*qualif/i : null;
  if (!pattern) return null;
  const event = Object.values(state.rollingRankings?.events ?? {}).filter(e => (!state.season || e.season === state.season) && e.completedOn <= t.startDate && pattern.test(e.name)).sort((a, b) => b.completedOn.localeCompare(a.completedOn))[0];
  return event ? qualifiedNames(event.bracket) : null;
}
export function rankingCutoffDate(t: Tournament) {
  // Authored game cut-offs can override the default one-week draw lock.
  return t.seedingCutoffDate ?? plusDays(t.startDate, -7);
}
function snapshot(state: GameState, date = state.currentDate): RankingRevision {
  return { date, world: Object.fromEntries(state.competitionTables.world.map(r => [r.playerName, r.ranking])), oneYear: Object.fromEntries(state.competitionTables.oneYear.map(r => [r.playerName, r.ranking])) };
}

/** Old saves cannot reconstruct missing prize records. Preserve their standings with
 * an explicitly estimated opening credit, spread over 24 expiry dates. Never pay cash. */
export function initializeRollingRankings(state: GameState): GameState {
  if (state.rollingRankings) return state;
  const earnings: RankingEarning[] = [];
  for (const row of state.competitionTables.world) {
    const total = Math.max(0, Math.round(row.points * 100));
    for (let month = 0; month < 24; month++) {
      const expiry = plusDays(state.currentDate, 15 + month * 30);
      const amount = Math.floor(total / 24) + (month < total % 24 ? 1 : 0);
      if (amount) earnings.push({ id: `opening:${row.playerName}:${month}`, eventKey: 'opening-carry-over', playerName: row.playerName, amount, earnedOn: shiftYears(expiry, -2), expiresOn: expiry, season: 'Opening carry-over', estimated: true });
    }
  }
  const rollingRankings: RollingRankingsState = {
    version: 1, initializedOn: state.currentDate, processedThrough: state.currentDate, earnings, events: {},
    // Do not replay old tournaments or credit historical cash/results on import.
    legacyEventKeys: state.tournaments.filter(t => (t.endDate ?? t.startDate) < state.currentDate || t.status === 'Completed').map(rankingEventKey),
    revisions: [snapshot(state)], seedings: {}, movementWorld: {}, movementOneYear: {},
  };
  // Reconstruct the human current-season list only from recorded, completed events.
  if (state.schemaVersion < 10) {
    for (const h of state.history.tournamentHistory) {
      const t = state.tournaments.find(t => t.id === h.tournamentId);
      if (!t || !countsForWorldRanking(t) || h.season !== state.season || h.status !== 'Completed') continue;
      const amount = Math.max(0, h.prizeMoney ?? 0);
      if (amount) earnings.push({ id: `legacy-result:${h.id}`, eventKey: rankingEventKey(t), playerName: state.player.fullName, amount, earnedOn: t.endDate ?? t.startDate, expiresOn: t.rankingExpiryDate ?? shiftYears(t.endDate ?? t.startDate, 2), season: state.season, estimated: true });
    }
    const humanRecorded = earnings.filter(e => e.playerName === state.player.fullName && e.eventKey !== 'opening-carry-over').reduce((s, e) => s + e.amount, 0);
    let remaining = humanRecorded;
    for (const e of earnings.filter(e => e.playerName === state.player.fullName && e.eventKey === 'opening-carry-over').reverse()) { const removed = Math.min(e.amount, remaining); e.amount -= removed; remaining -= removed; }
  }
  return rebuildRollingRankings({ ...state, rollingRankings }, state.currentDate, false);
}

export function recordRankingEvent(state: GameState, tournament: Tournament, bracket: BracketRound[], award: (t: Tournament, round: string, champion: boolean) => { prizeMoney: number }): GameState {
  state = initializeRollingRankings(state);
  const ledger = state.rollingRankings!;
  const key = rankingEventKey(tournament);
  if (ledger.events[key] || ledger.legacyEventKeys.includes(key)) return state;
  const entrants = new Map<string, { rank: number; firstRound: string; wins: number; lastRound: string; champion: boolean }>();
  for (const round of bracket) for (const match of round.matches) {
    for (const p of [match.top, match.bottom]) if (p.name !== 'TBD' && !/^Qualifier \d+$/.test(p.name) && !entrants.has(p.name)) entrants.set(p.name, { rank: p.rank, firstRound: round.label, wins: 0, lastRound: round.label, champion: false });
    if (typeof match.top.score !== 'number' || typeof match.bottom.score !== 'number') continue;
    const winner = match.top.score > match.bottom.score ? match.top.name : match.bottom.name;
    for (const p of [match.top, match.bottom]) {
      const entry = entrants.get(p.name);
      if (!entry) continue;
      entry.lastRound = round.label;
      if (p.name === winner) { entry.wins++; entry.champion = /^final$/i.test(round.label); }
    }
  }
  const completedOn = tournament.endDate ?? tournament.startDate;
  const additions: RankingEarning[] = [];
  const qualified = isMajorQualifying(tournament) ? new Set(qualifiedNames(bracket)) : new Set<string>();
  if (countsForWorldRanking(tournament)) for (const [playerName, entry] of entrants) {
    const protectedMajorSeed = ['ukMajor', 'worldChampionshipMain'].includes(resolveTournamentFormat(tournament).id) && entry.rank <= 16;
    const seededLoss = entry.wins === 0 && (entry.firstRound !== bracket[0]?.label || protectedMajorSeed);
    const shootOutLoss = entry.wins === 0 && /shoot.?out/i.test(tournament.name);
    const amount = seededLoss || shootOutLoss || qualified.has(playerName) ? 0 : award(tournament, entry.lastRound, entry.champion).prizeMoney;
    additions.push({ id: `${key}:${playerName}`, eventKey: key, playerName, amount, earnedOn: completedOn, expiresOn: tournament.rankingExpiryDate ?? shiftYears(completedOn, 2), season: state.season, fixedExpiry: Boolean(tournament.rankingExpiryDate) });
  }
  return { ...state, rollingRankings: { ...ledger, earnings: [...ledger.earnings, ...additions], events: { ...ledger.events, [key]: { key, tournamentId: tournament.id, name: tournament.name, season: state.season, completedOn, ranking: countsForWorldRanking(tournament), bracket, applied: false } } } };
}

/** The ledger is authoritative for money-based points, not cash or career statistics. */
export function rebuildRollingRankings(state: GameState, date: string, revision = true): GameState {
  const ledger = state.rollingRankings;
  if (!ledger) return state;
  const world = new Map<string, number>();
  const season = new Map<string, number>();
  for (const e of ledger.earnings) {
    if (e.earnedOn > date || e.expiresOn <= date) continue;
    world.set(e.playerName, (world.get(e.playerName) ?? 0) + e.amount);
    if (e.season === state.season) season.set(e.playerName, (season.get(e.playerName) ?? 0) + e.amount);
  }
  const previous = ledger.revisions.at(-1);
  const recent = ledger.earnings.filter(e => !e.estimated && e.earnedOn <= date && e.expiresOn > date);
  const eventOrder = [...new Set(recent.map(e => `${e.earnedOn}:${e.eventKey}`))].sort().reverse();
  const byPlayer = new Map<string, Map<string, RankingEarning>>();
  for (const e of recent) {
    if (!byPlayer.has(e.playerName)) byPlayer.set(e.playerName, new Map());
    byPlayer.get(e.playerName)!.set(`${e.earnedOn}:${e.eventKey}`, e);
  }
  const countback = (a: string, b: string, key: 'world' | 'oneYear') => {
    for (const event of eventOrder) {
      const left = byPlayer.get(a)?.get(event);
      const right = byPlayer.get(b)?.get(event);
      const value = (e?: RankingEarning) => e && (key === 'world' || e.season === state.season) ? e.amount : 0;
      const difference = value(right) - value(left);
      if (difference) return difference;
    }
    return 0;
  };
  const rank = (rows: CompetitionTableRow[], totals: Map<string, number>, key: 'world' | 'oneYear', movements: Record<string, number>) => [...rows].map(r => ({ ...r, points: totals.get(r.playerName) ?? 0 })).sort((a, b) => b.points - a.points || countback(a.playerName, b.playerName, key) || (previous?.[key][a.playerName] ?? a.ranking) - (previous?.[key][b.playerName] ?? b.ranking) || a.playerName.localeCompare(b.playerName)).map((r, i) => ({ ...r, ranking: i + 1, movement: revision ? (previous?.[key][r.playerName] ?? r.ranking) - i - 1 : movements[r.playerName] ?? 0 }));
  const tables = { ...state.competitionTables, world: rank(state.competitionTables.world, world, 'world', ledger.movementWorld), oneYear: rank(state.competitionTables.oneYear, season, 'oneYear', ledger.movementOneYear) };
  const next = { ...state, competitionTables: tables };
  const revisions = revision ? [...ledger.revisions.filter(r => r.date !== date), snapshot(next, date)] : ledger.revisions;
  return { ...next, rollingRankings: { ...ledger, revisions, movementWorld: Object.fromEntries(tables.world.map(r => [r.playerName, r.movement])), movementOneYear: Object.fromEntries(tables.oneYear.map(r => [r.playerName, r.movement])), events: Object.fromEntries(Object.entries(ledger.events).map(([k, e]) => [k, e.completedOn <= date ? { ...e, applied: true } : e])) } };
}

/** Bind expiry to the corresponding event in the newly authored calendar, when
 * available. The two-year anniversary remains the fallback for discontinued events. */
export function scheduleRankingExpiries(state: GameState): GameState {
  const ledger = state.rollingRankings;
  if (!ledger) return state;
  const earnings = ledger.earnings.map(e => {
    if (e.estimated || e.fixedExpiry || e.expiresOn <= ledger.processedThrough) return e;
    const original = ledger.events[e.eventKey];
    const replacement = original && state.tournaments.find(t => t.name === original.name && Number(t.startDate.slice(0, 4)) === Number(e.earnedOn.slice(0, 4)) + 2);
    return replacement ? { ...e, expiresOn: replacement.endDate ?? replacement.startDate } : e;
  });
  return { ...state, rollingRankings: { ...ledger, earnings } };
}

/** Keep deduplication receipts indefinitely, but not decades of full CPU brackets.
 * Human tournament history is archived separately by the career system. */
export function compactRankingLedger(state: GameState): GameState {
  const ledger = state.rollingRankings;
  if (!ledger) return state;
  const oldest = shiftYears(state.currentDate, -2);
  const currentKeys = new Set(state.tournaments.map(rankingEventKey));
  return { ...state, rollingRankings: { ...ledger,
    earnings: ledger.earnings.filter(e => e.expiresOn > state.currentDate),
    events: Object.fromEntries(Object.entries(ledger.events).map(([key, e]) => [key, e.completedOn < oldest ? { ...e, bracket: [] } : e])),
    revisions: ledger.revisions.filter((r, i) => i === 0 || r.date >= oldest),
    seedings: Object.fromEntries(Object.entries(ledger.seedings).filter(([key]) => currentKeys.has(key))),
  } };
}

export function lockTournamentSeedings(state: GameState, through: string): GameState {
  state = initializeRollingRankings(state);
  const ledger = state.rollingRankings!;
  const seedings = { ...ledger.seedings };
  for (const t of state.tournaments) {
    const key = rankingEventKey(t);
    const cutoff = rankingCutoffDate(t);
    if (seedings[key] || cutoff > through) continue;
    const previous = [...ledger.revisions].filter(r => r.date <= cutoff).sort((a, b) => b.date.localeCompare(a.date))[0] ?? ledger.revisions[0];
    seedings[key] = { ...previous, date: cutoff };
  }
  return { ...state, rollingRankings: { ...ledger, seedings } };
}

export function seedingRows<T extends RankingRow>(state: GameState, tournament: Tournament, rows: T[]): T[] {
  const ledger = state.rollingRankings;
  if (!ledger) return rows;
  const saved = ledger.seedings[rankingEventKey(tournament)] ?? [...ledger.revisions].filter(r => r.date <= rankingCutoffDate(tournament)).sort((a, b) => b.date.localeCompare(a.date))[0] ?? ledger.revisions[0];
  if (!saved) return rows;
  const ranks = /world grand prix|players championship|tour championship/i.test(tournament.name) ? saved.oneYear : saved.world;
  return rows.map(r => ({ ...r, ranking: ranks[r.playerName] ?? r.ranking })).sort((a, b) => a.ranking - b.ranking);
}

export function rankingEarningsSummary(state: GameState, playerName: string) {
  const ledger = state.rollingRankings;
  const next30 = plusDays(state.currentDate, 30);
  const active = (ledger?.earnings ?? []).filter(e => e.playerName === playerName && e.earnedOn <= state.currentDate && e.expiresOn > state.currentDate);
  return { expiring: active.filter(e => e.expiresOn <= next30).reduce((s, e) => s + e.amount, 0), estimated: active.filter(e => e.estimated).reduce((s, e) => s + e.amount, 0), recent: active.filter(e => !e.estimated).sort((a, b) => b.earnedOn.localeCompare(a.earnedOn)).slice(0, 5) };
}
