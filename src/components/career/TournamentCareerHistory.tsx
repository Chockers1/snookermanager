import { TournamentRewards } from '../game/TournamentRewards';
import { PlayerLink } from '../game/PlayerLink';
import { Fragment, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGame } from '../../context/useGame';
import { bestTournamentEdition, sameCareerTournament, tournamentCareerEditions, tournamentEditionSummary, tournamentHistoryOptions, tournamentRoundHistory } from '../../game/tournamentCareerHistory';
import { formatMoney } from '../../utils/formatters';

export function TournamentCareerHistory() {
  const { gameState } = useGame();
  const [params,setParams] = useSearchParams();
  const [tour,setTour] = useState('All tours');
  const [expanded,setExpanded] = useState<string | null>(null);
  const options = tournamentHistoryOptions(gameState);
  const tours = [...new Set(options.map(t=>t.eventType))].sort();
  const filtered = options.filter(t=>tour==='All tours' || t.eventType===tour);
  const requested = params.get('tournament') ?? gameState.history.tournamentHistory[0]?.tournamentId;
  const oldIdentity = gameState.history.tournamentHistory.find(e=>e.tournamentId===requested);
  const selected = filtered.find(t=>t.id===requested || oldIdentity && sameCareerTournament(oldIdentity,t)) ?? filtered[0];
  const entries = selected ? tournamentCareerEditions(gameState,selected) : [];
  const summaries = entries.map(e=>tournamentEditionSummary(gameState,e));
  const played = summaries.filter(e=>e.played);
  const best = bestTournamentEdition(summaries);
  return <section className="card min-w-0 overflow-hidden" aria-label="Tournament career history" id="tournament-history">
    <div className="card-header flex-wrap gap-3"><div><h2 className="text-sm font-semibold text-white">Tournament Career History</h2><p className="mt-1 text-xs text-gray-400">Select an event to follow every recorded season and match.</p></div></div>
    <div className="card-body space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(140px,1fr)_minmax(0,3fr)]">
        <label className="text-xs text-gray-400">Tour<select aria-label="History tour" value={tour} onChange={e=>{setTour(e.target.value);setExpanded(null)}} className="mt-1 w-full min-w-0 rounded border border-border bg-surface p-2 text-white"><option>All tours</option>{tours.map(t=><option key={t}>{t}</option>)}</select></label>
        <label className="text-xs text-gray-400">Tournament<select aria-label="History tournament" value={selected?.id ?? ''} onChange={e=>{setParams({tournament:e.target.value},{replace:true});setExpanded(null)}} className="mt-1 w-full min-w-0 rounded border border-border bg-surface p-2 text-white">{filtered.map(t=><option key={t.id} value={t.id}>{t.name} · {t.eventType}</option>)}</select></label>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {[['Recorded appearances',played.length],['Best finish',best ? best.finish+' · '+best.season : 'No completed run'],['Match record',played.reduce((n,e)=>n+e.wins,0)+'W · '+played.reduce((n,e)=>n+e.draws,0)+'D · '+played.reduce((n,e)=>n+e.losses,0)+'L'],['Recorded prize money',formatMoney(played.reduce((n,e)=>n+(e.prize??0),0))]].map(([label,value])=><div key={label} className="min-w-0 rounded bg-surface-light/50 p-3"><p className="text-[10px] text-gray-400">{label}</p><p className="mt-1 break-words text-sm font-semibold text-white">{value}</p></div>)}
      </div>
      {entries.length ? <div className="overflow-x-auto"><table className="w-full text-xs" data-testid="tournament-career-table"><thead><tr className="border-b border-border text-left text-gray-500">{['Season / date','Finish','W–D–L','Prize','High break','100+ breaks','Run'].map(label=><th key={label} className="whitespace-nowrap px-3 py-2">{label}</th>)}</tr></thead><tbody>
        {entries.map((entry,index)=>{const summary=summaries[index],rounds=tournamentRoundHistory(gameState,entry);return <Fragment key={entry.id}><tr className="border-b border-border/50 text-gray-300"><td className="whitespace-nowrap px-3 py-3"><strong className="text-white">{entry.season}</strong><span className="mt-1 block text-[10px] text-gray-500">{entry.startDate}</span></td><td className="min-w-[130px] px-3 py-3 text-white">{entry.result || entry.status}</td><td className="whitespace-nowrap px-3 py-3">{summary.played ? summary.wins+'–'+summary.draws+'–'+summary.losses : '—'}</td><td className="whitespace-nowrap px-3 py-3 text-green-400">{summary.prize===null?'—':formatMoney(summary.prize)}</td><td className="px-3 py-3">{summary.highestBreak || '—'}</td><td className="px-3 py-3">{summary.played ? summary.centuries ?? '—' : '—'}</td><td className="px-3 py-3"><button type="button" className="btn-secondary whitespace-nowrap text-xs" aria-label={'View '+entry.season+' run'} aria-expanded={expanded===entry.id} onClick={()=>setExpanded(expanded===entry.id?null:entry.id)}>{expanded===entry.id?'Close':'View run'}</button></td></tr>
          {expanded===entry.id && <tr><td colSpan={7} className="bg-background/30 px-4 py-3"><TournamentRewards event={{id:entry.tournamentId,name:entry.tournamentName,startDate:entry.startDate,type:entry.eventType==='Professional'?'Professional Tour':entry.eventType,endDate:entry.endDate}}/>{rounds.length ? <ol className="space-y-2" aria-label={entry.season+' match progression'}>{rounds.map((round,i)=><li key={i} className="flex flex-wrap gap-x-4 gap-y-1 text-xs"><span className="font-medium text-gray-300">{i+1}. {round.round}</span><span className="text-white"><PlayerLink name={round.opponent}/></span><span className={round.result==='Won'?'text-green-400':round.result==='Lost'?'text-red-400':'text-gray-400'}>{round.result} {round.score}</span></li>)}</ol>:<p className="text-xs text-gray-400">{summary.played?'Individual match details were not retained in this older save.':'No matches recorded for this entry.'}</p>}</td></tr>}
        </Fragment>})}
      </tbody></table></div>:<p className="rounded bg-background/30 p-5 text-center text-sm text-gray-400">No recorded appearance at {selected?.name ?? 'this tournament'} yet.</p>}
      <p className="text-[10px] leading-relaxed text-gray-500">Skipped and unplayed entries are shown separately from appearances. Results recovered from tour draws may lack break statistics or prize details (—). Older saves may have missing events or match details; missing records are not treated as defeats. Group-stage draws count in the match record.</p>
    </div>
  </section>;
}
