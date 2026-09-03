import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { AttributeBar } from '../components/ui/AttributeBar'
import { SectionCard } from '../components/ui/SectionCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useGame } from '../context/useGame'
import { tableSetupCatalog } from '../data/catalogs'
import { formatMoney } from '../utils/formatters'

export function TableSetupPage() {
  const navigate = useNavigate()
  const { gameState, buyTableSetup } = useGame()
  const detailsRef = useRef<HTMLDivElement | null>(null)
  const [selectedTableId, setSelectedTableId] = useState(gameState.equipment.currentTableId ?? tableSetupCatalog[0]?.id ?? '')
  const [sortMode, setSortMode] = useState<'price' | 'performance'>('performance')
  const [ownedOnly, setOwnedOnly] = useState(false)
  const currentTable = gameState.equipment.currentTableId ? tableSetupCatalog.find((item) => item.id === gameState.equipment.currentTableId) ?? null : null
  const visibleTables = tableSetupCatalog
    .filter((item) => (ownedOnly ? gameState.equipment.tablesOwned.includes(item.id) : true))
    .slice()
    .sort((left, right) => sortMode === 'price'
      ? left.price - right.price
      : (right.clothSpeed + right.cushionResponse + right.pocketForgiveness + right.napQuality) - (left.clothSpeed + left.cushionResponse + left.pocketForgiveness + left.napQuality))
  const selectedTable = visibleTables.find((item) => item.id === selectedTableId) ?? tableSetupCatalog.find((item) => item.id === selectedTableId) ?? visibleTables[0] ?? tableSetupCatalog[0]
  const ownsSelectedTable = gameState.equipment.tablesOwned.includes(selectedTable.id)
  const equipmentTabs = [
    { label: 'Cues', action: () => navigate('/equipment/cues'), active: false },
    { label: 'Chalk', action: () => navigate('/equipment/chalk-tips'), active: false },
    { label: 'Tips', action: () => navigate('/equipment/chalk-tips'), active: false },
    { label: 'Cases', action: () => navigate('/equipment/cases'), active: false },
    { label: 'Table Setup', action: () => navigate('/equipment/table-setup'), active: true },
    { label: 'Maintenance', action: () => navigate('/equipment/maintenance'), active: false },
  ]

  function handleSelectTable(tableId: string) {
    setSelectedTableId(tableId)
    detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Equipment"
        title="Table Setup Market"
        description={`Invest in better home-practice conditions with real table setups, from club surfaces to championship replicas.`}
        actions={<div className="flex items-center gap-3"><ActionButton tone="secondary" onClick={() => setSortMode((value) => value === 'performance' ? 'price' : 'performance')}>{sortMode === 'performance' ? 'Sort By: Performance' : 'Sort By: Price'}</ActionButton><ActionButton tone="secondary" icon={<SlidersHorizontal className="h-4 w-4" />} onClick={() => setOwnedOnly((value) => !value)}>{ownedOnly ? 'Filters: Owned' : 'Filters'}</ActionButton></div>}
      />

      <div className="rounded-xl border border-scm-border bg-scm-panel/80 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {equipmentTabs.map((tab) => (
            <button key={tab.label} type="button" onClick={tab.action} className={`rounded-md border px-4 py-2 text-sm font-semibold ${tab.active ? 'border-scm-green/40 bg-scm-green/15 text-emerald-200' : 'border-scm-border bg-scm-panelSoft text-scm-textSoft hover:border-scm-green/35 hover:text-scm-text'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_360px]">
        <div className="space-y-6">
          <SectionCard title="Table Marketplace" subtitle="Higher-end practice tables improve speed, response, and preparation quality.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleTables.map((tableSetup) => {
                const selected = tableSetup.id === selectedTable.id
                const tableOwned = gameState.equipment.tablesOwned.includes(tableSetup.id)
                const tableEquipped = gameState.equipment.currentTableId === tableSetup.id

                return (
                  <div role="button" tabIndex={0} key={tableSetup.id} onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleSelectTable(tableSetup.id)
                    }
                  }} onClick={() => handleSelectTable(tableSetup.id)} className={`rounded-xl border p-4 text-left ${selected ? 'border-scm-green bg-scm-green/10' : 'border-scm-border bg-scm-panelSoft hover:border-scm-green/30'}`}>
                    <div className="flex items-start justify-between gap-3"><div><p className="text-xl font-semibold text-scm-text">{tableSetup.name}</p><p className="mt-2 text-2xl font-semibold text-scm-green">{formatMoney(tableSetup.price)}</p></div>{selected ? <StatusBadge tone="green">Selected</StatusBadge> : null}</div>
                    <div className="mt-4 space-y-3">
                      <AttributeBar label="Cloth Speed" value={tableSetup.clothSpeed} />
                      <AttributeBar label="Cushion Response" value={tableSetup.cushionResponse} />
                      <AttributeBar label="Pocket Forgiveness" value={tableSetup.pocketForgiveness} />
                      <AttributeBar label="Nap Quality" value={tableSetup.napQuality} />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Click card to open details</span>
                      <ActionButton tone={tableOwned ? 'secondary' : 'primary'} onClick={(event) => {
                        event.stopPropagation()
                        setSelectedTableId(tableSetup.id)
                        buyTableSetup(tableSetup.id)
                      }}>{tableEquipped ? 'Active' : tableOwned ? 'Activate Table' : 'Buy Table'}</ActionButton>
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionCard>
        </div>

        <div ref={detailsRef} className="space-y-6">
          <SectionCard title={selectedTable.name} subtitle="Practice setup detail and ownership status.">
            <div className="space-y-4 text-sm text-scm-textSoft">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Price</p><p className="mt-1 text-xl text-scm-green">{formatMoney(selectedTable.price)}</p></div>
                <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Tier</p><p className="mt-1 text-scm-text">{selectedTable.tier}</p></div>
                <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Current Setup</p><p className="mt-1 text-scm-text">{currentTable?.name ?? 'Empty Slot'}</p></div>
                <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Ownership Status</p><p className="mt-1 text-scm-text">{ownsSelectedTable ? 'Owned' : 'Available To Buy'}</p></div>
              </div>
              <div className="grid gap-3">
                {Object.entries(selectedTable.bonuses).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3">
                    <span className="text-scm-textSoft">{label}</span>
                    <span className="text-emerald-300">+{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Budget">
            <div className="space-y-3 text-sm text-scm-textSoft">
              <div className="flex items-center justify-between"><span>Available Cash</span><span className="text-scm-green">{formatMoney(gameState.player.cash)}</span></div>
              <div className="flex items-center justify-between"><span>Current Setup</span><span className="text-scm-text">{currentTable?.name ?? 'None active'}</span></div>
            </div>
          </SectionCard>

          <div className="space-y-3">
            <ActionButton className="w-full justify-center" onClick={() => buyTableSetup(selectedTable.id)}>{ownsSelectedTable ? 'Activate Table' : 'Buy Table'}</ActionButton>
            <ActionButton tone="secondary" className="w-full justify-center" onClick={() => navigate('/equipment/cases')}>Open Cases</ActionButton>
          </div>
        </div>
      </div>
    </div>
  )
}
