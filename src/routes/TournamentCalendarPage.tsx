import { entryTimeline } from '../game/tournamentEntry';
import { ActionBlockerNotice } from '../components/game/ActionBlockerNotice';
import { tournamentEntryBlocker } from '../hooks/useGameState';
import { TournamentRewards } from '../components/game/TournamentRewards';
import { SeasonBoardPanel, EntryTimelinePanel } from '../components/career/SeasonExpansionPanels'
import { CoachAdvicePanel } from "../components/career/MatchInsightPanels";
import { MonthCalendar, CalendarEventDialog } from '../components/tournaments/MonthCalendar'
import { useMemo, useState } from 'react'
import { SeasonPlanningPanel } from '../components/career/CareerDepthPanels'
import { QualificationRacesPanel, TravelLocationPanel } from '../components/career/RealismPanels'

import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, List, Search, Trophy } from 'lucide-react'
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
  const [searchParams] = useSearchParams()
  // Following a new event link must replace stale month/filter selections on this same page.
  return <TournamentCalendarContent key={searchParams.toString()} />
}

function TournamentCalendarContent() {
  const { gameState, enterTournament, withdrawTournament } = useGame()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const linkedTournament = gameState.tournaments.find(t => t.id === searchParams.get('tournament'))
    ?? (searchParams.get('guide') === 'entry' ? getNextEligibleTournament(gameState) : undefined)
  const calendarData = useMemo(() => buildCalendarData(gameState), [gameState])
  const liveTournamentsById = new Map(gameState.tournaments.map((event) => [event.id, event]))
  const equipmentReady = Boolean(gameState.equipment.currentCueId && gameState.equipment.currentChalkId && gameState.equipment.currentTipId)
  const currentDate = new Date(gameState.currentDate + 'T00:00:00')
  const todayMonth = currentDate.getFullYear() * 12 + currentDate.getMonth()
  const [monthIndex, setMonthIndex] = useState(() => linkedTournament ? Number(linkedTournament.startDate.slice(0,4)) * 12 + Number(linkedTournament.startDate.slice(5,7)) - 1 : todayMonth)
  const [view, setView] = useState<'list' | 'month' | 'board' | 'manage'>(searchParams.has('commitments') ? 'manage' : linkedTournament ? 'list' : 'month')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [circuitFilter, setCircuitFilter] = useState('All circuits')
  const [detailsOpen, setDetailsOpen] = useState(Boolean(linkedTournament))
  const [levelFilter, setLevelFilter] = useState<CalendarLevelFilter>(() => {
    const event = calendarData.events.find(event => event.id === linkedTournament?.id)
    return event ? getTournamentLevel(event) : 'All Tours'
  })
  const [selectedTournamentId, setSelectedTournamentId] = useState(() => linkedTournament?.id ?? getNextEligibleTournament(gameState)?.id ?? gameState.tournaments[0]?.id ?? '')
  const activeMonth = { year: Math.floor(monthIndex / 12), month: ((monthIndex % 12) + 12) % 12, label: monthLongLabels[((monthIndex % 12) + 12) % 12] + ' ' + Math.floor(monthIndex / 12) }
  const circuits = [...new Set(calendarData.events.filter(event => levelFilter === 'All Tours' || getTournamentLevel(event) === levelFilter).map(event => event.tourCircuit))].sort()
  const filteredEvents = calendarData.events.filter((event) => (statusFilter === 'All statuses' || (liveTournamentsById.get(event.id)?.status ?? event.status) === statusFilter) && `${event.name} ${event.location}`.toLowerCase().includes(query.trim().toLowerCase()) && (levelFilter === 'All Tours' || getTournamentLevel(event) === levelFilter) && (circuitFilter === 'All circuits' || event.tourCircuit === circuitFilter))
  const visibleEvents = filteredEvents.filter(event => eventOverlapsMonth(event, activeMonth.month, activeMonth.year)).sort((a, b) => (liveTournamentsById.get(a.id)?.startDate ?? '').localeCompare(liveTournamentsById.get(b.id)?.startDate ?? ''))
  const selectedTournament = gameState.tournaments.find((event) => event.id === selectedTournamentId && (detailsOpen || visibleEvents.some((calendarEvent) => calendarEvent.id === event.id)))
    ?? gameState.tournaments.find((event) => event.id === visibleEvents[0]?.id)
    ?? null
  const selectedCalendarEvent = selectedTournament ? calendarData.events.find((event) => event.id === selectedTournament.id) ?? visibleEvents[0] ?? null : visibleEvents[0] ?? null
  const selectedEventDetail = selectedTournament ? calendarData.getDetail(selectedTournament.id) : null
  const selectedStatus = selectedTournament ? liveTournamentsById.get(selectedTournament.id)?.status ?? selectedTournament.status : 'Available'
  const selectedAccess = selectedTournament ? getTournamentEntryAccess(gameState, selectedTournament) : null
  const selectedCashRequirement = selectedTournament ? getTournamentEntryCashRequirement(gameState, selectedTournament) : 0
  const entryBlocker = selectedTournament ? tournamentEntryBlocker(gameState, selectedTournament) : null

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
                      <h2 className="mt-1 text-xl font-bold text-white">{selectedTournament.name}</h2>
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
                    <p className="flex items-center gap-2"><span className={equipmentReady ? 'h-2 w-2 rounded-full bg-green-500' : 'h-2 w-2 rounded-full bg-red-500'} /> {equipmentReady ? 'Equipment slots ready' : 'Equipment slots incomplete'}</p>
                    <p className="flex items-center gap-2"><span className={gameState.player.cash >= selectedCashRequirement ? 'h-2 w-2 rounded-full bg-green-500' : 'h-2 w-2 rounded-full bg-red-500'} /> {gameState.player.cash >= selectedCashRequirement ? 'Entry cash available' : 'More entry cash needed'} ({formatMoney(selectedCashRequirement)})</p>
                    {entryBlocker && selectedStatus !== 'Entered' && selectedStatus !== 'Completed' ? <ActionBlockerNotice blocker={entryBlocker} /> : null}
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
                  <button type="button" className="btn-primary justify-center text-xs" onClick={() => entryBlocker ? navigate(entryBlocker.route) : enterTournament(selectedTournament.id)}>{entryBlocker?.label ?? 'Enter Tournament'} <ChevronRight className="h-3 w-3" /></button>
                )}
                <button type="button" disabled={selectedStatus === 'Completed'} className="btn-secondary justify-center text-xs disabled:cursor-not-allowed disabled:opacity-40" onClick={() => navigate('/travel')}>Travel Plan</button>
                <button type="button" className="btn-secondary justify-center text-xs" onClick={() => navigate('/finance')}>View Budget</button>
                <button type="button" className="btn-secondary justify-center text-xs" onClick={() => navigate('/tournaments/hub')}>Tournament Hub</button>
              </div>
            </>
          )}

  </div>

  const nextEvent = getNextEligibleTournament(gameState)
  const jumpToEvent = (id: string) => {
    const event = calendarData.events.find(event => event.id === id)
    if (!event) return
    setMonthIndex(event.startYear * 12 + event.startMonth)
    setLevelFilter(getTournamentLevel(event)); setCircuitFilter('All circuits'); setStatusFilter('All statuses'); setQuery('')
    setSelectedTournamentId(id); setView('month')
  }
  const nextMatchingEvent = filteredEvents.filter(event => event.startYear * 12 + event.startMonth > monthIndex).sort((a,b) => (a.startYear*12+a.startMonth)-(b.startYear*12+b.startMonth))[0]
  const eventTypes = <>{(['gold', 'green', 'violet', 'blue', 'orange'] as const).map(tone => <span key={tone} className="flex items-center gap-1.5"><span className={'h-2 w-2 rounded ' + tierColorClasses[tone]} />{tone === 'gold' ? 'Major' : tone === 'green' ? 'Ranking' : tone === 'violet' ? 'Invitational' : tone === 'blue' ? 'Seniors / Exhibitions' : 'Pathway'}</span>)}</>
  return (
    <div className="calendar-page flex h-full min-h-0 min-w-0 flex-col gap-2 overflow-hidden" data-testid="calendar-page">
      <header className="calendar-header">
        <div><p className="calendar-eyebrow">Plan your season · {gameState.season}</p><h1 className="text-2xl font-bold text-white">Tournament Calendar</h1><p className="calendar-intro text-xs text-gray-300">Find your next event. Check the field, plan the cost and secure your place.</p></div>
        {nextEvent && <button type="button" className="calendar-next" onClick={() => jumpToEvent(nextEvent.id)}><span className="calendar-eyebrow">Your next event</span><strong>{nextEvent.name} <ChevronRight className="inline h-3 w-3" /></strong><span>{nextEvent.startDate} · {nextEvent.status}</span></button>}
      </header>
      <div className="calendar-toolbar">
        <div className="calendar-views" role="group" aria-label="Calendar display">
          {([{id:'month',label:'Month view',icon:CalendarDays},{id:'list',label:'List view',icon:List},{id:'board',label:'Planning board'},{id:'manage',label:'Commitments'}] as const).map((item,index,items) => <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => setView(item.id)} onKeyDown={event => {
            const next = event.key === 'ArrowRight' ? (index+1)%items.length : event.key === 'ArrowLeft' ? (index+items.length-1)%items.length : null;
            if(next===null)return; event.preventDefault();setView(items[next].id);(event.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus();
          }}>{'icon' in item && <item.icon className="h-3.5 w-3.5" />}{item.label}</button>)}
        </div>
        <div className="calendar-month-navigation">
          <button type="button" className="btn-secondary text-xs" onClick={() => setMonthIndex(todayMonth)}>Today</button>
          <button type="button" className="btn-secondary px-2 py-2" onClick={() => setMonthIndex(value => value-1)} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
          <span className="font-semibold text-white" aria-live="polite">{activeMonth.label}</span>
          <button type="button" className="btn-secondary px-2 py-2" onClick={() => setMonthIndex(value => value+1)} aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      {(view === 'month' || view === 'list') && <div className="calendar-filters">
        <label>Tour<select aria-label="Tour filter" value={levelFilter} onChange={e => {setLevelFilter(e.target.value as CalendarLevelFilter);setCircuitFilter('All circuits')}}>{levelFilters.map(filter => <option key={filter} value={filter}>{filter === 'Legacy' ? 'Seniors & Legends' : filter}</option>)}</select></label>
        <label>Circuit<select aria-label="Specific circuit" value={circuitFilter} onChange={e => setCircuitFilter(e.target.value)}><option>All circuits</option>{circuits.map(circuit => <option key={circuit}>{circuit}</option>)}</select></label>
        <label>Status<select aria-label="Event status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>{['All statuses','Entered','Completed','Skipped'].map(status => <option key={status}>{status}</option>)}</select></label>
        <label className="calendar-search">Find an event<input type="search" aria-label="Find an event" placeholder="Tournament or location…" value={query} onChange={e => setQuery(e.target.value)} /></label>
        <span className="calendar-event-count" aria-live="polite"><strong>{visibleEvents.length}</strong> events</span>
      </div>}
      <div className="calendar-content min-h-0 min-w-0 flex-1 overflow-hidden">
        {view === 'month' && <div className="flex h-full min-h-0 flex-col gap-2">
          {!visibleEvents.length && <div className="calendar-empty-month"><span>No tournaments match this month and tour filter.</span>{nextMatchingEvent ? <button onClick={() => setMonthIndex(nextMatchingEvent.startYear*12+nextMatchingEvent.startMonth)}>Next matching month →</button> : <button onClick={() => {setQuery('');setLevelFilter('All Tours');setCircuitFilter('All circuits');setStatusFilter('All statuses')}}>Reset filters</button>}</div>}
          <MonthCalendar year={activeMonth.year} month={activeMonth.month} today={gameState.currentDate} selectedId={selectedTournament?.id}
            events={visibleEvents.map(event => ({id:event.id,name:event.name,startDate:liveTournamentsById.get(event.id)!.startDate,endDate:liveTournamentsById.get(event.id)!.endDate,accent:calendarAccent(event.type),status:liveTournamentsById.get(event.id)?.status ?? event.status,tourCircuit:event.tourCircuit}))}
            onSelect={id => {setSelectedTournamentId(id);setDetailsOpen(true)}} />
        </div>}
        {view === 'list' && <section aria-label="Tournament list" className="card flex h-full min-h-0 flex-col overflow-hidden">
          <div className="calendar-list-heading"><h2>{activeMonth.label} · Event schedule</h2><span>Select an event for entry rules, deadlines and costs</span></div>
          <div className="min-h-0 flex-1 overflow-auto scrollbar-thin" tabIndex={0} aria-label="Event list scroll area">
            <table className="calendar-event-table"><thead><tr><th>Dates</th><th>Tournament & venue</th><th>Tour</th><th>Entry & status</th><th>Winner prize</th></tr></thead><tbody>
              {visibleEvents.map(event => {
                const live = liveTournamentsById.get(event.id)!
                const timeline = entryTimeline(gameState,live)
                return <tr key={event.id} data-selected={selectedTournament?.id===event.id}>
                  <td><div className={'calendar-date-block calendar-accent-'+calendarAccent(event.type)}><strong>{event.startDay}</strong><span>{monthShortLabels[event.startMonth]}</span></div><span className="calendar-dates">{formatEventDates(event.startDay,event.endDay,event.startMonth,event.endMonth)}</span></td>
                  <td><button className="calendar-event-name" type="button" onClick={() => {setSelectedTournamentId(event.id);setDetailsOpen(true)}}>{event.name}</button><p>{event.location}</p></td>
                  <td><strong>{event.tourCircuit}</strong><p>{event.type}</p></td>
                  <td><span className={'inline-block rounded border px-2 py-1 text-[10px] '+statusClass(live.status)}>{live.status}</span><p>{timeline.label}</p></td>
                  <td className="text-right"><strong className="text-emerald-300">{formatMoney(live.winnerPrize ?? event.winnerPrize)}</strong><p>{formatMoney(event.totalPrizeFund)} fund</p></td>
                </tr>
              })}
              {!visibleEvents.length && <tr><td colSpan={5} className="py-10 text-center">No events match this month and tour filter.{nextMatchingEvent && <button className="ml-3 text-emerald-300" onClick={() => setMonthIndex(nextMatchingEvent.startYear*12+nextMatchingEvent.startMonth)}>Next matching month →</button>}</td></tr>}
            </tbody></table>
          </div>
        </section>}
        {view === 'board' && <div className="calendar-board h-full min-h-0 overflow-auto scrollbar-thin"><SeasonBoardPanel year={activeMonth.year} month={activeMonth.month} onEvent={id => {setSelectedTournamentId(id);setDetailsOpen(true)}} /></div>}
        {view === 'manage' && <div className="calendar-management h-full overflow-auto scrollbar-thin">
          <section className="calendar-management-intro"><p className="calendar-eyebrow">Off the table</p><h2 className="text-xl font-bold text-white">Make room for your next event</h2><p className="text-sm text-gray-300">Review bookings, sponsor work and travel before committing to a tournament.</p></section>
          <div className="calendar-management-grid"><section className="card p-4"><h3>Season strategy</h3><p>Approve entries and travel together, or manage your schedule yourself.</p><SeasonPlanningPanel /></section><section className="card p-4"><h3>Qualification & tour survival</h3><p>Check the selection cutoffs and positions that shape your season.</p><QualificationRacesPanel /></section><section className="card p-4"><h3>Location & preparation</h3><p>Plan from your current base and review your coach’s recommendations.</p><TravelLocationPanel /><CoachAdvicePanel /></section><section className="card p-4"><h3>Club & national pairs</h3><p>Optional team invitations, partnerships and your shared results.</p><Link to="/career/teams" className="btn-secondary text-xs">View team events →</Link>{gameState.careerDepth?.seasonLife?.teams.filter(e=>e.status==='accepted').map(e=><p key={e.id}>{e.start}–{e.end} · {e.name} · accepted team booking</p>)}</section></div>
        </div>}
      </div>
      {(view==='month'||view==='list') && <footer className="calendar-legend">{eventTypes}<span className="ml-auto">✓ Entered · Select an event for details{view==='month' ? ' · ‹ › Continues across weeks · Scroll busy weeks' : ''}</span></footer>}
      {detailsOpen && <CalendarEventDialog onClose={() => setDetailsOpen(false)}>{eventDetails}</CalendarEventDialog>}
    </div>
  )
}
