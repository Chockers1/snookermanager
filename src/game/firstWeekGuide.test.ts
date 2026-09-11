import { describe, expect, it } from 'vitest';
import { createNewCareerState, createStarterState, buyCueState, buyChalkState, buyTipState, repairGameState, getNextEligibleTournament } from '../hooks/useGameState';
import { cueMarketplaceCatalog, chalkCatalog, tipCatalog } from '../data/catalogs';
import { guideView, reconcileFirstWeekGuide, firstWeekEntryRoute } from './firstWeekGuide';

describe('automatic equipment guide milestone', () => {
  it('recognises a ready setup in an existing save without a separate acknowledgement or money change', () => {
    const state = createNewCareerState();
    state.equipment = createStarterState().equipment;
    state.firstWeekGuide!.completed = ['training'];
    const next = reconcileFirstWeekGuide(state);
    expect(next.firstWeekGuide!.completed).toEqual(['training', 'equipment']);
    expect(guideView(next).current?.id).toBe('entry');
    expect(next.player).toBe(state.player); expect(next.equipment).toBe(state.equipment);
    expect(reconcileFirstWeekGuide(next)).toBe(next);
    expect(repairGameState(JSON.parse(JSON.stringify(next))).firstWeekGuide!.completed).toContain('equipment');
  });
  it('ticks the step as actual purchases finish an incomplete setup', () => {
    let state = createNewCareerState(); state.player.cash = 100000;
    expect(guideView(state).guide!.completed).not.toContain('equipment');
    const cue = [...cueMarketplaceCatalog].sort((a, b) => a.price - b.price)[0];
    const chalk = [...chalkCatalog].sort((a, b) => a.cost - b.cost)[0];
    const tip = [...tipCatalog].sort((a, b) => a.cost - b.cost)[0];
    state = buyCueState(state, cue.id);
    expect(state.firstWeekGuide!.completed).not.toContain('equipment');
    state = buyChalkState(state, chalk.id);
    expect(state.firstWeekGuide!.completed).not.toContain('equipment');
    state = buyTipState(state, tip.id);
    expect(state.firstWeekGuide!.completed).toContain('equipment');
    expect(state.firstWeekGuide!.equipmentReviewed).toBeFalsy();
  });
  it.each(['cue', 'chalk stock', 'chalk condition', 'tip'] as const)('does not tick when missing %s', missing => {
    const state = createNewCareerState(); state.equipment = createStarterState().equipment;
    if (missing === 'cue') state.equipment.currentCueId = '';
    if (missing === 'chalk stock') state.equipment.chalkStock[state.equipment.currentChalkId!] = 0;
    if (missing === 'chalk condition') state.equipment.chalkCondition = 0;
    if (missing === 'tip') state.equipment.currentTipId = '';
    expect(guideView(state).guide!.completed).not.toContain('equipment');
  });
  it('preserves a completed milestone after equipment wears out, without creating guides for older opt-out careers', () => {
    const old = createStarterState(); expect(reconcileFirstWeekGuide(old)).toBe(old);
    const state = createNewCareerState(); state.equipment = old.equipment;
    const completed = reconcileFirstWeekGuide(state);
    completed.equipment.chalkCondition = 0;
    expect(reconcileFirstWeekGuide(completed).firstWeekGuide!.completed).toContain('equipment');
  });
});


describe('guided calendar links', () => {
 it.each(['start-club-junior', 'start-elite-amateur', 'start-q-tour', 'start-rookie-pro'])('selects the next eligible event for %s without changing the career', startingLevelId => {
  const state = createNewCareerState({ fullName: 'Calendar Tester', nationality: 'England', handedness: 'Right-handed', cueStyle: '', playingStyle: '', personalityArchetype: '', sliders: [], backgroundId: '', startingLevelId, age: startingLevelId === 'start-club-junior' ? 15 : 22 });
  const before = JSON.stringify(state), event = getNextEligibleTournament(state);
  expect(event).toBeDefined();
  const query = new URL(firstWeekEntryRoute(state), 'http://local').searchParams;
  expect(query.get('tournament')).toBe(event!.id);
  expect(query.get('guide')).toBe('entry'); expect(JSON.stringify(state)).toBe(before);
 });
 it('falls back to the calendar when there is no eligible event', () => {
  const state = createNewCareerState(); state.tournaments = [];
  expect(firstWeekEntryRoute(state)).toBe('/calendar?guide=entry');
 });
});
