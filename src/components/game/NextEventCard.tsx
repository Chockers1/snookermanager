import { CalendarDays, MapPinned } from 'lucide-react'
import type { Tournament } from '../../types/game'
import { formatMoney } from '../../utils/formatters'
import { StatusBadge } from '../ui/StatusBadge'

type NextEventCardProps = {
  tournament: Tournament
}

export function NextEventCard({ tournament }: NextEventCardProps) {
  return (
    <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-scm-textMuted">Up Next</p>
          <p className="mt-2 text-xl font-semibold text-scm-text">{tournament.name}</p>
        </div>
        <StatusBadge tone="blue">{tournament.type}</StatusBadge>
      </div>
      <div className="mt-4 space-y-3 text-sm text-scm-textSoft">
        <div className="flex items-center gap-2">
          <MapPinned className="h-4 w-4 text-scm-gold" />
          {tournament.location}
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-scm-green" />
          {tournament.startDate} · {tournament.format}
        </div>
        <div className="flex items-center justify-between">
          <span>Total travel estimate</span>
          <span>{formatMoney(tournament.entryFee + tournament.travelCost + tournament.hotelCost)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Prize pool target</span>
          <span>{formatMoney(tournament.prizeMoney)}</span>
        </div>
      </div>
    </div>
  )
}