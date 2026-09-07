import { TournamentRewards } from '../components/game/TournamentRewards';
import { SeasonBoardPanel, EntryTimelinePanel } from '../components/career/SeasonExpansionPanels'
import { CoachAdvicePanel } from "../components/career/MatchInsightPanels";
import { MonthCalendar, CalendarEventDialog } from '../components/tournaments/MonthCalendar'
import { useState } from 'react'
import { SeasonPlanningPanel } from '../components/career/CareerDepthPanels'
import { QualificationRacesPanel, TravelLocationPanel } from '../components/career/RealismPanels'
import { tournamentCommitmentConflict } from '../game/careerDepth/commitments'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, List, MapPin, Search, Trophy } from 'lucide-react'
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

function calendarAccent(type: string): keyof typeof tierColorClasses {
  if (type === 'Major') return 'gold'
  if (type === 'Ranking' || type === 'Professional Tour') return 'green'
  if (type === 'Invitational') return 'violet'
  if (type === 'Senior' || type === 'Exhibition') return 'blue'
  return 'orange'
}

function getTournamentLevel(event: { stageId: number; type: string }): Exclude<CalendarLevelFilter, 'All Tours'> {
  if (['Junior', 'Regional Youth', 'National Youth'].includes(event.type)) return 'Junior Pathway'
  if (event.type === 'Amateur') return 'Amateur Circuit'
  if (event.type === 'Q Tour') return 'Q Tour'
  if (event.type === 'Q School') return 'Q School'
  if (['Senior', 'Exhibition'].includes(event.type)) return 'Legacy'
  if (['Professional Tour', 'Ranking', 'Major', 'Invitational'].includes(event.type)) return 'Main Tour'
  const stageId = event.stageId
  if (stageId <= 3) return 'Junior Pathway'
  if (stageId === 4) return 'Amateur Circuit'
  if (stageId === 5) return 'Q Tour'
  if (stageId === 6) return 'Q School'
  if (stageId >= 7 && stageId <= 12) return 'Main Tour'
  return 'Legacy'
}

function formatEventDates(startDay: number, endDay?: number, startMonth = 0, endMonth = startMonth) {
  if (!endDay || (endDay === startDay && startMonth === endMonth)) return `${startDay} ${monthShortLabels[startMonth]}`
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
  if (status === 'Completed') return 'bg-sky-600/20 text-sky-300 border-sky-600/30'
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
  const [searchParams] = useSearchParams()
  const linkedTournament = gameState.tournaments.find(t => t.id === searchParams.get('tournament'))
  const calendarData = buildCalendarData(gameState)
  const liveTournamentsById = new Map(gameState.tournaments.map((event) => [event.id, event]))
  const equipmentReady = Boolean(gameState.equipment.currentCueId && gameState.equipment.currentChalkId && gameState.equipment.currentTipId)
  const currentDate = new Date(gameState.currentDate + 'T00:00:00')
  const todayMonth = currentDate.getFullYear() * 12 + currentDate.getMonth()
  const [monthIndex, setMonthIndex] = useState(() => linkedTournament ? Number(linkedTournament.startDate.slice(0,4)) * 12 + Number(linkedTournament.startDate.slice(5,7)) - 1 : todayMonth)
  const [view, setView] = useState<'list' | 'month' | 'board'>('list')
  const [circuitFilter, setCircuitFilter] = useState('All circuits')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [levelFilter, setLevelFilter] = useState<CalendarLevelFilter>('All Tours')
  const [selectedTournamentId, setSelectedTournamentId] = useState(linkedTournament?.id ?? getNextEligibleTournament(gameState)?.id ?? gameState.tournaments[0]?.id ?? '')
  const activeMonth = { year: Math.floor(monthIndex / 12), month: ((monthIndex % 12) + 12) % 12, label: monthLongLabels[((monthIndex % 12) + 12) % 12] + ' ' + Math.floor(monthIndex / 12) }
  const circuits = [...new Set(calendarData.events.filter(event => levelFilter === 'All Tours' || getTournamentLevel(event) === levelFilter).map(event => event.tourCircuit))].sort()
  const visibleEvents = calendarData.events.filter((event) => eventOverlapsMonth(event, activeMonth.month, activeMonth.year) && (levelFilter === 'All Tours' || getTournamentLevel(event) === levelFilter) && (circuitFilter === 'All circuits' || event.tourCircuit === circuitFilter))
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
  const entryConflict = selectedTournament ? tournamentCommitmentConflict(gameState, selectedTournament) : null
  const entryBlocker = entryConflict ?? (!selectedAccess?.allowed
    ? selectedAccess?.reason
    : eventExpired
      ? 'This event has already finished.'
      : existingEntry
        ? `Finish or withdraw from ${existingEntry.name} first.`
        : gameState.player.cash < selectedCashRequirement
          ? 'Not enough cash for the entry fee.'
          : null)

  const eventDetails = <div className="space-y-4">
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

              <EntryTimelinePanel event={selectedTournament} />
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
                    {entryBlocker && selectedStatus !== 'Entered' && selectedStatus !== 'Completed' ? <p className="text-red-400" role="alert">{entryBlocker}</p> : null}
                  </div>
                </div>
              </div>

              <div className="card card-body space-y-3">
                <details><summary className="cursor-pointer text-xs text-green-400">Results & rewards</summary><TournamentRewards event={selectedTournament}/></details>
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
                ) : selectedStatus === 'Completed' ? (
                  <button type="button" className="btn-primary justify-center text-xs" onClick={() => navigate(`/tournaments/draw?tournament=${encodeURIComponent(selectedTournament.id)}`)}>View Completed Draw <ChevronRight className="h-3 w-3" /></button>
                ) : (
                  <button type="button" disabled={Boolean(entryBlocker)} className="btn-primary justify-center text-xs disabled:cursor-not-allowed disabled:opacity-50" onClick={() => equipmentReady ? enterTournament(selectedTournament.id) : navigate('/equipment/cues')}>{equipmentReady ? 'Enter Tournament' : 'Open Equipment'} <ChevronRight className="h-3 w-3" /></button>
                )}
                <button type="button" disabled={selectedStatus === 'Completed'} className="btn-secondary justify-center text-xs disabled:cursor-not-allowed disabled:opacity-40" onClick={() => navigate('/travel')}>Travel Plan</button>
                <button type="button" className="btn-secondary justify-center text-xs" onClick={() => navigate('/finance')}>View Budget</button>
                <button type="button" className="btn-secondary justify-center text-xs" onClick={() => navigate('/tournaments/hub')}>Tournament Hub</button>
              </div>
            </>
          )}

  </div>

  return (
    <div className={view === 'month' ? 'flex h-full min-h-0 flex-col gap-3' : 'space-y-6'}>
      <div className="flex shrink-0 flex-col items-start justify-between gap-3 sm:flex-row">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white">Tournament Calendar</h1>
          <p className="mt-1 text-sm text-gray-400">Season pathway schedule - {activeMonth.label}</p>
          <div className="mt-2 flex gap-1" role="group" aria-label="Calendar display">
            <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')} className={view === 'list' ? 'btn-primary px-3 py-1 text-xs' : 'btn-secondary px-3 py-1 text-xs'}><List className="h-3.5 w-3.5" /> List view</button>
            <button type="button" aria-pressed={view === 'month'} onClick={() => setView('month')} className={view === 'month' ? 'btn-primary px-3 py-1 text-xs' : 'btn-secondary px-3 py-1 text-xs'}><CalendarDays className="h-3.5 w-3.5" /> Month view</button>
            <button type="button" aria-pressed={view === 'board'} onClick={() => setView('board')} className={view === 'board' ? 'btn-primary px-3 py-1 text-xs' : 'btn-secondary px-3 py-1 text-xs'}>Planning board</button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-secondary text-xs" onClick={() => setMonthIndex(todayMonth)}><CalendarDays className="h-3.5 w-3.5" /> Today</button>
          <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => setMonthIndex((value) => value - 1)} aria-label="Previous month"><ChevronLeft className="h-3.5 w-3.5" /></button>
          <span className="min-w-36 text-center text-sm font-medium text-white">{activeMonth.label}</span>
          <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => setMonthIndex((value) => value + 1)} aria-label="Next month"><ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {view === 'board' ? <><SeasonBoardPanel year={activeMonth.year} month={activeMonth.month} onEvent={id=>{setSelectedTournamentId(id);setDetailsOpen(true)}} /><SeasonPlanningPanel />{detailsOpen && <CalendarEventDialog onClose={()=>setDetailsOpen(false)}>{eventDetails}</CalendarEventDialog>}</> : view === 'month' ? <>
        <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-2">
          <label className="flex items-center gap-2 text-xs text-gray-400">Tour
            <select aria-label="Tour filter" className="max-w-[180px] rounded border border-border bg-background px-2 py-1.5 text-xs text-white" value={levelFilter} onChange={e => { setLevelFilter(e.target.value as CalendarLevelFilter); setCircuitFilter('All circuits') }}>
              {levelFilters.map(filter => <option key={filter} value={filter}>{filter === 'Legacy' ? 'Seniors & Legends' : filter}</option>)}
            </select>
          </label>
          <select aria-label="Specific circuit" className="min-w-0 max-w-full flex-1 rounded border border-border bg-background px-2 py-1.5 text-xs text-white sm:max-w-[340px]" value={circuitFilter} onChange={e => setCircuitFilter(e.target.value)}><option>All circuits</option>{circuits.map(circuit => <option key={circuit}>{circuit}</option>)}</select>
          <span aria-live="polite" className="text-xs text-gray-400 sm:ml-auto">{visibleEvents.length ? visibleEvents.length + ' tournaments this month' : 'No tournaments match this month and tour filter.'}</span>
        </div>
        <MonthCalendar year={activeMonth.year} month={activeMonth.month} today={gameState.currentDate} selectedId={selectedTournament?.id}
          events={visibleEvents.map(event => ({ id: event.id, name: event.name, startDate: liveTournamentsById.get(event.id)!.startDate, endDate: liveTournamentsById.get(event.id)!.endDate, accent: calendarAccent(event.type), status: liveTournamentsById.get(event.id)?.status ?? event.status, tourCircuit: event.tourCircuit }))}
          onSelect={id => { setSelectedTournamentId(id); setDetailsOpen(true) }} />
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-400">
          {(['gold', 'green', 'violet', 'blue', 'orange'] as const).map(tone => <span key={tone} className="flex items-center gap-1"><span className={'h-2 w-2 rounded ' + tierColorClasses[tone]} />{tone === 'gold' ? 'Major' : tone === 'green' ? 'Ranking' : tone === 'violet' ? 'Invitational' : tone === 'blue' ? 'Seniors / Exhibitions' : 'Pathway'}</span>)}
          <span>✓ Entered · ‹ › Continues across weeks · Scroll within busy weeks for more events</span>
        </div>
        {detailsOpen && <CalendarEventDialog onClose={() => setDetailsOpen(false)}>{eventDetails}</CalendarEventDialog>}
      </> : <>
      <SeasonPlanningPanel />
      <CoachAdvicePanel />
      <QualificationRacesPanel />
      <TravelLocationPanel />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="col-span-12 space-y-4 xl:col-span-7">
          <div className="card">
            <div className="card-header">
              <div className="flex flex-wrap items-center gap-3 text-[10px]">
                {(['gold', 'green', 'violet', 'blue', 'orange'] as const).map((tone) => <div key={tone} className="flex items-center gap-1"><div className={`h-2 w-2 rounded ${tierColorClasses[tone]}`} /><span className="text-gray-400">{tone === 'gold' ? 'Major' : tone === 'green' ? 'Ranking' : tone === 'violet' ? 'Invitational' : tone === 'blue' ? 'Seniors / Exhibitions' : 'Pathway'}</span></div>)}
              </div>
            </div>
            <div className="card-header border-t border-border">
              <div className="flex flex-wrap items-center gap-3">
                {levelFilters.map((filter) => (
                  <button key={filter} type="button" onClick={() => { setLevelFilter(filter); setCircuitFilter('All circuits') }} className={levelFilter === filter ? 'tab-active text-[10px]' : 'tab-inactive text-[10px]'}>{filter === 'Legacy' ? 'Seniors & Legends' : filter}</button>
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
                    <div className={`h-12 w-1.5 shrink-0 rounded-full ${tierColorClasses[calendarAccent(event.type)]}`} />
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

        <div className="col-span-12 space-y-4 xl:col-span-5">{eventDetails}
        </div>
      </div>
      </>}
    </div>
  )
}
