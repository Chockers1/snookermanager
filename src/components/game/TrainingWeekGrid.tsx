import type { TrainingSlot } from '../../types/game'

type TrainingWeekGridProps = {
  week: TrainingSlot[]
}

export function TrainingWeekGrid({ week }: TrainingWeekGridProps) {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[720px] grid-cols-[90px_repeat(3,minmax(0,1fr))] gap-2 text-sm">
        <div className="px-3 py-2 text-xs uppercase tracking-[0.18em] text-scm-textMuted">Day</div>
        <div className="px-3 py-2 text-xs uppercase tracking-[0.18em] text-scm-textMuted">Morning</div>
        <div className="px-3 py-2 text-xs uppercase tracking-[0.18em] text-scm-textMuted">Afternoon</div>
        <div className="px-3 py-2 text-xs uppercase tracking-[0.18em] text-scm-textMuted">Evening</div>
        {week.map((slot) => (
          <>
            <div key={`${slot.day}-label`} className="rounded-lg bg-scm-deep/70 px-3 py-3 font-semibold text-scm-text">
              {slot.day}
            </div>
            <div key={`${slot.day}-morning`} className="rounded-lg bg-scm-panelHover px-3 py-3 text-scm-textSoft">
              {slot.morning}
            </div>
            <div key={`${slot.day}-afternoon`} className="rounded-lg bg-scm-panelHover px-3 py-3 text-scm-textSoft">
              {slot.afternoon}
            </div>
            <div key={`${slot.day}-evening`} className="rounded-lg bg-scm-panelHover px-3 py-3 text-scm-textSoft">
              {slot.evening}
            </div>
          </>
        ))}
      </div>
    </div>
  )
}