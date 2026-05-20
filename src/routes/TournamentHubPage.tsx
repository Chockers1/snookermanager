import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Play, Search, Trophy, Users } from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/GameStateContext'
import { chalkCatalog, cueCatalog, tipCatalog } from '../data/catalogs'
import { buildTournamentHubData } from '../utils/liveRouteData'
import { formatMoney } from '../utils/formatters'

function average(values: number[]) {
  if (values.length === 0) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function progressClass(status: 'completed' | 'current' | 'upcoming') {
  if (status === 'completed') return 'border-green-600/30 bg-green-600/10 text-green-400'
  if (status === 'current') return 'border-amber-600/30 bg-amber-600/10 text-amber-400'
  return 'border-border bg-surface-light text-gray-500'
}

function isFinalRound(round: string | null) {
  return round?.trim().toLowerCase() === 'final'
}

export function TournamentHubPage() {
  const { gameState, simulateMatch, startLiveMatch, enterTournament } = useGame()
  const navigate = useNavigate()
  const tournamentData = buildTournamentHubData(gameState)
  const currentCue = cueCatalog.find((cue) => cue.id === gameState.equipment.currentCueId)
  const currentChalk = chalkCatalog.find((chalk) => chalk.id === gameState.equipment.currentChalkId)
  const currentTip = tipCatalog.find((tip) => tip.id === gameState.equipment.currentTipId)
  const equipmentReady = Boolean(currentCue && currentChalk && currentTip)
  const activeTournament = gameState.tournaments.find((item) => item.status === 'Entered') ?? gameState.tournaments.find((item) => item.status === 'Booked' || item.status === 'Available' || item.status === 'High Cost') ?? gameState.tournaments[0]
  const tournamentEntered = activeTournament?.status === 'Entered'
  const playerRow = gameState.rankings.find((row) => row.playerName === gameState.player.fullName)
  const nextOpponent = gameState.rankings.find((row) => row.playerName !== gameState.player.fullName && Math.abs(row.ranking - (playerRow?.ranking ?? 1)) <= 3) ?? gameState.rankings.find((row) => row.playerName !== gameState.player.fullName)
  const activeRound = gameState.tournamentProgress.tournamentId === activeTournament?.id ? gameState.tournamentProgress.currentRound : null
  const completedRounds = gameState.tournamentProgress.tournamentId === activeTournament?.id ? gameState.tournamentProgress.completedRounds : []
  const technicalAverage = average(Object.values(gameState.attributes.technical))
  const recentResults = tournamentData.recentResults.slice(0, 3)
  const topPerformers = tournamentData.topPerformers.slice(0, 3)
  const notes = tournamentData.notes.slice(0, 4)
  const tournamentCondition = [
    { label: 'Confidence', detail: `${gameState.player.confidence}%`, value: gameState.player.confidence, tone: 'green' as const },
    { label: 'Freshness', detail: `${Math.max(0, 100 - gameState.player.fatigue)}%`, value: Math.max(0, 100 - gameState.player.fatigue), tone: 'amber' as const },
    { label: 'Morale', detail: `${gameState.player.morale}%`, value: gameState.player.morale, tone: 'green' as const },
    { label: 'Technical Form', detail: `${technicalAverage}%`, value: technicalAverage, tone: 'green' as const },
  ]
  const pathRounds = ['Last 16', 'Quarter Final', 'Semi Final', 'Final'] as const
  const prizeRows = [
    { round: 'Winner', prize: activeTournament?.winnerPrize ?? activeTournament?.prizeMoney ?? 0 },
    { round: 'Runner-Up', prize: activeTournament?.runnerUpPrize ?? Math.round((activeTournament?.prizeMoney ?? 0) * 0.5) },
    { round: 'Semi Final', prize: activeTournament?.semiFinalPrize ?? Math.round((activeTournament?.prizeMoney ?? 0) * 0.25) },
    { round: 'Quarter Final', prize: activeTournament?.quarterFinalPrize ?? Math.round((activeTournament?.prizeMoney ?? 0) * 0.15) },
    { round: 'First Round', prize: activeTournament?.firstRoundPrize ?? 0 },
  ]
  const nextMatchStageLabel = tournamentEntered ? activeRound ?? 'Awaiting Draw' : 'Awaiting Draw'
  const primaryActionLabel = !equipmentReady ? 'Open Equipment' : tournamentEntered ? 'Play Next Match' : 'Enter Tournament'
  const sidebarSecondaryActionLabel = equipmentReady ? 'Scout Opponent' : 'Manage Equipment'

  function handleQuickSim() {
    if (!activeTournament) return
    if (!equipmentReady) {
      navigate('/equipment/cues')
      return
    }

    simulateMatch(activeTournament.id)
    if (isFinalRound(activeRound)) navigate('/rankings?from=final')
  }

  function handlePlayLiveMatch() {
    if (!activeTournament) return
    if (!equipmentReady) {
      navigate('/equipment/cues')
      return
    }

    if (!tournamentEntered) {
      enterTournament(activeTournament.id)
      return
    }

    startLiveMatch(activeTournament.id)
    navigate('/match/live')
  }

  function handleScoutPreview() {
    navigate('/match/preview')
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-5.5rem)] min-h-0 flex-col gap-2 overflow-hidden p-1.5">
      <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface/85 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-green-400">Tournament Hub</p>
          <h1 className="mt-1 truncate text-2xl font-bold leading-tight text-white">{activeTournament?.name ?? 'No Active Tournament'}</h1>
          <p className="mt-1 truncate text-xs text-gray-400">{activeTournament?.location ?? 'Location TBD'} · {activeTournament?.format ?? 'Format pending'} · {activeRound ?? 'Awaiting entry'}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-light/60 px-5 py-3 text-center">
          <p className="text-[10px] uppercase tracking-[0.16em] text-gray-500">Current Round</p>
          <p className="mt-1 text-2xl font-bold text-green-400">{activeRound ?? 'Entry'}</p>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-12 gap-2">
        <div className="col-span-8 grid min-h-0 grid-rows-[0.64fr_1.04fr_0.78fr_0.48fr] gap-2">
          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header"><h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Trophy className="h-3.5 w-3.5 text-green-400" /> Your Tournament Path</h3></div>
            <div className="card-body grid h-full min-h-0 grid-cols-4 gap-2 p-3">
              {pathRounds.map((round) => {
                const completed = completedRounds.find((item) => item.round === round)
                const isCurrent = activeRound === round
                const status = completed ? 'completed' : isCurrent ? 'current' : 'upcoming'

                return (
                  <div key={round} className={`flex min-h-0 flex-col items-center justify-center rounded-xl border p-2 text-center ${progressClass(status)}`}>
                    <p className="text-[10px] text-gray-400">{round}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{completed ? `${completed.playerFrames}-${completed.opponentFrames}` : '–'}</p>
                    <p className="mt-1 truncate text-xs text-gray-300">{completed ? completed.opponentName : 'TBD'}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card min-h-0 flex h-full flex-col overflow-hidden border-green-600/40 bg-gradient-to-r from-green-600/10 via-surface to-surface">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Next Match - {nextMatchStageLabel}</h3><span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-green-400">{tournamentEntered ? 'Playable' : 'Entry Needed'}</span></div>
            <div className="card-body flex h-full min-h-0 flex-col justify-between gap-3 p-3">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-500 bg-green-600/20 text-xl font-bold text-white">{initials(gameState.player.fullName)}</div>
                  <p className="mt-2 truncate text-xl font-semibold text-white">{gameState.player.fullName}</p>
                  <p className="mt-1 text-sm text-gray-400">Rank {playerRow?.ranking ?? gameState.player.amateurRanking ?? gameState.player.worldRanking ?? '-'}</p>
                  <p className="mt-1 text-sm text-green-400">Confidence {gameState.player.confidence}%</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-gray-400">VS</p>
                  <p className="mt-2 text-xs text-gray-400">{activeTournament?.format ?? 'Match format'}</p>
                </div>
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-500/60 bg-red-600/20 text-xl font-bold text-white">{initials(nextOpponent?.playerName ?? 'Opponent')}</div>
                  <p className="mt-2 truncate text-xl font-semibold text-white">{nextOpponent?.playerName ?? 'Opponent TBD'}</p>
                  <p className="mt-1 text-sm text-gray-400">Rank {nextOpponent?.ranking ?? '-'}</p>
                  <p className="mt-1 text-sm text-gray-400">{nextOpponent?.nation ?? 'Nation TBD'}</p>
                </div>
              </div>
              <div className="flex justify-center gap-2">
                <button type="button" className="btn-primary px-6 py-2 text-xs" onClick={handlePlayLiveMatch}><Play className="h-3.5 w-3.5" /> {primaryActionLabel}</button>
                <button type="button" className="btn-secondary px-4 py-2 text-xs" onClick={handleScoutPreview}><Search className="h-3.5 w-3.5" /> Scout Preview</button>
                <button type="button" className="btn-secondary px-4 py-2 text-xs" onClick={handleQuickSim}>Quick Sim</button>
              </div>
            </div>
          </div>

          <div className="grid min-h-0 grid-cols-3 gap-2">
            <div className="card min-h-0 flex h-full flex-col overflow-hidden">
              <div className="card-header"><h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Calendar className="h-3.5 w-3.5 text-green-400" /> Event Schedule</h3></div>
              <div className="card-body flex h-full min-h-0 flex-col justify-between gap-2 p-3 text-xs">
                {pathRounds.map((round) => {
                  const completed = completedRounds.some((item) => item.round === round)
                  const current = activeRound === round
                  return <div key={round} className={`flex items-center gap-2 rounded-lg px-2 py-2 ${current ? 'bg-green-600/10' : 'bg-surface-light/45'}`}><span className={`h-2 w-2 rounded-full ${completed ? 'bg-green-500' : current ? 'bg-amber-500' : 'bg-gray-600'}`} /><span className="w-24 text-white">{round}</span><span className={completed ? 'text-green-400' : current ? 'text-amber-400' : 'text-gray-500'}>{completed ? 'Completed' : current ? 'In Progress' : 'Upcoming'}</span></div>
                })}
              </div>
            </div>

            <div className="card min-h-0 flex h-full flex-col overflow-hidden">
              <div className="card-header"><h3 className="text-sm font-semibold text-white">Objectives</h3></div>
              <div className="card-body flex h-full min-h-0 flex-col justify-between gap-2 p-3">
                {tournamentData.objectives.map((objective) => (
                  <div key={objective.label}>
                    <div className="mb-1 flex justify-between text-xs"><span className="truncate text-gray-400">{objective.label}</span><span className="text-white">{objective.current}/{objective.target}</span></div>
                    <ProgressBar value={(objective.current / objective.target) * 100} tone={objective.current >= objective.target ? 'green' : 'amber'} compact />
                    <p className="mt-1 truncate text-[10px] text-gray-500">{objective.status} · {objective.reward} pts</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card min-h-0 flex h-full flex-col overflow-hidden">
              <div className="card-header"><h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Users className="h-3.5 w-3.5 text-green-400" /> Top Performers</h3></div>
              <div className="card-body flex h-full min-h-0 flex-col justify-between gap-2 p-3">
                {topPerformers.length > 0 ? topPerformers.map((player, index) => <div key={player.id} className="flex justify-between rounded-lg bg-surface-light/50 px-3 py-2 text-xs"><span className="truncate text-white">{index + 1}. {player.name}</span><span className="shrink-0 text-green-400">{player.score}</span></div>) : <div className="flex h-full items-center justify-center text-sm text-gray-500">-</div>}
              </div>
            </div>
          </div>

          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Recent Results</h3></div>
            <div className="card-body grid h-full min-h-0 grid-cols-3 gap-2 p-3">
              {recentResults.length > 0 ? recentResults.map((result) => (
                <div key={result.id} className="rounded-lg bg-surface-light/50 p-3 text-xs">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-gray-500">{result.round}</p>
                  <p className="mt-1 truncate text-white">{result.winner} def. {result.loser}</p>
                  <p className="mt-1 text-green-400">{result.score}</p>
                </div>
              )) : <div className="col-span-3 flex items-center justify-center text-2xl text-gray-500">–</div>}
            </div>
          </div>
        </div>

        <div className="col-span-4 grid min-h-0 grid-rows-[0.88fr_0.64fr_0.66fr_0.66fr_auto] gap-2">
          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Player Condition</h3></div>
            <div className="card-body grid h-full min-h-0 grid-rows-4 gap-1.5 p-2.5">
              {tournamentCondition.map((item) => (
                <div key={item.label}>
                  <div className="mb-0.5 flex justify-between text-[11px]"><span className="text-gray-400">{item.label}</span><span className="text-white">{item.detail}</span></div>
                  <ProgressBar value={item.value} tone={item.tone} compact />
                </div>
              ))}
            </div>
          </div>

          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Equipment Readiness</h3></div>
            <div className="card-body grid h-full min-h-0 grid-cols-[1fr_auto] gap-y-1.5 p-2.5 text-[11px]">
              <span className="text-gray-400">Cue</span><span className="truncate text-right text-white">{currentCue?.name ?? 'Empty Slot'}</span>
              <span className="text-gray-400">Tip</span><span className="truncate text-right text-white">{currentTip?.name ?? 'Empty Slot'}</span>
              <span className="text-gray-400">Chalk</span><span className="truncate text-right text-white">{currentChalk?.name ?? 'Empty Slot'}</span>
              <span className="text-gray-400">Status</span><span className={`truncate text-right ${equipmentReady ? 'text-green-400' : 'text-red-400'}`}>{equipmentReady ? 'Ready' : 'Incomplete'}</span>
            </div>
          </div>

          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Prize Structure</h3></div>
            <div className="card-body grid h-full min-h-0 content-start gap-y-1.5 p-2.5 text-[11px]">
              {prizeRows.map((row) => <div key={row.round} className="flex justify-between gap-3"><span className="text-gray-400">{row.round}</span><span className="shrink-0 text-right font-medium text-green-400">{formatMoney(row.prize)}</span></div>)}
            </div>
          </div>

          <div className="card min-h-0 flex h-full flex-col overflow-hidden">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Event Notes</h3></div>
            <div className="card-body min-h-0 overflow-auto p-3 scrollbar-thin">
              <ul className="space-y-2 text-xs text-gray-400">
                {notes.map((note) => <li key={note} className="leading-relaxed">{note}</li>)}
              </ul>
            </div>
          </div>

          <div className="grid gap-2">
            <button type="button" className="btn-primary justify-center py-2 text-xs" onClick={handlePlayLiveMatch}><Play className="h-3.5 w-3.5" /> {primaryActionLabel}</button>
            <button type="button" className="btn-secondary justify-center py-2 text-xs" onClick={() => equipmentReady ? handleScoutPreview() : navigate('/equipment/cues')}><Search className="h-3.5 w-3.5" /> {sidebarSecondaryActionLabel}</button>
            <button type="button" className="btn-secondary justify-center py-2 text-xs" onClick={() => navigate('/tournaments/draw')}>View Draw</button>
            <button type="button" className="btn-secondary justify-center py-2 text-xs" onClick={() => navigate('/travel')}><MapPin className="h-3.5 w-3.5" /> Travel Plan</button>
          </div>
        </div>
      </div>
    </div>
  )
}