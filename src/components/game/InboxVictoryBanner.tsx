import { Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { InboxMessage } from '../../types/game';

export function InboxVictoryBanner({ victory }: { victory: NonNullable<InboxMessage['victoryReport']> }) {
  return <section aria-label="Champion announcement" className="rounded-xl border border-amber-300/40 bg-gradient-to-br from-amber-500/15 via-surface to-background p-3">
    <div className="flex items-center gap-3">
      <div aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-amber-300/30 bg-amber-300/10"><Trophy className="h-7 w-7 text-amber-200" strokeWidth={1.4}/></div>
      <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-300">{victory.season} · {victory.exhibition ? 'Exhibition victory' : victory.ranking ? 'Ranking champion' : 'Tournament champion'}</p>
        <h3 className="mt-0.5 break-words text-lg font-black leading-tight text-white">{victory.player} wins the {victory.name}</h3>
        <p className="mt-1 text-xs text-amber-100">{victory.score} against {victory.opponent}</p>
      </div>
    </div>
    <p className="mt-2 text-xs font-medium text-amber-100">{victory.highlight}</p>
    <p className="mt-1 text-[10px] text-gray-300">{[victory.frameHighlight, victory.breakHighlight].filter(Boolean).join(' · ')}</p>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-amber-300/20 pt-2 text-[10px]">
      <span className="font-semibold text-amber-200">{victory.milestone}{victory.trophyRecorded ? ' · Trophy cabinet updated' : ''}</span>
      <Link className="font-semibold text-amber-200 underline underline-offset-2" to={victory.exhibition ? '/career/stats#exhibition-achievements' : '/career/stats#trophy-cabinet'}>{victory.exhibition ? 'View achievement' : 'View trophy cabinet'}</Link>
    </div>
  </section>;
}
