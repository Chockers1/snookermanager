import { describe, expect, it } from 'vitest';
import { createStarterState, finishSeasonState, repairGameState, repairSeasonTitleRecords, seasonTitleEntries, type GameState } from '../hooks/useGameState';

type Entry = GameState['history']['tournamentHistory'][number];
function entry(name: string, type: Entry['eventType'] = 'Ranking'): Entry {
  return { id: name, season: '2026/27', tournamentId: 'test-' + name, tournamentName: name, eventType: type,
    stageId: null, tourCircuit: 'Main tour', location: 'Britain', startDate: '2027-03-01', endDate: '2027-03-02',
    status: 'Completed', result: 'Winner', rounds: ['Final'], matchesPlayed: 1, wins: 1, losses: 0,
    prizeMoney: 1000, rankingPoints: 1000, highestBreak: 100, centuries: 1, fatigueChange: 0, entryFee: 0, bookedTravelCost: 0 };
}
function results() {
  const state = createStarterState();
  state.history.tournamentHistory = [entry('Ranking Cup'), entry('Invitational Cup', 'Invitational'),
    entry('International Championship Qualifying'), entry('Q School Event 1', 'Q School'), entry('Exhibition Cup', 'Exhibition')];
  return state;
}
function completed() {
  const state = results();
  state.currentDate = '2027-06-29';
  state.tournaments = state.tournaments.map(t => ({ ...t, status: 'Skipped' }));
  return finishSeasonState(state);
}

describe('season title accounting', () => {
  it('includes competitive titles across circuits, but excludes qualification, cards, exhibitions and repeated editions', () => {
    const state = results();
    state.history.tournamentHistory.push(entry('Youth Cup', 'National Youth'), entry('Senior Cup', 'Senior'), entry('Q Tour Event 1', 'Q Tour'),
      entry('Q Tour Play-Off', 'Q Tour'), entry('World Championship Qualifying', 'Major'), entry('Ranking Cup'));
    expect(seasonTitleEntries(state, state.season).map(e => e.tournamentName)).toEqual(['Ranking Cup', 'Invitational Cup', 'Youth Cup', 'Senior Cup', 'Q Tour Event 1']);
    expect(seasonTitleEntries(state, '2025/26')).toEqual([]);
  });
  it('archives only real titles during rollover and repairs already-saved popup and email totals', () => {
    const state = completed();
    expect(state.seasonReview!.completedSeason.titles).toBe(2);
    expect(state.history.seasonRecords[0].titles).toBe(2);
    const message = state.inbox.find(m => m.seasonReport)!;
    expect(message.seasonReport!.record.titles).toBe(2);
    state.seasonReview!.completedSeason.titles = 5;
    state.history.seasonRecords[0].titles = 5;
    message.seasonReport!.record.titles = 5;
    message.preview = 'Season finished with 5 titles and £5,000 prize money.';
    const cash = state.player.cash;
    const repaired = repairGameState(structuredClone(state));
    expect(repaired.seasonReview!.completedSeason.titles).toBe(2);
    expect(repaired.history.seasonRecords[0].titles).toBe(2);
    const email = repaired.inbox.find(m => m.id === message.id)!;
    expect(email.seasonReport!.record.titles).toBe(2);
    expect(email.preview).toContain('2 titles');
    expect(repaired.player.cash).toBe(cash);
    expect(repairSeasonTitleRecords(repaired)).toEqual(repaired);
  }, 30000);
  it('preserves unexplained older totals when the surviving archive is incomplete', () => {
    const state = completed();
    state.seasonReview!.completedSeason.titles = 9;
    state.history.seasonRecords[0].titles = 9;
    const repaired = repairSeasonTitleRecords(state);
    expect(repaired.seasonReview!.completedSeason.titles).toBe(9);
    expect(repaired.history.seasonRecords[0].titles).toBe(9);
  }, 30000);
});
