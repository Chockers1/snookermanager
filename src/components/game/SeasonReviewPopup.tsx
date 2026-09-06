import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/useGame';
import type { GameState } from '../../hooks/useGameState';
import { formatMoney } from '../../utils/formatters';

type Review = NonNullable<GameState['seasonReview']>;
export function SeasonRankings({ review, playerName }: { review: Review; playerName: string }) {
  const rows = review.finalRankings?.filter(row => row.ranking <= 10 || row.playerName === playerName) ?? [];
  return <section aria-label="Final world rankings" className="min-w-0 rounded-lg border border-border p-3">
    <h3 className="text-sm font-semibold text-white">Final World Rankings</h3>
    <p className="mb-2 text-[10px] text-gray-400">Closing top ten and your position</p>
    {rows.length ? <ol className="space-y-1 text-xs">{rows.map(row => <li key={row.playerName} className={'flex gap-2 rounded px-2 py-1 ' + (row.playerName === playerName ? 'bg-green-500/10 text-green-400' : 'text-gray-300')}><span className="w-6 shrink-0">#{row.ranking}</span><span className="min-w-0 flex-1 break-words">{row.playerName}</span></li>)}</ol> : <p className="text-xs text-gray-400">Closing standings were not saved for this older review.</p>}
  </section>;
}

export function SeasonReviewPopup() {
  const { gameState, startNextSeason, dismissSeasonReview } = useGame();
  const navigate = useNavigate();
  const review = gameState.seasonReview;
  if (!review?.pending || review.popupDismissed) return null;
  return <ReviewDialog review={review} playerName={gameState.player.fullName} onClose={dismissSeasonReview}
    onDetails={() => { dismissSeasonReview(); navigate('/season-review'); }}
    onStart={() => { startNextSeason(); navigate('/'); }} />;
}
function ReviewDialog({ review, playerName, onClose, onDetails, onStart }: {
  review: Review; playerName: string; onClose: () => void; onDetails: () => void; onStart: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  const record = review.completedSeason;
  return createPortal(<dialog ref={ref} aria-labelledby="season-review-title" onCancel={onClose} onClose={onClose}
    className="m-auto w-[min(58rem,calc(100vw-1.5rem))] max-w-none rounded-xl border border-green-500/30 bg-surface p-0 text-white shadow-2xl backdrop:bg-black/75">
    <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border p-3 sm:p-4">
        <div><p className="text-[10px] uppercase tracking-widest text-green-400">Season complete</p><h2 id="season-review-title" className="text-lg font-bold">{record.season} Season Review</h2></div>
        <button type="button" className="btn-secondary text-xs" onClick={onClose}>Close review</button>
      </header>
      <div className="min-h-0 space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[['Record', record.wins + '–' + record.losses], ['Final rank', '#' + record.closingRanking], ['Titles', record.titles], ['Prize money', formatMoney(record.prizeMoney)]].map(([label, value]) => <div key={label} className="rounded-lg bg-background/50 p-2"><p className="text-[10px] text-gray-400">{label}</p><p className="text-base font-bold">{value}</p></div>)}</div>
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3"><h3 className="text-sm font-semibold text-amber-300">{review.careerDecision.title}</h3><p className="mt-1 text-xs text-gray-300">{review.careerDecision.detail}</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SeasonRankings review={review} playerName={playerName} />
          <section className="min-w-0 rounded-lg border border-border p-3"><h3 className="mb-2 text-sm font-semibold">Major Tournament Winners</h3><ul className="space-y-2">{review.majorWinners.map(winner => <li key={winner.tournamentName} className="rounded bg-background/40 p-2"><p className="text-[10px] text-gray-400">{winner.tournamentName}</p><p className={'break-words text-xs font-semibold ' + (winner.playerWon ? 'text-green-400' : 'text-white')}>{winner.winner}</p></li>)}</ul>{!review.majorWinners.length && <p className="text-xs text-gray-400">No major results recorded.</p>}</section>
        </div>
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border p-3">
        <p className="mr-auto text-xs text-gray-400">Next: {review.nextSeason}</p>
        <button type="button" className="btn-secondary text-xs" onClick={onDetails}>Full Season Review</button>
        <button type="button" className="btn-primary text-xs" onClick={onStart}>Start New Season</button>
      </footer>
    </div>
  </dialog>, document.body);
}
