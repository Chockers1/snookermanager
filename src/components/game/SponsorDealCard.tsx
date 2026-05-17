import type { SponsorDeal } from '../../types/game'
import { formatMoney } from '../../utils/formatters'
import { StatusBadge } from '../ui/StatusBadge'

type SponsorDealCardProps = {
  deal: SponsorDeal
}

export function SponsorDealCard({ deal }: SponsorDealCardProps) {
  return (
    <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-scm-text">{deal.name}</p>
          <p className="mt-1 text-xs text-scm-textMuted">{deal.category}</p>
        </div>
        <StatusBadge tone={deal.risk === 'Low' ? 'green' : deal.risk === 'Medium' ? 'amber' : 'red'}>{deal.risk}</StatusBadge>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Monthly value</p>
          <p className="mt-1 text-lg font-semibold text-scm-text">{formatMoney(deal.monthlyValue)}</p>
        </div>
        <p className="text-sm text-scm-textSoft">Fit {deal.brandFit}%</p>
      </div>
    </div>
  )
}