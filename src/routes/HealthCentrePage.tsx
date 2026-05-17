import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ActivitySquare, BedDouble, HeartPulse, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { CircularMeter } from '../components/ui/CircularMeter'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SectionCard } from '../components/ui/SectionCard'
import { useGame } from '../context/GameStateContext'
import { buildHealthCentreData } from '../utils/liveRouteData'
import { formatMoney } from '../utils/formatters'

function getToneClass(tone: 'green' | 'amber' | 'red') {
  if (tone === 'red') return 'text-rose-300'
  if (tone === 'amber') return 'text-amber-300'
  return 'text-emerald-300'
}

function getProgressTone(tone: 'green' | 'amber' | 'red'): 'green' | 'amber' | 'red' {
  return tone
}

export function HealthCentrePage() {
  const { gameState, scheduleTreatment, continueWeek } = useGame()
  const navigate = useNavigate()
  const { bodyStatus, currentIssue, treatments, matchImpact, injuryHistory } = buildHealthCentreData(gameState)
  const [selectedTreatmentId, setSelectedTreatmentId] = useState(treatments.find((option) => option.selected)?.id ?? treatments[0].id)
  const selectedTreatment = treatments.find((option) => option.id === selectedTreatmentId) ?? treatments[0]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Support"
        title="Health & Injury Centre"
        description="Monitor physical condition, review treatment options, and understand the risk of playing through current issues."
      />

      <SectionCard>
        <div className="grid gap-6 xl:grid-cols-[0.9fr_0.8fr_0.8fr] xl:items-center">
          <div className="flex items-center gap-4">
            <div className="rounded-3xl border border-scm-border bg-scm-panelSoft p-5 text-scm-green"><HeartPulse className="h-10 w-10" /></div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-scm-gold">Current Issue</p>
              <h2 className="mt-2 text-3xl font-semibold text-scm-text">{currentIssue.title}</h2>
              <p className="mt-2 text-sm text-scm-textSoft">Occurred on {currentIssue.sustained}</p>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-scm-gold">Medical Team</p>
            <p className="mt-2 text-2xl font-semibold text-scm-text">Mark Harrison</p>
            <p className="mt-2 text-sm text-scm-textSoft">Head Physio</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-scm-gold">Overall Risk Level</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">{currentIssue.overallRisk}</p>
            <p className="mt-2 text-sm text-scm-textSoft">Manageable with proper treatment and training-load control.</p>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1.35fr_0.95fr]">
        <SectionCard title="Body Status">
          <div className="space-y-4">
            {bodyStatus.map((item) => (
              <div key={item.label} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-scm-text">{item.label}</span>
                  <span className={getToneClass(item.tone)}>{item.status}</span>
                </div>
                <div className="mb-2 flex items-center justify-between text-xs text-scm-textMuted"><span>Risk</span><span>{item.risk}%</span></div>
                <ProgressBar value={item.risk} tone={getProgressTone(item.tone)} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Treatment Options">
          <div className="space-y-3">
            {treatments.map((option) => (
              <button key={option.id} type="button" onClick={() => setSelectedTreatmentId(option.id)} className={`w-full rounded-2xl border p-4 text-left ${option.id === selectedTreatment.id ? 'border-emerald-500/35 bg-emerald-500/10' : 'border-scm-border bg-scm-panelSoft'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold text-scm-text">{option.title}</p>
                    <p className="mt-2 text-sm text-scm-textSoft">{option.description}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-scm-text">{option.cost === 0 ? '£0' : formatMoney(option.cost)}</p>
                    <p className="text-scm-textMuted">{option.timeRequired}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-scm-border bg-scm-panelSoft p-4 text-sm text-scm-textSoft">
            Medical advice: {selectedTreatment.title.toLowerCase()} is the current active recommendation. Avoid heavy cueing and long sessions until symptoms ease.
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Injury Details">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-scm-textMuted">Injury</span><span className="text-scm-text">{currentIssue.title}</span></div>
              <div className="flex justify-between"><span className="text-scm-textMuted">Type</span><span className="text-scm-text">Soft Tissue Strain</span></div>
              <div className="flex justify-between"><span className="text-scm-textMuted">Severity</span><span className="text-scm-text">Minor</span></div>
              <div className="flex justify-between"><span className="text-scm-textMuted">Sustained</span><span className="text-scm-text">{currentIssue.sustained}</span></div>
              <div className="flex justify-between"><span className="text-scm-textMuted">Cause</span><span className="text-scm-text">{currentIssue.cause}</span></div>
              <div className="flex justify-between"><span className="text-scm-textMuted">Pain Level</span><span className="text-emerald-300">{currentIssue.painLevel}</span></div>
            </div>
          </SectionCard>

          <SectionCard title="Recovery Overview">
            <div className="space-y-4 text-sm text-scm-textSoft">
              <div className="flex justify-between"><span>Expected Recovery Time</span><span className="text-scm-text">{currentIssue.recoveryTime}</span></div>
              <div className="flex justify-between"><span>Estimated Return</span><span className="text-emerald-300">{currentIssue.estimatedReturn}</span></div>
              <div>
                <div className="mb-2 flex items-center justify-between"><span>Recovery Progress</span><span className="text-scm-text">{currentIssue.recoveryProgress}%</span></div>
                <ProgressBar value={currentIssue.recoveryProgress} tone="green" />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Match Impact">
            <div className="space-y-3 text-sm">
              {matchImpact.map((item) => (
                <div key={item.label} className="flex items-center justify-between"><span className="text-scm-textSoft">{item.label}</span><span className="text-rose-300">{item.impact}</span></div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Risk Of Playing">
            <div className="grid gap-4 md:grid-cols-[1fr_120px]">
              <div>
                <p className="text-sm text-scm-textSoft">High risk of the injury worsening. Could lead to a longer absence if pushed too early.</p>
              </div>
              <div className="flex justify-center"><CircularMeter value={currentIssue.riskOfPlaying} label="Risk" /></div>
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Recent Injury / Treatment History">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.16em] text-scm-textMuted">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Issue</th>
                <th className="px-3 py-2">Severity</th>
                <th className="px-3 py-2">Treatment</th>
                <th className="px-3 py-2">Time Out</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {injuryHistory.map((row) => (
                <tr key={row.id} className="border-t border-scm-border">
                  <td className="px-3 py-3 text-scm-textSoft">{row.date}</td>
                  <td className="px-3 py-3 text-scm-text">{row.issue}</td>
                  <td className="px-3 py-3 text-scm-text">{row.severity}</td>
                  <td className="px-3 py-3 text-scm-textSoft">{row.treatment}</td>
                  <td className="px-3 py-3 text-scm-text">{row.timeOut}</td>
                  <td className="px-3 py-3 text-scm-textSoft">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid gap-3 md:grid-cols-4">
        <ActionButton className="justify-center" icon={<BedDouble className="h-4 w-4" />} onClick={() => scheduleTreatment(selectedTreatment.id)}>Schedule Treatment</ActionButton>
        <ActionButton tone="secondary" className="justify-center" icon={<ActivitySquare className="h-4 w-4" />} onClick={() => navigate('/training')}>Return To Training Plan</ActionButton>
        <ActionButton tone="secondary" className="justify-center" icon={<ShieldCheck className="h-4 w-4" />} onClick={() => navigate('/mental')}>View Medical Advice</ActionButton>
        <ActionButton tone="secondary" className="justify-center" icon={<HeartPulse className="h-4 w-4" />} onClick={continueWeek}>Continue</ActionButton>
      </div>

      <div className="rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3 text-sm text-scm-textSoft">
        Live save cash: <span className="text-scm-text">{formatMoney(gameState.player.cash)}</span>. Treatment actions now deduct cash and reduce fatigue in the current save.
      </div>
    </div>
  )
}