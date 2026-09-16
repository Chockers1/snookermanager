import { formatPercent } from '../../utils/formatters';
import type { SponsorDeal } from '../../types/game';
import { sponsorMood, sponsorPerformance, sponsorRecoveryMatchesRemaining, SPONSOR_PERFORMANCE_TERMS as terms, sponsorPerformanceTermsText } from '../../game/sponsorPerformance';
import { ProgressBar } from '../ui/ProgressBar';
import { sponsorVolatility, sponsorVolatilityDescription } from '../../game/sponsorVolatility';

export function SponsorPerformancePanel({ sponsor, rank, rankingLabel, missedLimit }: { sponsor: SponsorDeal; rank: number | null; rankingLabel: string; missedLimit: number }) {
  const p = sponsorPerformance(sponsor, rank, rankingLabel);
  const remaining = sponsorRecoveryMatchesRemaining(p);
  const tone = p.satisfaction >= 50 ? 'green' : p.satisfaction >= 25 ? 'amber' : 'red';
  return <details className="mt-2 border-t border-border pt-2 text-xs" aria-label={`${sponsor.name} performance`}>
    <summary className="cursor-pointer list-none">
      <div className="flex items-center justify-between gap-2"><span className="text-gray-400">Satisfaction · {sponsorMood(p.satisfaction)}</span><span className={tone === 'green' ? 'font-semibold text-green-400' : tone === 'amber' ? 'font-semibold text-amber-400' : 'font-semibold text-red-400'}>{p.satisfaction.toFixed(2)}/100</span></div>
      <div className="mt-1.5"><ProgressBar value={p.satisfaction} tone={tone} compact /></div>
      <p className="mt-1 text-[11px] text-white" title={sponsorVolatilityDescription(sponsor)}>{sponsorVolatility(sponsor).label} volatility · {Math.round(sponsorVolatility(sponsor).multiplier * 100)}% result reaction</p>
      <p className="mt-1 text-[10px] text-gray-300">Walk-away point: below {terms.walkAwayBelow}/100 after {terms.recoveryMatches} recovery matches.</p>
      <p className="mt-1 text-[10px] text-gray-400">{remaining !== null ? `Warning · ${remaining} matches left in recovery period` : `${p.lastChange > 0 ? '+' : ''}${p.lastChange.toFixed(2)} last match`} · Details ▾</p>
    </summary>
    <div className="mt-2 space-y-2 text-[11px] text-gray-400">
      <p>Aim to win {p.expectedWinRate}% of competitive matches{p.rankingTarget !== null ? ` and stay in the top ${p.rankingTarget} (${p.rankingLabel})` : ''}. Targets are fixed for this deal.</p>
      <p>{p.lastReason}</p>
      <p>{sponsorVolatilityDescription(sponsor)}</p>
      {remaining !== null ? <p className="text-amber-300">Formal warning · {remaining > 0 ? `${remaining} more competitive matches before cancellation is possible` : 'Recovery period complete'}. Stay at {terms.walkAwayBelow} or above to keep the deal; reach {terms.recoveredAt} to clear the warning.</p> : <p>{sponsorPerformanceTermsText}</p>}
      <p>Tough opponents soften defeats. Single-frame events have half weight. Exhibitions and weeks without matches do not affect this score.</p>
      <p>Promotional obligations: {formatPercent(sponsor.compliance ?? 100)} compliance · {(sponsor.missedObligations ?? 0)}/{missedLimit} missed. Reaching {missedLimit} misses or falling below 40% compliance ends the deal at the weekly review, independently of match satisfaction.</p>
    </div>
  </details>;
}
