import { describe, expect, it } from 'vitest';
import { createStarterState, acceptSponsorState, repairGameState, renewSponsorState } from '../hooks/useGameState';
import { seasonalSponsorCompanies } from './sponsorMarket';
import { reviewSponsorPerformance, sponsorPerformance, type SponsorReviewContext } from './sponsorPerformance';
import { SPONSOR_VOLATILITY, sponsorVolatility, sponsorVolatilityDescription, type SponsorVolatility } from './sponsorVolatility';

const starter = createStarterState();
const deal = (volatility: SponsorVolatility) => ({ ...starter.sponsors[0], risk: 'Low' as const, volatility,
  performance: { ...sponsorPerformance({ ...starter.sponsors[0], performance: undefined }, 20, 'World Ranking'), expectedWinRate: 45 } });
const context = (matchId: string, result: SponsorReviewContext['result'] = 'Lost'): SponsorReviewContext => ({ matchId, result,
  rank: 20, rankingLabel: 'World Ranking', playerMatchRank: 20, opponentRank: 20, bestOf: 7, competitive: true });

describe('individual sponsor volatility', () => {
  it('assigns all five temperaments consistently by company, independent of season and risk', () => {
    const profiles = seasonalSponsorCompanies.map(sponsorVolatility);
    expect(new Set(profiles.map(p => p.key)).size).toBe(5);
    for (const company of seasonalSponsorCompanies) {
      expect(sponsorVolatility({ name: `  ${company.name.toUpperCase()}  ` })).toEqual(sponsorVolatility(company));
      expect(sponsorVolatility(JSON.parse(JSON.stringify(company)))).toEqual(sponsorVolatility(company));
    }
    expect(sponsorVolatility({ name: 'Any company', volatility: 'patient' }).key).toBe('patient');
  });

  it('scales both losses and wins while leaving the target and cancellation terms unchanged', () => {
    const losses = Object.keys(SPONSOR_VOLATILITY).map(key => reviewSponsorPerformance(deal(key as SponsorVolatility), context('loss')).sponsor.performance!);
    expect(losses.map(p => p.lastChange)).toEqual([-2.1, -2.55, -3, -3.6, -4.2]);
    const gains = Object.keys(SPONSOR_VOLATILITY).map(key => reviewSponsorPerformance(deal(key as SponsorVolatility), context('win', 'Won')).sponsor.performance!.lastChange);
    expect(gains).toEqual([...gains].sort((a, b) => a - b));
    expect(gains[0]).toBeGreaterThan(0);
    expect(new Set(losses.map(p => p.expectedWinRate))).toEqual(new Set([45]));
  });

  it.each(Object.keys(SPONSOR_VOLATILITY) as SponsorVolatility[])('%s sponsors respect caps, warning grace, recovery and duplicate protection', volatility => {
    let sponsor = deal(volatility);
    const capped = reviewSponsorPerformance({ ...sponsor, performance: { ...sponsor.performance, expectedWinRate: 75 } },
      { ...context('maximum-loss'), rank: 200, opponentRank: 100 });
    expect(capped.sponsor.performance!.lastChange).toBe(-5 * SPONSOR_VOLATILITY[volatility].multiplier);
    let warning = 0;
    for (let i = 1; i <= 80; i++) {
      const review = reviewSponsorPerformance(sponsor, context(`loss-${i}`));
      sponsor = review.sponsor as typeof sponsor;
      expect(Math.abs(sponsor.performance.lastChange)).toBeLessThanOrEqual(5 * SPONSOR_VOLATILITY[volatility].multiplier);
      if (review.notice === 'warning') warning = i;
      if (review.notice === 'terminated') { expect(i - warning).toBeGreaterThanOrEqual(6); break; }
      if (i === 80) throw new Error('Repeated defeats never ended the deal');
    }
    sponsor = { ...deal(volatility), performance: { ...deal(volatility).performance, satisfaction: 40, warningAtMatch: 0 } };
    let recovered = false;
    for (let i = 1; i <= 8; i++) {
      const review = reviewSponsorPerformance(sponsor, context(`win-${i}`, 'Won'));
      sponsor = review.sponsor as typeof sponsor;
      recovered ||= review.notice === 'recovered';
    }
    expect(recovered).toBe(true);
    expect(reviewSponsorPerformance(sponsor, context('win-8', 'Won')).sponsor).toEqual(sponsor);
    expect(reviewSponsorPerformance(sponsor, { ...context('exhibition'), competitive: false }).sponsor).toEqual(sponsor);
    const resumed = reviewSponsorPerformance(JSON.parse(JSON.stringify(sponsor)), context('after-reload'));
    expect(resumed).toEqual(reviewSponsorPerformance(sponsor, context('after-reload')));
  });

  it('preserves legacy satisfaction, warning progress and finances through repeated save repair', () => {
    const state = structuredClone(starter);
    state.sponsors[0] = { ...deal('balanced'), volatility: undefined,
      performance: { ...deal('balanced').performance, satisfaction: 31, warningAtMatch: 3, matchesReviewed: 6 } };
    const before = state.sponsors[0].performance;
    const once = repairGameState(state);
    const twice = repairGameState(JSON.parse(JSON.stringify(once)));
    expect(once.sponsors[0].volatility).toBe(sponsorVolatility(state.sponsors[0]).key);
    expect(twice.sponsors[0]).toEqual(once.sponsors[0]);
    expect(twice.sponsors[0].performance).toEqual(before);
    expect(twice.player.cash).toBe(state.player.cash);
  });

  it('keeps the advertised temperament through signing, renewal and quoted terms', () => {
    const state = structuredClone(starter);
    state.sponsors = [];
    state.player.reputation = 100;
    const offer = state.sponsorOffers.find(o => o.seasonal)!;
    offer.volatility = 'volatile';
    const accepted = acceptSponsorState(state, offer.id);
    const sponsor = accepted.sponsors.find(s => s.id === offer.id)!;
    expect(sponsor.volatility).toBe('volatile');
    expect(sponsorVolatilityDescription(sponsor)).toBe(sponsorVolatilityDescription(offer));
    accepted.sponsors = [{ ...sponsor, renewalStatus: 'Offered', renewalOfferValue: sponsor.monthlyValue }];
    expect(renewSponsorState(accepted, sponsor.id).sponsors[0].volatility).toBe('volatile');
  });
});
