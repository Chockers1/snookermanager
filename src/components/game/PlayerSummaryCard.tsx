import { Flag, Sparkles } from 'lucide-react'
import type { Player } from '../../types/game'
import { formatMoney } from '../../utils/formatters'
import { FormDots } from './FormDots'
import { ConfidenceMeter } from './ConfidenceMeter'

type PlayerSummaryCardProps = {
  player: Player
}

export function PlayerSummaryCard({ player }: PlayerSummaryCardProps) {
  const currentRanking = player.worldRanking ?? player.amateurRanking

  return (
    <div className="grid gap-4 xl:grid-cols-[1.5fr_220px]">
      <div className="rounded-xl border border-scm-borderStrong bg-scm-panelSoft p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-scm-textMuted">Active Career</p>
            <h2 className="mt-2 text-3xl font-semibold text-scm-text">{player.fullName}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-scm-textSoft">
              <span className="inline-flex items-center gap-2 rounded-full bg-scm-deep/80 px-3 py-1">
                <Flag className="h-4 w-4 text-scm-gold" />
                {player.nationality}
              </span>
              <span className="rounded-full bg-scm-deep/80 px-3 py-1">{player.careerStage}</span>
              <span className="rounded-full bg-scm-deep/80 px-3 py-1">{player.playingStyle}</span>
            </div>
          </div>
          <div className="rounded-xl border border-scm-border bg-scm-deep/80 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-scm-textMuted">Funds</p>
            <p className="mt-2 text-2xl font-semibold text-scm-text">{formatMoney(player.cash)}</p>
            <p className={`mt-1 text-sm ${player.cashFlow >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{player.cashFlow >= 0 ? '+' : ''}{formatMoney(player.cashFlow)} weekly</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg bg-scm-deep/70 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">{player.rankingLabel}</p>
            <p className="mt-2 text-xl font-semibold">{currentRanking != null ? `#${currentRanking}` : 'Unranked'}</p>
          </div>
          <div className="rounded-lg bg-scm-deep/70 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Morale</p>
            <p className="mt-2 text-xl font-semibold">{player.morale}%</p>
          </div>
          <div className="rounded-lg bg-scm-deep/70 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Recent Form</p>
            <div className="mt-3">
              <FormDots values={player.form} />
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-lg border border-scm-border bg-scm-deep/60 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-scm-textMuted">Next Event</p>
            <p className="mt-1 font-semibold text-scm-text">{player.nextEvent}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-scm-green/15 px-3 py-1 text-sm text-emerald-200">
            <Sparkles className="h-4 w-4" />
            {player.daysUntilEvent} days to play
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center rounded-xl border border-scm-borderStrong bg-scm-panelSoft p-4">
        <ConfidenceMeter value={player.confidence} />
      </div>
    </div>
  )
}