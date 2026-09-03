import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Calendar, Copy, RotateCcw, Save, Zap } from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/useGame'
import { buildTrainingPlannerData } from '../utils/liveRouteData'
import {
  buildAutoTrainingPlan,
  buildRecoveryTrainingPlan,
  buildTrainingCell,
  cloneTrainingPlan,
  getTrainingSessionOption,
  getTrainingSessionOptionId,
  summarizeTrainingPlan,
  TRAINING_SESSION_OPTIONS,
  type TrainingSessionKey,
} from '../utils/trainingPlan'
import type { TrainingCell } from '../types/game'

const sessionRows = [
  { key: 'morning', label: 'Morning', time: '08:00 - 11:00' },
  { key: 'afternoon', label: 'Afternoon', time: '13:00 - 16:00' },
  { key: 'evening', label: 'Evening', time: '18:00 - 21:00' },
] as const

const categoryStyles: Record<TrainingCell['category'], string> = {
  Technical: 'border-green-600/30 bg-green-600/10 text-green-400',
  Mental: 'border-amber-600/30 bg-amber-600/10 text-amber-400',
  Physical: 'border-blue-600/30 bg-blue-600/10 text-blue-400',
  'Match Prep': 'border-violet-600/30 bg-violet-600/10 text-violet-400',
  Recovery: 'border-sky-600/30 bg-sky-600/10 text-sky-400',
  Travel: 'border-gray-500/30 bg-gray-500/10 text-gray-400',
  Rest: 'border-gray-600/30 bg-gray-600/10 text-gray-400',
}

const balanceColors = {
  green: 'bg-green-500',
  violet: 'bg-violet-500',
  blue: 'bg-blue-500',
  gold: 'bg-amber-500',
}

function getCategoryBadgeClass(category: TrainingCell['category']) {
  return `inline-flex rounded border px-1.5 py-0.5 text-[9px] font-medium leading-none ${categoryStyles[category]}`
}

function getLoadPillClass(load: number) {
  if (load >= 30) return 'rounded bg-red-600/20 px-1.5 py-0.5 text-[9px] font-medium text-red-400'
  if (load >= 18) return 'rounded bg-amber-600/20 px-1.5 py-0.5 text-[9px] font-medium text-amber-400'
  return 'rounded bg-green-600/20 px-1.5 py-0.5 text-[9px] font-medium text-green-400'
}

function getLoadLabel(load: number) {
  if (load >= 30) return 'High'
  if (load >= 18) return 'Med'
  return 'Low'
}

function getRiskToneClass(value: number) {
  if (value >= 70) return 'text-red-400'
  if (value >= 50) return 'text-amber-400'
  return 'text-green-400'
}

export function TrainingPlannerPage() {
  const { gameState } = useGame()
  const plannerKey = `${gameState.currentDate}-${gameState.week}-${JSON.stringify(gameState.trainingPlan)}`
  return <TrainingPlannerContent key={plannerKey} />
}

function TrainingPlannerContent() {
  const { gameState, applyTrainingPlan } = useGame()
  const navigate = useNavigate()
  const plannerData = buildTrainingPlannerData(gameState)
  const currentCoach = gameState.coaches.find((coach) => coach.id === gameState.currentCoachId)
  const competitionPlan = plannerData.enteredCompetitions.map((competition) => ({
    name: competition.name,
    location: competition.location,
    startDate: competition.date,
  }))
  const [plannerWeek, setPlannerWeek] = useState(cloneTrainingPlan(plannerData.week))
  const summary = summarizeTrainingPlan(
    plannerWeek,
    { fatigue: gameState.player.fatigue, confidence: gameState.player.confidence },
    gameState.attributes,
    currentCoach?.compatibility ?? 0,
  )
  const nextCompetition = plannerData.enteredCompetitions[0] ?? null
  const weekStart = plannerWeek[0]?.dateLabel ?? gameState.currentDate
  const weekEnd = plannerWeek[plannerWeek.length - 1]?.dateLabel ?? gameState.currentDate
  const visibleCompetitions = plannerData.enteredCompetitions.slice(0, 2)
  const hiddenCompetitionCount = Math.max(0, plannerData.enteredCompetitions.length - visibleCompetitions.length)
  const focusOfWeek = summary.expectedGains[0]
  const supportMetrics = [
    { label: 'Weekly Load', value: `${summary.weekLoad}%`, sub: summary.weekLoadLabel, tone: 'text-white' },
    { label: 'Fatigue Risk', value: `${summary.fatigueRisk}%`, sub: `Trend ${summary.fatigueTrend > 0 ? '+' : ''}${summary.fatigueTrend}%`, tone: getRiskToneClass(summary.fatigueRisk) },
    { label: 'Confidence', value: `+${summary.confidenceProjection}%`, sub: summary.confidenceLabel, tone: 'text-green-400' },
    { label: 'Coach Bonus', value: `+${summary.coachImpact}%`, sub: currentCoach?.name ?? 'No active coach', tone: 'text-green-400' },
  ]

  function handleSessionChange(dayIndex: number, sessionKey: TrainingSessionKey, optionId: string) {
    setPlannerWeek((currentWeek) => {
      const nextWeek = cloneTrainingPlan(currentWeek)
      nextWeek[dayIndex] = { ...nextWeek[dayIndex], [sessionKey]: buildTrainingCell(optionId) }
      return nextWeek
    })
  }

  function handleApplyPlan() {
    applyTrainingPlan(plannerWeek)
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-5.5rem)] min-h-0 flex-col gap-2 overflow-hidden p-1.5">
      <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface/85 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-green-400">Training Planner</p>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-white">Weekly Training Planner</h1>
          <p className="mt-1 truncate text-xs text-gray-400">Week {gameState.week} · {weekStart} - {weekEnd}</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <button type="button" className="btn-secondary px-3 py-1.5 text-[11px]" onClick={() => setPlannerWeek(buildAutoTrainingPlan(gameState.currentDate, gameState.player.fatigue, competitionPlan, plannerData.travelBooked))}><Zap className="h-3.5 w-3.5" /> Auto-Plan</button>
          <button type="button" className="btn-secondary px-3 py-1.5 text-[11px]" onClick={() => setPlannerWeek(buildRecoveryTrainingPlan(gameState.currentDate, competitionPlan))}><RotateCcw className="h-3.5 w-3.5" /> Recovery Plan</button>
          <button type="button" className="btn-secondary px-3 py-1.5 text-[11px]" onClick={() => setPlannerWeek(cloneTrainingPlan(plannerData.week))}><Copy className="h-3.5 w-3.5" /> Reset Week</button>
          <button type="button" className="btn-primary px-3 py-1.5 text-[11px]" onClick={handleApplyPlan}><Save className="h-3.5 w-3.5" /> Apply Plan</button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-12 gap-2">
        <div className="col-span-9 grid min-h-0 grid-rows-[1.44fr_0.34fr_0.54fr] gap-2">
          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Calendar className="h-3.5 w-3.5 text-green-400" /> Weekly Schedule</h3>
              <span className="truncate text-[10px] text-gray-400">{nextCompetition ? `Next Competition: ${nextCompetition.name} · ${nextCompetition.date}` : 'No entered competition this week'}</span>
            </div>
            <div className="card-body flex min-h-0 flex-1 overflow-hidden p-2">
              <div className="grid min-h-0 flex-1 grid-cols-[4.75rem_repeat(7,minmax(0,1fr))] grid-rows-[auto_repeat(3,minmax(0,1fr))] gap-1.5">
                <div />
                {plannerWeek.map((day) => (
                  <div key={`${day.day}-header`} className="rounded-lg border border-border bg-surface-light/40 px-2 py-1.5">
                    <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-white">{day.day}</p>
                    <p className={`mt-0.5 truncate text-[10px] ${day.competitionName ? 'text-amber-400' : 'text-gray-500'}`}>{day.dateLabel}</p>
                  </div>
                ))}
                {sessionRows.map((row) => (
                  <Fragment key={row.key}>
                    <div className="rounded-lg border border-border bg-surface-light/35 px-2 py-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white">{row.label}</p>
                      <p className="mt-0.5 text-[9px] text-gray-500">{row.time}</p>
                    </div>
                    {plannerWeek.map((day, dayIndex) => {
                      const session = day[row.key]
                      const option = getTrainingSessionOption(getTrainingSessionOptionId(session))

                      return (
                        <div key={`${day.day}-${row.key}`} className="min-w-0 rounded-lg border border-border bg-surface-light/50 p-1.5">
                          <select
                            value={getTrainingSessionOptionId(session)}
                            onChange={(event) => handleSessionChange(dayIndex, row.key, event.target.value)}
                            className="w-full rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-medium text-white focus:border-green-500/50 focus:outline-none"
                            title={session.title}
                          >
                            {TRAINING_SESSION_OPTIONS.map((optionItem) => <option key={optionItem.id} value={optionItem.id}>{optionItem.title}</option>)}
                          </select>
                          <div className="mt-1 flex items-center justify-between gap-1.5">
                            <span className={getCategoryBadgeClass(session.category)}>{session.category}</span>
                            <span className={getLoadPillClass(option.load)}>{getLoadLabel(option.load)}</span>
                          </div>
                          <p className="mt-1 truncate text-[9px] text-gray-400">{session.subtitle}</p>
                        </div>
                      )
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="grid min-h-0 grid-cols-4 gap-2">
            {supportMetrics.map((metric) => (
              <div key={metric.label} className="card flex min-h-0 flex-col justify-center p-3 text-center">
                <p className="metric-label">{metric.label}</p>
                <p className={`mt-1 text-lg font-bold ${metric.tone}`}>{metric.value}</p>
                <p className="truncate text-[10px] text-gray-400">{metric.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid min-h-0 grid-cols-2 gap-2">
            <div className="card min-h-0 flex h-full flex-col overflow-hidden">
              <div className="card-header"><h3 className="text-sm font-semibold text-white">Competition Commitments</h3><button type="button" className="text-[10px] text-green-400" onClick={() => navigate('/calendar')}>Calendar</button></div>
              <div className="card-body flex h-full min-h-0 flex-col justify-between gap-2 p-3">
                {visibleCompetitions.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {visibleCompetitions.map((competition) => (
                        <div key={competition.id} className="rounded-lg border border-border bg-surface-light/45 p-2.5 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-white">{competition.name}</p>
                              <p className="mt-0.5 truncate text-[10px] text-gray-400">{competition.date} · {competition.location}</p>
                            </div>
                            <span className={competition.travelBooked ? 'rounded bg-green-600/20 px-1.5 py-0.5 text-[9px] text-green-400' : 'rounded bg-amber-600/20 px-1.5 py-0.5 text-[9px] text-amber-400'}>{competition.travelBooked ? 'Booked' : 'Pending'}</span>
                          </div>
                          <p className="mt-1 truncate text-[10px] text-gray-500">{competition.daysAway <= 0 ? 'Event week is live now' : `${competition.daysAway} days until start`}</p>
                        </div>
                      ))}
                    </div>
                    {hiddenCompetitionCount > 0 ? <p className="text-[10px] text-gray-500">{hiddenCompetitionCount} more competition{hiddenCompetitionCount === 1 ? '' : 's'} shaping the plan.</p> : null}
                  </>
                ) : <p className="text-xs text-gray-400">No entered competitions are currently shaping the week.</p>}
              </div>
            </div>

            <div className="card min-h-0 flex h-full flex-col overflow-hidden">
              <div className="card-header"><h3 className="text-sm font-semibold text-white">Recovery Snapshot</h3><span className="text-[10px] text-gray-400">Plan health</span></div>
              <div className="card-body grid h-full min-h-0 grid-cols-2 gap-x-4 gap-y-2 p-3 text-[10px]">
                <div className="min-w-0"><p className="text-gray-500">Fatigue Risk</p><p className={`mt-1 truncate text-sm font-semibold ${getRiskToneClass(summary.fatigueRisk)}`}>{summary.fatigueRisk}%</p></div>
                <div className="min-w-0"><p className="text-gray-500">Confidence</p><p className="mt-1 truncate text-sm font-semibold text-white">{gameState.player.confidence}%</p></div>
                <div className="min-w-0"><p className="text-gray-500">Recovery Blocks</p><p className="mt-1 truncate text-sm font-semibold text-green-400">{summary.restSessions}</p></div>
                <div className="min-w-0"><p className="text-gray-500">Travel Blocks</p><p className="mt-1 truncate text-sm font-semibold text-white">{summary.travelSessions}</p></div>
                <div className="min-w-0"><p className="text-gray-500">Coach Fit</p><p className="mt-1 truncate text-sm font-semibold text-green-400">+{summary.coachImpact}%</p></div>
                <div className="min-w-0"><p className="text-gray-500">Focus</p><p className="mt-1 truncate text-sm font-semibold text-white">{focusOfWeek?.label ?? 'Balanced'}</p></div>
                <div className="col-span-2 min-w-0 border-t border-border pt-2"><p className="truncate text-[10px] text-gray-400">{currentCoach ? `${currentCoach.name} is adding structure to the week.` : 'No active coach is shaping the plan.'}</p></div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-3 grid min-h-0 grid-rows-[0.84fr_0.62fr_0.72fr_0.72fr_auto] gap-2">
          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header"><h3 className="text-xs font-semibold text-white">Training Load</h3><span className="text-[10px] text-gray-400">This week</span></div>
            <div className="card-body flex h-full min-h-0 flex-col justify-between gap-2 p-3">
              <div className="space-y-2">
                <div><div className="mb-1 flex justify-between text-[10px]"><span className="text-gray-400">Weekly Load</span><span className="text-white">{summary.weekLoad}%</span></div><ProgressBar value={summary.weekLoad} tone={summary.weekLoad >= 80 ? 'red' : summary.weekLoad >= 55 ? 'amber' : 'green'} compact /></div>
                <div><div className="mb-1 flex justify-between text-[10px]"><span className="text-gray-400">Fatigue Impact</span><span className={getRiskToneClass(summary.fatigueRisk)}>{summary.fatigueTrend > 0 ? '+' : ''}{summary.fatigueTrend}%</span></div><ProgressBar value={summary.fatigueRisk} tone={summary.fatigueRisk >= 70 ? 'red' : 'amber'} compact /></div>
                <div><div className="mb-1 flex justify-between text-[10px]"><span className="text-gray-400">Confidence Boost</span><span className="text-green-400">+{summary.confidenceProjection}%</span></div><ProgressBar value={Math.min(100, summary.confidenceProjection * 12)} compact /></div>
                <div><div className="mb-1 flex justify-between text-[10px]"><span className="text-gray-400">Coach Bonus</span><span className="text-green-400">+{summary.coachImpact}%</span></div><ProgressBar value={Math.min(100, summary.coachImpact * 10)} compact /></div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-border pt-2 text-center">
                <div><p className="text-[9px] uppercase tracking-[0.16em] text-gray-500">Sessions</p><p className="mt-1 text-sm font-semibold text-white">{summary.totalSessions}</p></div>
                <div><p className="text-[9px] uppercase tracking-[0.16em] text-gray-500">Intensity</p><p className="mt-1 text-sm font-semibold text-amber-400">{summary.averageIntensity}</p></div>
                <div><p className="text-[9px] uppercase tracking-[0.16em] text-gray-500">Target</p><p className="mt-1 text-sm font-semibold text-green-400">80-90%</p></div>
              </div>
            </div>
          </div>

          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header"><h3 className="text-xs font-semibold text-white">Focus Of The Week</h3></div>
            <div className="card-body flex h-full min-h-0 flex-col gap-2 p-3 text-xs text-gray-400">
              <div className="rounded-lg border border-green-600/20 bg-green-600/10 p-2"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-green-400">Primary</p><p className="mt-1 text-xs font-medium text-white">{focusOfWeek?.label ?? 'Match sharpness'}</p><p className="mt-0.5 text-[10px]">Lean into {focusOfWeek?.label?.toLowerCase() ?? 'pre-match sharpness'} while coach impact sits at +{summary.coachImpact}%.</p></div>
              <div className="rounded-lg border border-amber-600/20 bg-amber-600/10 p-2"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-400">Watch</p><p className="mt-1 text-xs font-medium text-white">Fatigue management</p><p className="mt-0.5 text-[10px]">Risk is {summary.fatigueRisk}%. Recovery blocks protect readiness before the event.</p></div>
            </div>
          </div>

          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header"><h3 className="text-xs font-semibold text-white">Weekly Focus Areas</h3></div>
            <div className="card-body flex h-full min-h-0 flex-col justify-between gap-2 p-3">
              {summary.expectedGains.map((gain) => (
                <div key={gain.label}>
                  <div className="mb-1 flex justify-between text-[10px]"><span className="text-gray-400">{gain.label}</span><span className="text-green-400">+{gain.value}</span></div>
                  <ProgressBar value={Math.min(100, gain.value * 14)} compact />
                </div>
              ))}
            </div>
          </div>

          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header"><h3 className="text-xs font-semibold text-white">Weekly Balance</h3></div>
            <div className="card-body flex h-full min-h-0 flex-col justify-between gap-2 p-3">
              {summary.balance.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-[10px]"><span className="text-gray-400">{item.label}</span><span className="text-white">{item.value}% ({item.sessions})</span></div>
                  <div className="progress-bar h-1.5"><div className={`progress-fill ${balanceColors[item.tone]}`} style={{ width: `${item.value}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          <button type="button" className="btn-primary w-full justify-center py-2.5 text-sm" onClick={() => navigate('/training/report')}><Activity className="h-4 w-4" /> View Training Report</button>
        </div>
      </div>
    </div>
  )
}
