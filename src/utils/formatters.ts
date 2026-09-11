export function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value)
}

const percentageNumber = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 2,
  useGrouping: false,
})

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const displayed = percentageNumber.format(value)
  return `${displayed === '-0' ? '0' : displayed}%`
}

export function formatSigned(value: number): string {
  if (value > 0) return `+${value}`
  return `${value}`
}

export function getRatingColour(value: number): 'green' | 'amber' | 'red' {
  if (value >= 75) return 'green'
  if (value >= 55) return 'amber'
  return 'red'
}
/** Attribute precision is retained in the save; only visible values are rounded. */
export function formatAttribute(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '—'
}
