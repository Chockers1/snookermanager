import { describe, expect, it } from 'vitest';
import { betweenMatchFixture } from '../../test-support/betweenMatchFixture';
import { betweenMatchEffects, betweenMatchInfo, prepareBetweenMatchesState } from './betweenMatches';
import { startLiveMatchState, simulateTournamentMatchState, repairGameState, finalizeLiveMatch } from '../hooks/useGameState';

describe('between-match preparation', () => {
  it('uses round dates and saves exactly one recovery choice across reloads', () => {
    const { state, event } = betweenMatchFixture();
    const info = betweenMatchInfo(state)!;
    expect(info.days).toBeGreaterThan(0);
    expect(info.nextDate > info.previousDate).toBe(true);
    const expected = betweenMatchEffects(state, info.days, 'rest');
    const next = prepareBetweenMatchesState(state, 'rest', event.id);
    expect(next.player.fatigue).toBe(expected.fatigue);
    expect(next.trainingCondition.strain).toBe(expected.strain);
    expect(next.player.cash).toBe(state.player.cash);
    expect(prepareBetweenMatchesState(next, 'practice')).toBe(next);
    const loaded = repairGameState(JSON.parse(JSON.stringify(next)));
    expect(betweenMatchInfo(loaded)?.applied?.choice).toBe('rest');
    expect(prepareBetweenMatchesState(loaded, 'rest')).toBe(loaded);
  });
  it('limits same-day recovery and offers a confidence trade-off', () => {
    const { state, event } = betweenMatchFixture();
    state.tournaments = state.tournaments.map(t => t.id === event.id ? { ...t, endDate: t.startDate } : t);
    expect(betweenMatchInfo(state)?.days).toBe(0);
    const rest = prepareBetweenMatchesState(state, 'rest');
    const practice = prepareBetweenMatchesState(state, 'practice');
    const review = prepareBetweenMatchesState(state, 'review');
    expect(rest.player.fatigue).toBe(54);
    expect(practice.player.fatigue).toBe(56);
    expect(review.player.confidence).toBeGreaterThan(practice.player.confidence);
    expect(practice.player.confidence).toBeGreaterThan(rest.player.confidence);
  });
  it('gives distinct high-confidence choices with matching recovery trade-offs', () => {
    const {state} = betweenMatchFixture();
    state.player.confidence = 88.5;
    state.player.fatigue = 36;
    const rest = betweenMatchEffects(state, 1, 'rest');
    const practice = betweenMatchEffects(state, 1, 'practice');
    const review = betweenMatchEffects(state, 1, 'review');
    expect([rest.confidence,practice.confidence,review.confidence]).toEqual([88.5,89,89.5]);
    expect([rest.fatigue,practice.fatigue,review.fatigue]).toEqual([22,26,30]);
    expect(betweenMatchEffects(state,0,'review').confidence).toBe(89);
    const applied = prepareBetweenMatchesState(state,'review');
    expect(applied.player.confidence).toBe(betweenMatchEffects(state,betweenMatchInfo(state)!.days,'review').confidence);
    expect(prepareBetweenMatchesState(applied,'review')).toBe(applied);
  });
  it('caps support at 90 without reducing existing confidence or rounding a rest boost into existence', () => {
    const {state} = betweenMatchFixture();
    for (const confidence of [89.9,90,95,99]) {
      state.player.confidence=confidence;
      for (const choice of ['rest','practice','review'] as const) {
        const result=betweenMatchEffects(state,1,choice).confidence;
        expect(result).toBeGreaterThanOrEqual(confidence);
        expect(result).toBeLessThanOrEqual(Math.max(confidence,90));
      }
    }
    state.player.confidence=88.555;
    expect(betweenMatchEffects(state,1,'rest').confidence).toBe(88.555);
  });
  it('defaults to rest for live play and opens a new choice after the next result', () => {
    const { state, event } = betweenMatchFixture();
    const started = startLiveMatchState(state, event.id);
    expect(betweenMatchInfo(started)?.applied?.choice).toBe('rest');
    expect(started.player.fatigue).toBeLessThan(state.player.fatigue);
    expect(prepareBetweenMatchesState(started, 'review')).toBe(started);
    const finished = finalizeLiveMatch(started, { ...started.liveMatch!, playerFrames: Math.ceil(started.liveMatch!.bestOf / 2), opponentFrames: 1, status: 'Completed' });
    expect(betweenMatchInfo(finished)?.applied).toBeUndefined();
    expect(betweenMatchInfo(finished)?.key).not.toBe(betweenMatchInfo(state)?.key);
  });
  it('honours a selected plan during Quick Sim and does not prepare eliminated players', () => {
    const { state, event } = betweenMatchFixture();
    const prepared = prepareBetweenMatchesState(state, 'review');
    const simulated = simulateTournamentMatchState(prepared, event.id);
    expect(simulated.travel.bookings[event.id].betweenMatches?.choice).toBe('review');
    expect(simulated.matches.length).toBe(state.matches.length + 1);
    const out = { ...state, tournamentProgress: { ...state.tournamentProgress, currentRound: null } };
    expect(betweenMatchInfo(out)).toBeNull();
    expect(prepareBetweenMatchesState(out, 'rest')).toBe(out);
  });
});
