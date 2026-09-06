import { describe, expect, it } from 'vitest';
import { createNewCareerState, createStarterState, enterTournamentState, bookTravelState, confirmTournamentPreparationState, startLiveMatchState, finalizeLiveMatch, simulateTournamentMatchState, repairGameState } from '../hooks/useGameState';
import type { GameState } from '../hooks/useGameState';
import type { Match } from '../types/game';
import { careerLegacyOf, careerLegacyRating, recordLegacyMatch, legacyRate } from './careerLegacy';
import { encodeCareerSave, decodeCareerSave } from './saveStorage';
import { getDefaultPreparationAllocations } from './tournamentPreparation';
import { reconcileRealism } from './realism';

function blank() { const s = createNewCareerState(); s.matches = []; s.history = { snapshots: [], matchLog: [], tournamentHistory: [], seasonRecords: [] }; return s; }
function match(overrides: Partial<Match> = {}): Match { return { id: 'm1', season: '2026/27', tournamentId: 't1', playedOn: '2026-06-01', round: 'Final', bestOf: 7, playerName: 'Test', opponentName: 'Rival', playerRanking: 1, opponentRanking: 2, playerFrames: 4, opponentFrames: 3, result: 'Won', highestBreak: 147, opponentHighestBreak: 80, fifties: 5, centuries: 3, maximumBreaks: 2, potSuccess: 90, longPotSuccess: 80, safetySuccess: 70, fouls: 2, confidenceChange: 0, fatigueChange: 0, prizeMoneyEarned: 100, rankingPointsGained: 100, ...overrides }; }
function event(overrides: Partial<GameState['history']['tournamentHistory'][number]> = {}): GameState['history']['tournamentHistory'][number] { return { id: '2026/27:t1', season: '2026/27', tournamentId: 't1', tournamentName: 'Local Open', eventType: 'Amateur', stageId: 2, tourCircuit: 'Local circuit', location: 'Leeds', startDate: '2026-06-01', status: 'Completed', result: 'Winner', rounds: [], matchesPlayed: 1, wins: 1, losses: 0, prizeMoney: 100, rankingPoints: 100, highestBreak: 147, centuries: 3, fatigueChange: 0, entryFee: 0, bookedTravelCost: 0, ...overrides }; }
function log(m: Match): GameState['history']['matchLog'][number] { return { ...m, season: m.season!, date: m.playedOn!, tournamentName: 'Local Open', eventType: 'Amateur', score: m.playerFrames + '-' + m.opponentFrames, wentToDecider: true, pressurePeak: 60, prizeMoney: m.prizeMoneyEarned, rankingPoints: m.rankingPointsGained }; }
function ready(name = 'Shoot Out') {
  let state = createStarterState(); state.history = blank().history; state.matches = []; state.player.cash = 100000;
  const event = state.tournaments.find(t => t.name === name)!; state.tournaments = [event];
  state = enterTournamentState(state, event.id); state = bookTravelState(state, event.id);
  state = confirmTournamentPreparationState(state, event.id, 'balanced', getDefaultPreparationAllocations(), []);
  state = reconcileRealism({ ...state, currentDate: event.startDate });
  return { state, event };
}
describe('permanent career legacy', () => {
  it('starts a new career empty without fabricated percentages', () => {
    const s = careerLegacyOf(createNewCareerState()); expect(s.matchesPlayed).toBe(0); expect(s.trophies).toEqual([]); expect(legacyRate(0, 0)).toBe('—');
  });
  it('uses frame-weighted rates and counts multiple 147s in one match', () => {
    let s = recordLegacyMatch(careerLegacyOf(blank()), match());
    s = recordLegacyMatch(s, match({ id: 'm2', bestOf: 1, playerFrames: 0, opponentFrames: 1, result: 'Lost', potSuccess: 50, maximumBreaks: 0 }));
    expect(legacyRate(s.potTotal, s.performanceFrames)).toBe('85.0%'); expect(s.maximums).toBe(2);
    expect(s.deciders).toBe(1); expect(s.decidersWon).toBe(1); expect(s.framesWon).toBe(4); expect(s.framesLost).toBe(4);
    expect(s.currentWinStreak).toBe(0); expect(s.bestWinStreak).toBe(1);
  });
  it('separates drawn groups and excludes single-frame wins from whitewashes', () => {
    let s = recordLegacyMatch(careerLegacyOf(blank()), match({ bestOf: 4, playerFrames: 2, opponentFrames: 2, result: 'Drawn' }));
    s = recordLegacyMatch(s, match({ id: 'm2', bestOf: 1, playerFrames: 1, opponentFrames: 0 }));
    expect(s.draws).toBe(1); expect(s.deciders).toBe(0); expect(s.whitewashes).toBe(0);
    s = recordLegacyMatch(s, match({ id: 'm3', playerFrames: 4, opponentFrames: 0 }));
    expect(s.whitewashes).toBe(1); expect(s.bestWinStreak).toBe(2);
  });
  it('does not duplicate a completed match or its trophy', () => {
    const trophy = { id: '2026/27:t1', tournamentId: 't1', name: 'Open', season: '2026/27', date: '2026-06-01', category: 'Amateur', circuit: 'Local', opponent: 'Rival', score: '4–3', prizeMoney: 100 };
    const s = recordLegacyMatch(careerLegacyOf(blank()), match(), trophy);
    expect(recordLegacyMatch(s, match(), trophy)).toBe(s); expect(s.trophies).toHaveLength(1);
  });
  it('merges old match, event and season summaries without double-counting', () => {
    const state = blank(); state.matches = [match({ maximumBreaks: undefined })]; state.history.matchLog = [log(state.matches[0])];
    state.history.tournamentHistory = [event()];
    state.history.seasonRecords = [{ season: '2026/27', matchesPlayed: 20, wins: 14, losses: 6, centuries: 25, highestBreak: 147, prizeMoney: 3000 } as GameState['history']['seasonRecords'][number]];
    const s = careerLegacyOf(state); expect(s.matchesPlayed).toBe(20); expect(s.wins).toBe(14); expect(s.centuries).toBe(25); expect(s.prizeMoney).toBe(3000);
    expect(s.detailedMatches).toBe(1); expect(s.maximumMatches).toBe(0); expect(s.trophies).toHaveLength(1);
  });
  it('includes active tournament centuries and restores titles across circuits, excluding qualification', () => {
    const state = blank(); state.matches = [match({ tournamentId: 'active', centuries: 2 })];
    state.history.tournamentHistory = [event(), event({ id: 'q', tournamentId: 'q', eventType: 'Q School', tournamentName: 'Q School' }), event({ id: 'p', tournamentId: 'p', tournamentName: 'Global Playoffs' }), event({ id: 's', tournamentId: 's', tournamentName: 'Seniors Open', eventType: 'Senior', centuries: 0 }), event({ id: 'u', tournamentId: 'u', tournamentName: 'Under-18 Open', eventType: 'Junior', centuries: 0 })];
    const s = careerLegacyOf(state); expect(s.centuries).toBe(11); expect(s.trophies.map(t => t.name)).toEqual(['Local Open', 'Seniors Open', 'Under-18 Open']);
  });
  it('keeps totals and titles when detailed history is trimmed or the season changes', () => {
    const state = blank(); let s = careerLegacyOf(state);
    for (let i = 0; i < 300; i++) s = recordLegacyMatch(s, match({ id: 'm' + i, centuries: 1, maximumBreaks: 0 }));
    state.history.legacy = s; state.season = '2027/28';
    const restored = JSON.parse(decodeCareerSave(encodeCareerSave(state))) as GameState;
    expect(careerLegacyOf(restored).matchesPlayed).toBe(300); expect(careerLegacyOf(restored).centuries).toBe(300);
    expect(careerLegacyOf(restored).prizeMoney).toBe(30000);
  });
  it('records a real quick simulation and survives repair/reload exactly once', () => {
    const { state, event } = ready(); const next = simulateTournamentMatchState(state, event.id);
    expect(next.matches).toHaveLength(1); const saved = next.history.legacy!;
    expect(saved.matchesPlayed).toBe(1); expect(saved.centuries).toBe(next.matches[0].centuries); expect(saved.maximumMatches).toBe(1);
    const repaired = repairGameState(JSON.parse(decodeCareerSave(encodeCareerSave(next))) as GameState);
    expect(repaired.history.legacy).toEqual(saved);
    expect(finalizeLiveMatch(repaired, next.liveMatch!).history.legacy).toEqual(saved);
  });
  it('archives a title from the final without including opponent centuries', () => {
    const { state, event } = ready(); const started = startLiveMatchState(state, event.id);
    const live = { ...started.liveMatch!, round: 'Final', status: 'Completed' as const, playerFrames: 1, opponentFrames: 0, playerHighestBreak: 110, opponentHighestBreak: 120, playerCenturies: 1, playerMaximums: 0, playerFifties: 1 };
    const next = finalizeLiveMatch(started, live);
    expect(next.history.legacy?.trophies).toHaveLength(1); expect(next.history.legacy?.trophies[0].name).toBe('Shoot Out'); expect(next.history.legacy?.centuries).toBe(1);
  });
});

describe('achievement-based legacy score', () => {
  it('corrects RT’s 38-match, 23-win, seven-century, zero-title career to 2/100', () => {
    const state = blank(); const career = { ...careerLegacyOf(state), matchesPlayed: 38, wins: 23, losses: 15, centuries: 7, prizeMoney: 240000 };
    state.history.legacy = career; state.player.legacyScore = 100; state.player.reputation = 100;
    const rating = careerLegacyRating(career, true);
    expect(rating.score).toBe(2); expect(rating.tier).toBe('Tour Professional');
    expect(rating.breakdown.reduce((n, row) => n + row.value, 0)).toBe(rating.score);
    expect(repairGameState(state).player.legacyScore).toBe(2);
  });
  it('cannot make a titleless career a champion even with unlimited money and match records', () => {
    const stats = { ...careerLegacyOf(blank()), wins: 10000, centuries: 10000, maximums: 100, prizeMoney: 1000000000 };
    const rating = careerLegacyRating(stats, true); expect(rating.score).toBe(25); expect(rating.tier).toBe('Tour Professional');
  });
  it('requires the correct title for world and ranking winner labels', () => {
    const stats = careerLegacyOf(blank());
    const trophy = { id: 'title', tournamentId: 't1', name: 'World Seniors Championship', season: '2026/27', date: '2026-06-01', category: 'Senior', circuit: 'Seniors', opponent: 'Rival', score: '4–3', prizeMoney: 10000 };
    expect(careerLegacyRating({ ...stats, trophies: [trophy] }).tier).toBe('Tournament Winner');
    expect(careerLegacyRating({ ...stats, trophies: [{ ...trophy, name: 'World Championship', category: 'Amateur', circuit: 'Amateur' }] }).worldTitles).toBe(0);
    expect(careerLegacyRating({ ...stats, trophies: [{ ...trophy, name: 'World Championship', category: 'Major', circuit: 'World Snooker Tour' }] }).tier).toBe('World Champion');
    expect(careerLegacyRating({ ...stats, trophies: [{ ...trophy, name: 'Scottish Open', category: 'Ranking', circuit: 'World Snooker Tour' }] }).tier).toBe('Ranking Winner');
    expect(careerLegacyRating({ ...stats, trophies: [{ ...trophy, name: 'Masters', category: 'Invitational', circuit: 'World Snooker Tour' }] }).tier).toBe('Main Tour Winner');
  });
  it('limits pathway trophies and always sums the breakdown to a score at most 100', () => {
    const stats = careerLegacyOf(blank());
    const trophies = Array.from({ length: 100 }, (_, i) => ({ id: 't' + i, tournamentId: 't', name: 'Junior Open', season: '2026/27', date: '2026-06-01', category: 'Junior', circuit: 'Youth', opponent: 'Rival', score: '4–3', prizeMoney: 100 }));
    expect(careerLegacyRating({ ...stats, trophies }).score).toBe(10);
    const champion = careerLegacyRating({ ...stats, wins: 1000, centuries: 1000, maximums: 10, trophies: trophies.map(t => ({ ...t, name: 'World Championship', category: 'Major', circuit: 'World Snooker Tour' })) });
    expect(champion.score).toBe(100); expect(champion.breakdown.reduce((n, row) => n + row.value, 0)).toBe(100);
  });
  it('does not award legacy points just for losing a match', () => {
    const { state, event } = ready(); const started = startLiveMatchState(state, event.id);
    const next = finalizeLiveMatch(started, { ...started.liveMatch!, status: 'Completed', playerFrames: 0, opponentFrames: 1, playerCenturies: 0, playerMaximums: 0 });
    expect(next.player.legacyScore).toBe(0); expect(next.history.legacy?.losses).toBe(1);
  });
});
