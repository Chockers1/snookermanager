import { describe, expect, it } from 'vitest';
import { detailedTournamentCatalog } from '../data/pathwayCalendarData';
import { createGroupCompetition, applyGroupCompetitionResult, resolveGroupCompetitionStage, groupCompetitionChampion, roundRobin, settleAmateurGroupTies } from './groupCompetition';
import { fixtureComplete, nextGroupFixture, groupTable } from './championshipLeague';
import { createStarterState, enterTournamentState, bookTravelState, confirmTournamentPreparationState, startLiveMatchState, finalizeLiveMatch, getTournamentEntryAccess } from '../hooks/useGameState';
import { getDefaultPreparationAllocations } from './tournamentPreparation';
import { reconcileRealism } from './realism';
const field = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, rank: i + 1, nation: 'ENG' }));

describe('all group competition routes', () => {
  it('resolves a three-way amateur tie using saved black-ball play-offs, not highest breaks', () => {
    const r = roundRobin('Group 1', field(4), 'amateur', 2, 5);
    for (const m of r.matches) {
      const win = m.top.name === 'P4' ? m.bottom.name : m.bottom.name === 'P4' ? m.top.name : [['P1', 'P2'], ['P2', 'P3'], ['P3', 'P1']].find(pair => pair.includes(m.top.name) && pair.includes(m.bottom.name))![0];
      m.top.score = m.top.name === win ? 3 : m.top.name === 'P4' ? 0 : 1;
      m.bottom.score = m.bottom.name === win ? 3 : m.bottom.name === 'P4' ? 0 : 1;
      m.topBreaks = [m.top.name === 'P3' ? 140 : 30]; m.bottomBreaks = [m.bottom.name === 'P3' ? 140 : 30];
    }
    settleAmateurGroupTies(r, () => 0);
    expect(r.groupTieMatches).toHaveLength(3);
    expect(groupTable(r.matches, 'amateur', r.groupTieOrder!['Group 1']).map(p => p.name)).toEqual(['P1', 'P2', 'P3', 'P4']);
    settleAmateurGroupTies(r, () => .99); expect(r.groupTieMatches).toHaveLength(3);
  });
  it('gives each invitational player six unique opponents and the correct tie-break priority', () => {
    const r = roundRobin('Group 1', field(7), 'winsFrames', 4, 5);
    expect(r.matches).toHaveLength(21);
    for (const p of field(7)) expect(r.matches.filter(m => [m.top.name, m.bottom.name].includes(p.name))).toHaveLength(6);
    const t = groupTable([{ id: 'a', top: { ...field(2)[0], score: 3 }, bottom: { ...field(2)[1], score: 2 } }], 'winsFrames');
    expect(t[0]).toMatchObject({ points: 1, won: 1, framesFor: 3 });
  });
  it('plays seven rolling groups and a winners group, each with two semi-finals and a final', () => {
    const event = detailedTournamentCatalog.find(t => t.id === 'pc-69')!;
    const draw = createGroupCompetition(event, field(25));
    for (const r of draw) resolveGroupCompetitionStage(draw, event, r.label, () => .2);
    expect(draw.map(r => r.matches.length)).toEqual(Array.from({ length: 8 }, () => [21, 2, 1]).flat());
    expect(draw.flatMap(r => r.matches)).toHaveLength(192);
    expect(draw.flatMap(r => r.matches).every(fixtureComplete)).toBe(true);
    expect(groupCompetitionChampion(draw, event)).toBeTruthy();
  });
  it('keeps eliminated group players playing their scheduled amateur games and advances two', () => {
    const event = detailedTournamentCatalog.find(t => t.id === 'pc-95')!;
    let draw = createGroupCompetition(event, field(64));
    for (let i = 0; i < 3; i++) {
      const m = nextGroupFixture(draw, 'Group Stage', 'P1')!;
      const result = applyGroupCompetitionResult(draw, event, 'Group Stage', 'P1', m.top.name === 'P1' ? m.bottom.name : m.top.name, 0, 3, [0], [80]);
      expect(result.nextRound).toBe(i === 2 ? null : 'Group Stage'); draw = result.draw;
    }
    expect(draw[1].matches).toHaveLength(16);
    expect(draw[1].matches.some(m => [m.top.name, m.bottom.name].includes('P1'))).toBe(false);
  });
  it('does not award the club league to somebody simply for winning their last fixture', () => {
    const event = detailedTournamentCatalog.find(t => t.id === 'pc-01')!;
    let draw = createGroupCompetition(event, field(16));
    for (let i = 0; i < 15; i++) {
      const m = nextGroupFixture(draw, 'League', 'P1')!;
      const result = applyGroupCompetitionResult(draw, event, 'League', 'P1', m.top.name === 'P1' ? m.bottom.name : m.top.name, i === 14 ? 2 : 0, i === 14 ? 0 : 2, [], []);
      expect(result.nextRound).toBe(i === 14 ? null : 'League'); draw = result.draw;
    }
    expect(groupCompetitionChampion(draw, event)).not.toBe('P1');
  });
  it('lets the human win an invitational group, wait for winners, and complete all sixteen matches', () => {
    let state = createStarterState(); state.player.cash = 100000;
    const event = state.tournaments.find(t => t.id === 'pc-69')!;
    state.tournaments = [event];
    expect(getTournamentEntryAccess(state, event).allowed, getTournamentEntryAccess(state, event).reason ?? '').toBe(true);
    state = enterTournamentState(state, event.id);
    state = bookTravelState(state, event.id);
    state = confirmTournamentPreparationState(state, event.id, 'balanced', getDefaultPreparationAllocations(), []);
    state = reconcileRealism({ ...state, currentDate: event.startDate });
    for (let i = 0; i < 16; i++) {
      state = startLiveMatchState(state, event.id);
      expect(state.liveMatch?.bestOf, state.tournamentProgress.currentRound ?? 'finished').toBe(5);
      state = finalizeLiveMatch(state, { ...state.liveMatch!, playerFrames: 3, opponentFrames: 0, status: 'Completed' });
    }
    expect(state.tournamentProgress.currentRound).toBeNull();
    expect(state.history.tournamentHistory[0]).toMatchObject({ matchesPlayed: 16, result: 'Winner' });
    expect(state.history.tournamentHistory[0].prizeMoney).toBeGreaterThanOrEqual(22000);
  });
});
