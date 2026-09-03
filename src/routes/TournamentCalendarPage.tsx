import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Search, Trophy } from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/useGame'
import { getNextEligibleTournament, getTournamentEntryAccess, getTournamentEntryCashRequirement } from '../hooks/useGameState'
import { formatMoney } from '../utils/formatters'
import { buildCalendarData } from '../utils/liveRouteData'

const monthLongLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const monthShortLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const levelFilters = ['All Tours', 'Junior Pathway', 'Amateur Circuit', 'Q Tour', 'Q School', 'Main Tour', 'Legacy'] as const

type CalendarLevelFilter = (typeof levelFilters)[number]

const tierColorClasses = {
  green: 'bg-green-500',
  violet: 'bg-violet-500',
  gold: 'bg-amber-500',
  orange: 'bg-orange-500',
  blue: 'bg-blue-500',
}

function getTournamentLevel(stageId: number): Exclude<CalendarLevelFilter, 'All Tours'> {
  if (stageId <= 3) return 'Junior Pathway'
  if (stageId === 4) return 'Amateur Circuit'
  if (stageId === 5) return 'Q Tour'
  if (stageId === 6) return 'Q School'
  if (stageId >= 7 && stageId <= 12) return 'Main Tour'
  return 'Legacy'
}

function formatEventDates(startDay: number, endDay?: number, startMonth = 0, endMonth = startMonth) {
  if (!endDay || endDay === startDay) return `${startDay} ${monthShortLabels[startMonth]}`
  if (startMonth === endMonth) return `${startDay}-${endDay} ${monthShortLabels[startMonth]}`
  return `${startDay} ${monthShortLabels[startMonth]}-${endDay} ${monthShortLabels[endMonth]}`
}

function eventOverlapsMonth(event: { startMonth: number; startYear: number; endMonth: number; endYear: number }, month: number, year: number) {
  const eventStartKey = event.startYear * 12 + event.startMonth
  const eventEndKey = event.endYear * 12 + event.endMonth
  const targetKey = year * 12 + month
  return targetKey >= eventStartKey && targetKey <= eventEndKey
}

function statusClass(status: string) {
  if (status === 'Entered') return 'bg-green-600/20 text-green-400 border-green-600/30'
  if (status === 'High Cost') return 'bg-amber-600/20 text-amber-400 border-amber-600/30'
  if (status === 'Skipped') return 'bg-red-600/20 text-red-400 border-red-600/30'
  return 'bg-surface-light text-gray-400 border-border'
}

function progressTone(tone: 'green' | 'amber' | 'red' | 'blue') {
  if (tone === 'blue') return 'green'
  return tone
}

export function TournamentCalendarPage() {
  const { gameState, enterTournament, withdrawTournament } = useGame()
  const navigate = useNavigate()
  const calendarData = buildCalendarData(gameState)
  const liveTournamentsById = new Map(gameState.tournaments.map((event) => [event.id, event]))
  const equipmentReady = Boolean(gameState.equipment.currentCueId && gameState.equipment.currentChalkId && gameState.equipment.currentTipId)
  const monthOptions = useMemo(() => {
    const uniqueMonths = new Map<string, { label: string; month: number; year: number }>()
    calendarData.events
      .slice()
      .sort((left, right) => (left.startYear - right.startYear) || (left.startMonth - right.startMonth) || (left.startDay - right.startDay))
      .forEach((event) => {
        const key = `${event.startYear}-${event.startMonth}`
        if (!uniqueMonths.has(key)) uniqueMonths.set(key, { label: `${monthLongLabels[event.startMonth]} ${event.startYear}`, month: event.startMonth, year: event.startYear })
      })
    return Array.from(uniqueMonths.values())
  }, [calendarData.events])
  const currentDate = new Date(`${gameState.currentDate}T00:00:00`)
  const defaultMonthIndex = Math.max(0, monthOptions.findIndex((option) => option.month === currentDate.getMonth() && option.year === currentDate.getFullYear()))
  const [monthIndex, setMonthIndex] = useState(defaultMonthIndex)
  const [levelFilter, setLevelFilter] = useState<CalendarLevelFilter>('All Tours')
  const [selectedTournamentId, setSelectedTournamentId] = useState(getNextEligibleTournament(gameState)?.id ?? gameState.tournaments[0]?.id ?? '')
  const activeMonth = monthOptions[monthIndex] ?? monthOptions[0]
  const visibleEvents = useMemo(
    () => calendarData.events.filter((event) => eventOverlapsMonth(event, activeMonth.month, activeMonth.year) && (levelFilter === 'All Tours' || getTournamentLevel(event.stageId) === levelFilter)),
    [activeMonth.month, activeMonth.year, calendarData.events, levelFilter],
  )
  const selectedTournament = gameState.tournaments.find((event) => event.id === selectedTournamentId && visibleEvents.some((calendarEvent) => calendarEvent.id === event.id))
    ?? gameState.tournaments.find((event) => event.id === visibleEvents[0]?.id)
    ?? null
  const selectedCalendarEvent = selectedTournament ? visibleEvents.find((event) => event.id === selectedTournament.id) ?? visibleEvents[0] ?? null : visibleEvents[0] ?? null
  const selectedEventDetail = selectedTournament ? calendarData.getDetail(selectedTournament.id) : null
  const selectedStatus = selectedTournament ? liveTournamentsById.get(selectedTournament.id)?.status ?? selectedTournament.status : 'Available'
  const selectedAccess = selectedTournament ? getTournamentEntryAccess(gameState, selectedTournament) : null
  const selectedCashRequirement = selectedTournament ? getTournamentEntryCashRequirement(gameState, selectedTournament) : 0
  const eventExpired = selectedTournament ? new Date(`${selectedTournament.endDate ?? selectedTournament.startDate}T00:00:00`) < currentDate : false
  const existingEntry = gameState.tournaments.find((event) => event.status === 'Entered' && event.id !== selectedTournament?.id)
  const entryBlocker = !selectedAccess?.allowed
    ? selectedAccess?.reason
    : eventExpired
      ? 'This event has already finished.'
      : existingEntry
        ? `Finish or withdraw from ${existingEntry.name} first.`
        : gameState.player.cash < selectedCashRequirement
          ? 'Not enough cash for the entry fee.'
          : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white">Tournament Calendar</h1>
          <p className="mt-1 text-sm text-gray-400">Season pathway schedule - {activeMonth.label}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-secondary text-xs" onClick={() => setMonthIndex(defaultMonthIndex)}><CalendarDays className="h-3.5 w-3.5" /> Today</button>
          <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => setMonthIndex((value) => Math.max(0, value - 1))} aria-label="Previous month"><ChevronLeft className="h-3.5 w-3.5" /></button>
          <span className="min-w-36 text-center text-sm font-medium text-white">{activeMonth.label}</span>
          <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => setMonthIndex((value) => Math.min(monthOptions.length - 1, value + 1))} aria-label="Next month"><ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 space-y-4 xl:col-span-7">
          <div className="card">
            <div className="card-header">
              <div className="flex flex-wrap items-center gap-3 text-[10px]">
                {(['gold', 'green', 'blue', 'orange'] as const).map((tone) => <div key={tone} className="flex items-center gap-1"><div className={`h-2 w-2 rounded ${tierColorClasses[tone]}`} /><span className="text-gray-400">{tone === 'gold' ? 'Major' : tone === 'green' ? 'Ranking' : tone === 'blue' ? 'Standard' : 'Pathway'}</span></div>)}
              </div>
            </div>
            <div className="card-header border-t border-border">
              <div className="flex flex-wrap items-center gap-3">
                {levelFilters.map((filter) => (
                  <button key={filter} type="button" onClick={() => setLevelFilter(filter)} className={levelFilter === filter ? 'tab-active text-[10px]' : 'tab-inactive text-[10px]'}>{filter}</button>
                ))}
              </div>
            </div>
            <div className="card-body space-y-2">
              {visibleEvents.length === 0 ? <p className="py-8 text-center text-sm text-gray-400">No events match this month and tour filter.</p> : null}
              {visibleEvents.map((event) => {
                const liveStatus = liveTournamentsById.get(event.id)?.status ?? event.status
                const selected = selectedTournament?.id === event.id
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => setSelectedTournamentId(event.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${selected ? 'border-green-600/30 bg-green-600/10' : 'border-transparent bg-surface-light/50 hover:bg-surface-light'}`}
                  >
                    <div className={`h-12 w-1.5 shrink-0 rounded-full ${tierColorClasses[event.accent as keyof typeof tierColorClasses]}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-medium text-white">{event.name}</h3>
                        <span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] ${statusClass(liveStatus)}`}>{liveStatus}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                        <span>{formatEventDates(event.startDay, event.endDay, event.startMonth, event.endMonth)}</span>
                        <span className="flex min-w-0 items-center gap-1"><MapPin className="h-2.5 w-2.5 shrink-0" /> <span className="truncate">{event.location}</span></span>
                        <span>{event.tourCircuit}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-green-400">{formatMoney(event.totalPrizeFund)}</p>
                      <p className="text-[10px] text-gray-500">Prize fund</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="col-span-12 space-y-4 xl:col-span-5">
          {!selectedTournament || !selectedCalendarEvent || !selectedEventDetail ? (
            <div className="card card-body p-8 text-center text-sm text-gray-400">Select an event to see entry detail.</div>
          ) : (
            <>
              <div className="card overflow-hidden border-green-600/30">
                <div className="bg-gradient-to-r from-green-600/10 via-transparent to-transparent p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase text-green-400">{selectedCalendarEvent.pathwayTier}</p>
                      <h2 className="mt-1 truncate text-xl font-bold text-white">{selectedTournament.name}</h2>
                      <p className="mt-1 text-xs text-gray-400">{formatEventDates(selectedCalendarEvent.startDay, selectedCalendarEvent.endDay, selectedCalendarEvent.startMonth, selectedCalendarEvent.endMonth)} - {selectedTournament.location}</p>
                    </div>
                    <Trophy className="h-8 w-8 shrink-0 text-amber-400" />
                  </div>
                </div>
              </div>

              <div className="card card-body space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-gray-500">Tour</span><p className="text-white">{selectedTournament.tourCircuit ?? selectedCalendarEvent.tourCircuit}</p></div>
                  <div><span className="text-gray-500">Ranking</span><p className="text-white">{selectedTournament.rankingType ?? selectedCalendarEvent.rankingType}</p></div>
                  <div><span className="text-gray-500">Format</span><p className="text-white">{selectedTournament.format}</p></div>
                  <div><span className="text-gray-500">Status</span><p className="text-white">{selectedStatus}</p></div>
                  <div><span className="text-gray-500">Entry Fee</span><p className="text-white">{formatMoney(selectedTournament.entryFee)}</p></div>
                  <div><span className="text-gray-500">Travel + Hotel</span><p className="text-white">{formatMoney(selectedTournament.travelCost + selectedTournament.hotelCost)}</p></div>
                  <div><span className="text-gray-500">Prize Fund</span><p className="font-bold text-green-400">{formatMoney(selectedTournament.totalPrizeFund ?? selectedCalendarEvent.totalPrizeFund)}</p></div>
                  <div><span className="text-gray-500">Winner Prize</span><p className="font-bold text-green-400">{formatMoney(selectedTournament.winnerPrize ?? selectedCalendarEvent.winnerPrize)}</p></div>
                </div>
                <div className="border-t border-border pt-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase text-gray-500">Entry Requirements</p>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p className="flex items-center gap-2"><span className={selectedAccess?.allowed ? 'h-2 w-2 rounded-full bg-green-500' : 'h-2 w-2 rounded-full bg-red-500'} /> {selectedAccess?.reason ?? selectedTournament.unlockRequirement ?? selectedCalendarEvent.unlockRequirement}</p>
                    <p className="flex items-center gap-2"><span className={equipmentReady ? 'h-2 w-2 rounded-full bg-green-500' : 'h-2 w-2 rounded-full bg-red-500'} /> Equipment slots ready</p>
                    <p className="flex items-center gap-2"><span className={gameState.player.cash >= selectedCashRequirement ? 'h-2 w-2 rounded-full bg-green-500' : 'h-2 w-2 rounded-full bg-red-500'} /> Entry cash available ({formatMoney(selectedCashRequirement)})</p>
                    {entryBlocker && selectedStatus !== 'Entered' ? <p className="text-red-400" role="alert">{entryBlocker}</p> : null}
                  </div>
                </div>
              </div>

              <div className="card card-body space-y-3">
                <div className="flex items-center gap-2 rounded-lg bg-surface-light/50 px-3 py-2 text-xs text-gray-400"><Search className="h-3 w-3" /> {selectedEventDetail.alertText}</div>
                {selectedEventDetail.progressMeters.map((meter) => (
                  <div key={meter.label}>
                    <div className="mb-1 flex justify-between text-xs"><span className="text-gray-400">{meter.label}</span><span className="text-white">{meter.detail}</span></div>
                    <ProgressBar value={(meter.value / meter.max) * 100} tone={progressTone(meter.tone)} compact />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {selectedStatus === 'Entered' ? (
                  <button type="button" className="btn-secondary justify-center text-xs text-red-300" onClick={() => withdrawTournament(selectedTournament.id)}>Withdraw</button>
                ) : (
                  <button type="button" disabled={Boolean(entryBlocker)} className="btn-primary justify-center text-xs disabled:cursor-not-allowed disabled:opacity-50" onClick={() => equipmentReady ? enterTournament(selectedTournament.id) : navigate('/equipment/cues')}>{equipmentReady ? 'Enter Tournament' : 'Open Equipment'} <ChevronRight className="h-3 w-3" /></button>
                )}
                <button type="button" className="btn-secondary justify-center text-xs" onClick={() => navigate('/travel')}>Travel Plan</button>
                <button type="button" className="btn-secondary justify-center text-xs" onClick={() => navigate('/finance')}>View Budget</button>
                <button type="button" className="btn-secondary justify-center text-xs" onClick={() => navigate('/tournaments/hub')}>Tournament Hub</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
