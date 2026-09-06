import { describe, expect, it } from 'vitest';
import { sponsorPerformance, sponsorRanking, reviewSponsorPerformance, type SponsorReviewContext } from './sponsorPerformance';
import { createStarterState, advanceWeekState, enterTournamentState, getNextEligibleTournament, bookTravelState, confirmTournamentPreparationState, continueToNextTournamentState, startLiveMatchState, finalizeLiveMatch, renewSponsorState } from '../hooks/useGameState';
import { getDefaultPreparationAllocations } from './tournamentPreparation';
import type { SponsorDeal } from '../types/game';
const deal = (): SponsorDeal => ({ ...createStarterState().sponsors[0], risk: 'Low', performance: undefined });
const context = (i: number, result: SponsorReviewContext['result'] = 'Lost'): SponsorReviewContext => ({ matchId: 'result-' + i, result, rank: 20, rankingLabel: 'World Ranking', playerMatchRank: 20, opponentRank: 20, bestOf: 7, competitive: true });

describe('modest sponsor performance pressure', () => {
  it('gives existing deals a fresh 75 score and freezes expectations at initialization', () => {
    const sponsor = deal();
    const p = sponsorPerformance(sponsor, 20, 'World Ranking');
    expect(p).toMatchObject({ satisfaction: 75, expectedWinRate: 45, rankingTarget: 25, matchesReviewed: 0 });
    expect(sponsorPerformance({ ...sponsor, performance: p }, 1, 'World Ranking')).toEqual(p);
    expect(sponsorPerformance({ ...sponsor, risk: 'High' }, 20, 'World Ranking').expectedWinRate).toBeGreaterThan(p.expectedWinRate);
  });
  it('absorbs one defeat, softens strong opponents and halves Shoot Out pressure', () => {
    const sponsor = deal();
    const ordinary = reviewSponsorPerformance(sponsor, context(1));
    expect(ordinary.notice).toBeNull();
    expect(ordinary.sponsor.performance!.satisfaction).toBeGreaterThanOrEqual(70);
    expect(reviewSponsorPerformance(sponsor, { ...context(1), opponentRank: 1 }).sponsor.performance!.lastChange).toBeGreaterThan(ordinary.sponsor.performance!.lastChange);
    expect(reviewSponsorPerformance(sponsor, { ...context(1), bestOf: 1 }).sponsor.performance!.lastChange).toBe(ordinary.sponsor.performance!.lastChange / 2);
  });
  it('warns before cancellation and always allows six further matches to recover', () => {
    let sponsor = deal(), warnedAt = 0, cancelledAt = 0;
    for (let i = 1; i <= 40; i++) {
      const review = reviewSponsorPerformance(sponsor, context(i)); sponsor = review.sponsor;
      if (review.notice === 'warning') warnedAt = i;
      if (review.notice === 'terminated') { cancelledAt = i; break; }
    }
    expect(warnedAt).toBeGreaterThan(1);
    expect(cancelledAt - warnedAt).toBeGreaterThanOrEqual(6);
    expect(sponsor.performance!.satisfaction).toBeLessThan(25);
  });
  it('lets wins clear a warning and prevents duplicate or exhibition reviews', () => {
    let sponsor = deal();
    sponsor.performance = { ...sponsorPerformance(sponsor, 20, 'World Ranking'), satisfaction: 37, warningAtMatch: 0 };
    let recovered = false;
    for (let i = 1; i <= 5; i++) { const r = reviewSponsorPerformance(sponsor, context(i, 'Won')); sponsor = r.sponsor; recovered ||= r.notice === 'recovered'; }
    expect(recovered).toBe(true); expect(sponsor.performance!.warningAtMatch).toBeNull();
    expect(reviewSponsorPerformance(sponsor, context(5, 'Won')).sponsor).toEqual(sponsor);
    expect(reviewSponsorPerformance(sponsor, { ...context(6), competitive: false }).sponsor).toEqual(sponsor);
  });
  it('handles draws and ranking slippage without applying the wrong circuit target', () => {
    const sponsor = { ...deal(), performance: sponsorPerformance(deal(), 20, 'World Ranking') };
    const draw = reviewSponsorPerformance(sponsor, context(1, 'Drawn'));
    expect(draw.sponsor.performance!.lastChange).toBeGreaterThanOrEqual(0);
    expect(reviewSponsorPerformance(sponsor, { ...context(1), rank: 40 }).sponsor.performance!.lastChange).toBeLessThan(reviewSponsorPerformance(sponsor, context(1)).sponsor.performance!.lastChange);
    expect(reviewSponsorPerformance(sponsor, { ...context(1), rank: 40, rankingLabel: 'Senior Ranking' }).sponsor.performance!.lastChange).toBe(reviewSponsorPerformance(sponsor, context(1)).sponsor.performance!.lastChange);
  });
  it('does not penalise weeks without results or allow a stale unhappy renewal', () => {
    const state = createStarterState();
    const before = state.sponsors[0].performance;
    expect(advanceWeekState(state).sponsors.find(s => s.id === state.sponsors[0].id)?.performance).toEqual(before);
    state.sponsors[0] = { ...state.sponsors[0], performance: { ...before!, satisfaction: 30 }, renewalStatus: 'Offered', renewalOfferValue: 1000 };
    expect(renewSponsorState(state, state.sponsors[0].id).sponsors[0].weeksRemaining).toBe(state.sponsors[0].weeksRemaining);
  });
  it('removes a dropped sponsor and its income through actual match settlement, only once', () => {
    let state = createStarterState();
    const tournament = getNextEligibleTournament(state)!;
    state = enterTournamentState(state, tournament.id);
    state = bookTravelState(state, tournament.id);
    state = confirmTournamentPreparationState(state, tournament.id, 'balanced', getDefaultPreparationAllocations(), []);
    state = continueToNextTournamentState(state);
    state = startLiveMatchState(state, tournament.id);
    expect(state.liveMatch, state.lastAction).not.toBeNull();
    const sponsor = state.sponsors[0];
    const ranking = sponsorRanking(state);
    state.sponsors[0] = { ...sponsor, performance: { ...sponsorPerformance(sponsor, ranking.rank, ranking.label), satisfaction: 20, warningAtMatch: 0, matchesReviewed: 5 } };
    const result = { ...state.liveMatch!, status: 'Completed' as const, playerFrames: 0, opponentFrames: Math.ceil(state.liveMatch!.bestOf / 2) };
    const after = finalizeLiveMatch(state, result);
    expect(after.sponsors.some(s => s.id === sponsor.id)).toBe(false);
    expect(after.inbox.some(m => m.subject === 'Sponsorship ended after performance review')).toBe(true);
    expect(after.sponsors.reduce((sum, s) => sum + s.monthlyValue, 0)).toBe(state.sponsors.reduce((sum, s) => sum + s.monthlyValue, 0) - sponsor.monthlyValue);
    expect(finalizeLiveMatch(after, result)).toBe(after);
  });
});
