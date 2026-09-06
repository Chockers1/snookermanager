import type { SponsorDeal } from '../types/game';
import type { GameState } from '../hooks/useGameState';

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
  return sponsor.performance ?? { ...sponsorExpectations(sponsor.risk, rank, rankingLabel), satisfaction: 75, matchesReviewed: 0, warningAtMatch: null, lastChange: 0, lastReason: 'A fresh start. Only future competitive matches affect satisfaction.' };
}
export function sponsorMood(score: number) {
  return score >= 85 ? 'Delighted' : score >= 70 ? 'Happy' : score >= 50 ? 'Content' : score >= 40 ? 'Concerned' : score >= 25 ? 'Unhappy' : 'At risk';
}
export type SponsorReviewContext = { matchId: string; result: 'Won' | 'Lost' | 'Drawn'; rank: number | null; rankingLabel: string; playerMatchRank: number; opponentRank: number; bestOf: number; competitive: boolean };
export function reviewSponsorPerformance(sponsor: SponsorDeal, context: SponsorReviewContext): { sponsor: SponsorDeal; notice: 'concern' | 'warning' | 'recovered' | 'terminated' | null } {
  const previous = sponsorPerformance(sponsor, context.rank, context.rankingLabel);
  if (!context.competitive || previous.lastMatchId === context.matchId) return { sponsor: { ...sponsor, performance: previous }, notice: null };
  const tougherOpponent = context.opponentRank > 0 && context.playerMatchRank > 0 && context.opponentRank < context.playerMatchRank * .75;
  const easierOpponent = context.opponentRank > context.playerMatchRank * 1.5 && context.playerMatchRank > 0;
  const expected = clamp(previous.expectedWinRate + (tougherOpponent ? -10 : easierOpponent ? 5 : 0), 25, 75);
  const outcome = context.result === 'Won' ? 100 : context.result === 'Drawn' ? 50 : 0;
  const rankingSlip = previous.rankingLabel === context.rankingLabel && previous.rankingTarget !== null && context.rank !== null && context.rank > previous.rankingTarget;
  const change = clamp(((outcome - expected) / 15 + (context.result === 'Won' ? .5 : 0) - (rankingSlip ? 1 : 0)) * (context.bestOf === 1 ? .5 : 1), -5, 5);
  const satisfaction = Math.round(clamp(previous.satisfaction + change, 0, 100) * 10) / 10;
  const matchesReviewed = previous.matchesReviewed + 1;
  let warningAtMatch = previous.warningAtMatch;
  let notice: ReturnType<typeof reviewSponsorPerformance>['notice'] = null;
  if (satisfaction < 40 && warningAtMatch === null) { warningAtMatch = matchesReviewed; notice = 'warning'; }
  else if (satisfaction >= 50 && warningAtMatch !== null) { warningAtMatch = null; notice = 'recovered'; }
  else if (satisfaction < 50 && previous.satisfaction >= 50) notice = 'concern';
  if (warningAtMatch !== null && matchesReviewed - warningAtMatch >= 6 && satisfaction < 25) notice = 'terminated';
  const lastReason = `${context.result === 'Won' ? 'Match win' : context.result === 'Drawn' ? 'Drawn match' : 'Match defeat'}${tougherOpponent ? ' against a higher-ranked opponent' : ''}${rankingSlip ? '; below the agreed ranking target' : ''}${context.bestOf === 1 ? '; single-frame result has half weight' : ''}.`;
  return { sponsor: { ...sponsor, performance: { ...previous, satisfaction, matchesReviewed, warningAtMatch, lastMatchId: context.matchId, lastChange: Math.round((satisfaction - previous.satisfaction) * 10) / 10, lastReason },
    ...(satisfaction < 50 && sponsor.renewalStatus === 'Offered' ? { renewalStatus: 'None', renewalOfferValue: undefined } : {}),
  }, notice };
}
