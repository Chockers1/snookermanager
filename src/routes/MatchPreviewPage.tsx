import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  ChevronRight,
  Clock,
  Gauge,
  Info,
  MapPin,
  Search,
  ShieldCheck,
  Swords,
  Target,
  Users,
  Wrench,
  Zap,
} from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/useGame'
import { getTournamentPlayability } from '../hooks/useGameState'
import { buildMatchPreviewData } from '../utils/liveRouteData'
import { formatMoney } from '../utils/formatters'

const FRAME_PLANS = ['Attack', 'Balanced', 'Safety'] as const
const MENTAL_FOCUS_OPTIONS = ['Composed', 'Confident', 'Counter'] as const
const TEMPO_OPTIONS = ['Steady', 'Quick'] as const

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function getRankValue(rank: number | null | undefined) {
  return rank ?? '-'
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getDifficultyLabel(playerRank: number | null | undefined, opponentRank: number | undefined) {
  if (!opponentRank || !playerRank) return 'Unknown test'
  const edge = opponentRank - playerRank
  if (edge >= 8) return 'Favourite'
  if (edge >= -7) return 'Even match'
  return 'Underdog test'
}

function getReadinessScore(confidence: number, fatigue: number, cueFamiliarity: number, pressureLevel: number) {
  return clamp(Math.round((confidence + (100 - fatigue) + cueFamiliarity + (100 - pressureLevel)) / 4), 0, 100)
}

function metricTone(value: number, inverse = false) {
  const adjusted = inverse ? 100 - value : value
  if (adjusted >= 72) return 'text-green-400'
  if (adjusted >= 52) return 'text-amber-400'
  return 'text-red-400'
}

function getEdgeTone(edge: number | null) {
  if (edge == null) return 'text-gray-500'
  if (edge >= 5) return 'text-green-400'
  if (edge <= -5) return 'text-red-400'
  return 'text-amber-400'
}

function formatEdgeLabel(edge: number | null) {
  if (edge == null) return 'Scout estimate pending'
  if (edge > 0) return `You +${edge}`
  if (edge < 0) return `Opponent +${Math.abs(edge)}`
  return 'Even matchup'
}

export function MatchPreviewPage() {
  const { gameState, startLiveMatch } = useGame()
  const navigate = useNavigate()
  const [plan, setPlan] = useState<(typeof FRAME_PLANS)[number]>('Balanced')
  const [focus, setFocus] = useState<(typeof MENTAL_FOCUS_OPTIONS)[number]>('Composed')
  const [tempo, setTempo] = useState<(typeof TEMPO_OPTIONS)[number]>('Steady')
  const {
    activeTournament,
    activeRound,
    nextOpponent,
    playerOverall,
    playerPotential,
    opponentOverall,
    opponentPotential,
    opponentConfidence,
    opponentFatigue,
    opponentPressure,
    currentCue,
    currentCueState,
    currentChalk,
    currentTip,
    bestOf,
    totalMeetings,
    wins,
    losses,
    eventWins,
    eventLosses,
    eventFrameDifferential,
    strengths,
    weaknesses,
    matchAttributeComparison,
    attributeComparison,
    scoutNotes,
    scoutConfidence,
    tacticalPlan,
    cueFamiliarity,
    recentOpponentResults,
    matchInfo,
    pressureLevel,
  } = buildMatchPreviewData(gameState)
  const playerRank = gameState.player.amateurRanking ?? gameState.player.worldRanking
  const activeLiveMatch = gameState.liveMatch?.status === 'In Progress' ? gameState.liveMatch : null
  const playability = activeTournament ? getTournamentPlayability(gameState, activeTournament) : null
  const opponentName = nextOpponent?.playerName ?? 'Opponent TBD'
  const opponentRank = nextOpponent?.ranking
  const readinessScore = getReadinessScore(gameState.player.confidence, gameState.player.fatigue, cueFamiliarity, pressureLevel)
  const difficultyLabel = getDifficultyLabel(playerRank, opponentRank)
  const equipmentRows = [
    { label: 'Cue', name: currentCue?.name ?? 'No cue selected', condition: currentCueState?.condition ?? currentCue?.condition ?? 0 },
    { label: 'Chalk', name: currentChalk?.name ?? 'Standard chalk', condition: clamp(70 + (currentChalk?.consistency ?? 0) / 2, 0, 100) },
    { label: 'Tip', name: currentTip?.name ?? 'Standard tip', condition: currentCueState?.tipCondition ?? currentTip?.durability ?? 0 },
  ]
  const keyScoutRows = strengths.slice(0, 3)
  const riskScoutRows = weaknesses.slice(0, 3)
  const opponentPatternText = recentOpponentResults.map((result) => `${result.result} ${result.score}`).join(' • ') || 'No recent data yet'

  function handleStartMatch() {
    if (activeLiveMatch) {
      navigate('/match/live')
      return
    }
    if (!activeTournament?.id) return
    if (!playability?.canPlay) {
      navigate(playability?.travelBooked === false && (playability.daysUntilStart ?? 0) <= 7 ? '/travel' : '/tournaments/hub')
      return
    }
    startLiveMatch(activeTournament.id)
    navigate('/match/live')
  }

  return (
    <div className="flex min-h-0 flex-col gap-3 xl:-m-6 xl:h-[calc(100vh-5.5rem)] xl:gap-2 xl:overflow-hidden xl:p-1.5">
      <div className="flex shrink-0 flex-col gap-2 rounded-lg border border-border bg-surface/85 px-3 py-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500">
            <span className="truncate">{activeTournament?.name ?? 'Match Centre'}</span>
            <ChevronRight className="h-3 w-3" />
            <span>{activeRound ?? 'Awaiting Entry'}</span>
            <ChevronRight className="h-3 w-3" />
            <span>{bestOf}</span>
          </div>
          <div className="mt-0.5 flex min-w-0 items-baseline gap-3">
            <h1 className="shrink-0 text-xl font-bold leading-tight text-white">Match Preview</h1>
            <p className="hidden min-w-0 truncate text-xs text-gray-400 sm:block">{gameState.player.fullName} against {opponentName}</p>
          </div>
          <p className="mt-1 truncate text-[10px] text-gray-400">
            <span className="font-semibold uppercase tracking-wide text-gray-500">Recent opponent pattern</span>
            <span className="mx-2 text-border">|</span>
            Event {eventWins}-{eventLosses} · Frames {eventFrameDifferential > 0 ? '+' : ''}{eventFrameDifferential} · {opponentPatternText}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <div className="card flex h-10 w-[96px] flex-col items-center justify-center text-center">
            <p className="text-[9px] font-semibold uppercase text-gray-500">Difficulty</p>
            <p className="text-xs font-bold text-green-400">{difficultyLabel}</p>
          </div>
          <div className="card flex h-10 w-[82px] flex-col items-center justify-center text-center">
            <p className="text-[9px] font-semibold uppercase text-gray-500">Readiness</p>
            <p className="text-xs font-bold text-white">{readinessScore}%</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate('/training')} className="btn-secondary h-10 whitespace-nowrap px-3 text-xs">Adjust Training</button>
            <button type="button" onClick={() => navigate('/equipment/chalk-tips')} className="btn-secondary h-10 whitespace-nowrap px-3 text-xs">Change Equipment</button>
            <button type="button" onClick={handleStartMatch} className="btn-primary h-10 whitespace-nowrap px-4 text-xs">
              {activeLiveMatch ? 'Resume Match' : playability?.canPlay ? 'Start Match' : !playability?.travelBooked && (playability?.daysUntilStart ?? 0) <= 7 ? 'Book Travel' : 'Tournament Hub'} <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {[
          { icon: Clock, label: 'Match Time', value: matchInfo.time },
          { icon: MapPin, label: 'Venue', value: activeTournament?.location ?? 'Venue TBC' },
          { icon: Target, label: 'Table', value: matchInfo.table },
          { icon: ShieldCheck, label: 'Referee', value: matchInfo.referee },
          { icon: Zap, label: 'Conditions', value: matchInfo.conditions, tone: 'text-green-400' },
          { icon: Swords, label: 'Format', value: bestOf },
        ].map((item) => (
          <div key={item.label} className="card flex h-[52px] min-w-0 items-center gap-3 px-3 py-2">
            <item.icon className="h-[18px] w-[18px] shrink-0 text-gray-400" />
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase text-gray-500">{item.label}</p>
              <p className={`truncate text-[12px] font-bold ${item.tone ?? 'text-white'}`}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div aria-label="Player profile" className="card min-h-0 border-green-600/70 bg-gradient-to-r from-green-600/15 via-green-600/5 to-surface p-3">
          <div className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> You
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-green-500 bg-green-600/10 text-xl font-bold text-green-400">
              {getInitials(gameState.player.fullName)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-white">{gameState.player.fullName}</h2>
              <p className="truncate text-[11px] text-gray-400">{gameState.player.careerStage} - {gameState.player.playingStyle}</p>
              <p className="mt-1.5 text-[11px] text-gray-400">
                {gameState.player.rankingLabel} <span className="font-bold text-white">#{getRankValue(playerRank)}</span>
                <span className="mx-2 text-border">|</span>
                Cash <span className="font-bold text-green-400">{formatMoney(gameState.player.cash)}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                OVR <span className="font-bold text-white">{playerOverall}</span>
                <span className="mx-2 text-border">|</span>
                POT <span className="font-bold text-green-400">{playerPotential}</span>
              </p>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 border-t border-border/60 pt-1.5 text-center">
            <div><p className="text-[10px] text-gray-400">Confidence</p><p className={`text-[15px] font-bold ${metricTone(gameState.player.confidence)}`}>{gameState.player.confidence}%</p></div>
            <div className="border-x border-border"><p className="text-[10px] text-gray-400">Fatigue</p><p className={`text-[15px] font-bold ${metricTone(gameState.player.fatigue, true)}`}>{gameState.player.fatigue}%</p></div>
            <div><p className="text-[10px] text-gray-400">Pressure</p><p className={`text-[15px] font-bold ${metricTone(pressureLevel, true)}`}>{pressureLevel}%</p></div>
          </div>
        </div>

        <div aria-label="Opponent profile" className="card min-h-0 border-red-600/70 bg-gradient-to-l from-red-600/15 via-red-600/5 to-surface p-3">
          <div className="mb-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Opponent
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-red-500 bg-red-600/10 text-xl font-bold text-red-400">
              {getInitials(opponentName)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-white">{opponentName}</h2>
              <p className="truncate text-[11px] text-gray-400">Ranking band scout - {difficultyLabel}</p>
              <p className="mt-1.5 text-[11px] text-gray-400">
                Rank <span className="font-bold text-white">#{getRankValue(opponentRank)}</span>
                <span className="mx-2 text-border">|</span>
                Scout <span className={`font-bold ${metricTone(scoutConfidence)}`}>{scoutConfidence}%</span>
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                OVR <span className="font-bold text-white">{opponentOverall ?? '--'}</span>
                <span className="mx-2 text-border">|</span>
                POT <span className="font-bold text-amber-400">{opponentPotential ?? '--'}</span>
              </p>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 border-t border-border/60 pt-1.5 text-center">
            <div><p className="text-[10px] text-gray-400">Confidence</p><p className={`text-[15px] font-bold ${metricTone(opponentConfidence)}`}>{opponentConfidence}%</p></div>
            <div className="border-x border-border"><p className="text-[10px] text-gray-400">Fatigue</p><p className={`text-[15px] font-bold ${metricTone(opponentFatigue, true)}`}>{opponentFatigue}%</p></div>
            <div><p className="text-[10px] text-gray-400">Pressure</p><p className={`text-[15px] font-bold ${metricTone(opponentPressure, true)}`}>{opponentPressure}%</p></div>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-12 xl:gap-2">
        <div className="grid min-h-0 gap-3 xl:col-span-4 xl:grid-rows-[0.26fr_0.74fr] xl:gap-2">
          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header px-3 py-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Users className="h-4 w-4 text-gray-400" />Head-to-Head</h3>
            </div>
            <div className="flex h-full items-center p-2.5">
              <div className="grid w-full grid-cols-3 rounded-md border border-border bg-surface-light/30 py-2 text-center">
                <div><p className="text-2xl font-bold text-green-400">{wins}</p><p className="text-[9px] text-gray-500">Your Wins</p></div>
                <div className="border-x border-border"><p className="text-2xl font-bold text-gray-400">{totalMeetings}</p><p className="text-[9px] text-gray-500">Meetings</p></div>
                <div><p className="text-2xl font-bold text-red-400">{losses}</p><p className="text-[9px] text-gray-500">Losses</p></div>
              </div>
            </div>
          </div>

          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header px-3 py-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Search className="h-4 w-4 text-gray-400" />Scout Report</h3>
              <span className="text-[10px] font-bold text-amber-400">{scoutConfidence}% confidence</span>
            </div>
            <div className="card-body flex h-full min-h-0 flex-col gap-3 overflow-auto px-3 py-3 scrollbar-thin">
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase text-green-400">Your strongest routes</p>
                <div className="space-y-2">
                  {keyScoutRows.map((trait) => (
                    <div key={trait.label} className="flex items-center gap-2">
                      <span className="w-24 shrink-0 truncate text-[11px] font-medium text-white">{trait.label}</span>
                      <div className="min-w-0 flex-1"><ProgressBar value={trait.value} compact /></div>
                      <span className="w-8 shrink-0 text-right text-[11px] font-bold text-white">{trait.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase text-red-400">Risk watch</p>
                <div className="space-y-2">
                  {riskScoutRows.map((trait) => (
                    <div key={trait.label} className="flex items-center gap-2">
                      <span className="w-24 shrink-0 truncate text-[11px] font-medium text-white">{trait.label}</span>
                      <div className="min-w-0 flex-1"><ProgressBar value={trait.value} tone="amber" compact /></div>
                      <span className="w-8 shrink-0 text-right text-[11px] font-bold text-white">{trait.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-surface-light/40 p-2.5 text-[11px] leading-relaxed text-gray-300">
                <p className="flex gap-2"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" /><span>{scoutNotes}</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 gap-3 xl:col-span-4 xl:grid-rows-[0.52fr_0.48fr] xl:gap-2">
          <div data-testid="tactical-plan" className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header px-3 py-1.5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Target className="h-4 w-4 text-gray-400" />Tactical Plan</h3>
              <span className="rounded bg-green-600/20 px-2 py-0.5 text-[9px] font-semibold uppercase text-green-400">Pre-match</span>
            </div>
            <div className="card-body flex h-full min-h-0 flex-col gap-1.5 px-2.5 py-1.5">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="min-w-0">
                  <p className="mb-1 text-[9px] font-semibold uppercase text-gray-500">Frame Plan</p>
                  <div className="grid min-w-0 grid-cols-3">
                  {FRAME_PLANS.map((option) => (
                    <button key={option} type="button" onClick={() => setPlan(option)} className={plan === option ? 'tab-active px-2 py-0.5 text-[10px]' : 'tab-inactive px-2 py-0.5 text-[10px]'}>{option}</button>
                  ))}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-[9px] font-semibold uppercase text-gray-500">Mental Focus</p>
                  <div className="grid min-w-0 grid-cols-3">
                  {MENTAL_FOCUS_OPTIONS.map((option) => (
                    <button key={option} type="button" onClick={() => setFocus(option)} className={focus === option ? 'tab-active px-2 py-0.5 text-[10px]' : 'tab-inactive px-2 py-0.5 text-[10px]'}>{option}</button>
                  ))}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-[9px] font-semibold uppercase text-gray-500">Tempo</p>
                  <div className="grid min-w-0 grid-cols-2">
                  {TEMPO_OPTIONS.map((option) => (
                    <button key={option} type="button" onClick={() => setTempo(option)} className={tempo === option ? 'tab-active px-2 py-0.5 text-[10px]' : 'tab-inactive px-2 py-0.5 text-[10px]'}>{option}</button>
                  ))}
                  </div>
                </div>
              </div>
              <div className="min-h-0 rounded-lg border border-green-600/40 bg-green-600/10 px-2.5 py-1.5">
                <p className="flex min-w-0 items-center gap-1.5 text-[10px] text-gray-300" title={`${tacticalPlan[0]?.description} ${tacticalPlan[0]?.impact}`}>
                  <Info className="h-3.5 w-3.5 shrink-0 text-green-400" />
                  <span className="shrink-0 font-semibold uppercase text-green-400">Coach:</span>
                  <span className="truncate">{tacticalPlan[0]?.description} {tacticalPlan[0]?.impact}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-body flex h-full min-h-0 flex-col gap-2.5 px-3 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><BarChart3 className="h-4 w-4 text-gray-400" />Matchup Analysis</h3>
              <div className="space-y-2">
                {tacticalPlan.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="w-28 shrink-0 truncate text-[11px] font-medium text-white">{item.label}</span>
                    <div className="min-w-0 flex-1"><ProgressBar value={item.level} tone={item.level >= 65 ? 'green' : 'amber'} compact /></div>
                    <span className="w-10 shrink-0 text-right text-[11px] font-bold text-green-400">{item.level}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-auto rounded-lg border border-amber-600/40 bg-amber-600/10 p-2.5 text-[11px] text-gray-300">
                <p className="mb-1 flex items-center gap-2 font-semibold uppercase text-amber-400"><AlertTriangle className="h-4 w-4" />Danger zone</p>
                <p>{gameState.player.fatigue >= 60 ? 'Fatigue is the main threat. Keep visits controlled and avoid forcing long attacking sequences.' : 'Pressure can swing quickly if the opponent settles first.'}</p>
                <p className="mt-1">Use safety to break rhythm when needed.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 gap-3 xl:col-span-4 xl:grid-rows-[0.74fr_0.26fr] xl:gap-2">
          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header px-3 py-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Gauge className="h-4 w-4 text-gray-400" />Match Profile Comparison</h3>
              <span className="text-[10px] font-semibold text-gray-500">You vs {getInitials(opponentName)}</span>
            </div>
            <div className="card-body flex h-full min-h-0 flex-col gap-2 overflow-auto px-3 py-3 scrollbar-thin">
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {matchAttributeComparison.map((item) => (
                  <div key={item.label} className="rounded-md border border-border bg-surface-light/40 p-1.5">
                    <p className="text-[9px] text-gray-400">{item.label}</p>
                    <p className="text-[15px] font-bold text-white">
                      <span className="text-green-400">{item.player}</span>
                      <span className="px-1 text-gray-500">/</span>
                      <span className="text-red-400">{item.opponent ?? '--'}</span>
                    </p>
                    <p className={`mt-0.5 text-[9px] font-semibold uppercase ${getEdgeTone(item.edge)}`}>{formatEdgeLabel(item.edge)}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {attributeComparison.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="w-8 shrink-0 text-right text-[11px] font-bold text-green-400">{item.player}</span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] font-medium text-white">{item.label}</span>
                        <span className={`text-[10px] font-semibold ${getEdgeTone(item.edge)}`}>{formatEdgeLabel(item.edge)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <ProgressBar value={item.player} tone="green" compact />
                        <ProgressBar value={item.opponent ?? 0} tone="amber" compact />
                      </div>
                    </div>
                    <span className="w-8 shrink-0 text-right text-[11px] font-bold text-red-400">{item.opponent ?? '--'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-body grid h-full min-h-0 grid-cols-[1fr_0.9fr] gap-3 px-3 py-3">
              <div className="min-w-0 space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Wrench className="h-4 w-4 text-gray-400" />Equipment Check</h3>
                {equipmentRows.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-[11px]">
                    <span className="rounded border border-green-600/40 bg-green-600/10 px-1.5 py-0.5 text-center text-[9px] font-bold text-green-400">{item.label.slice(0, 3).toUpperCase()}</span>
                    <span className="min-w-0 flex-1 truncate font-medium text-white">{item.name}</span>
                    <span className="shrink-0 text-gray-400">{Math.round(item.condition)}%</span>
                  </div>
                ))}
              </div>
              <div className="border-l border-border pl-3 text-[11px]">
                <div className="mb-2 flex justify-between gap-2"><span className="text-gray-400">Familiarity</span><span className="font-bold text-green-400">{cueFamiliarity}%</span></div>
                <div className="flex justify-between gap-2"><span className="text-gray-400">Primary Bonus</span><span className="text-right font-bold text-green-400">+{currentCue?.bonuses['Cue Ball Control'] ?? 0} cue ball</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
