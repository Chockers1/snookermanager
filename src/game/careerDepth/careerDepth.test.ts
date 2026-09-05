import { afterEach, describe, expect, it, vi } from 'vitest';
import { SAVE_SCHEMA_VERSION } from '../../hooks/useGameState';
import { pendingMatchBreak, resolveSessionBreak } from '../realism/sessions';
import { advanceLiveVisit, finalizeLiveMatch, simulateTournamentMatchState, startLiveMatchState, getTournamentEntryAccess } from '../../hooks/useGameState';
import { advanceWeekState, applyTrainingPlanState, bookTravelState, buyCueState, buyChalkState, confirmTournamentPreparationState, createStarterState, enterTournamentState, getNextEligibleTournament, repairGameState, type GameState } from '../../hooks/useGameState';
import { chalkCatalog } from '../../data/gameContent';
import type { Match } from '../../types/game';
import { careerDepthAction, initializeCareerDepth, reconcileCareerDepth } from './index';
import { depthOf, plusDays, pendingStory } from './shared';
import { learnedCounter, recordEncounter, partnerCandidates } from './relationships';
import { effectiveCareerAttributes, developmentTrainingBonus, protectPartnerSessions, PROJECTS, progressDevelopment, recordProjectOutcome } from './developmentProjects';
import { commitmentQuote, protectCommitmentSessions, scheduleCommitment, settleCommitments } from './commitments';
import { approveSchedule, recommendSeason, runScheduleAssistance } from './seasonPlanning';
import { buildTrainingCell, calculateTrainingEffects } from '../../utils/trainingPlan';
import { matchConfidenceChange, settledConfidence, supportedConfidence } from '../confidenceSystem';
import { getDefaultPreparationAllocations } from '../tournamentPreparation';

function career() {
  const seed = createStarterState();
  return initializeCareerDepth({ ...seed, careerDepth: undefined, matches: [], inbox: [], trainingAppliedWeek: null, player: { ...seed.player, confidence: 70, fatigue: 20, cash: 20000 }, health: { activeIssue: null, history: [] } });
}
function result(state: GameState, id: string, won = false): Match {
  return { ...createStarterState().matches[0], id, tournamentId: `event:${id}`, playedOn: state.currentDate, playerName: state.player.fullName,
    opponentId: state.worldPlayers[0].id, opponentName: state.worldPlayers[0].playerName, opponentRanking: 20,
    round: 'Last 16', bestOf: 7, playerFrames: won ? 4 : 3, opponentFrames: won ? 3 : 4, result: won ? 'Won' : 'Lost', playerTactic: 'Attack' };
}
function addResult(state: GameState, match: Match) { return reconcileCareerDepth({ ...state, matches: [match, ...state.matches] }); }
afterEach(() => vi.restoreAllMocks());

describe('durable career stories and relationships', () => {
  it('counts same-day matches after a decision and not training before it', () => {
    let s = addResult(career(), { ...result(career(), 'upset', true), opponentRanking: 4 });
    const story = pendingStory(s)!;
    s = { ...s, careerDepth: { ...depthOf(s), trainingWeeks: 3 } };
    s = careerDepthAction(s, { type: 'decision', id: story.id, choice: 'protect' });
    s = addResult(s, result(s, 'later-that-day', true));
    s = reconcileCareerDepth({ ...s, currentDate: plusDays(s.currentDate, 28) });
    expect(depthOf(s).stories[0].updates.at(-1)).toMatch(/1 wins from 1 matches.*0 training weeks/);
  });
  it('lets a valid entrant finish a qualifier after climbing into the Top 16', () => {
    const s = career();
    const original = s.tournaments.find(t => /English Open Qualifying/.test(t.name))!;
    expect(original).toBeDefined();
    const event = { ...original, status: 'Entered' as const };
    expect(getTournamentEntryAccess(s, event).allowed).toBe(false);
    s.history.tournamentHistory = [{ ...s.history.tournamentHistory[0], tournamentId: event.id, startDate: event.startDate, matchesPlayed: 1 }];
    expect(getTournamentEntryAccess(s, event).allowed).toBe(true);
    expect(getTournamentEntryAccess(s, { ...event, status: 'Available' }).allowed).toBe(false);
    expect(getTournamentEntryAccess(s, { ...event, startDate: plusDays(event.startDate, 365) }).allowed).toBe(false);
  });
  it('records live and quick simulation through the same once-only career pipeline', () => {
    let s = career();
    const event = getNextEligibleTournament(s)!;
    s = confirmTournamentPreparationState(bookTravelState(enterTournamentState(s, event.id), event.id), event.id, 'balanced', getDefaultPreparationAllocations(), []);
    s = { ...s, currentDate: event.startDate };
    let random = 123456;
    vi.spyOn(Math, 'random').mockImplementation(() => { random = (random * 1664525 + 1013904223) >>> 0; return random / 4294967296; });
    const quick = simulateTournamentMatchState(s, event.id);
    expect(quick.matches).toHaveLength(1);
    expect(quick.attributes).toEqual(s.attributes);
    expect(depthOf(quick).seenMatchIds).toContain(quick.matches[0].id);
    const started = startLiveMatchState(s, event.id);
    let live = started.liveMatch!;
    for (let i = 0; i < 3000 && live.status !== 'Completed'; i++) live = pendingMatchBreak(live) ? resolveSessionBreak(live, 'recover') : advanceLiveVisit(live, undefined, 'manual');
    expect(live.status).toBe('Completed');
    const completed = finalizeLiveMatch(started, live);
    expect(completed.matches).toHaveLength(1);
    expect(completed.attributes).toEqual(s.attributes);
    expect(depthOf(completed).seenMatchIds).toContain(completed.matches[0].id);
    expect(completed.matches[0].opponentId).toBeTruthy();
    const repeated = finalizeLiveMatch(completed, live);
    expect(repeated).toBe(completed);
    expect(repeated.player.cash).toBe(completed.player.cash);
  });
  it('records real deciding frames, survives inbox trimming, and resolves once', () => {
    let s = career();
    for (let i = 0; i < 3; i++) s = addResult(s, result(s, `${i}`));
    const story = pendingStory(s)!;
    expect(story.kind).toBe('deciders');
    const restored = reconcileCareerDepth({ ...JSON.parse(JSON.stringify(s)), inbox: [] });
    expect(restored.inbox.some(m => m.id === story.id)).toBe(true);
    const before = restored.player.cash;
    const chosen = careerDepthAction(restored, { type: 'decision', id: story.id, choice: 'support' });
    expect(chosen.player.cash).toBe(before - 90);
    expect(careerDepthAction(chosen, { type: 'decision', id: story.id, choice: 'support' }).player.cash).toBe(chosen.player.cash);
    expect(pendingStory(chosen)).toBeUndefined();
    expect(depthOf(reconcileCareerDepth(chosen)).relationships[s.worldPlayers[0].id].wins + depthOf(chosen).relationships[s.worldPlayers[0].id].losses).toBe(3);
  });
  it('stops advance for a decision and attaches one four-week follow-up', () => {
    let s = career();
    s = addResult(s, { ...result(s, 'upset', true), opponentRanking: 4 });
    expect(advanceWeekState(s).currentDate).toBe(s.currentDate);
    const id = pendingStory(s)!.id;
    s = careerDepthAction(s, { type: 'decision', id, choice: 'protect' });
    s = reconcileCareerDepth({ ...s, currentDate: plusDays(s.currentDate, 28) });
    const review = depthOf(s).stories[0];
    expect(review.reviewed).toBe(true);
    expect(reconcileCareerDepth(s).careerDepth?.stories[0].updates).toHaveLength(2);
  });
  it('keeps stories at least 28 days apart and does not invent televised coverage', () => {
    let s = career();
    const event = s.tournaments[0];
    s = addResult(s, { ...result(s, 'qf', true), tournamentId: event.id, round: 'Quarter Final' });
    expect(pendingStory(s)).toBeUndefined();
    s = { ...s, tournaments: s.tournaments.map(t => t.id === event.id ? { ...t, televisedRounds: ['Quarter Final'] } : t) };
    s = addResult(s, { ...result(s, 'tv', true), tournamentId: event.id, round: 'Quarter Final' });
    expect(pendingStory(s)?.kind).toBe('television');
    s = careerDepthAction(s, { type: 'decision', id: pendingStory(s)!.id, choice: 'protect' });
    s = addResult(s, { ...result(s, 'upset', true), opponentRanking: 1 });
    expect(depthOf(s).stories).toHaveLength(1);
  });
  it('migrates H2H without historical rewards or retroactive story spam', () => {
    let s = career();
    s = { ...s, careerDepth: undefined, matches: [result(s, '1'), result(s, '2'), result(s, '3')], schemaVersion: 8 };
    const migrated = initializeCareerDepth(s);
    expect(reconcileCareerDepth(migrated).careerDepth?.stories).toHaveLength(0);
    expect(migrated.player.cash).toBe(s.player.cash);
    expect(learnedCounter(migrated, s.worldPlayers[0].playerName)).toBe('Tight');
    expect(repairGameState(migrated).schemaVersion).toBe(SAVE_SCHEMA_VERSION);
  });
  it('does not merge ambiguous opponent names or turn retirement into lost history', () => {
    let s = career();
    const match = { ...result(s, '1'), opponentId: undefined };
    s.worldPlayers = [...s.worldPlayers, { ...s.worldPlayers[0], id: 'duplicate-name' }];
    expect(Object.keys(depthOf(recordEncounter(s, match)).relationships)).toHaveLength(0);
    s = { ...s, careerDepth: { ...depthOf(s), partnerId: s.worldPlayers[0].id } };
    s.worldPlayers[0] = { ...s.worldPlayers[0], retired: true };
    expect(reconcileCareerDepth(s).careerDepth?.partnerId).toBeNull();
  });
});

describe('development uses real training', () => {
  it('uses one real partner session and targets only the agreed skill', () => {
    let s = career();
    const partner = partnerCandidates(s)[0];
    expect(partner).toBeDefined();
    s = careerDepthAction(s, { type: 'partner', id: partner.id });
    const plan = protectPartnerSessions(s, s.trainingPlan);
    expect(plan.flatMap(d => [d.morning, d.afternoon, d.evening]).filter(c => c.subtitle.startsWith('Practice partner:'))).toHaveLength(1);
    expect(developmentTrainingBonus(s, plan, 'Long Potting')).toBe(1.05);
    expect(developmentTrainingBonus(s, plan, 'Stamina')).toBe(1);
    const trained = progressDevelopment(s, plan);
    expect(depthOf(trained).practiceHistory?.[partner.id].sessions).toBe(1);
    const retired = { ...trained, worldPlayers: trained.worldPlayers.map(p => p.id === partner.id ? { ...p, retired: true } : p) };
    expect(reconcileCareerDepth(retired).careerDepth?.practiceHistory?.[partner.id].sessions).toBe(1);
  });
  it('prevents repeated coach conversations from farming understanding', () => {
    const s = career();
    const id = s.coachContracts[0].coachId;
    const reviewed = careerDepthAction(s, { type: 'coach-review', id });
    expect(depthOf(reviewed).coachRelationships[id].trust).toBe(56);
    expect(depthOf(careerDepthAction(reviewed, { type: 'coach-review', id })).coachRelationships[id].trust).toBe(56);
    expect(reviewed.coachContracts).toEqual(s.coachContracts);
  });
  it('finishes after relevant weeks without a lump bonus and freezes the measured outcome', () => {
    let s = careerDepthAction(career(), { type: 'project', kind: 'safety' });
    const attributes = structuredClone(s.attributes);
    const plan = s.trainingPlan.map(d => ({ ...d, competitionName: undefined, morning: buildTrainingCell('safety-exchanges'), afternoon: buildTrainingCell('rest'), evening: buildTrainingCell('rest') }));
    for (let i = 0; i < 4; i++) s = progressDevelopment({ ...s, week: i + 1 }, plan);
    expect(depthOf(s).project?.status).toBe('completed');
    expect(s.attributes).toEqual(attributes);
    s = { ...s, careerDepth: recordProjectOutcome(s, s.attributes) };
    const outcome = depthOf(s).project?.closingAttributes;
    s.attributes.technical['Safety Play'] += 5;
    expect(recordProjectOutcome(s, s.attributes).project?.closingAttributes).toEqual(outcome);
    expect(depthOf(s).projectHistory).toHaveLength(1);
  });
  it('pauses injury weeks, preserves the cue rebuild penalty until two completed weeks, and resumes', () => {
    let s = careerDepthAction(career(), { type: 'project', kind: 'cue-action' });
    const plan = s.trainingPlan.map(d => ({ ...d, competitionName: undefined, morning: buildTrainingCell('line-up-drill'), afternoon: buildTrainingCell('rest'), evening: buildTrainingCell('rest') }));
    s = progressDevelopment({ ...s, trainingCondition: { ...s.trainingCondition, injuryWeeks: 1 } }, plan);
    expect(depthOf(s).project?.completedWeeks).toBe(0);
    s = progressDevelopment({ ...s, week: s.week + 1, trainingCondition: { ...s.trainingCondition, injuryWeeks: 0 } }, plan);
    expect(depthOf(s).project?.completedWeeks).toBe(1);
    s = progressDevelopment({ ...s, week: s.week + 1 }, plan);
    expect(effectiveCareerAttributes(s, s.attributes)).toEqual(s.attributes);
  });
  it('counts relevant weeks once and removes only the temporary consistency penalty', () => {
    let s = careerDepthAction(career(), { type: 'project', kind: 'cue-action' });
    const baseline = s.attributes.technical.Consistency;
    expect(effectiveCareerAttributes(s, s.attributes).technical.Consistency).toBe(baseline - 2);
    const plan = s.trainingPlan.map(d => ({ ...d, competitionName: undefined, morning: buildTrainingCell('line-up-drill'), afternoon: buildTrainingCell('rest'), evening: buildTrainingCell('rest') }));
    const trained = applyTrainingPlanState(s, plan);
    expect(depthOf(trained).project?.completedWeeks).toBe(1);
    expect(depthOf(applyTrainingPlanState(trained, plan)).project?.completedWeeks).toBe(1);
    s = careerDepthAction(trained, { type: 'cancel-project' });
    expect(effectiveCareerAttributes(s, s.attributes)).toEqual(s.attributes);
  });
  it('pauses a project for insufficient sessions and caps shared efficiency', () => {
    const s = careerDepthAction(career(), { type: 'project', kind: 'stamina' });
    const plan = s.trainingPlan.map(d => ({ ...d, morning: buildTrainingCell('rest'), afternoon: buildTrainingCell('rest'), evening: buildTrainingCell('rest') }));
    const trained = applyTrainingPlanState(s, plan);
    expect(depthOf(trained).project?.completedWeeks).toBe(0);
    expect(depthOf(trained).project?.reviewDate).toBe(plusDays(s.currentDate, (PROJECTS.stamina.weeks + 1) * 7));
    expect(developmentTrainingBonus(s, protectPartnerSessions(s, plan))).toBeLessThanOrEqual(1.1);
  });
});

describe('commitments and budget assistance', () => {
  it('limits paid sponsor appearances and never credits a replacement sponsor', () => {
    const s = career();
    expect(s.sponsors.length).toBeGreaterThan(0);
    const first = scheduleCommitment(s, 'appearance', plusDays(s.currentDate, 1));
    const c = depthOf(first).commitments[0];
    expect(c.sponsorId).toBeTruthy();
    expect(depthOf(scheduleCommitment(first, 'appearance', plusDays(s.currentDate, 8))).commitments).toHaveLength(1);
    const replacement = { ...s.sponsors[0], id: 'replacement-sponsor', fulfilledObligations: 0 };
    const settled = settleCommitments({ ...first, currentDate: plusDays(c.endDate, 1), sponsors: [replacement] });
    expect(settled.sponsors[0].fulfilledObligations).toBe(0);
    expect(settleCommitments(settled).player.cash).toBe(settled.player.cash);
  });
  it('pauses approved assistance for injury or a breached reserve without spending', () => {
    const s = career();
    const event = getNextEligibleTournament(s)!;
    s.currentDate = plusDays(event.startDate, -14);
    const cost = recommendSeason(s).find(r => r.event.id === event.id)!.total;
    const approved = approveSchedule(s, [event.id], cost, 100);
    const hurt = runScheduleAssistance({ ...approved, trainingCondition: { ...approved.trainingCondition, injuryWeeks: 1 } });
    expect(depthOf(hurt).schedule?.enabled).toBe(false);
    expect(hurt.player.cash).toBe(approved.player.cash);
    const short = runScheduleAssistance({ ...approved, player: { ...approved.player, cash: cost + 99 } });
    expect(depthOf(short).schedule?.enabled).toBe(false);
    expect(short.travel.bookings[event.id]).toBeUndefined();
  });
  it('protects the three pre-major days after approval, not before player approval', () => {
    let s = career();
    const event = getNextEligibleTournament(s)!;
    s.currentDate = plusDays(event.startDate, -7);
    s.careerDepth = { ...depthOf(s), nextSettlementDate: event.startDate };
    s = careerDepthAction(s, { type: 'strategy', strategy: 'majors', targets: [event.id] });
    const cost = recommendSeason(s).find(r => r.event.id === event.id)!.total;
    expect(protectCommitmentSessions(s, s.trainingPlan).some(d => d.competitionName?.startsWith('Protected preparation'))).toBe(false);
    s = approveSchedule(s, [event.id], cost, 100);
    expect(protectCommitmentSessions(s, s.trainingPlan).filter(d => d.competitionName?.startsWith('Protected preparation'))).toHaveLength(3);
    expect(scheduleCommitment(s, 'camp', plusDays(event.startDate, -3)).lastAction).toMatch(/protected/);
  });
  it('replaces sessions and settles a commitment exactly once without ranking rewards', () => {
    const s = career();
    const date = plusDays(s.currentDate, 1);
    const booked = scheduleCommitment(s, 'camp', date);
    const quote = commitmentQuote(s, 'camp', date);
    expect(booked.player.cash).toBe(s.player.cash - quote.cost);
    const protectedPlan = protectCommitmentSessions(booked, s.trainingPlan);
    expect(protectedPlan.filter(d => d.careerCommitmentId)).toHaveLength(3);
    const onlyCommitments = protectedPlan.filter(d => d.careerCommitmentId);
    expect(calculateTrainingEffects(onlyCommitments).technicalGain).toBe(0);
    expect(calculateTrainingEffects(onlyCommitments).fatigueDelta).toBe(0);
    const finished = settleCommitments({ ...booked, currentDate: plusDays(quote.endDate, 1) });
    expect(finished.matches).toEqual(s.matches);
    expect(finished.rankings).toEqual(s.rankings);
    expect(settleCommitments(finished).player).toEqual(finished.player);
    expect(finished.careerDepth?.temporarySharpness).toBe(3);
  });
  it('stops at commitment boundaries without paying weekly cash twice', () => {
    const s = career();
    let next = scheduleCommitment(s, 'recovery', plusDays(s.currentDate, 1));
    next = advanceWeekState(next);
    expect(next.currentDate).toBe(plusDays(s.currentDate, 1));
    expect(next.week).toBe(s.week);
    expect(next.player.cash).toBe(s.player.cash);
    next = advanceWeekState(next);
    expect(next.currentDate).toBe(plusDays(s.currentDate, 3));
    expect(next.week).toBe(s.week);
    next = advanceWeekState(next);
    expect(next.week).toBe(s.week + 1);
    expect(next.currentDate).toBe(plusDays(s.currentDate, 7));
  });
  it('blocks free exhibitions and tournament/commitment double-booking', () => {
    const s = career();
    expect(depthOf(scheduleCommitment(s, 'exhibition', plusDays(s.currentDate, 1))).commitments).toHaveLength(0);
    const t = getNextEligibleTournament(s)!;
    const entered = enterTournamentState(s, t.id);
    expect(scheduleCommitment(entered, 'camp', t.startDate).lastAction).toMatch(/Conflicts/);
    const booked = scheduleCommitment(s, 'camp', t.startDate);
    expect(enterTournamentState(booked, t.id).lastAction).toMatch(/overlaps/);
  });
  it('enforces approved caps and reserves, books only through existing gates, then pauses for preparation', () => {
    let s = career();
    const event = getNextEligibleTournament(s)!;
    s = { ...s, currentDate: plusDays(event.startDate, -14) };
    const r = recommendSeason(s).find(r => r.event.id === event.id)!;
    expect(depthOf(approveSchedule(s, [event.id], r.total - 1, 0)).schedule).toBeNull();
    s = approveSchedule(s, [event.id], r.total, 100);
    expect(depthOf(s).schedule?.enabled).toBe(true);
    const booked = runScheduleAssistance(s);
    expect(booked.travel.bookings[event.id]).toBeDefined();
    expect(depthOf(booked).schedule?.spent).toBe(r.total);
    expect(runScheduleAssistance(booked).player.cash).toBe(booked.player.cash);
    expect(advanceWeekState(booked).currentDate).toBe(booked.currentDate);
  });
});

describe('confidence has headroom and cannot be farmed by confirmations', () => {
  it('keeps the last chalk unit usable and preserves wear when switching products', () => {
    let s = career();
    const [a, b] = chalkCatalog;
    s.equipment = { ...s.equipment, currentChalkId: a.id, chalkCondition: 39,
      chalkOwned: [a.id, b.id], chalkStock: { [a.id]: 1, [b.id]: 1 }, chalkConditions: { [a.id]: 39, [b.id]: 100 } };
    s = buyChalkState(s, b.id);
    expect(s.equipment.chalkStock[b.id]).toBe(1);
    s = buyChalkState(s, a.id);
    expect(s.equipment.chalkCondition).toBe(39);
    expect(s.equipment.chalkStock[a.id]).toBe(1);
    const event = getNextEligibleTournament(s)!;
    expect(enterTournamentState(s, event.id).tournaments.find(t => t.id === event.id)?.status).toBe('Entered');
  });
  it('settles without saturating during neutral seasons and responds to expectations', () => {
    let confidence = 99;
    for (let i = 0; i < 52; i++) confidence = settledConfidence(supportedConfidence(confidence, 6), ['W', 'L'], 70);
    expect(confidence).toBeLessThan(90);
    expect(matchConfidenceChange(70, true, 20, false)).toBeGreaterThan(matchConfidenceChange(70, true, 80, false));
    for (let i = 0; i < 5; i++) confidence += matchConfidenceChange(confidence, false, 80, false);
    expect(confidence).toBeLessThan(65);
  });
  it('does not reward re-equipping or repeated travel/preparation confirmation', () => {
    const s = career();
    const cue = s.equipment.currentCueId!;
    expect(buyCueState(s, cue).player.confidence).toBe(s.player.confidence);
    const t = getNextEligibleTournament(s)!;
    const booked = bookTravelState(enterTournamentState(s, t.id), t.id);
    expect(bookTravelState(booked, t.id).player.confidence).toBe(booked.player.confidence);
    expect(bookTravelState(booked, t.id).player.fatigue).toBe(booked.player.fatigue);
    const prepared = confirmTournamentPreparationState(booked, t.id, 'balanced', getDefaultPreparationAllocations(), []);
    const repeated = confirmTournamentPreparationState(prepared, t.id, 'balanced', getDefaultPreparationAllocations(), []);
    expect(repeated.player.confidence).toEqual(prepared.player.confidence);
    expect(repeated.player.cash).toEqual(prepared.player.cash);
    expect(repeated.player.fatigue).toEqual(prepared.player.fatigue);
  });
});
