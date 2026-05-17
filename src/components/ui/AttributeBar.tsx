import { getRatingColour } from '../../utils/formatters'
import { ProgressBar } from './ProgressBar'

type AttributeBarProps = {
  label: string
  value: number
  trend?: number
  max?: number
}

export function AttributeBar({ label, value, trend = 0, max = 100 }: AttributeBarProps) {
  const tone = getRatingColour(value)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-scm-textSoft">{label}</span>
        <div className="flex items-center gap-2">
          {trend !== 0 && (
            <span className={trend > 0 ? 'text-emerald-300' : 'text-rose-300'}>
              {trend > 0 ? '+' : ''}
              {trend}
            </span>
          )}
          <span className="font-semibold text-scm-text">{value}</span>
        </div>
      </div>
      <ProgressBar value={value} max={max} tone={tone} compact />
    </div>
  )
}