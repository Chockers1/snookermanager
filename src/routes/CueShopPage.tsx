import { useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { AttributeBar } from '../components/ui/AttributeBar'
import { DataTable, type DataTableColumn } from '../components/ui/DataTable'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SectionCard } from '../components/ui/SectionCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useGame } from '../context/GameStateContext'
import { caseCatalog, chalkCatalog, cueMarketplaceCatalog, maintenanceActionCatalog, tableSetupCatalog, tipCatalog } from '../data/catalogs'
import type { MaintenanceHistoryItem } from '../types/game'
import { formatMoney } from '../utils/formatters'

type EquipmentTab = 'cues' | 'chalk' | 'tips' | 'cases' | 'table-setup' | 'maintenance'

const historyColumns: DataTableColumn<MaintenanceHistoryItem>[] = [
  { key: 'date', header: 'Date' },
  { key: 'service', header: 'Service' },
  { key: 'cost', header: 'Cost', align: 'right', render: (row) => formatMoney(row.cost) },
  { key: 'technician', header: 'Technician' },
  { key: 'result', header: 'Result' },
]

function getActiveTab(pathname: string, hash: string): EquipmentTab {
  if (pathname === '/equipment/chalk-tips') return hash === '#tips' ? 'tips' : 'chalk'
  if (pathname === '/equipment/cases') return 'cases'
  if (pathname === '/equipment/table-setup') return 'table-setup'
  if (pathname === '/equipment/maintenance') return 'maintenance'
  return 'cues'
}

export function CueShopPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const activeTab = getActiveTab(location.pathname, location.hash)
  const { gameState, buyCue, buyChalk, buyTip, buyCase, buyTableSetup, performMaintenance } = useGame()
  const detailsRef = useRef<HTMLDivElement | null>(null)
  const [selectedCueId, setSelectedCueId] = useState(gameState.equipment.currentCueId ?? cueMarketplaceCatalog[0]?.id ?? '')
  const [selectedChalkId, setSelectedChalkId] = useState(gameState.equipment.currentChalkId ?? chalkCatalog[0]?.id ?? '')
  const [selectedTipId, setSelectedTipId] = useState(gameState.equipment.currentTipId ?? tipCatalog[0]?.id ?? '')
  const [selectedCaseId, setSelectedCaseId] = useState(gameState.equipment.currentCaseId ?? caseCatalog[0]?.id ?? '')
  const [selectedTableId, setSelectedTableId] = useState(gameState.equipment.currentTableId ?? tableSetupCatalog[0]?.id ?? '')
  const [selectedActionId, setSelectedActionId] = useState(maintenanceActionCatalog[0]?.id ?? '')
  const [sortMode, setSortMode] = useState<'price' | 'performance'>('performance')
  const [ownedOnly, setOwnedOnly] = useState(false)
  const [showFullHistory, setShowFullHistory] = useState(false)

  const currentCue = gameState.equipment.currentCueId ? cueMarketplaceCatalog.find((cue) => cue.id === gameState.equipment.currentCueId) ?? null : null
  const currentChalk = gameState.equipment.currentChalkId ? chalkCatalog.find((chalk) => chalk.id === gameState.equipment.currentChalkId) ?? null : null
  const currentTip = gameState.equipment.currentTipId ? tipCatalog.find((tip) => tip.id === gameState.equipment.currentTipId) ?? null : null
  const currentCase = gameState.equipment.currentCaseId ? caseCatalog.find((equipmentCase) => equipmentCase.id === gameState.equipment.currentCaseId) ?? null : null
  const currentTable = gameState.equipment.currentTableId ? tableSetupCatalog.find((table) => table.id === gameState.equipment.currentTableId) ?? null : null
  const currentCueState = gameState.equipment.currentCueId ? gameState.equipment.cueStates[gameState.equipment.currentCueId] : null

  const visibleCues = cueMarketplaceCatalog
    .filter((cue) => (ownedOnly ? gameState.equipment.cuesOwned.includes(cue.id) : true))
    .slice()
    .sort((left, right) => sortMode === 'price' ? left.price - right.price : (right.touch + right.spinControl + right.stability + right.durability) - (left.touch + left.spinControl + left.stability + left.durability))
  const visibleChalk = chalkCatalog
    .filter((chalk) => (ownedOnly ? gameState.equipment.chalkOwned.includes(chalk.id) : true))
    .slice()
    .sort((left, right) => sortMode === 'price' ? left.cost - right.cost : (right.grip + right.cleanContact + right.spinTransfer + right.consistency) - (left.grip + left.cleanContact + left.spinTransfer + left.consistency))
  const visibleTips = tipCatalog
    .filter((tip) => (ownedOnly ? gameState.equipment.tipsOwned.includes(tip.id) : true))
    .slice()
    .sort((left, right) => sortMode === 'price' ? left.cost - right.cost : (right.durability + right.spinControl + right.feel + right.consistency) - (left.durability + left.spinControl + left.feel + left.consistency))
  const visibleCases = caseCatalog
    .filter((equipmentCase) => (ownedOnly ? gameState.equipment.casesOwned.includes(equipmentCase.id) : true))
    .slice()
    .sort((left, right) => sortMode === 'price' ? left.price - right.price : (right.protection + right.storage + right.travelComfort + right.presentation) - (left.protection + left.storage + left.travelComfort + left.presentation))
  const visibleTables = tableSetupCatalog
    .filter((table) => (ownedOnly ? gameState.equipment.tablesOwned.includes(table.id) : true))
    .slice()
    .sort((left, right) => sortMode === 'price' ? left.monthlyRental - right.monthlyRental : (right.clothSpeed + right.cushionResponse + right.pocketForgiveness + right.napQuality) - (left.clothSpeed + left.cushionResponse + left.pocketForgiveness + left.napQuality))

  const selectedCue = visibleCues.find((cue) => cue.id === selectedCueId) ?? cueMarketplaceCatalog.find((cue) => cue.id === selectedCueId) ?? visibleCues[0] ?? cueMarketplaceCatalog[0]
  const selectedChalk = visibleChalk.find((chalk) => chalk.id === selectedChalkId) ?? chalkCatalog.find((chalk) => chalk.id === selectedChalkId) ?? visibleChalk[0] ?? chalkCatalog[0]
  const selectedTip = visibleTips.find((tip) => tip.id === selectedTipId) ?? tipCatalog.find((tip) => tip.id === selectedTipId) ?? visibleTips[0] ?? tipCatalog[0]
  const selectedCase = visibleCases.find((equipmentCase) => equipmentCase.id === selectedCaseId) ?? caseCatalog.find((equipmentCase) => equipmentCase.id === selectedCaseId) ?? visibleCases[0] ?? caseCatalog[0]
  const selectedTable = visibleTables.find((table) => table.id === selectedTableId) ?? tableSetupCatalog.find((table) => table.id === selectedTableId) ?? visibleTables[0] ?? tableSetupCatalog[0]
  const selectedAction = maintenanceActionCatalog.find((action) => action.id === selectedActionId) ?? maintenanceActionCatalog[0]

  const ownsSelectedCue = gameState.equipment.cuesOwned.includes(selectedCue.id)
  const ownsSelectedChalk = gameState.equipment.chalkOwned.includes(selectedChalk.id)
  const ownsSelectedTip = gameState.equipment.tipsOwned.includes(selectedTip.id)
  const ownsSelectedCase = gameState.equipment.casesOwned.includes(selectedCase.id)
  const ownsSelectedTable = gameState.equipment.tablesOwned.includes(selectedTable.id)

  const equippedSlots = [
    { label: 'Cue', value: currentCue?.name ?? 'Empty Slot', detail: currentCue ? 'Owned and active' : 'Buy a cue to equip one', path: '/equipment/cues' },
    { label: 'Chalk', value: currentChalk?.name ?? 'Empty Slot', detail: currentChalk ? 'Equipped' : 'Open chalk market', path: '/equipment/chalk-tips#chalk' },
    { label: 'Tip', value: currentTip?.name ?? 'Empty Slot', detail: currentTip ? 'Equipped' : 'Open tip market', path: '/equipment/chalk-tips#tips' },
    { label: 'Case', value: currentCase?.name ?? 'Empty Slot', detail: currentCase ? 'Equipped for travel' : 'Open case market', path: '/equipment/cases' },
    { label: 'Facility', value: currentTable?.name ?? 'Empty Slot', detail: currentTable ? 'Active training membership' : 'Open training facility options', path: '/equipment/table-setup' },
  ]

  const equipmentTabs = [
    { label: 'Cues', path: '/equipment/cues', active: activeTab === 'cues' },
    { label: 'Chalk', path: '/equipment/chalk-tips#chalk', active: activeTab === 'chalk' },
    { label: 'Tips', path: '/equipment/chalk-tips#tips', active: activeTab === 'tips' },
    { label: 'Cases', path: '/equipment/cases', active: activeTab === 'cases' },
    { label: 'Training Facility', path: '/equipment/table-setup', active: activeTab === 'table-setup' },
    { label: 'Maintenance', path: '/equipment/maintenance', active: activeTab === 'maintenance' },
  ]

  const setupBonuses = useMemo(
    () => [
      { label: 'Grip & Contact', value: Math.round((selectedChalk.grip + selectedChalk.cleanContact) / 20) },
      { label: 'Spin Transfer', value: Math.round((selectedChalk.spinTransfer + selectedTip.spinControl) / 20) },
      { label: 'Consistency', value: Math.round((selectedChalk.consistency + selectedTip.consistency) / 20) },
      { label: 'Miscue Reduction', value: Math.round((selectedChalk.miscueReduction + selectedTip.miscueReduction) / 20) },
      { label: 'Cue Feel', value: Math.round((selectedTip.feel + (currentCue?.touch ?? 48)) / 20) },
      { label: 'Durability', value: Math.round((selectedTip.durability + (currentCue?.durability ?? 52)) / 20) },
    ],
    [currentCue?.durability, currentCue?.touch, selectedChalk.cleanContact, selectedChalk.consistency, selectedChalk.grip, selectedChalk.miscueReduction, selectedChalk.spinTransfer, selectedTip.consistency, selectedTip.durability, selectedTip.feel, selectedTip.miscueReduction, selectedTip.spinControl],
  )

  const cueCondition = currentCue ? [
    { label: 'Overall Condition', value: currentCueState?.condition ?? currentCue.condition, description: 'General wear across the cue body and finish.' },
    { label: 'Tip Condition', value: currentCueState?.tipCondition ?? Math.max(20, currentCue.condition - 18), description: 'The tip has the biggest effect on control and spin transfer.' },
    { label: 'Shaft Straightness', value: currentCueState?.shaftStraightness ?? Math.max(45, currentCue.condition - 8), description: 'Consistency through the shaft remains important under pressure.' },
    { label: 'Familiarity', value: currentCueState?.familiarity ?? currentCue.familiarity, description: 'Match comfort with the active cue setup.' },
  ] : []
  const averageRestoration = selectedAction.restoration.reduce((sum, item) => sum + item.value, 0)
  const recommendation = cueCondition.length > 0 ? cueCondition.slice().sort((left, right) => left.value - right.value)[0] : null
  const maintenanceImpact = selectedAction.restoration.map((item) => ({ label: item.label, value: item.value }))
  const maintenanceRisk = currentCue ? [
    { label: 'Cue Reliability', value: `${Math.max(1, 100 - (currentCueState?.condition ?? currentCue.condition))}% wear`, status: (currentCueState?.condition ?? currentCue.condition) < 60 ? 'High' : 'Medium' },
    { label: 'Tip Response', value: `${Math.max(1, 100 - (currentCueState?.tipCondition ?? 70))}% wear`, status: (currentCueState?.tipCondition ?? 70) < 60 ? 'High' : 'Medium' },
    { label: 'Shaft Straightness', value: `${Math.max(1, 100 - (currentCueState?.shaftStraightness ?? 70))}% risk`, status: (currentCueState?.shaftStraightness ?? 70) < 60 ? 'High' : 'Medium' },
  ] : []

  function openDetails() {
    detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function renderCueMarket() {
    return (
      <>
        <div className="space-y-6">
          <SectionCard title="Cue Marketplace" subtitle="Selected cue mirrors the right-side detail panel.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleCues.map((cue) => {
                const selected = cue.id === selectedCue.id
                const cueOwned = gameState.equipment.cuesOwned.includes(cue.id)
                const cueEquipped = gameState.equipment.currentCueId === cue.id
                return (
                  <button type="button" key={cue.id} onClick={() => {
                    setSelectedCueId(cue.id)
                    openDetails()
                  }} className={`rounded-xl border p-4 text-left ${selected ? 'border-scm-green bg-scm-green/10' : 'border-scm-border bg-scm-panelSoft hover:border-scm-green/30'}`}>
                    <div className="flex items-start justify-between gap-3"><div><p className="text-2xl font-semibold text-scm-text">{cue.name}</p><p className="mt-2 text-2xl font-semibold text-scm-green">{formatMoney(cue.price)}</p></div>{selected ? <StatusBadge tone="green">Selected</StatusBadge> : null}</div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-scm-textSoft">
                      <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Weight</p><p className="mt-1 text-scm-text">{cue.weight}</p></div>
                      <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Balance</p><p className="mt-1 text-scm-text">{cue.balance}</p></div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <AttributeBar label="Touch" value={cue.touch} />
                      <AttributeBar label="Spin Control" value={cue.spinControl} />
                      <AttributeBar label="Stability" value={cue.stability} />
                      <AttributeBar label="Durability" value={cue.durability} />
                    </div>
                    {cue.tags ? <div className="mt-4 flex flex-wrap gap-2">{cue.tags.map((tag) => <StatusBadge key={tag} tone={tag === 'Best Value' ? 'green' : 'gold'}>{tag}</StatusBadge>)}</div> : null}
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Click card to open buy panel</span>
                      <ActionButton tone={cueOwned ? 'secondary' : 'primary'} onClick={(event) => {
                        event.stopPropagation()
                        setSelectedCueId(cue.id)
                        buyCue(cue.id)
                      }}>{cueEquipped ? 'Equipped' : cueOwned ? 'Equip Cue' : 'Buy Cue'}</ActionButton>
                    </div>
                  </button>
                )
              })}
            </div>
          </SectionCard>
        </div>

        <div ref={detailsRef} className="space-y-6">
          <SectionCard title={selectedCue.name} subtitle={selectedCue.style}>
            <div className="space-y-4 text-sm text-scm-textSoft">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Price</p><p className="mt-1 text-xl text-scm-green">{formatMoney(selectedCue.price)}</p></div>
                <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Tier</p><p className="mt-1 text-scm-text">{selectedCue.tier}</p></div>
                <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Condition</p><p className="mt-1 text-scm-text">New</p></div>
                <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Ownership Status</p><p className="mt-1 text-scm-text">{ownsSelectedCue ? 'Owned' : selectedCue.ownershipStatus}</p></div>
              </div>
              <div className="border-t border-scm-border pt-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Current Cue vs Selected Cue</p>
                <div className="mt-4 space-y-4">
                  {['Cue Ball Control', 'Touch', 'Spin Control', 'Break Building', 'Consistency', 'Miscue Reduction'].map((label) => {
                    const current = currentCue?.bonuses[label] ?? 0
                    const target = selectedCue.bonuses[label] ?? 0
                    return <div key={label} className="grid grid-cols-[110px_1fr_1fr_46px] items-center gap-3 text-sm"><span className="text-scm-textSoft">{label}</span><ProgressBar value={current} max={25} tone="blue" compact /><ProgressBar value={target} max={25} tone="green" compact /><span className="text-emerald-300">+{target - current}</span></div>
                  })}
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textSoft">Cue Familiarity</span><span className="text-scm-text">{selectedCue.familiarity}%</span></div>
                <ProgressBar value={selectedCue.familiarity} tone="amber" />
                <p className="mt-2 text-sm text-scm-gold">New cue requires adaptation time.</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Budget">
            <div className="space-y-3 text-sm text-scm-textSoft">
              <div className="flex items-center justify-between"><span>Available Cash</span><span className="text-scm-green">{formatMoney(gameState.player.cash)}</span></div>
              <div className="flex items-center justify-between"><span>Weekly Budget</span><span className="text-scm-text">{formatMoney(Math.max(300, Math.round(gameState.player.cash * 0.08)))}</span></div>
              <div className="flex items-center justify-between"><span>Equipment Spent</span><span className="text-scm-text">{formatMoney(gameState.maintenance.history.reduce((sum, item) => sum + item.cost, 0))}</span></div>
            </div>
          </SectionCard>

          <div className="space-y-3">
            <ActionButton className="w-full justify-center" onClick={() => buyCue(selectedCue.id)}>{ownsSelectedCue ? 'Equip Cue' : 'Buy Cue'}</ActionButton>
            <ActionButton tone="secondary" className="w-full justify-center" onClick={() => navigate('/training')}>Test in Practice</ActionButton>
          </div>
        </div>
      </>
    )
  }

  function renderChalkMarket() {
    return (
      <>
        <div className="space-y-6">
          <SectionCard title="Chalk Marketplace" subtitle="Buy or equip chalk directly from the card grid.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleChalk.map((chalk) => {
                const selected = chalk.id === selectedChalk.id
                const chalkOwned = gameState.equipment.chalkOwned.includes(chalk.id)
                const chalkEquipped = gameState.equipment.currentChalkId === chalk.id
                return (
                  <button type="button" key={chalk.id} onClick={() => {
                    setSelectedChalkId(chalk.id)
                    openDetails()
                  }} className={`rounded-xl border p-4 text-left ${selected ? 'border-scm-green bg-scm-green/10' : 'border-scm-border bg-scm-panelSoft hover:border-scm-green/30'}`}>
                    <div className="flex items-start justify-between gap-3"><div><p className="text-xl font-semibold text-scm-text">{chalk.name}</p><p className="mt-2 text-2xl font-semibold text-scm-green">{formatMoney(chalk.cost)}</p></div>{selected ? <StatusBadge tone="green">Selected</StatusBadge> : null}</div>
                    <div className="mt-4 space-y-3">
                      <AttributeBar label="Grip" value={chalk.grip} />
                      <AttributeBar label="Contact" value={chalk.cleanContact} />
                      <AttributeBar label="Spin Transfer" value={chalk.spinTransfer} />
                      <AttributeBar label="Consistency" value={chalk.consistency} />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Click card to open buy panel</span>
                      <ActionButton tone={chalkOwned ? 'secondary' : 'primary'} onClick={(event) => {
                        event.stopPropagation()
                        setSelectedChalkId(chalk.id)
                        buyChalk(chalk.id)
                      }}>{chalkEquipped ? 'Equipped' : chalkOwned ? 'Equip Chalk' : 'Buy Chalk'}</ActionButton>
                    </div>
                  </button>
                )
              })}
            </div>
          </SectionCard>
        </div>

        <div ref={detailsRef} className="space-y-6">
          <SectionCard title={selectedChalk.name} subtitle="Selected chalk detail.">
            <div className="space-y-3 text-sm text-scm-textSoft">
              <div className="flex items-center justify-between"><span>Price</span><span className="text-scm-green">{formatMoney(selectedChalk.cost)}</span></div>
              <div className="flex items-center justify-between"><span>Current Chalk</span><span className="text-scm-text">{currentChalk?.name ?? 'Empty Slot'}</span></div>
              <div className="flex items-center justify-between"><span>Ownership</span><span className="text-scm-text">{ownsSelectedChalk ? 'Owned' : 'Available To Buy'}</span></div>
              <div className="grid gap-3">
                {[
                  ['Grip', selectedChalk.grip],
                  ['Clean Contact', selectedChalk.cleanContact],
                  ['Spin Transfer', selectedChalk.spinTransfer],
                  ['Consistency', selectedChalk.consistency],
                  ['Miscue Reduction', selectedChalk.miscueReduction],
                  ['Kick Reduction', selectedChalk.kickReduction],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3"><span className="text-scm-textSoft">{label}</span><span className="text-scm-text">{value}</span></div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Budget">
            <div className="space-y-3 text-sm text-scm-textSoft">
              <div className="flex items-center justify-between"><span>Available Cash</span><span className="text-scm-green">{formatMoney(gameState.player.cash)}</span></div>
              <div className="flex items-center justify-between"><span>Selected Chalk</span><span className="text-scm-text">{ownsSelectedChalk ? 'Owned' : formatMoney(selectedChalk.cost)}</span></div>
            </div>
          </SectionCard>

          <div className="space-y-3">
            <ActionButton className="w-full justify-center" onClick={() => buyChalk(selectedChalk.id)}>{ownsSelectedChalk ? 'Equip Chalk' : 'Buy Chalk'}</ActionButton>
            <ActionButton tone="secondary" className="w-full justify-center" onClick={() => navigate('/equipment/chalk-tips#tips')}>Open Tips</ActionButton>
          </div>
        </div>
      </>
    )
  }

  function renderTipMarket() {
    return (
      <>
        <div className="space-y-6">
          <SectionCard title="Tip Marketplace" subtitle="Tips now buy and equip from the same hub flow.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleTips.map((tip) => {
                const selected = tip.id === selectedTip.id
                const tipOwned = gameState.equipment.tipsOwned.includes(tip.id)
                const tipEquipped = gameState.equipment.currentTipId === tip.id
                return (
                  <button type="button" key={tip.id} onClick={() => {
                    setSelectedTipId(tip.id)
                    openDetails()
                  }} className={`rounded-xl border p-4 text-left ${selected ? 'border-scm-green bg-scm-green/10' : 'border-scm-border bg-scm-panelSoft hover:border-scm-green/30'}`}>
                    <div className="flex items-start justify-between gap-3"><div><p className="text-xl font-semibold text-scm-text">{tip.name}</p><p className="mt-2 text-2xl font-semibold text-scm-green">{formatMoney(tip.cost)}</p></div>{selected ? <StatusBadge tone="green">Selected</StatusBadge> : null}</div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-scm-textSoft">
                      <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Hardness</p><p className="mt-1 text-scm-text">{tip.hardness}</p></div>
                      <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Cost Band</p><p className="mt-1 text-scm-text">{tip.cost <= 12 ? 'Entry' : tip.cost <= 24 ? 'Match' : 'Premium'}</p></div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <AttributeBar label="Durability" value={tip.durability} />
                      <AttributeBar label="Spin Control" value={tip.spinControl} />
                      <AttributeBar label="Feel" value={tip.feel} />
                      <AttributeBar label="Consistency" value={tip.consistency} />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Click card to open buy panel</span>
                      <ActionButton tone={tipOwned ? 'secondary' : 'primary'} onClick={(event) => {
                        event.stopPropagation()
                        setSelectedTipId(tip.id)
                        buyTip(tip.id)
                      }}>{tipEquipped ? 'Equipped' : tipOwned ? 'Equip Tip' : 'Buy Tip'}</ActionButton>
                    </div>
                  </button>
                )
              })}
            </div>
          </SectionCard>
        </div>

        <div ref={detailsRef} className="space-y-6">
          <SectionCard title={selectedTip.name} subtitle="Selected tip detail.">
            <div className="space-y-3 text-sm text-scm-textSoft">
              <div className="flex items-center justify-between"><span>Price</span><span className="text-scm-green">{formatMoney(selectedTip.cost)}</span></div>
              <div className="flex items-center justify-between"><span>Current Tip</span><span className="text-scm-text">{currentTip?.name ?? 'Empty Slot'}</span></div>
              <div className="flex items-center justify-between"><span>Ownership</span><span className="text-scm-text">{ownsSelectedTip ? 'Owned' : 'Available To Buy'}</span></div>
              <div className="grid gap-3">
                {[
                  ['Hardness', selectedTip.hardness],
                  ['Durability', selectedTip.durability],
                  ['Spin Control', selectedTip.spinControl],
                  ['Feel', selectedTip.feel],
                  ['Consistency', selectedTip.consistency],
                  ['Miscue Reduction', selectedTip.miscueReduction],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3"><span className="text-scm-textSoft">{label}</span><span className="text-scm-text">{value}</span></div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Setup Bonuses" subtitle="Combined bonuses from active chalk, tip, and cue.">
            <div className="space-y-3">
              {setupBonuses.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm"><span className="text-scm-textSoft">{item.label}</span><span className="text-emerald-300">+{item.value}</span></div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Budget">
            <div className="space-y-3 text-sm text-scm-textSoft">
              <div className="flex items-center justify-between"><span>Available Cash</span><span className="text-scm-green">{formatMoney(gameState.player.cash)}</span></div>
              <div className="flex items-center justify-between"><span>Selected Tip</span><span className="text-scm-text">{ownsSelectedTip ? 'Owned' : formatMoney(selectedTip.cost)}</span></div>
            </div>
          </SectionCard>

          <div className="space-y-3">
            <ActionButton className="w-full justify-center" onClick={() => buyTip(selectedTip.id)}>{ownsSelectedTip ? 'Equip Tip' : 'Buy Tip'}</ActionButton>
            <ActionButton tone="secondary" className="w-full justify-center" onClick={() => navigate('/equipment/maintenance')}>Open Maintenance</ActionButton>
          </div>
        </div>
      </>
    )
  }

  function renderCaseMarket() {
    return (
      <>
        <div className="space-y-6">
          <SectionCard title="Case Marketplace" subtitle="Choose better protection and travel storage as your career grows.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleCases.map((equipmentCase) => {
                const selected = equipmentCase.id === selectedCase.id
                const caseOwned = gameState.equipment.casesOwned.includes(equipmentCase.id)
                const caseEquipped = gameState.equipment.currentCaseId === equipmentCase.id
                return (
                  <button type="button" key={equipmentCase.id} onClick={() => {
                    setSelectedCaseId(equipmentCase.id)
                    openDetails()
                  }} className={`rounded-xl border p-4 text-left ${selected ? 'border-scm-green bg-scm-green/10' : 'border-scm-border bg-scm-panelSoft hover:border-scm-green/30'}`}>
                    <div className="flex items-start justify-between gap-3"><div><p className="text-xl font-semibold text-scm-text">{equipmentCase.name}</p><p className="mt-2 text-2xl font-semibold text-scm-green">{formatMoney(equipmentCase.price)}</p></div>{selected ? <StatusBadge tone="green">Selected</StatusBadge> : null}</div>
                    <div className="mt-4 space-y-3">
                      <AttributeBar label="Protection" value={equipmentCase.protection} />
                      <AttributeBar label="Storage" value={equipmentCase.storage} />
                      <AttributeBar label="Travel Comfort" value={equipmentCase.travelComfort} />
                      <AttributeBar label="Presentation" value={equipmentCase.presentation} />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Click card to open buy panel</span>
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
                  <div key={label} className="flex items-center justify-between rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3"><span className="text-scm-textSoft">{label}</span><span className="text-emerald-300">+{value}</span></div>
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
            <ActionButton tone="secondary" className="w-full justify-center" onClick={() => navigate('/equipment/table-setup')}>Open Training Facility</ActionButton>
          </div>
        </div>
      </>
    )
  }

  function renderTableMarket() {
    return (
      <>
        <div className="space-y-6">
          <SectionCard title="Training Facility Marketplace" subtitle="Build out your practice base with better tables, surfaces, and home-session conditions.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleTables.map((table) => {
                const selected = table.id === selectedTable.id
                const tableOwned = gameState.equipment.tablesOwned.includes(table.id)
                const tableEquipped = gameState.equipment.currentTableId === table.id
                return (
                  <button type="button" key={table.id} onClick={() => {
                    setSelectedTableId(table.id)
                    openDetails()
                  }} className={`rounded-xl border p-4 text-left ${selected ? 'border-scm-green bg-scm-green/10' : 'border-scm-border bg-scm-panelSoft hover:border-scm-green/30'}`}>
                    <div className="flex items-start justify-between gap-3"><div><p className="text-xl font-semibold text-scm-text">{table.name}</p><p className="mt-2 text-2xl font-semibold text-scm-green">{formatMoney(table.monthlyRental)}/mo</p><p className="mt-1 text-sm text-scm-textSoft">Weekly cash flow impact: -{formatMoney(Math.round(table.monthlyRental / 4))}</p></div>{selected ? <StatusBadge tone="green">Selected</StatusBadge> : null}</div>
                    <div className="mt-4 space-y-3">
                      <AttributeBar label="Cloth Speed" value={table.clothSpeed} />
                      <AttributeBar label="Cushion Response" value={table.cushionResponse} />
                      <AttributeBar label="Pocket Forgiveness" value={table.pocketForgiveness} />
                      <AttributeBar label="Nap Quality" value={table.napQuality} />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Click card to open rental panel</span>
                      <ActionButton tone={tableEquipped ? 'secondary' : 'primary'} onClick={(event) => {
                        event.stopPropagation()
                        setSelectedTableId(table.id)
                        buyTableSetup(table.id)
                      }}>{tableEquipped ? 'Active Membership' : tableOwned ? 'Set Active Membership' : currentTable ? 'Switch Membership' : 'Join Membership'}</ActionButton>
                    </div>
                  </button>
                )
              })}
            </div>
          </SectionCard>
        </div>

        <div ref={detailsRef} className="space-y-6">
          <SectionCard title={selectedTable.name} subtitle="Training facility detail and membership status.">
            <div className="space-y-4 text-sm text-scm-textSoft">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Monthly Rental</p><p className="mt-1 text-xl text-scm-green">{formatMoney(selectedTable.monthlyRental)}/mo</p></div>
                <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Tier</p><p className="mt-1 text-scm-text">{selectedTable.tier}</p></div>
                <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Current Facility</p><p className="mt-1 text-scm-text">{currentTable?.name ?? 'Empty Slot'}</p></div>
                <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Membership Status</p><p className="mt-1 text-scm-text">{ownsSelectedTable ? 'Active Membership' : currentTable ? 'Available To Switch' : 'Available To Join'}</p></div>
              </div>
              <div className="grid gap-3">
                {Object.entries(selectedTable.bonuses).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3"><span className="text-scm-textSoft">{label}</span><span className="text-emerald-300">+{value}</span></div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Budget">
            <div className="space-y-3 text-sm text-scm-textSoft">
              <div className="flex items-center justify-between"><span>Available Cash</span><span className="text-scm-green">{formatMoney(gameState.player.cash)}</span></div>
              <div className="flex items-center justify-between"><span>Current Facility</span><span className="text-scm-text">{currentTable?.name ?? 'None active'}</span></div>
              <div className="flex items-center justify-between"><span>Monthly Rental</span><span className="text-scm-text">{formatMoney(selectedTable.monthlyRental)}/month</span></div>
              <div className="flex items-center justify-between"><span>Weekly Cash Flow Impact</span><span className="text-rose-300">-{formatMoney(Math.round(selectedTable.monthlyRental / 4))}</span></div>
            </div>
          </SectionCard>

          <div className="space-y-3">
            <ActionButton className="w-full justify-center" onClick={() => buyTableSetup(selectedTable.id)}>{ownsSelectedTable ? 'Active Membership' : currentTable ? 'Switch Membership' : 'Join Membership'}</ActionButton>
            <ActionButton tone="secondary" className="w-full justify-center" onClick={() => navigate('/equipment/cases')}>Open Cases</ActionButton>
          </div>
        </div>
      </>
    )
  }

  function renderMaintenance() {
    if (!currentCue) {
      return (
        <>
          <div className="space-y-6">
            <SectionCard title="Workshop Locked" subtitle="No active cue is equipped in this career yet.">
              <p className="text-sm text-scm-textSoft">Buy and equip a cue first, then return here for servicing, tip shaping, and repair work.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <ActionButton onClick={() => navigate('/equipment/cues')}>Buy Cue</ActionButton>
                <ActionButton tone="secondary" onClick={() => navigate('/equipment/chalk-tips#tips')}>View Chalk & Tips</ActionButton>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard title="Maintenance Summary">
              <p className="text-sm text-scm-textSoft">Maintenance unlocks once a cue is equipped.</p>
            </SectionCard>
          </div>
        </>
      )
    }

    return (
      <>
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
            <SectionCard title="Current Cue Overview">
              <div className="grid gap-4 grid-cols-[140px_1fr]">
                <div className="flex h-[280px] items-center justify-center rounded-xl border border-scm-borderStrong bg-scm-panelSoft text-4xl text-scm-textMuted">Cue</div>
                <div>
                  <div className="flex items-center gap-3"><p className="text-3xl font-semibold text-scm-text">{currentCue.name}</p><span className="rounded-md bg-scm-gold/15 px-2 py-1 text-xs text-amber-100">{currentCue.tier}</span></div>
                  <div className="mt-4 grid gap-3 text-sm text-scm-textSoft">
                    <div className="flex items-center justify-between"><span>Type</span><span className="text-scm-text">{currentCue.balance}</span></div>
                    <div className="flex items-center justify-between"><span>Weight</span><span className="text-scm-text">{currentCue.weight}</span></div>
                    <div className="flex items-center justify-between"><span>Shaft</span><span className="text-scm-text">{currentCue.touch >= 80 ? 'Pro Taper' : 'Standard Taper'}</span></div>
                    <div className="flex items-center justify-between"><span>Tip</span><span className="text-scm-text">{currentTip?.name ?? 'Not equipped'}</span></div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {cueCondition.map((item) => (
                      <div key={item.label}>
                        <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textSoft">{item.label}</span><span className="text-scm-text">{item.value}%</span></div>
                        <ProgressBar value={item.value} tone={item.value >= 75 ? 'green' : item.value >= 55 ? 'amber' : 'red'} />
                        <p className="mt-1 text-xs text-scm-textMuted">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Maintenance Actions">
              <div className="space-y-3">
                {maintenanceActionCatalog.map((action) => (
                  <button type="button" key={action.id} onClick={() => setSelectedActionId(action.id)} className={`w-full rounded-xl border p-4 text-left transition ${action.id === selectedAction.id ? 'border-scm-green/45 bg-scm-green/10' : 'border-scm-border bg-scm-panelSoft hover:border-scm-green/30'}`}>
                    <div className="grid gap-4 md:grid-cols-[1.15fr_0.45fr_0.55fr_0.9fr_1fr]">
                      <div><p className="font-semibold text-scm-text">{action.action}</p><p className="mt-1 text-sm text-scm-textSoft">{action.description}</p></div>
                      <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Cost</p><p className="mt-1 text-scm-green">{formatMoney(action.cost)}</p></div>
                      <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Time</p><p className="mt-1 text-scm-text">{action.timeRequired}</p></div>
                      <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Restoration</p><div className="mt-2 space-y-2 text-sm">{action.restoration.map((item) => <div key={item.label} className="flex items-center justify-between"><span className="text-scm-textSoft">{item.label}</span><span className="text-emerald-300">+{item.value}</span></div>)}</div></div>
                      <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Risk If Ignored</p><p className="mt-1 text-sm text-amber-100">{action.riskIfIgnored}</p></div>
                    </div>
                  </button>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.85fr_0.7fr_0.9fr]">
            <SectionCard title="Attribute Impact">
              <div className="space-y-4">
                {maintenanceImpact.map((item) => (
                  <div key={item.label} className="grid grid-cols-[1fr_1fr_40px] items-center gap-3 text-sm"><span className="text-scm-textSoft">{item.label}</span><ProgressBar value={item.value * 7} tone="green" compact /><span className="text-emerald-300">+{item.value}</span></div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Risk If Maintenance Is Delayed">
              <div className="space-y-3 text-sm">
                {maintenanceRisk.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3"><span className="text-scm-textSoft">{item.label}</span><span className="text-scm-text">{item.value}</span><span className={item.status === 'High' ? 'text-rose-300' : 'text-amber-300'}>{item.status}</span></div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Maintenance History">
              <DataTable columns={historyColumns} data={showFullHistory ? gameState.maintenance.history : gameState.maintenance.history.slice(0, 5)} />
            </SectionCard>
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard title="Maintenance Summary">
            <div className="rounded-xl border border-scm-red/35 bg-scm-red/10 p-4 text-rose-100"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5" /><p>{recommendation?.label ?? 'Condition'} is now the main equipment risk in the current save.</p></div></div>
            <div className="mt-4 space-y-3 text-sm text-scm-textSoft"><div className="flex items-center justify-between"><span>Total Maintenance Cost</span><span className="text-scm-text">{formatMoney(selectedAction.cost)}</span></div><div className="flex items-center justify-between"><span>Estimated Restoration</span><span className="text-emerald-300">+{averageRestoration} Overall</span></div><div className="flex items-center justify-between"><span>Time Until Ready</span><span className="text-scm-text">{selectedAction.timeRequired}</span></div><div className="flex items-center justify-between"><span>Cash Remaining</span><span className="text-scm-green">{formatMoney(gameState.player.cash - selectedAction.cost)}</span></div></div>
          </SectionCard>

          <SectionCard title="Performance Outlook">
            <div className="flex items-center gap-4"><ShieldCheck className="h-8 w-8 text-scm-green" /><div><p className="text-2xl font-semibold text-scm-green">{(currentCueState?.condition ?? currentCue.condition) >= 75 ? 'Good' : (currentCueState?.condition ?? currentCue.condition) >= 55 ? 'Playable' : 'Risky'}</p><p className="text-sm text-scm-textSoft">Your active cue is {(currentCueState?.condition ?? currentCue.condition) >= 75 ? 'in strong condition' : 'still usable but showing wear'}.</p></div></div>
            <div className="mt-4"><ProgressBar value={currentCueState?.condition ?? currentCue.condition} tone={(currentCueState?.condition ?? currentCue.condition) >= 75 ? 'green' : (currentCueState?.condition ?? currentCue.condition) >= 55 ? 'amber' : 'red'} /></div>
          </SectionCard>

          <div className="space-y-3">
            <ActionButton className="w-full justify-center" onClick={() => performMaintenance(selectedAction.id)}>Perform Maintenance</ActionButton>
            <ActionButton tone="secondary" className="w-full justify-center" onClick={() => setShowFullHistory((value) => !value)}>{showFullHistory ? 'Collapse Service Log' : 'View Full Service Log'}</ActionButton>
            <ActionButton tone="secondary" className="w-full justify-center" onClick={() => navigate('/equipment/cues')}>Buy Backup Cue</ActionButton>
          </div>
        </div>
      </>
    )
  }

  function renderContent() {
    if (activeTab === 'chalk') return renderChalkMarket()
    if (activeTab === 'tips') return renderTipMarket()
    if (activeTab === 'cases') return renderCaseMarket()
    if (activeTab === 'table-setup') return renderTableMarket()
    if (activeTab === 'maintenance') return renderMaintenance()
    return renderCueMarket()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Equipment"
        title="Snooker Shop"
        description={`Snooker equipment marketplace and slot management for ${gameState.player.fullName}. Empty slots can be filled from the market below.`}
        actions={<div className="flex items-center gap-3"><ActionButton tone="secondary" onClick={() => setSortMode((value) => value === 'performance' ? 'price' : 'performance')}>{sortMode === 'performance' ? 'Sort By: Performance' : 'Sort By: Price'}</ActionButton><ActionButton tone="secondary" icon={<SlidersHorizontal className="h-4 w-4" />} onClick={() => setOwnedOnly((value) => !value)}>{ownedOnly ? 'Filters: Owned' : 'Filters'}</ActionButton></div>}
      />

      <div className="rounded-xl border border-scm-border bg-scm-panel/80 px-4 py-3">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {equipmentTabs.map((tab) => (
            <button key={tab.label} type="button" onClick={() => navigate(tab.path)} className={`w-full rounded-md border px-4 py-2 text-center text-sm font-semibold ${tab.active ? 'border-scm-green/40 bg-scm-green/15 text-emerald-200' : 'border-scm-border bg-scm-panelSoft text-scm-textSoft hover:border-scm-green/35 hover:text-scm-text'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <SectionCard title="Active Equipment Slots" subtitle="Equipment now opens with visible slots, similar to sponsorship and staff management.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {equippedSlots.map((slot) => (
            <button key={slot.label} type="button" onClick={() => navigate(slot.path)} className={`rounded-2xl border p-4 text-left transition hover:border-scm-green/35 hover:bg-scm-panel ${slot.value === 'Empty Slot' ? 'border-dashed border-scm-border bg-scm-panelSoft' : 'border-scm-green/30 bg-scm-green/10'}`}>
              <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{slot.label}</p>
              <p className="mt-2 text-lg font-semibold text-scm-text">{slot.value}</p>
              <p className="mt-3 text-sm text-scm-textSoft">{slot.detail}</p>
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_360px]">
        {renderContent()}
      </div>
    </div>
  )
}
