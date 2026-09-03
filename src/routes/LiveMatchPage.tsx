import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  Brain,
  CalendarDays,
  ChevronDown,
  CircleDot,
  Eye,
  Menu,
  MoreHorizontal,
  Shield,
  Target,
  Zap,
} from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/useGame'

type LiveMatchViewState = NonNullable<ReturnType<typeof useGame>['gameState']['liveMatch']>
type LiveVisitDecision = Parameters<ReturnType<typeof useGame>['playLiveVisit']>[0]
type LiveTacticalPlan = LiveMatchViewState['tacticalPlan']
type LiveMentalFocus = LiveMatchViewState['mentalFocus']
type LiveTempo = LiveMatchViewState['tempo']

type ShotMoment = {
  shotType: LiveVisitDecision
  shotLabel: string
  potChance: number
  positionChance: number
  safetyRisk: number
  difficulty: 'Low' | 'Medium' | 'High'
  recommendation: 'Attack' | 'Build' | 'Safe' | 'Snooker'
  targetBall: string
  targetPocket: string
  leave: string
}

const COLOUR_POINTS: Record<string, number> = { Yellow: 2, Green: 3, Brown: 4, Blue: 5, Pink: 6, Black: 7 }
const BALL_COLOURS: Record<string, string> = {
  Yellow: 'bg-yellow-400',
  Green: 'bg-green-500',
  Brown: 'bg-amber-800',
  Blue: 'bg-blue-500',
  Pink: 'bg-pink-400',
  Black: 'bg-black',
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function getInitials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function getShortName(name: string) {
  return name.split(' ').at(-1) ?? name
}

function pct(value: number) {
  return `${Math.round(value)}%`
}

function formatClock(minutes: number) {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function getRemainingTablePoints(liveMatch: LiveMatchViewState) {
  return liveMatch.tableState.redsRemaining * 8 + liveMatch.tableState.coloursRemaining.reduce((total, colour) => total + (COLOUR_POINTS[colour] ?? 0), 0)
}

function areSnookersRequired(scoreGap: number, remainingPoints: number) {
  return scoreGap > remainingPoints
}

function getDifficultyLabel(potChance: number, pressure: number): ShotMoment['difficulty'] {
  if (potChance >= 72 && pressure < 64) return 'Low'
  if (potChance >= 48) return 'Medium'
  return 'High'
}

function toneForPercent(value: number) {
  if (value >= 68) return 'text-green-400'
  if (value >= 45) return 'text-amber-400'
  return 'text-red-400'
}

function getFramePhase(liveMatch: LiveMatchViewState) {
  if (liveMatch.tableState.redsRemaining > 0) return `${liveMatch.tableState.redsRemaining} reds left`
  return liveMatch.tableState.coloursRemaining[0] ? `${liveMatch.tableState.coloursRemaining[0]} to black` : 'Colours cleared'
}

function buildShotMoment(liveMatch: LiveMatchViewState, atTableIsPlayer: boolean): ShotMoment {
  const profile = atTableIsPlayer ? liveMatch.playerVisitProfile : liveMatch.opponentVisitProfile
  const confidence = atTableIsPlayer ? liveMatch.playerConfidence : liveMatch.opponentConfidence
  const fatigue = atTableIsPlayer ? liveMatch.playerFatigue : liveMatch.opponentFatigue
  const remainingPoints = getRemainingTablePoints(liveMatch)
  const trailingBy = atTableIsPlayer
    ? liveMatch.opponentPoints - liveMatch.playerPoints
    : liveMatch.playerPoints - liveMatch.opponentPoints
  const needsSnookers = areSnookersRequired(trailingBy, remainingPoints)
  const onColours = liveMatch.tableState.redsRemaining === 0
  const basePotChance = clamp(
    profile.longPotting * 0.44
      + profile.cueBallControl * 0.18
      + profile.consistency * 0.16
      + confidence * 0.12
      - fatigue * 0.14
      - Math.max(0, liveMatch.pressureValue - 58) * 0.2
      + (liveMatch.tacticalPlan === 'Attack' && atTableIsPlayer ? 5 : 0),
    18,
    91,
  )
  const positionChance = clamp(
    profile.breakBuilding * 0.32
      + profile.cueBallControl * 0.34
      + profile.focus * 0.16
      + confidence * 0.08
      - fatigue * 0.12
      + (liveMatch.currentBreak > 20 ? 5 : 0),
    14,
    90,
  )
  const safetyRisk = clamp(
    78
      - profile.safetyPlay * 0.42
      - profile.focus * 0.16
      + Math.max(0, liveMatch.pressureValue - 54) * 0.24
      + fatigue * 0.08,
    8,
    82,
  )
  const recommendation: ShotMoment['recommendation'] = needsSnookers
    ? 'Snooker'
    : basePotChance >= 68 && positionChance >= 54
      ? liveMatch.currentBreak >= 12 ? 'Build' : 'Attack'
      : safetyRisk <= 34 || basePotChance < 46
        ? 'Safe'
        : 'Attack'
  const shotType: LiveVisitDecision = recommendation === 'Build'
    ? 'Break Build'
    : recommendation === 'Safe'
      ? 'Safety Exchange'
      : recommendation === 'Snooker'
        ? 'Snooker Hunt'
        : 'Pot Attempt'
  const targetBall = onColours
    ? liveMatch.tableState.coloursRemaining[0] ?? 'Black'
    : liveMatch.currentBreak > 0
      ? 'Black'
      : 'Red'

  return {
    shotType,
    shotLabel: targetBall === 'Red' ? 'Long Pot' : `${targetBall} Pot`,
    potChance: Math.round(basePotChance),
    positionChance: Math.round(positionChance),
    safetyRisk: Math.round(safetyRisk),
    difficulty: getDifficultyLabel(basePotChance, liveMatch.pressureValue),
    recommendation,
    targetBall,
    targetPocket: targetBall === 'Red' ? 'Top Right Corner' : 'Middle Pocket',
    leave: recommendation === 'Safe'
      ? 'Leave white tight to baulk'
      : targetBall === 'Red'
        ? 'Leave on black or blue'
        : 'Stay high side for next colour',
  }
}

function getDecisionButtonCopy(decision: LiveVisitDecision) {
  if (decision === 'Pot Attempt') return { title: 'Play Shot', hint: 'Take the pot', icon: CircleDot }
  if (decision === 'Safety Exchange') return { title: 'Play Safe', hint: 'Defensive shot', icon: Shield }
  if (decision === 'Break Build') return { title: 'Build Break', hint: 'Continue scoring', icon: BarChart3 }
  if (decision === 'Snooker Hunt') return { title: 'Snooker Hunt', hint: 'Force foul points', icon: Target }
  return { title: 'Respotted Black', hint: 'Decide the frame', icon: CircleDot }
}

function getStatRows(liveMatch: LiveMatchViewState, moment: ShotMoment) {
  const safetyLabel = moment.safetyRisk <= 28 ? 'Low' : moment.safetyRisk <= 55 ? 'Medium' : 'High'
  return [
    ['Shot Type', moment.shotLabel, 'text-white'],
    ['On Ball', moment.targetBall, 'text-white'],
    ['Pot Chance', pct(moment.potChance), toneForPercent(moment.potChance)],
    ['Position Chance', pct(moment.positionChance), toneForPercent(moment.positionChance)],
    ['Safety Risk', safetyLabel, moment.safetyRisk <= 34 ? 'text-green-400' : moment.safetyRisk <= 58 ? 'text-amber-400' : 'text-red-400'],
    ['Difficulty', moment.difficulty, moment.difficulty === 'Low' ? 'text-green-400' : moment.difficulty === 'Medium' ? 'text-amber-400' : 'text-red-400'],
    ['Recommendation', moment.recommendation, moment.recommendation === 'Safe' ? 'text-amber-400' : 'text-green-400'],
    ['Points Left', `${getRemainingTablePoints(liveMatch)}`, 'text-white'],
  ]
}

function MomentumStrip({ liveMatch }: { liveMatch: LiveMatchViewState }) {
  const points = liveMatch.momentum.slice(-12)
  const values = points.length > 0 ? points : [{ label: 'Start', player: 50, opponent: 50 }]
  return (
    <div className="flex h-20 items-end gap-1 border-b border-l border-border/70 px-1 pb-1">
      {values.map((point, index) => {
        const delta = point.player - point.opponent
        const height = clamp(Math.abs(delta) * 8 + 14, 12, 70)
        return (
          <div key={`${point.label}-${index}`} className="flex flex-1 flex-col items-center justify-end gap-1">
            <div className={delta >= 0 ? 'w-full rounded-t bg-green-500/80' : 'w-full rounded-t bg-amber-400/80'} style={{ height }} />
            <span className="text-[8px] text-gray-500">{point.label.replace('F', '')}</span>
          </div>
        )
      })}
    </div>
  )
}

function PlayerPanel({
  name,
  score,
  frames,
  role,
  atTable,
  tone,
}: {
  name: string
  score: number
  frames: number
  role: string
  atTable: boolean
  tone: 'green' | 'red'
}) {
  const toneClass = tone === 'green' ? 'border-green-500/40 bg-green-500/10 text-green-400' : 'border-red-500/40 bg-red-500/10 text-red-300'
  return (
    <div className={`grid grid-cols-[48px_minmax(0,1fr)_88px] items-center gap-3 rounded-lg border px-3 py-2 ${toneClass}`}>
      <div className="flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-white/10 text-sm font-bold text-white">{getInitials(name)}</div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold uppercase tracking-wide text-white">{name}</p>
        <p className="mt-0.5 truncate text-[10px] text-gray-300">{role}</p>
        <p className={atTable ? 'mt-1 text-[10px] font-semibold text-green-300' : 'mt-1 text-[10px] text-gray-500'}>{atTable ? 'At table' : 'Waiting'}</p>
      </div>
      <div className="text-right">
        <p className="text-4xl font-black leading-none text-white">{score}</p>
        <p className="mt-1 text-[10px] text-gray-400">Frames {frames}</p>
      </div>
    </div>
  )
}

function TacticButtonGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: T[]
  onChange: (value: T) => void
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase text-gray-500">{label}</p>
      <div className="grid grid-cols-3 gap-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`min-h-8 rounded-md border px-1.5 text-[10px] font-bold uppercase transition-colors ${
              value === option
                ? 'border-green-500 bg-green-500/20 text-green-300'
                : 'border-border bg-black/20 text-gray-400 hover:border-green-500/50 hover:text-white'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function Ball({ className = '', label, style }: { className?: string; label?: string; style?: CSSProperties }) {
  return <div title={label} style={style} className={`absolute h-3.5 w-3.5 rounded-full border border-white/20 shadow-[0_2px_5px_rgba(0,0,0,0.45)] ${className}`} />
}

function SnookerTable({ liveMatch, moment }: { liveMatch: LiveMatchViewState; moment: ShotMoment }) {
  const redPositions = [
    [49, 66], [47, 69], [51, 69], [45, 72], [49, 72], [53, 72], [43, 75], [47, 75], [51, 75], [55, 75],
    [45, 78], [49, 78], [53, 78], [47, 81], [51, 81],
  ].slice(0, liveMatch.tableState.redsRemaining)
  const colours = [
    ['Yellow', 32, 32],
    ['Green', 44, 29],
    ['Brown', 54, 33],
    ['Blue', 51, 48],
    ['Pink', 52, 63],
    ['Black', 50, 82],
  ].filter(([name]) => name !== 'Black' || liveMatch.tableState.redsRemaining > 0 || liveMatch.tableState.coloursRemaining.includes('Black'))

  return (
    <div className="relative h-full min-h-[360px] overflow-hidden rounded-md border-[12px] border-[#4b2514] bg-[#0f6f23] shadow-[inset_0_0_70px_rgba(0,0,0,0.55),0_28px_60px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_65%,rgba(255,255,255,0.12),transparent_18%),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:auto,42px_42px,42px_42px] opacity-40" />
      <div className="absolute left-[15%] top-0 h-full border-l border-white/25" />
      <div className="absolute left-[7%] top-[42%] h-28 w-28 rounded-full border border-white/25" />
      {['left-0 top-0', 'right-0 top-0', 'left-1/2 top-0 -translate-x-1/2', 'left-0 bottom-0', 'right-0 bottom-0', 'left-1/2 bottom-0 -translate-x-1/2'].map((position) => (
        <div key={position} className={`absolute h-8 w-8 rounded-full bg-black/80 ${position}`} />
      ))}
      {redPositions.map(([x, y], index) => <Ball key={`red-${index}`} className="bg-red-600" style={{ left: `${x}%`, top: `${y}%` }} label="Red" />)}
      {colours.map(([name, x, y]) => <Ball key={String(name)} className={BALL_COLOURS[String(name)] ?? 'bg-white'} style={{ left: `${x}%`, top: `${y}%` }} label={String(name)} />)}
      <Ball className="h-4 w-4 bg-white" style={{ left: '34%', top: '76%' }} label="Cue ball" />
      <div className="absolute left-[35%] top-[77%] h-[3px] w-[29%] origin-left -rotate-[39deg] rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.85)]" />
      <div className="absolute left-[62%] top-[46%] h-[1px] w-[20%] origin-left -rotate-[31deg] border-t border-dashed border-white/70" />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-black/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/60">
        {moment.targetBall} to {moment.targetPocket}
      </div>
    </div>
  )
}

function LastShot({ liveMatch, moment }: { liveMatch: LiveMatchViewState; moment: ShotMoment }) {
  const last = liveMatch.visitHistory[0]
  return (
    <div className="rounded-lg border border-border bg-surface/80 p-3">
      <p className="text-xs font-bold uppercase text-white">Last Shot</p>
      <div className="mt-3 grid grid-cols-[96px_minmax(0,1fr)] gap-3">
        <div className="relative h-20 rounded border border-[#4b2514] bg-[#0f6f23]">
          <span className="absolute bottom-4 left-4 h-2.5 w-2.5 rounded-full bg-white" />
          <span className="absolute left-12 top-8 h-2.5 w-2.5 rounded-full bg-red-600" />
          <span className="absolute right-2 top-2 h-4 w-4 rounded-full bg-black/80" />
          <span className="absolute left-6 top-10 h-[1px] w-14 -rotate-[28deg] border-t border-dashed border-white/60" />
        </div>
        <div className="min-w-0 text-xs">
          <p className="truncate text-white">{last ? `${last.decision} - ${last.outcome}` : `${moment.shotLabel} lined up`}</p>
          <p className={last?.success ? 'mt-2 text-green-400' : last?.foulOccurred ? 'mt-2 text-red-400' : 'mt-2 text-gray-400'}>
            {last ? (last.success ? 'Positive result' : last.foulOccurred ? 'Foul conceded' : 'Chance missed') : 'Awaiting first visit'}
          </p>
          <p className="mt-1 text-gray-400">{last ? `${last.breakTotal} break total` : moment.leave}</p>
        </div>
      </div>
    </div>
  )
}

export function LiveMatchPage() {
  const {
    gameState,
    playLiveVisit,
    simulateLiveVisit,
    simulateLiveFrame,
    simulateLiveMatch,
    applyLiveCoachCue,
    concedeLiveFrame,
    updateLiveMatchTactics,
  } = useGame()
  const navigate = useNavigate()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [concedeConfirmationOpen, setConcedeConfirmationOpen] = useState(false)
  const liveMatch = gameState.liveMatch
  const tournament = liveMatch ? gameState.tournaments.find((item) => item.id === liveMatch.tournamentId) : null
  const tournamentName = tournament?.name ?? 'Live Match'

  useEffect(() => {
    if (liveMatch?.status === 'Completed') navigate('/match/result', { replace: true })
  }, [liveMatch?.status, navigate])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!liveMatch || event.altKey || event.ctrlKey || event.metaKey) return
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key.toLowerCase() === 'd') {
        setDetailsOpen((open) => !open)
        return
      }
      if (liveMatch.playerAtTable !== liveMatch.playerName) {
        if (event.key === '1' || event.key === 'Enter') simulateLiveVisit()
        return
      }
      const recommended = buildShotMoment(liveMatch, true).shotType
      const needsSnookers = areSnookersRequired(liveMatch.opponentPoints - liveMatch.playerPoints, getRemainingTablePoints(liveMatch)) && liveMatch.tableState.redsRemaining === 0
      const available: LiveVisitDecision[] = needsSnookers
        ? ['Snooker Hunt', 'Safety Exchange', 'Pot Attempt', 'Break Build']
        : ['Pot Attempt', 'Safety Exchange', 'Break Build']
      const ordered = [recommended, ...available.filter((decision) => decision !== recommended)]
      const index = Number(event.key) - 1
      if (index >= 0 && index < ordered.length) playLiveVisit(ordered[index])
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [liveMatch, playLiveVisit, simulateLiveVisit])

  if (!liveMatch) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050b12] p-6 text-white">
        <div className="w-full max-w-xl rounded-lg border border-border bg-surface/90 p-8 text-center">
          <p className="text-[10px] font-semibold uppercase text-gray-500">Match Centre</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Live Match</h1>
          <Activity className="mx-auto h-14 w-14 text-gray-500" />
          <p className="mt-4 text-xl font-semibold text-white">No active table session</p>
          <p className="mt-2 text-sm text-gray-400">Enter the event, then choose Play Live Match from the tournament hub or match preview.</p>
          <button type="button" onClick={() => navigate('/tournaments/hub')} className="btn-primary mx-auto mt-6 text-xs">Go To Tournament Hub</button>
        </div>
      </div>
    )
  }

  const atTableIsPlayer = liveMatch.playerAtTable === liveMatch.playerName
  const moment = buildShotMoment(liveMatch, atTableIsPlayer)
  const duration = formatClock(liveMatch.timeElapsedMinutes)
  const shotRows = getStatRows(liveMatch, moment)
  const activeDecision = atTableIsPlayer ? moment.shotType : null
  const playerNeedsSnookers = areSnookersRequired(liveMatch.opponentPoints - liveMatch.playerPoints, getRemainingTablePoints(liveMatch)) && liveMatch.tableState.redsRemaining === 0
  const decisionOptions: LiveVisitDecision[] = playerNeedsSnookers
    ? ['Snooker Hunt', 'Safety Exchange', 'Pot Attempt', 'Break Build']
    : ['Pot Attempt', 'Safety Exchange', 'Break Build']
  const orderedDecisions = activeDecision
    ? [activeDecision, ...decisionOptions.filter((decision) => decision !== activeDecision)]
    : decisionOptions
  const alternativeDecisions = orderedDecisions.slice(1)
  const recommendationReason = moment.recommendation === 'Safe'
    ? `The pot is only ${moment.potChance}%. A safety keeps the miss risk under control.`
    : moment.recommendation === 'Snooker'
      ? 'You need foul points. Prioritise a difficult escape over the low-value pot.'
      : moment.recommendation === 'Build'
        ? `${moment.positionChance}% position chance makes this the best route to extend the break.`
        : `${moment.potChance}% pot chance gives you the clearest scoring opportunity.`

  return (
    <div className="min-h-screen overflow-auto bg-[#050b12] p-3 text-white sm:p-4">
      <header className="mx-auto flex max-w-[1500px] items-center gap-3 rounded-xl border border-border bg-surface/85 px-3 py-2.5">
        <button type="button" aria-label="Return to Tournament Hub" onClick={() => navigate('/tournaments/hub')} className="rounded-lg border border-border bg-surface-light p-2 text-gray-300 transition hover:border-green-500/50 hover:text-white">
          <Menu aria-hidden="true" className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold text-white sm:text-base">{tournamentName} · {liveMatch.round}</h1>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-gray-400">
            <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Best of {liveMatch.bestOf} · {tournament?.location ?? liveMatch.table} · {duration}</span>
          </p>
        </div>
        <div className="hidden items-center gap-3 text-right sm:flex">
          <div><p className="text-[10px] uppercase text-gray-500">Frame</p><p className="font-bold">{liveMatch.currentFrame}</p></div>
          <div><p className="text-[10px] uppercase text-gray-500">On table</p><p className="max-w-32 truncate text-sm font-semibold text-green-300">{getShortName(liveMatch.playerAtTable)}</p></div>
        </div>
      </header>

      <div className="mx-auto mt-3 grid max-w-[1500px] gap-2 lg:grid-cols-[1fr_190px_1fr]">
        <PlayerPanel name={liveMatch.playerName} score={liveMatch.playerPoints} frames={liveMatch.playerFrames} role={gameState.player.competitiveStatus ?? gameState.player.careerStage} atTable={atTableIsPlayer} tone="green" />
        <div className="order-first rounded-lg border border-border bg-surface/90 px-4 py-2 text-center lg:order-none">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Match score</p>
          <div className="mt-1 flex items-center justify-center gap-3">
            <span className="text-3xl font-black text-green-400">{liveMatch.playerFrames}</span>
            <span className="text-xs uppercase text-gray-500">vs</span>
            <span className="text-3xl font-black text-red-300">{liveMatch.opponentFrames}</span>
          </div>
          <p className="text-[10px] text-gray-500">{liveMatch.framesRemainingText}</p>
        </div>
        <PlayerPanel name={liveMatch.opponentName} score={liveMatch.opponentPoints} frames={liveMatch.opponentFrames} role={`${liveMatch.opponentArchetype} - #${liveMatch.opponentRanking}`} atTable={!atTableIsPlayer} tone="red" />
      </div>

      <main className="mx-auto mt-3 grid max-w-[1500px] gap-3 xl:grid-cols-[minmax(0,1fr)_370px]">
        <div className="min-w-0">
          <SnookerTable liveMatch={liveMatch} moment={moment} />
          <div aria-live="polite" className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-border bg-surface/75 px-3 py-2 text-xs">
            <span className="truncate text-gray-300">{liveMatch.feed[0]?.text ?? 'The table is ready.'}</span>
            <span className="shrink-0 text-gray-500">{getFramePhase(liveMatch)} · {getRemainingTablePoints(liveMatch)} pts left</span>
          </div>
        </div>

        <aside className="rounded-xl border border-border bg-surface/90 p-4 shadow-panel">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-green-400">{atTableIsPlayer ? 'Your turn' : 'Opponent at table'}</p>
              <h2 className="mt-1 text-xl font-bold">{atTableIsPlayer ? `${moment.targetBall} is on` : `${liveMatch.opponentName}'s visit`}</h2>
            </div>
            <div className="rounded-lg border border-border bg-black/20 px-3 py-2 text-center">
              <p className="text-[9px] uppercase text-gray-500">Break</p>
              <p className="text-xl font-black text-green-400">{liveMatch.currentBreak}</p>
            </div>
          </div>

          {atTableIsPlayer && activeDecision ? (() => {
            const copy = getDecisionButtonCopy(activeDecision)
            const Icon = copy.icon
            return (
              <>
                <p className="mt-3 text-sm leading-relaxed text-gray-300">{recommendationReason}</p>
                <button type="button" onClick={() => playLiveVisit(activeDecision)} className="mt-4 flex min-h-14 w-full items-center gap-3 rounded-lg border border-green-400/60 bg-green-600 px-4 py-3 text-left transition hover:bg-green-500">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                  <span className="min-w-0 flex-1"><span className="block font-bold">{copy.title}</span><span className="block text-xs text-green-50/80">Recommended · {copy.hint}</span></span>
                  <kbd className="rounded border border-white/25 bg-black/15 px-2 py-1 text-xs">1</kbd>
                </button>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  {alternativeDecisions.map((decision, index) => {
                    const alternative = getDecisionButtonCopy(decision)
                    const AlternativeIcon = alternative.icon
                    return <button key={decision} type="button" onClick={() => playLiveVisit(decision)} className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-surface-light/70 px-3 py-2 text-left transition hover:border-green-500/50"><AlternativeIcon aria-hidden="true" className="h-4 w-4 text-gray-400" /><span className="flex-1 text-sm font-semibold">{alternative.title}</span><kbd className="text-[10px] text-gray-500">{index + 2}</kbd></button>
                  })}
                </div>
              </>
            )
          })() : (
            <>
              <p className="mt-3 text-sm text-gray-300">Continue when you are ready to see how the visit unfolds.</p>
              <button type="button" onClick={() => simulateLiveVisit()} className="mt-4 flex min-h-14 w-full items-center gap-3 rounded-lg border border-amber-400/50 bg-amber-500/15 px-4 py-3 text-left transition hover:border-amber-300">
                <Eye aria-hidden="true" className="h-6 w-6 text-amber-300" /><span className="flex-1"><span className="block font-bold">Continue visit</span><span className="block text-xs text-gray-400">See the opponent's outcome</span></span><kbd className="text-xs text-gray-500">1</kbd>
              </button>
            </>
          )}

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Match speed</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button type="button" onClick={() => simulateLiveVisit()} className="rounded-lg border border-border bg-black/20 px-2 py-2 text-xs font-semibold hover:border-green-500/50">Sim Visit</button>
              <button type="button" onClick={() => simulateLiveFrame()} className="rounded-lg border border-border bg-black/20 px-2 py-2 text-xs font-semibold hover:border-green-500/50">Sim Frame</button>
              <button type="button" onClick={() => simulateLiveMatch()} className="rounded-lg border border-border bg-black/20 px-2 py-2 text-xs font-semibold hover:border-green-500/50">Sim Match</button>
            </div>
          </div>

          <button type="button" aria-expanded={detailsOpen} onClick={() => setDetailsOpen((open) => !open)} className="mt-4 flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-sm font-semibold text-gray-300 hover:text-white">
            <span>Details and tactics <kbd className="ml-1 text-[10px] font-normal text-gray-500">D</kbd></span><ChevronDown aria-hidden="true" className={`h-4 w-4 transition ${detailsOpen ? 'rotate-180' : ''}`} />
          </button>
          <button type="button" onClick={() => setConcedeConfirmationOpen(true)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-500 transition hover:bg-red-500/10 hover:text-red-300"><MoreHorizontal aria-hidden="true" className="h-4 w-4" /> Concede frame</button>
        </aside>
      </main>

      {detailsOpen ? (
        <section className="mx-auto mt-3 grid max-w-[1500px] gap-3 rounded-xl border border-border bg-surface/75 p-3 lg:grid-cols-3">
          <div className="rounded-lg bg-black/15 p-3">
            <h3 className="text-xs font-bold uppercase text-white">Shot and status</h3>
            <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2">
              {shotRows.map(([label, value, tone]) => <div key={label} className="flex justify-between gap-2 text-xs"><span className="text-gray-400">{label}</span><span className={`font-bold ${tone}`}>{value}</span></div>)}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div><div className="mb-1 flex justify-between text-xs"><span className="text-gray-400">Confidence</span><span>{pct(liveMatch.playerConfidence)}</span></div><ProgressBar value={liveMatch.playerConfidence} compact /></div>
              <div><div className="mb-1 flex justify-between text-xs"><span className="text-gray-400">Fatigue</span><span>{pct(liveMatch.playerFatigue)}</span></div><ProgressBar value={liveMatch.playerFatigue} tone="amber" compact /></div>
            </div>
          </div>
          <div className="rounded-lg bg-black/15 p-3">
            <div className="flex items-center justify-between"><h3 className="text-xs font-bold uppercase text-white">Tactics</h3><Brain aria-hidden="true" className="h-4 w-4 text-amber-300" /></div>
            <div className="mt-3 space-y-3">
              <TacticButtonGroup<LiveTacticalPlan> label="Plan" value={liveMatch.tacticalPlan} options={['Attack', 'Balanced', 'Safety']} onChange={(tacticalPlan) => updateLiveMatchTactics({ tacticalPlan })} />
              <TacticButtonGroup<LiveMentalFocus> label="Focus" value={liveMatch.mentalFocus} options={['Composed', 'Confident', 'Counter']} onChange={(mentalFocus) => updateLiveMatchTactics({ mentalFocus })} />
              <TacticButtonGroup<LiveTempo> label="Tempo" value={liveMatch.tempo} options={['Steady', 'Quick']} onChange={(tempo) => updateLiveMatchTactics({ tempo })} />
              <button type="button" onClick={() => applyLiveCoachCue()} className="w-full rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 hover:border-amber-400/60">Ask coach for a cue</button>
            </div>
          </div>
          <div className="rounded-lg bg-black/15 p-3">
            <div className="flex items-center justify-between"><h3 className="text-xs font-bold uppercase text-white">Match detail</h3><Zap aria-hidden="true" className="h-4 w-4 text-green-400" /></div>
            <div className="mt-3 max-h-32 space-y-2 overflow-y-auto pr-1 text-[11px] scrollbar-thin">{liveMatch.feed.slice(0, 6).map((feed) => <div key={feed.id} className="grid grid-cols-[34px_minmax(0,1fr)] gap-2"><span className="text-gray-500">{feed.time}</span><span className={feed.tone === 'green' ? 'text-green-300' : feed.tone === 'red' ? 'text-red-300' : feed.tone === 'amber' ? 'text-amber-300' : 'text-gray-300'}>{feed.text}</span></div>)}</div>
            <div className="mt-3"><MomentumStrip liveMatch={liveMatch} /><div className="mt-1 flex justify-between text-[10px] text-gray-500"><span>{getShortName(liveMatch.playerName)}</span><span>{getShortName(liveMatch.opponentName)}</span></div></div>
            <div className="mt-3"><LastShot liveMatch={liveMatch} moment={moment} /></div>
          </div>
        </section>
      ) : null}

      {concedeConfirmationOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-labelledby="concede-title"><div className="w-full max-w-sm rounded-xl border border-red-500/35 bg-surface p-5 shadow-2xl"><h2 id="concede-title" className="text-lg font-bold">Concede this frame?</h2><p className="mt-2 text-sm text-gray-400">Your opponent will be awarded the frame. This cannot be undone.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setConcedeConfirmationOpen(false)} className="btn-secondary">Keep playing</button><button type="button" onClick={() => { setConcedeConfirmationOpen(false); concedeLiveFrame() }} className="rounded-lg border border-red-500/50 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/25">Concede frame</button></div></div></div> : null}
    </div>
  )
}
