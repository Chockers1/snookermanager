import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Route, Trophy } from 'lucide-react'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useGame } from '../context/GameStateContext'
import { buildTournamentDrawData } from '../utils/liveRouteData'

function difficultyClass(difficulty: 'Moderate' | 'Challenging' | 'Very Tough') {
  if (difficulty === 'Very Tough') return 'text-red-400'
  if (difficulty === 'Challenging') return 'text-amber-400'
  return 'text-green-400'
}

function difficultyValue(difficulty: 'Moderate' | 'Challenging' | 'Very Tough') {
  if (difficulty === 'Very Tough') return 84
  if (difficulty === 'Challenging') return 62
  return 44
}

function progressClass(status: 'completed' | 'current' | 'upcoming') {
  if (status === 'completed') return 'border-green-600/30 bg-green-600/10 text-green-400'
  if (status === 'current') return 'border-amber-600/30 bg-amber-600/10 text-amber-400'
  return 'border-border bg-surface-light text-gray-500'
}

export function TournamentDrawPage() {
  const navigate = useNavigate()
  const { gameState } = useGame()
  const [compactView, setCompactView] = useState(false)
  const drawData = buildTournamentDrawData(gameState)

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase text-gray-500">Tournaments</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Tournament Draw</h1>
          <p className="mt-1 text-sm text-gray-400">Projected route, bracket position, and opponent difficulty.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className={compactView ? 'btn-secondary text-xs' : 'btn-primary text-xs'} onClick={() => setCompactView(false)}>Full Draw</button>
          <button type="button" className={compactView ? 'btn-primary text-xs' : 'btn-secondary text-xs'} onClick={() => setCompactView(true)}>Compact</button>
          <button type="button" className="btn-secondary text-xs" onClick={() => typeof window !== 'undefined' && window.print()}><Download className="h-3.5 w-3.5" /> Print</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 space-y-4">
          <div className="card">
            <div className="card-header"><h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Trophy className="h-3.5 w-3.5 text-green-400" /> Bracket</h3><span className="text-[10px] text-gray-400">{drawData.currentPosition.currentRound}</span></div>
            <div className="card-body overflow-x-auto">
              <div className="flex min-w-[980px] gap-3">
                {drawData.bracket.map((round) => (
                  <div key={round.label} className="min-w-[190px] flex-1">
                    <p className="mb-2 text-[10px] font-semibold uppercase text-gray-500">{round.label}</p>
                    <div className="space-y-3">
                      {round.matches.slice(0, compactView ? 2 : round.matches.length).map((match) => (
                        <div key={match.id} className={`rounded-lg border p-2 ${match.placeholder ? 'border-dashed border-border bg-surface-light/40 text-gray-500' : 'border-border bg-surface-light/50'}`}>
                          {[match.top, match.bottom].map((player) => (
                            <div key={`${match.id}-${player.name}`} className={`flex items-center justify-between rounded px-2 py-1.5 text-xs ${'highlighted' in player && player.highlighted ? 'bg-green-600/15 text-green-400' : 'text-white'}`}>
                              <span className="truncate">{player.rank ? `[${player.rank}] ` : ''}{player.name}</span>
                              <span className="ml-2 shrink-0">{player.score ?? '-'}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="text-sm font-semibold text-white">Route Progress</h3></div>
            <div className="card-body grid grid-cols-6 gap-2">
              {drawData.progress.map((step) => <div key={step.label} className={`rounded-lg border px-3 py-3 text-center text-[10px] font-semibold uppercase ${progressClass(step.status)}`}>{step.label}</div>)}
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-4">
          <div className="card card-body">
            <h3 className="mb-3 text-xs font-semibold text-white">Path & Opponent Outlook</h3>
            <div className="space-y-2">
              {drawData.opponentOutlook.map((opponent) => (
                <div key={opponent.id} className="rounded-lg bg-surface-light/50 p-3 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="truncate font-semibold text-white">{opponent.name}</p><p className="text-gray-400">Rank {opponent.rank} - {opponent.nation}</p></div>
                    <span className={`shrink-0 ${difficultyClass(opponent.difficulty)}`}>{opponent.difficulty}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-gray-500"><span>H2H</span><span>{opponent.headToHead}</span></div>
                  <div className="mt-2"><ProgressBar value={difficultyValue(opponent.difficulty)} tone={opponent.difficulty === 'Very Tough' ? 'red' : opponent.difficulty === 'Challenging' ? 'amber' : 'green'} compact /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-body">
            <h3 className="mb-3 text-xs font-semibold text-white">Current Position</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Current Round</span><span className="text-white">{drawData.currentPosition.currentRound}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Best Result</span><span className="text-white">{drawData.currentPosition.bestResult}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Projected Route</span><span className="text-white">{drawData.currentPosition.projectedRoute}</span></div>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs"><span className="text-gray-400">Bracket Difficulty</span><span className="text-amber-400">{drawData.currentPosition.difficultyLabel}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-gradient-to-r from-green-500 via-amber-400 to-red-500"><div className="h-full bg-white/20" style={{ width: `${drawData.difficultyScore}%` }} /></div>
            </div>
          </div>

          <div className="card card-body">
            <h3 className="mb-3 text-xs font-semibold text-white">Draw Insights</h3>
            <div className="space-y-2">
              {drawData.insights.map((item) => <div key={item.label} className="flex justify-between rounded bg-surface-light/50 px-3 py-2 text-xs"><span className="text-gray-400">{item.label}</span><span className="text-white">{item.value}</span></div>)}
            </div>
          </div>

          <button type="button" className="btn-primary w-full justify-center text-xs" onClick={() => navigate('/match/preview')}><Route className="h-3.5 w-3.5" /> Scout Next Opponent</button>
          <button type="button" className="btn-secondary w-full justify-center text-xs" onClick={() => navigate('/rankings')}>View Rankings</button>
        </div>
      </div>
    </div>
  )
}