import { describe, expect, it } from 'vitest';
import { createStarterState, getNextEligibleTournament } from '../../hooks/useGameState';
import { careerDepthAction, initializeCareerDepth } from './index';
import { depthOf, plusDays } from './shared';
import { currentPlannerTour, plannerEventTour, recommendSeason, approveSchedule } from './seasonPlanning';
import { setPriority } from '../seasonBoard';
import { scheduleCommitment } from './commitments';

function fixture() {
  const seed = createStarterState();
  const state = initializeCareerDepth({ ...seed, careerDepth: undefined, player: { ...seed.player, cash: 100000 } });
  const original = getNextEligibleTournament(state)!;
  const events = [7, 25, 80].map((offset, i) => ({ ...original, id: `planner-test-${i}`, name: original.name,
    startDate: plusDays(state.currentDate, offset), endDate: plusDays(state.currentDate, offset + 2),
    entryDeadline: plusDays(state.currentDate, offset - 1), seedingCutoffDate: plusDays(state.currentDate, offset - 2), status: 'Available' as const }));
  return { ...state, tournaments: events };
}
describe('season planner selection', () => {
  it('defaults professionals to their tour and filters every unrelated circuit', () => {
    const s = createStarterState();
    s.careerSystems.pro.hasTourCard = true;
    expect(currentPlannerTour(s)).toBe('Main tour');
    const rows = recommendSeason(s, currentPlannerTour(s));
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(r => plannerEventTour(r.event) === 'Main tour')).toBe(true);
    expect(recommendSeason(s).length).toBeGreaterThan(rows.length);
  });
  it('approves more than one non-overlapping event but retains the six-week limit', () => {
    const s = fixture(), rows = recommendSeason(s);
    expect(rows.slice(0, 2).every(r => r.eligible && !r.blockedReason)).toBe(true);
    const ids = rows.slice(0, 2).map(r => r.event.id);
    const result = approveSchedule(s, ids, rows.slice(0, 2).reduce((n, r) => n + r.total, 0), 0);
    expect(depthOf(result).schedule?.eventIds).toEqual(ids);
    expect(depthOf(approveSchedule(s, rows.map(r => r.event.id), 10000, 0)).schedule).toBeNull();
  });
  it('saves multiple later priorities without booking or charging', () => {
    const s = fixture();
    const planned = setPriority(setPriority(s, s.tournaments[1].id), s.tournaments[2].id);
    expect(depthOf(planned).board?.priorities).toEqual([s.tournaments[1].id, s.tournaments[2].id]);
    expect(planned.player.cash).toBe(s.player.cash);
    expect(planned.tournaments).toEqual(s.tournaments);
    expect(depthOf(planned).schedule).toBeNull();
  });
  it('names actual commitments while allowing optional recovery advice to be overridden', () => {
    const s = fixture();
    s.tournaments[1].startDate = plusDays(s.tournaments[0].endDate!, 2);
    s.tournaments[1].endDate = plusDays(s.tournaments[1].startDate, 2);
    const optional = recommendSeason(s)[1];
    expect(optional.include).toBe(false);
    expect(optional.blockedReason).toBeNull();
    const booked = scheduleCommitment(s, 'recovery', s.tournaments[0].startDate);
    const blocked = recommendSeason(booked)[0];
    expect(blocked.blockedReason).toContain('Protected recovery');
    expect(blocked.blockedReason).toContain(s.tournaments[0].startDate);
    expect(depthOf(approveSchedule(booked, [s.tournaments[0].id], 10000, 0)).schedule).toBeNull();
  });
  it('shows qualification pending before the qualifier, then records a missed route afterwards', () => {
    const s = createStarterState();
    const qualifier = s.tournaments.find(t => t.name === 'International Championship Qualifying')!;
    const main = s.tournaments.find(t => t.name === 'International Championship')!;
    s.currentDate = plusDays(qualifier.startDate, -8);
    expect(recommendSeason(s).find(r => r.event.id === main.id)?.blockedReason).toContain('Qualification required:');
    qualifier.status = 'Skipped';
    expect(recommendSeason(s).find(r => r.event.id === main.id)?.blockedReason).toContain('did not qualify');
  });
  it('cancellation frees the qualifier and manual booking reports a pending decision', () => {
    const s = fixture(), event = s.tournaments[0];
    const booked = scheduleCommitment(s, 'recovery', event.startDate);
    const commitment = depthOf(booked).commitments.at(-1)!;
    const cancelled = careerDepthAction(booked, { type: 'cancel-commitment', id: commitment.id });
    expect(recommendSeason(cancelled)[0].blockedReason).toBeNull();
    expect(cancelled.player.cash).toBe(booked.player.cash);
    const approved = approveSchedule(cancelled, [event.id], 10000, 0);
    const reviewed = careerDepthAction({ ...approved, seasonReview: { ...approved.seasonReview!, pending: true } }, { type: 'run-assistance' });
    expect(reviewed.lastAction).toContain('season review');
  });

});
