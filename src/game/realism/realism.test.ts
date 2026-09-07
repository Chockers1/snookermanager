import { describe, expect, it } from 'vitest';
import { createStarterState, enterTournamentState, bookTravelState, getTravelPackageCost, confirmTournamentPreparationState, startLiveMatchState, advanceLiveVisit, repairGameState, advanceWeekState, continueToNextTournamentState, getNextEligibleTournament, type GameState } from '../../hooks/useGameState';
import { getDefaultPreparationAllocations } from '../tournamentPreparation';
import { depthOf, plusDays } from '../careerDepth/shared';
import { realismOf, realismAction, reconcileRealism, overseasWeeklyCost, protectRealismSessions } from './index';
import { sessionPlan, pendingMatchBreak, resolveSessionBreak, sessionAssessment } from './sessions';
import { journeyQuote, travelOptionsFor, routeBetween, locationFor } from './travel';
import { conditionAdjustment, venueConditions, familiarisedFor } from './conditions';
import { TRAINING_BASES, baseTrainingMultiplier } from './base';
import { qualificationRaces, survivalRace } from './races';
import { recordedOpponentResults, scoutingReport } from './scouting';
import { updateWorldDigest } from './digest';
import { rankingEventKey, rebuildRollingRankings, type RankedEvent } from '../rollingRankings';
import type { Tournament } from '../../types/game';

function career(): GameState {
  const seed = createStarterState();
  return { ...seed, player: { ...seed.player, cash: 50000, fatigue: 20 }, matches: [], tournaments: [], liveMatch: null,
    careerDepth: { ...depthOf(seed), stories: [], commitments: [], nextSettlementDate: plusDays(seed.currentDate, 7) },
    realism: { ...realismOf(seed), basePaidThrough: seed.currentDate, journeys: {}, digest: [], seenEvents: [], seenMatches: [] } };
}
function eventFor(state: GameState, updates: Partial<Tournament> = {}): Tournament {
  return { ...createStarterState().tournaments[0], id: 'test-realism', name: 'Masters', status: 'Available', location: 'Shanghai', startDate: plusDays(state.currentDate, 14), endDate: plusDays(state.currentDate, 18), ...updates };
}
function liveFixture() {
  let state = createStarterState();
  state.player.cash = 50000;
  const event = getNextEligibleTournament(state)!;
  state = enterTournamentState(state, event.id);
  state = bookTravelState(state, event.id);
  state = confirmTournamentPreparationState(state, event.id, 'balanced', getDefaultPreparationAllocations(), []);
  state = reconcileRealism({ ...state, currentDate: event.startDate });
  const started = startLiveMatchState(state, event.id);
  expect(started.liveMatch, started.lastAction).toBeTruthy();
  return started;
}
function resultEvent(state: GameState, key = 'recorded-open'): RankedEvent {
  const opponent = state.worldPlayers[0];
  return { key, tournamentId: key, name: 'Recorded Open', season: state.season, completedOn: state.currentDate, ranking: true, applied: true,
    bracket: [{ label: 'Final', matches: [{ id: 'final', top: { name: opponent.playerName, rank: 48, nation: 'ENG', score: 6 }, bottom: { name: 'Seeded opponent', rank: 4, nation: 'ENG', score: 3 } }] }] };
}

describe('match sessions and reloads', () => {
  it('uses configured sessions with safe defaults and pauses at each boundary', () => {
    expect(sessionPlan(35).frames).toEqual([8, 9, 8, 10]);
    const state = career();
    expect(sessionPlan(19, eventFor(state, { sessionFrames: { 19: [7, 12] }, overnightAfterSessions: [1] })).frames).toEqual([7, 12]);
    expect(sessionPlan(19, eventFor(state, { sessionFrames: { 19: [-1, 20] } })).frames).toEqual([9, 10]);
    const base = liveFixture().liveMatch!;
    const live = { ...base, bestOf: 35, framesNeeded: 18, sessions: sessionPlan(35), playerFrames: 9, opponentFrames: 8, playerPoints: 0, opponentPoints: 0, currentBreak: 0, playerFatigue: 45, opponentFatigue: 40 };
    expect(pendingMatchBreak(live)?.kind).toBe('overnight');
    expect(advanceLiveVisit(live)).toBe(live);
    const recovered = resolveSessionBreak(live, 'recover');
    expect(recovered.playerFatigue).toBe(33);
    expect(recovered.opponentFatigue).toBe(30);
    expect(recovered.timeElapsedMinutes - live.timeElapsedMinutes).toBe(720);
    expect(pendingMatchBreak(recovered)).toBeNull();
    expect(resolveSessionBreak(JSON.parse(JSON.stringify(recovered)), 'recover')).toEqual(recovered);
    expect(sessionAssessment(recovered)).toHaveLength(2);
    expect(pendingMatchBreak({ ...live, status: 'Completed' })).toBeNull();
  });
  it('keeps mental reset bounded and never opens an interval mid-frame', () => {
    const base = liveFixture().liveMatch!;
    const live = { ...base, sessions: sessionPlan(19), playerFrames: 2, opponentFrames: 2, playerPoints: 0, opponentPoints: 0, currentBreak: 0, playerConfidence: 89 };
    expect(pendingMatchBreak(live)?.kind).toBe('interval');
    expect(resolveSessionBreak(live, 'reset').playerConfidence).toBe(90);
    expect(pendingMatchBreak({ ...live, playerPoints: 8 })).toBeNull();
    expect(resolveSessionBreak({ ...live, playerConfidence: 96 }, 'reset').playerConfidence).toBe(96);
  });
  it('adds a session plan to an older active save without granting recovery', () => {
    const state = liveFixture();
    state.liveMatch!.sessions = undefined;
    const fatigue = state.liveMatch!.playerFatigue;
    const repaired = repairGameState(state);
    expect(repaired.liveMatch?.sessions?.frames.reduce((a, b) => a + b, 0)).toBe(state.liveMatch!.bestOf);
    expect(repaired.liveMatch?.playerFatigue).toBe(fatigue);
  });
});

describe('travel, elapsed costs and training base', () => {
  it('recognises the Grand Prix venue as Hong Kong and quotes long-haul fares from Berlin', () => {
    for (const venue of ['Kai Tak Arena, Kowloon City', 'Kowloon City', 'Kai Tak Arena', 'Hong Kong']) {
      expect(locationFor(venue)).toBe('HongKong');
    }
    const state = career();
    state.realism!.location = 'Berlin';
    const catalogEvent = createStarterState().tournaments.find(t => t.name === 'World Grand Prix')!;
    const event = eventFor(state, { location: catalogEvent.location });
    const options = travelOptionsFor(state, event);
    const quote = journeyQuote(state, event, options[4].id);
    expect(quote).toMatchObject({ origin: 'Berlin', destination: 'HongKong', mode: 'Flight', zoneHours: 7, cost: options[4].cost });
    expect(quote.distanceKm).toBeGreaterThan(8500);
    expect(quote.distanceKm).toBeLessThan(9000);
    expect(options[0].cost).toBeGreaterThan(450);
    expect(options[4].cost).toBeGreaterThan(1900);
    expect(options[4].cost).toBeGreaterThan(options[0].cost * 3);
    expect(options.every((option, i) => i === 0 || option.cost > options[i - 1].cost)).toBe(true);
    const shortHaul = travelOptionsFor(state, { ...event, location: 'Leicester' });
    expect(shortHaul[4].cost).toBeLessThan(400);
    expect(quote.acclimatisationDays).toBe(4);
  });

  it('advances through booked departure and arrival in one action and stops unbooked departures', () => {
    let state = createStarterState();
    state.player.cash = 50000;
    const event = getNextEligibleTournament(state)!;
    state = enterTournamentState(state, event.id);
    const unbooked = continueToNextTournamentState(state);
    expect(unbooked.currentDate < event.startDate).toBe(true);
    expect(unbooked.lastAction).toContain('Book travel');
    state = confirmTournamentPreparationState(bookTravelState(state, event.id), event.id, 'balanced', getDefaultPreparationAllocations(), []);
    const arrived = continueToNextTournamentState(state);
    expect(arrived.currentDate).toBe(event.startDate);
    expect(arrived.realism?.location).toBe(journeyQuote(state, event, '').destination);
    const late = bookTravelState({ ...enterTournamentState(createStarterState(), event.id), currentDate: plusDays(event.startDate, 1) }, event.id);
    expect(late.travel.bookings[event.id]).toBeUndefined();
    expect(late.lastAction).toContain('cannot arrive');
  });
  it('uses flight routes internationally and the last event as the next origin', () => {
    const state = career(), event = eventFor(state);
    const journey = journeyQuote(state, event, '');
    expect(journey.mode).toBe('Flight');
    expect(journey.departure < journey.arrival).toBe(true);
    expect(travelOptionsFor(state, event)[0].name).toContain('flight');
    expect(routeBetween('Shanghai', 'Beijing').distanceKm).toBeLessThan(routeBetween('Britain', 'Beijing').distanceKm);
    state.tournaments = [{ ...event, status: 'Entered' }];
    state.realism!.journeys[journey.eventKey] = journey;
    const next = eventFor(state, { id: 'next', location: 'Beijing', startDate: plusDays(event.endDate!, 3), endDate: plusDays(event.endDate!, 8) });
    const quote = journeyQuote(state, next, '');
    expect(quote.origin).toBe('Shanghai');
    expect(quote.departure > event.endDate!).toBe(true);
  });
  it('keeps the original booked route and price after arrival', () => {
    let state = createStarterState();
    state.player.cash = 50000;
    const event = getNextEligibleTournament(state)!;
    state = bookTravelState(enterTournamentState(state, event.id), event.id);
    const quote = journeyQuote(state, event, '');
    const cost = getTravelPackageCost(state, undefined, undefined, event.id);
    const arrived = reconcileRealism({ ...state, currentDate: quote.arrival });
    expect(journeyQuote(arrived, event, '')).toMatchObject({ origin: quote.origin, destination: quote.destination, arrival: quote.arrival });
    expect(getTravelPackageCost(arrived, undefined, undefined, event.id)).toBe(cost);
    expect(bookTravelState(arrived, event.id).player.cash).toBe(arrived.player.cash);
  });
  it('applies arrival fatigue and each day of acclimatisation only once', () => {
    let state = career();
    const journey = journeyQuote(state, eventFor(state), '');
    state.realism!.journeys[journey.eventKey] = journey;
    state = reconcileRealism({ ...state, currentDate: journey.arrival });
    expect(state.realism!.location).toBe('Shanghai');
    const fatigue = state.player.fatigue;
    expect(reconcileRealism(state).player.fatigue).toBe(fatigue);
    const later = reconcileRealism({ ...state, currentDate: plusDays(state.currentDate, 2) });
    expect(later.player.fatigue).toBe(fatigue - Math.min(4, journey.fatigue));
    expect(reconcileRealism(JSON.parse(JSON.stringify(later))).player.fatigue).toBe(later.player.fatigue);
  });
  it('charges base access and uncovered overseas nights once, including after event completion', () => {
    let state = career();
    const arrival = state.currentDate;
    const event = eventFor(state, { startDate: arrival, endDate: plusDays(arrival, 2), status: 'Completed' });
    const journey = { ...journeyQuote(state, event, ''), departure: arrival, arrival, applied: true, hotelThrough: event.endDate };
    state.realism = { ...state.realism!, base: 'rented', location: 'Shanghai', journeys: { [journey.eventKey]: journey } };
    state.tournaments = [event];
    const cash = state.player.cash;
    expect(overseasWeeklyCost(state)).toBe(140);
    state = reconcileRealism({ ...state, currentDate: plusDays(arrival, 7) });
    expect(state.player.cash).toBe(cash - 90 - 140);
    expect(state.finance.ledger[0].amount).toBe(230);
    expect(reconcileRealism(JSON.parse(JSON.stringify(state))).player.cash).toBe(state.player.cash);
  });
  it('charges a base once during normal weekly settlement', () => {
    const seed = career();
    const state = realismAction(seed, { type: 'base', base: 'rented', location: 'Britain' });
    expect(state.player.cash).toBe(seed.player.cash - TRAINING_BASES.rented.joining);
    const baseline = advanceWeekState(seed), charged = advanceWeekState(state);
    expect(baseline.player.cash - charged.player.cash).toBeCloseTo(TRAINING_BASES.rented.joining + 90, 2);
    expect(realismAction(state, { type: 'base', base: 'rented', location: 'Britain' }).player.cash).toBe(state.player.cash);
    const away = { ...state, realism: { ...state.realism!, location: 'Shanghai' } };
    expect(baseTrainingMultiplier(away)).toBeLessThanOrEqual(baseTrainingMultiplier(state));
  });
  it('requires affordable bases and replaces travel days in the training timetable', () => {
    let state = career();
    state.player.cash = 100;
    expect(realismAction(state, { type: 'base', base: 'academy', location: 'Britain' }).realism?.base).toBe('club');
    const event = eventFor(state, { startDate: plusDays(state.currentDate, 6) });
    const journey = journeyQuote(state, event, '');
    state.realism!.journeys[journey.eventKey] = journey;
    state = { ...state, trainingPlan: state.trainingPlan.map(d => ({ ...d, competitionName: undefined })) };
    const plan = protectRealismSessions(state, state.trainingPlan);
    expect(plan.some(d => d.competitionName?.startsWith('In transit'))).toBe(true);
  });
});

describe('conditions and scouting', () => {
  it('keeps conditions small and only applies a paid familiarisation after its date', () => {
    let state = career();
    const event = eventFor(state, { status: 'Entered' });
    state.tournaments = [event];
    const journey = journeyQuote(state, event, '');
    state.realism!.journeys[journey.eventKey] = journey;
    state.travel.bookings[event.id] = { tournamentId: event.id, travelOptionId: 'test', hotelOptionId: 'test', totalCost: 100, bookedWeek: state.week, bookedDate: state.currentDate };
    const booked = realismAction(state, { type: 'familiarise', eventId: event.id });
    expect(booked.player.cash).toBe(state.player.cash - 35);
    expect(familiarisedFor(booked, event)).toBe(false);
    expect(realismAction(booked, { type: 'familiarise', eventId: event.id }).player.cash).toBe(booked.player.cash);
    state = { ...booked, currentDate: journey.arrival };
    expect(familiarisedFor(state, event)).toBe(true);
    const venue = venueConditions(event);
    for (const skill of [1, 50, 99]) {
      const value = conditionAdjustment(venue, skill, skill, false);
      expect(value).toBeGreaterThanOrEqual(-2);
      expect(value).toBeLessThanOrEqual(1);
      expect(conditionAdjustment(venue, skill, skill, true)).toBeGreaterThanOrEqual(value);
    }
  });
  it('narrows estimates through real recorded reviews without changing opponent ability', () => {
    const state = career(), opponent = state.worldPlayers[0];
    const event = resultEvent(state);
    state.rollingRankings!.events = { [event.key]: event };
    expect(recordedOpponentResults(state, opponent.playerName)[0]).toMatchObject({ result: 'W', score: '6–3', opponent: 'Seeded opponent' });
    const before = scoutingReport(state, opponent.playerName);
    const watched = realismAction(state, { type: 'scout', opponentId: opponent.id });
    expect(scoutingReport(watched, opponent.playerName).uncertainty).toBeLessThan(before.uncertainty);
    expect(watched.worldPlayers).toEqual(state.worldPlayers);
    expect(realismAction(watched, { type: 'scout', opponentId: opponent.id }).realism?.scouting).toEqual(watched.realism?.scouting);
    expect(recordedOpponentResults(state, 'Unknown')).toEqual([]);
    expect(scoutingReport(state, 'Unknown').ability).toBe('Unknown');
  });
});

describe('qualification and survival', () => {
  it('does not confuse youth or open Masters events with the top-16 invitational', () => {
    const state = career();
    state.tournaments = ['Masters', 'Regional Youth Masters', 'German Masters', 'World Championship', 'World Championship Qualifying'].map(name => eventFor(state, { id: name, name }));
    expect(qualificationRaces(state).map(r => r.id)).toEqual(['Masters', 'World Championship']);
  });
  it('removes defending earnings, excludes future winnings and preserves locked ranks', () => {
    let state = career();
    const event = eventFor(state, { seedingCutoffDate: plusDays(state.currentDate, 7) });
    state.tournaments = [event];
    const names = state.competitionTables.world.slice(0, 18).map(r => r.playerName);
    const player = state.player.fullName;
    const chosen = [player, ...names.filter(n => n !== player)].slice(0, 18);
    const template = state.competitionTables.world[0];
    state.competitionTables.world = chosen.map((name, i) => ({ ...template, id: name, playerName: name, ranking: i + 1, points: 0 }));
    state.rollingRankings = { ...state.rollingRankings!, earnings: chosen.map((name, i) => ({ id: name, eventKey: 'past', playerName: name, amount: i === 0 ? 10000 : 1000 - i, earnedOn: plusDays(state.currentDate, -100), expiresOn: i === 0 ? event.seedingCutoffDate! : plusDays(state.currentDate, 100), season: state.season })), seedings: {} };
    state.rollingRankings.earnings.push({ id: 'future', eventKey: 'future', playerName: player, amount: 50000, earnedOn: plusDays(state.currentDate, 5), expiresOn: plusDays(state.currentDate, 500), season: state.season });
    state = rebuildRollingRankings(state, state.currentDate);
    expect(qualificationRaces(state)[0]).toMatchObject({ position: 18, defending: 10000, confirmed: false });
    const cutoff = event.seedingCutoffDate!;
    state.currentDate = cutoff;
    state.rollingRankings!.seedings[rankingEventKey(event)] = { date: cutoff, world: { [player]: 16, Ghost: 15 }, oneYear: {} };
    expect(qualificationRaces(state)[0]).toMatchObject({ position: 16, confirmed: true, status: 'Inside locked field' });
    expect(qualificationRaces(state)[0].rivals.map(r => r.rank)).toEqual([15, 16]);
  });
  it('excludes retired players from one-year rescue places', () => {
    const state = career();
    const retired = state.worldPlayers[0];
    state.worldPlayers = state.worldPlayers.map(p => p.id === retired.id ? { ...p, retired: true } : p);
    state.competitionTables.world = [];
    state.competitionTables.oneYear = [{ ...state.competitionTables.oneYear[0], playerName: retired.playerName }];
    expect(survivalRace(state).oneYearRescue).not.toContain(retired.playerName);
  });
});

describe('world digest', () => {
  it('reports recorded upsets and rivals once, without replaying the inbox on reload', () => {
    const state = career(), event = resultEvent(state), rival = state.worldPlayers[0];
    state.rollingRankings!.events = { [event.key]: event };
    state.careerDepth!.relationships[rival.id] = { opponentId: rival.id, name: rival.playerName, wins: 1, losses: 2, deciders: 3, rivalry: true, recent: ['W', 'L', 'L'], tactics: {} };
    const next = updateWorldDigest(state);
    const lines = next.realism!.digest[0].lines.join(' ');
    expect(lines).toContain('6–3');
    expect(lines).toContain('Upset:');
    expect(lines).toContain('Rival watch');
    expect(updateWorldDigest(JSON.parse(JSON.stringify(next))).realism!.digest).toEqual(next.realism!.digest);
    expect(next.inbox.filter(m => m.subject === 'Around the tour')).toHaveLength(1);
  });
  it('does not invent a champion from a single qualifying section or unfinished final', () => {
    const state = career(), event = resultEvent(state);
    event.bracket[0].label = 'Qualifying Round';
    state.rollingRankings!.events = { [event.key]: event };
    expect(updateWorldDigest(state).realism!.digest[0].lines.join(' ')).not.toContain('takes the title');
    event.bracket[0].label = 'Final';
    event.bracket[0].matches[0].top.score = undefined;
    event.bracket[0].matches[0].bottom.score = undefined;
    expect(updateWorldDigest(state).realism!.digest).toHaveLength(0);
  });
});
