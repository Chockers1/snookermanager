import { useState } from 'react'
import { Filter, Star } from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/GameStateContext'
import { getCoachAvailability, getCoachContractOptions, getCoachSlotLimit } from '../utils/coachMarket'
import { formatMoney } from '../utils/formatters'

const COACH_SLOT_NAMES = ['Lead Coach', 'Specialist Coach'] as const

function getPlayerRanking(fullName: string, rankingRows: { playerName: string; ranking: number }[], fallbackRanking?: number | null) {
  return rankingRows.find((row) => row.playerName === fullName)?.ranking ?? fallbackRanking ?? 0
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2)
}

export function CoachMarketPage() {
  const { gameState, hireCoach, fireCoach, extendCoachContract, negotiateCoachContract } = useGame()
  const [sortMode, setSortMode] = useState<'overall' | 'compatibility'>('overall')
  const [typeFilter, setTypeFilter] = useState<string>('All')
  const [selectedCoachId, setSelectedCoachId] = useState(gameState.coaches[0]?.id ?? '')
  const [selectedContractLabel, setSelectedContractLabel] = useState('8 Week Trial')
  const [negotiationTone, setNegotiationTone] = useState<'Conservative' | 'Balanced' | 'Ambitious'>('Balanced')

  const ranking = getPlayerRanking(gameState.player.fullName, gameState.rankings, gameState.player.amateurRanking)
  const slotLimit = getCoachSlotLimit(ranking, gameState.player.reputation)
  const activeCoachEntries = gameState.coachContracts.map((contract) => ({ ...contract, coach: gameState.coaches.find((coach) => coach.id === contract.coachId) }))
  const openSlot = COACH_SLOT_NAMES.slice(0, slotLimit).find((slot) => !gameState.coachContracts.some((contract) => contract.slot === slot)) ?? null
  const totalCoachCost = gameState.coachContracts.reduce((sum, contract) => sum + contract.weeklyCost, 0)
  const filters = ['All', ...Array.from(new Set(gameState.coaches.map((coach) => coach.type)))]
  const visibleCoaches = gameState.coaches
    .filter((coach) => (typeFilter === 'All' ? true : coach.type === typeFilter))
    .slice()
    .sort((left, right) => sortMode === 'compatibility' ? right.compatibility - left.compatibility : (right.technical + right.tactical + right.mental + right.motivation) - (left.technical + left.tactical + left.mental + left.motivation))
  const selectedCoach = gameState.coaches.find((coach) => coach.id === selectedCoachId) ?? visibleCoaches[0] ?? gameState.coaches[0]
  const selectedContract = activeCoachEntries.find((contract) => contract.coachId === selectedCoach?.id) ?? null
  const selectedOptions = selectedCoach ? getCoachContractOptions(selectedCoach) : []
  const selectedOption = selectedOptions.find((option) => option.label === selectedContractLabel) ?? selectedOptions[0]
  const availability = selectedCoach ? getCoachAvailability(selectedCoach, ranking, gameState.player.reputation) : { available: false, reason: 'No coach selected' }
  const alreadySigned = Boolean(selectedContract)
  const canHire = Boolean(selectedCoach && availability.available && openSlot && !alreadySigned)
  const openSlotsCount = Math.max(0, slotLimit - activeCoachEntries.length)
  const availableCoachCount = visibleCoaches.filter((coach) => getCoachAvailability(coach, ranking, gameState.player.reputation).available).length
  const selectedCoachOverall = selectedCoach ? Math.round((selectedCoach.technical + selectedCoach.tactical + selectedCoach.mental + selectedCoach.motivation) / 4) : 0

  function handleHire() {
    if (!selectedCoach || !canHire) return
    hireCoach(selectedCoach.id, selectedOption?.label)
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-5.5rem)] min-h-0 flex-col gap-2 overflow-hidden p-1.5">
      <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface/85 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-green-400">Staff</p>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-white">Coach Market</h1>
          <p className="mt-1 truncate text-xs text-gray-400">Find staff, manage contracts, and keep weekly coaching spend under control.</p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-1 text-right text-[10px]">
          <div><p className="text-gray-500">Player Ranking</p><p className="font-semibold text-white">#{ranking || '-'}</p></div>
          <div><p className="text-gray-500">Reputation</p><p className="font-semibold text-green-400">{gameState.player.reputation}</p></div>
          <div><p className="text-gray-500">Open Slots</p><p className="font-semibold text-white">{openSlotsCount}</p></div>
          <div><p className="text-gray-500">Available Coaches</p><p className="font-semibold text-green-400">{availableCoachCount}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {COACH_SLOT_NAMES.map((slot, index) => {
          const contract = activeCoachEntries.find((entry) => entry.slot === slot)
          const unlocked = index < slotLimit

          return (
            <button
              key={slot}
              type="button"
              disabled={!contract}
              onClick={() => contract && setSelectedCoachId(contract.coachId)}
              className={`card min-h-0 p-3 text-left ${contract ? 'border-green-600/30 bg-green-600/10' : unlocked ? 'border-border border-dashed' : 'border-red-600/30 bg-red-600/10 opacity-75'}`}
            >
              <p className="metric-label">{slot}</p>
              <p className="mt-1 truncate text-lg font-semibold text-white">{contract?.coach?.name ?? (unlocked ? 'Open Slot' : 'Locked')}</p>
              <p className="mt-1 truncate text-[10px] text-gray-400">{contract ? `${contract.weeksRemaining} weeks left · ${formatMoney(contract.weeklyCost)}/wk` : unlocked ? 'Available for a new coach' : 'Unlock with ranking or reputation'}</p>
            </button>
          )
        })}
        <div className="card min-h-0 p-3">
          <p className="metric-label">Slot Capacity</p>
          <p className="mt-1 text-lg font-semibold text-white">{activeCoachEntries.length}/{slotLimit}</p>
          <p className="mt-1 truncate text-[10px] text-gray-400">{openSlot ? `${openSlot} available` : 'All staff slots filled'}</p>
        </div>
        <div className="card min-h-0 p-3">
          <p className="metric-label">Weekly Spend</p>
          <p className="mt-1 truncate text-2xl font-bold text-white">{formatMoney(totalCoachCost)}</p>
          <p className="mt-1 truncate text-[10px] text-gray-400">Across {activeCoachEntries.length} active contract{activeCoachEntries.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-12 gap-2">
        <div className="col-span-7 card min-h-0 flex h-full flex-col overflow-hidden">
          <div className="card-header">
            <div>
              <h3 className="text-sm font-semibold text-white">Coach Market</h3>
              <p className="text-[10px] text-gray-400">{visibleCoaches.length} coach{visibleCoaches.length === 1 ? '' : 'es'} visible · {availableCoachCount} available</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-white focus:border-green-500/50 focus:outline-none"
              >
                {filters.map((filter) => <option key={filter} value={filter}>{filter}</option>)}
              </select>
              <button type="button" className="btn-secondary px-3 py-1.5 text-[11px]" onClick={() => setSortMode((value) => value === 'overall' ? 'compatibility' : 'overall')}><Filter className="h-3 w-3" /> {sortMode === 'overall' ? 'Overall' : 'Fit'}</button>
            </div>
          </div>
          <div className="flex items-center justify-between border-b border-border px-3 py-2 text-[10px] text-gray-500">
            <span>{typeFilter === 'All' ? 'All coach types' : `${typeFilter} coaches`}</span>
            <span>Sorted by {sortMode === 'overall' ? 'overall rating' : 'compatibility'}</span>
          </div>
          <div className="min-h-0 overflow-auto">
            <table className="min-w-[760px] w-full text-[10px]">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr className="border-b border-border bg-surface-light/50 text-gray-500">
                  <th className="px-2.5 py-2 text-left font-medium">Name</th>
                  <th className="px-2.5 py-2 text-left font-medium">Type</th>
                  <th className="px-2.5 py-2 text-left font-medium">Level</th>
                  <th className="px-2.5 py-2 text-left font-medium">Cost</th>
                  <th className="px-2.5 py-2 text-left font-medium">Rep.</th>
                  <th className="px-2.5 py-2 text-left font-medium">Fit</th>
                  <th className="px-2.5 py-2 text-left font-medium">Tech</th>
                  <th className="px-2.5 py-2 text-left font-medium">Mental</th>
                </tr>
              </thead>
              <tbody>
                {visibleCoaches.map((coach) => {
                  const coachAvailability = getCoachAvailability(coach, ranking, gameState.player.reputation)
                  const signed = gameState.coachContracts.some((contract) => contract.coachId === coach.id)

                  return (
                    <tr
                      key={coach.id}
                      onClick={() => setSelectedCoachId(coach.id)}
                      className={`cursor-pointer border-b border-border/50 transition-colors ${selectedCoach?.id === coach.id ? 'bg-green-600/10' : 'hover:bg-surface-light/50'}`}
                    >
                      <td className="px-2.5 py-2">
                        <div className="flex items-center gap-1.5">
                          <Star className={signed ? 'h-2.5 w-2.5 fill-amber-400 text-amber-400' : 'h-2.5 w-2.5 text-gray-600'} />
                          <span className="whitespace-nowrap font-medium text-white">{coach.name}</span>
                          {!coachAvailability.available ? <span className="rounded bg-red-600/20 px-1.5 py-0.5 text-[9px] text-red-400">Locked</span> : null}
                        </div>
                      </td>
                      <td className="px-2.5 py-2 whitespace-nowrap text-gray-400">{coach.type}</td>
                      <td className="px-2.5 py-2 whitespace-nowrap text-gray-400">{coach.level}</td>
                      <td className="px-2.5 py-2 whitespace-nowrap text-white">{formatMoney(coach.weeklyCost)}</td>
                      <td className="px-2.5 py-2"><div className="w-12"><ProgressBar value={coach.reputation} compact /></div></td>
                      <td className="px-2.5 py-2 whitespace-nowrap text-green-400">{coach.compatibility}%</td>
                      <td className="px-2.5 py-2"><div className="w-12"><ProgressBar value={coach.technical} compact /></div></td>
                      <td className="px-2.5 py-2"><div className="w-12"><ProgressBar value={coach.mental} compact /></div></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {selectedCoach ? (
          <div className="col-span-5 grid min-h-0 grid-rows-[1.18fr_0.82fr] gap-2">
            <div className="card min-h-0 flex h-full flex-col overflow-hidden">
              <div className="card-header">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-light text-sm font-bold text-green-400">{initials(selectedCoach.name)}</div>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-white">{selectedCoach.name}</h3>
                    <p className="truncate text-xs text-gray-400">{selectedCoach.specialism}</p>
                  </div>
                </div>
                <span className={availability.available ? 'rounded bg-green-600/20 px-2 py-1 text-[10px] text-green-400' : 'rounded bg-red-600/20 px-2 py-1 text-[10px] text-red-400'}>{availability.available ? 'Available' : 'Locked'}</span>
              </div>
              <div className="card-body grid min-h-0 flex-1 grid-rows-[auto_auto_minmax(0,1fr)] gap-3 p-3">
                <div className="grid grid-cols-5 gap-2 text-[10px]">
                  <div className="min-w-0"><p className="text-gray-500">Specialism</p><p className="mt-1 truncate font-semibold text-green-400">{selectedCoach.specialism}</p></div>
                  <div className="min-w-0"><p className="text-gray-500">Level</p><p className="mt-1 truncate font-semibold text-white">{selectedCoach.level}</p></div>
                  <div className="min-w-0"><p className="text-gray-500">Cost</p><p className="mt-1 truncate font-semibold text-white">{formatMoney(selectedCoach.weeklyCost)}</p></div>
                  <div className="min-w-0"><p className="text-gray-500">Fit</p><p className="mt-1 truncate font-semibold text-green-400">{selectedCoach.compatibility}%</p></div>
                  <div className="min-w-0"><p className="text-gray-500">OVR</p><p className="mt-1 truncate font-semibold text-white">{selectedCoachOverall}</p></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div><div className="mb-1 flex justify-between text-[10px]"><span className="text-gray-400">Technical</span><span className="text-white">{selectedCoach.technical}</span></div><ProgressBar value={selectedCoach.technical} compact /></div>
                  <div><div className="mb-1 flex justify-between text-[10px]"><span className="text-gray-400">Tactical</span><span className="text-white">{selectedCoach.tactical}</span></div><ProgressBar value={selectedCoach.tactical} compact /></div>
                  <div><div className="mb-1 flex justify-between text-[10px]"><span className="text-gray-400">Mental</span><span className="text-white">{selectedCoach.mental}</span></div><ProgressBar value={selectedCoach.mental} compact /></div>
                  <div><div className="mb-1 flex justify-between text-[10px]"><span className="text-gray-400">Motivation</span><span className="text-white">{selectedCoach.motivation}</span></div><ProgressBar value={selectedCoach.motivation} compact /></div>
                </div>

                <div className="grid min-h-0 grid-cols-2 gap-3">
                  <div className="min-h-0 rounded-lg border border-green-600/20 bg-green-600/10 p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-green-400">Strengths</p>
                    <ul className="mt-2 space-y-1 overflow-auto pr-1 text-[10px] text-gray-300 scrollbar-thin">
                      {selectedCoach.strengths.map((strength) => <li key={strength} className="flex items-start gap-1"><span className="mt-0.5 text-green-400">+</span><span>{strength}</span></li>)}
                    </ul>
                  </div>
                  <div className="min-h-0 rounded-lg border border-red-600/20 bg-red-600/10 p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-red-400">Weaknesses</p>
                    <ul className="mt-2 space-y-1 overflow-auto pr-1 text-[10px] text-gray-300 scrollbar-thin">
                      {selectedCoach.weaknesses.map((weakness) => <li key={weakness} className="flex items-start gap-1"><span className="mt-0.5 text-red-400">-</span><span>{weakness}</span></li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="card min-h-0 flex h-full flex-col overflow-hidden">
              <div className="card-header">
                <h3 className="text-sm font-semibold text-white">Contract Desk</h3>
                <span className="text-[10px] text-gray-400">{alreadySigned ? 'Manage active deal' : 'Sign new coach'}</span>
              </div>
              <div className="card-body grid min-h-0 flex-1 grid-cols-[1.25fr_0.85fr] gap-3 p-3">
                <div className="min-h-0">
                  <div className="grid grid-cols-3 gap-2">
                    {selectedOptions.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => setSelectedContractLabel(option.label)}
                        className={`rounded border p-2 text-left text-[10px] ${selectedContractLabel === option.label ? 'border-green-600/30 bg-green-600/10' : 'border-border bg-surface-light/50'}`}
                      >
                        <p className="font-medium text-white">{option.label}</p>
                        <p className="mt-1 text-gray-400">{formatMoney(option.weeklyCost)}/wk</p>
                        <p className="mt-1 text-green-400">{formatMoney(option.totalCost)}</p>
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 rounded-lg border border-border bg-surface-light/50 p-2 text-[10px] text-gray-400">
                    <p className="font-semibold uppercase tracking-[0.16em] text-gray-500">Selected Deal</p>
                    <p className="mt-1 font-medium text-white">{selectedOption?.label ?? 'No contract selected'}</p>
                    <p className="mt-1">{selectedOption ? `${formatMoney(selectedOption.weeklyCost)}/wk · ${formatMoney(selectedOption.totalCost)} total` : availability.reason}</p>
                  </div>
                </div>

                <div className="flex min-h-0 flex-col gap-2">
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Conservative', 'Balanced', 'Ambitious'] as const).map((tone) => (
                      <button key={tone} type="button" onClick={() => setNegotiationTone(tone)} className={negotiationTone === tone ? 'rounded border border-green-600/30 bg-green-600/10 px-2 py-1 text-[10px] text-green-400' : 'rounded border border-border bg-surface-light/50 px-2 py-1 text-[10px] text-gray-400'}>{tone}</button>
                    ))}
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    {alreadySigned ? (
                      <>
                        <button type="button" className="btn-primary w-full justify-center py-2 text-xs" onClick={() => extendCoachContract(selectedCoach.id, selectedOption?.label)}>Extend</button>
                        <button type="button" className="btn-secondary w-full justify-center py-2 text-xs" onClick={() => negotiateCoachContract(selectedCoach.id, negotiationTone)}>Negotiate</button>
                        <button type="button" className="btn-secondary w-full justify-center py-2 text-xs" onClick={() => fireCoach(selectedCoach.id)}>Release</button>
                      </>
                    ) : (
                      <button type="button" className="btn-primary w-full justify-center py-2 text-xs" disabled={!canHire} onClick={handleHire}>{canHire ? `Hire ${openSlot}` : 'Unavailable'}</button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400">{alreadySigned ? `${selectedCoach.name} is already on your staff. Extend or renegotiate from here.` : canHire ? `Ready to sign into ${openSlot}.` : availability.reason}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="col-span-5 card card-body flex items-center justify-center text-sm text-gray-400">No coach selected.</div>
        )}
      </div>
    </div>
  )
}