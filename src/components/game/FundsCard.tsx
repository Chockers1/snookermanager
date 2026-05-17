import { Landmark } from 'lucide-react'
import type { FinanceSnapshot } from '../../types/game'
import { formatMoney } from '../../utils/formatters'
import { MetricCard } from '../ui/MetricCard'

type FundsCardProps = {
  snapshot: FinanceSnapshot
}

export function FundsCard({ snapshot }: FundsCardProps) {
  return (
    <MetricCard
      label="Finance Summary"
      value={formatMoney(snapshot.surplus)}
      subValue={`${formatMoney(snapshot.income)} in / ${formatMoney(snapshot.expenses)} out`}
      icon={<Landmark className="h-5 w-5" />}
      tone={snapshot.surplus >= 0 ? 'green' : 'red'}
    />
  )
}