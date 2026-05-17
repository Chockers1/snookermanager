import { useNavigate } from 'react-router-dom'
import { Activity, AlertTriangle, BrainCircuit, HeartPulse, ShieldAlert, Target } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { CircularMeter } from '../components/ui/CircularMeter'
import { MetricCard } from '../components/ui/MetricCard'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SectionCard } from '../components/ui/SectionCard'
import { useGame } from '../context/GameStateContext'

const metricIcons = [Activity, HeartPulse, BrainCircuit, Activity, ShieldAlert, Target]

export function TrainingReportPage() {
  const { gameState } = useGame()
  const navigate = useNavigate()
  const currentCoach = gameState.coaches.find((coach) => coach.id === gameState.currentCoachId)
  const technicalAverage = Math.round(Object.values(gameState.attributes.technical).reduce((sum, value) => sum + value, 0) / Object.values(gameState.attributes.technical).length)
  const mentalAverage = Math.round(Object.values(gameState.attributes.mental).reduce((sum, value) => sum + value, 0) / Object.values(gameState.attributes.mental).length)
  const physicalAverage = Math.round(Object.values(gameState.attributes.physical).reduce((sum, value) => sum + value, 0) / Object.values(gameState.attributes.physical).length)
  const reportMetrics = [
    { label: 'Confidence', value: `${gameState.player.confidence}%`, subtitle: 'Current live value', tone: 'green' as const },
    { label: 'Fatigue', value: `${gameState.player.fatigue}%`, subtitle: 'Recovery pressure', tone: 'amber' as const },
    { label: 'Morale', value: `${gameState.player.morale}%`, subtitle: 'Current morale', tone: 'green' as const },
    { label: 'Technical Avg', value: technicalAverage, subtitle: 'Technical profile', tone: 'blue' as const },
    { label: 'Mental Avg', value: mentalAverage, subtitle: 'Mental profile', tone: 'blue' as const },
    { label: 'Physical Avg', value: physicalAverage, subtitle: 'Physical profile', tone: 'amber' as const },
  ]
  const reportGains = [
    { label: 'Long Potting', current: gameState.attributes.technical['Long Potting'], change: gameState.trainingAppliedWeek === gameState.week ? 2 : 0 },
    { label: 'Cue Ball Control', current: gameState.attributes.technical['Cue Ball Control'], change: gameState.trainingAppliedWeek === gameState.week ? 1 : 0 },
    { label: 'Break Building', current: gameState.attributes.technical['Break Building'], change: gameState.trainingAppliedWeek === gameState.week ? 1 : 0 },
    { label: 'Focus', current: gameState.attributes.mental.Focus, change: gameState.trainingAppliedWeek === gameState.week ? 1 : 0 },
    { label: 'Stamina', current: gameState.attributes.physical.Stamina, change: gameState.trainingAppliedWeek === gameState.week ? 1 : 0 },
  ]
  const trainingCondition = [
    { label: 'Confidence', value: gameState.player.confidence, subtitle: gameState.player.confidence >= 75 ? 'High' : 'Stable', tone: 'green' as const },
    { label: 'Fatigue', value: gameState.player.fatigue, subtitle: gameState.player.fatigue >= 70 ? 'Heavy' : gameState.player.fatigue >= 45 ? 'Managed' : 'Fresh', tone: gameState.player.fatigue >= 70 ? 'red' as const : 'amber' as const },
    { label: 'Morale', value: gameState.player.morale, subtitle: gameState.player.morale >= 70 ? 'Positive' : 'Mixed', tone: 'blue' as const },
    { label: 'Match Fitness', value: Math.max(0, 100 - gameState.player.fatigue), subtitle: 'Ready state', tone: 'green' as const },
  ]
  const nextFocus = reportGains.slice().sort((left, right) => left.current - right.current).map((item) => item.label)
  const drillPerformance = reportGains.map((gain) => ({
    drill: gain.label,
    performance: Number(((gain.current + gain.change * 5) / 10).toFixed(1)),
  }))
  const trainingLoadChart = Array.from({ length: 7 }, (_, index) => ({
    label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
    value: Math.max(30, Math.min(95, 58 + (index % 3) * 8 - (gameState.player.fatigue > 60 ? 6 : 0))),
    optimal: 64,
  }))
  const trainingCategoryGains = [
    { label: 'Technical', value: Math.max(1, Math.round(technicalAverage / 25)) },
    { label: 'Mental', value: Math.max(1, Math.round(mentalAverage / 28)) },
    { label: 'Physical', value: Math.max(1, Math.round(physicalAverage / 30)) },
  ]
  const trainingRecoveryAdvice = [
    gameState.player.fatigue >= 60 ? 'Reduce one heavy session and add more recovery time early in the week.' : 'Keep the current training rhythm but protect one full recovery block.',
    `Primary development focus should stay on ${nextFocus[0] ?? 'match sharpness'}.`,
    'Avoid stacking technical intensity and mental pressure sessions on consecutive days.',
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Training"
        title="Weekly Training Report"
        description={`Training week report for ${gameState.player.fullName}. End-of-week feedback, gains, fatigue, and next-focus guidance before competition.`}
        actions={<ActionButton onClick={() => navigate('/training')}>View Next Week Plan</ActionButton>}
      />

      <div className="grid gap-4 xl:grid-cols-6">
        {reportMetrics.map((metric, index) => {
          const Icon = metricIcons[index]
          return <MetricCard key={metric.label} label={metric.label} value={metric.value} subValue={metric.subtitle} tone={metric.tone} icon={<Icon className="h-5 w-5" />} />
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_320px]">
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-3">
            <SectionCard title="Attribute Improvement" subtitle="Current ratings and change this week.">
              <div className="space-y-4">
                {reportGains.map((gain) => (
                  <div key={gain.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-scm-textSoft">{gain.label}</span>
                      <span className="text-scm-text">{gain.current} <span className={gain.change > 0 ? 'text-emerald-300' : 'text-scm-textMuted'}>{gain.change > 0 ? `+${gain.change}` : '+0'}</span></span>
                    </div>
                    <ProgressBar value={gain.current} tone={gain.current >= 75 ? 'green' : gain.current >= 65 ? 'amber' : 'red'} />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Coach Notes" subtitle="Head coach review">
              <p className="text-sm leading-7 text-scm-textSoft">{currentCoach ? `${currentCoach.name} sees the clearest next gains in ${nextFocus.slice(0, 2).join(' and ')}. ${gameState.lastAction}` : gameState.lastAction}</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-scm-panelSoft text-scm-text">{currentCoach?.name.split(' ').map((part) => part[0]).join('').slice(0, 2) ?? 'ST'}</div>
                <div>
                  <p className="font-semibold text-scm-text">{currentCoach?.name ?? 'Support Team'}</p>
                  <p className="text-sm text-scm-green">{currentCoach?.type ?? 'No active coach'}</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Drill Performance" subtitle="Weekly execution quality across the main session types.">
              <div className="space-y-4">
                {drillPerformance.map((drill) => (
                  <div key={drill.drill}>
                    <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textSoft">{drill.drill}</span><span className={drill.performance >= 8 ? 'text-emerald-300' : 'text-amber-300'}>{drill.performance.toFixed(1)}</span></div>
                    <ProgressBar value={drill.performance * 10} tone={drill.performance >= 8 ? 'green' : 'amber'} />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr_0.95fr]">
            <SectionCard title="Weekly Load & Condition" subtitle="Compared to last week">
              <div className="grid gap-4 md:grid-cols-2">
                {trainingCondition.map((condition) => (
                  <div key={condition.label} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4 text-center">
                    <CircularMeter value={Math.min(condition.value, 100)} label={condition.label} />
                    <p className={`mt-3 font-semibold ${condition.tone === 'red' ? 'text-rose-300' : condition.tone === 'amber' ? 'text-amber-300' : condition.tone === 'blue' ? 'text-sky-300' : 'text-emerald-300'}`}>{condition.subtitle}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Training Load Over The Week" subtitle="Load units versus ideal range">
              <div className="h-[240px] w-full">
                <ResponsiveContainer>
                  <LineChart data={trainingLoadChart}>
                    <CartesianGrid stroke="#203449" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} width={40} />
                    <Tooltip contentStyle={{ backgroundColor: '#102033', border: '1px solid #31506f', borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={3} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="optimal" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Attribute Gains By Category" subtitle="This week">
              <div className="h-[240px] w-full">
                <ResponsiveContainer>
                  <BarChart data={trainingCategoryGains}>
                    <CartesianGrid stroke="#203449" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} width={40} />
                    <Tooltip contentStyle={{ backgroundColor: '#102033', border: '1px solid #31506f', borderRadius: '12px' }} />
                    <Bar dataKey="value" fill="#7ad34b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard title="Warning" subtitle="Fatigue risk rising after heavy training week.">
            <div className="flex items-start gap-3 rounded-xl border border-scm-red/35 bg-scm-red/10 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-scm-red" />
              <p className="text-sm text-rose-100">{gameState.player.fatigue >= 65 ? 'Load has been productive, but fatigue is now high enough to compromise freshness if the next week is not adjusted.' : 'The current load is manageable, but recovery should still stay in the weekly plan to protect match readiness.'}</p>
            </div>
          </SectionCard>

          <SectionCard title="Recommended Next Focus" subtitle="Primary, secondary, and tertiary emphasis">
            <div className="space-y-4 text-sm text-scm-textSoft">
              <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Primary Focus</p><p className="mt-1 text-xl text-scm-text">{gameState.player.fatigue >= 60 ? 'Recovery & Sharpness' : nextFocus[0]}</p></div>
              <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Secondary Focus</p><p className="mt-1 text-scm-text">{nextFocus[1] ?? 'Match Readiness'}</p></div>
              <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Tertiary Focus</p><p className="mt-1 text-scm-text">{nextFocus[2] ?? 'Match Readiness'}</p></div>
            </div>
          </SectionCard>

          <SectionCard title="Recovery Advice" subtitle="Suggested next-week adjustments">
            <ul className="space-y-3 text-sm text-scm-textSoft">
              {trainingRecoveryAdvice.map((item) => (
                <li key={item} className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-scm-green" />{item}</li>
              ))}
            </ul>
          </SectionCard>

          <ActionButton className="w-full justify-center py-4" onClick={() => navigate('/training')}>View Next Week Plan</ActionButton>
        </div>
      </div>
    </div>
  )
}