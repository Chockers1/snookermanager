import { describe, expect, it } from 'vitest';
import { bookTravelState, createStarterState, enterTournamentState, getNextEligibleTournament, getTravelPackageEstimate } from '../../hooks/useGameState';
import { hotelOptionCatalog } from '../../data/catalogs';
import { detailedTournamentCatalog } from '../../data/pathwayCalendarData';
import { plusDays } from '../careerDepth/shared';
import { reconcileRealism } from './index';
import { hotelRoundDate, hotelStayPlan } from './accommodation';

function bookingFixture() {
  let state = createStarterState();
  state.player.cash = 50000;
  const event = { ...getNextEligibleTournament(state)!, formatId: 'shootOut', endDate: plusDays(getNextEligibleTournament(state)!.startDate, 6) };
  state.tournaments = [event];
  state = enterTournamentState(state, event.id);
  const estimate = getTravelPackageEstimate(state, undefined, hotelOptionCatalog[0].id, event.id);
  const before = state.player.cash;
  state = bookTravelState(state, event.id, undefined, hotelOptionCatalog[0].id);
  return { state, event, estimate, before, key: event.id + ':' + event.startDate };
}

describe('hotel stays by tournament progress', () => {
  it('charges only the initial stay on booking and quotes the full-run range', () => {
    const { state, event, estimate, before, key } = bookingFixture();
    expect(estimate.minNights).toBeLessThan(estimate.maxNights);
    expect(before - state.player.cash).toBeCloseTo(estimate.minCost, 2);
    expect(state.travel.bookings[event.id].totalCost).toBe(estimate.minCost);
    expect(state.realism!.journeys[key].hotelThrough).toBe(event.startDate);
    expect(estimate.maxCost - estimate.minCost).toBeCloseTo(6 * estimate.nightlyRate, 2);
  });
  it('extends the paid stay for a finalist once and updates the event costs', () => {
    const { state, event, estimate, key } = bookingFixture();
    const advanced = reconcileRealism({ ...state, tournamentProgress: { ...state.tournamentProgress, currentRound: 'Final' } });
    expect(state.player.cash - advanced.player.cash).toBeCloseTo(6 * estimate.nightlyRate, 2);
    expect(advanced.travel.bookings[event.id].totalCost).toBe(estimate.maxCost);
    expect(advanced.realism!.journeys[key].hotelThrough).toBe(event.endDate);
    expect(advanced.finance.ledger[0].description).toContain('6 extra hotel night(s) for Final');
    expect(advanced.history.tournamentHistory.find(h => h.tournamentId === event.id)?.bookedTravelCost).toBe(estimate.maxCost);
    const reloaded = reconcileRealism(JSON.parse(JSON.stringify(advanced)));
    expect(reloaded.player.cash).toBe(advanced.player.cash);
    expect(reloaded.travel.bookings[event.id].totalCost).toBe(estimate.maxCost);
  });
  it('does not extend hotel nights for an eliminated player or charge old prepaid bookings again', () => {
    const { state, event, key } = bookingFixture();
    const eliminated = reconcileRealism({ ...state, tournaments: state.tournaments.map(t => t.id === event.id ? { ...t, status: 'Completed' as const } : t), tournamentProgress: { ...state.tournamentProgress, currentRound: null } });
    expect(eliminated.player.cash).toBe(state.player.cash);
    expect(eliminated.realism!.journeys[key].hotelThrough).toBe(event.startDate);
    const legacy = { ...state, realism: { ...state.realism!, journeys: { ...state.realism!.journeys, [key]: { ...state.realism!.journeys[key], hotelNightlyRate: undefined, hotelThrough: event.endDate } } }, tournamentProgress: { ...state.tournamentProgress, currentRound: 'Final' as const } };
    expect(reconcileRealism(legacy).player.cash).toBe(state.player.cash);
  });
  it('does not bill prepaid event nights again when the calendar catches up', () => {
    const { state, event } = bookingFixture();
    const advanced = reconcileRealism({ ...state, tournamentProgress: { ...state.tournamentProgress, currentRound: 'Final' } });
    const settled = reconcileRealism({ ...advanced, currentDate: plusDays(event.endDate!, 1) });
    expect(settled.player.cash).toBe(advanced.player.cash);
  });
  it('uses calendar nights rather than charging a night for every round', () => {
    const shootout = detailedTournamentCatalog.find(t => t.name === 'Shoot Out')!;
    expect(hotelRoundDate(shootout, 'Last 128')).toBe(hotelRoundDate(shootout, 'Last 64'));
    expect(hotelRoundDate(shootout, 'Final')).toBe(shootout.endDate);
    const lateEntry = hotelStayPlan(shootout, plusDays(shootout.startDate, -1), 'Quarter Final');
    expect(lateEntry.minNights).toBe(4);
    expect(lateEntry.maxNights).toBe(5);
    expect(hotelStayPlan({ ...shootout, endDate: shootout.startDate }, shootout.startDate, 'Final')).toMatchObject({ minNights: 1, maxNights: 1 });
  });
});
