import { useNavigate } from 'react-router-dom'
import { Activity, AlertTriangle, BrainCircuit, HeartPulse, ShieldAlert, Target } from 'lucide-react'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/GameStateContext'

const metricIcons = [Activity, HeartPulse, BrainCircuit, Activity, ShieldAlert, Target]

function average(values: number[]) {
  if (values.length === 0) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

export function TrainingReportPage() {
  const { gameState } = useGame()
  const navigate = useNavigate()
  const currentCoach = gameState.coaches.find((coach) => coach.id === gameState.currentCoachId)
  const technicalAverage = average(Object.values(gameState.attributes.technical))
  const mentalAverage = average(Object.values(gameState.attributes.mental))
  const physicalAverage = average(Object.values(gameState.attributes.physical))
  const reportMetrics = [
    { label: 'Confidence', value: `${gameState.player.confidence}%`, subtitle: 'Current live value', tone: 'text-green-400' },
    { label: 'Fatigue', value: `${gameState.player.fatigue}%`, subtitle: 'Recovery pressure', tone: gameState.player.fatigue >= 70 ? 'text-red-400' : 'text-amber-400' },
    { label: 'Morale', value: `${gameState.player.morale}%`, subtitle: 'Current morale', tone: 'text-green-400' },
    { label: 'Technical Avg', value: technicalAverage, subtitle: 'Technical profile', tone: 'text-sky-400' },
    { label: 'Mental Avg', value: mentalAverage, subtitle: 'Mental profile', tone: 'text-sky-400' },
    { label: 'Physical Avg', value: physicalAverage, subtitle: 'Physical profile', tone: 'text-amber-400' },
  ]
  const reportGains = [
    { label: 'Long Potting', current: gameState.attributes.technical['Long Potting'], change: gameState.trainingAppliedWeek === gameState.week ? 2 : 0 },
    { label: 'Cue Ball Control', current: gameState.attributes.technical['Cue Ball Control'], change: gameState.trainingAppliedWeek === gameState.week ? 1 : 0 },
    { label: 'Break Building', current: gameState.attributes.technical['Break Building'], change: gameState.trainingAppliedWeek === gameState.week ? 1 : 0 },
    { label: 'Focus', current: gameState.attributes.mental.Focus, change: gameState.trainingAppliedWeek === gameState.week ? 1 : 0 },
    { label: 'Stamina', current: gameState.attributes.physical.Stamina, change: gameState.trainingAppliedWeek === gameState.week ? 1 : 0 },
  ]
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
  const nextFocus = reportGains.slice().sort((left, right) => left.current - right.current).map((item) => item.label)
  const trainingRecoveryAdvice = [
    gameState.player.fatigue >= 60 ? 'Reduce one heavy session and add recovery early in the week.' : 'Keep the current rhythm but protect one full recovery block.',
    `Primary development focus should stay on ${nextFocus[0] ?? 'match sharpness'}.`,
    'Avoid stacking technical intensity and mental pressure sessions on consecutive days.',
  ]

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase text-gray-500">Training</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Weekly Training Report</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-400">End-of-week feedback for {gameState.player.fullName}: gains, fatigue, and next-focus guidance before competition.</p>
        </div>
        <button type="button" onClick={() => navigate('/training')} className="btn-primary shrink-0 text-xs">View Next Week Plan</button>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {reportMetrics.map((metric, index) => {
          const Icon = metricIcons[index]
          return (
            <div key={metric.label} className="card card-body text-center">
              <Icon className="mx-auto mb-1 h-4 w-4 text-gray-500" />
              <p className="metric-label">{metric.label}</p>
              <p className={`mt-1 text-lg font-bold ${metric.tone}`}>{metric.value}</p>
              <p className="truncate text-[10px] text-gray-400">{metric.subtitle}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="card">
              <div className="card-header"><h3 className="text-sm font-semibold text-white">Attribute Improvement</h3></div>
              <div className="card-body space-y-3">
                {reportGains.map((gain) => (
                  <div key={gain.label}>
                    <div className="mb-1 flex justify-between text-xs"><span className="text-gray-400">{gain.label}</span><span className="text-white">{gain.current} <span className={gain.change > 0 ? 'text-green-400' : 'text-gray-500'}>{gain.change > 0 ? `+${gain.change}` : '+0'}</span></span></div>
                    <ProgressBar value={gain.current} tone={gain.current >= 75 ? 'green' : gain.current >= 65 ? 'amber' : 'red'} compact />
                  </div>
                ))}
              </div>
            </div>

            <div className="card card-body">
              <h3 className="mb-3 text-sm font-semibold text-white">Coach Notes</h3>
              <p className="text-xs leading-relaxed text-gray-300">{currentCoach ? `${currentCoach.name} sees the clearest next gains in ${nextFocus.slice(0, 2).join(' and ')}. ${gameState.lastAction}` : gameState.lastAction}</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-light text-xs font-bold text-white">{currentCoach?.name.split(' ').map((part) => part[0]).join('').slice(0, 2) ?? 'ST'}</div>
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{currentCoach?.name ?? 'Support Team'}</p><p className="text-xs text-green-400">{currentCoach?.type ?? 'No active coach'}</p></div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3 className="text-sm font-semibold text-white">Drill Performance</h3></div>
              <div className="card-body space-y-3">
                {reportGains.map((gain) => {
                  const performance = Number(((gain.current + gain.change * 5) / 10).toFixed(1))
                  return (
                    <div key={gain.label}>
                      <div className="mb-1 flex justify-between text-xs"><span className="text-gray-400">{gain.label}</span><span className={performance >= 8 ? 'text-green-400' : 'text-amber-400'}>{performance.toFixed(1)}</span></div>
                      <ProgressBar value={performance * 10} tone={performance >= 8 ? 'green' : 'amber'} compact />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="card">
              <div className="card-header"><h3 className="text-sm font-semibold text-white">Condition</h3></div>
              <div className="card-body space-y-3">
                {[
                  { label: 'Confidence', value: gameState.player.confidence, tone: 'green' as const },
                  { label: 'Fatigue', value: gameState.player.fatigue, tone: 'amber' as const },
                  { label: 'Morale', value: gameState.player.morale, tone: 'blue' as const },
                  { label: 'Match Fitness', value: Math.max(0, 100 - gameState.player.fatigue), tone: 'green' as const },
                ].map((condition) => (
                  <div key={condition.label}>
                    <div className="mb-1 flex justify-between text-xs"><span className="text-gray-400">{condition.label}</span><span className="text-white">{condition.value}%</span></div>
                    <ProgressBar value={condition.value} tone={condition.tone} compact />
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3 className="text-sm font-semibold text-white">Training Load</h3></div>
              <div className="card-body h-[230px]">
                <ResponsiveContainer>
                  <LineChart data={trainingLoadChart}>
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip contentStyle={{ background: '#141e2a', border: '1px solid #1e2d3d', borderRadius: 8, fontSize: 10 }} />
                    <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="optimal" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3 className="text-sm font-semibold text-white">Category Gains</h3></div>
              <div className="card-body h-[230px]">
                <ResponsiveContainer>
                  <BarChart data={trainingCategoryGains}>
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip contentStyle={{ background: '#141e2a', border: '1px solid #1e2d3d', borderRadius: 8, fontSize: 10 }} />
                    <Bar dataKey="value" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-4">
          <div className="card card-body">
            <div className="flex items-start gap-3 rounded-lg border border-red-600/30 bg-red-600/10 p-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <p className="text-xs leading-relaxed text-red-100">{gameState.player.fatigue >= 65 ? 'Load has been productive, but fatigue is now high enough to compromise freshness if next week is not adjusted.' : 'The current load is manageable, but recovery should stay in the weekly plan to protect match readiness.'}</p>
            </div>
          </div>

          <div className="card card-body">
            <h3 className="mb-3 text-xs font-semibold text-white">Recommended Next Focus</h3>
            <div className="space-y-3 text-xs">
              <div><p className="text-[10px] uppercase text-gray-500">Primary Focus</p><p className="mt-1 text-lg text-white">{gameState.player.fatigue >= 60 ? 'Recovery and Sharpness' : nextFocus[0]}</p></div>
              <div><p className="text-[10px] uppercase text-gray-500">Secondary Focus</p><p className="mt-1 text-white">{nextFocus[1] ?? 'Match Readiness'}</p></div>
              <div><p className="text-[10px] uppercase text-gray-500">Tertiary Focus</p><p className="mt-1 text-white">{nextFocus[2] ?? 'Match Readiness'}</p></div>
            </div>
          </div>

          <div className="card card-body">
            <h3 className="mb-3 text-xs font-semibold text-white">Recovery Advice</h3>
            <div className="space-y-2">
              {trainingRecoveryAdvice.map((item) => (
                <div key={item} className="flex items-start gap-2 text-xs text-gray-300"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />{item}</div>
              ))}
            </div>
          </div>

          <button type="button" className="btn-primary w-full justify-center py-3" onClick={() => navigate('/training')}>View Next Week Plan</button>
        </div>
      </div>
    </div>
  )
}