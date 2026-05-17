import clsx from 'clsx'
import type { ReactNode } from 'react'

export type DataTableColumn<T> = {
  key: keyof T | string
  header: string
  align?: 'left' | 'center' | 'right'
  render?: (row: T) => ReactNode
}

type DataTableProps<T extends { id?: string }> = {
  columns: DataTableColumn<T>[]
  data: T[]
  selectedId?: string
  onRowClick?: (row: T) => void
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  selectedId,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-2 text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={clsx('px-3 pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-scm-textMuted', {
                  'text-left': !column.align || column.align === 'left',
                  'text-center': column.align === 'center',
                  'text-right': column.align === 'right',
                })}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const rowId = row.id ?? `${index}`
            const selected = selectedId === rowId

            return (
              <tr
                key={rowId}
                className={clsx(
                  'cursor-default rounded-lg bg-scm-panelSoft text-scm-text transition-colors',
                  selected && 'outline outline-1 outline-scm-green/50',
                  onRowClick && 'cursor-pointer hover:bg-scm-panelHover',
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={clsx('px-3 py-3', {
                      'text-left': !column.align || column.align === 'left',
                      'text-center': column.align === 'center',
                      'text-right': column.align === 'right',
                    })}
                  >
                    {column.render ? column.render(row) : String(row[column.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}