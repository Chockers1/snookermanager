export function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
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