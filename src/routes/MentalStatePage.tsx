import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Brain, BrainCircuit, Check, ChevronRight, Flame, ShieldAlert, Target } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/GameStateContext'
import { buildMentalStateData } from '../utils/liveRouteData'

function toneClass(tone: 'green' | 'amber' | 'red') {
  if (tone === 'red') return 'text-red-400'
  if (tone === 'amber') return 'text-amber-400'
  return 'text-green-400'
}

function progressTone(value: number): 'green' | 'amber' | 'red' {
  if (value >= 70) return 'green'
  if (value >= 50) return 'amber'
  return 'red'
}

export function MentalStatePage() {
  const { gameState, applyRecoveryPlan, continueWeek } = useGame()
  const navigate = useNavigate()
  const mentalData = buildMentalStateData(gameState)
  const [selectedPlanTitle, setSelectedPlanTitle] = useState(mentalData.actionPlan[0]?.title ?? '')

  return (
    <div className="-m-6 flex h-[calc(100vh-5.5rem)] min-h-0 flex-col gap-2 overflow-hidden p-1.5">
      <div className="rounded-xl border border-border bg-surface/85 px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">Support</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight text-white">Mental State & Slump Recovery</h1>
            <p className="mt-1 truncate text-xs text-gray-400">Monitor psychological condition, diagnose blockers, and apply recovery strategies.</p>
          </div>
          <button type="button" className="btn-primary shrink-0 px-3 py-2 text-xs" onClick={() => applyRecoveryPlan(selectedPlanTitle)}>Apply Recovery Plan <ChevronRight className="h-3 w-3" /></button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {mentalData.metrics.slice(0, 6).map((metric) => (
          <div key={metric.label} className="card min-h-0 px-3 py-2.5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">{metric.label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{metric.value}%</p>
            <p className={`text-[10px] font-medium ${toneClass(metric.tone)}`}>{metric.detail}</p>
            <div className="mt-2"><ProgressBar value={metric.value} tone={metric.tone} compact /></div>
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-12 gap-2">
        <div className="col-span-8 grid min-h-0 grid-rows-[0.38fr_0.3fr_0.32fr] gap-2">
          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header px-3 py-2"><h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Brain className="h-4 w-4 text-amber-400" /> Diagnosis</h3><span className="text-[10px] text-red-400">Severity {mentalData.diagnosis.severity}%</span></div>
            <div className="card-body flex h-full min-h-0 flex-col gap-2 px-3 py-3">
              <h2 className="text-xl font-bold text-white">{mentalData.diagnosis.title}</h2>
              <p className="text-[11px] leading-relaxed text-gray-400">{mentalData.diagnosis.description}</p>
              <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
                <div className="min-h-0 overflow-auto scrollbar-thin">
                  <p className="mb-1 text-[10px] font-semibold uppercase text-red-400">Contributing Factors</p>
                  <ul className="space-y-1 text-xs text-gray-400">{mentalData.diagnosis.factors.map((factor) => <li key={factor}>{factor}</li>)}</ul>
                </div>
                <div className="rounded-lg border border-border bg-surface-light/40 px-3 py-3 text-center">
                  <p className="mb-1 text-[10px] font-semibold uppercase text-gray-500">Severity</p>
                  <p className="text-2xl font-bold text-amber-400">{mentalData.diagnosis.severity}%</p>
                  <p className="text-xs text-amber-400">Significant impact on performance</p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase text-green-400">Recovery Outlook</p>
                  <p className="text-lg font-bold text-white">{mentalData.diagnosis.recoveryOutlook}</p>
                  <p className="text-xs text-gray-400">{mentalData.diagnosis.recoveryChance}% chance with plan adherence.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header px-3 py-2"><h3 className="text-sm font-semibold text-white">Recommended Action Plan</h3></div>
            <div className="card-body grid h-full min-h-0 grid-cols-3 gap-2 overflow-hidden px-3 py-3">
              {mentalData.actionPlan.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setSelectedPlanTitle(item.title)}
                  className={`min-h-0 rounded-lg border px-3 py-2.5 text-left transition-colors ${selectedPlanTitle === item.title ? 'border-green-600/30 bg-green-600/10' : 'border-transparent bg-surface-light/50 hover:border-border-light'}`}
                >
                  <p className="text-xs font-medium text-white">{item.title}</p>
                  <p className={item.effectTone === 'red' ? 'mt-1 text-[10px] text-red-400' : 'mt-1 text-[10px] text-green-400'}>{item.effect}</p>
                  <div className="mt-1.5 flex gap-2 text-[10px] text-gray-500"><span>Cost: {item.cost}</span><span>Time: {item.time}</span></div>
                  <p className="mt-1.5 line-clamp-3 text-[10px] text-gray-400">{item.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid min-h-0 grid-cols-[1.2fr_0.8fr] gap-2">
            <div className="card min-h-0 flex h-full flex-col overflow-hidden">
              <div className="card-header px-3 py-2"><h3 className="text-sm font-semibold text-white">Mental Trend (Last 6 Weeks)</h3></div>
              <div className="card-body h-full min-h-0 px-2 py-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mentalData.trend}>
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} domain={[0, 100]} width={26} />
                    <Tooltip contentStyle={{ background: '#141e2a', border: '1px solid #1e2d3d', borderRadius: 8, fontSize: 11 }} />
                    <Line type="monotone" dataKey="confidence" stroke="#22c55e" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="focus" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="motivation" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card min-h-0 flex h-full flex-col overflow-hidden px-3 py-3">
              <h3 className="mb-2 text-xs font-semibold text-white">Recovery Plan Progress</h3>
              <div className="min-h-0 flex-1 space-y-2 overflow-auto scrollbar-thin">
                {mentalData.recoveryProgress.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex justify-between text-xs"><span className="text-gray-400">{item.label}</span><span className="text-white">{item.value}%</span></div>
                    <ProgressBar value={item.value} tone={progressTone(item.value)} compact />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-4 grid min-h-0 grid-rows-[0.3fr_0.32fr_0.38fr] gap-2">
          <div className="card min-h-0 flex h-full flex-col overflow-hidden px-3 py-3">
            <h3 className="mb-2 text-xs font-semibold text-white">Recent Triggers</h3>
            <div className="min-h-0 flex-1 space-y-1.5 overflow-auto scrollbar-thin">
              {mentalData.triggers.map((trigger) => <div key={trigger.label} className="flex items-center justify-between rounded bg-surface-light/50 px-2.5 py-2 text-xs"><span className="truncate text-gray-300">{trigger.label}</span><span className="shrink-0 text-gray-500">{trigger.timing}</span></div>)}
            </div>
          </div>

          <div className="card min-h-0 flex h-full flex-col overflow-hidden px-3 py-3">
            <h3 className="mb-2 text-xs font-semibold text-white">Coach / Psychologist Notes</h3>
            <p className="min-h-0 flex-1 overflow-auto text-xs italic leading-relaxed text-gray-400 scrollbar-thin">{mentalData.nextFocus.psychologistNote}</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-light text-xs font-bold text-green-400">JH</div>
              <div><p className="text-xs text-white">Dr. James Holloway</p><p className="text-[10px] text-gray-400">Sports Psychologist</p></div>
            </div>
          </div>

          <div className="card min-h-0 flex h-full flex-col overflow-hidden px-3 py-3">
            <h3 className="mb-2 text-xs font-semibold text-white">Recommended Next Focus</h3>
            <p className="text-lg font-bold text-green-400">{mentalData.nextFocus.title}</p>
            <ul className="mt-2 min-h-0 flex-1 space-y-1 overflow-auto text-xs text-gray-400 scrollbar-thin">
              {mentalData.nextFocus.bullets.map((item) => <li key={item} className="flex items-start gap-1"><Check className="mt-0.5 h-3 w-3 shrink-0 text-green-400" /> <span>{item}</span></li>)}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-amber-600/30 bg-amber-600/10 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-3"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" /><p className="truncate text-xs text-gray-300">Mental fatigue and overthinking are affecting performance. Confidence {gameState.player.confidence}%, fatigue {gameState.player.fatigue}%, morale {gameState.player.morale}%.</p></div>
        <div className="flex shrink-0 gap-2">
          <button type="button" className="btn-primary px-3 py-2 text-xs" onClick={() => applyRecoveryPlan(selectedPlanTitle)}><BrainCircuit className="h-3.5 w-3.5" /> Apply Recovery Plan</button>
          <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => applyRecoveryPlan(mentalData.actionPlan[1]?.title ?? selectedPlanTitle)}><Target className="h-3.5 w-3.5" /> Secondary Focus</button>
          <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => navigate('/training')}><Flame className="h-3.5 w-3.5" /> Adjust Schedule</button>
          <button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={continueWeek}><ShieldAlert className="h-3.5 w-3.5" /> Continue</button>
        </div>
      </div>
    </div>
  )
}