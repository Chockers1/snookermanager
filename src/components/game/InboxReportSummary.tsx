import { PlayerNames } from './PlayerNames';
import type { InboxMessage } from '../../types/game';

function summaryToneClass(
  tone: NonNullable<InboxMessage["summary"]>[number]["tone"],
) {
  if (tone === "positive")
    return "border-green-500/35 bg-green-500/10 text-green-300";
  if (tone === "negative")
    return "border-red-500/35 bg-red-500/10 text-red-300";
  if (tone === "warning")
    return "border-amber-500/35 bg-amber-500/10 text-amber-300";
  return "border-sky-500/25 bg-sky-500/5 text-sky-300";
}

export function InboxReportSummary({ items }: { items: NonNullable<InboxMessage['summary']> }) {
  return <section aria-label="Report summary" className="mt-3 max-w-3xl shrink-0 rounded-lg border border-border bg-background/30">
    <div className="border-b border-border px-4 py-2"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">Report summary</p></div>
    <ul className="divide-y divide-border/70">{items.map((item, index) => <li key={item.label + index} className="grid gap-1 px-4 py-1.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
      <div className="min-w-0"><p className="text-xs font-medium text-gray-300"><PlayerNames text={item.label}/></p>{item.detail && <p className="mt-0.5 break-words text-[10px] text-gray-500"><PlayerNames text={item.detail}/></p>}</div>
      <span className={'w-fit rounded-md border px-2.5 py-1 text-xs font-bold ' + summaryToneClass(item.tone)}><PlayerNames text={item.value}/></span>
    </li>)}</ul>
  </section>;
}
