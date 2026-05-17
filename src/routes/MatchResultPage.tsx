import { useNavigate } from 'react-router-dom'
import { Award, ShieldCheck, SignalHigh, Zap } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { SectionCard } from '../components/ui/SectionCard'
import { useGame } from '../context/GameStateContext'
import { buildMatchResultData } from '../utils/liveRouteData'
import { formatMoney } from '../utils/formatters'

function getFeedbackTone(tone: 'green' | 'amber' | 'blue') {
  if (tone === 'green') return 'text-emerald-300'
  if (tone === 'amber') return 'text-amber-300'
  return 'text-sky-300'
}

export function MatchResultPage() {
  const { gameState } = useGame()
  const navigate = useNavigate()
  const latestMatch = gameState.matches[0]
  const { equipmentImpact, coachFeedback, matchSummary, strengthBreakdown, matchModifiers, resultExplanation, improvementAdvice, pressureDiagnosis } = buildMatchResultData(gameState)
  const latestTournament = gameState.tournaments.find((item) => item.id === latestMatch?.tournamentId)
  const activeRound =
    gameState.tournamentProgress.tournamentId === latestTournament?.id ? gameState.tournamentProgress.currentRound : null
  const playerName = latestMatch?.playerName ?? gameState.player.fullName
  const opponentName = latestMatch?.opponentName ?? 'Opponent TBD'
  const playerFrames = latestMatch?.playerFrames ?? 0
  const opponentFrames = latestMatch?.opponentFrames ?? 0
  const playerWon = (latestMatch?.result ?? 'Won') === 'Won'
  const frameRows = latestMatch?.frameHistory?.length ? latestMatch.frameHistory : []
  const statRows = latestMatch
    ? [
        { label: 'Highest Break', player: latestMatch.highestBreak, opponent: latestMatch.opponentHighestBreak },
        { label: 'Pot Success', player: `${latestMatch.potSuccess}%`, opponent: `${Math.max(48, latestMatch.potSuccess - 6)}%` },
        { label: 'Long Pot Success', player: `${latestMatch.longPotSuccess}%`, opponent: `${Math.max(42, latestMatch.longPotSuccess - 5)}%` },
        { label: 'Safety Success', player: `${latestMatch.safetySuccess}%`, opponent: `${Math.max(45, latestMatch.safetySuccess - 4)}%` },
        { label: 'Fouls', player: latestMatch.fouls, opponent: Math.max(0, latestMatch.fouls - 1) },
      ]
    : []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Match Centre"
        title="Match Result"
        description={`${latestTournament?.name ?? 'Completed match'} · ${latestMatch?.round ?? 'Round'} · Best of ${latestMatch?.bestOf ?? 7}. Review the scoreline, expected chance, engine modifiers, and the pressure diagnosis behind the result.`}
      />

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <SectionCard>
          <div className="rounded-3xl border border-emerald-500/25 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_rgba(7,18,33,0.95))] p-6">
            <div className="grid gap-6 xl:grid-cols-[1fr_180px_1fr] xl:items-center">
              <div>
                <p className="text-3xl font-semibold text-scm-text">{playerName}</p>
                <p className="mt-3 text-sm text-scm-textSoft">Confidence {gameState.player.confidence}% · {gameState.player.rankingLabel} {gameState.player.amateurRanking ?? gameState.player.worldRanking ?? '-'}</p>
              </div>
              <div className="text-center">
                <Award className="mx-auto h-10 w-10 text-scm-gold" />
                <div className="mt-4 flex items-center justify-center gap-6 text-6xl font-semibold text-scm-text">
                  <span className="text-emerald-300">{playerFrames}</span>
                  <span className="text-scm-textMuted">-</span>
                  <span>{opponentFrames}</span>
                </div>
                <p className="mt-2 text-scm-gold">{playerWon ? 'Win' : 'Loss'}</p>
              </div>
              <div className="xl:text-right">
                <p className="text-3xl font-semibold text-scm-text">{opponentName}</p>
                <p className="mt-3 text-sm text-scm-textSoft">Opponent ranking {latestMatch?.opponentRanking ?? '-'}</p>
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SectionCard className="text-center"><SignalHigh className="mx-auto h-5 w-5 text-scm-gold" /><p className="mt-3 text-xs uppercase tracking-[0.16em] text-scm-textMuted">Prize Money</p><p className="mt-2 text-3xl font-semibold text-emerald-300">{formatMoney(latestMatch?.prizeMoneyEarned ?? 0)}</p></SectionCard>
          <SectionCard className="text-center"><Award className="mx-auto h-5 w-5 text-scm-gold" /><p className="mt-3 text-xs uppercase tracking-[0.16em] text-scm-textMuted">Ranking Points</p><p className="mt-2 text-3xl font-semibold text-emerald-300">+{latestMatch?.rankingPointsGained ?? 0}</p></SectionCard>
          <SectionCard className="text-center"><ShieldCheck className="mx-auto h-5 w-5 text-scm-gold" /><p className="mt-3 text-xs uppercase tracking-[0.16em] text-scm-textMuted">Confidence Change</p><p className="mt-2 text-3xl font-semibold text-emerald-300">{latestMatch?.confidenceChange ?? 0}</p></SectionCard>
          <SectionCard className="text-center"><Zap className="mx-auto h-5 w-5 text-scm-gold" /><p className="mt-3 text-xs uppercase tracking-[0.16em] text-scm-textMuted">Fatigue Change</p><p className="mt-2 text-3xl font-semibold text-amber-300">{latestMatch?.fatigueChange ?? 0}</p></SectionCard>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1.1fr]">
        <div className="space-y-6">
          {matchSummary ? (
            <SectionCard title="Match Engine Report">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 text-sm">
                <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Tournament</p>
                  <p className="mt-2 text-scm-text">{matchSummary.tournament}</p>
                </div>
                <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Round</p>
                  <p className="mt-2 text-scm-text">{matchSummary.round}</p>
                </div>
                <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Format</p>
                  <p className="mt-2 text-scm-text">{matchSummary.format}</p>
                </div>
                <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Expected Win Chance</p>
                  <p className="mt-2 text-emerald-300">{matchSummary.expectedWinChance}%</p>
                </div>
                <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Actual Result</p>
                  <p className="mt-2 text-scm-text">{matchSummary.actualResult}</p>
                </div>
              </div>
            </SectionCard>
          ) : null}

          <SectionCard title="Strength Breakdown">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-[0.16em] text-scm-textMuted">
                  <tr>
                    <th className="px-3 py-2">Factor</th>
                    <th className="px-3 py-2">Player</th>
                    <th className="px-3 py-2">Opponent</th>
                    <th className="px-3 py-2">Edge</th>
                  </tr>
                </thead>
                <tbody>
                  {strengthBreakdown.map((row) => (
                    <tr key={row.label} className="border-t border-scm-border">
                      <td className="px-3 py-3 text-scm-text">{row.label}</td>
                      <td className="px-3 py-3 text-emerald-300">{row.player}</td>
                      <td className="px-3 py-3 text-amber-300">{row.opponent}</td>
                      <td className={`px-3 py-3 ${row.edge >= 0 ? 'text-emerald-300' : 'text-amber-300'}`}>{row.edge > 0 ? '+' : ''}{row.edge}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Match Modifiers">
            <div className="space-y-3">
              {matchModifiers.map((modifier) => (
                <div key={modifier.label} className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-scm-text">{modifier.label}</p>
                    <span className="text-sm text-scm-gold">{modifier.impact}</span>
                  </div>
                  <p className="mt-2 text-sm text-scm-textSoft">{modifier.detail}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Match Stats">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-[0.16em] text-scm-textMuted">
                  <tr>
                    <th className="px-3 py-2">{playerName.split(' ')[0]}</th>
                    <th className="px-3 py-2">Stat</th>
                    <th className="px-3 py-2">{opponentName.split(' ')[0]}</th>
                  </tr>
                </thead>
                <tbody>
                  {statRows.map((row) => (
                    <tr key={row.label} className="border-t border-scm-border">
                      <td className="px-3 py-3 text-emerald-300">{row.player}</td>
                      <td className="px-3 py-3 text-scm-text">{row.label}</td>
                      <td className="px-3 py-3 text-amber-300">{row.opponent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Equipment Impact">
            <div className="grid gap-4 md:grid-cols-3">
              {equipmentImpact.map((item) => (
                <div key={item.label} className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4 text-sm">
                  <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{item.label}</p>
                  <p className="mt-2 text-scm-text">{item.highlight}</p>
                  <p className="mt-2 text-emerald-300">Condition {item.condition}%</p>
                  <p className="mt-3 text-scm-textSoft">{item.detail}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          {resultExplanation ? (
            <SectionCard title={resultExplanation.title}>
              <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-5">
                <p className="text-scm-text">{resultExplanation.summary}</p>
                <p className="mt-3 text-sm text-scm-textSoft">{resultExplanation.detail}</p>
              </div>
            </SectionCard>
          ) : null}

          <SectionCard title="Improvement Advice">
            <div className="space-y-3">
              {improvementAdvice.length > 0 ? improvementAdvice.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-scm-border bg-scm-panelSoft px-4 py-3 text-sm text-scm-textSoft">
                  <span className="mt-1 h-2 w-2 rounded-full bg-scm-gold" />
                  <span>{item}</span>
                </div>
              )) : (
                <div className="rounded-2xl border border-scm-border bg-scm-panelSoft px-4 py-3 text-sm text-scm-textSoft">
                  No urgent correction stands out from this result. Keep reinforcing the current base.
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Pressure Diagnosis">
            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">QF+ Win Rate</p>
                <p className="mt-2 text-scm-text">{pressureDiagnosis.qfPlusRecord}</p>
              </div>
              <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Semi-final Conversion</p>
                <p className="mt-2 text-scm-text">{pressureDiagnosis.semiFinalConversion}</p>
              </div>
              <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Final Conversion</p>
                <p className="mt-2 text-scm-text">{pressureDiagnosis.finalConversion}</p>
              </div>
              <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Decider Record</p>
                <p className="mt-2 text-scm-text">{pressureDiagnosis.deciderRecord}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Pressure Trait</p>
              <p className="mt-2 text-scm-text">{pressureDiagnosis.pressureTrait}</p>
              <p className="mt-3 text-sm text-scm-textSoft">{pressureDiagnosis.diagnosis}</p>
            </div>
          </SectionCard>

          <SectionCard title="Frame By Frame">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-[0.16em] text-scm-textMuted">
                  <tr>
                    <th className="px-3 py-2">Frame</th>
                    <th className="px-3 py-2">{playerName.split(' ')[0]}</th>
                    <th className="px-3 py-2">{opponentName.split(' ')[0]}</th>
                    <th className="px-3 py-2">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {frameRows.map((row) => (
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

          <SectionCard title="Coach Feedback">
            <div className="space-y-4">
              {coachFeedback.map((group) => (
                <div key={group.title} className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
                  <p className={`text-sm font-semibold ${getFeedbackTone(group.tone)}`}>{group.title}</p>
                  <ul className="mt-3 space-y-3 text-sm text-scm-textSoft">
                    {group.items.map((item) => (
                      <li key={item} className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-scm-gold" />{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <ActionButton className="justify-center" onClick={() => navigate(activeRound ? '/match/preview' : '/tournaments/hub')}>{activeRound ? `Continue To ${activeRound}` : 'Continue Tournament'}</ActionButton>
        <ActionButton tone="secondary" className="justify-center" onClick={() => navigate('/tournaments/draw')}>View Draw</ActionButton>
        <ActionButton tone="secondary" className="justify-center" onClick={() => navigate('/training/report')}>Review Training</ActionButton>
      </div>
    </div>
  )
}