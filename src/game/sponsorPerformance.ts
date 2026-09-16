import type { SponsorDeal } from '../types/game';
import type { GameState } from '../hooks/useGameState';
import { sponsorVolatility, sponsorVolatilityDescription } from './sponsorVolatility';

export const SPONSOR_PERFORMANCE_TERMS = {
  starting: 75, concernBelow: 50, warningBelow: 40, walkAwayBelow: 25, recoveryMatches: 6, recoveredAt: 50,
} as const;
export const sponsorPerformanceTermsText = `All sponsors: below ${SPONSOR_PERFORMANCE_TERMS.warningBelow}/100 satisfaction triggers a formal warning. After ${SPONSOR_PERFORMANCE_TERMS.recoveryMatches} further competitive matches, they walk away if satisfaction is below ${SPONSOR_PERFORMANCE_TERMS.walkAwayBelow}/100. Reach ${SPONSOR_PERFORMANCE_TERMS.recoveredAt}/100 to clear the warning.`;
export type SponsorPerformanceNotice = 'concern' | 'warning' | 'recovered' | 'terminated';

export type SponsorPerformance = {
  satisfaction: number;
  expectedWinRate: number;
  rankingTarget: number | null;
  rankingLabel: string;
  matchesReviewed: number;
  warningAtMatch: number | null;
  lastMatchId?: string;
  lastChange: number;
  lastReason: string;
};
const clamp = (n: number, low: number, high: number) => Math.min(high, Math.max(low, n));
export function sponsorRanking(state: Pick<GameState, 'player' | 'rankings'>) {
  return { rank: state.rankings.find(r => r.playerName === state.player.fullName)?.ranking ?? state.player.worldRanking ?? state.player.amateurRanking ?? null, label: state.player.rankingLabel };
}
export function sponsorExpectations(risk: SponsorDeal['risk'], rank: number | null, rankingLabel: string) {
  return {
    expectedWinRate: (rank && rank <= 16 ? 55 : rank && rank <= 64 ? 45 : 40) + (risk === 'High' ? 10 : risk === 'Medium' ? 5 : 0),
    rankingTarget: rank && rank > 0 ? rank + Math.max(4, Math.ceil(rank * .25)) : null,
    rankingLabel,
  };
}
export function sponsorPerformance(sponsor: SponsorDeal, rank: number | null, rankingLabel: string): SponsorPerformance {
  return sponsor.performance ?? { ...sponsorExpectations(sponsor.risk, rank, rankingLabel), satisfaction: SPONSOR_PERFORMANCE_TERMS.starting, matchesReviewed: 0, warningAtMatch: null, lastChange: 0, lastReason: 'A fresh start. Only future competitive matches affect satisfaction.' };
}
export function sponsorRecoveryMatchesRemaining(p: SponsorPerformance) {
  return p.warningAtMatch === null ? null : Math.max(0, SPONSOR_PERFORMANCE_TERMS.recoveryMatches - (p.matchesReviewed - p.warningAtMatch));
}
export function sponsorPerformanceNoticeText(sponsor: SponsorDeal, notice: SponsorPerformanceNotice) {
  const p = sponsor.performance!;
  const terms = SPONSOR_PERFORMANCE_TERMS;
  const score = `${p.satisfaction.toFixed(2)}/100`;
  if (notice === 'terminated') return `${sponsor.name} ended the deal after the ${terms.recoveryMatches}-match recovery period: satisfaction ${score}, below the ${terms.walkAwayBelow}/100 walk-away point. The ${sponsor.slot} slot is free and £${sponsor.monthlyValue.toLocaleString('en-GB')}/month has been removed.`;
  if (notice === 'recovered') return `${sponsor.name}: satisfaction ${score}. You reached ${terms.recoveredAt}/100, so the formal warning is cleared. ${sponsorPerformanceTermsText}`;
  const targets = `Aim for ${p.expectedWinRate}% competitive match wins${p.rankingTarget !== null ? ` and top ${p.rankingTarget} in ${p.rankingLabel}` : ''}. Wins rebuild satisfaction; weeks without matches do not lower it. ${sponsorVolatilityDescription(sponsor)}`;
  if (notice === 'warning') return `${sponsor.name}: satisfaction ${score}. Formal warning: ${sponsorRecoveryMatchesRemaining(p)} further competitive matches to recover before cancellation is possible. Stay at ${terms.walkAwayBelow}/100 or above to keep the deal; reach ${terms.recoveredAt}/100 to clear the warning. ${targets}`;
  return `${sponsor.name}: satisfaction ${score}, below ${terms.concernBelow}/100. No immediate cancellation. ${sponsorPerformanceTermsText} ${targets}`;
}
export function sponsorMood(score: number) {
  return score >= 85 ? 'Delighted' : score >= 70 ? 'Happy' : score >= 50 ? 'Content' : score >= 40 ? 'Concerned' : score >= 25 ? 'Unhappy' : 'At risk';
}
export type SponsorReviewContext = { mediaNote?: string; matchId: string; result: 'Won' | 'Lost' | 'Drawn'; rank: number | null; rankingLabel: string; playerMatchRank: number; opponentRank: number; bestOf: number; competitive: boolean };
export function reviewSponsorPerformance(sponsor: SponsorDeal, context: SponsorReviewContext): { sponsor: SponsorDeal; notice: SponsorPerformanceNotice | null } {
  const volatility = sponsorVolatility(sponsor);
  sponsor = { ...sponsor, volatility: volatility.key };
  const previous = sponsorPerformance(sponsor, context.rank, context.rankingLabel);
  if (!context.competitive || previous.lastMatchId === context.matchId) return { sponsor: { ...sponsor, performance: previous }, notice: null };
  const tougherOpponent = context.opponentRank > 0 && context.playerMatchRank > 0 && context.opponentRank < context.playerMatchRank * .75;
  const easierOpponent = context.opponentRank > context.playerMatchRank * 1.5 && context.playerMatchRank > 0;
  const expected = clamp(previous.expectedWinRate + (context.mediaNote ? 2 : 0) + (tougherOpponent ? -10 : easierOpponent ? 5 : 0), 25, 75);
  const outcome = context.result === 'Won' ? 100 : context.result === 'Drawn' ? 50 : 0;
  const rankingSlip = previous.rankingLabel === context.rankingLabel && previous.rankingTarget !== null && context.rank !== null && context.rank > previous.rankingTarget;
  const baseChange = clamp(((outcome - expected) / 15 + (context.result === 'Won' ? .5 : 0) - (rankingSlip ? 1 : 0)) * (context.bestOf === 1 ? .5 : 1), -5, 5);
  const change = baseChange * volatility.multiplier;
  const satisfaction = Math.round(clamp(previous.satisfaction + change, 0, 100) * 100) / 100;
  const matchesReviewed = previous.matchesReviewed + 1;
  let warningAtMatch = previous.warningAtMatch;
  let notice: ReturnType<typeof reviewSponsorPerformance>['notice'] = null;
  const terms = SPONSOR_PERFORMANCE_TERMS;
  if (satisfaction < terms.warningBelow && warningAtMatch === null) { warningAtMatch = matchesReviewed; notice = 'warning'; }
  else if (satisfaction >= terms.recoveredAt && warningAtMatch !== null) { warningAtMatch = null; notice = 'recovered'; }
  else if (satisfaction < terms.concernBelow && previous.satisfaction >= terms.concernBelow) notice = 'concern';
  if (warningAtMatch !== null && matchesReviewed - warningAtMatch >= terms.recoveryMatches && satisfaction < terms.walkAwayBelow) notice = 'terminated';
  const lastReason = `${context.result === 'Won' ? 'Match win' : context.result === 'Drawn' ? 'Drawn match' : 'Match defeat'}${tougherOpponent ? ' against a higher-ranked opponent' : ''}${rankingSlip ? '; below the agreed ranking target' : ''}${context.bestOf === 1 ? '; single-frame result has half weight' : ''}. ${volatility.label} sponsor: ${Math.round(volatility.multiplier * 100)}% result reaction. ${context.mediaNote ?? ''}`;
  return { sponsor: { ...sponsor, performance: { ...previous, satisfaction, matchesReviewed, warningAtMatch, lastMatchId: context.matchId, lastChange: Math.round((satisfaction - previous.satisfaction) * 100) / 100, lastReason },
    ...(satisfaction < 50 && sponsor.renewalStatus === 'Offered' ? { renewalStatus: 'None', renewalOfferValue: undefined } : {}),
  }, notice };
}
