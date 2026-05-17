import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Pause, Play, Timer } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { CircularMeter } from '../components/ui/CircularMeter'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SectionCard } from '../components/ui/SectionCard'
import { useGame } from '../context/GameStateContext'

const TACTICAL_PLANS = ['Attack', 'Balanced', 'Safety'] as const
const MENTAL_FOCUS_OPTIONS = ['Composed', 'Confident', 'Counter'] as const
const TEMPO_OPTIONS = ['Steady', 'Quick'] as const
const BASE_VISIT_OPTIONS = ['Pot Attempt', 'Break Build', 'Safety Exchange'] as const
const ENDGAME_COLOUR_POINTS = {
  Yellow: 2,
  Green: 3,
  Brown: 4,
  Blue: 5,
  Pink: 6,
  Black: 7,
} as const

type LiveMatchViewState = NonNullable<ReturnType<typeof useGame>['gameState']['liveMatch']>

function getRemainingTablePoints(liveMatch: LiveMatchViewState) {
  return liveMatch.tableState.redsRemaining * 8 + liveMatch.tableState.coloursRemaining.reduce((total, colour) => total + ENDGAME_COLOUR_POINTS[colour], 0)
}

function playerNeedsSnookers(liveMatch: LiveMatchViewState) {
  return liveMatch.playerPoints < liveMatch.opponentPoints && liveMatch.opponentPoints - liveMatch.playerPoints > getRemainingTablePoints(liveMatch)
}

function isRespottedBlackState(liveMatch: LiveMatchViewState) {
  return liveMatch.tableState.redsRemaining === 0 && liveMatch.tableState.coloursRemaining.length === 0 && liveMatch.playerPoints === liveMatch.opponentPoints
}

function getTableStateLabel(liveMatch: LiveMatchViewState) {
  if (liveMatch.tableState.redsRemaining > 0) {
    return `${liveMatch.tableState.redsRemaining} reds + colours`
  }

  const currentColour = liveMatch.tableState.coloursRemaining[0]
  return currentColour ? `${currentColour} to black` : 'Colours cleared'
}

function getTargetBallLabel(liveMatch: LiveMatchViewState) {
  if (isRespottedBlackState(liveMatch)) return 'Respotted black'
  if (liveMatch.tableState.redsRemaining > 0) return 'Red phase'
  return liveMatch.tableState.coloursRemaining[0] ?? 'Frame ball'
}

function getDecisionModeLabel(liveMatch: LiveMatchViewState) {
  if (isRespottedBlackState(liveMatch)) return 'Respotted black'
  if (playerNeedsSnookers(liveMatch)) return 'Snooker phase'
  if (liveMatch.tableState.redsRemaining > 0) return 'Reds phase'
  return 'Colours clearance'
}

function getVisitOptions(liveMatch: LiveMatchViewState) {
  if (isRespottedBlackState(liveMatch)) {
    return ['Respotted Black'] as const
  }

  if (playerNeedsSnookers(liveMatch) && liveMatch.tableState.redsRemaining === 0) {
    return [...BASE_VISIT_OPTIONS, 'Snooker Hunt'] as const
  }

  return BASE_VISIT_OPTIONS
}

export function LiveMatchPage() {
  const { gameState, playLiveVisit, simulateLiveVisit, continueLiveFrame, simulateLiveFrame, simulateLiveMatch, updateLiveMatchTactics, applyLiveCoachCue, takeLiveMatchTimeout } = useGame()
  const navigate = useNavigate()
  const liveMatch = gameState.liveMatch
  const playerTurn = liveMatch?.playerAtTable === liveMatch?.playerName
  const visitOptions = liveMatch ? getVisitOptions(liveMatch) : BASE_VISIT_OPTIONS

  useEffect(() => {
    if (liveMatch?.status === 'Completed') {
      navigate('/match/result')
    }
  }, [liveMatch?.status, navigate])

  if (!liveMatch) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Match Centre"
          title="Live Match"
          description="No live match is currently active. Start the next match from the preview screen."
        />

        <SectionCard>
          <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-8 text-center">
            <Activity className="mx-auto h-16 w-16 text-scm-textMuted" />
            <p className="mt-4 text-2xl font-semibold text-scm-text">No active table session</p>
            <p className="mt-3 text-sm text-scm-textSoft">Match preview now creates a persistent live session before sending you here.</p>
            <div className="mt-6">
              <ActionButton className="justify-center" onClick={() => navigate('/match/preview')}>Go To Match Preview</ActionButton>
            </div>
          </div>
        </SectionCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Match Centre"
        title={`${gameState.tournaments.find((tournament) => tournament.id === liveMatch.tournamentId)?.name ?? 'Live Match'} · ${liveMatch.round}`}
        description={`Visit-by-visit match flow for the current best-of-${liveMatch.bestOf} tie. The frame now tracks reds plus ordered colours for the endgame, and rivals keep a persistent archetype across repeat meetings.`}
      />

      <div className="grid gap-4 xl:grid-cols-[1.35fr_340px]">
        <div className="space-y-6">
          <SectionCard>
            <div className="grid gap-6 xl:grid-cols-[1fr_220px_1fr] xl:items-center">
              <div>
                <p className="text-3xl font-semibold text-scm-text">{liveMatch.playerName}</p>
                <p className="mt-2 text-sm text-scm-textSoft">Confidence {liveMatch.playerConfidence}% · Fatigue {liveMatch.playerFatigue}%</p>
                <div className="mt-3"><ProgressBar value={liveMatch.playerConfidence} tone="green" /></div>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Best Of {liveMatch.bestOf}</p>
                <div className="mt-4 flex items-center justify-center gap-6 text-6xl font-semibold text-scm-text">
                  <span>{liveMatch.playerFrames}</span>
                  <span className="text-scm-textMuted">-</span>
                  <span>{liveMatch.opponentFrames}</span>
                </div>
                <p className="mt-3 text-sm text-scm-textSoft">Frames won</p>
              </div>
              <div className="text-right xl:text-left">
                <p className="text-3xl font-semibold text-scm-text">{liveMatch.opponentName}</p>
                <p className="mt-2 text-sm text-scm-textSoft">Confidence {liveMatch.opponentConfidence}% · Opponent rank {liveMatch.opponentRanking}</p>
                <p className="mt-1 text-sm text-scm-textSoft">Archetype {liveMatch.opponentArchetype}</p>
                <div className="mt-3"><ProgressBar value={liveMatch.opponentConfidence} tone="amber" /></div>
              </div>
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr_0.95fr]">
            <SectionCard title="Current Visit">
              <div className="grid gap-4 md:grid-cols-3 text-center">
                <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{liveMatch.playerName.split(' ')[0]}</p><p className="mt-2 text-5xl font-semibold text-emerald-300">{liveMatch.playerPoints}</p></div>
                <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Frame / Visit</p><p className="mt-2 text-4xl font-semibold text-scm-text">{liveMatch.currentFrame}.{liveMatch.currentVisit}</p></div>
                <div><p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{liveMatch.opponentName.split(' ')[0]}</p><p className="mt-2 text-5xl font-semibold text-amber-300">{liveMatch.opponentPoints}</p></div>
              </div>
              <div className="mt-6 space-y-3 text-sm text-scm-textSoft">
                <div className="flex justify-between"><span>Current Break</span><span className="text-scm-text">{liveMatch.currentBreak}</span></div>
                <div className="flex justify-between"><span>Table State</span><span className="text-scm-text">{getTableStateLabel(liveMatch)}</span></div>
                <div className="flex justify-between"><span>Points On Table</span><span className="text-scm-text">{getRemainingTablePoints(liveMatch)}</span></div>
                <div className="flex justify-between"><span>Target Ball</span><span className="text-scm-text">{getTargetBallLabel(liveMatch)}</span></div>
                <div className="flex justify-between"><span>At Table</span><span className="text-emerald-300">{liveMatch.playerAtTable}</span></div>
                <div className="flex justify-between"><span>Shot Clock</span><span className="text-scm-text">{liveMatch.shotClock}s</span></div>
                <div className="flex justify-between"><span>Decision Mode</span><span className="text-scm-text">{getDecisionModeLabel(liveMatch)}</span></div>
                <div className="rounded-xl border border-scm-border bg-scm-panelSoft px-3 py-3 text-left">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Latest visit</p>
                  <p className="mt-2 text-scm-text">{liveMatch.lastVisitSummary}</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Momentum">
              <div className="h-[240px] w-full">
                <ResponsiveContainer>
                  <LineChart data={liveMatch.momentum}>
                    <CartesianGrid stroke="#203449" vertical={false} />
                    <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} width={36} />
                    <Tooltip contentStyle={{ backgroundColor: '#102033', border: '1px solid #31506f', borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="player" stroke="#22c55e" strokeWidth={3} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="opponent" stroke="#fbbf24" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Pressure">
              <div className="flex h-full flex-col items-center justify-center text-center">
                <CircularMeter value={liveMatch.pressureValue} label={liveMatch.pressureLabel} />
                <p className="mt-4 text-sm text-scm-textSoft">Pressure is climbing, but the current visit still offers frame-winning leverage.</p>
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr_0.95fr]">
            <SectionCard title="Player State">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { label: `${liveMatch.playerName.split(' ')[0]} Confidence`, value: liveMatch.playerConfidence, tone: 'green' as const },
                  { label: `${liveMatch.playerName.split(' ')[0]} Fatigue`, value: liveMatch.playerFatigue, tone: 'amber' as const },
                  { label: `${liveMatch.opponentName.split(' ')[0]} Confidence`, value: liveMatch.opponentConfidence, tone: 'amber' as const },
                  { label: `${liveMatch.opponentName.split(' ')[0]} Fatigue`, value: liveMatch.opponentFatigue, tone: 'amber' as const },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm"><span className="text-scm-textSoft">{item.label}</span><span className="text-scm-text">{item.value}%</span></div>
                    <ProgressBar value={item.value} tone={item.tone} />
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Visit Log">
              <div className="space-y-3 text-sm">
                {liveMatch.visitHistory.length > 0 ? liveMatch.visitHistory.map((visit) => (
                  <div key={visit.id} className="rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-scm-textMuted">{visit.frameLabel} · V{visit.visit}</span>
                      <span className={visit.actor === 'Player' ? 'text-emerald-300' : 'text-amber-300'}>{visit.actor}</span>
                    </div>
                    <p className="mt-2 text-scm-text">{visit.decision}</p>
                    <p className="mt-1 text-scm-textSoft">{visit.outcome}{visit.points > 0 ? ` · ${visit.points} pts` : ''}{visit.retainedTable ? ' · stayed in' : ''}</p>
                  </div>
                )) : (
                  <div className="rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3 text-scm-textSoft">
                    No visits logged yet. The opening visit starts when you take the first shot or watch the opponent break the frame open.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Frame History">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-[0.16em] text-scm-textMuted">
                    <tr>
                      <th className="px-3 py-2">Frame</th>
                      <th className="px-3 py-2">{liveMatch.playerName.split(' ')[0]}</th>
                      <th className="px-3 py-2">{liveMatch.opponentName.split(' ')[0]}</th>
                      <th className="px-3 py-2">Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveMatch.frameHistory.map((row) => (
                      <tr key={row.frame} className="border-t border-scm-border">
                        <td className="px-3 py-3 text-scm-textSoft">{row.frame}</td>
                        <td className="px-3 py-3 text-scm-text">{row.player}</td>
                        <td className="px-3 py-3 text-scm-text">{row.opponent}</td>
                        <td className="px-3 py-3 text-scm-text">{row.winner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard title="Match Information">
            <div className="space-y-4 text-sm text-scm-textSoft">
              <div className="flex items-center justify-between"><span className="flex items-center gap-2"><Timer className="h-4 w-4 text-scm-gold" />Elapsed</span><span className="text-scm-text">{Math.floor(liveMatch.timeElapsedMinutes / 60)}h {String(liveMatch.timeElapsedMinutes % 60).padStart(2, '0')}m</span></div>
              <div className="flex items-center justify-between"><span>Started</span><span className="text-scm-text">{liveMatch.startedAt}</span></div>
              <div className="flex items-center justify-between"><span>Table</span><span className="text-scm-text">{liveMatch.table}</span></div>
              <div className="flex items-center justify-between"><span>Referee</span><span className="text-scm-text">{liveMatch.referee}</span></div>
              <div className="flex items-center justify-between"><span>Conditions</span><span className="text-emerald-300">{liveMatch.conditions}</span></div>
              <div className="flex items-center justify-between"><span>Opponent approach</span><span className="text-scm-text">{liveMatch.opponentApproach}</span></div>
              <div className="flex items-center justify-between"><span>Tactical edge</span><span className={liveMatch.tacticalEdge >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{liveMatch.tacticalEdge >= 0 ? '+' : ''}{liveMatch.tacticalEdge}</span></div>
            </div>
          </SectionCard>

          <SectionCard title="Coach Corner">
            <div className="space-y-4 rounded-2xl border border-scm-border bg-scm-panelSoft p-4 text-sm text-scm-textSoft">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Current prompt</p>
                <p className="mt-2 text-lg font-semibold text-scm-text">{liveMatch.coachPrompt.title}</p>
                <p className="mt-2">{liveMatch.coachPrompt.note}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-scm-border px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Plan</p>
                  <p className="mt-2 text-scm-text">{liveMatch.coachPrompt.recommendedPlan}</p>
                </div>
                <div className="rounded-xl border border-scm-border px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Focus</p>
                  <p className="mt-2 text-scm-text">{liveMatch.coachPrompt.recommendedMentalFocus}</p>
                </div>
                <div className="rounded-xl border border-scm-border px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Tempo</p>
                  <p className="mt-2 text-scm-text">{liveMatch.coachPrompt.recommendedTempo}</p>
                </div>
              </div>
              <ActionButton tone="secondary" className="w-full justify-center" onClick={() => applyLiveCoachCue()}>
                Apply Coach Cue
              </ActionButton>
            </div>
          </SectionCard>

          <SectionCard title="Opponent Adjustments">
            <div className="space-y-4 rounded-2xl border border-scm-border bg-scm-panelSoft p-4 text-sm text-scm-textSoft">
              {liveMatch.lastOpponentAdjustment ? (
                <>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Latest shift</p>
                    <p className="mt-2 text-lg font-semibold text-scm-text">{liveMatch.lastOpponentAdjustment.title}</p>
                    <p className="mt-2">{liveMatch.lastOpponentAdjustment.note}</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-xl border border-scm-border px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Trigger</p>
                      <p className="mt-2 text-scm-text">{liveMatch.lastOpponentAdjustment.trigger}</p>
                    </div>
                    <div className="rounded-xl border border-scm-border px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">From</p>
                      <p className="mt-2 text-scm-text">{liveMatch.lastOpponentAdjustment.fromApproach}</p>
                    </div>
                    <div className="rounded-xl border border-scm-border px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">To</p>
                      <p className="mt-2 text-scm-text">{liveMatch.lastOpponentAdjustment.toApproach}</p>
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-scm-border pt-3">
                    {liveMatch.opponentAdjustmentHistory.map((adjustment, index) => (
                      <div key={`${adjustment.frameLabel}-${adjustment.trigger}-${index}`} className="rounded-xl border border-scm-border px-3 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-scm-text">{adjustment.frameLabel}</p>
                          <span className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{adjustment.trigger}</span>
                        </div>
                        <p className="mt-2">{adjustment.note}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-scm-text">No opponent shift yet.</p>
                  <p className="mt-2">The rival will adapt when the score swings, pressure spikes, or a timeout changes the rhythm.</p>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Tactical Settings">
            <div className="space-y-5">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Frame Plan</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {TACTICAL_PLANS.map((plan) => (
                    <ActionButton
                      key={plan}
                      tone={liveMatch.tacticalPlan === plan ? 'primary' : 'secondary'}
                      className="justify-center"
                      onClick={() => updateLiveMatchTactics({ tacticalPlan: plan })}
                    >
                      {plan}
                    </ActionButton>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Mental Focus</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {MENTAL_FOCUS_OPTIONS.map((focus) => (
                    <ActionButton
                      key={focus}
                      tone={liveMatch.mentalFocus === focus ? 'primary' : 'secondary'}
                      className="justify-center"
                      onClick={() => updateLiveMatchTactics({ mentalFocus: focus })}
                    >
                      {focus}
                    </ActionButton>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Tempo</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {TEMPO_OPTIONS.map((tempo) => (
                    <ActionButton
                      key={tempo}
                      tone={liveMatch.tempo === tempo ? 'primary' : 'secondary'}
                      className="justify-center"
                      onClick={() => updateLiveMatchTactics({ tempo })}
                    >
                      {tempo}
                    </ActionButton>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4 text-sm text-scm-textSoft">
                <div className="flex items-center justify-between"><span>Current plan</span><span className="text-scm-text">{liveMatch.tacticalPlan}</span></div>
                <div className="mt-2 flex items-center justify-between"><span>Focus</span><span className="text-scm-text">{liveMatch.mentalFocus}</span></div>
                <div className="mt-2 flex items-center justify-between"><span>Tempo</span><span className="text-scm-text">{liveMatch.tempo}</span></div>
                <div className="mt-2 flex items-center justify-between"><span>Opponent approach</span><span className="text-scm-text">{liveMatch.opponentApproach}</span></div>
                <div className="mt-2 flex items-center justify-between"><span>Tactical edge</span><span className={liveMatch.tacticalEdge >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{liveMatch.tacticalEdge >= 0 ? '+' : ''}{liveMatch.tacticalEdge}</span></div>
                <div className="mt-2 flex items-center justify-between"><span>Last frame mode</span><span className="text-scm-text">{liveMatch.lastFrameMode ?? 'Not played yet'}</span></div>
                <p className="mt-4 text-scm-textSoft">{liveMatch.lastTacticalNote}</p>
              </div>

              <ActionButton
                tone="secondary"
                className="w-full justify-center"
                disabled={liveMatch.timeoutsRemaining <= 0}
                onClick={() => takeLiveMatchTimeout()}
              >
                Use Timeout ({liveMatch.timeoutsRemaining} left)
              </ActionButton>
            </div>
          </SectionCard>

          <SectionCard title="Interval Information">
            <p className="text-sm text-scm-textSoft">{liveMatch.intervalText}</p>
            <p className="mt-5 text-3xl font-semibold text-scm-gold">{liveMatch.framesRemainingText}</p>
          </SectionCard>

          <div className="grid gap-3">
            {playerTurn ? (
              <div className="grid gap-2 sm:grid-cols-3">
                {visitOptions.map((option) => (
                  <ActionButton key={option} className="justify-center" icon={option === 'Pot Attempt' ? <Play className="h-4 w-4" /> : undefined} onClick={() => playLiveVisit(option)}>
                    {option}
                  </ActionButton>
                ))}
              </div>
            ) : (
              <ActionButton className="justify-center" icon={<Play className="h-4 w-4" />} onClick={() => simulateLiveVisit()}>Watch Opponent Visit</ActionButton>
            )}
            <ActionButton tone="secondary" className="justify-center" onClick={() => simulateLiveVisit()}>Sim Visit</ActionButton>
            <ActionButton tone="secondary" className="justify-center" onClick={() => continueLiveFrame()}>Play Out Frame</ActionButton>
            <ActionButton tone="secondary" className="justify-center" onClick={() => simulateLiveFrame()}>Sim Frame</ActionButton>
            <ActionButton tone="secondary" className="justify-center" onClick={() => simulateLiveMatch()}>Sim Match</ActionButton>
            <ActionButton tone="secondary" className="justify-center" icon={<Pause className="h-4 w-4" />} onClick={() => navigate('/match/preview')}>Pause</ActionButton>
          </div>
        </div>
      </div>
    </div>
  )
}