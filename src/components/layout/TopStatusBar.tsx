import { Bell, CalendarClock, Coins, Mail, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Player } from '../../types/game'
import { useGame } from '../../context/GameStateContext'
import { formatMoney } from '../../utils/formatters'
import { FormDots } from '../game/FormDots'

type TopStatusBarProps = {
  player: Player
}

export function TopStatusBar({ player }: TopStatusBarProps) {
  const { gameState } = useGame()
  const navigate = useNavigate()
  const currentRanking = gameState.rankings.find((row) => row.playerName === player.fullName)?.ranking
    ?? player.worldRanking
    ?? player.amateurRanking
  const nextEvent = gameState.tournaments.find((event) => event.status === 'Entered')
    ?? gameState.tournaments.find((event) => event.status === 'Available' || event.status === 'High Cost')
    ?? gameState.tournaments[0]
  const inboxCount = gameState.inbox.length
  const notificationCount = Math.max(player.notificationCount, inboxCount)

  return (
    <header className="flex h-[78px] items-center justify-between border-b border-scm-border bg-scm-panel/90 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => navigate('/career/progression')}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-scm-borderStrong bg-scm-deep text-lg font-semibold text-scm-gold transition hover:border-scm-green/50 hover:text-emerald-200"
        >
          {player.firstName[0]}
        </button>
        <button
          type="button"
          onClick={() => navigate('/career/progression')}
          className="text-left transition hover:text-scm-text"
        >
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold text-scm-text">{player.fullName}</span>
            <span className="text-sm text-scm-textMuted">{player.nationality}</span>
            <span className="rounded-full bg-scm-deep px-2 py-1 text-xs text-scm-textSoft">{player.careerStage}</span>
          </div>
          <div className="mt-1 flex items-center gap-4 text-xs text-scm-textMuted">
            <span>{player.rankingLabel}: {currentRanking != null ? `#${currentRanking}` : 'Unranked'}</span>
            <span>Confidence {player.confidence}%</span>
            <FormDots values={player.form} />
          </div>
        </button>
      </div>
      <div className="flex items-center gap-6 text-sm text-scm-textSoft">
        <button
          type="button"
          onClick={() => navigate('/finance')}
          className="flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-scm-deep/60"
        >
          <Coins className="h-4 w-4 text-scm-green" />
          <div>
            <div className="text-scm-text">{formatMoney(player.cash)}</div>
            <div className={`text-xs ${player.cashFlow >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{player.cashFlow >= 0 ? '+' : ''}{formatMoney(player.cashFlow)} flow</div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => navigate('/tournaments/hub')}
          className="flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-scm-deep/60"
        >
          <CalendarClock className="h-4 w-4 text-scm-gold" />
          <div>
            <div className="text-scm-text">{nextEvent?.name ?? player.nextEvent}</div>
            <div className="text-xs text-scm-textMuted">{nextEvent ? `${player.daysUntilEvent} days` : 'No event scheduled'}</div>
          </div>
        </button>
        <button type="button" onClick={() => navigate('/inbox')} className="relative rounded-lg bg-scm-deep p-2 text-scm-textSoft transition hover:bg-scm-panelHover">
          <Mail className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-scm-green px-1 text-[10px] font-semibold text-scm-deep">
            {inboxCount}
          </span>
        </button>
        <button type="button" onClick={() => navigate('/inbox')} className="relative rounded-lg bg-scm-deep p-2 text-scm-textSoft transition hover:bg-scm-panelHover">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-scm-amber px-1 text-[10px] font-semibold text-scm-deep">
            {notificationCount}
          </span>
        </button>
        <button type="button" onClick={() => navigate('/new-career')} className="rounded-lg bg-scm-deep p-2 text-scm-textSoft transition hover:bg-scm-panelHover">
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}