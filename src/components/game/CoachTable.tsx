import type { Coach } from '../../types/game'
import { formatMoney } from '../../utils/formatters'
import { DataTable, type DataTableColumn } from '../ui/DataTable'
import { StatusBadge } from '../ui/StatusBadge'

type CoachTableProps = {
  coaches: Coach[]
}

const columns: DataTableColumn<Coach>[] = [
  {
    key: 'name',
    header: 'Coach',
    render: (coach) => (
      <div>
        <div className="font-semibold text-scm-text">{coach.name}</div>
        <div className="text-xs text-scm-textMuted">{coach.specialism}</div>
      </div>
    ),
  },
  { key: 'type', header: 'Type' },
  {
    key: 'level',
    header: 'Level',
    render: (coach) => <StatusBadge tone="gold">{coach.level}</StatusBadge>,
  },
  { key: 'compatibility', header: 'Fit', align: 'right', render: (coach) => `${coach.compatibility}%` },
  { key: 'weeklyCost', header: 'Weekly', align: 'right', render: (coach) => formatMoney(coach.weeklyCost) },
]

export function CoachTable({ coaches }: CoachTableProps) {
  return <DataTable columns={columns} data={coaches} selectedId={coaches[0]?.id} />
}