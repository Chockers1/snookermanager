import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { AttributeBar } from '../components/ui/AttributeBar'
import { SectionCard } from '../components/ui/SectionCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useGame } from '../context/GameStateContext'
import { caseCatalog } from '../data/catalogs'
import { formatMoney } from '../utils/formatters'

export function EquipmentCasesPage() {
  const navigate = useNavigate()
  const { gameState, buyCase } = useGame()
  const detailsRef = useRef<HTMLDivElement | null>(null)
  const [selectedCaseId, setSelectedCaseId] = useState(gameState.equipment.currentCaseId ?? caseCatalog[0]?.id ?? '')
  const [sortMode, setSortMode] = useState<'price' | 'performance'>('performance')
  const [ownedOnly, setOwnedOnly] = useState(false)
  const currentCase = gameState.equipment.currentCaseId ? caseCatalog.find((item) => item.id === gameState.equipment.currentCaseId) ?? null : null
  const visibleCases = caseCatalog
    .filter((item) => (ownedOnly ? gameState.equipment.casesOwned.includes(item.id) : true))
    .slice()
    .sort((left, right) => sortMode === 'price'
      ? left.price - right.price
      : (right.protection + right.storage + right.travelComfort + right.presentation) - (left.protection + left.storage + left.travelComfort + left.presentation))
  const selectedCase = visibleCases.find((item) => item.id === selectedCaseId) ?? caseCatalog.find((item) => item.id === selectedCaseId) ?? visibleCases[0] ?? caseCatalog[0]
  const ownsSelectedCase = gameState.equipment.casesOwned.includes(selectedCase.id)
  const equipmentTabs = [
    { label: 'Cues', action: () => navigate('/equipment/cues'), active: false },
    { label: 'Chalk', action: () => navigate('/equipment/chalk-tips'), active: false },
    { label: 'Tips', action: () => navigate('/equipment/chalk-tips'), active: false },
    { label: 'Cases', action: () => navigate('/equipment/cases'), active: true },
    { label: 'Table Setup', action: () => navigate('/equipment/table-setup'), active: false },
    { label: 'Maintenance', action: () => navigate('/equipment/maintenance'), active: false },
  ]

  function handleSelectCase(caseId: string) {
    setSelectedCaseId(caseId)
    detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Equipment"
        title="Case Market"
        description={`Carry protection, travel comfort, and presentation upgrades for ${gameState.player.fullName}. Cases now use the same buy-or-equip flow as cues.`}
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
          <SectionCard title="Case Marketplace" subtitle="Choose better protection and travel storage as your career grows.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleCases.map((equipmentCase) => {
                const selected = equipmentCase.id === selectedCase.id
                const caseOwned = gameState.equipment.casesOwned.includes(equipmentCase.id)
                const caseEquipped = gameState.equipment.currentCaseId === equipmentCase.id

                return (
                  <button type="button" key={equipmentCase.id} onClick={() => handleSelectCase(equipmentCase.id)} className={`rounded-xl border p-4 text-left ${selected ? 'border-scm-green bg-scm-green/10' : 'border-scm-border bg-scm-panelSoft hover:border-scm-green/30'}`}>
                    <div className="flex items-start justify-between gap-3"><div><p className="text-xl font-semibold text-scm-text">{equipmentCase.name}</p><p className="mt-2 text-2xl font-semibold text-scm-green">{formatMoney(equipmentCase.price)}</p></div>{selected ? <StatusBadge tone="green">Selected</StatusBadge> : null}</div>
                    <div className="mt-4 space-y-3">
                      <AttributeBar label="Protection" value={equipmentCase.protection} />
                      <AttributeBar label="Storage" value={equipmentCase.storage} />
                      <AttributeBar label="Travel Comfort" value={equipmentCase.travelComfort} />
                      <AttributeBar label="Presentation" value={equipmentCase.presentation} />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Click card to open details</span>
                      <ActionButton tone={caseOwned ? 'secondary' : 'primary'} onClick={(event) => {
                        event.stopPropagation()
                        setSelectedCaseId(equipmentCase.id)
                        buyCase(equipmentCase.id)
                      }}>{caseEquipped ? 'Equipped' : caseOwned ? 'Equip Case' : 'Buy Case'}</ActionButton>
                    </div>
                  </button>
                )
              })}
            </div>
          </SectionCard>
        </div>

        <div ref={detailsRef} className="space-y-6">
          <SectionCard title={selectedCase.name} subtitle="Case detail and ownership status.">
            <div className="space-y-4 text-sm text-scm-textSoft">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Price</p><p className="mt-1 text-xl text-scm-green">{formatMoney(selectedCase.price)}</p></div>
                <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Tier</p><p className="mt-1 text-scm-text">{selectedCase.tier}</p></div>
                <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Current Slot</p><p className="mt-1 text-scm-text">{currentCase?.name ?? 'Empty Slot'}</p></div>
                <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Ownership Status</p><p className="mt-1 text-scm-text">{ownsSelectedCase ? 'Owned' : 'Available To Buy'}</p></div>
              </div>
              <div className="grid gap-3">
                {Object.entries(selectedCase.bonuses).map(([label, value]) => (
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
              <div className="flex items-center justify-between"><span>Current Case</span><span className="text-scm-text">{currentCase?.name ?? 'None equipped'}</span></div>
            </div>
          </SectionCard>

          <div className="space-y-3">
            <ActionButton className="w-full justify-center" onClick={() => buyCase(selectedCase.id)}>{ownsSelectedCase ? 'Equip Case' : 'Buy Case'}</ActionButton>
            <ActionButton tone="secondary" className="w-full justify-center" onClick={() => navigate('/equipment/table-setup')}>Open Table Setup</ActionButton>
          </div>
        </div>
      </div>
    </div>
  )
}