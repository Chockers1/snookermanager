import { createPlayerIdentitySeed, createPlayerSliderCatalog, createPlayerBackgroundCatalog } from '../data/gameContent';
import { getDefaultPreparationAllocations } from './tournamentPreparation';
import { reconcileRealism } from './realism';
import { describe, expect, it } from 'vitest';
import { detailedTournamentCatalog } from '../data/pathwayCalendarData';
import { createNewCareerState, getTournamentPlayability, enterTournamentState, bookTravelState, confirmTournamentPreparationState, startLiveMatchState, finalizeLiveMatch, createStarterState, buildTournamentDraw, resolveTournamentDrawRound, getTournamentEntryAccess, processRankingCalendar } from '../hooks/useGameState';
import { resolveTournamentFormat } from '../data/tournamentFormats';
import { recordRankingEvent, qualifiedNames } from './rollingRankings';

describe('seeded paths and attached qualification', () => {
  it.each([['pc-48', 5, 'Quarter Final'], ['pc-50', 6, 'Semi Final']] as const)('awards a card at the last actual match of %s', (id, games, last) => {
    let state = createNewCareerState({ fullName: createPlayerIdentitySeed.name, nationality: 'NZL', age: 18, handedness: 'Right-handed', cueStyle: createPlayerIdentitySeed.cueStyle, playingStyle: createPlayerIdentitySeed.playingStyle, personalityArchetype: createPlayerIdentitySeed.personalityArchetype, sliders: createPlayerSliderCatalog.map(s => ({ ...s })), backgroundId: createPlayerBackgroundCatalog[0].id, startingLevelId: 'start-q-school' });
    state.player.cash = 100000; state.equipment = createStarterState().equipment; const event = state.tournaments.find(t => t.id === id)!; state.tournaments = [event];
    expect(getTournamentEntryAccess(state, event).allowed).toBe(true);
    state = enterTournamentState(state, id); expect(state.tournamentProgress.currentRound, state.lastAction).not.toBeNull(); state = bookTravelState(state, id);
    state = confirmTournamentPreparationState(state, id, 'balanced', getDefaultPreparationAllocations(), []);
    state = reconcileRealism({ ...state, currentDate: event.startDate });
    for (let i = 0; i < games; i++) {
      state = startLiveMatchState(state, id); expect(state.liveMatch?.bestOf, JSON.stringify({game:i,round:state.tournamentProgress.currentRound,play:getTournamentPlayability(state,state.tournaments[0])})).toBe(7);
      if (i === games - 1) expect(state.liveMatch?.round).toBe(last);
      state = finalizeLiveMatch(state, { ...state.liveMatch!, playerFrames: 4, opponentFrames: 0, status: 'Completed' });
    }
    expect(state.tournamentProgress.currentRound).toBeNull();
    expect(state.history.tournamentHistory[0].matchesPlayed).toBe(games);
    expect(state.history.tournamentHistory[0].reward).toMatch(/tour card/i);
    expect(state.history.tournamentHistory[0].prizeMoney).toBe(0);
  });
  it.each(['German Masters', 'Northern Ireland Open', 'Saudi Arabia Masters', 'Shanghai Masters', 'Tour Championship', 'World Seniors Championship'])('%s protects seeds one and two in opposite halves', name => {
    const state = createStarterState(), event = detailedTournamentCatalog.find(t => t.name === name)!;
    const draw = buildTournamentDraw(state, event, resolveTournamentFormat(event).roundStructure[0], false, () => .1);
    const seeds = new Map(draw.flatMap(r => r.matches.flatMap(m => [m.top, m.bottom])).filter(p => p.seed).map(p => [p.name, p.seed!]));
    for (const round of draw) {
      for (const m of round.matches) {
        if (m.top.name === 'TBD' || m.bottom.name === 'TBD') continue;
        const top = seeds.get(m.top.name)! < seeds.get(m.bottom.name)!;
        m.top.score = top ? 100 : 0; m.bottom.score = top ? 0 : 100;
      }
      resolveTournamentDrawRound(draw, event, round.label, '', () => .1);
    }
    const final = draw.at(-1)!.matches[0];
    expect([seeds.get(final.top.name), seeds.get(final.bottom.name)].sort()).toEqual([1, 2]);
  });
  it('keeps the top three Global Play-Off seeds in separate card sections', () => {
    const state = createStarterState(), event = detailedTournamentCatalog.find(t => t.name === 'Q Tour Global Play-Offs')!;
    const draw = buildTournamentDraw(state, event, 'Quarter Final', false);
    for (let section = 0; section < 3; section++) {
      const players = draw[0].matches.slice(section * 4, section * 4 + 4).flatMap(m => [m.top, m.bottom]);
      expect(players.filter(p => p.seed! <= 3)).toHaveLength(1);
    }
  });
  it('lets top seeds play flat qualifiers and requires their actual qualification result for the main draw', () => {
    let state = createStarterState();
    const qualifier = state.tournaments.find(t => t.name === 'International Championship Qualifying')!;
    const main = state.tournaments.find(t => t.name === 'International Championship')!;
    expect(getTournamentEntryAccess(state, qualifier).allowed).toBe(true);
    expect(getTournamentEntryAccess(state, main).allowed).toBe(false);
    const draw = buildTournamentDraw(state, qualifier, 'Qualifying Round', true);
    for (const m of draw[0].matches) { const top = m.top.name === state.player.fullName || m.bottom.name !== state.player.fullName; m.top.score = top ? 6 : 0; m.bottom.score = top ? 0 : 6; }
    state = recordRankingEvent(state, qualifier, draw, () => ({ prizeMoney: 0 }));
    expect(qualifiedNames(draw)).toHaveLength(64);
    expect(getTournamentEntryAccess(state, main).allowed).toBe(true);
    const mainDraw = buildTournamentDraw(state, main, 'Last 64');
    expect(mainDraw[0].matches.flatMap(m => [m.top.name, m.bottom.name]).every(p => qualifiedNames(draw).includes(p))).toBe(true);
  });
  it('treats the Order of Merit review as administrative, with no draw or fictitious title', () => {
    const state = createStarterState(), event = state.tournaments.find(t => t.id === 'pc-120')!;
    expect(getTournamentEntryAccess(state, event).allowed).toBe(false);
    expect(buildTournamentDraw(state, event, '', false)).toEqual([]);
    const next = processRankingCalendar({ ...state, currentDate: event.endDate!, tournaments: [event] });
    expect(next.rollingRankings!.events[event.id + ':' + event.startDate]?.bracket).toEqual([]);
  });
});
