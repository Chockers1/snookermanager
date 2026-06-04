import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  CalendarDays,
  CircleDot,
  Eye,
  Gauge,
  Handshake,
  Menu,
  Shield,
  Target,
  Zap,
} from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/GameStateContext'

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
const TABLE_COLOURS = ['Yellow', 'Green', 'Brown', 'Blue', 'Pink', 'Black'] as const
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

function TableOverview({ liveMatch }: { liveMatch: LiveMatchViewState }) {
  return (
    <div className="rounded-lg border border-border bg-surface/80 p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase text-white">Table Overview</p>
        <p className="text-[10px] text-gray-400">{getFramePhase(liveMatch)}</p>
      </div>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: liveMatch.tableState.redsRemaining }).map((_, index) => <span key={index} className="h-2.5 w-2.5 rounded-full bg-red-600" />)}
        <span className="ml-2 text-xs font-bold text-white">{liveMatch.tableState.redsRemaining}</span>
        <span className="text-xs text-gray-400">Reds</span>
      </div>
      <div className="mt-4 grid grid-cols-6 gap-2">
        {TABLE_COLOURS.map((colour) => {
          const active = liveMatch.tableState.redsRemaining > 0 || liveMatch.tableState.coloursRemaining.includes(colour)
          return (
            <div key={colour} className="text-center">
              <div className={`mx-auto h-4 w-4 rounded-full border border-white/20 ${BALL_COLOURS[colour]} ${active ? '' : 'opacity-25'}`} />
              <p className="mt-1 text-[10px] text-gray-400">{COLOUR_POINTS[colour]}</p>
              <p className="truncate text-[9px] text-gray-500">{colour}</p>
            </div>
          )
        })}
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

function isFinalRound(round: string) {
  return round.trim().toLowerCase() === 'final'
}

export function LiveMatchPage() {
  const {
    gameState,
    playLiveVisit,
    simulateLiveVisit,
    applyLiveCoachCue,
    concedeLiveFrame,
    updateLiveMatchTactics,
  } = useGame()
  const navigate = useNavigate()
  const liveMatch = gameState.liveMatch
  const tournament = liveMatch ? gameState.tournaments.find((item) => item.id === liveMatch.tournamentId) : null
  const tournamentName = tournament?.name ?? 'Live Match'

  useEffect(() => {
    if (liveMatch?.status === 'Completed') navigate(isFinalRound(liveMatch.round) ? '/rankings?from=final' : '/tournaments/hub', { replace: true })
  }, [liveMatch?.status, navigate])

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

  return (
    <div className="flex h-screen min-h-[700px] flex-col overflow-hidden bg-[#050b12] p-3 text-white">
      <div className="mb-2 grid grid-cols-[210px_minmax(0,1fr)_210px] items-center gap-3">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-2xl font-black uppercase leading-none tracking-wide">Snooker</p>
            <p className="text-xs font-bold uppercase text-green-400">Career Manager</p>
          </div>
          <button type="button" onClick={() => navigate('/tournaments/hub')} className="rounded-lg border border-border bg-surface-light p-2 text-gray-300 hover:text-white">
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <div className="min-w-0 text-center">
          <h1 className="truncate text-xl font-black uppercase tracking-wide">{tournamentName} - {liveMatch.round}</h1>
          <p className="mt-1 flex items-center justify-center gap-2 truncate text-xs text-gray-400">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{liveMatch.startedAt} - {tournament?.type ?? 'Match'} - {liveMatch.round} - Best of {liveMatch.bestOf} Frames - {tournament?.location ?? liveMatch.table}</span>
          </p>
        </div>
        <div className="flex justify-end gap-3 text-gray-400">
          <Bell className="h-5 w-5" />
          <Gauge className="h-5 w-5" />
        </div>
      </div>

      <div className="mb-2 grid grid-cols-[1fr_230px_1fr] gap-2">
        <PlayerPanel name={liveMatch.playerName} score={liveMatch.playerPoints} frames={liveMatch.playerFrames} role={gameState.player.competitiveStatus ?? gameState.player.careerStage} atTable={atTableIsPlayer} tone="green" />
        <div className="rounded-lg border border-border bg-surface/90 px-4 py-2 text-center">
          <p className="text-xs font-bold uppercase text-gray-400">Frame {liveMatch.currentFrame}</p>
          <div className="mt-1 flex items-center justify-center gap-4">
            <span className="text-3xl font-black text-green-400">{liveMatch.playerFrames}</span>
            <span className="text-xs uppercase text-gray-500">vs</span>
            <span className="text-3xl font-black text-red-300">{liveMatch.opponentFrames}</span>
          </div>
          <p className="mt-1 text-[10px] text-gray-500">{duration} - {liveMatch.framesRemainingText}</p>
        </div>
        <PlayerPanel name={liveMatch.opponentName} score={liveMatch.opponentPoints} frames={liveMatch.opponentFrames} role={`${liveMatch.opponentArchetype} - #${liveMatch.opponentRanking}`} atTable={!atTableIsPlayer} tone="red" />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[200px_minmax(520px,1fr)_266px] gap-2">
        <aside className="flex min-h-0 flex-col gap-2">
          <div className="rounded-lg border border-border bg-surface/85 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase text-white">Shot Info</p>
              <CircleDot className="h-4 w-4 text-gray-500" />
            </div>
            <div className="space-y-2">
              {shotRows.map(([label, value, tone]) => (
                <div key={label} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-gray-400">{label}</span>
                  <span className={`font-bold ${tone}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface/85 p-3">
            <p className="mb-3 text-xs font-bold uppercase text-white">Player Status</p>
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-xs"><span className="text-gray-400">Confidence</span><span>{pct(liveMatch.playerConfidence)}</span></div>
                <ProgressBar value={liveMatch.playerConfidence} compact />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs"><span className="text-gray-400">Fatigue</span><span>{pct(liveMatch.playerFatigue)}</span></div>
                <ProgressBar value={liveMatch.playerFatigue} tone="amber" compact />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Focus</span>
                <span className={liveMatch.mentalFocus === 'Composed' ? 'text-green-400' : liveMatch.mentalFocus === 'Confident' ? 'text-amber-400' : 'text-blue-300'}>{liveMatch.mentalFocus}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface/85 p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase text-white">Tactics</p>
              <Brain className="h-4 w-4 text-amber-300" />
            </div>
            <div className="space-y-3">
              <TacticButtonGroup<LiveTacticalPlan>
                label="Plan"
                value={liveMatch.tacticalPlan}
                options={['Attack', 'Balanced', 'Safety']}
                onChange={(tacticalPlan) => updateLiveMatchTactics({ tacticalPlan })}
              />
              <TacticButtonGroup<LiveMentalFocus>
                label="Focus"
                value={liveMatch.mentalFocus}
                options={['Composed', 'Confident', 'Counter']}
                onChange={(mentalFocus) => updateLiveMatchTactics({ mentalFocus })}
              />
              <TacticButtonGroup<LiveTempo>
                label="Tempo"
                value={liveMatch.tempo}
                options={['Steady', 'Quick']}
                onChange={(tempo) => updateLiveMatchTactics({ tempo })}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface/85 p-3">
            <p className="text-xs font-bold uppercase text-white">Shot Timer</p>
            <div className="mx-auto mt-3 flex h-24 w-24 items-center justify-center rounded-full border-4 border-green-500/60 bg-green-500/10 text-center shadow-[inset_0_0_20px_rgba(34,197,94,0.2)]">
              <div>
                <p className="text-3xl font-black">{liveMatch.shotClock}</p>
                <p className="text-[10px] text-gray-400">Seconds</p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 rounded-lg border border-border bg-surface/85 p-3">
            <p className="mb-2 text-xs font-bold uppercase text-white">Live Commentary</p>
            <div className="max-h-full space-y-2 overflow-y-auto pr-1 text-[11px] scrollbar-thin">
              {liveMatch.feed.slice(0, 6).map((feed) => (
                <div key={feed.id} className="grid grid-cols-[34px_minmax(0,1fr)] gap-2">
                  <span className="text-gray-500">{feed.time}</span>
                  <span className={feed.tone === 'green' ? 'text-green-300' : feed.tone === 'red' ? 'text-red-300' : feed.tone === 'amber' ? 'text-amber-300' : 'text-gray-300'}>{feed.text}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="grid min-h-0 grid-rows-[minmax(0,1fr)_92px] gap-2">
          <SnookerTable liveMatch={liveMatch} moment={moment} />

          <div className="grid grid-cols-6 gap-2">
            {!atTableIsPlayer ? (
              <button
                type="button"
                onClick={() => simulateLiveVisit()}
                className="col-span-3 rounded-lg border border-amber-400/50 bg-amber-500/15 px-3 py-3 text-left transition-colors hover:border-amber-300"
              >
                <div className="flex items-center gap-3">
                  <Eye className="h-6 w-6 text-amber-300" />
                  <div>
                    <p className="text-sm font-black uppercase">Watch Visit</p>
                    <p className="text-[10px] text-gray-400">{liveMatch.opponentName} at table</p>
                  </div>
                </div>
              </button>
            ) : decisionOptions.map((decision) => {
              const copy = getDecisionButtonCopy(decision)
              const Icon = copy.icon
              const selected = activeDecision === decision
              return (
                <button
                  key={decision}
                  type="button"
                  onClick={() => playLiveVisit(decision)}
                  className={`rounded-lg border px-3 py-3 text-left transition-colors ${selected ? 'border-green-500 bg-green-600/25' : 'border-border bg-surface/90 hover:border-green-500/60'}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-green-300" />
                    <div>
                      <p className="text-sm font-black uppercase">{copy.title}</p>
                      <p className="text-[10px] text-gray-400">{copy.hint}</p>
                    </div>
                  </div>
                </button>
              )
            })}
            <button type="button" onClick={() => applyLiveCoachCue()} className="rounded-lg border border-border bg-surface/90 px-3 py-3 text-left hover:border-amber-400/60">
              <div className="flex items-center gap-3">
                <Brain className="h-6 w-6 text-amber-300" />
                <div>
                  <p className="text-sm font-black uppercase">Change Tactic</p>
                  <p className="text-[10px] text-gray-400">Coach cue</p>
                </div>
              </div>
            </button>
            <button type="button" onClick={() => concedeLiveFrame()} className="rounded-lg border border-border bg-surface/90 px-3 py-3 text-left hover:border-red-400/60">
              <div className="flex items-center gap-3">
                <Handshake className="h-6 w-6 text-red-300" />
                <div>
                  <p className="text-sm font-black uppercase">Concede Frame</p>
                  <p className="text-[10px] text-gray-400">Forfeit this frame</p>
                </div>
              </div>
            </button>
          </div>
        </main>

        <aside className="flex min-h-0 flex-col gap-2">
          <TableOverview liveMatch={liveMatch} />

          <div className="rounded-lg border border-border bg-surface/85 p-3">
            <p className="text-xs font-bold uppercase text-white">Break</p>
            <div className="mt-3 grid grid-cols-3 divide-x divide-border text-center">
              <div><p className="text-[10px] text-gray-500">Break</p><p className="text-2xl font-black text-green-400">{liveMatch.currentBreak}</p></div>
              <div><p className="text-[10px] text-gray-500">Run</p><p className="text-2xl font-black">{liveMatch.currentVisit}</p></div>
              <div><p className="text-[10px] text-gray-500">High</p><p className="text-2xl font-black">{liveMatch.playerHighestBreak}</p></div>
            </div>
          </div>

          <LastShot liveMatch={liveMatch} moment={moment} />

          <div className="rounded-lg border border-border bg-surface/85 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase text-white">Match Momentum</p>
              <Zap className="h-4 w-4 text-green-400" />
            </div>
            <MomentumStrip liveMatch={liveMatch} />
            <div className="mt-2 flex justify-between text-[10px] text-gray-400">
              <span>{getShortName(liveMatch.playerName)}</span>
              <span>{getShortName(liveMatch.opponentName)}</span>
            </div>
          </div>

        </aside>
      </div>
    </div>
  )
}
