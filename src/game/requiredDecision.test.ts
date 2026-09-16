import { getDefaultPreparationAllocations } from './tournamentPreparation';
import { describe, expect, it, vi } from 'vitest';
import { requiredDecisionFixture } from '../../test-support/requiredDecisionFixture';
import { blockForRequiredDecision, gateCareerActions, requiredDecisionBlocker } from './requiredDecision';
import { careerDepthAction, initializeCareerDepth } from './careerDepth';
import { pendingStory } from './careerDepth/shared';
import { advanceWeekState, applyTrainingPlanState, bookTravelState, confirmTournamentPreparationState,
  enterTournamentState, finishSeasonState, getTournamentPlayability, prepareScheduledMatchState,
  simulateTournamentMatchState, skipTournamentState, startLiveMatchState, startNextSeasonState,
  withdrawTournamentState } from '../hooks/useGameState';

const fixture = requiredDecisionFixture();
describe('required career decision gate', () => {
  it.each([
    ['quick simulation', (s: typeof fixture.state) => simulateTournamentMatchState(s, fixture.event.id)],
    ['start live', (s: typeof fixture.state) => startLiveMatchState(s, fixture.event.id)],
    ['prepare next fixture', (s: typeof fixture.state) => prepareScheduledMatchState(s, 'rest', fixture.event.id)],
    ['training', applyTrainingPlanState], ['advance', advanceWeekState], ['finish season', finishSeasonState],
    ['new season', startNextSeasonState],
    ['entry', (s: typeof fixture.state) => enterTournamentState(s, fixture.event.id)],
    ['skip', (s: typeof fixture.state) => skipTournamentState(s, fixture.event.id)],
    ['withdraw', (s: typeof fixture.state) => withdrawTournamentState(s, fixture.event.id)],
    ['travel', (s: typeof fixture.state) => bookTravelState(s, fixture.event.id)],
    ['preparation', (s: typeof fixture.state) => confirmTournamentPreparationState(s, fixture.event.id, 'balanced', getDefaultPreparationAllocations(), [])],
  ])('blocks %s before changing dates, money, results or history', (_label, action) => {
    const before = structuredClone(fixture.state);
    const next = action(fixture.state);
    expect(next.lastAction).toContain(fixture.story.title);
    expect({ ...next, lastAction: before.lastAction }).toEqual(before);
    expect(fixture.state).toEqual(before);
  });

  it('keeps a read decision pending through reload and unlocks only after a successful response', () => {
    let state = initializeCareerDepth(JSON.parse(JSON.stringify({ ...fixture.state,
      inbox: fixture.state.inbox.map(m => ({ ...m, read: true })) })));
    expect(getTournamentPlayability(state, fixture.event).canPlay).toBe(false);
    expect(requiredDecisionBlocker(state)?.route).toContain(encodeURIComponent(fixture.story.id));
    const invalid = careerDepthAction(state, { type: 'decision', id: 'wrong-id', choice: 'continue' });
    expect(pendingStory(invalid)).toBeDefined();
    state = careerDepthAction(state, { type: 'decision', id: fixture.story.id, choice: 'continue' });
    expect(requiredDecisionBlocker(state)).toBeNull();
    expect(getTournamentPlayability(state, fixture.event).canPlay).toBe(true);
    expect(startLiveMatchState(state, fixture.event.id).liveMatch?.status).toBe('In Progress');
    expect(careerDepthAction(state, { type: 'decision', id: fixture.story.id, choice: 'continue' }).player).toEqual(state.player);
  });

  it('allows the response to spend its disclosed cost exactly once, but blocks unrelated career mutations', () => {
    expect(careerDepthAction(fixture.state, { type: 'project', kind: 'long-pot' }).careerDepth).toBe(fixture.state.careerDepth);
    const resolved = careerDepthAction(fixture.state, { type: 'decision', id: fixture.story.id, choice: 'support' });
    expect(resolved.player.cash).toBe(fixture.state.player.cash - 90);
    expect(pendingStory(resolved)).toBeUndefined();
    expect(careerDepthAction(resolved, { type: 'decision', id: fixture.story.id, choice: 'support' }).player.cash).toBe(resolved.player.cash);
    const poor = { ...fixture.state, player: { ...fixture.state.player, cash: 0 } };
    expect(pendingStory(careerDepthAction(poor, { type: 'decision', id: fixture.story.id, choice: 'support' }))).toBeDefined();
  });

  it.each(['simulateMatch', 'startLiveMatch', 'playLiveVisit', 'simulateLiveVisit', 'simulateLiveShot',
    'continueLiveFrame', 'simulateLiveFrame', 'simulateLiveMatch', 'updateLiveMatchTactics', 'applyLiveCoachCue',
    'takeLiveMatchTimeout', 'concedeLiveFrame', 'actOnRealism', 'scheduleTreatment', 'applyRecoveryPlan',
    'buyCue', 'restockChalk', 'hireCoach', 'acceptSponsor', 'updateTrainingPlan', 'continueToNextTournament',
    'newFutureMutation'])('guards %s, including controls captured before a decision appeared', name => {
    let state = careerDepthAction(fixture.state, { type: 'decision', id: fixture.story.id, choice: 'continue' });
    const mutate = vi.fn(), notify = vi.fn();
    const actions = gateCareerActions({ [name]: mutate }, () => state, notify);
    state = fixture.state;
    actions[name]();
    expect(mutate).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(requiredDecisionBlocker(state));
    state = careerDepthAction(state, { type: 'decision', id: fixture.story.id, choice: 'continue' });
    actions[name](); expect(mutate).toHaveBeenCalledTimes(1);
  });

  it('allows reading, saving and the exact required decision while blocking other inbox actions', () => {
    const read = vi.fn(), save = vi.fn(), respond = vi.fn(), notify = vi.fn(), exit = vi.fn();
    const actions = gateCareerActions({ markInboxMessageRead: read, saveToSlot: save, actOnCareer: respond, returnToMainMenu: exit }, () => fixture.state, notify);
    actions.markInboxMessageRead('any'); actions.saveToSlot('backup');
    actions.returnToMainMenu(); expect(exit).toHaveBeenCalledTimes(1);
    actions.actOnCareer({ type: 'decision', id: 'wrong', choice: 'continue' });
    actions.actOnCareer({ type: 'life-interview', id: 'interview', response: 'private' });
    expect(respond).not.toHaveBeenCalled();
    actions.actOnCareer({ type: 'decision', id: fixture.story.id, choice: 'continue' });
    expect(respond).toHaveBeenCalledTimes(1); expect(read).toHaveBeenCalled(); expect(save).toHaveBeenCalled();
  });

  it('does not block for optional season stories and unanswered interviews', () => {
    const state = structuredClone(fixture.state);
    state.careerDepth!.stories = [];
    state.careerDepth!.seasonLife!.interviews.push({ id: 'optional', eventId: 'other', title: 'Interview',
      context: 'Optional comment', created: state.currentDate, deadline: fixture.story.expiresDate });
    expect(blockForRequiredDecision(state)).toBeNull();
    expect(getTournamentPlayability(state, fixture.event).canPlay).toBe(true);
  });
});
