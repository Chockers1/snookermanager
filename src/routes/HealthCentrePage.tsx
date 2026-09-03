import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ActivitySquare, AlertTriangle, BedDouble, ChevronRight, Clock, HeartPulse, ShieldCheck } from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/useGame'
import { buildHealthCentreData } from '../utils/liveRouteData'
import { formatMoney } from '../utils/formatters'

function toneClass(tone: 'green' | 'amber' | 'red') {
  if (tone === 'red') return 'text-red-400'
  if (tone === 'amber') return 'text-amber-400'
  return 'text-green-400'
}

export function HealthCentrePage() {
  const { gameState, scheduleTreatment, continueWeek } = useGame()
  const navigate = useNavigate()
  const { bodyStatus, currentIssue, treatments, matchImpact, injuryHistory } = buildHealthCentreData(gameState)
  const [selectedTreatmentId, setSelectedTreatmentId] = useState(treatments.find((option) => option.selected)?.id ?? treatments[0].id)
  const selectedTreatment = treatments.find((option) => option.id === selectedTreatmentId) ?? treatments[0]

  return (
    <div className="-m-6 flex h-[calc(100vh-5.5rem)] min-h-0 flex-col gap-2 overflow-hidden p-1.5">
      <div className="rounded-xl border border-border bg-surface/85 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">Support</p>
        <h1 className="mt-1 text-2xl font-bold leading-tight text-white">Health & Injury Centre</h1>
        <p className="mt-1 text-xs text-gray-400">Monitor physical condition, injuries, and recovery across the current save.</p>
      </div>

      <div className="card border-amber-600/30 bg-amber-600/5 px-4 py-3">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-600/20"><HeartPulse className="h-5 w-5 text-amber-400" /></div>
          <div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase text-amber-400">Current Issue</p><h2 className="truncate text-lg font-bold text-white">{currentIssue.title}</h2><p className="mt-1 truncate text-xs text-gray-400">Sustained {currentIssue.sustained} - {currentIssue.cause}</p></div>
          <div className="shrink-0 text-right"><p className="text-[10px] text-gray-500">Overall Risk Level</p><p className="text-xl font-bold text-green-400">{currentIssue.overallRisk}</p><p className="text-xs text-gray-400">Manage with treatment and load control.</p></div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-12 grid-rows-[0.56fr_0.44fr] gap-2">
        <div className="col-span-4 card min-h-0 flex h-full flex-col overflow-hidden">
          <div className="card-header px-3 py-2"><h3 className="text-sm font-semibold text-white">Body Status</h3></div>
          <div className="card-body min-h-0 flex-1 overflow-auto px-3 py-3 scrollbar-thin">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface/95">
                <tr className="border-b border-border text-gray-500"><th className="py-2 text-left">Area</th><th className="py-2 text-left">Status</th><th className="py-2 text-left">Risk</th></tr>
              </thead>
              <tbody>{bodyStatus.map((item) => <tr key={item.label} className="border-b border-border/50"><td className="py-2 text-white">{item.label}</td><td className={`py-2 ${toneClass(item.tone)}`}>{item.status}</td><td className="w-28 py-2"><ProgressBar value={item.risk} tone={item.tone} compact /></td></tr>)}</tbody>
            </table>
          </div>
        </div>

        <div className="col-span-5 card min-h-0 flex h-full flex-col overflow-hidden">
          <div className="card-header px-3 py-2"><h3 className="text-sm font-semibold text-white">Treatment Options</h3></div>
          <div className="card-body min-h-0 flex-1 space-y-2 overflow-auto px-3 py-3 scrollbar-thin">{treatments.map((option) => <button key={option.id} type="button" onClick={() => setSelectedTreatmentId(option.id)} className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${option.id === selectedTreatment.id ? 'border-green-600/30 bg-green-600/10' : 'border-transparent bg-surface-light/50 hover:border-border-light'}`}><div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${option.id === selectedTreatment.id ? 'border-green-500 bg-green-600' : 'border-gray-600'}`}>{option.id === selectedTreatment.id ? <div className="h-1.5 w-1.5 rounded-full bg-white" /> : null}</div><div className="min-w-0 flex-1"><p className="text-sm font-medium text-white">{option.title}</p><p className="mt-0.5 text-[10px] text-gray-400">{option.description}</p></div><div className="shrink-0 text-right text-xs"><p className="font-medium text-white">{option.cost === 0 ? '£0' : formatMoney(option.cost)}</p><p className="flex items-center justify-end gap-1 text-[10px] text-gray-500"><Clock className="h-2.5 w-2.5" /> {option.timeRequired}</p></div></button>)}</div>
        </div>

        <div className="col-span-3 grid min-h-0 grid-rows-[0.36fr_0.28fr_0.36fr] gap-2">
          <div className="card min-h-0 flex h-full flex-col overflow-hidden px-3 py-3"><h3 className="mb-2 text-xs font-semibold text-white">Injury Details</h3><div className="space-y-1.5 text-xs">{[['Injury', currentIssue.title], ['Type', 'Soft Tissue Strain'], ['Severity', 'Minor'], ['Sustained', currentIssue.sustained], ['Cause', currentIssue.cause], ['Pain Level', currentIssue.painLevel]].map(([label, value]) => <div key={label} className="flex justify-between gap-3"><span className="text-gray-400">{label}</span><span className="text-right text-white">{value}</span></div>)}</div></div>
          <div className="card min-h-0 flex h-full flex-col overflow-hidden px-3 py-3"><h3 className="mb-2 text-xs font-semibold text-white">Recovery Overview</h3><div className="space-y-1.5 text-xs"><div className="flex justify-between"><span className="text-gray-400">Expected Recovery</span><span className="text-white">{currentIssue.recoveryTime}</span></div><div className="flex justify-between"><span className="text-gray-400">Estimated Return</span><span className="text-white">{currentIssue.estimatedReturn}</span></div><div className="flex justify-between"><span className="text-gray-400">Progress</span><span className="text-green-400">{currentIssue.recoveryProgress}%</span></div></div><div className="mt-2"><ProgressBar value={currentIssue.recoveryProgress} compact /></div></div>
          <div className="card min-h-0 flex h-full flex-col overflow-hidden px-3 py-3"><h3 className="mb-2 text-xs font-semibold text-white">Match Impact</h3><div className="min-h-0 flex-1 space-y-1.5 overflow-auto text-xs scrollbar-thin">{matchImpact.map((item) => <div key={item.label} className="flex justify-between gap-3"><span className="text-gray-400">{item.label}</span><span className="text-right text-red-400">{item.impact}</span></div>)}</div><div className="mt-2 rounded border border-amber-600/20 bg-amber-600/10 p-2"><p className="flex items-center gap-1 text-[10px] text-amber-400"><AlertTriangle className="h-3 w-3" /> Risk of worsening: {currentIssue.riskOfPlaying}%</p></div></div>
        </div>

        <div className="col-span-12 card min-h-0 flex h-full flex-col overflow-hidden">
          <div className="card-header px-3 py-2"><h3 className="text-sm font-semibold text-white">Recent Injury / Treatment History</h3></div>
          <div className="min-h-0 flex-1 overflow-auto scrollbar-thin">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface/95">
                <tr className="border-b border-border text-gray-500"><th className="px-4 py-2 text-left">Date</th><th className="px-4 py-2 text-left">Issue</th><th className="px-4 py-2 text-left">Severity</th><th className="px-4 py-2 text-left">Treatment</th><th className="px-4 py-2 text-left">Time Out</th><th className="px-4 py-2 text-left">Notes</th></tr>
              </thead>
              <tbody>{injuryHistory.map((row) => <tr key={row.id} className="border-b border-border/50"><td className="px-4 py-2 text-gray-400">{row.date}</td><td className="px-4 py-2 text-white">{row.issue}</td><td className="px-4 py-2 text-amber-400">{row.severity}</td><td className="px-4 py-2 text-white">{row.treatment}</td><td className="px-4 py-2 text-gray-400">{row.timeOut}</td><td className="px-4 py-2 text-green-400">{row.notes}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-border bg-surface-light/50 px-4 py-2.5 text-sm text-gray-400">
        <p className="truncate">Live save cash: <span className="text-white">{formatMoney(gameState.player.cash)}</span>. Treatment actions deduct cash and reduce fatigue in the current save.</p>
        <div className="flex shrink-0 gap-2"><button type="button" className="btn-primary px-3 py-2 text-xs" onClick={() => scheduleTreatment(selectedTreatment.id)}><BedDouble className="h-3.5 w-3.5" /> Schedule Treatment <ChevronRight className="h-3 w-3" /></button><button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => navigate('/training')}><ActivitySquare className="h-3.5 w-3.5" /> Return to Training</button><button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={() => navigate('/mental')}><ShieldCheck className="h-3.5 w-3.5" /> Medical Advice</button><button type="button" className="btn-secondary px-3 py-2 text-xs" onClick={continueWeek}><HeartPulse className="h-3.5 w-3.5" /> Continue</button></div>
      </div>
    </div>
  )
}