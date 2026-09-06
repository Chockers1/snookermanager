import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { buildMonthWeeks, type MonthCalendarEvent } from '../../utils/monthCalendar';
const colours: Record<string, string> = {
  gold: 'border-amber-500/40 bg-amber-500/20 text-amber-100', green: 'border-green-500/40 bg-green-500/20 text-green-100',
  blue: 'border-sky-500/40 bg-sky-500/20 text-sky-100', orange: 'border-orange-500/40 bg-orange-500/20 text-orange-100', violet: 'border-violet-500/40 bg-violet-500/20 text-violet-100',
};
export function MonthCalendar({ year, month, today, events, selectedId, onSelect }: { year: number; month: number; today: string; events: MonthCalendarEvent[]; selectedId?: string; onSelect: (id: string) => void }) {
  const weeks = buildMonthWeeks(year, month, events);
  return <section aria-label="Month calendar" className="card flex min-h-0 flex-1 flex-col overflow-hidden">
    <div className="grid shrink-0 grid-cols-7 border-b border-border bg-surface-light/50 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <div key={day}>{day}</div>)}</div>
    <div className="grid min-h-0 flex-1" style={{ gridTemplateRows: 'repeat(' + weeks.length + ', minmax(0, 1fr))' }}>
      {weeks.map(week => <div key={week.days[0].date} className="relative min-h-0 border-b border-border last:border-b-0">
        <div className="absolute inset-0 grid grid-cols-7">{week.days.map(day => <div key={day.date} className={'min-w-0 border-r border-border px-1 py-1 last:border-r-0 sm:px-2 ' + (day.inMonth ? 'bg-surface/40' : 'bg-background/50')}>
          <time dateTime={day.date} aria-current={day.date === today ? 'date' : undefined} className={'inline-flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] sm:text-xs ' + (day.date === today ? 'bg-green-500 font-bold text-black' : day.inMonth ? 'text-gray-200' : 'text-gray-600')}>{day.day}</time>
        </div>)}</div>
        <div role="group" aria-label={'Tournaments in week of ' + week.days[0].date} className="scrollbar-thin absolute inset-x-0 bottom-1 top-7 grid auto-rows-[22px] grid-cols-7 content-start gap-y-1 overflow-y-auto px-0.5 sm:auto-rows-[25px]">
          {week.segments.map(segment => <button key={segment.event.id} type="button" onClick={() => onSelect(segment.event.id)} aria-label={segment.event.name + ', ' + segment.event.startDate + ' to ' + (segment.event.endDate ?? segment.event.startDate) + ', ' + segment.event.status}
            title={segment.event.name + ' · ' + segment.event.tourCircuit + ' · ' + segment.event.startDate + '–' + (segment.event.endDate ?? segment.event.startDate) + ' · ' + segment.event.status}
            style={{ gridColumn: (segment.column + 1) + ' / span ' + segment.span, gridRow: segment.lane + 1 }}
            className={'mx-0.5 flex min-w-0 items-center gap-1 rounded border px-1 text-left text-[9px] font-medium transition hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white sm:px-2 sm:text-[11px] ' + (colours[segment.event.accent] ?? colours.blue) + (selectedId === segment.event.id ? ' ring-1 ring-inset ring-white/60' : '')}>
            {segment.continuesBefore && <span aria-hidden="true">‹</span>}<span className="min-w-0 flex-1 truncate">{segment.event.name}</span>{segment.event.status === 'Entered' && <span title="Entered" aria-hidden="true">✓</span>}{segment.continuesAfter && <span aria-hidden="true">›</span>}
          </button>)}
        </div>
      </div>)}
    </div>
  </section>;
}
export function CalendarEventDialog({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => { dialog?.close(); }; }, []);
  return <dialog ref={ref} aria-label="Tournament details" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }} className="m-auto max-h-[90dvh] w-[min(620px,calc(100%-24px))] overflow-y-auto rounded-xl border border-border bg-background p-4 text-white shadow-2xl backdrop:bg-black/70">
    <div className="mb-3 flex justify-end"><button type="button" autoFocus onClick={onClose} aria-label="Close tournament details" className="btn-secondary px-2 py-2"><X className="h-4 w-4" /></button></div>{children}
  </dialog>;
}
