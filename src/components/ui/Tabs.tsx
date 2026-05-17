import clsx from 'clsx'

type TabsProps = {
  tabs: string[]
  activeTab: string
}

export function Tabs({ tabs, activeTab }: TabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className={clsx(
            'rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]',
            tab === activeTab
              ? 'border-scm-green/40 bg-scm-green/15 text-emerald-200'
              : 'border-scm-border bg-scm-panelSoft text-scm-textMuted',
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}