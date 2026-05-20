import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Check, ShieldCheck, ShoppingCart, SlidersHorizontal } from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/GameStateContext'
import { caseCatalog, chalkCatalog, cueMarketplaceCatalog, maintenanceActionCatalog, tableSetupCatalog, tipCatalog } from '../data/catalogs'
import { formatMoney } from '../utils/formatters'

type EquipmentTab = 'cues' | 'chalk' | 'tips' | 'cases' | 'table-setup' | 'maintenance'

function getActiveTab(pathname: string, hash: string): EquipmentTab {
  if (pathname === '/equipment/chalk-tips') return hash === '#tips' ? 'tips' : 'chalk'
  if (pathname === '/equipment/cases') return 'cases'
  if (pathname === '/equipment/table-setup') return 'table-setup'
  if (pathname === '/equipment/maintenance') return 'maintenance'
  return 'cues'
}

function StatLine({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center gap-2"><span className="w-24 text-[10px] capitalize text-gray-400">{label}</span><div className="flex-1"><ProgressBar value={value} compact /></div><span className="w-7 text-right text-[10px] text-white">{value}</span></div>
}

export function CueShopPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const activeTab = getActiveTab(location.pathname, location.hash)
  const { gameState, buyCue, buyChalk, buyTip, buyCase, buyTableSetup, performMaintenance, updateEquipmentSetup } = useGame()
  const [selectedCueId, setSelectedCueId] = useState(gameState.equipment.currentCueId ?? cueMarketplaceCatalog[0]?.id ?? '')
  const [selectedChalkId, setSelectedChalkId] = useState(gameState.equipment.currentChalkId ?? chalkCatalog[0]?.id ?? '')
  const [selectedTipId, setSelectedTipId] = useState(gameState.equipment.currentTipId ?? tipCatalog[0]?.id ?? '')
  const [selectedCaseId, setSelectedCaseId] = useState(gameState.equipment.currentCaseId ?? caseCatalog[0]?.id ?? '')
  const [selectedTableId, setSelectedTableId] = useState(gameState.equipment.currentTableId ?? tableSetupCatalog[0]?.id ?? '')
  const [selectedActionId, setSelectedActionId] = useState(maintenanceActionCatalog[0]?.id ?? '')
  const [sortMode, setSortMode] = useState<'price' | 'performance'>('performance')
  const [ownedOnly, setOwnedOnly] = useState(false)

  const currentCue = gameState.equipment.currentCueId ? cueMarketplaceCatalog.find((cue) => cue.id === gameState.equipment.currentCueId) ?? null : null
  const currentChalk = gameState.equipment.currentChalkId ? chalkCatalog.find((chalk) => chalk.id === gameState.equipment.currentChalkId) ?? null : null
  const currentTip = gameState.equipment.currentTipId ? tipCatalog.find((tip) => tip.id === gameState.equipment.currentTipId) ?? null : null
  const currentCase = gameState.equipment.currentCaseId ? caseCatalog.find((entry) => entry.id === gameState.equipment.currentCaseId) ?? null : null
  const currentTable = gameState.equipment.currentTableId ? tableSetupCatalog.find((entry) => entry.id === gameState.equipment.currentTableId) ?? null : null
  const currentCueState = gameState.equipment.currentCueId ? gameState.equipment.cueStates[gameState.equipment.currentCueId] : null

  const visibleCues = cueMarketplaceCatalog.filter((cue) => ownedOnly ? gameState.equipment.cuesOwned.includes(cue.id) : true).slice().sort((left, right) => sortMode === 'price' ? left.price - right.price : (right.touch + right.spinControl + right.stability + right.durability) - (left.touch + left.spinControl + left.stability + left.durability))
  const visibleChalk = chalkCatalog.filter((chalk) => ownedOnly ? gameState.equipment.chalkOwned.includes(chalk.id) : true).slice().sort((left, right) => sortMode === 'price' ? left.cost - right.cost : (right.grip + right.cleanContact + right.spinTransfer + right.consistency) - (left.grip + left.cleanContact + left.spinTransfer + left.consistency))
  const visibleTips = tipCatalog.filter((tip) => ownedOnly ? gameState.equipment.tipsOwned.includes(tip.id) : true).slice().sort((left, right) => sortMode === 'price' ? left.cost - right.cost : (right.durability + right.spinControl + right.feel + right.consistency) - (left.durability + left.spinControl + left.feel + left.consistency))
  const visibleCases = caseCatalog.filter((entry) => ownedOnly ? gameState.equipment.casesOwned.includes(entry.id) : true).slice().sort((left, right) => sortMode === 'price' ? left.price - right.price : (right.protection + right.storage + right.travelComfort + right.presentation) - (left.protection + left.storage + left.travelComfort + left.presentation))
  const visibleTables = tableSetupCatalog.filter((entry) => ownedOnly ? gameState.equipment.tablesOwned.includes(entry.id) : true).slice().sort((left, right) => sortMode === 'price' ? left.monthlyRental - right.monthlyRental : (right.clothSpeed + right.cushionResponse + right.pocketForgiveness + right.napQuality) - (left.clothSpeed + left.cushionResponse + left.pocketForgiveness + left.napQuality))

  const selectedCue = cueMarketplaceCatalog.find((cue) => cue.id === selectedCueId) ?? visibleCues[0] ?? cueMarketplaceCatalog[0]
  const selectedChalk = chalkCatalog.find((chalk) => chalk.id === selectedChalkId) ?? visibleChalk[0] ?? chalkCatalog[0]
  const selectedTip = tipCatalog.find((tip) => tip.id === selectedTipId) ?? visibleTips[0] ?? tipCatalog[0]
  const selectedCase = caseCatalog.find((entry) => entry.id === selectedCaseId) ?? visibleCases[0] ?? caseCatalog[0]
  const selectedTable = tableSetupCatalog.find((entry) => entry.id === selectedTableId) ?? visibleTables[0] ?? tableSetupCatalog[0]
  const selectedAction = maintenanceActionCatalog.find((action) => action.id === selectedActionId) ?? maintenanceActionCatalog[0]

  const tabs = [
    { id: 'cues', label: 'Cues', path: '/equipment/cues' },
    { id: 'chalk', label: 'Chalk', path: '/equipment/chalk-tips#chalk' },
    { id: 'tips', label: 'Tips', path: '/equipment/chalk-tips#tips' },
    { id: 'cases', label: 'Cases', path: '/equipment/cases' },
    { id: 'table-setup', label: 'Training Facility', path: '/equipment/table-setup' },
    { id: 'maintenance', label: 'Maintenance', path: '/equipment/maintenance' },
  ] as const
  const equippedSlots = [
    ['Cue', currentCue?.name ?? 'Empty Slot'],
    ['Chalk', currentChalk?.name ?? 'Empty Slot'],
    ['Tip', currentTip?.name ?? 'Empty Slot'],
    ['Case', currentCase?.name ?? 'Empty Slot'],
    ['Facility', currentTable?.name ?? 'Empty Slot'],
  ]
  const setupBonus = Math.round(((selectedChalk.grip + selectedChalk.cleanContact + selectedTip.spinControl + selectedTip.feel + (currentCue?.touch ?? 50)) / 5) / 10)

  function renderCards() {
    if (activeTab === 'chalk') return visibleChalk.map((chalk) => {
      const owned = gameState.equipment.chalkOwned.includes(chalk.id)
      return <button key={chalk.id} type="button" onClick={() => setSelectedChalkId(chalk.id)} className={`card card-body text-left ${selectedChalk.id === chalk.id ? 'border-green-500' : 'hover:border-border-light'}`}><div className="mb-3 flex items-start justify-between"><div><h3 className="text-sm font-semibold text-white">{chalk.name}</h3><p className="mt-0.5 text-lg font-bold text-green-400">{formatMoney(chalk.cost)}</p></div>{gameState.equipment.currentChalkId === chalk.id ? <Check className="h-5 w-5 rounded-full bg-green-600 p-1 text-white" /> : null}</div><div className="space-y-1.5"><StatLine label="Grip" value={chalk.grip} /><StatLine label="Contact" value={chalk.cleanContact} /><StatLine label="Spin" value={chalk.spinTransfer} /><StatLine label="Consistency" value={chalk.consistency} /></div><div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[10px]"><span className="text-gray-400">Miscue reduction {chalk.miscueReduction}</span>{owned ? <span className="text-green-400">Owned</span> : null}</div></button>
    })
    if (activeTab === 'tips') return visibleTips.map((tip) => {
      const owned = gameState.equipment.tipsOwned.includes(tip.id)
      return <button key={tip.id} type="button" onClick={() => setSelectedTipId(tip.id)} className={`card card-body text-left ${selectedTip.id === tip.id ? 'border-green-500' : 'hover:border-border-light'}`}><div className="mb-3 flex items-start justify-between"><div><h3 className="text-sm font-semibold text-white">{tip.name}</h3><p className="mt-0.5 text-lg font-bold text-green-400">{formatMoney(tip.cost)}</p></div>{gameState.equipment.currentTipId === tip.id ? <Check className="h-5 w-5 rounded-full bg-green-600 p-1 text-white" /> : null}</div><div className="space-y-1.5"><StatLine label="Durability" value={tip.durability} /><StatLine label="Spin" value={tip.spinControl} /><StatLine label="Feel" value={tip.feel} /><StatLine label="Consistency" value={tip.consistency} /></div><div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[10px]"><span className="text-gray-400">Hardness: {tip.hardness}</span>{owned ? <span className="text-green-400">Owned</span> : null}</div></button>
    })
    if (activeTab === 'cases') return visibleCases.map((entry) => {
      const owned = gameState.equipment.casesOwned.includes(entry.id)
      return <button key={entry.id} type="button" onClick={() => setSelectedCaseId(entry.id)} className={`card card-body text-left ${selectedCase.id === entry.id ? 'border-green-500' : 'hover:border-border-light'}`}><div className="mb-3 flex items-start justify-between"><div><h3 className="text-sm font-semibold text-white">{entry.name}</h3><p className="mt-0.5 text-lg font-bold text-green-400">{formatMoney(entry.price)}</p></div>{gameState.equipment.currentCaseId === entry.id ? <Check className="h-5 w-5 rounded-full bg-green-600 p-1 text-white" /> : null}</div><div className="space-y-1.5"><StatLine label="Protection" value={entry.protection} /><StatLine label="Storage" value={entry.storage} /><StatLine label="Travel" value={entry.travelComfort} /><StatLine label="Presentation" value={entry.presentation} /></div><div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[10px]"><span className="text-gray-400">{entry.tier}</span>{owned ? <span className="text-green-400">Owned</span> : null}</div></button>
    })
    if (activeTab === 'table-setup') return visibleTables.map((table) => {
      const owned = gameState.equipment.tablesOwned.includes(table.id)
      return <button key={table.id} type="button" onClick={() => setSelectedTableId(table.id)} className={`card card-body text-left ${selectedTable.id === table.id ? 'border-green-500' : 'hover:border-border-light'}`}><div className="mb-3 flex items-start justify-between"><div><h3 className="text-sm font-semibold text-white">{table.name}</h3><p className="mt-0.5 text-lg font-bold text-green-400">{formatMoney(table.monthlyRental)}/mo</p></div>{gameState.equipment.currentTableId === table.id ? <Check className="h-5 w-5 rounded-full bg-green-600 p-1 text-white" /> : null}</div><div className="space-y-1.5"><StatLine label="Cloth" value={table.clothSpeed} /><StatLine label="Cushions" value={table.cushionResponse} /><StatLine label="Pockets" value={table.pocketForgiveness} /><StatLine label="Nap" value={table.napQuality} /></div><div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[10px]"><span className="text-gray-400">{table.tier}</span>{owned ? <span className="text-green-400">Active option</span> : null}</div></button>
    })
    if (activeTab === 'maintenance') return maintenanceActionCatalog.map((action) => <button key={action.id} type="button" onClick={() => setSelectedActionId(action.id)} className={`card card-body text-left ${selectedAction.id === action.id ? 'border-green-500' : 'hover:border-border-light'}`}><div className="mb-3 flex items-start justify-between"><div><h3 className="text-sm font-semibold text-white">{action.action}</h3><p className="mt-0.5 text-lg font-bold text-green-400">{formatMoney(action.cost)}</p></div><ShieldCheck className="h-5 w-5 text-green-400" /></div><p className="text-xs text-gray-400">{action.description}</p><div className="mt-3 grid grid-cols-3 gap-2">{action.restoration.map((item) => <div key={item.label} className="rounded bg-surface-light/50 p-2 text-center"><p className="text-[10px] text-gray-500">{item.label}</p><p className="font-bold text-green-400">+{item.value}</p></div>)}</div><p className="mt-3 text-[10px] text-amber-400">{action.riskIfIgnored}</p></button>)
    return visibleCues.map((cue) => {
      const owned = gameState.equipment.cuesOwned.includes(cue.id)
      return <button key={cue.id} type="button" onClick={() => setSelectedCueId(cue.id)} className={`card card-body text-left ${selectedCue.id === cue.id ? 'border-green-500' : 'hover:border-border-light'}`}><div className="mb-3 flex items-start justify-between"><div><h3 className="text-sm font-semibold text-white">{cue.name}</h3><div className="mt-0.5 flex items-center gap-2"><span className="text-lg font-bold text-green-400">{formatMoney(cue.price)}</span><span className="rounded bg-surface-light px-1.5 py-0.5 text-[10px] text-gray-400">{cue.tier}</span></div></div>{gameState.equipment.currentCueId === cue.id ? <Check className="h-5 w-5 rounded-full bg-green-600 p-1 text-white" /> : null}</div><div className="space-y-1.5"><StatLine label="Touch" value={cue.touch} /><StatLine label="Spin" value={cue.spinControl} /><StatLine label="Stability" value={cue.stability} /><StatLine label="Durability" value={cue.durability} /></div><div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[10px]"><span className="text-gray-400">Condition: {cue.condition}%</span>{owned ? <span className="text-green-400">Owned</span> : null}</div></button>
    })
  }

  function renderDetail() {
    if (activeTab === 'chalk') return <><h3 className="text-sm font-bold text-white">{selectedChalk.name}</h3><div className="mt-3 space-y-2 text-xs"><div className="flex justify-between"><span className="text-gray-500">Price</span><span className="font-bold text-green-400">{formatMoney(selectedChalk.cost)}</span></div><div className="flex justify-between"><span className="text-gray-500">Current Chalk</span><span className="text-white">{currentChalk?.name ?? 'Empty Slot'}</span></div></div><button type="button" className="btn-primary mt-4 w-full justify-center text-xs" onClick={() => buyChalk(selectedChalk.id)}><ShoppingCart className="h-3.5 w-3.5" /> {gameState.equipment.chalkOwned.includes(selectedChalk.id) ? 'Equip Chalk' : 'Buy Chalk'}</button></>
    if (activeTab === 'tips') return <><h3 className="text-sm font-bold text-white">{selectedTip.name}</h3><div className="mt-3 space-y-2 text-xs"><div className="flex justify-between"><span className="text-gray-500">Price</span><span className="font-bold text-green-400">{formatMoney(selectedTip.cost)}</span></div><div className="flex justify-between"><span className="text-gray-500">Hardness</span><span className="text-white">{selectedTip.hardness}</span></div></div><button type="button" className="btn-primary mt-4 w-full justify-center text-xs" onClick={() => buyTip(selectedTip.id)}><ShoppingCart className="h-3.5 w-3.5" /> {gameState.equipment.tipsOwned.includes(selectedTip.id) ? 'Equip Tip' : 'Buy Tip'}</button></>
    if (activeTab === 'cases') return <><h3 className="text-sm font-bold text-white">{selectedCase.name}</h3><div className="mt-3 space-y-2 text-xs"><div className="flex justify-between"><span className="text-gray-500">Price</span><span className="font-bold text-green-400">{formatMoney(selectedCase.price)}</span></div><div className="flex justify-between"><span className="text-gray-500">Tier</span><span className="text-white">{selectedCase.tier}</span></div></div><button type="button" className="btn-primary mt-4 w-full justify-center text-xs" onClick={() => buyCase(selectedCase.id)}><ShoppingCart className="h-3.5 w-3.5" /> {gameState.equipment.casesOwned.includes(selectedCase.id) ? 'Equip Case' : 'Buy Case'}</button></>
    if (activeTab === 'table-setup') return <><h3 className="text-sm font-bold text-white">{selectedTable.name}</h3><div className="mt-3 space-y-2 text-xs"><div className="flex justify-between"><span className="text-gray-500">Monthly</span><span className="font-bold text-green-400">{formatMoney(selectedTable.monthlyRental)}</span></div><div className="flex justify-between"><span className="text-gray-500">Tier</span><span className="text-white">{selectedTable.tier}</span></div></div><button type="button" className="btn-primary mt-4 w-full justify-center text-xs" onClick={() => buyTableSetup(selectedTable.id)}><ShoppingCart className="h-3.5 w-3.5" /> {gameState.equipment.tablesOwned.includes(selectedTable.id) ? 'Activate Membership' : 'Join Membership'}</button></>
    if (activeTab === 'maintenance') return <><h3 className="text-sm font-bold text-white">{selectedAction.action}</h3><p className="mt-2 text-xs text-gray-400">{selectedAction.description}</p><div className="mt-3 space-y-2 text-xs"><div className="flex justify-between"><span className="text-gray-500">Cost</span><span className="font-bold text-green-400">{formatMoney(selectedAction.cost)}</span></div><div className="flex justify-between"><span className="text-gray-500">Time</span><span className="text-white">{selectedAction.timeRequired}</span></div></div><button type="button" className="btn-primary mt-4 w-full justify-center text-xs" onClick={() => performMaintenance(selectedAction.id)}><ShieldCheck className="h-3.5 w-3.5" /> Perform Maintenance</button></>
    return <><h3 className="text-sm font-bold text-white">{selectedCue.name}</h3><div className="mt-3 space-y-2 text-xs"><div className="flex justify-between"><span className="text-gray-500">Price</span><span className="font-bold text-green-400">{formatMoney(selectedCue.price)}</span></div><div className="flex justify-between"><span className="text-gray-500">Tier</span><span className="text-white">{selectedCue.tier}</span></div><div className="flex justify-between"><span className="text-gray-500">Condition</span><span className="text-white">{currentCueState?.condition ?? selectedCue.condition}%</span></div><div className="flex justify-between"><span className="text-gray-500">Familiarity</span><span className="text-white">{currentCueState?.familiarity ?? selectedCue.familiarity}%</span></div></div><button type="button" className="btn-primary mt-4 w-full justify-center text-xs" onClick={() => buyCue(selectedCue.id)}><ShoppingCart className="h-3.5 w-3.5" /> {gameState.equipment.cuesOwned.includes(selectedCue.id) ? 'Equip Cue' : `Buy Cue - ${formatMoney(selectedCue.price)}`}</button></>
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase text-gray-500">Equipment</p><h1 className="mt-1 text-2xl font-bold text-white">Cue Shop</h1><p className="mt-1 text-sm text-gray-400">Equipment marketplace and current setup management.</p></div><div className="flex gap-2"><button type="button" className="btn-secondary text-xs" onClick={() => setSortMode((mode) => mode === 'price' ? 'performance' : 'price')}><SlidersHorizontal className="h-3.5 w-3.5" /> {sortMode === 'price' ? 'Sort: Price' : 'Sort: Performance'}</button><button type="button" className="btn-secondary text-xs" onClick={() => setOwnedOnly((value) => !value)}>{ownedOnly ? 'Owned Only' : 'All Items'}</button></div></div>
      <div className="flex flex-wrap gap-2">{tabs.map((tab) => <button key={tab.id} type="button" onClick={() => navigate(tab.path)} className={activeTab === tab.id ? 'tab-active text-xs' : 'tab-inactive text-xs'}>{tab.label}</button>)}</div>
      <div className="grid grid-cols-12 gap-4"><div className="col-span-8 grid grid-cols-2 gap-3">{renderCards()}</div><div className="col-span-4 space-y-4"><div className="card"><div className="card-header"><h3 className="text-sm font-semibold text-white">Selected Item</h3></div><div className="card-body">{renderDetail()}</div></div><div className="card card-body"><h3 className="mb-3 text-xs font-semibold text-white">Current Equipment Summary</h3><div className="space-y-2 text-xs">{equippedSlots.map(([label, value]) => <div key={label} className="flex justify-between"><span className="text-gray-400">{label}</span><span className="text-white">{value}</span></div>)}</div><div className="mt-3 border-t border-border pt-2"><p className="text-[10px] text-gray-500">Equipment Bonus</p><p className="text-sm font-bold text-green-400">+{setupBonus} to key attributes</p></div><button type="button" className="btn-secondary mt-3 w-full justify-center text-xs" onClick={() => updateEquipmentSetup({ chalkId: selectedChalk.id, tipId: selectedTip.id })}>Finalize Chalk/Tip Setup</button></div><div className="card overflow-hidden"><div className="card-header"><h3 className="text-sm font-semibold text-white">Maintenance History</h3></div><table className="w-full text-[10px]"><tbody>{gameState.maintenance.history.slice(0, 5).map((item) => <tr key={item.id} className="border-b border-border/50"><td className="px-3 py-2 text-gray-400">{item.date}</td><td className="px-3 py-2 text-white">{item.service}</td><td className="px-3 py-2 text-right text-green-400">{formatMoney(item.cost)}</td></tr>)}</tbody></table></div></div></div>
    </div>
  )
}