import { PlayerLink } from './PlayerLink';
import type { RankingRow } from '../../types/game'
import { formatMoney, formatSigned } from '../../utils/formatters'
import { DataTable, type DataTableColumn } from '../ui/DataTable'

type RankingTableProps = {
  rows: RankingRow[]
}

const columns: DataTableColumn<RankingRow>[] = [
  { key: 'ranking', header: '#', align: 'right' },
  {
    key: 'playerName',
    header: 'Player',
    render: (row) => (
      <div>
        <div className="font-semibold text-scm-text"><PlayerLink name={row.playerName}/></div>
        <div className="text-xs text-scm-textMuted">{row.nation}</div>
      </div>
    ),
  },
  { key: 'movement', header: 'Move', align: 'right', render: (row) => formatSigned(row.movement) },
  { key: 'points', header: 'Points', align: 'right' },
  { key: 'prizeMoney', header: 'Prize', align: 'right', render: (row) => formatMoney(row.prizeMoney) },
]

export function RankingTable({ rows }: RankingTableProps) {
  const highlighted = rows.find((row) => row.highlighted)?.id
  return <DataTable columns={columns} data={rows} selectedId={highlighted} />
}