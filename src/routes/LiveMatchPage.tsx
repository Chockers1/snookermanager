import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, BarChart3, FastForward, Gauge, Shield, SkipForward, Swords, Trophy, Zap } from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/GameStateContext'

type LiveMatchViewState = NonNullable<ReturnType<typeof useGame>['gameState']['liveMatch']>

function getInitials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function getShortName(name: string) {
  return name.split(' ').at(-1) ?? name
}

function pct(value: number) {
  return `${Math.round(value)}%`
}

function getRemainingTablePoints(liveMatch: LiveMatchViewState) {
  const colourPoints: Record<string, number> = { Yellow: 2, Green: 3, Brown: 4, Blue: 5, Pink: 6, Black: 7 }
  return liveMatch.tableState.redsRemaining * 8 + liveMatch.tableState.coloursRemaining.reduce((total, colour) => total + (colourPoints[colour] ?? 0), 0)
}

function getFramePhase(liveMatch: LiveMatchViewState) {
  if (liveMatch.tableState.redsRemaining > 0) return `${liveMatch.tableState.redsRemaining} reds left`
  return liveMatch.tableState.coloursRemaining[0] ? `${liveMatch.tableState.coloursRemaining[0]} to black` : 'Colours cleared'
}

function getPlayerStats(liveMatch: LiveMatchViewState) {
  const playerVisits = liveMatch.visitHistory.filter((visit) => visit.actor === 'Player')
  const opponentVisits = liveMatch.visitHistory.filter((visit) => visit.actor === 'Opponent')
  const count = (visits: typeof playerVisits, decision: string) => visits.filter((visit) => visit.decision === decision).length
  const successes = (visits: typeof playerVisits, decision: string) => visits.filter((visit) => visit.decision === decision && visit.success).length
  const rate = (made: number, attempts: number) => attempts > 0 ? Math.round((made / attempts) * 100) : 0
  const playerPotAttempts = count(playerVisits, 'Pot Attempt')
  const playerPotSuccess = successes(playerVisits, 'Pot Attempt')
  const opponentPotAttempts = count(opponentVisits, 'Pot Attempt')
  const opponentPotSuccess = successes(opponentVisits, 'Pot Attempt')
  const playerSafetyAttempts = count(playerVisits, 'Safety Exchange')
  const playerSafetySuccess = successes(playerVisits, 'Safety Exchange')
  const opponentSafetyAttempts = count(opponentVisits, 'Safety Exchange')
  const opponentSafetySuccess = successes(opponentVisits, 'Safety Exchange')

  return {
    playerVisits: playerVisits.length,
    opponentVisits: opponentVisits.length,
    playerPoints: playerVisits.reduce((sum, visit) => sum + visit.points, 0),
    opponentPoints: opponentVisits.reduce((sum, visit) => sum + visit.points, 0),
    playerFouls: playerVisits.filter((visit) => visit.foulOccurred).length,
    opponentFouls: opponentVisits.filter((visit) => visit.foulOccurred).length,
    playerPotRate: rate(playerPotSuccess, playerPotAttempts),
    opponentPotRate: rate(opponentPotSuccess, opponentPotAttempts),
    playerSafetyRate: rate(playerSafetySuccess, playerSafetyAttempts),
    opponentSafetyRate: rate(opponentSafetySuccess, opponentSafetyAttempts),
    playerBreakBuilds: successes(playerVisits, 'Break Build'),
    opponentBreakBuilds: successes(opponentVisits, 'Break Build'),
  }
}

function statTone(playerValue: number, opponentValue: number) {
  if (playerValue > opponentValue) return 'text-green-400'
  if (playerValue < opponentValue) return 'text-red-400'
  return 'text-white'
}

function isFinalRound(round: string) {
  return round.trim().toLowerCase() === 'final'
}

export function LiveMatchPage() {
  const { gameState, simulateLiveFrame, simulateLiveMatch } = useGame()
  const navigate = useNavigate()
  const liveMatch = gameState.liveMatch
  const tournamentName = liveMatch ? gameState.tournaments.find((tournament) => tournament.id === liveMatch.tournamentId)?.name ?? 'Live Match' : 'Live Match'

  useEffect(() => {
    if (liveMatch?.status === 'Completed') navigate(isFinalRound(liveMatch.round) ? '/rankings?from=final' : '/tournaments/hub', { replace: true })
  }, [liveMatch?.status, navigate])

  if (!liveMatch) {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-[10px] font-semibold uppercase text-gray-500">Match Centre</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Live Match</h1>
        </div>
        <div className="card card-body p-8 text-center">
          <Activity className="mx-auto h-14 w-14 text-gray-500" />
          <p className="mt-4 text-xl font-semibold text-white">No active table session</p>
          <p className="mt-2 text-sm text-gray-400">Enter the event, then choose Play Live Match from the tournament hub or match preview.</p>
          <button type="button" onClick={() => navigate('/tournaments/hub')} className="btn-primary mx-auto mt-6 text-xs">Go To Tournament Hub</button>
        </div>
      </div>
    )
  }

  const matchStats = getPlayerStats(liveMatch)
  const remainingPoints = getRemainingTablePoints(liveMatch)
  const matchProgress = ((liveMatch.playerFrames + liveMatch.opponentFrames) / liveMatch.bestOf) * 100
  const atTableIsPlayer = liveMatch.playerAtTable === liveMatch.playerName
  const duration = `${Math.floor(liveMatch.timeElapsedMinutes / 60)}h ${String(liveMatch.timeElapsedMinutes % 60).padStart(2, '0')}m`
  const frameRows = Array.from({ length: liveMatch.bestOf }, (_, index) => {
    const frameNumber = index + 1
    const completed = liveMatch.frameHistory.find((frame) => String(frame.frame).replace(/^F/i, '') === String(frameNumber))
    return {
      frameNumber,
      completed,
      isCurrent: !completed && frameNumber === liveMatch.currentFrame,
    }
  })
  const currentLeader = liveMatch.playerPoints === liveMatch.opponentPoints
    ? 'Frame level'
    : liveMatch.playerPoints > liveMatch.opponentPoints
      ? `${getShortName(liveMatch.playerName)} leads by ${liveMatch.playerPoints - liveMatch.opponentPoints}`
      : `${getShortName(liveMatch.opponentName)} leads by ${liveMatch.opponentPoints - liveMatch.playerPoints}`

  return (
    <div className="-m-6 flex h-[calc(100vh-5.5rem)] min-h-0 flex-col gap-2 overflow-hidden p-1.5">
      <div className="card shrink-0 overflow-hidden">
        <div className="grid grid-cols-12 items-center gap-4 px-5 py-3">
          <div className="col-span-4 min-w-0">
            <p className="text-[10px] font-semibold uppercase text-gray-500">{tournamentName}</p>
            <h1 className="mt-1 truncate text-xl font-bold text-white">{liveMatch.round} - Best of {liveMatch.bestOf}</h1>
            <p className="mt-1 text-xs text-gray-400">{liveMatch.table} - {liveMatch.referee} - {liveMatch.conditions}</p>
          </div>
          <div className="col-span-4 flex items-center justify-center gap-6 rounded-xl border border-border bg-surface-light/40 px-8 py-3 text-center">
            <div>
              <p className="text-5xl font-bold text-green-400">{liveMatch.playerFrames}</p>
              <p className="text-[10px] uppercase text-gray-500">{getShortName(liveMatch.playerName)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Frame {liveMatch.currentFrame}</p>
              <p className="text-3xl font-bold text-gray-500">-</p>
              <ProgressBar value={matchProgress} compact />
            </div>
            <div>
              <p className="text-5xl font-bold text-red-400">{liveMatch.opponentFrames}</p>
              <p className="text-[10px] uppercase text-gray-500">{getShortName(liveMatch.opponentName)}</p>
            </div>
          </div>
          <div className="col-span-4 min-w-0 text-right">
            <p className="text-[10px] font-semibold uppercase text-gray-500">Duration</p>
            <p className="mt-1 text-xl font-bold text-white">{duration}</p>
            <p className="mt-1 text-xs text-gray-400">Need {liveMatch.framesNeeded} frames to win</p>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-12 gap-2">
        <div className="col-span-4 flex min-h-0 flex-col gap-2">
          <div className="card min-h-0 flex-1 overflow-hidden border-green-600/40 bg-gradient-to-r from-green-600/10 via-surface to-surface">
            <div className="card-header px-3 py-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white"><Swords className="h-4 w-4 text-green-400" />Current Frame</h2>
              <span className="text-xs font-semibold text-green-400">Frame {liveMatch.currentFrame} of {liveMatch.bestOf}</span>
            </div>
            <div className="card-body p-3">
              <div className="grid grid-cols-12 items-center gap-3">
                <div className="col-span-5 rounded-lg border border-green-600/30 bg-green-600/10 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-green-500/50 bg-green-600/20 text-base font-bold text-green-400">{getInitials(liveMatch.playerName)}</div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{liveMatch.playerName}</p>
                      <p className="text-xs text-gray-400">Conf {pct(liveMatch.playerConfidence)} - Fat {pct(liveMatch.playerFatigue)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-5xl font-bold leading-none text-green-400">{liveMatch.playerPoints}</p>
                </div>
                <div className="col-span-2 text-center">
                  <p className="text-[10px] uppercase text-gray-500">Frame Score</p>
                  <p className="mt-1 text-3xl font-bold text-gray-500">-</p>
                  <p className="mt-1 text-xs text-gray-400">{getFramePhase(liveMatch)}</p>
                </div>
                <div className="col-span-5 rounded-lg border border-red-600/30 bg-red-600/10 p-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{liveMatch.opponentName}</p>
                      <p className="text-xs text-gray-400">#{liveMatch.opponentRanking} - {liveMatch.opponentArchetype}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/50 bg-red-600/20 text-base font-bold text-red-400">{getInitials(liveMatch.opponentName)}</div>
                  </div>
                  <p className="mt-3 text-5xl font-bold leading-none text-red-400">{liveMatch.opponentPoints}</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                <div className="rounded bg-surface-light/50 p-2"><p className="text-[10px] text-gray-500">Current Break</p><p className="text-base font-bold text-white">{liveMatch.currentBreak}</p></div>
                <div className="rounded bg-surface-light/50 p-2"><p className="text-[10px] text-gray-500">At Table</p><p className={atTableIsPlayer ? 'truncate text-base font-bold text-green-400' : 'truncate text-base font-bold text-red-400'}>{getShortName(liveMatch.playerAtTable)}</p></div>
                <div className="rounded bg-surface-light/50 p-2"><p className="text-[10px] text-gray-500">Highest Break</p><p className="text-base font-bold text-white">{liveMatch.playerHighestBreak}</p></div>
                <div className="rounded bg-surface-light/50 p-2"><p className="text-[10px] text-gray-500">Frame Status</p><p className={liveMatch.pressureValue >= 75 ? 'text-base font-bold text-red-400' : liveMatch.pressureValue >= 52 ? 'text-base font-bold text-amber-400' : 'text-base font-bold text-green-400'}>{liveMatch.pressureLabel}</p></div>
              </div>
            </div>
          </div>

          <div className="card min-h-0 flex-1 overflow-hidden">
            <div className="card-header px-3 py-2"><h3 className="flex items-center gap-2 text-sm font-semibold text-white"><BarChart3 className="h-4 w-4 text-green-400" />Match Stats</h3></div>
            <div className="card-body space-y-3 p-3">
              {[
                ['Highest Break', liveMatch.playerHighestBreak, liveMatch.opponentHighestBreak],
                ['Pot Success', matchStats.playerPotRate, matchStats.opponentPotRate, '%'],
                ['Safety Success', matchStats.playerSafetyRate, matchStats.opponentSafetyRate, '%'],
                ['Break Build Won', matchStats.playerBreakBuilds, matchStats.opponentBreakBuilds],
                ['Points From Wins', matchStats.playerPoints, matchStats.opponentPoints],
                ['Fouls', matchStats.playerFouls, matchStats.opponentFouls],
              ].map(([label, player, opponent, suffix]) => (
                <div key={String(label)} className="flex items-center gap-3 text-xs">
                  <span className={`w-20 shrink-0 text-right font-bold ${statTone(Number(player), Number(opponent))}`}>{player}{suffix ?? ''}</span>
                  <div className="min-w-0 flex-1 text-center"><p className="truncate text-gray-400">{label}</p></div>
                  <span className={`w-20 shrink-0 font-bold ${statTone(Number(opponent), Number(player))}`}>{opponent}{suffix ?? ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-4 flex min-h-0 flex-col gap-2">
          <div className="card min-h-0 flex-1 overflow-hidden">
            <div className="card-header px-3 py-2"><h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Trophy className="h-4 w-4 text-green-400" />Frames</h3><span className="text-[10px] text-gray-400">Best of {liveMatch.bestOf}</span></div>
            <div className="card-body min-h-0 overflow-y-auto p-2.5 scrollbar-thin">
              <div className="space-y-1.5">
                <div className="grid grid-cols-12 gap-2 px-2 text-[9px] font-semibold uppercase text-gray-500">
                  <span className="col-span-1">Frm</span>
                  <span className="col-span-4">Player</span>
                  <span className="col-span-2 text-center">Score</span>
                  <span className="col-span-4 text-right">Player</span>
                  <span className="col-span-1 text-right">W/L</span>
                </div>
                {frameRows.map((row) => {
                  const frame = row.completed
                  const rowClass = row.isCurrent
                    ? 'border border-amber-500/70 bg-amber-500/10 text-amber-400'
                    : frame
                      ? 'bg-surface-light/45 text-gray-300'
                      : 'bg-transparent text-gray-500'

                  return (
                    <div key={row.frameNumber} className={`grid grid-cols-12 items-center gap-2 rounded px-2 py-1.5 text-xs ${rowClass}`}>
                      <span className="col-span-1">{row.frameNumber}</span>
                      <span className={frame?.winner === liveMatch.playerName || row.isCurrent ? 'col-span-4 truncate font-bold text-green-400' : 'col-span-4 truncate'}>{frame || row.isCurrent ? getShortName(liveMatch.playerName) : '-'}</span>
                      <span className="col-span-2 text-center font-bold text-white">{frame ? `${frame.player}-${frame.opponent}` : row.isCurrent ? `${liveMatch.playerPoints}-${liveMatch.opponentPoints}` : '-'}</span>
                      <span className={frame?.winner === liveMatch.opponentName || row.isCurrent ? 'col-span-4 truncate text-right font-bold text-red-400' : 'col-span-4 truncate text-right'}>{frame || row.isCurrent ? getShortName(liveMatch.opponentName) : '-'}</span>
                      <span className={frame?.winner === liveMatch.playerName ? 'col-span-1 text-right font-bold text-green-400' : frame?.winner === liveMatch.opponentName ? 'col-span-1 text-right font-bold text-red-400' : row.isCurrent ? 'col-span-1 text-right font-bold text-amber-400' : 'col-span-1 text-right'}>{frame ? frame.winner === liveMatch.playerName ? 'W' : 'L' : row.isCurrent ? 'LIVE' : '-'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="card min-h-0 flex-1 overflow-hidden">
            <div className="card-header px-3 py-2"><h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Zap className="h-4 w-4 text-green-400" />Recent Match Events</h3></div>
            <div className="card-body h-full overflow-y-auto p-3 scrollbar-thin">
              <div className="space-y-2">
                {liveMatch.visitHistory.slice(0, 9).map((visit) => (
                  <div key={visit.id} className="rounded border border-border/50 bg-surface-light/40 px-3 py-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className={visit.actor === 'Player' ? 'font-bold text-green-400' : 'font-bold text-red-400'}>{visit.frameLabel} V{visit.visit} - {visit.actor}</span>
                      <span className={visit.success ? 'text-green-400' : visit.foulOccurred ? 'text-red-400' : 'text-gray-400'}>{visit.points > 0 ? `+${visit.points}` : visit.foulOccurred ? 'Foul' : '-'}</span>
                    </div>
                    <p className="mt-1 truncate text-gray-400">{visit.decision} - {visit.outcome}</p>
                  </div>
                ))}
                {liveMatch.visitHistory.length === 0 ? <p className="text-xs text-gray-400">No frame events yet. Sim a frame to populate match events.</p> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-4 flex min-h-0 flex-col gap-2">
          <div className="card shrink-0 border-green-600/40">
            <div className="card-header px-3 py-2"><h3 className="flex items-center gap-2 text-sm font-semibold text-white"><FastForward className="h-4 w-4 text-green-400" />Sim Controls</h3></div>
            <div className="card-body space-y-2 p-3">
              <button type="button" onClick={() => simulateLiveFrame()} className="btn-primary w-full justify-center py-3 text-sm"><FastForward className="h-4 w-4" /> Sim Frame</button>
              <button type="button" onClick={() => simulateLiveMatch()} className="btn-secondary w-full justify-center py-3 text-sm"><SkipForward className="h-4 w-4" /> Sim Match</button>
              <button type="button" onClick={() => navigate('/tournaments/hub')} className="btn-secondary w-full justify-center text-xs"><Trophy className="h-3.5 w-3.5" /> Tournament Hub</button>
              <p className="rounded border border-border bg-surface-light/40 p-2 text-[11px] leading-relaxed text-gray-400">Sim frame or sim the whole match. The engine uses tactics, attributes, confidence, fatigue, equipment and opponent profile.</p>
            </div>
          </div>

          <div className="card shrink-0">
            <div className="card-header px-3 py-2"><h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Gauge className="h-4 w-4 text-green-400" />Condition</h3></div>
            <div className="card-body space-y-3 p-3">
              <div>
                <div className="mb-1 flex justify-between text-xs"><span className="text-gray-400">Your confidence</span><span className="text-white">{pct(liveMatch.playerConfidence)}</span></div>
                <ProgressBar value={liveMatch.playerConfidence} compact />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs"><span className="text-gray-400">Your fatigue</span><span className="text-white">{pct(liveMatch.playerFatigue)}</span></div>
                <ProgressBar value={liveMatch.playerFatigue} tone="amber" compact />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs"><span className="text-gray-400">Opponent confidence</span><span className="text-white">{pct(liveMatch.opponentConfidence)}</span></div>
                <ProgressBar value={liveMatch.opponentConfidence} tone="red" compact />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs"><span className="text-gray-400">Opponent fatigue</span><span className="text-white">{pct(liveMatch.opponentFatigue)}</span></div>
                <ProgressBar value={liveMatch.opponentFatigue} tone="amber" compact />
              </div>
            </div>
          </div>

          <div className="card min-h-0 flex-1 overflow-hidden">
            <div className="card-header px-3 py-2"><h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Shield className="h-4 w-4 text-green-400" />Current Setup</h3></div>
            <div className="card-body grid grid-cols-2 gap-3 p-3 text-xs">
              <div><p className="text-gray-500">Style</p><p className="font-bold text-white">{liveMatch.tacticalPlan}</p></div>
              <div><p className="text-gray-500">Focus</p><p className="font-bold text-white">{liveMatch.mentalFocus}</p></div>
              <div><p className="text-gray-500">Tempo</p><p className="font-bold text-white">{liveMatch.tempo}</p></div>
              <div><p className="text-gray-500">Approach</p><p className="font-bold text-white">{liveMatch.opponentApproach}</p></div>
              <div><p className="text-gray-500">Win Chance</p><p className="font-bold text-green-400">{liveMatch.plannedMatchWinChance}%</p></div>
              <div><p className="text-gray-500">Tactical Edge</p><p className={liveMatch.tacticalEdge >= 0 ? 'font-bold text-green-400' : 'font-bold text-red-400'}>{liveMatch.tacticalEdge >= 0 ? '+' : ''}{liveMatch.tacticalEdge}</p></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shrink-0 px-4 py-2 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase text-gray-500">{tournamentName}</p>
            <p className="truncate text-xs text-white">Frame {liveMatch.currentFrame}: {liveMatch.playerName} {liveMatch.playerPoints}-{liveMatch.opponentPoints} {liveMatch.opponentName}</p>
          </div>
          <div className="hidden min-w-0 flex-1 items-center justify-center gap-3 text-xs text-gray-400 xl:flex">
            <span className="truncate">{currentLeader}</span>
            <span className="text-border">|</span>
            <span className="shrink-0">{remainingPoints} points left</span>
            <span className="text-border">|</span>
            <span className="shrink-0">{duration}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => simulateLiveFrame()} className="btn-primary w-44 justify-center text-xs"><FastForward className="h-3.5 w-3.5" /> Sim Frame</button>
            <button type="button" onClick={() => simulateLiveMatch()} className="btn-secondary w-44 justify-center text-xs"><SkipForward className="h-3.5 w-3.5" /> Sim Match</button>
          </div>
        </div>
      </div>
    </div>
  )
}