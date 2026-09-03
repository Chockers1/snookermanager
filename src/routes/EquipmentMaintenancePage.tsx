import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { DataTable, type DataTableColumn } from '../components/ui/DataTable'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SectionCard } from '../components/ui/SectionCard'
import { useGame } from '../context/useGame'
import { cueMarketplaceCatalog, maintenanceActionCatalog, tipCatalog } from '../data/catalogs'
import type { MaintenanceHistoryItem } from '../types/game'
import { formatMoney } from '../utils/formatters'

const historyColumns: DataTableColumn<MaintenanceHistoryItem>[] = [
  { key: 'date', header: 'Date' },
  { key: 'service', header: 'Service' },
  { key: 'cost', header: 'Cost', align: 'right', render: (row) => formatMoney(row.cost) },
  { key: 'technician', header: 'Technician' },
  { key: 'result', header: 'Result' },
]

export function EquipmentMaintenancePage() {
  const navigate = useNavigate()
  const { gameState, performMaintenance } = useGame()
  const [selectedActionId, setSelectedActionId] = useState(maintenanceActionCatalog[0]?.id ?? '')
  const [showFullHistory, setShowFullHistory] = useState(false)
  const currentCue = gameState.equipment.currentCueId ? cueMarketplaceCatalog.find((cue) => cue.id === gameState.equipment.currentCueId) ?? null : null
  const currentCueState = gameState.equipment.currentCueId ? gameState.equipment.cueStates[gameState.equipment.currentCueId] : null
  const currentTip = gameState.equipment.currentTipId ? tipCatalog.find((tip) => tip.id === gameState.equipment.currentTipId) ?? null : null
  const selectedAction = maintenanceActionCatalog.find((action) => action.id === selectedActionId) ?? maintenanceActionCatalog[0]
  const equipmentTabs = [
    { label: 'Cues', action: () => navigate('/equipment/cues'), active: false },
    { label: 'Chalk', action: () => navigate('/equipment/chalk-tips'), active: false },
    { label: 'Tips', action: () => navigate('/equipment/chalk-tips'), active: false },
    { label: 'Cases', action: () => navigate('/equipment/cases'), active: false },
    { label: 'Table Setup', action: () => navigate('/equipment/table-setup'), active: false },
    { label: 'Maintenance', action: () => navigate('/equipment/maintenance'), active: true },
  ]

  if (!currentCue) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Equipment"
          title="Cue Maintenance"
          description={`Maintenance unlocks once ${gameState.player.fullName} has an active cue equipped.`}
          actions={<ActionButton tone="secondary" onClick={() => navigate('/equipment/cues')}>Open Cue Shop</ActionButton>}
        />

        <SectionCard title="Workshop Locked" subtitle="No active cue is equipped in this career yet.">
          <div className="mb-4 rounded-xl border border-scm-border bg-scm-panel/80 px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {equipmentTabs.map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={tab.action}
                  className={`rounded-md border px-4 py-2 text-sm font-semibold ${tab.active ? 'border-scm-green/40 bg-scm-green/15 text-emerald-200' : 'border-scm-border bg-scm-panelSoft text-scm-textSoft hover:border-scm-green/35 hover:text-scm-text'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-scm-textSoft">Buy and equip a cue first, then return here for servicing, tip shaping, and repair work.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ActionButton onClick={() => navigate('/equipment/cues')}>Buy Cue</ActionButton>
            <ActionButton tone="secondary" onClick={() => navigate('/equipment/chalk-tips')}>View Chalk & Tips</ActionButton>
          </div>
        </SectionCard>
      </div>
    )
  }
  const cueCondition = [
    { label: 'Overall Condition', value: currentCueState?.condition ?? currentCue.condition, description: 'General wear across the cue body and finish.' },
    { label: 'Tip Condition', value: currentCueState?.tipCondition ?? Math.max(20, currentCue.condition - 18), description: 'The tip has the biggest effect on control and spin transfer.' },
    { label: 'Shaft Straightness', value: currentCueState?.shaftStraightness ?? Math.max(45, currentCue.condition - 8), description: 'Consistency through the shaft remains important under pressure.' },
    { label: 'Familiarity', value: currentCueState?.familiarity ?? currentCue.familiarity, description: 'Match comfort with the active cue setup.' },
  ]
  const averageRestoration = selectedAction.restoration.reduce((sum, item) => sum + item.value, 0)
  const recommendation = cueCondition.slice().sort((left, right) => left.value - right.value)[0]
  const maintenanceImpact = selectedAction.restoration.map((item) => ({ label: item.label, value: item.value }))
  const maintenanceRisk = [
    { label: 'Cue Reliability', value: `${Math.max(1, 100 - (currentCueState?.condition ?? currentCue.condition))}% wear`, status: (currentCueState?.condition ?? currentCue.condition) < 60 ? 'High' : 'Medium' },
    { label: 'Tip Response', value: `${Math.max(1, 100 - (currentCueState?.tipCondition ?? 70))}% wear`, status: (currentCueState?.tipCondition ?? 70) < 60 ? 'High' : 'Medium' },
    { label: 'Shaft Straightness', value: `${Math.max(1, 100 - (currentCueState?.shaftStraightness ?? 70))}% risk`, status: (currentCueState?.shaftStraightness ?? 70) < 60 ? 'High' : 'Medium' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Equipment"
        title="Cue Maintenance"
        description={`Manage cue upkeep, performance condition, and repair decisions for ${gameState.player.fullName}. The active cue and available cash now reflect the current save.`}
        actions={<ActionButton tone="secondary" onClick={() => setShowFullHistory((value) => !value)}>{showFullHistory ? 'Collapse Service Log' : 'View Full Service Log'}</ActionButton>}
      />

      <div className="rounded-xl border border-scm-border bg-scm-panel/80 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {equipmentTabs.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={tab.action}
              className={`rounded-md border px-4 py-2 text-sm font-semibold ${tab.active ? 'border-scm-green/40 bg-scm-green/15 text-emerald-200' : 'border-scm-border bg-scm-panelSoft text-scm-textSoft hover:border-scm-green/35 hover:text-scm-text'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_320px]">
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
                    <div className="flex items-center justify-between"><span>Purchase Date</span><span className="text-scm-text">Current career inventory</span></div>
                    <div className="flex items-center justify-between"><span>Ownership</span><span className="text-scm-text">Owned (Primary)</span></div>
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
            <SectionCard title="Attribute Impact (If Full Service Completed)">
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
            <div className="rounded-xl border border-scm-red/35 bg-scm-red/10 p-4 text-rose-100"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5" /><p>{recommendation.label} is now the main equipment risk in the current save.</p></div></div>
            <div className="mt-4 space-y-3 text-sm text-scm-textSoft"><div className="flex items-center justify-between"><span>Total Maintenance Cost</span><span className="text-scm-text">{formatMoney(selectedAction.cost)}</span></div><div className="flex items-center justify-between"><span>Estimated Restoration</span><span className="text-emerald-300">+{averageRestoration} Overall</span></div><div className="flex items-center justify-between"><span>Time Until Ready</span><span className="text-scm-text">{selectedAction.timeRequired}</span></div><div className="flex items-center justify-between"><span>Cash Remaining</span><span className="text-scm-green">{formatMoney(gameState.player.cash - selectedAction.cost)}</span></div></div>
          </SectionCard>

          <SectionCard title="Performance Outlook">
            <div className="flex items-center gap-4"><ShieldCheck className="h-8 w-8 text-scm-green" /><div><p className="text-2xl font-semibold text-scm-green">{(currentCueState?.condition ?? currentCue.condition) >= 75 ? 'Good' : (currentCueState?.condition ?? currentCue.condition) >= 55 ? 'Playable' : 'Risky'}</p><p className="text-sm text-scm-textSoft">Your active cue is {(currentCueState?.condition ?? currentCue.condition) >= 75 ? 'in strong condition' : 'still usable but showing wear'}. Maintenance will bring further gains.</p></div></div>
            <div className="mt-4"><ProgressBar value={currentCueState?.condition ?? currentCue.condition} tone={(currentCueState?.condition ?? currentCue.condition) >= 75 ? 'green' : (currentCueState?.condition ?? currentCue.condition) >= 55 ? 'amber' : 'red'} /></div>
          </SectionCard>

          <SectionCard title="Equipment Reliability">
            <p className="text-xl font-semibold text-amber-100">{(currentCueState?.durability ?? currentCue.durability) >= 80 ? 'High' : (currentCueState?.durability ?? currentCue.durability) >= 60 ? 'Medium' : 'Low'}</p>
            <p className="mt-2 text-sm text-scm-textSoft">Durability is {(currentCueState?.durability ?? currentCue.durability) >= 80 ? 'strong' : (currentCueState?.durability ?? currentCue.durability) >= 60 ? 'moderate' : 'poor'}. Regular servicing is recommended to avoid future issues.</p>
            <div className="mt-4"><ProgressBar value={currentCueState?.durability ?? currentCue.durability} tone={(currentCueState?.durability ?? currentCue.durability) >= 80 ? 'green' : (currentCueState?.durability ?? currentCue.durability) >= 60 ? 'amber' : 'red'} /></div>
          </SectionCard>

          <SectionCard title="Recommendation">
            <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Best Next Action</p>
            <p className="mt-2 text-3xl font-semibold text-scm-green">{selectedAction.action}</p>
            <p className="mt-3 text-sm text-scm-textSoft">{selectedAction.description}</p>
            <p className="mt-4 text-sm text-scm-gold">Alternative: {recommendation.label}</p>
          </SectionCard>

          <div className="space-y-3">
            <ActionButton className="w-full justify-center" onClick={() => performMaintenance(selectedAction.id)}>Perform Maintenance</ActionButton>
            <ActionButton tone="secondary" className="w-full justify-center" onClick={() => setSelectedActionId(maintenanceActionCatalog.slice().sort((left, right) => right.restoration.reduce((sum, item) => sum + item.value, 0) - left.restoration.reduce((sum, item) => sum + item.value, 0))[0]?.id ?? selectedAction.id)}>Compare Options</ActionButton>
            <ActionButton tone="secondary" className="w-full justify-center" onClick={() => navigate('/')}>Delay Action</ActionButton>
            <ActionButton tone="secondary" className="w-full justify-center" onClick={() => navigate('/equipment/cues')}>Buy Backup Cue</ActionButton>
          </div>
        </div>
      </div>
    </div>
  )
}
