import type { Cue } from '../../types/game'
import { formatMoney } from '../../utils/formatters'
import { StatusBadge } from '../ui/StatusBadge'

type EquipmentCardProps = {
  cue: Cue
}

export function EquipmentCard({ cue }: EquipmentCardProps) {
  return (
    <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-scm-text">{cue.name}</p>
          <p className="mt-1 text-xs text-scm-textMuted">{cue.weight} · {cue.balance} balance</p>
        </div>
        <StatusBadge tone="gold">{cue.tier}</StatusBadge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-scm-textSoft">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Condition</p>
          <p className="mt-1 font-semibold text-scm-text">{cue.condition}%</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Familiarity</p>
          <p className="mt-1 font-semibold text-scm-text">{cue.familiarity}%</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Touch</p>
          <p className="mt-1 font-semibold text-scm-text">{cue.touch}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Price</p>
          <p className="mt-1 font-semibold text-scm-text">{formatMoney(cue.price)}</p>
        </div>
      </div>
    </div>
  )
}