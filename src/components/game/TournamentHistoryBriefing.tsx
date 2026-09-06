import { Link } from 'react-router-dom';
import type { TournamentBriefing } from '../../game/tournamentCareerHistory';
import { formatMoney } from '../../utils/formatters';
export function TournamentHistoryBriefing({ briefings }: { briefings: TournamentBriefing[] }) {
  return <div className="mt-3 space-y-2" aria-label="Previous tournament results">{briefings.map(b=><section key={b.tournament.id+':'+b.startDate} className="rounded-lg border border-border bg-background/30 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-semibold text-white">Your history · {b.tournament.name}</h3><Link className="text-xs text-green-400 hover:underline" to={'/career/stats?tournament='+encodeURIComponent(b.tournament.id)+'#tournament-history'}>Full tournament history →</Link></div>
    <p className="mt-1 text-[10px] text-gray-500">Before the {b.season} edition · {b.appearances} recorded prior appearance{b.appearances===1?'':'s'}</p>
    <div className="mt-2 grid gap-3 sm:grid-cols-2"><div><p className="text-[10px] text-gray-500">Last season · {b.previousSeason}</p><p className="mt-1 text-xs font-medium text-white">{b.previous?.finish ?? 'No recorded appearance'}</p>{b.previous?.played && <><p className="mt-1 text-[11px] text-gray-400">{b.previous.wins}W · {b.previous.draws}D · {b.previous.losses}L · {b.previous.prize===null?'Prize not recorded':formatMoney(b.previous.prize)}</p>{b.previous.lastOpponent && <p className="mt-1 text-[11px] text-gray-400">Last match: {b.previous.lastScore} vs {b.previous.lastOpponent}</p>}</>}</div>
    <div><p className="text-[10px] text-gray-500">Best previous run</p><p className="mt-1 text-xs text-white">{b.best ? b.best.finish+' · '+b.best.season : 'No completed run recorded'}</p>{!b.previous?.played && b.lastAppearance && <p className="mt-1 text-[11px] text-gray-400">Last played: {b.lastAppearance.season} · {b.lastAppearance.finish}</p>}</div></div>
  </section>)}</div>;
}
