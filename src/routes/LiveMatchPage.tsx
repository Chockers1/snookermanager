import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  Brain,
  CalendarDays,
  FastForward,
  Menu,
  MoreHorizontal,
  Pause,
  Play,
  SkipForward,
} from 'lucide-react'
import { useGame } from '../context/useGame'

type LiveMatchViewState = NonNullable<ReturnType<typeof useGame>['gameState']['liveMatch']>
type LiveTacticalPlan = LiveMatchViewState['tacticalPlan']
type LiveMentalFocus = LiveMatchViewState['mentalFocus']
type LiveTempo = LiveMatchViewState['tempo']
type LiveVisit = LiveMatchViewState['visitHistory'][number]

const COLOUR_POINTS: Record<string, number> = { Yellow: 2, Green: 3, Brown: 4, Blue: 5, Pink: 6, Black: 7 }

function getInitials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function getShortName(name: string) {
  return name.split(' ').at(-1) ?? name
}

function formatClock(minutes: number) {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function getRemainingTablePoints(liveMatch: LiveMatchViewState) {
  return liveMatch.tableState.redsRemaining * 8 + liveMatch.tableState.coloursRemaining.reduce((total, colour) => total + (COLOUR_POINTS[colour] ?? 0), 0)
}

function getFramePhase(liveMatch: LiveMatchViewState) {
  if (liveMatch.tableState.redsRemaining > 0) return `${liveMatch.tableState.redsRemaining} reds left`
  return liveMatch.tableState.coloursRemaining[0] ? `${liveMatch.tableState.coloursRemaining[0]} to black` : 'Colours cleared'
}

function percent(successes: number, attempts: number) {
  return attempts > 0 ? Math.round((successes / attempts) * 100) : 0
}

function getFrameVisitStats(visits: LiveVisit[], actor: LiveVisit['actor']) {
  const actorVisits = visits.filter((visit) => visit.actor === actor)
  const potVisits = actorVisits.filter((visit) => visit.decision === 'Pot Attempt' || visit.decision === 'Break Build' || visit.decision === 'Respotted Black')
  const safetyVisits = actorVisits.filter((visit) => visit.decision === 'Safety Exchange' || visit.decision === 'Snooker Hunt')
  return {
    visits: new Set(actorVisits.map((visit) => `${visit.frameLabel}-${visit.visit}`)).size,
    potAttempts: potVisits.length,
    potsMade: potVisits.filter((visit) => visit.success).length,
    safetyAttempts: safetyVisits.length,
    safetiesWon: safetyVisits.filter((visit) => visit.success).length,
    fouls: actorVisits.filter((visit) => visit.foulOccurred).length,
    highestBreak: Math.max(0, ...actorVisits.map((visit) => visit.breakTotal)),
  }
}

function TacticButtonGroup<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: T[]; onChange: (value: T) => void }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-500">{label}</p>
      <div className={`grid gap-1 ${options.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={`min-h-10 rounded-md border px-1.5 text-[10px] font-bold uppercase transition-colors ${value === option ? 'border-green-500 bg-green-500/20 text-green-300' : 'border-border bg-black/20 text-gray-400 hover:border-green-500/50 hover:text-white'}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function PlayerScore({ name, points, role, atTable, side }: { name: string; points: number; role: string; atTable: boolean; side: 'player' | 'opponent' }) {
  const playerSide = side === 'player'
  return (
    <div className={`flex min-w-0 items-center gap-3 px-4 sm:px-6 ${playerSide ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/5'} ${playerSide ? 'md:border-r' : 'md:flex-row-reverse md:border-l md:text-right'}`}>
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 font-bold ${playerSide ? 'border-green-500 bg-green-600/20' : 'border-red-500/60 bg-red-600/15'}`}>{getInitials(name)}</div>
      <div className="min-w-0 flex-1"><p className={`text-[9px] font-semibold uppercase tracking-wider ${atTable ? 'text-green-400' : 'text-gray-500'}`}>{atTable ? 'At table' : 'Waiting'}</p><h2 className="truncate text-base font-bold sm:text-xl">{name}</h2><p className="truncate text-[10px] text-gray-400 sm:text-xs">{role}</p></div>
      <p className="shrink-0 text-5xl font-black leading-none sm:text-6xl">{points}</p>
    </div>
  )
}

function StatComparison({ label, player, opponent, suffix = '' }: { label: string; player: number; opponent: number; suffix?: string }) {
  return (
    <div className="grid grid-cols-[1fr_minmax(92px,1.4fr)_1fr] items-center gap-2 text-xs">
      <b className="text-right text-green-300">{player}{suffix}</b>
      <span className="text-center text-gray-500">{label}</span>
      <b>{opponent}{suffix}</b>
    </div>
  )
}

export function LiveMatchPage() {
  const { gameState, simulateLiveShot, simulateLiveFrame, simulateLiveMatch, applyLiveCoachCue, concedeLiveFrame, updateLiveMatchTactics } = useGame()
  const navigate = useNavigate()
  const [autoPlaying, setAutoPlaying] = useState(false)
  const [concedeConfirmationOpen, setConcedeConfirmationOpen] = useState(false)
  const [rightPanel, setRightPanel] = useState<'stats' | 'frames'>('stats')
  const frameLogRef = useRef<HTMLDivElement>(null)
  const liveMatch = gameState.liveMatch
  const tournament = liveMatch ? gameState.tournaments.find((item) => item.id === liveMatch.tournamentId) : null

  useEffect(() => {
    if (liveMatch?.status === 'Completed') {
      navigate('/match/result', { replace: true })
    }
  }, [liveMatch?.status, navigate])

  useEffect(() => {
    if (!autoPlaying || !liveMatch || liveMatch.status !== 'In Progress' || concedeConfirmationOpen) return
    const timer = window.setTimeout(() => simulateLiveShot(), 700)
    return () => window.clearTimeout(timer)
  }, [autoPlaying, concedeConfirmationOpen, liveMatch, simulateLiveShot])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!liveMatch || event.altKey || event.ctrlKey || event.metaKey) return
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLButtonElement) return
      if (event.key === ' ') {
        event.preventDefault()
        setAutoPlaying((playing) => !playing)
      } else if (event.key.toLowerCase() === 'f') {
        setAutoPlaying(false)
        simulateLiveFrame()
      } else if (event.key.toLowerCase() === 'm') {
        setAutoPlaying(false)
        simulateLiveMatch()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [liveMatch, simulateLiveFrame, simulateLiveMatch])

  useEffect(() => {
    const frameLog = frameLogRef.current
    if (!frameLog) return
    frameLog.scrollTop = frameLog.scrollHeight
  }, [liveMatch?.currentBreak, liveMatch?.currentFrame, liveMatch?.feed.length])

  if (!liveMatch) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050b12] p-6 text-white">
        <div className="w-full max-w-xl rounded-lg border border-border bg-surface/90 p-8 text-center">
          <Activity className="mx-auto h-14 w-14 text-gray-500" />
          <h1 className="mt-4 text-2xl font-bold">No active match</h1>
          <p className="mt-2 text-sm text-gray-400">Enter an event and choose Play Live Match from the tournament hub.</p>
          <button type="button" onClick={() => navigate('/tournaments/hub')} className="btn-primary mx-auto mt-6 text-xs">Go To Tournament Hub</button>
        </div>
      </div>
    )
  }

  const atTableIsPlayer = liveMatch.playerAtTable === liveMatch.playerName
  const currentFrameVisits = liveMatch.visitHistory.filter((visit) => visit.frameLabel === `F${liveMatch.currentFrame}`)
  const playerFrameStats = getFrameVisitStats(currentFrameVisits, 'Player')
  const opponentFrameStats = getFrameVisitStats(currentFrameVisits, 'Opponent')
  const playerPotSuccess = percent(liveMatch.playerStats.potsMade, liveMatch.playerStats.potAttempts)
  const opponentPotSuccess = percent(liveMatch.opponentStats.potsMade, liveMatch.opponentStats.potAttempts)
  const playerSafetySuccess = percent(liveMatch.playerStats.safetiesWon, liveMatch.playerStats.safetyAttempts)
  const opponentSafetySuccess = percent(liveMatch.opponentStats.safetiesWon, liveMatch.opponentStats.safetyAttempts)
  const latestEvent = liveMatch.feed[0]?.text ?? 'The frame is ready to begin.'
  const chronologicalFrameLog = [...liveMatch.feed].reverse()

  return (
    <div className="min-h-screen overflow-auto bg-[#050b12] p-2.5 text-white sm:p-3 xl:flex xl:h-screen xl:min-h-0 xl:flex-col xl:overflow-hidden" data-testid="live-match-score-centre">
      <header className="mx-auto flex w-full max-w-[1580px] shrink-0 items-center gap-3 rounded-xl border border-border bg-surface/85 px-3 py-2">
        <button type="button" aria-label="Return to Tournament Hub" onClick={() => navigate('/tournaments/hub')} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-surface-light text-gray-300 hover:border-green-500/50 hover:text-white"><Menu className="h-5 w-5" /></button>
        <div className="min-w-0 flex-1"><h1 className="truncate text-sm font-bold sm:text-base">{tournament?.name ?? 'Live Match'} · {liveMatch.round}</h1><p className="mt-0.5 flex items-center gap-1.5 truncate text-[10px] text-gray-400"><CalendarDays className="h-3 w-3" /> Best of {liveMatch.bestOf} · {tournament?.location ?? liveMatch.table} · {formatClock(liveMatch.timeElapsedMinutes)}</p></div>
        <div className="hidden items-center gap-5 text-right sm:flex"><div><p className="text-[9px] uppercase text-gray-500">Frame</p><p className="font-bold">{liveMatch.currentFrame} of {liveMatch.bestOf}</p></div><div><p className="text-[9px] uppercase text-gray-500">At table</p><p className="max-w-32 truncate text-sm font-semibold text-green-300">{getShortName(liveMatch.playerAtTable)}</p></div></div>
      </header>

      <section className="mx-auto mt-2 grid min-h-28 w-full max-w-[1580px] shrink-0 overflow-hidden rounded-xl border border-border bg-surface/90 md:h-32 md:grid-cols-[1fr_250px_1fr]">
        <PlayerScore name={liveMatch.playerName} points={liveMatch.playerPoints} role={gameState.player.competitiveStatus ?? gameState.player.careerStage} atTable={atTableIsPlayer} side="player" />
        <div className="order-first grid min-h-24 place-items-center border-b border-border bg-black/20 text-center md:order-none md:border-b-0"><div><p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-500">Match Score</p><div className="mt-1 flex items-center justify-center gap-5"><b className="text-4xl text-green-400 md:text-5xl">{liveMatch.playerFrames}</b><span className="text-gray-600">—</span><b className="text-4xl text-red-300 md:text-5xl">{liveMatch.opponentFrames}</b></div><p className="text-[10px] text-gray-500">First to {liveMatch.framesNeeded}</p></div></div>
        <PlayerScore name={liveMatch.opponentName} points={liveMatch.opponentPoints} role={`${liveMatch.opponentArchetype} · #${liveMatch.opponentRanking}`} atTable={!atTableIsPlayer} side="opponent" />
      </section>

      <main className="mx-auto mt-2 grid min-h-0 w-full max-w-[1580px] flex-1 gap-2 xl:grid-cols-[350px_minmax(0,1fr)_330px]">
        <section className="card flex min-h-[31rem] flex-col overflow-hidden xl:min-h-0" data-testid="match-playback-controls">
          <div className="border-b border-border px-4 py-3"><p className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${autoPlaying ? 'text-green-400' : 'text-gray-500'}`}>Match Control</p><div className="mt-1 flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold">Frame {liveMatch.currentFrame} in progress</h2><p className="mt-1 text-xs text-gray-400">{getFramePhase(liveMatch)} · {getRemainingTablePoints(liveMatch)} points remain</p></div><div className="rounded-lg border border-border bg-black/20 px-3 py-1.5 text-center"><p className="text-[8px] uppercase text-gray-500">Break</p><p className="text-xl font-black text-green-400">{liveMatch.currentBreak}</p></div></div><p className="mt-3 text-xs leading-relaxed text-gray-300">Choose the pace. Scores, frame events and statistics update automatically.</p></div>
          <div className="space-y-3 p-4 text-xs"><div className="flex items-center justify-between border-b border-border pb-3"><span className="text-gray-500">At table</span><b className={atTableIsPlayer ? 'text-green-300' : 'text-amber-300'}>{liveMatch.playerAtTable}</b></div><div className="flex items-center justify-between border-b border-border pb-3"><span className="text-gray-500">Current score</span><b>{liveMatch.playerPoints}–{liveMatch.opponentPoints}</b></div><div className="rounded-lg bg-surface-light/45 p-3 text-[11px] leading-relaxed text-gray-400"><p className="font-semibold text-white">Latest event</p><p className="mt-1 line-clamp-3">{latestEvent}</p></div><p className="text-[10px] leading-relaxed text-gray-500">Change the frame tactics in the centre panel at any time during Auto Play.</p></div>
          <div className="mt-auto border-t border-border p-3"><p className="text-[9px] font-semibold uppercase tracking-wider text-gray-500">Playback</p><button type="button" aria-pressed={autoPlaying} onClick={() => setAutoPlaying((playing) => !playing)} className={`mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border text-sm font-bold transition ${autoPlaying ? 'border-amber-400/60 bg-amber-500/15 text-amber-200' : 'border-green-400/60 bg-green-600 text-white hover:bg-green-500'}`}>{autoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{autoPlaying ? 'Pause Auto Play' : 'Auto Play'} <kbd className="ml-1 text-[9px] opacity-60">Space</kbd></button><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={() => { setAutoPlaying(false); simulateLiveFrame() }} className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-black/20 px-1 text-xs font-semibold hover:border-green-500/50"><SkipForward className="h-3.5 w-3.5" />Sim Frame <kbd className="text-[9px] opacity-50">F</kbd></button><button type="button" onClick={() => { setAutoPlaying(false); simulateLiveMatch() }} className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-black/20 px-1 text-xs font-semibold hover:border-green-500/50"><FastForward className="h-3.5 w-3.5" />Sim Match <kbd className="text-[9px] opacity-50">M</kbd></button></div><p className="mt-2 text-center text-[10px] text-gray-500">Auto Play can be paused at any time</p></div>
        </section>

        <section className="grid min-h-0 gap-2 xl:grid-rows-[auto_minmax(0,1fr)]">
          <div className="card p-3" data-testid="frame-tactics">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-500">Frame {liveMatch.currentFrame} Tactics</p><h2 className="mt-0.5 flex items-center gap-2 text-sm font-bold"><Brain className="h-4 w-4 text-amber-300" /> Set Your Approach</h2></div><span className="rounded-full bg-green-600/10 px-2.5 py-1 text-[9px] text-green-300">Applies this frame</span></div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3"><TacticButtonGroup<LiveTacticalPlan> label="Plan" value={liveMatch.tacticalPlan} options={['Attack', 'Balanced', 'Safety']} onChange={(tacticalPlan) => updateLiveMatchTactics({ tacticalPlan })} /><TacticButtonGroup<LiveMentalFocus> label="Focus" value={liveMatch.mentalFocus} options={['Composed', 'Confident', 'Counter']} onChange={(mentalFocus) => updateLiveMatchTactics({ mentalFocus })} /><TacticButtonGroup<LiveTempo> label="Tempo" value={liveMatch.tempo} options={['Deliberate', 'Steady', 'Quick']} onChange={(tempo) => updateLiveMatchTactics({ tempo })} /></div>
            <div className="mt-2 flex items-center justify-between gap-3 text-[10px]"><p className="min-w-0 text-gray-500"><span className="font-semibold text-gray-400">{liveMatch.tacticalPlan === 'Safety' ? 'Defensive bias; good potting chances are still taken.' : liveMatch.tempo === 'Deliberate' ? 'Slows the match to disrupt rhythm, with a small fluency and energy cost.' : liveMatch.lastTacticalNote}</span></p><button type="button" onClick={() => applyLiveCoachCue()} className="shrink-0 rounded border border-amber-400/30 bg-amber-500/10 px-2.5 py-1.5 font-semibold text-amber-200">Ask Coach</button></div>
          </div>

          <div className="grid min-h-0 gap-2 lg:grid-cols-2">
            <div className="card flex min-h-64 flex-col overflow-hidden"><div className="card-header"><h2 className="text-sm font-bold">Frame Statistics</h2><span className="text-[10px] text-gray-500">Frame {liveMatch.currentFrame}</span></div><div className="grid flex-1 content-center gap-3 p-4"><StatComparison label="Points" player={liveMatch.playerPoints} opponent={liveMatch.opponentPoints} /><StatComparison label="Highest break" player={playerFrameStats.highestBreak} opponent={opponentFrameStats.highestBreak} /><StatComparison label="Pot success" player={percent(playerFrameStats.potsMade, playerFrameStats.potAttempts)} opponent={percent(opponentFrameStats.potsMade, opponentFrameStats.potAttempts)} suffix="%" /><StatComparison label="Safety success" player={percent(playerFrameStats.safetiesWon, playerFrameStats.safetyAttempts)} opponent={percent(opponentFrameStats.safetiesWon, opponentFrameStats.safetyAttempts)} suffix="%" /><StatComparison label="Visits" player={playerFrameStats.visits} opponent={opponentFrameStats.visits} /><StatComparison label="Fouls" player={playerFrameStats.fouls} opponent={opponentFrameStats.fouls} /></div><div className="border-t border-border px-3 py-2 text-center text-[10px] text-gray-500">{getShortName(liveMatch.playerName)} <span className="mx-2">vs</span> {getShortName(liveMatch.opponentName)}</div></div>
            <div className="card flex min-h-64 flex-col overflow-hidden"><div className="card-header"><div><h2 className="text-sm font-bold">Frame Log</h2><p className="text-[9px] text-gray-500">Shot by shot · oldest to newest</p></div><span className="text-[10px] text-green-400">Live · follows play</span></div><div ref={frameLogRef} data-testid="frame-log" aria-live="polite" className="scrollbar-thin min-h-0 flex-1 overflow-auto px-3 py-2 text-[11px]">{chronologicalFrameLog.map((feed, index) => { const isLatest = index === chronologicalFrameLog.length - 1; return <div key={`${feed.id}-${index}`} className={`relative grid grid-cols-[38px_minmax(0,1fr)] gap-2 border-l pb-2 pl-3 ${isLatest ? 'border-green-400' : 'border-border'}`}><span className={`absolute -left-1 top-2 h-2 w-2 rounded-full ${feed.tone === 'green' ? 'bg-green-400' : feed.tone === 'red' ? 'bg-red-400' : feed.tone === 'amber' ? 'bg-amber-400' : 'bg-blue-400'}`} /><span className="pt-1.5 text-gray-500">{feed.time}</span><div className={`rounded px-2 py-1.5 ${isLatest ? 'bg-green-500/10 ring-1 ring-green-500/20' : 'bg-surface-light/35'}`}><span className="mb-0.5 block text-[8px] font-bold uppercase tracking-wider text-gray-500">{feed.actor}</span><span className={feed.tone === 'green' ? 'text-green-300' : feed.tone === 'red' ? 'text-red-300' : feed.tone === 'amber' ? 'text-amber-300' : 'text-gray-300'}>{feed.text}</span></div></div>})}</div><div data-testid="frame-log-current-break" className="shrink-0 border-t border-border bg-black/20 px-3 py-2"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-[8px] font-bold uppercase tracking-[0.16em] text-gray-500">Now at the table</p><p className={`truncate text-xs font-semibold ${atTableIsPlayer ? 'text-green-300' : 'text-amber-300'}`}>{liveMatch.playerAtTable}</p></div><div className="text-right"><p className="text-[8px] uppercase text-gray-500">{liveMatch.currentBreak > 0 ? 'Break in progress' : 'Current break'}</p><p className="text-2xl font-black text-green-400">{liveMatch.currentBreak}</p></div></div></div></div>
          </div>
        </section>

        <aside className="card flex min-h-[31rem] flex-col overflow-hidden xl:min-h-0">
          <div className="flex shrink-0 border-b border-border px-2 pt-2" role="tablist" aria-label="Match information"><button type="button" role="tab" aria-selected={rightPanel === 'stats'} onClick={() => setRightPanel('stats')} className={`min-h-10 flex-1 border-b-2 px-3 text-xs font-semibold ${rightPanel === 'stats' ? 'border-green-400 text-green-400' : 'border-transparent text-gray-400'}`}>Match Stats</button><button type="button" role="tab" aria-selected={rightPanel === 'frames'} onClick={() => setRightPanel('frames')} className={`min-h-10 flex-1 border-b-2 px-3 text-xs font-semibold ${rightPanel === 'frames' ? 'border-green-400 text-green-400' : 'border-transparent text-gray-400'}`}>Frames</button></div>
          {rightPanel === 'stats' ? <div className="scrollbar-thin min-h-0 flex-1 space-y-4 overflow-auto p-4"><StatComparison label="Pot success" player={playerPotSuccess} opponent={opponentPotSuccess} suffix="%" /><StatComparison label="Safety success" player={playerSafetySuccess} opponent={opponentSafetySuccess} suffix="%" /><div className="border-t border-border pt-4"><div className="grid gap-3"><StatComparison label="Points scored" player={liveMatch.playerStats.pointsScored} opponent={liveMatch.opponentStats.pointsScored} /><StatComparison label="Highest break" player={liveMatch.playerHighestBreak} opponent={liveMatch.opponentHighestBreak} /><StatComparison label="Visits" player={liveMatch.playerStats.visits} opponent={liveMatch.opponentStats.visits} /><StatComparison label="Fouls" player={liveMatch.playerStats.fouls} opponent={liveMatch.opponentStats.fouls} /><StatComparison label="Frames won" player={liveMatch.playerFrames} opponent={liveMatch.opponentFrames} /></div></div><div className="rounded-lg bg-surface-light/45 p-3 text-[11px]"><div className="flex justify-between"><span className="text-gray-400">Opponent approach</span><b>{liveMatch.opponentApproach}</b></div><div className="mt-2 flex justify-between"><span className="text-gray-400">Pressure</span><b className={liveMatch.pressureValue >= 70 ? 'text-red-300' : 'text-amber-300'}>{liveMatch.pressureLabel} · {liveMatch.pressureValue}%</b></div></div></div> : <div className="scrollbar-thin min-h-0 flex-1 space-y-2 overflow-auto p-3">{liveMatch.frameHistory.map((frame, index) => { const tactics = liveMatch.frameTactics[index]; return <div key={frame.frame} className={`rounded-lg border p-3 ${frame.winner === liveMatch.playerName ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/25 bg-red-500/5'}`}><div className="flex items-center justify-between"><b className="text-xs">{frame.frame}</b><span className="font-bold">{frame.player}–{frame.opponent}</span></div><p className="mt-1 truncate text-[10px] text-gray-400">{tactics ? `${tactics.tacticalPlan} · ${tactics.mentalFocus} · ${tactics.tempo}` : frame.winner}</p></div>})}<div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"><div className="flex justify-between"><b className="text-xs">F{liveMatch.currentFrame} · Live</b><span>{liveMatch.playerPoints}–{liveMatch.opponentPoints}</span></div><p className="mt-1 text-[10px] text-amber-200">{liveMatch.tacticalPlan} · {liveMatch.mentalFocus} · {liveMatch.tempo}</p></div></div>}
          <div className="mt-auto shrink-0 border-t border-border p-3"><button type="button" onClick={() => applyLiveCoachCue()} className="min-h-10 w-full rounded-lg border border-amber-400/30 bg-amber-500/10 text-xs font-semibold text-amber-200 hover:border-amber-400/60">Ask Coach for Advice</button><button type="button" onClick={() => setConcedeConfirmationOpen(true)} className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg text-xs text-gray-500 hover:bg-red-500/10 hover:text-red-300"><MoreHorizontal className="h-4 w-4" /> Concede Frame</button></div>
        </aside>
      </main>

      {concedeConfirmationOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-labelledby="concede-title"><div className="w-full max-w-sm rounded-xl border border-red-500/35 bg-surface p-5 shadow-2xl"><h2 id="concede-title" className="text-lg font-bold">Concede this frame?</h2><p className="mt-2 text-sm text-gray-400">Your opponent will be awarded the frame. This cannot be undone.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setConcedeConfirmationOpen(false)} className="btn-secondary">Keep Playing</button><button type="button" onClick={() => { setConcedeConfirmationOpen(false); concedeLiveFrame() }} className="rounded-lg border border-red-500/50 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-200">Concede Frame</button></div></div></div> : null}
    </div>
  )
}
