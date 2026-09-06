import { residenceRegion } from '../pathwayRules';
import type { GameState } from '../../hooks/useGameState';
import type { TrainingPlannerDay } from '../../types/game';
import type { RealismAction, RealismState } from './types';
import { bounded, careerMessage, dayNumber, depthOf, plusDays } from '../careerDepth/shared';
import { LOCATIONS, arrivalFatigue, routeBetween } from './travel';
import { TRAINING_BASES } from './base';
import { hotelRoundDate } from './accommodation';
import { updateWorldDigest } from './digest';
import { resolveSessionBreak } from './sessions';
import { watchableMatch } from './scouting';
import { buildTrainingCell } from '../../utils/trainingPlan';

export function realismOf(state: GameState): RealismState {
  return state.realism ?? { version: 1, initializedOn: state.currentDate, home: 'Britain', location: 'Britain', base: 'club', basePaidThrough: state.currentDate,
    journeys: {}, familiarised: [], activities: [], scouting: {}, seenEvents: Object.keys(state.rollingRankings?.events ?? {}), seenMatches: state.matches.map(m => m.id), digest: [], worldReviewedOn: state.currentDate,
    worldConditions: Object.fromEntries(state.worldPlayers.map(p => [p.id, { injured: Boolean(p.injuryWeeks), retired: p.retired }])) };
}
export function reconcileRealism(state: GameState): GameState {
  let next = { ...state, realism: realismOf(state) };
  for (const [key, journey] of Object.entries(next.realism.journeys).sort(([, a], [, b]) => a.arrival.localeCompare(b.arrival))) {
    if (journey.arrival > next.currentDate) continue;
    if (journey.applied) {
      if (!journey.fatigueRemaining || !journey.acclimatisedThrough) continue;
      const recovery = Math.min(journey.fatigueRemaining, Math.max(0, dayNumber(next.currentDate) - dayNumber(journey.acclimatisedThrough)) * 2);
      next = { ...next, realism: { ...next.realism, journeys: { ...next.realism.journeys, [key]: { ...journey, fatigueRemaining: journey.fatigueRemaining - recovery, acclimatisedThrough: next.currentDate } } }, player: { ...next.player, fatigue: bounded(next.player.fatigue - recovery) } };
    } else {
      const fatigue = arrivalFatigue(journey, next.currentDate);
      const applied = Math.min(fatigue, 100 - next.player.fatigue);
      next = { ...next, realism: { ...next.realism, location: journey.destination, journeys: { ...next.realism.journeys, [key]: { ...journey, applied: true, fatigueRemaining: applied, acclimatisedThrough: next.currentDate } } }, player: { ...next.player, fatigue: bounded(next.player.fatigue + applied) } };
    }
  }
  // Reserve additional hotel nights only when the player reaches a later round.
  // A saved paid-through date makes repeated finalization and reloads idempotent.
  const progress = next.tournamentProgress;
  const event = next.tournaments.find(t => t.id === progress.tournamentId && t.status === 'Entered');
  if (event && progress.currentRound) {
    const key = `${event.id}:${event.startDate}`;
    const journey = next.realism.journeys[key];
    const booking = next.travel.bookings[event.id];
    if (journey?.hotelNightlyRate !== undefined && journey.hotelThrough && booking) {
      const roundDate = hotelRoundDate(event, progress.currentRound);
      const calendarDate = next.currentDate > (event.endDate ?? event.startDate) ? event.endDate ?? event.startDate : next.currentDate;
      const through = roundDate > calendarDate ? roundDate : calendarDate;
      const nights = Math.max(0, dayNumber(through) - dayNumber(journey.hotelThrough));
      if (nights > 0) {
        const cost = Math.round(nights * journey.hotelNightlyRate * 100) / 100;
        const totalCost = Math.round((booking.totalCost + cost) * 100) / 100;
        next = { ...spend(next, cost, `hotel:${key}:${through}`, `${event.name}: ${nights} extra hotel night(s) for ${progress.currentRound} at £${journey.hotelNightlyRate}/night`),
          realism: { ...next.realism, journeys: { ...next.realism.journeys, [key]: { ...journey, hotelThrough: through } } },
          travel: { ...next.travel, bookings: { ...next.travel.bookings, [event.id]: { ...booking, totalCost } } },
          history: { ...next.history, tournamentHistory: next.history.tournamentHistory.map(h => h.startDate === event.startDate && h.tournamentId === event.id ? { ...h, bookedTravelCost: totalCost } : h) },
        };
      }
    }
  }
  // Charge only elapsed nights. This cursor survives reloads and partial weeks.
  const paidFrom = next.realism.basePaidThrough;
  const days = Math.max(0, dayNumber(next.currentDate) - dayNumber(paidFrom));
  if (days > 0) {
    const baseCost = Math.round(TRAINING_BASES[next.realism.base].weekly * days / 7 * 100) / 100;
    const lodging = Array.from({ length: days }, (_, i) => lodgingOn(next, plusDays(paidFrom, i))).reduce((n, cost) => n + cost, 0);
    if (baseCost + lodging > 0) next = { ...spend(next, baseCost + lodging, `realism-costs:${paidFrom}:${next.currentDate}`, `Base £${baseCost.toFixed(2)} and overseas lodging £${lodging} · ${paidFrom} to ${next.currentDate}`), realism: next.realism };
    next = { ...next, realism: { ...next.realism, basePaidThrough: next.currentDate } };
  }
  return updateWorldDigest(next);
}
export function realismBoundary(state: GameState) {
  const r = realismOf(state);
  return [...Object.values(r.journeys).filter(j => !j.applied).flatMap(j => [j.departure, j.arrival]), ...r.activities.map(a => a.date)].filter(date => date > state.currentDate).sort()[0];
}
function lodgingOn(state: GameState, date: string): number {
  const r = realismOf(state);
  const latest = Object.values(r.journeys).filter(j => j.arrival <= date).sort((a, b) => b.arrival.localeCompare(a.arrival))[0];
  const location = latest?.destination ?? r.home;
  if (location === r.home) return 0;
  const prepaid = Object.values(r.journeys).some(j => j.destination === location && j.arrival <= date && j.hotelThrough && date <= j.hotelThrough);
  return prepaid ? 0 : 35;
}
export function overseasWeeklyCost(state: GameState) {
  return Array.from({ length: 7 }, (_, i) => lodgingOn(state, plusDays(state.currentDate, i))).reduce((n, cost) => n + cost, 0);
}
export function protectRealismSessions(state: GameState, plan: TrainingPlannerDay[]) {
  const r = realismOf(state), anchor = plusDays(depthOf(state).nextSettlementDate, -7);
  return plan.map((day, i) => {
    const date = plusDays(anchor, i);
    const journey = Object.values(r.journeys).find(j => date >= j.departure && date < j.arrival);
    if (journey && !day.competitionName) return { ...day, morning: buildTrainingCell('travel'), afternoon: buildTrainingCell('travel'), evening: buildTrainingCell('rest'), competitionName: `In transit: ${journey.destination}` };
    const activity = r.activities.find(a => a.date === date);
    if (!activity || day.competitionName) return day;
    return { ...day, evening: { ...buildTrainingCell('review'), subtitle: activity.label } };
  });
}
function spend(state: GameState, amount: number, id: string, description: string): GameState {
  return { ...state, player: { ...state.player, cash: state.player.cash - amount }, finance: { ...state.finance, ledger: [{ id, date: state.currentDate, description, amount, category: 'Career support', type: 'Expense' }, ...state.finance.ledger] } };
}
export function realismAction(state: GameState, action: RealismAction): GameState {
  state = reconcileRealism(state);
  const r = realismOf(state);
  state = { ...state, realism: r };
  const fail = (text: string) => ({ ...state, lastAction: text });
  const affordable = (cost: number) => Number.isFinite(cost) && state.player.cash - cost >= (state.careerDepth?.schedule?.enabled ? state.careerDepth.schedule.reserve : 0);
  if (action.type === 'break') {
    if (!state.liveMatch) return fail('No match interval is waiting.');
    const liveMatch = resolveSessionBreak(state.liveMatch, action.choice);
    return { ...state, liveMatch, lastAction: liveMatch.lastVisitSummary };
  }
  if (state.liveMatch?.status === 'In Progress') return fail('Finish the current match before making off-table commitments.');
  if (action.type === 'base') {
    const base = TRAINING_BASES[action.base];
    if (!base || !LOCATIONS[action.location]) return fail('Select a listed training base and location.');
    if (action.base === r.base && action.location === r.home) return fail('This is already your training base.');
    if (Object.values(r.journeys).some(j => !j.applied) || state.tournaments.some(t => t.status === 'Entered' && t.startDate <= plusDays(state.currentDate, 7))) return fail('Finish booked travel and this week’s competition before relocating.');
    if (r.relocationDate && dayNumber(state.currentDate) - dayNumber(r.relocationDate) < 28) return fail('Review your base after four weeks before moving again.');
    const moving = action.location !== r.home;
    const route = routeBetween(r.location, action.location);
    const cost = base.joining + (moving ? Math.round(300 + route.distanceKm * 0.065) : 0);
    if (!affordable(cost + base.weekly * 4)) return fail('Keep four weeks of base fees and your approved reserve after joining or relocation costs.');
    const next = spend(state, cost, `base:${state.currentDate}`, `${base.name}${moving ? ' relocation and joining' : ' joining'}`);
    const journeyKey = `relocation:${state.currentDate}`;
    return { ...next, realism: { ...r, base: action.base, home: action.location, relocationDate: moving ? state.currentDate : r.relocationDate, regionalResidenceSince: moving && residenceRegion(r.home) !== residenceRegion(action.location) ? state.currentDate : r.regionalResidenceSince ?? r.relocationDate,
      journeys: moving ? { ...r.journeys, [journeyKey]: { eventKey: journeyKey, origin: r.location, destination: action.location, distanceKm: route.distanceKm, zoneHours: route.zoneHours, mode: route.flight ? 'Flight' : 'Ground', departure: state.currentDate, arrival: plusDays(state.currentDate, route.flight ? 2 : 1), acclimatisationDays: 0, fatigue: route.flight ? 12 : 4, cost, applied: false } } : r.journeys }, lastAction: `${base.name}: £${cost} paid; £${base.weekly}/week recurring. ${moving ? 'Relocation travel is reserved in the timetable.' : 'Permanent attributes are unchanged.'}` };
  }
  if (action.type === 'return-home') {
    if (r.location === r.home) return fail('You are already at your home base.');
    if (Object.values(r.journeys).some(j => !j.applied) || state.tournaments.some(t => t.status === 'Entered' && (t.endDate ?? t.startDate) >= state.currentDate && t.startDate <= plusDays(state.currentDate, 3))) return fail('Complete or revise existing travel and competition commitments before returning home.');
    const route = routeBetween(r.location, r.home), cost = Math.round(45 + route.distanceKm * 0.065), id = `return:${state.currentDate}`;
    if (r.journeys[id]) return fail('Your return journey is already booked.');
    if (!affordable(cost)) return fail('Not enough unreserved cash to return home.');
    const next = spend(state, cost, id, 'Return to training base');
    return { ...next, realism: { ...r, journeys: { ...r.journeys, [id]: { eventKey: id, origin: r.location, destination: r.home, distanceKm: route.distanceKm, zoneHours: route.zoneHours, mode: route.flight ? 'Flight' : 'Ground', departure: state.currentDate, arrival: plusDays(state.currentDate, route.flight ? 2 : 1), acclimatisationDays: 0, fatigue: route.flight ? 12 : 4, cost, applied: false } } }, lastAction: `Return travel booked for £${cost}. Staying overseas costs £35 per unbooked night; prepaid event hotel nights are excluded.` };
  }
  if (action.type === 'familiarise') {
    const event = state.tournaments.find(t => t.id === action.eventId && t.status === 'Entered');
    if (!event || !state.travel.bookings[event.id]) return fail('Enter this event and book travel first.');
    const key = `${event.id}:${event.startDate}`;
    const date = r.journeys[key]?.arrival ?? plusDays(event.startDate, -1);
    if (date < state.currentDate || r.familiarised.includes(key) || r.activities.some(a => a.date === date)) return fail('No unused familiarisation slot remains before this event.');
    if (state.trainingAppliedWeek === state.week && date < depthOf(state).nextSettlementDate) return fail('This training week is already settled. Book familiarisation before applying that week.');
    if (!affordable(35)) return fail('Not enough unreserved cash for the £35 practice table session.');
    const next = spend(state, 35, `familiarise:${key}`, `${event.name} familiarisation table`);
    return { ...next, realism: { ...r, familiarised: [...r.familiarised, key], activities: [...r.activities, { id: `familiarise:${key}`, date, kind: 'familiarise', label: `Venue familiarisation: ${event.name}` }] }, lastAction: `£35 table session reserved for ${date}, evening. Replaces normal evening training; halves the small unfamiliar-condition penalty.` };
  }
  const match = watchableMatch(state, action.opponentId);
  const date = state.currentDate;
  if (!match) return fail('No unwatched recorded match is available for this active opponent.');
  if (state.trainingAppliedWeek === state.week || r.activities.some(a => a.date === date) || Object.values(r.journeys).some(j => j.departure <= date && date < j.arrival) || state.tournaments.some(t => t.status === 'Entered' && date >= plusDays(t.startDate, -1) && date <= (t.endDate ?? t.startDate))) return fail('Watching requires a free evening in an unapplied training week.');
  const old = r.scouting[action.opponentId] ?? { watched: [], lastDate: '' };
  if (old.lastDate && dayNumber(date) - dayNumber(old.lastDate) < 7) return fail('Allow one week between detailed scouting reviews of this opponent.');
  const next = { ...state, realism: { ...r, scouting: { ...r.scouting, [action.opponentId]: { watched: [...old.watched, match.key], lastDate: date } }, activities: [...r.activities, { id: `watch:${match.key}`, date, kind: 'scout' as const, label: `Scouting: ${match.event} · ${match.round}` }] }, lastAction: 'Recorded match reviewed. This evening becomes video review; scouting uncertainty narrows, not your opponent’s ability.' };
  return careerMessage(next, `scout:${match.key}`, 'Scouting review completed', `${match.event}: ${match.match.top.name} ${match.match.top.score}–${match.match.bottom.score} ${match.match.bottom.name}. One more observed match; small samples remain uncertain.`, '/match/preview');
}
