import { useRef } from 'react';

/** Keyboard-accessible tabs for a single, scrollable page section. */
export function SectionTabs<T extends string>({ id, label, tabs, active, onChange }: {
  id: string; label: string; tabs: readonly T[]; active: T; onChange: (tab: T) => void;
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  return <div role="tablist" aria-label={label} className="flex shrink-0 gap-1 overflow-x-auto rounded-lg border border-border bg-surface p-1">
    {tabs.map((tab, index) => <button key={tab} ref={element => { buttons.current[index] = element; }}
      type="button" role="tab" id={`${id}-tab-${index}`} aria-controls={`${id}-panel`}
      aria-selected={active === tab} tabIndex={active === tab ? 0 : -1}
      onClick={() => onChange(tab)} onKeyDown={event => {
        const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length
          : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length
          : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
        if (next === null) return;
        event.preventDefault(); onChange(tabs[next]); buttons.current[next]?.focus();
      }} className={'min-h-10 flex-1 whitespace-nowrap rounded px-3 py-2 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 ' +
        (active === tab ? 'bg-emerald-500/15 text-emerald-300' : 'text-gray-300 hover:bg-white/5')}>
      {tab}
    </button>)}
  </div>;
}
