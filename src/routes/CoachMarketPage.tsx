import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { SectionCard } from '../components/ui/SectionCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useGame } from '../context/GameStateContext'
import { getCoachAvailability, getCoachContractOptions, getCoachSlotLimit } from '../utils/coachMarket'
import { formatMoney } from '../utils/formatters'

const COACH_SLOT_NAMES = ['Lead Coach', 'Specialist Coach'] as const

function getPlayerRanking(fullName: string, rankingRows: { playerName: string; ranking: number }[], fallbackRanking?: number | null) {
  return rankingRows.find((row) => row.playerName === fullName)?.ranking ?? fallbackRanking ?? 0
}

export function CoachMarketPage() {
  const { gameState, hireCoach, fireCoach, extendCoachContract, negotiateCoachContract } = useGame()
  const [sortMode, setSortMode] = useState<'overall' | 'compatibility'>('overall')
  const coachFilters = ['All', ...Array.from(new Set(gameState.coaches.map((coach) => coach.type)))] as const
  const [typeFilter, setTypeFilter] = useState<string>('All')
  const [showAffordableOnly, setShowAffordableOnly] = useState(false)
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null)
  const [selectedOfferContractLabel, setSelectedOfferContractLabel] = useState('8 Week Trial')
  const [selectedExtensionContractLabel, setSelectedExtensionContractLabel] = useState('8 Week Trial')
  const [selectedNegotiationTone, setSelectedNegotiationTone] = useState<'Conservative' | 'Balanced' | 'Ambitious'>('Balanced')

  const ranking = getPlayerRanking(gameState.player.fullName, gameState.rankings, gameState.player.amateurRanking)
  const slotLimit = getCoachSlotLimit(ranking, gameState.player.reputation)
  const totalCoachCost = gameState.coachContracts.reduce((sum, contract) => sum + contract.weeklyCost, 0)
  const openSlot = COACH_SLOT_NAMES.slice(0, slotLimit).find((slot) => !gameState.coachContracts.some((contract) => contract.slot === slot)) ?? null
  const activeCoachEntries = gameState.coachContracts.map((contract) => ({
    ...contract,
    coach: gameState.coaches.find((coach) => coach.id === contract.coachId),
  }))

  const visibleCoaches = gameState.coaches
    .filter((coach) => (typeFilter === 'All' ? true : coach.type === typeFilter))
    .filter((coach) => (showAffordableOnly ? coach.weeklyCost <= Math.max(450, gameState.player.cash / 10) : true))
    .slice()
    .sort((left, right) => {
      if (sortMode === 'compatibility') return right.compatibility - left.compatibility

      const leftOverall = left.technical + left.tactical + left.mental + left.motivation
      const rightOverall = right.technical + right.tactical + right.mental + right.motivation
      return rightOverall - leftOverall
    })

  const unlockedCoaches = visibleCoaches.filter((coach) => getCoachAvailability(coach, ranking, gameState.player.reputation).available)
  const upcomingCoaches = visibleCoaches.filter((coach) => !getCoachAvailability(coach, ranking, gameState.player.reputation).available)

  const selectedCoach = selectedCoachId
    ? gameState.coaches.find((coach) => coach.id === selectedCoachId) ?? null
    : null
  const selectedActiveContract = selectedCoachId
    ? activeCoachEntries.find((contract) => contract.coachId === selectedCoachId) ?? null
    : null
  const selectedContractOptions = selectedCoach ? getCoachContractOptions(selectedCoach) : []
  const selectedOfferContract = selectedContractOptions.find((option) => option.label === selectedOfferContractLabel) ?? selectedContractOptions[0]
  const selectedExtensionContract = selectedContractOptions.find((option) => option.label === selectedExtensionContractLabel) ?? selectedContractOptions[0]

  const marketSummary = [
    `${activeCoachEntries.length} of ${COACH_SLOT_NAMES.length} coach slots are currently filled.`,
    `${slotLimit === 2 ? 'Both' : 'Only the lead'} staff slot is unlocked at your current stage.`,
    `Weekly coaching spend is ${formatMoney(totalCoachCost)} against ${formatMoney(gameState.player.cash)} cash in hand.`,
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Staff"
        title="Coach Market"
        description="New careers start without coaches. Sign staff into up to two slots, manage contract length, and grow the team as reputation and ranking improve."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <ActionButton tone="secondary" onClick={() => setSortMode((value) => (value === 'overall' ? 'compatibility' : 'overall'))}>
              {sortMode === 'overall' ? 'Sort: Overall' : 'Sort: Compatibility'}
            </ActionButton>
            <ActionButton tone="secondary" onClick={() => setShowAffordableOnly((value) => !value)}>
              {showAffordableOnly ? 'Affordable Only' : 'Show All Budgets'}
            </ActionButton>
          </div>
        }
      />

      <SectionCard title="Active Coach Slots" subtitle="Coaches now sit on time-limited contracts and feed directly into weekly staff costs.">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_0.9fr]">
          {COACH_SLOT_NAMES.map((slotName, index) => {
            const slotContract = activeCoachEntries.find((entry) => entry.slot === slotName)
            const slotUnlocked = index < slotLimit

            const cardClassName = `rounded-2xl border p-4 text-left ${slotContract ? 'border-scm-green/35 bg-scm-green/10 transition hover:border-scm-green/60 hover:bg-scm-green/15' : slotUnlocked ? 'border-dashed border-scm-border bg-scm-panelSoft' : 'border-scm-red/25 bg-scm-red/10'}`
            const cardBody = (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{slotName}</p>
                    <p className="mt-2 text-lg font-semibold text-scm-text">{slotContract?.coach?.name ?? (slotUnlocked ? 'Open Slot' : 'Locked')}</p>
                  </div>
                  <StatusBadge tone={slotContract ? 'green' : slotUnlocked ? 'amber' : 'red'}>
                    {slotContract ? slotContract.contractLabel : slotUnlocked ? 'Available' : 'Career Locked'}
                  </StatusBadge>
                </div>
                <p className="mt-3 text-sm text-scm-textSoft">
                  {slotContract
                    ? `${slotContract.coach?.type ?? 'Coach'} support, ${slotContract.weeksRemaining} weeks remaining at ${formatMoney(slotContract.weeklyCost)} per week.`
                    : slotUnlocked
                      ? 'No coach signed. Add one from the market below.'
                      : 'Unlocks when you reach the Top 16 or 58 reputation.'}
                </p>
                {slotContract && (
                  <>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-scm-textSoft">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Length</p>
                        <p className="mt-1 text-scm-text">{slotContract.contractWeeks} weeks</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Remaining</p>
                        <p className="mt-1 text-scm-text">{slotContract.weeksRemaining} weeks</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Total Deal</p>
                        <p className="mt-1 text-scm-text">{formatMoney(slotContract.totalCost)}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-emerald-200">Click to manage contract, negotiate rate, or release staff.</p>
                  </>
                )}
              </>
            )

            return slotContract ? (
              <button
                key={slotName}
                type="button"
                className={cardClassName}
                onClick={() => {
                  setSelectedCoachId(slotContract.coachId)
                  setSelectedExtensionContractLabel('8 Week Trial')
                  setSelectedNegotiationTone('Balanced')
                }}
              >
                {cardBody}
              </button>
            ) : (
              <div key={slotName} className={cardClassName}>
                {cardBody}
              </div>
            )
          })}

          <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Staff Budget</p>
            <p className="mt-2 text-3xl font-semibold text-scm-text">{formatMoney(totalCoachCost)}</p>
            <p className="mt-1 text-sm text-scm-textSoft">per week across all coach contracts</p>
            <div className="mt-5 space-y-3 text-sm text-scm-textSoft">
              {marketSummary.map((item) => (
                <div key={item} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-scm-gold" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="rounded-xl border border-scm-border bg-scm-panel/80 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {coachFilters.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTypeFilter(tab)}
              className={`rounded-md border px-4 py-2 text-sm font-semibold ${typeFilter === tab ? 'border-scm-green/40 bg-scm-green/15 text-emerald-200' : 'border-scm-border bg-scm-panelSoft text-scm-textSoft'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <SectionCard title="Available Coaches" subtitle="Compact market view with stage gating, contract detail, and direct sign flow.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {unlockedCoaches.map((coach) => {
            const availability = getCoachAvailability(coach, ranking, gameState.player.reputation)
            const alreadySigned = gameState.coachContracts.some((contract) => contract.coachId === coach.id)
            const canHire = availability.available && !alreadySigned && Boolean(openSlot)
            const statusText = alreadySigned
              ? 'Already signed'
              : !availability.available
                ? availability.reason
                : openSlot
                  ? `Open ${openSlot}`
                  : 'All staff slots filled'

            return (
              <button
                key={coach.id}
                type="button"
                onClick={() => {
                  setSelectedCoachId(coach.id)
                  setSelectedOfferContractLabel('8 Week Trial')
                }}
                className={`rounded-2xl border p-4 text-left transition ${canHire ? 'border-scm-border bg-scm-panelSoft hover:border-scm-green/40 hover:bg-scm-panel' : alreadySigned ? 'border-scm-green/30 bg-scm-green/10' : 'border-scm-red/30 bg-scm-red/10'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-scm-text">{coach.name}</p>
                    <p className="mt-1 text-sm text-scm-textSoft">{coach.type} coach</p>
                  </div>
                  <StatusBadge tone={alreadySigned ? 'green' : canHire ? 'amber' : 'red'}>{coach.level}</StatusBadge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-scm-textSoft">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Weekly</p>
                    <p className="mt-1 text-scm-text">{formatMoney(coach.weeklyCost)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Fit</p>
                    <p className="mt-1 text-scm-text">{coach.compatibility}%</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Reputation</p>
                    <p className="mt-1 text-scm-text">{coach.reputation}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Specialism</p>
                    <p className="mt-1 text-scm-text">{coach.specialism}</p>
                  </div>
                </div>

                <p className={`mt-4 text-sm ${canHire ? 'text-scm-textSoft' : 'text-rose-100'}`}>{statusText}</p>
              </button>
            )
          })}
        </div>
      </SectionCard>

      {upcomingCoaches.length > 0 && (
        <SectionCard title="Coming Later" subtitle="Higher-tier staff unlock as your ranking and reputation improve.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {upcomingCoaches.map((coach) => {
              const availability = getCoachAvailability(coach, ranking, gameState.player.reputation)

              return (
                <div key={coach.id} className="rounded-2xl border border-scm-red/25 bg-scm-red/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-scm-text">{coach.name}</p>
                      <p className="mt-1 text-sm text-scm-textSoft">{coach.type} coach</p>
                    </div>
                    <StatusBadge tone="red">{coach.level}</StatusBadge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-scm-textSoft">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Weekly</p>
                      <p className="mt-1 text-scm-text">{formatMoney(coach.weeklyCost)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Fit</p>
                      <p className="mt-1 text-scm-text">{coach.compatibility}%</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-rose-100">{availability.reason}</p>
                </div>
              )
            })}
          </div>
        </SectionCard>
      )}

      {selectedCoach && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-4 py-6">
          <div className="w-full max-w-3xl rounded-3xl border border-scm-borderStrong bg-scm-panel p-6 shadow-2xl shadow-black/40">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{selectedActiveContract ? 'Coach Management' : 'Coach Offer'}</p>
                <h2 className="mt-2 text-3xl font-semibold text-scm-text">{selectedCoach.name}</h2>
                <p className="mt-2 text-sm text-scm-textSoft">{selectedCoach.type} coach focused on {selectedCoach.specialism.toLowerCase()}.</p>
              </div>
              <ActionButton tone="secondary" onClick={() => setSelectedCoachId(null)}>Close</ActionButton>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr]">
              <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Coach Snapshot</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-scm-textSoft">
                  <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Compatibility</p><p className="mt-1 text-scm-text">{selectedCoach.compatibility}%</p></div>
                  <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Base Weekly</p><p className="mt-1 text-scm-text">{formatMoney(selectedCoach.weeklyCost)}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Technical</p><p className="mt-1 text-scm-text">{selectedCoach.technical}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Mental</p><p className="mt-1 text-scm-text">{selectedCoach.mental}</p></div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-scm-textSoft">
                  {selectedCoach.strengths.slice(0, 2).map((item) => (
                    <div key={item} className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-scm-green" />{item}</div>
                  ))}
                </div>
              </div>

              {selectedActiveContract ? (
                <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Contract Management</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-scm-textSoft">
                    <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Slot</p><p className="mt-1 text-scm-text">{selectedActiveContract.slot}</p></div>
                    <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Current Weekly</p><p className="mt-1 text-scm-text">{formatMoney(selectedActiveContract.weeklyCost)}</p></div>
                    <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Contract Length</p><p className="mt-1 text-scm-text">{selectedActiveContract.contractWeeks} weeks</p></div>
                    <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Weeks Left</p><p className="mt-1 text-scm-text">{selectedActiveContract.weeksRemaining}</p></div>
                  </div>
                  <div className="mt-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Extend Contract</p>
                    <div className="mt-3 space-y-3">
                      {selectedContractOptions.map((option) => (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => setSelectedExtensionContractLabel(option.label)}
                          className={`w-full rounded-xl border p-4 text-left ${selectedExtensionContract?.label === option.label ? 'border-scm-green/40 bg-scm-green/10' : 'border-scm-border bg-scm-panel'}`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold text-scm-text">{option.label}</p>
                              <p className="mt-1 text-sm text-scm-textSoft">{formatMoney(option.weeklyCost)} per week</p>
                            </div>
                            <p className="text-sm text-scm-text">Add {option.label}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Negotiate Costs</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(['Conservative', 'Balanced', 'Ambitious'] as const).map((tone) => (
                        <button
                          key={tone}
                          type="button"
                          onClick={() => setSelectedNegotiationTone(tone)}
                          className={`rounded-md border px-4 py-2 text-sm font-semibold ${selectedNegotiationTone === tone ? 'border-scm-green/40 bg-scm-green/15 text-emerald-200' : 'border-scm-border bg-scm-panel text-scm-textSoft'}`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-scm-textSoft">{selectedNegotiationTone} talks try to lower the weekly rate without changing the coach slot.</p>
                  </div>
                  <div className="mt-5 rounded-xl border border-scm-border bg-scm-panel p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Latest Outcome</p>
                    <p className="mt-2 text-sm text-scm-textSoft">{gameState.lastAction}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Contract Length</p>
                  <div className="mt-4 space-y-3">
                    {selectedContractOptions.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => setSelectedOfferContractLabel(option.label)}
                        className={`w-full rounded-xl border p-4 text-left ${selectedOfferContract?.label === option.label ? 'border-scm-green/40 bg-scm-green/10' : 'border-scm-border bg-scm-panel'}`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold text-scm-text">{option.label}</p>
                            <p className="mt-1 text-sm text-scm-textSoft">{formatMoney(option.weeklyCost)} per week</p>
                          </div>
                          <p className="text-sm text-scm-text">Total {formatMoney(option.totalCost)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-scm-border bg-scm-panelSoft p-4 text-sm text-scm-textSoft">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Decision</p>
                <p className="mt-2 text-scm-text">
                  {(() => {
                    if (selectedActiveContract) return `${selectedCoach.name} is active in the ${selectedActiveContract.slot} slot. You can extend terms, negotiate cost, or release the coach.`
                    const availability = getCoachAvailability(selectedCoach, ranking, gameState.player.reputation)
                    if (gameState.coachContracts.some((contract) => contract.coachId === selectedCoach.id)) return 'This coach is already signed.'
                    if (!availability.available) return availability.reason
                    if (!openSlot) return 'All currently unlocked coach slots are full.'
                    return `${selectedCoach.name} can sign into the ${openSlot} slot immediately.`
                  })()}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to={`/staff/coaches/${selectedCoach.id}`}>
                  <ActionButton tone="secondary" className="w-full justify-center">View Profile</ActionButton>
                </Link>
                {selectedActiveContract ? (
                  <>
                    <ActionButton
                      tone="secondary"
                      className="justify-center"
                      onClick={() => {
                        negotiateCoachContract(selectedCoach.id, selectedNegotiationTone)
                      }}
                    >
                      Negotiate Costs
                    </ActionButton>
                    <ActionButton
                      tone="secondary"
                      className="justify-center"
                      onClick={() => {
                        extendCoachContract(selectedCoach.id, selectedExtensionContract?.label)
                      }}
                    >
                      Extend Contract
                    </ActionButton>
                    <ActionButton
                      className="justify-center"
                      onClick={() => {
                        fireCoach(selectedCoach.id)
                        setSelectedCoachId(null)
                      }}
                    >
                      Fire Coach
                    </ActionButton>
                  </>
                ) : (
                  <ActionButton
                    className="justify-center"
                    disabled={gameState.coachContracts.some((contract) => contract.coachId === selectedCoach.id) || !getCoachAvailability(selectedCoach, ranking, gameState.player.reputation).available || !openSlot}
                    onClick={() => {
                      hireCoach(selectedCoach.id, selectedOfferContract?.label)
                      setSelectedCoachId(null)
                    }}
                  >
                    Sign Coach
                  </ActionButton>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}