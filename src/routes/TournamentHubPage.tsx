import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Trophy } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SectionCard } from '../components/ui/SectionCard'
import { useGame } from '../context/GameStateContext'
import { chalkCatalog, cueCatalog, tipCatalog } from '../data/catalogs'
import { buildTournamentHubData } from '../utils/liveRouteData'
import { formatMoney } from '../utils/formatters'

function getTone(value: number): 'green' | 'amber' | 'red' {
  if (value >= 70) return 'green'
  if (value >= 45) return 'amber'
  return 'red'
}

function getProgressClasses(status: 'completed' | 'current' | 'upcoming') {
  if (status === 'completed') return 'border-emerald-500/45 bg-emerald-500/10 text-emerald-200'
  if (status === 'current') return 'border-scm-gold/45 bg-scm-gold/10 text-scm-gold'
  return 'border-scm-border bg-scm-panelSoft text-scm-textMuted'
}

export function TournamentHubPage() {
  const { gameState, simulateMatch } = useGame()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Overview')
  const tournamentData = buildTournamentHubData(gameState)
  const currentCue = cueCatalog.find((cue) => cue.id === gameState.equipment.currentCueId)
  const currentChalk = chalkCatalog.find((chalk) => chalk.id === gameState.equipment.currentChalkId)
  const currentTip = tipCatalog.find((tip) => tip.id === gameState.equipment.currentTipId)
  const equipmentReady = Boolean(currentCue && currentChalk && currentTip)
  const activeTournament =
    gameState.tournaments.find((item) => item.status === 'Entered') ??
    gameState.tournaments.find((item) => item.status === 'Available' || item.status === 'High Cost') ??
    gameState.tournaments[0]
  const playerRow = gameState.rankings.find((row) => row.playerName === gameState.player.fullName)
  const nextOpponent =
    gameState.rankings.find((row) => row.playerName !== gameState.player.fullName && Math.abs(row.ranking - (playerRow?.ranking ?? 1)) <= 3) ??
    gameState.rankings.find((row) => row.playerName !== gameState.player.fullName)
  const activeRound =
    gameState.tournamentProgress.tournamentId === activeTournament?.id ? gameState.tournamentProgress.currentRound : null
  const completedRounds =
    gameState.tournamentProgress.tournamentId === activeTournament?.id ? gameState.tournamentProgress.completedRounds : []
  const tournamentCondition = [
    { label: 'Confidence', detail: `${gameState.player.confidence}%`, value: gameState.player.confidence },
    { label: 'Fatigue', detail: `${gameState.player.fatigue}%`, value: Math.max(0, 100 - gameState.player.fatigue) },
    { label: 'Morale', detail: `${gameState.player.morale}%`, value: gameState.player.morale },
    { label: 'Technical Form', detail: `${Math.round(Object.values(gameState.attributes.technical).reduce((sum, value) => sum + value, 0) / Object.values(gameState.attributes.technical).length)}%`, value: Math.round(Object.values(gameState.attributes.technical).reduce((sum, value) => sum + value, 0) / Object.values(gameState.attributes.technical).length) },
  ]
  const totalObjectiveReward = tournamentData.objectives.reduce((sum, item) => sum + item.reward, 0)
  const totalObjectiveProgress = tournamentData.objectives.reduce((sum, item) => sum + item.current, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tournaments"
        title="Tournament Hub"
        description="Match path, next opponent, event objectives, and live tournament context in one place before you step onto the table. The opponent, condition, and equipment summary now reflect the current save."
        actions={<div className="flex items-center gap-3"><ActionButton tone="secondary" onClick={() => setActiveTab('Overview')}>Overview</ActionButton><ActionButton tone="secondary" onClick={() => navigate('/tournaments/draw')}>View Draw</ActionButton></div>}
      />

      <div className="flex gap-3 border-b border-scm-border pb-4 text-sm">
        {['Overview', 'Draw', 'Schedule', 'Players', 'History', 'Analytics'].map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`rounded-full px-4 py-2 ${tab === activeTab ? 'bg-scm-green/15 text-emerald-200' : 'text-scm-textMuted'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_360px]">
        <div className="space-y-6">
          <SectionCard title="Tournament Draw" subtitle="Current path through the top half of the bracket.">
            <div className="overflow-x-auto">
              <div className="flex min-w-[900px] gap-4">
                {(['Last 16', 'Quarter Final', 'Semi Final', 'Final'] as const).map((round) => {
                  const completed = completedRounds.find((item) => item.round === round)
                  const isCurrent = activeRound === round

                  return (
                    <div key={round} className="min-w-[220px] flex-1">
                      <p className="mb-3 text-xs uppercase tracking-[0.16em] text-scm-textMuted">{round}</p>
                      <div className={`rounded-2xl border p-3 ${completed ? 'border-emerald-500/45 bg-emerald-500/10' : isCurrent ? 'border-scm-gold/45 bg-scm-gold/10' : 'border-dashed border-scm-border bg-scm-panelSoft/70 text-scm-textMuted'}`}>
                        <div className="rounded-xl px-3 py-2 text-scm-text">
                          <div className="flex items-center justify-between">
                            <span>{gameState.player.fullName}</span>
                            <span>{completed ? completed.playerFrames : isCurrent ? '-' : 'TBD'}</span>
                          </div>
                        </div>
                        <div className="rounded-xl px-3 py-2 text-scm-text">
                          <div className="flex items-center justify-between">
                            <span>{completed ? completed.opponentName : isCurrent ? nextOpponent?.playerName ?? 'Opponent TBD' : 'Opponent TBD'}</span>
                            <span>{completed ? completed.opponentFrames : isCurrent ? '-' : 'TBD'}</span>
                          </div>
                        </div>
                        <p className={`mt-3 text-xs uppercase tracking-[0.16em] ${completed ? 'text-emerald-200' : isCurrent ? 'text-scm-gold' : 'text-scm-textMuted'}`}>
                          {completed ? completed.result : isCurrent ? 'Current round' : 'Upcoming'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <SectionCard title="Prize Money & Ranking Points">
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Winner', prize: 2400, points: 180 },
                  { label: 'Final', prize: 1200, points: 120 },
                  { label: 'Semi Final', prize: 650, points: 80 },
                  { label: 'Quarter Final', prize: 325, points: 40 },
                  { label: 'Last 16', prize: 160, points: 18 },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3">
                    <span className="text-scm-textSoft">{row.label}</span>
                    <span className="text-scm-text">{formatMoney(row.label === 'Winner' ? (activeTournament?.prizeMoney ?? row.prize) : row.prize)} · {row.label === 'Winner' ? (activeTournament?.rankingValue ?? row.points) : row.points} pts</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Event Objectives">
              <div className="space-y-4">
                {tournamentData.objectives.map((objective) => (
                  <div key={objective.label}>
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                      <span className="text-scm-textSoft">{objective.label}</span>
                      <span className="text-scm-text">{objective.current} / {objective.target}</span>
                    </div>
                    <ProgressBar value={(objective.current / objective.target) * 100} tone={objective.current / objective.target >= 0.8 ? 'green' : 'amber'} />
                    <div className="mt-2 flex items-center justify-between text-xs text-scm-textMuted">
                      <span>{objective.status}</span>
                      <span>{objective.reward} pts</span>
                    </div>
                  </div>
                ))}
                <div className="rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3 text-sm text-scm-textSoft">
                  Total objective progress: <span className="text-scm-text">{totalObjectiveProgress} / {totalObjectiveReward}</span>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <SectionCard title="Recent Results">
              <div className="space-y-3 text-sm">
                {(completedRounds.length > 0
                  ? completedRounds.map((result, index) => ({
                      id: `${result.round}-${index}`,
                      round: result.round,
                      winner: result.result === 'Won' ? gameState.player.fullName : result.opponentName,
                      loser: result.result === 'Won' ? result.opponentName : gameState.player.fullName,
                      score: `${result.playerFrames}-${result.opponentFrames}`,
                    }))
                  : tournamentData.recentResults).map((result) => (
                  <div key={result.id} className="rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{result.round}</p>
                    <p className="mt-2 text-scm-text">{result.winner} def. {result.loser}</p>
                    <p className="text-scm-green">{result.score}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Upcoming Matches">
              <div className="space-y-3 text-sm">
                {tournamentData.upcomingMatches.map((match) => (
                  <div key={match.id} className="rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-scm-textMuted"><span>{match.time}</span><span>{match.table}</span></div>
                    <p className="mt-2 text-scm-text">{match.home}</p>
                    <p className="text-scm-textSoft">vs {match.away}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Top Performers">
              <div className="space-y-3 text-sm">
                {tournamentData.topPerformers.map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3">
                    <span className="text-scm-text">{index + 1}. {player.name}</span>
                    <span className="text-emerald-300">+{player.score}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard title="Next Opponent">
            <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Round</p>
              <p className="mt-2 text-2xl font-semibold text-scm-text">{nextOpponent?.playerName ?? 'Opponent TBD'}</p>
              <p className="mt-2 text-sm text-scm-textSoft">Rank {nextOpponent?.ranking ?? '-'} · {activeRound ?? 'Awaiting Entry'}</p>
              <div className="mt-4 grid gap-3 text-sm text-scm-textSoft">
                <div className="flex justify-between"><span>Head-to-head</span><span className="text-scm-text">2-2</span></div>
                <div className="flex justify-between"><span>Last meeting</span><span className="text-scm-text">{gameState.matches.find((match) => match.opponentName === nextOpponent?.playerName)?.playedOn ?? 'No prior meeting logged'}</span></div>
                <div className="flex justify-between"><span>Style note</span><span className="text-amber-300">Patient tactical start</span></div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-scm-border bg-scm-panelSoft p-4 text-sm text-scm-textSoft">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-scm-gold" />
                <div>
                  <p className="text-scm-text">{activeTournament?.location ?? 'Leeds Arena, England'}</p>
                  <p>Match starts during the {activeTournament?.startDate ?? gameState.currentDate} event window.</p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Player Condition">
            <div className="space-y-4">
              {tournamentCondition.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textSoft">{item.label}</span><span className={item.value >= 70 ? 'text-emerald-300' : item.value >= 45 ? 'text-amber-300' : 'text-rose-300'}>{item.detail}</span></div>
                  <ProgressBar value={item.value} tone={getTone(item.value)} />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Equipment Summary">
            <div className="space-y-3 text-sm text-scm-textSoft">
              <div className="flex items-center justify-between"><span>Cue</span><span className="text-scm-text">{currentCue?.name ?? 'Empty Slot'}</span></div>
              <div className="flex items-center justify-between"><span>Tip</span><span className="text-scm-text">{currentTip?.name ?? 'Empty Slot'}</span></div>
              <div className="flex items-center justify-between"><span>Chalk</span><span className="text-scm-text">{currentChalk?.name ?? 'Empty Slot'}</span></div>
            </div>
            {!equipmentReady ? <p className="mt-4 text-sm text-rose-200">Tournament play is locked until all three equipment slots are filled.</p> : null}
          </SectionCard>

          <SectionCard title="Player Progress">
            <div className="flex flex-wrap gap-2">
              {(['Last 16', 'Quarter Final', 'Semi Final', 'Final'] as const).map((step) => (
                <div
                  key={step}
                  className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.16em] ${getProgressClasses(completedRounds.some((round) => round.round === step) ? 'completed' : activeRound === step ? 'current' : 'upcoming')}`}
                >
                  {step}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Event Notes">
            <ul className="space-y-3 text-sm text-scm-textSoft">
              <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-scm-gold" />{gameState.lastAction}</li>
              {tournamentData.notes.map((note) => (
                <li key={note} className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-scm-gold" />{note}</li>
              ))}
            </ul>
          </SectionCard>

          <div className="grid gap-3">
            <ActionButton className="justify-center" icon={<Trophy className="h-4 w-4" />} onClick={() => equipmentReady ? (activeTournament && simulateMatch(activeTournament.id)) : navigate('/equipment/cues')}>{equipmentReady ? 'Play Next Match' : 'Open Equipment'}</ActionButton>
            <ActionButton tone="secondary" className="justify-center" onClick={() => navigate('/tournaments/draw')}>View Draw</ActionButton>
            <ActionButton tone="secondary" className="justify-center" onClick={() => navigate('/match/preview')}>Scout Opponent</ActionButton>
            <ActionButton tone="secondary" className="justify-center" onClick={() => navigate('/equipment/chalk-tips')}>Change Equipment</ActionButton>
          </div>
        </div>
      </div>
    </div>
  )
}