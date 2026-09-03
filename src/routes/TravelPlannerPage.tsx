import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BedDouble, BriefcaseBusiness, Clock3, Plane, Train } from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/useGame'
import { getNextEligibleTournament } from '../hooks/useGameState'
import { hotelOptionCatalog, travelOptionCatalog } from '../data/catalogs'
import { formatMoney } from '../utils/formatters'

const iconMap = {
  Plane,
  Clock3,
  BriefcaseBusiness,
  Train,
}

function fatigueTone(label: 'Very Low' | 'Low' | 'Medium' | 'High') {
  if (label === 'High') return 'red' as const
  if (label === 'Medium') return 'amber' as const
  return 'green' as const
}

function moneyHealth(value: number) {
  if (value >= 5000) return 'text-green-400'
  if (value >= 2500) return 'text-amber-400'
  return 'text-red-400'
}

export function TravelPlannerPage() {
  const { gameState } = useGame()
  const activeEvent = getNextEligibleTournament(gameState)
  const existingBooking = activeEvent ? gameState.travel.bookings[activeEvent.id] : undefined
  return <TravelPlannerContent key={`${activeEvent?.id ?? 'none'}-${existingBooking?.travelOptionId ?? 'none'}-${existingBooking?.hotelOptionId ?? 'none'}`} />
}

function formatArrivalTime(eventStartDate: string | undefined, catalogArrivalTime: string) {
  if (!eventStartDate) return catalogArrivalTime
  const arrivalDate = new Date(`${eventStartDate}T12:00:00`)
  if (Number.isNaN(arrivalDate.getTime())) return catalogArrivalTime
  arrivalDate.setDate(arrivalDate.getDate() - 1)
  const dateLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(arrivalDate)
  const timeLabel = catalogArrivalTime.split('•')[1]?.trim() ?? '12:00'
  return `${dateLabel} • ${timeLabel}`
}

function TravelPlannerContent() {
  const navigate = useNavigate()
  const { gameState, bookTravel } = useGame()
  const activeEvent = getNextEligibleTournament(gameState)
  const existingBooking = activeEvent ? gameState.travel.bookings[activeEvent.id] : undefined
  const [selectedTravelId, setSelectedTravelId] = useState(existingBooking?.travelOptionId ?? travelOptionCatalog.find((option) => option.selected)?.id ?? travelOptionCatalog[0].id)
  const [selectedHotelId, setSelectedHotelId] = useState(existingBooking?.hotelOptionId ?? hotelOptionCatalog.find((option) => option.selected)?.id ?? hotelOptionCatalog[0].id)
  const selectedTravel = travelOptionCatalog.find((option) => option.id === selectedTravelId) ?? travelOptionCatalog[0]
  const selectedHotel = hotelOptionCatalog.find((option) => option.id === selectedHotelId) ?? hotelOptionCatalog[0]

  const tripBreakdown = [
    { label: 'Travel', amount: selectedTravel.cost },
    { label: 'Hotel', amount: selectedHotel.cost },
    { label: 'Local Transfers', amount: 20 },
    { label: 'Food & Incidentals', amount: 35 },
  ]
  const totalTripCost = tripBreakdown.reduce((sum, item) => sum + item.amount, 0)
  const cashRemaining = gameState.player.cash - totalTripCost
  const readinessScore = Math.max(0, Math.min(100, Math.round(((100 - selectedTravel.fatigueValue) + selectedHotel.recoveryValue + selectedHotel.preparationValue + (100 - selectedTravel.delayRisk)) / 4)))

  const autoPlan = () => {
    const autoTravel = travelOptionCatalog.slice().sort((left, right) => (left.fatigueValue + left.delayRisk * 1.2 + left.cost / 6) - (right.fatigueValue + right.delayRisk * 1.2 + right.cost / 6))[0]
    const autoHotel = hotelOptionCatalog.slice().sort((left, right) => ((right.recoveryValue + right.preparationValue) - right.cost / 3) - ((left.recoveryValue + left.preparationValue) - left.cost / 3))[0]
    setSelectedTravelId(autoTravel.id)
    setSelectedHotelId(autoHotel.id)
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase text-gray-500">Tournaments</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Travel Planner</h1>
          <p className="mt-1 text-sm text-gray-400">Build the travel and hotel package for {activeEvent?.name ?? 'the next event'}.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary text-xs" onClick={autoPlan}>Auto Plan</button>
          <button type="button" className="btn-secondary text-xs" onClick={() => navigate('/finance')}>Finance</button>
          <button type="button" className="btn-primary text-xs" onClick={() => activeEvent && bookTravel(activeEvent.id, selectedTravel.id, selectedHotel.id)}>Confirm Travel</button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Event', value: activeEvent?.name ?? 'None', sub: activeEvent?.location ?? 'TBD' },
          { label: 'Readiness', value: `${readinessScore}%`, sub: 'Travel profile' },
          { label: 'Trip Cost', value: formatMoney(totalTripCost), sub: 'Selected package' },
          { label: 'Cash Left', value: formatMoney(cashRemaining), sub: 'After booking' },
          { label: 'Fatigue', value: selectedTravel.fatigueLabel, sub: `${selectedTravel.fatigueValue}% trip load` },
          { label: 'Preparation', value: selectedHotel.preparationLabel, sub: `${selectedHotel.preparationValue}% hotel prep` },
        ].map((metric) => (
          <div key={metric.label} className="card card-body text-center">
            <p className="metric-label">{metric.label}</p>
            <p className={`mt-1 truncate text-lg font-bold ${metric.label === 'Cash Left' ? moneyHealth(cashRemaining) : 'text-white'}`}>{metric.value}</p>
            <p className="truncate text-[10px] text-gray-400">{metric.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 space-y-4">
          <div className="card">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Travel Options</h3><span className="text-[10px] text-gray-400">Cost, fatigue, delay risk</span></div>
            <div className="card-body space-y-2">
              {travelOptionCatalog.map((option) => {
                const Icon = iconMap[option.icon]
                const selected = option.id === selectedTravel.id
                return (
                  <button key={option.id} type="button" onClick={() => setSelectedTravelId(option.id)} className={`grid w-full grid-cols-[1.3fr_0.55fr_0.85fr_0.7fr_0.7fr] items-center gap-3 rounded-lg border p-3 text-left transition ${selected ? 'border-green-600/30 bg-green-600/10' : 'border-transparent bg-surface-light/50 hover:bg-surface-light'}`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`rounded-lg border p-2 ${selected ? 'border-green-600/40 text-green-400' : 'border-border text-gray-500'}`}><Icon className="h-4 w-4" /></div>
                      <div className="min-w-0"><p className="truncate text-sm font-medium text-white">{option.name}</p><p className="text-[10px] text-gray-400">Arrival {formatArrivalTime(activeEvent?.startDate, option.arrivalTime)}</p></div>
                    </div>
                    <div><p className="text-[9px] text-gray-500">Cost</p><p className="text-xs text-white">{formatMoney(option.cost)}</p></div>
                    <div><p className="text-[9px] text-gray-500">Fatigue</p><p className={option.fatigueLabel === 'High' ? 'text-xs text-red-400' : option.fatigueLabel === 'Medium' ? 'text-xs text-amber-400' : 'text-xs text-green-400'}>{option.fatigueLabel}</p><ProgressBar value={option.fatigueValue} tone={fatigueTone(option.fatigueLabel)} compact /></div>
                    <div><p className="text-[9px] text-gray-500">Comfort</p><p className="text-xs text-white">{option.comfort}/5</p></div>
                    <div className="text-right"><p className="text-[9px] text-gray-500">Delay</p><p className="text-xs text-white">{option.delayRisk}%</p></div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Hotel Options</h3><span className="text-[10px] text-gray-400">Recovery and preparation</span></div>
            <div className="card-body space-y-2">
              {hotelOptionCatalog.map((option) => {
                const selected = option.id === selectedHotel.id
                return (
                  <button key={option.id} type="button" onClick={() => setSelectedHotelId(option.id)} className={`grid w-full grid-cols-[1.3fr_0.55fr_0.85fr_0.85fr_0.8fr] items-center gap-3 rounded-lg border p-3 text-left transition ${selected ? 'border-green-600/30 bg-green-600/10' : 'border-transparent bg-surface-light/50 hover:bg-surface-light'}`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`rounded-lg border p-2 ${selected ? 'border-green-600/40 text-green-400' : 'border-border text-gray-500'}`}><BedDouble className="h-4 w-4" /></div>
                      <div className="min-w-0"><p className="truncate text-sm font-medium text-white">{option.name}</p><p className="text-[10px] text-gray-400">{option.distance}</p></div>
                    </div>
                    <div><p className="text-[9px] text-gray-500">Cost</p><p className="text-xs text-white">{formatMoney(option.cost)}</p></div>
                    <div><p className="text-[9px] text-gray-500">Recovery</p><p className={option.recoveryValue >= 75 ? 'text-xs text-green-400' : option.recoveryValue >= 45 ? 'text-xs text-amber-400' : 'text-xs text-red-400'}>{option.recoveryLabel}</p><ProgressBar value={option.recoveryValue} tone={option.recoveryValue >= 75 ? 'green' : option.recoveryValue >= 45 ? 'amber' : 'red'} compact /></div>
                    <div><p className="text-[9px] text-gray-500">Prep</p><p className={option.preparationValue >= 75 ? 'text-xs text-green-400' : option.preparationValue >= 45 ? 'text-xs text-amber-400' : 'text-xs text-red-400'}>{option.preparationLabel}</p><ProgressBar value={option.preparationValue} tone={option.preparationValue >= 75 ? 'green' : option.preparationValue >= 45 ? 'amber' : 'red'} compact /></div>
                    <div className="text-right"><p className="text-[9px] text-gray-500">Noise</p><p className="text-xs text-white">{option.noise}</p></div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-4">
          <div className="card overflow-hidden border-green-600/30">
            <div className="bg-gradient-to-r from-green-600/10 via-transparent to-transparent p-5">
              <p className="text-[10px] font-semibold uppercase text-green-400">Event Information</p>
              <h2 className="mt-1 text-xl font-bold text-white">{activeEvent?.name ?? 'No active event'}</h2>
              <p className="mt-1 text-xs text-gray-400">{activeEvent?.location ?? 'TBD'} - {activeEvent?.startDate ?? gameState.currentDate}</p>
            </div>
          </div>

          <div className="card card-body">
            <h3 className="mb-3 text-xs font-semibold text-white">Trip Summary</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded bg-surface-light/50 p-3"><p className="text-[10px] text-gray-500">Travel</p><p className="truncate text-xs text-white">{selectedTravel.name}</p></div>
              <div className="rounded bg-surface-light/50 p-3"><p className="text-[10px] text-gray-500">Hotel</p><p className="truncate text-xs text-white">{selectedHotel.name}</p></div>
              <div className="rounded bg-surface-light/50 p-3"><p className="text-[10px] text-gray-500">Fatigue</p><p className="text-xs text-amber-400">{selectedTravel.fatigueLabel}</p></div>
              <div className="rounded bg-surface-light/50 p-3"><p className="text-[10px] text-gray-500">Prep</p><p className="text-xs text-green-400">{selectedHotel.preparationLabel}</p></div>
            </div>
            <div className="mt-4 space-y-2 border-t border-border pt-3 text-xs">
              {tripBreakdown.map((item) => <div key={item.label} className="flex justify-between"><span className="text-gray-400">{item.label}</span><span className="text-white">{formatMoney(item.amount)}</span></div>)}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded bg-surface-light/50 p-3"><p className="text-[10px] text-gray-500">Total Cost</p><p className="text-lg font-bold text-amber-400">{formatMoney(totalTripCost)}</p></div>
              <div className="rounded bg-surface-light/50 p-3"><p className="text-[10px] text-gray-500">Cash Left</p><p className={`text-lg font-bold ${moneyHealth(cashRemaining)}`}>{formatMoney(cashRemaining)}</p></div>
            </div>
            {existingBooking ? <div className="mt-4 rounded border border-green-600/20 bg-green-600/10 px-3 py-2 text-xs text-green-400">Current save has a booked package worth {formatMoney(existingBooking.totalCost)}.</div> : null}
          </div>

          <div className="card card-body">
            <h3 className="mb-3 text-xs font-semibold text-white">Readiness Impact</h3>
            <div className="space-y-3">
              <div><div className="mb-1 flex justify-between text-xs"><span className="text-gray-400">Travel Freshness</span><span className="text-white">{100 - selectedTravel.fatigueValue}%</span></div><ProgressBar value={100 - selectedTravel.fatigueValue} compact /></div>
              <div><div className="mb-1 flex justify-between text-xs"><span className="text-gray-400">Delay Control</span><span className="text-white">{100 - selectedTravel.delayRisk}%</span></div><ProgressBar value={100 - selectedTravel.delayRisk} compact /></div>
              <div><div className="mb-1 flex justify-between text-xs"><span className="text-gray-400">Recovery</span><span className="text-white">{selectedHotel.recoveryValue}%</span></div><ProgressBar value={selectedHotel.recoveryValue} compact /></div>
              <div><div className="mb-1 flex justify-between text-xs"><span className="text-gray-400">Preparation</span><span className="text-white">{selectedHotel.preparationValue}%</span></div><ProgressBar value={selectedHotel.preparationValue} compact /></div>
            </div>
          </div>

          <div className="grid gap-2">
            <button type="button" className="btn-primary justify-center text-xs" onClick={() => activeEvent && bookTravel(activeEvent.id, selectedTravel.id, selectedHotel.id)}>Confirm Travel</button>
            <button type="button" className="btn-secondary justify-center text-xs" onClick={() => navigate('/match/preview')}>Match Preview</button>
            <button type="button" className="btn-secondary justify-center text-xs" onClick={() => navigate('/calendar')}>Back To Calendar</button>
          </div>
        </div>
      </div>
    </div>
  )
}
