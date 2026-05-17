import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SectionCard } from '../components/ui/SectionCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useGame } from '../context/GameStateContext'
import { formatMoney } from '../utils/formatters'
import { buildCalendarData } from '../utils/liveRouteData'

const accentClasses = {
  green: 'border-emerald-400/30 bg-emerald-500/12 text-emerald-200',
  violet: 'border-violet-400/30 bg-violet-500/12 text-violet-200',
  gold: 'border-amber-400/30 bg-amber-500/12 text-amber-100',
  orange: 'border-orange-400/30 bg-orange-500/12 text-orange-100',
  blue: 'border-sky-400/30 bg-sky-500/12 text-sky-200',
} as const

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const previousMonthDays = [27, 28, 29, 30]
const currentMonthDays = Array.from({ length: 31 }, (_, index) => ({ label: index + 1, inMonth: true }))
const calendarCells = [...previousMonthDays.map((label) => ({ label, inMonth: false })), ...currentMonthDays]
const monthShortLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const monthLongLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const levelFilters = ['All Tours', 'Junior Pathway', 'Amateur Circuit', 'Q Tour', 'Q School', 'Main Tour', 'Legacy'] as const

type CalendarLevelFilter = (typeof levelFilters)[number]

function getTournamentLevel(stageId: number): Exclude<CalendarLevelFilter, 'All Tours'> {
  if (stageId <= 3) return 'Junior Pathway'
  if (stageId === 4) return 'Amateur Circuit'
  if (stageId === 5) return 'Q Tour'
  if (stageId === 6) return 'Q School'
  if (stageId >= 7 && stageId <= 12) return 'Main Tour'
  return 'Legacy'
}

function getStatusTone(status: string): 'green' | 'amber' | 'red' | 'blue' {
  if (status === 'Skipped') return 'red'
  if (status === 'High Cost') return 'amber'
  if (status === 'Considering') return 'blue'
  return 'green'
}

function getProgressTone(tone: 'green' | 'amber' | 'red' | 'blue'): 'green' | 'amber' | 'red' {
  if (tone === 'blue') return 'green'
  return tone
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

function eventMatchesDay(
  event: { startDay: number; endDay?: number; startMonth: number; startYear: number; endMonth: number; endYear: number },
  month: number,
  year: number,
  day: number,
) {
  if (!eventOverlapsMonth(event, month, year)) return false

  const startsThisMonth = event.startMonth === month && event.startYear === year
  const endsThisMonth = event.endMonth === month && event.endYear === year

  if (startsThisMonth && endsThisMonth) return day >= event.startDay && day <= (event.endDay ?? event.startDay)
  if (startsThisMonth) return day >= event.startDay
  if (endsThisMonth) return day <= (event.endDay ?? event.startDay)
  return true
}

export function TournamentCalendarPage() {
  const { gameState, enterTournament } = useGame()
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
        if (!uniqueMonths.has(key)) {
          uniqueMonths.set(key, {
            label: `${monthLongLabels[event.startMonth]} ${event.startYear}`,
            month: event.startMonth,
            year: event.startYear,
          })
        }
      })

    return Array.from(uniqueMonths.values())
  }, [calendarData.events])
  const currentDate = new Date(`${gameState.currentDate}T00:00:00`)
  const defaultMonthIndex = Math.max(0, monthOptions.findIndex((option) => option.month === currentDate.getMonth() && option.year === currentDate.getFullYear()))
  const [monthIndex, setMonthIndex] = useState(defaultMonthIndex)
  const [levelFilter, setLevelFilter] = useState<CalendarLevelFilter>('All Tours')
  const [selectedTournamentId, setSelectedTournamentId] = useState(gameState.tournaments.find((event) => event.status === 'Entered')?.id ?? gameState.tournaments[0]?.id ?? '')
  const activeMonth = monthOptions[monthIndex] ?? monthOptions[0]
  const visibleEvents = useMemo(
    () => calendarData.events.filter((event) => (
      eventOverlapsMonth(event, activeMonth.month, activeMonth.year)
      && (levelFilter === 'All Tours' || getTournamentLevel(event.stageId) === levelFilter)
    )),
    [activeMonth.month, activeMonth.year, calendarData.events, levelFilter],
  )
  const selectedTournament = gameState.tournaments.find(
    (event) => event.id === selectedTournamentId && visibleEvents.some((calendarEvent) => calendarEvent.id === event.id),
  ) ?? gameState.tournaments.find((event) => event.id === visibleEvents[0]?.id) ?? null
  const selectedCalendarEvent = selectedTournament
    ? visibleEvents.find((event) => event.id === selectedTournament.id) ?? visibleEvents[0] ?? null
    : visibleEvents[0] ?? null
  const selectedEventDetail = selectedTournament ? calendarData.getDetail(selectedTournament.id) : null

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tournaments"
        title="Tournament Calendar"
        description="July to June pathway calendar with separate junior, amateur, Q Tour, Q School, main-tour, and legacy views. Multi-day events stay visible for their full span."
        actions={
          <div className="flex items-center gap-3">
            <ActionButton tone="secondary" icon={<CalendarDays className="h-4 w-4" />} onClick={() => setMonthIndex(defaultMonthIndex)}>Today</ActionButton>
            <ActionButton tone="secondary" icon={<ChevronLeft className="h-4 w-4" />} onClick={() => setMonthIndex((value) => Math.max(0, value - 1))}>Previous</ActionButton>
            <ActionButton tone="secondary" icon={<ChevronRight className="h-4 w-4" />} onClick={() => setMonthIndex((value) => Math.min(monthOptions.length - 1, value + 1))}>Next</ActionButton>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_360px]">
        <div className="space-y-6">
          <SectionCard title={activeMonth.label} subtitle="The calendar now separates junior pathway, amateur, Q Tour, Q School, main-tour, and legacy schedules across the full season.">
            <div className="mb-4 flex flex-wrap gap-2">
              {levelFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setLevelFilter(filter)}
                  className={`rounded-full border px-3 py-2 text-sm font-semibold ${levelFilter === filter ? 'border-scm-green/40 bg-scm-green/15 text-emerald-200' : 'border-scm-border bg-scm-panelSoft text-scm-textSoft hover:border-scm-green/35 hover:text-scm-text'}`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 text-xs uppercase tracking-[0.16em] text-scm-textMuted">
              {dayLabels.map((label) => (
                <div key={label} className="rounded-xl border border-scm-border bg-scm-panelSoft px-3 py-2 text-center">{label}</div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {calendarCells.map((cell, index) => {
                const events = cell.inMonth
                  ? visibleEvents.filter((event) => eventMatchesDay(event, activeMonth.month, activeMonth.year, cell.label))
                  : []

                return (
                  <div key={`${cell.label}-${index}`} className={`min-h-[122px] rounded-2xl border p-3 ${cell.inMonth ? 'border-scm-border bg-scm-panel' : 'border-scm-border/40 bg-scm-panelSoft/60 text-scm-textMuted'}`}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span>{cell.label}</span>
                      {events.length > 1 && <span className="text-xs text-scm-textMuted">{events.length} events</span>}
                    </div>
                    <div className="space-y-2">
                      {events.slice(0, 3).map((event) => (
                        <button key={event.id} type="button" onClick={() => setSelectedTournamentId(event.id)} className={`w-full rounded-xl border px-2.5 py-2 text-left text-xs leading-5 ${accentClasses[event.accent as keyof typeof accentClasses]}`}>
                          <p className="font-semibold">{event.tourCircuit}</p>
                          <p>{event.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionCard>

          <SectionCard title="Upcoming Events" subtitle="Estimated costs include entry, travel, and expected lodging.">
            <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3 text-sm text-scm-textSoft">
              <div className="flex items-center gap-3">
                <StatusBadge tone="blue">{levelFilter}</StatusBadge>
                <span>{visibleEvents.length} visible in {activeMonth.label}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-scm-border px-3 py-2 text-scm-textMuted">
                <Search className="h-4 w-4" />
                <span>Filter by month and tour level</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-[0.16em] text-scm-textMuted">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Event</th>
                    <th className="px-3 py-2">Tour</th>
                    <th className="px-3 py-2">Location</th>
                    <th className="px-3 py-2 text-right">Entry</th>
                    <th className="px-3 py-2 text-right">Travel</th>
                    <th className="px-3 py-2 text-right">Prize Fund</th>
                    <th className="px-3 py-2 text-right">Ranking Type</th>
                    <th className="px-3 py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleEvents.length === 0 ? (
                    <tr className="border-t border-scm-border">
                      <td colSpan={9} className="px-3 py-6 text-center text-sm text-scm-textSoft">No events match this month and pathway-tour filter.</td>
                    </tr>
                  ) : null}
                  {visibleEvents.map((event) => {
                    const liveStatus = liveTournamentsById.get(event.id)?.status ?? event.status
                    return (
                      <tr key={event.id} className={`cursor-pointer border-t border-scm-border ${event.id === selectedTournament?.id ? 'bg-scm-gold/10' : ''}`} onClick={() => setSelectedTournamentId(event.id)}>
                        <td className="px-3 py-3 text-scm-textSoft">{formatEventDates(event.startDay, event.endDay, event.startMonth, event.endMonth)}</td>
                        <td className="px-3 py-3 font-medium text-scm-text">{event.name}</td>
                        <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs ${accentClasses[event.accent as keyof typeof accentClasses]}`}>{event.tourCircuit}</span></td>
                        <td className="px-3 py-3 text-scm-textSoft">{event.location}</td>
                        <td className="px-3 py-3 text-right text-scm-text">{formatMoney(event.entryFee)}</td>
                        <td className="px-3 py-3 text-right text-scm-text">{formatMoney(event.travelCost + event.hotelCost)}</td>
                        <td className="px-3 py-3 text-right text-scm-text">{formatMoney(event.totalPrizeFund)}</td>
                        <td className="px-3 py-3 text-right text-scm-text">{event.rankingType}</td>
                        <td className="px-3 py-3 text-right"><StatusBadge tone={getStatusTone(liveStatus)}>{liveStatus}</StatusBadge></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Event Details" subtitle="Selected event costs, pathway impact, and reward structure.">
            {!selectedTournament || !selectedCalendarEvent || !selectedEventDetail ? (
              <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4 text-sm text-scm-textSoft">
                No events match the current month and tour filter. Switch month or choose another pathway level to continue planning.
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-scm-gold/40 bg-scm-panelSoft p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-scm-gold">{selectedCalendarEvent.pathwayTier}</p>
                      <h3 className="mt-2 text-2xl font-semibold text-scm-text">{selectedTournament.name}</h3>
                      <p className="mt-2 text-sm text-scm-textSoft">{formatEventDates(selectedCalendarEvent.startDay, selectedCalendarEvent.endDay, selectedCalendarEvent.startMonth, selectedCalendarEvent.endMonth)} · {selectedTournament.location}</p>
                    </div>
                    <div className="rounded-full border border-scm-gold/40 p-3 text-scm-gold"><CalendarDays className="h-6 w-6" /></div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Tour / Circuit</p><p className="mt-1 text-scm-text">{selectedTournament.tourCircuit ?? selectedCalendarEvent.tourCircuit}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Ranking Type</p><p className="mt-1 text-scm-text">{selectedTournament.rankingType ?? selectedCalendarEvent.rankingType}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Format</p><p className="mt-1 text-scm-text">{selectedTournament.format}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Pathway Tier</p><p className="mt-1 text-scm-text">{selectedTournament.pathwayTier ?? selectedCalendarEvent.pathwayTier}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Prize Fund</p><p className="mt-1 text-scm-text">{formatMoney(selectedTournament.totalPrizeFund ?? selectedCalendarEvent.totalPrizeFund)}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Winner Prize</p><p className="mt-1 text-scm-text">{formatMoney(selectedTournament.winnerPrize ?? selectedCalendarEvent.winnerPrize)}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Entry Fee</p><p className="mt-1 text-scm-text">{formatMoney(selectedTournament.entryFee)}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Est. Total Cost</p><p className="mt-1 text-rose-300">{formatMoney(selectedTournament.entryFee + selectedTournament.travelCost + selectedTournament.hotelCost)}</p></div>
                </div>

                <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4 text-sm text-scm-textSoft">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Event Summary</p>
                  <p className="mt-3 leading-7">{`${selectedTournament.name} runs from ${formatEventDates(selectedCalendarEvent.startDay, selectedCalendarEvent.endDay, selectedCalendarEvent.startMonth, selectedCalendarEvent.endMonth)} on the ${selectedTournament.tourCircuit ?? selectedCalendarEvent.tourCircuit}, uses ${selectedTournament.rankingType ?? selectedCalendarEvent.rankingType} ranking logic, and is designed to ${selectedTournament.progressionImpact ?? selectedCalendarEvent.progressionImpact}`}</p>
                </div>

                <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4 text-sm text-scm-textSoft">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Access Rule</p>
                  <p className="mt-3">{selectedTournament.unlockRequirement ?? selectedCalendarEvent.unlockRequirement}</p>
                  <p className="mt-3 text-scm-text">{selectedTournament.reward ?? selectedCalendarEvent.reward ?? selectedTournament.progressionImpact ?? selectedCalendarEvent.progressionImpact}</p>
                </div>

                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                  <p className="font-semibold">{selectedEventDetail.alertTitle}</p>
                  <p className="mt-2">{selectedEventDetail.alertText}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {selectedEventDetail.decisionImpact.map((item) => (
                    <div key={item.label} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4 text-center">
                      <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{item.label}</p>
                      <p className={`mt-2 text-xl font-semibold ${item.tone === 'green' ? 'text-emerald-300' : item.tone === 'amber' ? 'text-amber-300' : 'text-rose-300'}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  {selectedEventDetail.progressMeters.map((meter) => (
                    <div key={meter.label}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-scm-textSoft">{meter.label}</span>
                        <span className="text-scm-text">{meter.detail}</span>
                      </div>
                      <ProgressBar value={(meter.value / meter.max) * 100} tone={getProgressTone(meter.tone)} />
                    </div>
                  ))}
                </div>

                {!equipmentReady ? (
                  <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-100">
                    Tournament entry is locked until a cue, chalk, and tip are equipped.
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <ActionButton className="justify-center" onClick={() => equipmentReady ? enterTournament(selectedTournament.id) : navigate('/equipment/cues')}>{equipmentReady ? 'Enter Event' : 'Open Equipment'}</ActionButton>
                  <ActionButton tone="secondary" className="justify-center" onClick={() => navigate('/travel')}>Travel Plan</ActionButton>
                  <ActionButton tone="secondary" className="justify-center" onClick={() => navigate('/finance')}>View Budget</ActionButton>
                  <ActionButton tone="secondary" className="justify-center" onClick={() => typeof window !== 'undefined' && window.print()}>Export Calendar</ActionButton>
                </div>
              </>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}