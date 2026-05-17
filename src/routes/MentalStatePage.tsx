import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrainCircuit, Flame, ShieldAlert, Target } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { CircularMeter } from '../components/ui/CircularMeter'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SectionCard } from '../components/ui/SectionCard'
import { useGame } from '../context/GameStateContext'
import { buildMentalStateData } from '../utils/liveRouteData'

function getToneClass(tone: 'green' | 'amber' | 'red') {
  if (tone === 'red') return 'text-rose-300'
  if (tone === 'amber') return 'text-amber-300'
  return 'text-emerald-300'
}

function getProgressTone(value: number): 'green' | 'amber' | 'red' {
  if (value >= 70) return 'green'
  if (value >= 50) return 'amber'
  return 'red'
}

function renderStars(value: number) {
  return Array.from({ length: 5 }, (_, index) => (
    <span key={index} className={index < value ? 'text-scm-gold' : 'text-scm-borderStrong'}>★</span>
  ))
}

export function MentalStatePage() {
  const { gameState, applyRecoveryPlan, continueWeek } = useGame()
  const navigate = useNavigate()
  const mentalData = buildMentalStateData(gameState)
  const [selectedPlanTitle, setSelectedPlanTitle] = useState(mentalData.actionPlan[0]?.title ?? '')

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Support"
        title="Mental State & Slump Recovery"
        description="Monitor psychological condition, diagnose performance blockers, and apply targeted recovery strategies before the next event run."
      />

      <div className="grid gap-4 xl:grid-cols-7">
        {mentalData.metrics.map((metric) => (
          <SectionCard key={metric.label}>
            <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{metric.label}</p>
            <p className={`mt-3 text-4xl font-semibold ${getToneClass(metric.tone)}`}>{metric.value}%</p>
            <p className="mt-2 text-sm text-scm-textSoft">{metric.detail}</p>
            <div className="mt-4"><ProgressBar value={metric.value} tone={metric.tone} /></div>
          </SectionCard>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_360px]">
        <div className="space-y-6">
          <SectionCard>
            <p className="text-xs uppercase tracking-[0.16em] text-scm-green">Diagnosis</p>
            <h2 className="mt-3 text-4xl font-semibold text-rose-300">{mentalData.diagnosis.title}</h2>
            <p className="mt-4 max-w-4xl text-sm leading-7 text-scm-textSoft">{mentalData.diagnosis.description}</p>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_220px_0.95fr]">
              <div>
                <p className="text-sm font-semibold text-scm-green">Contributing Factors</p>
                <ul className="mt-4 space-y-3 text-sm text-scm-textSoft">
                  {mentalData.diagnosis.factors.map((factor) => (
                    <li key={factor} className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-rose-500" />{factor}</li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                <div className="text-center">
                  <CircularMeter value={mentalData.diagnosis.severity} label="Severity" />
                  <p className="mt-3 text-sm text-rose-300">Significant impact on performance</p>
                </div>
              </div>
              <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-sm font-semibold text-scm-green">Recovery Outlook</p>
                <p className="mt-3 text-3xl font-semibold text-scm-gold">{mentalData.diagnosis.recoveryOutlook}</p>
                <p className="mt-2 text-sm text-scm-textSoft">With consistent plan adherence, improvement is expected within the next event cycle.</p>
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textMuted">Probability of full recovery</span><span className="text-scm-text">{mentalData.diagnosis.recoveryChance}%</span></div>
                  <ProgressBar value={mentalData.diagnosis.recoveryChance} tone="green" />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Recommended Action Plan" subtitle="Effects remain estimates in the UI phase.">
            <div className="grid gap-4 xl:grid-cols-3">
              {mentalData.actionPlan.map((item) => (
                <button key={item.title} type="button" onClick={() => setSelectedPlanTitle(item.title)} className={`rounded-2xl border p-4 text-left ${selectedPlanTitle === item.title ? 'border-emerald-500/35 bg-emerald-500/10' : 'border-scm-border bg-scm-panelSoft'}`}>
                  <p className="text-lg font-semibold text-scm-text">{item.title}</p>
                  <p className="mt-2 text-sm text-scm-textSoft">{item.description}</p>
                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex justify-between"><span className="text-scm-textMuted">Effect</span><span className={item.effectTone === 'red' ? 'text-rose-300' : 'text-emerald-300'}>{item.effect}</span></div>
                    <div className="flex justify-between"><span className="text-scm-textMuted">Cost</span><span className="text-scm-text">{item.cost}</span></div>
                    <div className="flex justify-between"><span className="text-scm-textMuted">Time</span><span className="text-scm-text">{item.time}</span></div>
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <SectionCard title="Mental Trend (Last 6 Weeks)">
              <div className="h-[280px] w-full">
                <ResponsiveContainer>
                  <LineChart data={mentalData.trend}>
                    <CartesianGrid stroke="#203449" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} width={40} />
                    <Tooltip contentStyle={{ backgroundColor: '#102033', border: '1px solid #31506f', borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="confidence" stroke="#7ad34b" strokeWidth={3} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="stress" stroke="#f59e0b" strokeWidth={3} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="focus" stroke="#60a5fa" strokeWidth={3} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="motivation" stroke="#a78bfa" strokeWidth={3} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Recovery Plan Progress">
              <div className="space-y-4">
                {mentalData.recoveryProgress.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textSoft">{item.label}</span><span className="text-scm-text">{item.value}%</span></div>
                    <ProgressBar value={item.value} tone={getProgressTone(item.value)} />
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-scm-border bg-scm-panelSoft p-4 text-sm text-scm-textSoft">
                Overall plan adherence is trending positive, but the most impactful steps are still only partly completed.
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard title="Recent Triggers">
            <div className="space-y-3">
              {mentalData.triggers.map((trigger) => (
                <div key={trigger.label} className="flex items-center justify-between rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3 text-sm">
                  <span className="text-scm-text">{trigger.label}</span>
                  <span className="text-scm-textMuted">{trigger.timing}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Coach / Psychologist Notes">
            <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4 text-sm text-scm-textSoft">
              <p>{mentalData.nextFocus.psychologistNote}</p>
              <p className="mt-4 text-scm-green">Dr. James Holloway · Sports Psychologist</p>
            </div>
          </SectionCard>

          <SectionCard title="Match Pressure Performance">
            <div className="grid gap-5 md:grid-cols-[120px_1fr]">
              <div className="flex justify-center"><CircularMeter value={58} label="Pressure" /></div>
              <div className="space-y-3 text-sm">
                {mentalData.pressurePerformance.map((item) => (
                  <div key={item.label} className="flex items-center justify-between"><span className="text-scm-textSoft">{item.label}</span><span className="text-scm-text">{item.value}</span></div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Coping Strategy Effectiveness">
            <div className="space-y-3 text-sm">
              {mentalData.copingStrategies.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3">
                  <span className="text-scm-text">{item.label}</span>
                  <span>{renderStars(item.rating)}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Recommended Next Focus">
            <div className="grid gap-4 md:grid-cols-[1fr_120px]">
              <div>
                <p className="text-xl font-semibold text-scm-text">{mentalData.nextFocus.title}</p>
                <ul className="mt-4 space-y-3 text-sm text-scm-textSoft">
                  {mentalData.nextFocus.bullets.map((item) => (
                    <li key={item} className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-scm-green" />{item}</li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center"><CircularMeter value={mentalData.nextFocus.priority} label="Focus Priority" /></div>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
        Mental fatigue and overthinking are materially affecting performance. Current live values: confidence {gameState.player.confidence}%, fatigue {gameState.player.fatigue}%, morale {gameState.player.morale}%.
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <ActionButton className="justify-center" icon={<BrainCircuit className="h-4 w-4" />} onClick={() => applyRecoveryPlan(selectedPlanTitle)}>Apply Recovery Plan</ActionButton>
        <ActionButton tone="secondary" className="justify-center" icon={<Target className="h-4 w-4" />} onClick={() => applyRecoveryPlan(mentalData.actionPlan[1]?.title ?? selectedPlanTitle)}>Book Psychologist</ActionButton>
        <ActionButton tone="secondary" className="justify-center" icon={<Flame className="h-4 w-4" />} onClick={() => navigate('/training')}>Adjust Schedule</ActionButton>
        <ActionButton tone="secondary" className="justify-center" icon={<ShieldAlert className="h-4 w-4" />} onClick={continueWeek}>Continue</ActionButton>
      </div>
    </div>
  )
}