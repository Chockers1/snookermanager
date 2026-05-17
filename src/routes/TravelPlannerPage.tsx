import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BedDouble, BriefcaseBusiness, Clock3, Plane, Train } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SectionCard } from '../components/ui/SectionCard'
import { useGame } from '../context/GameStateContext'
import { hotelOptionCatalog, travelOptionCatalog } from '../data/catalogs'
import { formatMoney } from '../utils/formatters'

const iconMap = {
  Plane,
  Clock3,
  BriefcaseBusiness,
  Train,
}

function getTone(label: 'Very Low' | 'Low' | 'Medium' | 'High') {
  if (label === 'High') return 'red' as const
  if (label === 'Medium') return 'amber' as const
  return 'green' as const
}

function getStars(value: number) {
  return Array.from({ length: 5 }, (_, index) => index < value)
}

export function TravelPlannerPage() {
  const navigate = useNavigate()
  const { gameState, bookTravel } = useGame()
  const activeEvent =
    gameState.tournaments.find((item) => item.status === 'Entered') ??
    gameState.tournaments.find((item) => item.status === 'Available' || item.status === 'High Cost') ??
    gameState.tournaments[0]
  const existingBooking = activeEvent ? gameState.travel.bookings[activeEvent.id] : undefined
  const [selectedTravelId, setSelectedTravelId] = useState(existingBooking?.travelOptionId ?? travelOptionCatalog.find((option) => option.selected)?.id ?? travelOptionCatalog[0].id)
  const [selectedHotelId, setSelectedHotelId] = useState(existingBooking?.hotelOptionId ?? hotelOptionCatalog.find((option) => option.selected)?.id ?? hotelOptionCatalog[0].id)
  const selectedTravel = travelOptionCatalog.find((option) => option.id === selectedTravelId) ?? travelOptionCatalog[0]
  const selectedHotel = hotelOptionCatalog.find((option) => option.id === selectedHotelId) ?? hotelOptionCatalog[0]

  useEffect(() => {
    setSelectedTravelId(existingBooking?.travelOptionId ?? travelOptionCatalog.find((option) => option.selected)?.id ?? travelOptionCatalog[0].id)
    setSelectedHotelId(existingBooking?.hotelOptionId ?? hotelOptionCatalog.find((option) => option.selected)?.id ?? hotelOptionCatalog[0].id)
  }, [activeEvent?.id, existingBooking?.hotelOptionId, existingBooking?.travelOptionId])

  const tripBreakdown = [
    { label: 'Travel', amount: selectedTravel.cost },
    { label: 'Hotel', amount: selectedHotel.cost },
    { label: 'Local Transfers', amount: 20 },
    { label: 'Food & Incidentals', amount: 35 },
  ]
  const totalTripCost = tripBreakdown.reduce((sum, item) => sum + item.amount, 0)
  const cashRemaining = gameState.player.cash - totalTripCost

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tournaments"
        title="Travel Planner"
        description={`Build the travel and hotel package for ${activeEvent?.name ?? 'the next event'}. Lower-cost routes protect cash, but they can raise fatigue and arrival risk.`}
      />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_360px]">
        <div className="space-y-6">
          <SectionCard title="1. Travel Options" subtitle="Select the trip that best balances cost, freshness, and delay risk.">
            <div className="space-y-3">
              {travelOptionCatalog.map((option) => {
                const Icon = iconMap[option.icon]
                const selected = option.id === selectedTravel.id

                return (
                  <button type="button" key={option.id} onClick={() => setSelectedTravelId(option.id)} className={`grid w-full gap-4 rounded-2xl border p-4 text-left transition md:grid-cols-[1.4fr_0.6fr_0.8fr_0.8fr_0.7fr_0.6fr] ${selected ? 'border-emerald-500/45 bg-emerald-500/10' : 'border-scm-border bg-scm-panelSoft hover:border-emerald-500/30'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full border p-2 ${selected ? 'border-emerald-500/45 text-emerald-300' : 'border-scm-border text-scm-textMuted'}`}><Icon className="h-4 w-4" /></div>
                      <div>
                        <p className="font-semibold text-scm-text">{option.name}</p>
                        <p className="text-xs text-scm-textMuted">Arrival {option.arrivalTime}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Cost</p>
                      <p className="mt-2 text-scm-text">{formatMoney(option.cost)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Fatigue</p>
                      <p className={`mt-2 text-sm ${option.fatigueLabel === 'High' ? 'text-rose-300' : option.fatigueLabel === 'Medium' ? 'text-amber-300' : 'text-emerald-300'}`}>{option.fatigueLabel}</p>
                      <div className="mt-2"><ProgressBar value={option.fatigueValue} tone={getTone(option.fatigueLabel)} /></div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Comfort</p>
                      <div className="mt-2 flex gap-1">
                        {getStars(option.comfort).map((filled, index) => (
                          <span key={index} className={filled ? 'text-scm-gold' : 'text-scm-borderStrong'}>★</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Delay Risk</p>
                      <p className={`mt-2 text-sm ${option.delayLabel === 'High' ? 'text-rose-300' : option.delayLabel === 'Medium' ? 'text-amber-300' : 'text-emerald-300'}`}>{option.delayLabel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Chance</p>
                      <p className="mt-2 text-scm-text">{option.delayRisk}%</p>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Budget travel is workable here, but the cheaper options increase fatigue and make match-day preparation less reliable.
            </div>
          </SectionCard>

          <SectionCard title="2. Hotel Options" subtitle="Recovery quality and venue distance should support the travel choice.">
            <div className="space-y-3">
              {hotelOptionCatalog.map((option) => (
                <button type="button" key={option.id} onClick={() => setSelectedHotelId(option.id)} className={`grid w-full gap-4 rounded-2xl border p-4 text-left transition md:grid-cols-[1.25fr_0.55fr_0.8fr_0.85fr_0.9fr_0.85fr] ${option.id === selectedHotel.id ? 'border-emerald-500/45 bg-emerald-500/10' : 'border-scm-border bg-scm-panelSoft hover:border-emerald-500/30'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full border p-2 ${option.id === selectedHotel.id ? 'border-emerald-500/45 text-emerald-300' : 'border-scm-border text-scm-textMuted'}`}><BedDouble className="h-4 w-4" /></div>
                    <div>
                      <p className="font-semibold text-scm-text">{option.name}</p>
                      <p className="text-xs text-scm-textMuted">{option.distance}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Cost</p>
                    <p className="mt-2 text-scm-text">{formatMoney(option.cost)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Recovery</p>
                    <p className={`mt-2 text-sm ${option.recoveryValue >= 75 ? 'text-emerald-300' : option.recoveryValue >= 45 ? 'text-amber-300' : 'text-rose-300'}`}>{option.recoveryLabel}</p>
                    <div className="mt-2"><ProgressBar value={option.recoveryValue} tone={option.recoveryValue >= 75 ? 'green' : option.recoveryValue >= 45 ? 'amber' : 'red'} /></div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Preparation</p>
                    <p className={`mt-2 text-sm ${option.preparationValue >= 75 ? 'text-emerald-300' : option.preparationValue >= 45 ? 'text-amber-300' : 'text-rose-300'}`}>{option.preparationLabel}</p>
                    <div className="mt-2"><ProgressBar value={option.preparationValue} tone={option.preparationValue >= 75 ? 'green' : option.preparationValue >= 45 ? 'amber' : 'red'} /></div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Noise</p>
                    <p className="mt-2 text-scm-textSoft">{option.noise}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Distance</p>
                    <p className="mt-2 text-scm-textSoft">{option.distance}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-sky-500/25 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
              Better recovery and quieter rooms improve readiness, especially if travel fatigue is already trending upward.
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Event Information">
            <div className="rounded-2xl border border-scm-border bg-gradient-to-br from-scm-panelSoft to-scm-panel p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Venue</p>
              <p className="mt-2 text-2xl font-semibold text-scm-text">{activeEvent?.name ?? 'No active event'}</p>
              <p className="mt-2 text-sm text-scm-textSoft">Travel desk package · {activeEvent?.location ?? 'TBD'}</p>
              <div className="mt-5 grid gap-3 text-sm text-scm-textSoft">
                <div className="flex justify-between"><span>Dates</span><span>{activeEvent?.startDate}</span></div>
                <div className="flex justify-between"><span>Format</span><span>{activeEvent?.format}</span></div>
                <div className="flex justify-between"><span>Prize Pool</span><span>{formatMoney(activeEvent?.prizeMoney ?? 0)}</span></div>
                <div className="flex justify-between"><span>Objective</span><span className="text-emerald-300">Protect readiness and cash flow</span></div>
                <div className="flex justify-between"><span>First Match</span><span>{selectedTravel.arrivalTime}</span></div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Trip Summary" subtitle="Using the currently selected travel and hotel combination.">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Travel</p>
                <p className="mt-2 text-scm-text">{selectedTravel.name}</p>
                <p className="text-sm text-scm-textMuted">{selectedTravel.arrivalTime}</p>
              </div>
              <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Hotel</p>
                <p className="mt-2 text-scm-text">{selectedHotel.name}</p>
                <p className="text-sm text-scm-textMuted">{selectedHotel.distance}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4 text-center">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Total Trip Cost</p>
                <p className="mt-2 text-3xl font-semibold text-scm-gold">{formatMoney(totalTripCost)}</p>
              </div>
              <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4 text-center">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Cash Remaining</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-300">{formatMoney(cashRemaining)}</p>
              </div>
              <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4 text-center">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Expected Fatigue</p>
                <p className={`mt-2 text-2xl font-semibold ${selectedTravel.fatigueLabel === 'High' ? 'text-rose-300' : selectedTravel.fatigueLabel === 'Medium' ? 'text-amber-300' : 'text-emerald-300'}`}>{selectedTravel.fatigueLabel}</p>
              </div>
              <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4 text-center">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Preparation Quality</p>
                <p className={`mt-2 text-2xl font-semibold ${selectedHotel.preparationValue >= 75 ? 'text-emerald-300' : selectedHotel.preparationValue >= 45 ? 'text-amber-300' : 'text-rose-300'}`}>{selectedHotel.preparationLabel}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-2xl border border-scm-border bg-scm-panelSoft p-4 text-sm text-scm-textSoft">
              {tripBreakdown.map((item) => (
                <div key={item.label} className="flex items-center justify-between"><span>{item.label}</span><span className="text-scm-text">{formatMoney(item.amount)}</span></div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Recovery Outlook</p>
                <p className={`mt-2 text-xl font-semibold ${selectedHotel.recoveryValue >= 75 ? 'text-emerald-300' : selectedHotel.recoveryValue >= 45 ? 'text-amber-300' : 'text-rose-300'}`}>{selectedHotel.recoveryLabel}</p>
                <p className="mt-2 text-sm text-scm-textSoft">Accommodation quality and trip length suggest {selectedHotel.recoveryLabel.toLowerCase()} next-day readiness.</p>
              </div>
              <div className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Budget Impact</p>
                <p className={`mt-2 text-xl font-semibold ${cashRemaining >= 5000 ? 'text-emerald-300' : cashRemaining >= 2500 ? 'text-amber-300' : 'text-rose-300'}`}>{cashRemaining >= 5000 ? 'Low' : cashRemaining >= 2500 ? 'Medium' : 'High'}</p>
                <p className="mt-2 text-sm text-scm-textSoft">The current plan leaves {formatMoney(Math.max(0, cashRemaining))} after travel is booked.</p>
              </div>
            </div>
              {existingBooking && (
                <div className="mt-4 rounded-xl border border-scm-green/25 bg-scm-green/10 px-4 py-3 text-sm text-emerald-100">
                  Current save has a booked package worth {formatMoney(existingBooking.totalCost)} for {activeEvent?.name}.
                </div>
              )}
            <div className="mt-4 rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3 text-sm text-scm-textSoft">
              Compare mode: current choice saves {formatMoney(Math.max(0, gameState.player.cash - totalTripCost))} after booking and leaves a {selectedHotel.preparationLabel.toLowerCase()} preparation profile.
            </div>
          </SectionCard>

          <div className="grid gap-3">
              <ActionButton className="justify-center" onClick={() => activeEvent && bookTravel(activeEvent.id, selectedTravel.id, selectedHotel.id)}>Confirm Travel</ActionButton>
            <ActionButton tone="secondary" className="justify-center" onClick={() => navigate('/finance')}>Compare Options</ActionButton>
              <ActionButton tone="secondary" className="justify-center" onClick={() => {
                const autoTravel = travelOptionCatalog.slice().sort((left, right) => (left.fatigueValue + left.delayRisk * 1.2 + left.cost / 6) - (right.fatigueValue + right.delayRisk * 1.2 + right.cost / 6))[0]
                const autoHotel = hotelOptionCatalog.slice().sort((left, right) => (right.recoveryValue + right.preparationValue) - left.cost / 3 - ((left.recoveryValue + left.preparationValue) - right.cost / 3))[0]
                setSelectedTravelId(autoTravel.id)
                setSelectedHotelId(autoHotel.id)
              }}>Auto Plan</ActionButton>
          </div>
        </div>
      </div>
    </div>
  )
}