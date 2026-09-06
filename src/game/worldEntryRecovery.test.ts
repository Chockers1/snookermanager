import { describe, expect, it } from 'vitest';
import { createStarterState, enterTournamentState, getNextEligibleTournament, getTournamentEntryAccess, repairGameState } from '../hooks/useGameState';
import { rankingEventKey } from './rollingRankings';
import { buildTournamentDrawData } from '../utils/liveRouteData';

function legacyReservation() {
  let state = createStarterState();
  const world = state.tournaments.find(t => t.name === 'World Championship')!;
  const qualifier = state.tournaments.find(t => t.name === 'World Championship Qualifying')!;
  state.careerSystems.pro.hasTourCard = true;
  state.careerSystems.pro.worldRank = 18;
  state.player.worldRanking = 18;
  state.player.cash = 200000;
  state.tournaments = [{ ...world, status: 'Available', legacyEntryHonoured: true }, { ...qualifier, status: 'Skipped' }];
  state = enterTournamentState(state, world.id);
  expect(state.tournaments[0].status).toBe('Entered');
  state.careerSystems.pro.worldRank = 18;
  state.player.worldRanking = 18;
  state.competitionTables.world = state.competitionTables.world.map(r => r.playerName === state.player.fullName ? { ...r, ranking: 18 } : r);
  state.schemaVersion = 11;
  state.currentDate = qualifier.endDate!;
  state.tournaments = state.tournaments.map(t => ({ ...t, legacyEntryHonoured: undefined, seasonOpenAccessLock: 'worldMainDraw', status: t.id === world.id ? 'Available' : 'Skipped' }));
  state.tournamentProgress = createStarterState().tournamentProgress;
  for (const event of state.tournaments) state.rollingRankings!.seedings[rankingEventKey(event)] = { date: state.currentDate, world: { [state.player.fullName]: 18 }, oneYear: {} };
  return state;
}

describe('World Championship entry recovery', () => {
  it('restores only the previously accepted legacy entry, without replaying or paying results', () => {
    const before = legacyReservation();
    expect(getNextEligibleTournament(before)).toBeUndefined();
    const after = repairGameState(before);
    const next = getNextEligibleTournament(after)!;
    expect(next.name).toBe('World Championship');
    expect(next.status).toBe('Entered');
    expect(next.legacyEntryHonoured).toBe(true);
    expect(after.tournamentProgress.currentRound).toBe('Last 32');
    expect(after.tournamentProgress.draw[0].matches).toHaveLength(16);
    expect(after.player.cash).toBe(before.player.cash);
    expect(after.currentDate).toBe(before.currentDate);
    expect(after.matches).toEqual(before.matches);
    expect(after.rollingRankings).toEqual(before.rollingRankings);
    expect(after.history.tournamentHistory).toEqual(before.history.tournamentHistory);
    expect(repairGameState(after).tournamentProgress).toEqual(after.tournamentProgress);
  });
  it('does not grant an entry without an accepted reservation or after an explicit qualifying skip', () => {
    const state = legacyReservation();
    const withoutHistory = repairGameState({ ...state, history: { ...state.history, tournamentHistory: [] } });
    expect(getNextEligibleTournament(withoutHistory)).toBeUndefined();
    const skip = { ...state.history.tournamentHistory[0], tournamentId: state.tournaments[1].id, status: 'Skipped' as const, result: 'Skipped' };
    expect(getNextEligibleTournament(repairGameState({ ...state, history: { ...state.history, tournamentHistory: [...state.history.tournamentHistory, skip] } }))).toBeUndefined();
  });
  it('does not apply the compatibility exception to new saves or withdraw another active entry', () => {
    const state = legacyReservation();
    expect(getNextEligibleTournament(repairGameState({ ...state, schemaVersion: 12 }))).toBeUndefined();
    const other = { ...state.tournaments[1], id: 'other-entered', status: 'Entered' as const };
    const repaired = repairGameState({ ...state, tournaments: [...state.tournaments, other] });
    expect(repaired.tournaments.find(t => t.id === other.id)?.status).toBe('Entered');
    expect(repaired.tournaments[0].status).toBe('Booked');
  });
  it('uses the cutoff rank, ignoring old elite labels and season-open route locks', () => {
    const state = legacyReservation();
    // Test qualification eligibility before entry closes; late entry is tested separately.
    state.currentDate = state.tournaments[1].startDate;
    state.player.competitiveStatus = 'World Champion';
    expect(getTournamentEntryAccess(state, state.tournaments[0]).allowed).toBe(false);
    expect(getTournamentEntryAccess(state, state.tournaments[1]).allowed).toBe(true);
    state.rollingRankings = undefined;
    expect(getTournamentEntryAccess(state, state.tournaments[0]).allowed).toBe(false);
    expect(getTournamentEntryAccess(state, state.tournaments[1]).allowed).toBe(true);
  });
  it('does not invent a bracket or opponents when no tournament is eligible', () => {
    const state = legacyReservation();
    const data = buildTournamentDrawData(state);
    expect(data.bracket).toEqual([]);
    expect(data.progress).toEqual([]);
    expect(data.opponentOutlook).toEqual([]);
  });
});
