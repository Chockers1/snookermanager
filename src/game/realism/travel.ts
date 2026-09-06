import type { GameState } from '../../hooks/useGameState';
import type { Tournament, TravelOption } from '../../types/game';
import { travelOptionCatalog } from '../../data/catalogs';
import { plusDays, dayNumber } from '../careerDepth/shared';
import type { Journey } from './types';

// Approximate route planning, not airline fares or a live timetable. Offsets are
// deliberately standard-time estimates; the UI labels them as such.
export const LOCATIONS: Record<string, { lat: number; lon: number; zone: number; region: string }> = {
  Auckland: { lat: -36.85, lon: 174.76, zone: 12, region: 'New Zealand' },
  Perth: { lat: -31.95, lon: 115.86, zone: 8, region: 'Australia' },
  Albury: { lat: -36.08, lon: 146.92, zone: 10, region: 'Australia' },
  Brisbane: { lat: -27.47, lon: 153.03, zone: 10, region: 'Australia' },
  Toronto: { lat: 43.65, lon: -79.38, zone: -5, region: 'Canada' },
  SanJose: { lat: 37.34, lon: -121.89, zone: -8, region: 'USA' },
  RiodeJaneiro: { lat: -22.91, lon: -43.17, zone: -3, region: 'Brazil' },
  Dubai: { lat: 25.20, lon: 55.27, zone: 4, region: 'UAE' },
  Vienna: { lat: 48.21, lon: 16.37, zone: 1, region: 'Austria' },
  Sofia: { lat: 42.70, lon: 23.32, zone: 2, region: 'Bulgaria' },
  Oberhausen: { lat: 51.50, lon: 6.86, zone: 1, region: 'Germany' },
  Lochristi: { lat: 51.10, lon: 3.83, zone: 1, region: 'Belgium' },
  Britain: { lat: 52.5, lon: -1.5, zone: 0, region: 'Britain' },
  Belfast: { lat: 54.6, lon: -5.9, zone: 0, region: 'Ireland' },
  Dublin: { lat: 53.3, lon: -6.3, zone: 0, region: 'Ireland' },
  Berlin: { lat: 52.5, lon: 13.4, zone: 1, region: 'Europe' },
  Shanghai: { lat: 31.2, lon: 121.5, zone: 8, region: 'China' },
  Beijing: { lat: 39.9, lon: 116.4, zone: 8, region: 'China' },
  "Xi'an": { lat: 34.3, lon: 108.9, zone: 8, region: 'China' },
  Wuhan: { lat: 30.6, lon: 114.3, zone: 8, region: 'China' },
  Yushan: { lat: 28.7, lon: 118.2, zone: 8, region: 'China' },
  Riyadh: { lat: 24.7, lon: 46.7, zone: 3, region: 'Saudi Arabia' },
  Jeddah: { lat: 21.5, lon: 39.2, zone: 3, region: 'Saudi Arabia' },
  HongKong: { lat: 22.3, lon: 114.2, zone: 8, region: 'Hong Kong' },
  Bangkok: { lat: 13.8, lon: 100.5, zone: 7, region: 'Thailand' },
  Sydney: { lat: -33.9, lon: 151.2, zone: 10, region: 'Australia' },
};
export function locationFor(text: string) {
  const normalized = text.toLowerCase().replace(/[’'\s-]/g, '');
  const match = Object.keys(LOCATIONS).find(k => normalized.includes(k.toLowerCase().replace(/[’'\s-]/g, '')));
  if (match) return match;
  if (/china|guangzhou|chengdu|nanjing|dalian/i.test(text)) return 'Beijing';
  if (/german|europe|belgium|poland|gibraltar|antalya/i.test(text)) return 'Berlin';
  return 'Britain';
}
export function routeBetween(origin: string, destination: string) {
  const a = LOCATIONS[origin] ?? LOCATIONS.Britain, b = LOCATIONS[destination] ?? LOCATIONS.Britain;
  const radians = Math.PI / 180;
  const h = Math.sin((b.lat - a.lat) * radians / 2) ** 2 + Math.cos(a.lat * radians) * Math.cos(b.lat * radians) * Math.sin((b.lon - a.lon) * radians / 2) ** 2;
  const distanceKm = Math.round(12742 * Math.asin(Math.min(1, Math.sqrt(h))));
  return { distanceKm, zoneHours: Math.abs(a.zone - b.zone), flight: a.region !== b.region || distanceKm > 1300 };
}
export function originFor(state: GameState, tournament: Tournament) {
  const booked = state.realism?.journeys[`${tournament.id}:${tournament.startDate}`];
  if (booked) return booked.origin;
  const earlier = Object.values(state.realism?.journeys ?? {}).filter(j => j.arrival <= tournament.startDate && j.arrival >= state.currentDate && j.eventKey !== `${tournament.id}:${tournament.startDate}`).sort((a, b) => b.arrival.localeCompare(a.arrival))[0];
  return earlier?.destination ?? state.realism?.location ?? 'Britain';
}
export function travelOptionsFor(state: GameState, tournament?: Tournament): TravelOption[] {
  if (!tournament) return travelOptionCatalog;
  const destination = locationFor(tournament.location), route = routeBetween(originFor(state, tournament), destination);
  return travelOptionCatalog.map((option, i) => {
    const cost = route.flight ? Math.round(95 + route.distanceKm * [0.045, 0.065, 0.09, 0.14, 0.22][i]) : Math.round(option.cost * (route.distanceKm > 0 ? Math.max(1, route.distanceKm / 300) : 1));
    return { ...option, cost, name: route.flight ? ['Economy connecting flight', 'Economy direct flight', 'Flexible economy flight', 'Premium economy flight', 'Business class flight'][i] : option.name,
      icon: route.flight ? 'Plane' : option.icon,
      fatigueValue: Math.min(95, option.fatigueValue + (route.flight ? route.zoneHours * 2 : 0)) };
  });
}
export function journeyQuote(state: GameState, tournament: Tournament, travelId: string): Journey {
  const booked = state.realism?.journeys[`${tournament.id}:${tournament.startDate}`];
  if (booked && (booked.applied || booked.departure <= state.currentDate)) return booked;
  const origin = originFor(state, tournament), destination = locationFor(tournament.location), route = routeBetween(origin, destination);
  const option = travelOptionsFor(state, tournament).find(t => t.id === travelId) ?? travelOptionsFor(state, tournament)[0];
  const acclimatisationDays = route.flight ? Math.min(4, 1 + Math.ceil(route.zoneHours / 3)) : 1;
  const preferredArrival = plusDays(tournament.startDate, -acclimatisationDays);
  const earlierJourney = Object.values(state.realism?.journeys ?? {}).filter(j => j.eventKey !== `${tournament.id}:${tournament.startDate}` && j.arrival <= tournament.startDate).sort((a, b) => b.arrival.localeCompare(a.arrival))[0];
  const previousEvent = earlierJourney ? state.tournaments.find(t => `${t.id}:${t.startDate}` === earlierJourney.eventKey && t.status === 'Entered') : undefined;
  const freeFrom = previousEvent ? plusDays(previousEvent.endDate ?? previousEvent.startDate, 1) : earlierJourney?.arrival ?? state.currentDate;
  const earliestArrival = plusDays(freeFrom > state.currentDate ? freeFrom : state.currentDate, route.distanceKm > 5000 ? 1 : 0);
  const arrival = preferredArrival < earliestArrival ? earliestArrival : preferredArrival;
  return { eventKey: `${tournament.id}:${tournament.startDate}`, origin, destination, ...route, mode: route.flight ? 'Flight' : 'Ground',
    departure: plusDays(arrival, route.distanceKm > 5000 ? -1 : 0), arrival, acclimatisationDays,
    fatigue: Math.round(option.fatigueValue / 10 + route.zoneHours), cost: option.cost, applied: false, hotelThrough: tournament.endDate ?? tournament.startDate };
}
export function arrivalFatigue(journey: Journey, startDate: string) {
  return Math.max(0, journey.fatigue - Math.max(0, dayNumber(startDate) - dayNumber(journey.arrival)) * 2);
}
