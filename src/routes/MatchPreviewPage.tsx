import { useNavigate } from 'react-router-dom'
import { BrainCircuit, Clock3, Gauge, ShieldCheck, Thermometer, Trophy } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { CircularMeter } from '../components/ui/CircularMeter'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SectionCard } from '../components/ui/SectionCard'
import { useGame } from '../context/GameStateContext'
import { buildMatchPreviewData } from '../utils/liveRouteData'

function getRankValue(rank: number | null | undefined) {
  return rank ?? 0
}

function getTraitTone(value: number): 'green' | 'amber' | 'red' {
  if (value >= 75) return 'green'
  if (value >= 60) return 'amber'
  return 'red'
}

export function MatchPreviewPage() {
  const { gameState, startLiveMatch } = useGame()
  const navigate = useNavigate()
  const {
    activeTournament,
    activeRound,
    nextOpponent,
    currentCue,
    currentCueState,
    currentChalk,
    currentTip,
    bestOf,
    totalMeetings,
    wins,
    losses,
    lastMeeting,
    frameDifferential,
    strengths,
    weaknesses,
    scoutNotes,
    scoutConfidence,
    tacticalPlan,
    cueFamiliarity,
    mentalOutlook,
    recentPlayerResults,
    recentOpponentResults,
    matchInfo,
    pressureLevel,
  } = buildMatchPreviewData(gameState)
  const activeLiveMatch = gameState.liveMatch?.status === 'In Progress' ? gameState.liveMatch : null

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Match Centre"
        title="Match Preview"
        description={`${activeTournament?.name ?? 'Match Preview'} · ${activeRound ?? 'Awaiting Entry'} · ${bestOf}. Review the tactical plan, opponent report, and readiness before the opening break.`}
      />

      <div className="grid gap-4 xl:grid-cols-6">
        <SectionCard><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Player</p><p className="mt-2 text-xl font-semibold text-scm-text">{gameState.player.fullName}</p><p className="mt-1 text-scm-green">{gameState.player.careerStage}</p></SectionCard>
        <SectionCard><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{gameState.player.rankingLabel}</p><p className="mt-2 text-3xl font-semibold text-scm-text">{getRankValue(gameState.player.amateurRanking ?? gameState.player.worldRanking)}</p></SectionCard>
        <SectionCard><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Form (Last 10)</p><div className="mt-4 flex gap-2">{gameState.player.form.map((result, index) => <span key={`${result}-${index}`} className={`flex h-8 w-8 items-center justify-center rounded-full ${result === 'W' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'}`}>{result}</span>)}</div></SectionCard>
        <SectionCard><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Confidence</p><p className="mt-2 text-3xl font-semibold text-emerald-300">{gameState.player.confidence}%</p></SectionCard>
        <SectionCard><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Funds</p><p className="mt-2 text-3xl font-semibold text-scm-gold">£{gameState.player.cash.toLocaleString('en-GB')}</p></SectionCard>
        <SectionCard><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Next Event</p><p className="mt-2 text-xl font-semibold text-scm-text">{activeTournament?.name ?? 'No event scheduled'}</p><p className="mt-1 text-scm-textSoft">{activeTournament?.startDate ?? gameState.currentDate}</p></SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_360px]">
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_220px_1.05fr]">
            <SectionCard title="Home" subtitle={`${gameState.player.fullName} vs ${nextOpponent?.playerName ?? 'Opponent TBD'}`}>
              <div className="space-y-4">
                <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                  <p className="text-xl font-semibold text-scm-text">{gameState.player.fullName}</p>
                  <div className="mt-4 grid gap-3 text-sm text-scm-textSoft">
                    <div className="flex justify-between"><span>{gameState.player.rankingLabel}</span><span className="text-scm-text">{getRankValue(gameState.player.amateurRanking ?? gameState.player.worldRanking)}</span></div>
                    <div className="flex justify-between"><span>Confidence</span><span className="text-emerald-300">{gameState.player.confidence}%</span></div>
                    <div className="flex justify-between"><span>Fatigue</span><span className="text-amber-300">{gameState.player.fatigue}%</span></div>
                    <div className="flex justify-between"><span>Highest Break</span><span className="text-scm-text">{gameState.matches[0]?.highestBreak ?? 0}</span></div>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Head-to-Head">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Total Meetings</p>
                <p className="mt-3 text-4xl font-semibold text-scm-text">{totalMeetings}</p>
                <CircularMeter value={67} label="Win Share" />
                <p className="mt-4 text-sm text-scm-textSoft">{gameState.player.fullName.split(' ')[0]} leads {wins}-{losses}</p>
                <p className="mt-2 text-xs text-scm-textMuted">Last meeting: {lastMeeting}</p>
                <p className="mt-2 text-sm text-emerald-300">Frame differential {frameDifferential}</p>
              </div>
            </SectionCard>

            <SectionCard title={`Opponent Scout Report: ${nextOpponent?.playerName ?? 'Opponent TBD'}`}>
              <div className="grid gap-4 xl:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-emerald-300">Strengths</p>
                  <div className="mt-3 space-y-3">
                    {strengths.map((trait) => (
                      <div key={trait.label}>
                        <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textSoft">{trait.label}</span><span className="text-scm-text">{trait.value}</span></div>
                        <ProgressBar value={trait.value} tone={getTraitTone(trait.value)} />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-rose-300">Weaknesses</p>
                  <div className="mt-3 space-y-3">
                    {weaknesses.map((trait) => (
                      <div key={trait.label}>
                        <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textSoft">{trait.label}</span><span className="text-scm-text">{trait.value}</span></div>
                        <ProgressBar value={trait.value} tone={getTraitTone(trait.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-5 rounded-2xl border border-scm-border bg-scm-panelSoft p-4 text-sm text-scm-textSoft">
                <p>{scoutNotes}</p>
                <p className="mt-3 text-emerald-300">Scout confidence {scoutConfidence}%</p>
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_1.05fr_0.9fr]">
            <SectionCard title="Tactical Plan">
              <div className="space-y-4">
                {tacticalPlan.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <div>
                        <p className="text-scm-text">{item.label}</p>
                        <p className="text-xs text-scm-textMuted">{item.description}</p>
                      </div>
                      <span className="text-emerald-300">{item.level}%</span>
                    </div>
                    <ProgressBar value={item.level} tone={item.level >= 65 ? 'green' : 'amber'} />
                    <p className="mt-2 text-xs text-scm-gold">{item.impact}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Equipment Check">
              <div className="space-y-4">
                {[
                  { label: 'Cue', name: currentCue?.name, value: currentCueState?.condition ?? currentCue?.condition ?? 0 },
                  { label: 'Chalk', name: currentChalk?.name, value: Math.max(0, Math.min(100, 70 + (currentChalk?.consistency ?? 0) / 2)) },
                  { label: 'Tip', name: currentTip?.name, value: currentCueState?.tipCondition ?? currentTip?.durability ?? 0 },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4">
                    <div className="flex items-center justify-between"><p className="font-semibold text-scm-text">{item.label}</p><span className="text-emerald-300">{item.value}%</span></div>
                    <p className="mt-2 text-sm text-scm-textSoft">{item.name}</p>
                    <div className="mt-3"><ProgressBar value={item.value} tone="green" /></div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-[120px_1fr]">
                <div className="flex justify-center"><CircularMeter value={cueFamiliarity} label="Cue Familiarity" /></div>
                <div className="space-y-2 rounded-xl border border-scm-border bg-scm-panelSoft p-4 text-sm text-scm-textSoft">
                  <div className="flex justify-between"><span>Cue Ball Control</span><span className="text-emerald-300">+{currentCue?.bonuses['Cue Ball Control'] ?? 0}</span></div>
                  <div className="flex justify-between"><span>Consistency</span><span className="text-emerald-300">+{currentCue?.bonuses.Consistency ?? 0}</span></div>
                  <div className="flex justify-between"><span>Break Building</span><span className="text-emerald-300">+{currentCue?.bonuses['Break Building'] ?? 0}</span></div>
                  <div className="flex justify-between"><span>Miscue Reduction</span><span className="text-emerald-300">+{currentTip?.miscueReduction ?? 0}</span></div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Mental Readiness">
              <div className="space-y-4">
                {[
                  { label: 'Pressure Level', value: pressureLevel, tone: 'amber' as const },
                  { label: 'Confidence', value: gameState.player.confidence, tone: 'green' as const },
                  { label: 'Focus', value: gameState.attributes.mental.Focus, tone: 'green' as const },
                  { label: 'Composure', value: gameState.attributes.mental.Composure, tone: 'green' as const },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textSoft">{item.label}</span><span className="text-scm-text">{item.value}%</span></div>
                    <ProgressBar value={item.value} tone={item.tone} />
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-scm-green/25 bg-scm-green/10 p-4 text-sm text-scm-textSoft">
                <p className="flex items-center gap-2 text-emerald-200"><BrainCircuit className="h-4 w-4" />Mental outlook</p>
                <p className="mt-3">{mentalOutlook}</p>
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Recent Results">
            <div className="grid gap-6 xl:grid-cols-2">
              <div>
                <p className="mb-3 text-sm font-semibold text-emerald-300">{gameState.player.fullName} (Last 4)</p>
                <div className="space-y-3">
                  {recentPlayerResults.map((result) => (
                    <div key={result.id} className="grid grid-cols-[72px_1fr_44px_56px] items-center gap-3 rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3 text-sm">
                      <span className="text-scm-textMuted">{result.date}</span>
                      <span className="text-scm-text">{result.opponent}</span>
                      <span className={result.result === 'W' ? 'text-emerald-300' : 'text-rose-300'}>{result.result}</span>
                      <span className="text-scm-text">{result.score}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-semibold text-amber-300">{nextOpponent?.playerName ?? 'Opponent TBD'} (Last 4)</p>
                <div className="space-y-3">
                  {recentOpponentResults.map((result) => (
                    <div key={result.id} className="grid grid-cols-[72px_1fr_44px_56px] items-center gap-3 rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3 text-sm">
                      <span className="text-scm-textMuted">{result.date}</span>
                      <span className="text-scm-text">{result.opponent}</span>
                      <span className={result.result === 'W' ? 'text-emerald-300' : 'text-rose-300'}>{result.result}</span>
                      <span className="text-scm-text">{result.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Match Information">
            <div className="space-y-4 text-sm text-scm-textSoft">
              <div className="flex items-center justify-between"><span className="flex items-center gap-2"><Trophy className="h-4 w-4 text-scm-gold" />Round</span><span className="text-scm-text">{activeRound ?? 'Awaiting Entry'}</span></div>
              <div className="flex items-center justify-between"><span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-scm-gold" />Match Time</span><span className="text-scm-text">{matchInfo.time}</span></div>
              <div className="flex items-center justify-between"><span className="flex items-center gap-2"><Gauge className="h-4 w-4 text-scm-gold" />Table</span><span className="text-scm-text">{matchInfo.table}</span></div>
              <div className="flex items-center justify-between"><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-scm-gold" />Referee</span><span className="text-scm-text">{matchInfo.referee}</span></div>
              <div className="flex items-center justify-between"><span className="flex items-center gap-2"><Thermometer className="h-4 w-4 text-scm-gold" />Temperature</span><span className="text-scm-text">{matchInfo.temperature}</span></div>
              <div className="flex items-center justify-between"><span className="flex items-center gap-2"><Trophy className="h-4 w-4 text-scm-gold" />Conditions</span><span className="text-emerald-300">{matchInfo.conditions}</span></div>
            </div>
          </SectionCard>

          <div className="grid gap-3">
            <ActionButton className="justify-center" onClick={() => {
              startLiveMatch(activeTournament?.id)
              navigate('/match/live')
            }}>{activeLiveMatch ? 'Resume Live Match' : 'Start Match'}</ActionButton>
            <ActionButton tone="secondary" className="justify-center" onClick={() => navigate('/training')}>Adjust Training</ActionButton>
            <ActionButton tone="secondary" className="justify-center" onClick={() => navigate('/equipment/chalk-tips')}>Change Equipment</ActionButton>
          </div>
        </div>
      </div>
    </div>
  )
}