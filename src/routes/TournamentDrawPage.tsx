import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Route } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ActionButton } from '../components/ui/ActionButton'
import { ProgressBar } from '../components/ui/ProgressBar'
import { SectionCard } from '../components/ui/SectionCard'
import { useGame } from '../context/GameStateContext'
import { buildTournamentDrawData } from '../utils/liveRouteData'

function getDifficultyColor(difficulty: 'Moderate' | 'Challenging' | 'Very Tough') {
  if (difficulty === 'Very Tough') return 'text-rose-300'
  if (difficulty === 'Challenging') return 'text-amber-300'
  return 'text-emerald-300'
}

function getDifficultyValue(difficulty: 'Moderate' | 'Challenging' | 'Very Tough') {
  if (difficulty === 'Very Tough') return 84
  if (difficulty === 'Challenging') return 62
  return 44
}

function getProgressClasses(status: 'completed' | 'current' | 'upcoming') {
  if (status === 'completed') return 'border-emerald-500/45 bg-emerald-500/10 text-emerald-200'
  if (status === 'current') return 'border-scm-gold/45 bg-scm-gold/10 text-scm-gold'
  return 'border-scm-border bg-scm-panelSoft text-scm-textMuted'
}

export function TournamentDrawPage() {
  const navigate = useNavigate()
  const { gameState } = useGame()
  const [compactView, setCompactView] = useState(false)
  const drawData = buildTournamentDrawData(gameState)
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tournaments"
        title="Tournament Draw"
        description="Study the bracket, projected route, and opponent difficulty before deciding how aggressively to push the next match block."
        actions={<div className="flex items-center gap-3"><ActionButton onClick={() => setCompactView(false)}>Full Draw</ActionButton><ActionButton tone="secondary" onClick={() => setCompactView(true)}>Compact</ActionButton><ActionButton tone="secondary" icon={<Download className="h-4 w-4" />} onClick={() => typeof window !== 'undefined' && window.print()}>Print / Export</ActionButton></div>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.65fr_340px]">
        <div className="space-y-6">
          <SectionCard title="Bracket" subtitle="Ryan path styling is adapted here for Elliot's current event route.">
            <div className="overflow-x-auto">
              <div className="flex min-w-[1200px] gap-4">
                {drawData.bracket.map((round) => (
                  <div key={round.label} className="min-w-[190px] flex-1">
                    <p className="mb-3 text-xs uppercase tracking-[0.16em] text-scm-textMuted">{round.label}</p>
                    <div className="space-y-4">
                      {round.matches.slice(0, compactView ? 2 : round.matches.length).map((match) => (
                        <div key={match.id} className={`rounded-2xl border p-3 ${match.placeholder ? 'border-dashed border-scm-border bg-scm-panelSoft/70 text-scm-textMuted' : 'border-scm-border bg-scm-panelSoft'}`}>
                          {[match.top, match.bottom].map((player) => (
                            <div key={`${match.id}-${player.name}`} className={`flex items-center justify-between rounded-xl px-3 py-2 ${'highlighted' in player && player.highlighted ? 'bg-emerald-500/10 text-emerald-200' : 'text-scm-text'}`}>
                              <span>{player.rank ? `[${player.rank}] ` : ''}{player.name}</span>
                              <span>{player.score ?? '-'}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Route Progress">
            <div className="grid gap-3 md:grid-cols-6">
              {drawData.progress.map((step) => (
                <div key={step.label} className={`rounded-xl border px-3 py-3 text-center text-xs uppercase tracking-[0.16em] ${getProgressClasses(step.status)}`}>{step.label}</div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Path & Opponent Outlook">
            <div className="space-y-3">
              {drawData.opponentOutlook.map((opponent) => (
                <div key={opponent.id} className="rounded-xl border border-scm-border bg-scm-panelSoft p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-scm-text">{opponent.name}</p>
                      <p className="text-scm-textMuted">Rank {opponent.rank} · {opponent.nation}</p>
                    </div>
                    <span className={getDifficultyColor(opponent.difficulty)}>{opponent.difficulty}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-scm-textMuted"><span>H2H</span><span>{opponent.headToHead}</span></div>
                  <div className="mt-3"><ProgressBar value={getDifficultyValue(opponent.difficulty)} tone={opponent.difficulty === 'Very Tough' ? 'red' : opponent.difficulty === 'Challenging' ? 'amber' : 'green'} /></div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Current Position">
            <div className="rounded-2xl border border-scm-border bg-scm-panelSoft p-4 text-sm text-scm-textSoft">
              <div className="flex items-center justify-between"><span>Current Round</span><span className="text-scm-text">{drawData.currentPosition.currentRound}</span></div>
              <div className="mt-3 flex items-center justify-between"><span>Best Result</span><span className="text-scm-text">{drawData.currentPosition.bestResult}</span></div>
              <div className="mt-3 flex items-center justify-between"><span>Projected Route</span><span className="text-scm-text">{drawData.currentPosition.projectedRoute}</span></div>
            </div>
            <div className="mt-4 rounded-2xl border border-scm-border bg-scm-panelSoft p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Bracket Difficulty</p>
              <div className="mt-4 h-3 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500" />
              <p className="mt-3 text-sm text-scm-textSoft">Overall difficulty: <span className="text-amber-300">{drawData.currentPosition.difficultyLabel}</span></p>
            </div>
          </SectionCard>

          <SectionCard title="Draw Insights">
            <div className="space-y-3 text-sm text-scm-textSoft">
              {drawData.insights.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-scm-border bg-scm-panelSoft px-4 py-3">
                  <span>{item.label}</span>
                  <span className="text-scm-text">{item.value}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <ActionButton tone="secondary" className="w-full justify-center" icon={<Route className="h-4 w-4" />} onClick={() => navigate('/rankings')}>View Detailed Stats</ActionButton>
        </div>
      </div>
    </div>
  )
}