type CircularMeterProps = {
  value: number
  label: string
}

export function CircularMeter({ value, label }: CircularMeterProps) {
  const clampedValue = Math.max(0, Math.min(100, value))
  const stroke = 2 * Math.PI * 42
  const offset = stroke - (stroke * clampedValue) / 100

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-24 w-24">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#132b43" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#22c55e"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={stroke}
            strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-xl font-semibold text-scm-text">{clampedValue}%</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-scm-textMuted">{label}</div>
        </div>
      </div>
    </div>
  )
}