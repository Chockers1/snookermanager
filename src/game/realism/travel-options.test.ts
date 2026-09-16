import { describe, expect, it } from 'vitest';
import { bookTravelState, createStarterState, enterTournamentState, getNextEligibleTournament, getTravelPackageEstimate, repairGameState } from '../../hooks/useGameState';
import { hotelOptionCatalog, travelOptionCatalog } from '../../data/catalogs';
import { LOCATIONS, travelOptionsFor } from './travel';

function fixture() {
  let state = createStarterState();
  const event = getNextEligibleTournament(state)!;
  state.player.cash = 50000;
  state = enterTournamentState(state, event.id);
  return { state, event };
}

describe('expanded travel packages', () => {
  it('quotes every transport option with a valid name and fare across all destination regions', () => {
    const { state, event } = fixture();
    expect(new Set(travelOptionCatalog.map(o => o.id)).size).toBe(6);
    expect(new Set(hotelOptionCatalog.map(o => o.id)).size).toBe(6);
    for (const destination of Object.keys(LOCATIONS)) {
      const options = travelOptionsFor(state, { ...event, location: destination });
      expect(options).toHaveLength(6);
      for (const option of options) {
        expect(option.name.length).toBeGreaterThan(5);
        expect(Number.isFinite(option.cost)).toBe(true);
        expect(option.cost).toBeGreaterThan(0);
        expect(option.fatigueValue).toBeLessThanOrEqual(100);
      }
    }
    expect(travelOptionsFor(state, { ...event, location: 'Hong Kong' }).find(o => o.id === 'travel-6')?.name).toBe('Premium flexible flight');
  });

  it.each(['hotel-5', 'hotel-6'])('books %s with the new rail tier, updates by the difference and survives reload', hotelId => {
    const { state, event } = fixture();
    const estimate = getTravelPackageEstimate(state, 'travel-6', hotelId, event.id);
    const booked = bookTravelState(state, event.id, 'travel-6', hotelId);
    expect(booked.travel.bookings[event.id]).toMatchObject({ travelOptionId: 'travel-6', hotelOptionId: hotelId, totalCost: estimate.minCost });
    expect(booked.player.cash).toBeCloseTo(state.player.cash - estimate.minCost, 2);
    const reloaded = repairGameState(JSON.parse(JSON.stringify(booked)));
    expect(reloaded.travel.bookings[event.id]).toEqual(booked.travel.bookings[event.id]);
    expect(reloaded.player.cash).toBe(booked.player.cash);
    const replacement = getTravelPackageEstimate(booked, 'travel-2', 'hotel-2', event.id);
    const updated = bookTravelState(booked, event.id, 'travel-2', 'hotel-2');
    expect(updated.player.cash).toBeCloseTo(state.player.cash - replacement.totalCost, 2);
    const repeated = bookTravelState(updated, event.id, 'travel-2', 'hotel-2');
    expect(repeated.player.cash).toBe(updated.player.cash);
  });

  it('preserves existing IDs and prices, and gives new hotels different recovery/preparation tradeoffs', () => {
    expect(travelOptionCatalog.slice(0, 5).map(o => [o.id, o.cost])).toEqual([['travel-1',40],['travel-2',75],['travel-3',110],['travel-4',140],['travel-5',220]]);
    expect(hotelOptionCatalog.slice(0,4).map(o => o.cost)).toEqual([95,140,210,290]);
    const budget = hotelOptionCatalog.find(o => o.id === 'hotel-1')!;
    const guesthouse = hotelOptionCatalog.find(o => o.id === 'hotel-5')!;
    const apartment = hotelOptionCatalog.find(o => o.id === 'hotel-6')!;
    const players = hotelOptionCatalog.find(o => o.id === 'hotel-3')!;
    expect(guesthouse.cost).toBeLessThan(budget.cost);
    expect(guesthouse.recoveryValue).toBeLessThan(budget.recoveryValue);
    expect(apartment.recoveryValue).toBeGreaterThan(players.recoveryValue);
    expect(apartment.preparationValue).toBeLessThan(players.preparationValue);
  });
});
