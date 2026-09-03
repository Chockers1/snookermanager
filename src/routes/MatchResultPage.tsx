import { useNavigate } from 'react-router-dom'
import { Award, ChevronRight, ShieldCheck, SignalHigh, TrendingUp, Trophy, Zap } from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/useGame'
import { buildMatchResultData } from '../utils/liveRouteData'
import { formatMoney } from '../utils/formatters'

function getInitials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function getShortName(name: string) {
  return name.split(' ').at(-1) ?? name
}

function feedbackTone(tone: 'green' | 'amber' | 'blue') {
  if (tone === 'green') return 'text-green-400'
  if (tone === 'amber') return 'text-amber-400'
  return 'text-sky-400'
}

function signedValue(value: number | undefined, suffix = '') {
  const amount = value ?? 0
  return `${amount > 0 ? '+' : ''}${amount}${suffix}`
}

function getPostMatchRoute(round: string | undefined) {
  return round?.trim().toLowerCase() === 'final' ? '/rankings?from=final' : '/tournaments/hub'
}

export function MatchResultPage() {
  const { gameState } = useGame()
  const navigate = useNavigate()
  const latestMatch = gameState.matches[0]
  const {
    equipmentImpact,
    coachFeedback,
    matchSummary,
    strengthBreakdown,
    matchModifiers,
    resultExplanation,
    improvementAdvice,
    pressureDiagnosis,
  } = buildMatchResultData(gameState)
  const latestTournament = gameState.tournaments.find((item) => item.id === latestMatch?.tournamentId)
  const playerName = latestMatch?.playerName ?? gameState.player.fullName
  const opponentName = latestMatch?.opponentName ?? 'Opponent TBD'
  const playerFrames = latestMatch?.playerFrames ?? 0
  const opponentFrames = latestMatch?.opponentFrames ?? 0
  const playerWon = latestMatch?.result === 'Won'
  const frameRows = latestMatch?.frameHistory?.length ? latestMatch.frameHistory : []
  const statRows = latestMatch
    ? [
        { label: 'Pot Success', player: `${latestMatch.potSuccess}%`, opponent: `${Math.max(48, latestMatch.potSuccess - 6)}%` },
        { label: 'Long Pot', player: `${latestMatch.longPotSuccess}%`, opponent: `${Math.max(42, latestMatch.longPotSuccess - 5)}%` },
        { label: 'Safety', player: `${latestMatch.safetySuccess}%`, opponent: `${Math.max(45, latestMatch.safetySuccess - 4)}%` },
        { label: 'Highest Break', player: latestMatch.highestBreak, opponent: latestMatch.opponentHighestBreak },
        { label: 'Centuries', player: latestMatch.centuries, opponent: Math.max(0, latestMatch.centuries - 1) },
        { label: '50+ Breaks', player: latestMatch.fifties, opponent: Math.max(0, latestMatch.fifties - 1) },
        { label: 'Fouls', player: latestMatch.fouls, opponent: Math.max(0, latestMatch.fouls - 1) },
      ]
    : []
  const impactMetrics = [
    { label: 'Prize Money', value: formatMoney(latestMatch?.prizeMoneyEarned ?? 0), color: 'text-green-400', icon: Award },
    { label: 'Ranking Points', value: signedValue(latestMatch?.rankingPointsGained), color: 'text-white', icon: TrendingUp },
    { label: 'Confidence', value: signedValue(latestMatch?.confidenceChange, '%'), sub: `Now ${gameState.player.confidence}%`, color: (latestMatch?.confidenceChange ?? 0) >= 0 ? 'text-green-400' : 'text-red-400', icon: Zap },
    { label: 'Fatigue', value: signedValue(latestMatch?.fatigueChange, '%'), sub: `Now ${gameState.player.fatigue}%`, color: 'text-amber-400', icon: TrendingUp },
    { label: 'Highest Break', value: String(latestMatch?.highestBreak ?? 0), color: 'text-white', icon: Trophy },
    { label: 'Expected Chance', value: `${matchSummary?.expectedWinChance ?? 50}%`, color: 'text-green-400', icon: SignalHigh },
  ]

  if (!latestMatch) {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-[10px] font-semibold uppercase text-gray-500">Match Centre</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Match Result</h1>
        </div>
        <div className="card card-body p-8 text-center">
          <Trophy className="mx-auto h-14 w-14 text-gray-500" />
          <p className="mt-4 text-xl font-semibold text-white">No completed match yet</p>
          <p className="mt-2 text-sm text-gray-400">Play or simulate a match before opening the result breakdown.</p>
          <button type="button" onClick={() => navigate('/tournaments/hub')} className="btn-primary mx-auto mt-6 text-xs">Go To Tournament Hub</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span>{latestTournament?.name ?? 'Completed match'}</span>
        <span>/</span>
        <span>{latestMatch.round}</span>
        <span>/</span>
        <span>Best of {latestMatch.bestOf}</span>
        <span>/</span>
        <span className="font-medium text-white">Result</span>
      </div>

      <div className={`card overflow-hidden border ${playerWon ? 'border-green-600/30' : 'border-red-600/30'}`}>
        <div className={`p-6 ${playerWon ? 'bg-gradient-to-r from-green-600/10 via-transparent to-transparent' : 'bg-gradient-to-r from-red-600/10 via-transparent to-transparent'}`}>
          <div className="flex flex-col items-center justify-between gap-5 lg:flex-row">
            <div className="flex min-w-0 items-center gap-3 sm:gap-5">
              <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 ${playerWon ? 'border-green-500 bg-green-600/20 text-green-400' : 'border-border bg-surface-light text-white'} text-xl font-bold`}>{getInitials(playerName)}</div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">{playerWon ? <Trophy className="h-4 w-4 text-amber-400" /> : null}<p className="truncate text-lg font-bold text-white">{playerName}</p></div>
                <p className="text-xs text-gray-400">{gameState.player.rankingLabel} #{gameState.player.amateurRanking ?? gameState.player.worldRanking ?? '-'}</p>
                <p className={`mt-0.5 text-xs ${playerWon ? 'text-green-400' : 'text-red-400'}`}>{playerWon ? 'MATCH WON' : 'MATCH LOST'}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-5 text-center">
              <p className={`text-5xl font-bold ${playerWon ? 'text-green-400' : 'text-white'}`}>{playerFrames}</p>
              <div><p className="text-2xl font-bold text-gray-500">-</p><p className="mt-1 text-[10px] text-gray-500">{matchSummary?.actualResult ?? latestMatch.result}</p></div>
              <p className={`text-5xl font-bold ${!playerWon ? 'text-red-400' : 'text-white'}`}>{opponentFrames}</p>
            </div>
            <div className="flex min-w-0 items-center gap-3 sm:gap-5">
              <div className="min-w-0 text-right">
                <p className="truncate text-lg font-bold text-white">{opponentName}</p>
                <p className="text-xs text-gray-400">Opponent ranking #{latestMatch.opponentRanking}</p>
                <p className="text-xs text-gray-400">{latestMatch.opponentRankBand ?? 'Ranking band'}</p>
              </div>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-border/50 bg-surface-light text-xl font-bold text-gray-400">{getInitials(opponentName)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {impactMetrics.map((metric) => (
          <div key={metric.label} className="card card-body text-center">
            <metric.icon className="mx-auto mb-1 h-3.5 w-3.5 text-gray-500" />
            <p className="metric-label">{metric.label}</p>
            <p className={`mt-0.5 text-lg font-bold ${metric.color}`}>{metric.value}</p>
            {'sub' in metric && metric.sub ? <p className="text-[10px] text-gray-400">{metric.sub}</p> : null}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3 rounded-xl border border-border/70 bg-surface/70 p-4">
        <button type="button" onClick={() => navigate(getPostMatchRoute(latestMatch.round))} className="btn-primary text-xs"><Trophy className="h-3.5 w-3.5" /> Continue Tournament <ChevronRight className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => navigate('/training/report')} className="btn-secondary text-xs">Review Training</button>
        <button type="button" onClick={() => navigate('/tournaments/draw')} className="btn-secondary text-xs">View Draw</button>
      </div>

      <details className="group card overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-white hover:bg-surface-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">
          <span><span className="text-green-400">More analysis</span><span className="ml-2 text-xs font-normal text-gray-400">Stats, frames, equipment and coaching detail</span></span>
          <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-90" />
        </summary>
        <div className="grid grid-cols-12 gap-4 border-t border-border p-4">
        <div className="col-span-12 space-y-4 lg:col-span-4">
          <div className="card">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Match Stats</h3></div>
            <div className="card-body">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border text-gray-500"><th className="py-1.5 text-left">{getShortName(playerName)}</th><th className="py-1.5 text-center">Stat</th><th className="py-1.5 text-right">{getShortName(opponentName)}</th></tr></thead>
                <tbody>
                  {statRows.map((row) => (
                    <tr key={row.label} className="border-b border-border/30"><td className="py-1.5 font-medium text-green-400">{row.player}</td><td className="py-1.5 text-center text-gray-400">{row.label}</td><td className="py-1.5 text-right text-white">{row.opponent}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Strength Breakdown</h3></div>
            <div className="card-body space-y-2">
              {strengthBreakdown.map((row) => (
                <div key={row.label} className="rounded-lg bg-surface-light/50 p-2.5">
                  <div className="mb-1 flex items-center justify-between text-[10px]"><span className="text-white">{row.label}</span><span className={row.edge >= 0 ? 'font-medium text-green-400' : 'font-medium text-red-400'}>{row.edge > 0 ? '+' : ''}{row.edge}</span></div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[10px]"><ProgressBar value={Number(row.player)} compact /><span className="text-gray-500">vs</span><ProgressBar value={Number(row.opponent)} tone="amber" compact /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Equipment Impact</h3><ShieldCheck className="h-3.5 w-3.5 text-green-400" /></div>
            <div className="card-body space-y-2">
              {equipmentImpact.map((item) => (
                <div key={item.label} className="rounded-lg bg-surface-light/50 p-3 text-xs">
                  <div className="mb-1 flex justify-between"><span className="font-medium text-white">{item.label}</span><span className="text-green-400">{Math.round(item.condition)}%</span></div>
                  <p className="text-[10px] text-gray-400">{item.highlight}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-gray-400">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 space-y-4 lg:col-span-4">
          <div className="card">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Frame by Frame</h3></div>
            <div className="card-body space-y-1">
              {frameRows.length > 0 ? frameRows.map((frame) => {
                const total = Number(frame.player) + Number(frame.opponent)
                const playerShare = total > 0 ? (Number(frame.player) / total) * 100 : 50
                const wonFrame = frame.winner === 'Player' || frame.winner === playerName
                return (
                  <div key={frame.frame} className="flex items-center gap-2 border-b border-border/30 py-1.5 text-xs">
                    <span className="w-7 text-gray-500">F{frame.frame}</span>
                    <span className={`w-8 font-medium ${wonFrame ? 'text-green-400' : 'text-white'}`}>{frame.player}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-700/50"><div className={wonFrame ? 'h-full rounded-full bg-green-500' : 'h-full rounded-full bg-red-500'} style={{ width: `${playerShare}%` }} /></div>
                    <span className={`w-8 text-right font-medium ${!wonFrame ? 'text-red-400' : 'text-white'}`}>{frame.opponent}</span>
                    <span className={`w-5 text-right font-bold ${wonFrame ? 'text-green-400' : 'text-red-400'}`}>{wonFrame ? 'W' : 'L'}</span>
                  </div>
                )
              }) : <p className="text-xs text-gray-400">No frame history recorded for this match.</p>}
            </div>
          </div>

          {resultExplanation ? (
            <div className="card">
              <div className="card-header"><h3 className="text-sm font-semibold text-white">{resultExplanation.title}</h3></div>
              <div className="card-body space-y-3">
                <p className="text-xs leading-relaxed text-gray-300">{resultExplanation.summary}</p>
                <p className="rounded-lg bg-surface-light/50 p-3 text-[11px] leading-relaxed text-gray-400">{resultExplanation.detail}</p>
              </div>
            </div>
          ) : null}

          <div className="card">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Match Modifiers</h3></div>
            <div className="card-body space-y-2">
              {matchModifiers.map((modifier) => (
                <div key={modifier.label} className="flex items-start gap-2 rounded-lg bg-surface-light/50 p-2.5 text-xs">
                  <span className={modifier.impact.startsWith('-') ? 'mt-0.5 shrink-0 text-red-400' : 'mt-0.5 shrink-0 text-green-400'}>{modifier.impact.startsWith('-') ? '-' : '+'}</span>
                  <div className="min-w-0"><div className="flex gap-2"><p className="font-medium text-white">{modifier.label}</p><span className="text-amber-400">{modifier.impact}</span></div><p className="mt-0.5 text-[10px] leading-relaxed text-gray-400">{modifier.detail}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 space-y-4 lg:col-span-4">
          {matchSummary ? (
            <div className="card card-body">
              <h3 className="mb-2 text-xs font-semibold text-white">Match Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div><p className="text-gray-500">Tournament</p><p className="truncate text-white">{matchSummary.tournament}</p></div>
                <div><p className="text-gray-500">Round</p><p className="text-white">{matchSummary.round}</p></div>
                <div><p className="text-gray-500">Format</p><p className="text-white">{matchSummary.format}</p></div>
                <div><p className="text-gray-500">Expectation</p><p className="text-green-400">{matchSummary.expectedWinChance}%</p></div>
              </div>
            </div>
          ) : null}

          <div className="card card-body">
            <h3 className="mb-2 text-xs font-semibold text-white">Pressure Diagnosis</h3>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded bg-surface-light/50 p-2"><p className="text-gray-500">QF+ Record</p><p className="text-white">{pressureDiagnosis.qfPlusRecord}</p></div>
              <div className="rounded bg-surface-light/50 p-2"><p className="text-gray-500">Semi Finals</p><p className="text-white">{pressureDiagnosis.semiFinalConversion}</p></div>
              <div className="rounded bg-surface-light/50 p-2"><p className="text-gray-500">Finals</p><p className="text-white">{pressureDiagnosis.finalConversion}</p></div>
              <div className="rounded bg-surface-light/50 p-2"><p className="text-gray-500">Deciders</p><p className="text-white">{pressureDiagnosis.deciderRecord}</p></div>
            </div>
            <div className="mt-3 rounded border border-border bg-surface-light/50 p-3"><p className="text-[10px] uppercase text-gray-500">Pressure Trait</p><p className="mt-1 text-xs font-medium text-white">{pressureDiagnosis.pressureTrait}</p><p className="mt-1 text-[10px] leading-relaxed text-gray-400">{pressureDiagnosis.diagnosis}</p></div>
          </div>

          <div className="card card-body">
            <h3 className="mb-2 text-xs font-semibold text-white">Improvement Areas</h3>
            <div className="space-y-1.5">
              {improvementAdvice.length > 0 ? improvementAdvice.map((area) => (
                <div key={area} className="flex items-start gap-2 text-[10px]"><span className="mt-0.5 shrink-0 text-amber-400">!</span><span className="text-gray-300">{area}</span></div>
              )) : <p className="text-[10px] text-gray-400">No urgent correction stands out from this result.</p>}
            </div>
          </div>

          <div className="card card-body">
            <h3 className="mb-2 text-xs font-semibold text-white">Coach Feedback</h3>
            <div className="space-y-3">
              {coachFeedback.map((group) => (
                <div key={group.title}>
                  <p className={`text-[11px] font-semibold ${feedbackTone(group.tone)}`}>{group.title}</p>
                  <div className="mt-1 space-y-1.5">
                    {group.items.map((item) => <p key={item} className="text-[10px] leading-relaxed text-gray-400">{item}</p>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </details>
    </div>
  )
}
