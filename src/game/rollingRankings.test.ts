import { describe, expect, it } from 'vitest';
import { createStarterState, processRankingCalendar, repairGameState } from '../hooks/useGameState';
import type { BracketRound, Tournament } from '../types/game';
import { rankingEarningsSummary, initializeRollingRankings, recordRankingEvent, rebuildRollingRankings, rankingEventKey, lockTournamentSeedings, seedingRows, scheduleRankingExpiries } from './rollingRankings';

function fixture() {
  const state = createStarterState();
  const [a, b, c] = state.competitionTables.world;
  state.currentDate = '2026-09-01';
  state.rollingRankings = { version: 1, initializedOn: state.currentDate, processedThrough: state.currentDate, earnings: [], events: {}, legacyEventKeys: [], revisions: [{ date: state.currentDate, world: { [a.playerName]: 1, [b.playerName]: 2, [c.playerName]: 3 }, oneYear: {} }], seedings: {}, movementWorld: {}, movementOneYear: {} };
  state.competitionTables.world = [a, b, c].map((r, i) => ({ ...r, ranking: i + 1, points: 0 }));
  state.competitionTables.oneYear = state.competitionTables.world.map(r => ({ ...r }));
  const tournament: Tournament = { ...state.tournaments.find(t => t.type === 'Ranking')!, id: 'ledger-event', name: 'Ledger Open', rankingType: 'World Ranking', formatId: 'ukMajor', startDate: '2026-09-08', endDate: '2026-09-10', winnerPrize: 10000, runnerUpPrize: 4000, status: 'Available' };
  const bracket: BracketRound[] = [{ label: 'Final', matches: [{ id: 'final', top: { name: a.playerName, rank: 1, nation: 'ENG', score: 4 }, bottom: { name: b.playerName, rank: 2, nation: 'ENG', score: 1 }, placeholder: false }] }];
  state.tournaments = [tournament];
  return { state, tournament, bracket, a: a.playerName, b: b.playerName, c: c.playerName };
}
const award = (_t: Tournament, _r: string, won: boolean) => ({ prizeMoney: won ? 10000 : 4000 });

describe('rolling ranking earnings', () => {
  it('removes £100,000 being defended, adds £10,000, and reranks nonparticipants', () => {
    const { state, tournament, bracket, a, c } = fixture();
    state.rollingRankings!.earnings = [
      { id: 'defending', eventKey: 'old', playerName: a, amount: 100000, earnedOn: '2024-09-10', expiresOn: '2026-09-10', season: '2024/25' },
      { id: 'other', eventKey: 'other', playerName: c, amount: 50000, earnedOn: '2025-10-10', expiresOn: '2027-10-10', season: '2025/26' },
    ];
    const before = rebuildRollingRankings(state, state.currentDate);
    const pending = recordRankingEvent(before, tournament, bracket, award);
    expect(rebuildRollingRankings(pending, '2026-09-09').competitionTables.world.find(r => r.playerName === a)?.points).toBe(100000);
    const after = rebuildRollingRankings(pending, '2026-09-10');
    expect(after.competitionTables.world[0].playerName).toBe(c);
    expect(after.competitionTables.world.find(r => r.playerName === a)?.points).toBe(10000);
    expect(after.competitionTables.oneYear.find(r => r.playerName === c)?.points).toBe(0);
    expect(after.competitionTables.oneYear.find(r => r.playerName === a)?.points).toBe(10000);
  });
  it('records zero world credit for invitationals and never pays cash on recalculation', () => {
    const { state, tournament, bracket } = fixture();
    const event = { ...tournament, rankingType: 'None' as const, type: 'Invitational' as const };
    const next = recordRankingEvent(state, event, bracket, award);
    expect(next.rollingRankings!.earnings).toHaveLength(0);
    expect(next.rollingRankings!.events[rankingEventKey(event)].ranking).toBe(false);
    expect(next.player.cash).toBe(state.player.cash);
  });
  it('records each result once across import, reload and repeated processing', () => {
    const { state, tournament, bracket } = fixture();
    const once = recordRankingEvent(state, tournament, bracket, award);
    const reloaded = JSON.parse(JSON.stringify(once));
    const twice = recordRankingEvent(reloaded, tournament, bracket, award);
    expect(twice.rollingRankings).toEqual(once.rollingRankings);
    expect(initializeRollingRankings(twice)).toBe(twice);
  });
  it('freezes the designated seeding snapshot while live standings can change', () => {
    const { state, tournament, a, c } = fixture();
    tournament.seedingCutoffDate = '2026-09-01';
    const locked = lockTournamentSeedings(state, '2026-09-01');
    locked.rollingRankings!.earnings.push({ id: 'new', eventKey: 'new', playerName: c, amount: 50000, earnedOn: '2026-09-03', expiresOn: '2028-09-03', season: state.season });
    const updated = rebuildRollingRankings(locked, '2026-09-04');
    expect(updated.competitionTables.world[0].playerName).toBe(c);
    expect(seedingRows(updated, tournament, updated.competitionTables.world)[0].playerName).toBe(a);
  });
  it('simulates skipped fields deterministically without giving the human a result', () => {
    const { state, tournament } = fixture();
    state.tournaments = [{ ...tournament, status: 'Skipped' }];
    const humanEvents = state.competitionTables.world.find(r => r.playerName === state.player.fullName)?.eventsPlayed;
    const done = processRankingCalendar({ ...state, currentDate: '2026-09-11' });
    const again = processRankingCalendar(JSON.parse(JSON.stringify(done)));
    expect(again.rollingRankings).toEqual(done.rollingRankings);
    expect(done.rollingRankings!.events[rankingEventKey(tournament)].applied).toBe(true);
    expect(done.rollingRankings!.earnings.some(e => e.playerName === state.player.fullName)).toBe(false);
    expect(done.competitionTables.world.find(r => r.playerName === state.player.fullName)?.eventsPlayed).toBe(humanEvents);
    expect(done.player.cash).toBe(state.player.cash);
    expect(processRankingCalendar({ ...state, currentDate: '2026-09-11' }).rollingRankings).toEqual(done.rollingRankings);
  });
  it('migrates without replaying completed events or changing cash, titles and identity', () => {
    const state = createStarterState();
    state.schemaVersion = 9;
    state.rollingRankings = undefined;
    state.tournaments[0].status = 'Completed';
    const cash = state.player.cash;
    const titles = state.competitionTables.world.find(r => r.playerName === state.player.fullName)?.titles;
    const migrated = repairGameState(state);
    expect(migrated.rollingRankings!.legacyEventKeys).toContain(rankingEventKey(state.tournaments[0]));
    expect(migrated.player.cash).toBe(cash);
    expect(migrated.player.fullName).toBe(state.player.fullName);
    expect(migrated.competitionTables.world.find(r => r.playerName === state.player.fullName)?.titles).toBe(titles);
    expect(repairGameState(migrated).rollingRankings).toEqual(migrated.rollingRankings);
  });
  it('settles every CPU participant once and produces the same standings when advancing in steps', () => {
    const { tournament } = fixture();
    const state = createStarterState();
    state.currentDate = '2026-09-01';
    state.rollingRankings = undefined;
    state.tournaments = [tournament, { ...tournament, id: 'second-event', name: 'Second Open', startDate: '2026-09-18', endDate: '2026-09-21' }];
    const initial = initializeRollingRankings(state);
    const stepped = processRankingCalendar({ ...processRankingCalendar({ ...initial, currentDate: '2026-09-11' }), currentDate: '2026-09-22' });
    const jumped = processRankingCalendar({ ...initial, currentDate: '2026-09-22' });
    expect(stepped.competitionTables).toEqual(jumped.competitionTables);
    expect(stepped.rollingRankings).toEqual(jumped.rollingRankings);
    const event = jumped.rollingRankings!.events[rankingEventKey(tournament)];
    expect(event.bracket.flatMap(r => r.matches)).toHaveLength(31);
    expect(event.bracket.flatMap(r => r.matches).every(m => typeof m.top.score === 'number' && typeof m.bottom.score === 'number')).toBe(true);
    const earnings = jumped.rollingRankings!.earnings.filter(e => e.eventKey === event.key);
    expect(earnings).toHaveLength(32);
    expect(earnings.some(e => e.amount > 0)).toBe(true);
    expect(earnings.find(e => e.amount === tournament.winnerPrize)).toBeDefined();
    for (const e of earnings) {
      const before = initial.competitionTables.world.find(r => r.playerName === e.playerName)!;
      const after = jumped.competitionTables.world.find(r => r.playerName === e.playerName)!;
      expect(after.eventsPlayed - before.eventsPlayed).toBeGreaterThanOrEqual(1);
      expect(after.eventsPlayed - before.eventsPlayed).toBeLessThanOrEqual(2);
    }
    expect(processRankingCalendar(jumped).competitionTables).toEqual(jumped.competitionTables);
  });
  it('removes old-season money from the one-year list without decaying the two-year total', () => {
    const { state, tournament, bracket, a } = fixture();
    const awarded = recordRankingEvent(state, tournament, bracket, award);
    const next = rebuildRollingRankings({ ...awarded, season: '2027/28' }, '2027-05-10');
    expect(next.competitionTables.world.find(r => r.playerName === a)?.points).toBe(10000);
    expect(next.competitionTables.oneYear.find(r => r.playerName === a)?.points).toBe(0);
  });
  it('uses the corresponding future event finish when its calendar date changes', () => {
    const { state, tournament, bracket } = fixture();
    const awarded = recordRankingEvent(state, tournament, bracket, award);
    awarded.tournaments = [{ ...tournament, startDate: '2028-09-15', endDate: '2028-09-20' }];
    expect(scheduleRankingExpiries(awarded).rollingRankings!.earnings.every(e => e.expiresOn === '2028-09-20')).toBe(true);
  });
  it('includes same-day completed results in a designated seeding cut-off', () => {
    const { state, tournament, bracket, a } = fixture();
    const awarded = recordRankingEvent(state, tournament, bracket, award);
    const future = { ...tournament, id: 'future', startDate: '2026-10-01', endDate: '2026-10-02', seedingCutoffDate: '2026-09-10' };
    awarded.tournaments = [tournament, future];
    const done = processRankingCalendar({ ...awarded, currentDate: '2026-09-10' });
    expect(done.rollingRankings!.seedings[rankingEventKey(future)].world[a]).toBe(1);
    expect(done.competitionTables.world.find(r => r.playerName === a)?.points).toBe(10000);
  });
});

it('shows recorded credit as pending until publication without crediting it twice',()=>{
 const {state,tournament,bracket,a}=fixture();
 const recorded=recordRankingEvent(state,tournament,bracket,award);
 const before=rebuildRollingRankings({...recorded,currentDate:'2026-09-09'},'2026-09-09');
 expect(rankingEarningsSummary(before,a).pending).toHaveLength(1);
 expect(before.competitionTables.world.find(r=>r.playerName===a)?.points).toBe(0);
 const published=rebuildRollingRankings({...before,currentDate:'2026-09-10'},'2026-09-10');
 expect(rankingEarningsSummary(published,a).pending).toHaveLength(0);
 expect(published.competitionTables.world.find(r=>r.playerName===a)?.points).toBe(10000);
 expect(rebuildRollingRankings(published,'2026-09-10').competitionTables.world).toEqual(published.competitionTables.world);
 expect(published.player.cash).toBe(state.player.cash);
});
