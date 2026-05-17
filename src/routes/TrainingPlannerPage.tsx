import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, CalendarRange, RefreshCcw, Save, WandSparkles } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { CircularMeter } from '../components/ui/CircularMeter'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SectionCard } from '../components/ui/SectionCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useGame } from '../context/GameStateContext'
import { buildTrainingPlannerData } from '../utils/liveRouteData'
import {
  buildAutoTrainingPlan,
  buildRecoveryTrainingPlan,
  buildTrainingCell,
  cloneTrainingPlan,
  getTrainingSessionOptionId,
  summarizeTrainingPlan,
  TRAINING_SESSION_OPTIONS,
  type TrainingSessionKey,
} from '../utils/trainingPlan'

const categoryStyles = {
  Technical: 'border-scm-green/30 bg-scm-green/10 text-emerald-100',
  Mental: 'border-violet-500/30 bg-violet-500/10 text-violet-100',
  Physical: 'border-scm-blue/30 bg-scm-blue/10 text-sky-100',
  'Match Prep': 'border-scm-gold/30 bg-scm-gold/10 text-amber-100',
  Recovery: 'border-indigo-400/30 bg-indigo-400/10 text-indigo-100',
  Travel: 'border-slate-400/30 bg-slate-400/10 text-slate-100',
  Rest: 'border-slate-500/30 bg-slate-500/10 text-slate-100',
}

const accentStyles = {
  green: 'border-scm-green/30 bg-scm-green/10',
  violet: 'border-violet-500/30 bg-violet-500/10',
  blue: 'border-scm-blue/30 bg-scm-blue/10',
  gold: 'border-scm-gold/30 bg-scm-gold/10',
}

export function TrainingPlannerPage() {
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
  const derivedWeekLoad = summary.weekLoad

  useEffect(() => {
    setPlannerWeek(cloneTrainingPlan(plannerData.week))
  }, [gameState.currentDate, gameState.week, gameState.trainingPlan])

  const handleSessionChange = (dayIndex: number, sessionKey: TrainingSessionKey, optionId: string) => {
    setPlannerWeek((currentWeek) => {
      const nextWeek = cloneTrainingPlan(currentWeek)
      nextWeek[dayIndex] = {
        ...nextWeek[dayIndex],
        [sessionKey]: buildTrainingCell(optionId),
      }
      return nextWeek
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Training"
        title="Weekly Training Planner"
        description="Build the week around skill growth, fatigue control, and next-event readiness. Saving the schedule now applies this week’s training effects to the live save."
        actions={
          <div className="flex items-center gap-3">
            <ActionButton tone="secondary" icon={<WandSparkles className="h-4 w-4" />} onClick={() => setPlannerWeek(buildAutoTrainingPlan(gameState.currentDate, gameState.player.fatigue, competitionPlan, plannerData.travelBooked))}>Auto Plan</ActionButton>
            <ActionButton tone="secondary" icon={<RefreshCcw className="h-4 w-4" />} onClick={() => setPlannerWeek(buildRecoveryTrainingPlan(gameState.currentDate, competitionPlan))}>Clear Week</ActionButton>
            <ActionButton tone="secondary" icon={<CalendarRange className="h-4 w-4" />} onClick={() => navigate('/calendar')}>Week</ActionButton>
            <ActionButton icon={<Save className="h-4 w-4" />} onClick={() => applyTrainingPlan(plannerWeek)}>Save Schedule</ActionButton>
          </div>
        }
      />

      <div className="rounded-xl border border-scm-border bg-scm-panel/80 px-4 py-3 text-sm text-scm-textSoft">
        The planner below is the active weekly schedule for the live save. Changes here apply directly to the current career state.
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_320px]">
        <div className="space-y-6">
          <SectionCard title="Competition Commitments" subtitle="Entered tournaments and travel requirements affecting this week.">
            {plannerData.enteredCompetitions.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {plannerData.enteredCompetitions.map((competition) => (
                  <div key={competition.id} className="rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-scm-text">{competition.name}</p>
                        <p className="mt-1 text-sm text-scm-textSoft">{competition.location}</p>
                      </div>
                      <StatusBadge tone={competition.travelBooked ? 'green' : 'amber'}>{competition.travelBooked ? 'Travel Booked' : 'Travel Pending'}</StatusBadge>
                    </div>
                    <p className="mt-3 text-sm text-scm-textSoft">{competition.daysAway <= 0 ? 'Event week is live now.' : `${competition.daysAway} days until start`} · {competition.date}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-scm-textSoft">No entered competitions are currently shaping the planner. Enter tournaments from the calendar or tournament hub to plan around them here.</p>
            )}
          </SectionCard>

          <SectionCard title="Weekly Grid" subtitle="Morning, afternoon, and evening sessions laid out to match the FM-style planner flow.">
            <div className="overflow-x-auto">
              <div className="grid min-w-[1080px] grid-cols-[110px_repeat(7,minmax(0,1fr))] gap-2 text-sm">
                <div />
                {plannerWeek.map((day) => (
                  <div key={day.day} className="rounded-lg bg-scm-deep/80 px-3 py-3 text-center">
                    <p className="text-xs uppercase tracking-[0.18em] text-scm-textMuted">{day.day}</p>
                    <p className="mt-1 font-semibold text-scm-text">{day.dateLabel}</p>
                    {day.competitionName && <p className="mt-2 text-xs text-amber-200">{day.competitionName}</p>}
                  </div>
                ))}

                {[
                  ['Morning', '08:00 - 11:00'],
                  ['Afternoon', '13:00 - 16:00'],
                  ['Evening', '18:00 - 21:00'],
                ].map(([label, time], rowIndex) => (
                  <>
                    <div key={`${label}-label`} className="rounded-lg bg-scm-deep/80 px-3 py-4 text-scm-text">
                      <p className="font-semibold">{label}</p>
                      <p className="mt-1 text-xs text-scm-textMuted">{time}</p>
                    </div>
                    {plannerWeek.map((day, dayIndex) => {
                      const session = rowIndex === 0 ? day.morning : rowIndex === 1 ? day.afternoon : day.evening
                      const sessionKey: TrainingSessionKey = rowIndex === 0 ? 'morning' : rowIndex === 1 ? 'afternoon' : 'evening'
                      return (
                        <div key={`${day.day}-${label}`} className={`rounded-lg border px-3 py-4 ${categoryStyles[session.category]}`}>
                          <select
                            value={getTrainingSessionOptionId(session)}
                            onChange={(event) => handleSessionChange(dayIndex, sessionKey, event.target.value)}
                            className="w-full rounded-md border border-white/15 bg-scm-deep/70 px-2 py-2 text-sm font-semibold text-scm-text focus:border-scm-green/40 focus:outline-none"
                          >
                            {TRAINING_SESSION_OPTIONS.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.title}
                              </option>
                            ))}
                          </select>
                          <p className="mt-2 text-xs opacity-80">{session.subtitle}</p>
                          <div className="mt-3"><StatusBadge tone="slate">{session.category}</StatusBadge></div>
                        </div>
                      )
                    })}
                  </>
                ))}

                <div className="rounded-lg bg-scm-deep/80 px-3 py-3 text-scm-text">
                  <p className="font-semibold">Load</p>
                </div>
                {plannerWeek.map((day) => (
                  <div key={`${day.day}-load`} className="rounded-lg bg-scm-panelSoft px-3 py-3">
                    <ProgressBar value={day.load} tone={day.load > 80 ? 'amber' : day.load > 55 ? 'blue' : 'green'} />
                    <p className="mt-2 text-xs text-scm-textSoft">{day.loadLabel}</p>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
            <SectionCard title="Drill Library" subtitle="Compact drill categories to keep the week composition readable.">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {plannerData.drillLibrary.map((group) => (
                  <div key={group.title} className={`rounded-xl border p-4 ${accentStyles[group.accent]}`}>
                    <p className="font-semibold text-scm-text">{group.title}</p>
                    <div className="mt-4 space-y-3 text-sm">
                      {group.drills.map((drill) => (
                        <div key={drill.name} className="flex items-center justify-between gap-3 text-scm-textSoft">
                          <span>{drill.name}</span>
                          <StatusBadge tone={drill.intensity === 'High' ? 'green' : drill.intensity === 'Medium' ? 'amber' : 'slate'}>{drill.intensity}</StatusBadge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Weekly Summary" subtitle="Snapshot of the current plan balance and workload.">
              <div className="space-y-4 text-sm text-scm-textSoft">
                <div className="flex items-center justify-between"><span>Total Sessions</span><span className="text-scm-text">{summary.totalSessions}</span></div>
                <div className="flex items-center justify-between"><span>Training Load</span><span className="text-scm-text">{summary.weekLoad}%</span></div>
                <div className="flex items-center justify-between"><span>Avg. Session Intensity</span><span className="text-scm-text">{summary.averageIntensity}</span></div>
                <div className="flex items-center justify-between"><span>Rest Sessions</span><span className="text-scm-text">{summary.restSessions}</span></div>
                <div className="flex items-center justify-between"><span>Travel Sessions</span><span className="text-scm-text">{summary.travelSessions}</span></div>
                <div className="border-t border-scm-border pt-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Balance</p>
                  <div className="mt-3 space-y-3">
                    {summary.balance.map((item) => (
                      <div key={item.label}>
                        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-scm-textMuted">
                          <span>{item.label}</span>
                          <span>{item.value}% ({item.sessions})</span>
                        </div>
                        <ProgressBar value={item.value} tone={item.tone === 'violet' ? 'blue' : item.tone} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="space-y-4">
          <SectionCard title="Training Load" subtitle="Week Load">
            <div className="grid grid-cols-7 gap-2">
              {plannerWeek.map((day) => (
                <div key={`${day.day}-bar`} className="text-center">
                  <div className="mx-auto h-20 w-4 rounded-full bg-scm-deep/80">
                    <div className="rounded-full bg-scm-green" style={{ height: `${Math.max(12, day.load)}%`, marginTop: `${100 - Math.max(12, day.load)}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-scm-textMuted">{day.day[0]}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-2xl font-semibold text-scm-text">{derivedWeekLoad}%</p>
            <p className="text-sm text-amber-200">{summary.weekLoadLabel}</p>
          </SectionCard>

          <SectionCard title="Fatigue Risk" subtitle="Monitor recovery on Sat/Sun.">
            <div className="space-y-3">
              <ProgressBar value={summary.fatigueRisk} tone="amber" />
              <div className="flex items-center justify-between text-sm"><span className="text-scm-text">{summary.fatigueRisk}%</span><span className={summary.fatigueTrend <= 0 ? 'text-emerald-300' : 'text-rose-300'}>Trend {summary.fatigueTrend > 0 ? '+' : ''}{summary.fatigueTrend}%</span></div>
            </div>
          </SectionCard>

          <SectionCard title="Expected Attribute Gains" subtitle="This Week">
            <div className="space-y-4">
              {summary.expectedGains.map((gain) => (
                <div key={gain.label}>
                  <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textSoft">{gain.label}</span><span className="text-emerald-300">+{gain.value}</span></div>
                  <ProgressBar value={Math.min(100, gain.value * 14)} tone="green" />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Coach Impact" subtitle={`${currentCoach?.name ?? 'Head Coach'} · Active Coach`}>
            <p className="text-3xl font-semibold text-emerald-300">+{summary.coachImpact}%</p>
            <p className="mt-2 text-sm text-scm-textSoft">Strong focus on technical play and mental resilience this week.</p>
          </SectionCard>

          <SectionCard title="Confidence Impact" subtitle="Projected confidence">
            <div className="flex items-center gap-4">
              <CircularMeter value={86} label="Projected" />
              <div>
                <p className="text-3xl font-semibold text-emerald-300">+{summary.confidenceProjection}%</p>
                <p className="mt-2 text-sm text-scm-textSoft">{summary.confidenceLabel}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Training Balance" subtitle={`${summary.totalSessions} Sessions`}>
            <div className="space-y-3">
              {summary.balance.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-scm-textSoft">{item.label}</span>
                  <span className="text-scm-text">{item.value}% ({item.sessions})</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <ActionButton className="w-full justify-center py-4" icon={<Activity className="h-4 w-4" />} onClick={() => navigate('/training/report')}>Continue</ActionButton>
        </div>
      </div>
    </div>
  )
}