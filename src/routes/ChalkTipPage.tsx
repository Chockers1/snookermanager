import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { AttributeBar } from '../components/ui/AttributeBar'
import { SectionCard } from '../components/ui/SectionCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useGame } from '../context/useGame'
import { chalkCatalog, cueCatalog, tipCatalog } from '../data/catalogs'
import { formatMoney } from '../utils/formatters'

export function ChalkTipPage() {
  const { gameState, buyChalk, buyTip } = useGame()
  const navigate = useNavigate()
  const detailsRef = useRef<HTMLDivElement | null>(null)
  const currentChalk = gameState.equipment.currentChalkId ? chalkCatalog.find((chalk) => chalk.id === gameState.equipment.currentChalkId) ?? null : null
  const currentTip = gameState.equipment.currentTipId ? tipCatalog.find((tip) => tip.id === gameState.equipment.currentTipId) ?? null : null
  const currentCue = gameState.equipment.currentCueId ? cueCatalog.find((cue) => cue.id === gameState.equipment.currentCueId) ?? null : null
  const currentCueState = gameState.equipment.currentCueId ? gameState.equipment.cueStates[gameState.equipment.currentCueId] : null
  const [selectedChalkId, setSelectedChalkId] = useState(gameState.equipment.currentChalkId ?? chalkCatalog[0]?.id ?? '')
  const [selectedTipId, setSelectedTipId] = useState(gameState.equipment.currentTipId ?? tipCatalog[0]?.id ?? '')
  const [ownedOnly, setOwnedOnly] = useState(false)
  const selectedChalk = chalkCatalog.find((chalk) => chalk.id === selectedChalkId) ?? chalkCatalog[0]
  const selectedTip = tipCatalog.find((tip) => tip.id === selectedTipId) ?? tipCatalog[0]
  const visibleChalk = chalkCatalog.filter((chalk) => (ownedOnly ? gameState.equipment.chalkOwned.includes(chalk.id) : true))
  const visibleTips = tipCatalog.filter((tip) => (ownedOnly ? gameState.equipment.tipsOwned.includes(tip.id) : true))
  const ownsSelectedChalk = gameState.equipment.chalkOwned.includes(selectedChalk.id)
  const ownsSelectedTip = gameState.equipment.tipsOwned.includes(selectedTip.id)
  const equipmentTabs = [
    { label: 'Cues', action: () => navigate('/equipment/cues'), active: false },
    { label: 'Chalk', action: () => navigate('/equipment/chalk-tips'), active: true },
    { label: 'Tips', action: () => navigate('/equipment/chalk-tips'), active: true },
    { label: 'Cases', action: () => navigate('/equipment/cases'), active: false },
    { label: 'Table Setup', action: () => navigate('/equipment/table-setup'), active: false },
    { label: 'Maintenance', action: () => navigate('/equipment/maintenance'), active: false },
  ]

  const setupBonuses = [
      { label: 'Grip & Contact', value: Math.round((selectedChalk.grip + selectedChalk.cleanContact) / 20) },
      { label: 'Spin Transfer', value: Math.round((selectedChalk.spinTransfer + selectedTip.spinControl) / 20) },
      { label: 'Consistency', value: Math.round((selectedChalk.consistency + selectedTip.consistency) / 20) },
      { label: 'Miscue Reduction', value: Math.round((selectedChalk.miscueReduction + selectedTip.miscueReduction) / 20) },
      { label: 'Cue Feel', value: Math.round((selectedTip.feel + (currentCue?.touch ?? 48)) / 20) },
      { label: 'Durability', value: Math.round((selectedTip.durability + (currentCue?.durability ?? 52)) / 20) },
    ]

  function openDetails() {
    detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Equipment"
        title="Chalk & Tip Setup"
        description="Chalk and tips now use the same marketplace flow as cues: pick an item, inspect it, then buy or equip it directly."
        actions={<div className="flex items-center gap-3"><StatusBadge tone="gold">Maintenance Ready</StatusBadge><ActionButton tone="secondary" icon={<SlidersHorizontal className="h-4 w-4" />} onClick={() => setOwnedOnly((value) => !value)}>{ownedOnly ? 'Filters: Owned' : 'Filters'}</ActionButton></div>}
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

      <div className="grid gap-6 xl:grid-cols-[1.55fr_320px]">
        <div className="space-y-6">
          <SectionCard title="Chalk Marketplace" subtitle="Buy or equip chalk directly from the card grid.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleChalk.map((chalk) => {
                const selected = chalk.id === selectedChalk.id
                const chalkOwned = gameState.equipment.chalkOwned.includes(chalk.id)
                const chalkEquipped = gameState.equipment.currentChalkId === chalk.id
                const chalkStock = gameState.equipment.chalkStock[chalk.id] ?? 0

                return (
                  <div role="button" tabIndex={0} key={chalk.id} onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedChalkId(chalk.id)
                      openDetails()
                    }
                  }} onClick={() => {
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
                      <span className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Click card to open details</span>
                      <ActionButton tone={chalkOwned ? 'secondary' : 'primary'} onClick={(event) => {
                        event.stopPropagation()
                        setSelectedChalkId(chalk.id)
                        buyChalk(chalk.id)
                      }}>{chalkEquipped && chalkStock > 0 ? `${chalkStock} units left` : chalkOwned && chalkStock > 0 ? 'Open Stocked Unit' : 'Buy 5-Pack'}</ActionButton>
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionCard>

          <SectionCard title="Cue Tip Marketplace" subtitle="Tips follow the same buy-or-equip flow as cues and chalk.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleTips.map((tip) => {
                const selected = tip.id === selectedTip.id
                const tipOwned = gameState.equipment.tipsOwned.includes(tip.id)
                const tipEquipped = gameState.equipment.currentTipId === tip.id

                return (
                  <div role="button" tabIndex={0} key={tip.id} onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedTipId(tip.id)
                      openDetails()
                    }
                  }} onClick={() => {
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
                      <span className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Click card to open details</span>
                      <ActionButton tone={tipOwned ? 'secondary' : 'primary'} onClick={(event) => {
                        event.stopPropagation()
                        setSelectedTipId(tip.id)
                        buyTip(tip.id)
                      }}>{tipEquipped && (currentCueState?.tipCondition ?? 100) >= 90 ? 'Freshly Fitted' : tipOwned ? `Fit New Tip · ${formatMoney(tip.cost)}` : `Buy & Fit · ${formatMoney(tip.cost)}`}</ActionButton>
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionCard>
        </div>

        <div ref={detailsRef} className="space-y-6">
          <SectionCard title="Current Setup">
            <div className="space-y-4">
              {[
                ['Chalk', currentChalk?.name ?? 'Empty Slot', currentChalk ? `${gameState.equipment.chalkCondition}% · ${gameState.equipment.chalkStock[currentChalk.id] ?? 0} units` : 'Not equipped'],
                ['Cue Tip', currentTip?.name ?? 'Empty Slot', currentTip ? `${currentCueState?.tipCondition ?? 82}%` : 'Not equipped'],
                ['Cue', currentCue?.name ?? 'Empty Slot', currentCue ? `${currentCueState?.condition ?? currentCue.condition}%` : 'Buy a cue first'],
              ].map(([label, name, condition]) => (
                <div key={label} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-gold">{label}</p>
                  <p className="mt-2 font-semibold text-scm-text">{name}</p>
                  <div className="mt-3 flex items-center justify-between text-sm"><span className="text-scm-textSoft">Condition</span><span className="text-scm-text">{condition}</span></div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title={selectedChalk.name} subtitle="Selected chalk detail.">
            <div className="space-y-3 text-sm text-scm-textSoft">
              <div className="flex items-center justify-between"><span>Price</span><span className="text-scm-green">{formatMoney(selectedChalk.cost)}</span></div>
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

          <SectionCard title={selectedTip.name} subtitle="Selected tip detail.">
            <div className="space-y-3 text-sm text-scm-textSoft">
              <div className="flex items-center justify-between"><span>Price</span><span className="text-scm-green">{formatMoney(selectedTip.cost)}</span></div>
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
              <div className="flex items-center justify-between"><span>Selected Chalk</span><span className="text-scm-text">{ownsSelectedChalk ? 'Owned' : formatMoney(selectedChalk.cost)}</span></div>
              <div className="flex items-center justify-between"><span>Selected Tip</span><span className="text-scm-text">{ownsSelectedTip ? 'Owned' : formatMoney(selectedTip.cost)}</span></div>
            </div>
          </SectionCard>

          <div className="space-y-3">
            <ActionButton className="w-full justify-center" onClick={() => buyChalk(selectedChalk.id)}>{ownsSelectedChalk ? 'Equip Chalk' : 'Buy Chalk'}</ActionButton>
            <ActionButton className="w-full justify-center" onClick={() => buyTip(selectedTip.id)}>{ownsSelectedTip ? 'Equip Tip' : 'Buy Tip'}</ActionButton>
            <ActionButton tone="secondary" className="w-full justify-center" onClick={() => navigate('/equipment/maintenance')}>Open Maintenance</ActionButton>
          </div>
        </div>
      </div>
    </div>
  )
}
