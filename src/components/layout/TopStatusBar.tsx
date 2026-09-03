import { Bell, CalendarClock, Mail, Settings, TrendingDown, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Player } from '../../types/game'
import { useGame } from '../../context/useGame'
import { getNextEligibleTournament } from '../../hooks/useGameState'
import { formatMoney } from '../../utils/formatters'

type TopStatusBarProps = {
  player: Player
}

export function TopStatusBar({ player }: TopStatusBarProps) {
  const { gameState } = useGame()
  const navigate = useNavigate()
  const playerRankingRow = gameState.rankings.find((row) => row.playerName === player.fullName)
  const currentRanking = playerRankingRow?.ranking
    ?? player.worldRanking
    ?? player.amateurRanking
  const rankingMovement = playerRankingRow?.movement ?? 0
  const nextEvent = getNextEligibleTournament(gameState)
  const inboxCount = gameState.inbox.length
  const notificationCount = Math.max(player.notificationCount, inboxCount)

  return (
    <header className="scrollbar-thin flex h-14 shrink-0 items-center overflow-x-auto border-b border-border bg-sidebar pl-14 pr-3 lg:px-4">
      <div className="flex min-w-0 shrink-0 items-center gap-2 border-r border-border pr-4">
        <button
          type="button"
          onClick={() => navigate('/career/progression')}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold text-white transition hover:bg-surface-light"
        >
          {player.firstName[0]}
        </button>
        <button
          type="button"
          onClick={() => navigate('/career/progression')}
          className="min-w-0 text-left"
        >
          <div className="flex items-center gap-1.5">
            <span className="max-w-[120px] truncate text-xs font-semibold text-white">{player.fullName}</span>
            <span className="shrink-0 text-[10px] text-gray-500">{player.nationality}</span>
          </div>
          <p className="max-w-[140px] truncate text-[10px] text-gray-500">{player.careerStage}</p>
        </button>
      </div>

      <button type="button" onClick={() => navigate('/rankings')} className="flex shrink-0 items-center gap-1.5 border-r border-border px-4 transition hover:bg-white/5">
        <span className="whitespace-nowrap text-[9px] uppercase text-gray-500">{player.rankingLabel}</span>
        <span className="text-base font-bold text-white">{currentRanking ?? '-'}</span>
        {rankingMovement > 0 ? (
          <span className="flex items-center text-[10px] text-green-400"><TrendingUp className="h-2.5 w-2.5" /><span className="ml-0.5">{rankingMovement}</span></span>
        ) : rankingMovement < 0 ? (
          <span className="flex items-center text-[10px] text-red-400"><TrendingDown className="h-2.5 w-2.5" /><span className="ml-0.5">{Math.abs(rankingMovement)}</span></span>
        ) : null}
      </button>

      <div className="flex shrink-0 items-center gap-1.5 border-r border-border px-4">
        <span className="whitespace-nowrap text-[9px] uppercase text-gray-500">Form</span>
        <div className="flex items-center gap-0.5">
          {player.form.slice(0, 10).map((result, index) => (
            <span
              key={`${result}-${index}`}
              className={`h-2 w-2 rounded-full ${result === 'W' ? 'bg-green-500' : result === 'L' ? 'bg-red-500' : 'bg-amber-500'}`}
            />
          ))}
        </div>
      </div>

      <button type="button" onClick={() => navigate('/mental')} className="flex shrink-0 items-center gap-1.5 border-r border-border px-4 transition hover:bg-white/5">
        <span className="whitespace-nowrap text-[9px] uppercase text-gray-500">Confidence</span>
        <span className="text-xs font-bold text-white">{player.confidence}%</span>
        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-700">
          <div className="h-full rounded-full bg-green-500" style={{ width: `${player.confidence}%` }} />
        </div>
      </button>

      <button type="button" onClick={() => navigate('/finance')} className="flex shrink-0 items-center gap-1.5 border-r border-border px-4 transition hover:bg-white/5">
        <span className="whitespace-nowrap text-[9px] uppercase text-gray-500">Funds</span>
        <span className="whitespace-nowrap text-xs font-bold text-white">{formatMoney(player.cash)}</span>
        <span className={`whitespace-nowrap text-[10px] ${player.cashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {player.cashFlow >= 0 ? '+' : ''}{formatMoney(player.cashFlow)}
        </span>
      </button>

      <button type="button" onClick={() => navigate('/tournaments/hub')} className="flex min-w-0 shrink items-center gap-1.5 px-4 text-left transition hover:bg-white/5">
        <CalendarClock className="h-3.5 w-3.5 shrink-0 text-green-400" />
        <span className="shrink-0 whitespace-nowrap text-[9px] uppercase text-gray-500">Next</span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-white">{nextEvent?.name ?? player.nextEvent}</p>
          <p className="truncate text-[9px] text-gray-500">{nextEvent?.format ?? 'No event scheduled'}</p>
        </div>
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-2 pl-3">
        <button type="button" aria-label={`Open inbox (${inboxCount} messages)`} title="Inbox" onClick={() => navigate('/inbox')} className="relative p-1.5 text-gray-400 transition-colors hover:text-white">
          <Mail aria-hidden="true" className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-green-600 px-1 text-[8px] font-bold text-white">{inboxCount}</span>
        </button>
        <button type="button" aria-label={`Open notifications (${notificationCount})`} title="Notifications" onClick={() => navigate('/inbox')} className="relative p-1.5 text-gray-400 transition-colors hover:text-white">
          <Bell aria-hidden="true" className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-bold text-white">{notificationCount}</span>
        </button>
        <button type="button" aria-label="Career setup" title="Career setup" onClick={() => navigate('/new-career')} className="p-1.5 text-gray-400 transition-colors hover:text-white">
          <Settings aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
