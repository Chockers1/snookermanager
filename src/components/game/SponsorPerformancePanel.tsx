import type { SponsorDeal } from '../../types/game';
import { sponsorMood, sponsorPerformance } from '../../game/sponsorPerformance';
import { ProgressBar } from '../ui/ProgressBar';

export function SponsorPerformancePanel({ sponsor, rank, rankingLabel }: { sponsor: SponsorDeal; rank: number | null; rankingLabel: string }) {
  const p = sponsorPerformance(sponsor, rank, rankingLabel);
  const remaining = p.warningAtMatch === null ? null : Math.max(0, 6 - (p.matchesReviewed - p.warningAtMatch));
  const tone = p.satisfaction >= 50 ? 'green' : p.satisfaction >= 25 ? 'amber' : 'red';
  return <details className="mt-2 border-t border-border pt-2 text-xs" aria-label={`${sponsor.name} performance`}>
    <summary className="cursor-pointer list-none">
      <div className="flex items-center justify-between gap-2"><span className="text-gray-400">Satisfaction · {sponsorMood(p.satisfaction)}</span><span className={tone === 'green' ? 'font-semibold text-green-400' : tone === 'amber' ? 'font-semibold text-amber-400' : 'font-semibold text-red-400'}>{p.satisfaction.toFixed(1)}/100</span></div>
      <div className="mt-1.5"><ProgressBar value={p.satisfaction} tone={tone} compact /></div>
      <p className="mt-1 text-[10px] text-gray-500">{remaining !== null ? `Warning · ${remaining} matches left in recovery period` : `${p.lastChange > 0 ? '+' : ''}${p.lastChange} last match`} · Details ▾</p>
    </summary>
    <div className="mt-2 space-y-2 text-[11px] text-gray-400">
      <p>Aim to win {p.expectedWinRate}% of competitive matches{p.rankingTarget !== null ? ` and stay in the top ${p.rankingTarget} (${p.rankingLabel})` : ''}. Targets are fixed for this deal.</p>
      <p>{p.lastReason}</p>
      {remaining !== null ? <p className="text-amber-300">Formal warning · {remaining > 0 ? `${remaining} more competitive matches before cancellation is possible` : 'Recovery period complete'}. Stay at 25 or above to keep the deal; reach 50 to clear the warning.</p> : <p>Below 40 triggers a formal warning. Cancellation requires a score below 25 after at least six more competitive matches.</p>}
      <p>Tough opponents soften defeats. Single-frame events have half weight. Exhibitions and weeks without matches do not affect this score.</p>
      <p>Promotional obligations: {sponsor.compliance ?? 100}% compliance · {(sponsor.missedObligations ?? 0)}/3 missed. These contract duties apply separately.</p>
    </div>
  </details>;
}
