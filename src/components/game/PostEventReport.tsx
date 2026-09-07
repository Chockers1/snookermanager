import { InboxVictoryBanner } from './InboxVictoryBanner';
import { postEventRanking, type PostEventRankingSnapshot } from '../../game/postEventRanking';
import { Link } from 'react-router-dom';
import type { QualificationReport } from '../../game/qualificationReport';
import { useGame } from '../../context/useGame';
import { TournamentRewards } from './TournamentRewards';
import type { EventFinancialReport } from '../../game/eventFinancialReport';
import { reportMoney } from '../../game/eventFinancialReport';
import type { InboxMessage } from '../../types/game';
export function PostEventReport({finance,summary,qualification,rankingSnapshot,victory}:{finance:EventFinancialReport;summary:NonNullable<InboxMessage['summary']>;qualification?:QualificationReport;rankingSnapshot?:PostEventRankingSnapshot;victory?:InboxMessage['victoryReport']}) {
  const { gameState } = useGame();
  const ranking = postEventRanking(gameState, finance, rankingSnapshot);
  const main = qualification?.mainEvent;
  const currentMain = main && gameState.tournaments.find(t => t.id === main.id && t.startDate === main.startDate && !['Completed', 'Skipped'].includes(t.status));
  const finish=summary.find(s=>s.label==='Tournament finish'),rank=summary.find(s=>s.label.includes('Ranking'));
  const rows=[
    {label:'Entry fee',value:reportMoney(finance.entry)},
    {label:finance.combinedTravel?'Travel & hotel package':'Travel, transfers & fees',value:reportMoney(finance.transport)},
    {label:'Hotel accommodation',value:finance.combinedTravel?'Included above':reportMoney(finance.hotel),detail:finance.combinedTravel?'Night count not recorded in this older booking.':finance.nights===undefined?'No hotel charge recorded.':`${finance.nights} night${finance.nights===1?'':'s'} × ${reportMoney(finance.nightlyRate??0)}${finance.extraNights ? ' · includes '+finance.extraNights+' extra night'+(finance.extraNights===1?'':'s'):''}`},
    {label:'Preparation support',value:reportMoney(finance.preparation)},
    {label:'Venue practice',value:reportMoney(finance.venuePractice)},
  ];
  return <section aria-label="Post-event report" className="mt-2 space-y-1.5 text-xs">
    {victory && <InboxVictoryBanner victory={victory}/>}
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-lg border border-border bg-background/30 p-2"><div className="min-w-0"><p className="font-semibold text-white">{qualification ? `Qualified for ${qualification.mainEventName}` : finish?.value??'Event complete'}</p><p className="mt-1 break-words text-[11px] text-gray-400">{finish?.detail}</p></div>{(ranking||rank)&&<div className="max-w-48 text-right"><p className="text-[10px] text-gray-400">{ranking?.rankLabel ?? rank?.label}</p><p className="font-semibold text-white">{ranking?.change ?? ranking?.value ?? rank?.value} <span className="text-[10px] font-normal text-gray-400">{ranking?.detail ?? rank?.detail}</span></p></div>}</div>
    {ranking && <div aria-label="Event ranking update" className={`rounded border px-2.5 py-1.5 ${ranking.pending ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-background/30'}`}>
      <p className="font-semibold text-white">{ranking.creditLabel} · {ranking.pending ? 'Publishes' : 'Published'} {ranking.snapshot.publication}</p>
      <p className="mt-0.5 text-[10px] text-gray-400">{ranking.pending ? 'Your award has not reached the rankings yet. This report updates when the ranking list is published.' : ranking.change ? 'Movement compares the previous published list with this publication, including other players’ results and expiring earnings.' : 'The exact historical ranking snapshots are unavailable; no movement has been assumed.'}</p>
    </div>}
    {qualification && <div aria-label="Qualification secured" className="rounded border border-green-500/40 bg-green-500/10 px-2.5 py-2 text-gray-200">
      <p>{qualification.explanation}</p>
      {main && <p className="mt-1 text-[11px] text-gray-300">Main event: {main.startDate} · {main.location}</p>}
      <p className="mt-1 text-[11px] text-gray-300">Qualification earns a place, not a tournament trophy. Prize money follows your main-event finish.</p>
      {currentMain && <Link className="mt-1 inline-block font-semibold text-green-300 underline" to={`/calendar?tournament=${encodeURIComponent(currentMain.id)}`}>View {qualification.mainEventName} entry &amp; travel</Link>}
    </div>}
    <div className="grid grid-cols-3 gap-2">{summary.filter(s=>['Pot success','Safety success','Highest break'].includes(s.label)).map(s=><div key={s.label} className="rounded border border-border px-2 py-1"><p className="text-[10px] text-gray-400">{s.label}</p><p className="font-semibold text-green-300">{s.value}</p></div>)}</div>
    <div className="overflow-hidden rounded-lg border border-border bg-background/30"><div className="flex flex-wrap justify-between gap-1 border-b border-border px-2.5 py-1.5"><h3 className="font-semibold text-white">Event finances</h3><span className="text-[10px] text-gray-500">Costs charged through event completion</span></div>
      <dl className="grid divide-y divide-border/60 sm:grid-cols-2">
        <div className="flex items-start justify-between gap-3 sm:col-span-2 bg-green-500/5 px-2.5 py-1.5"><dt className="text-gray-300">Event income<span className="block text-[10px] text-gray-400">Prize {reportMoney(finance.prize)} · Sponsor bonuses {reportMoney(finance.sponsor)}</span></dt><dd className="shrink-0 font-semibold tabular-nums text-green-300">{reportMoney(finance.income)}</dd></div>
        {rows.map(row=><div key={row.label} className={"flex items-start justify-between gap-3 px-2.5 py-1 " + (row.detail ? "sm:col-span-2" : "")}><dt className="min-w-0 text-gray-300">{row.label}{row.detail&&<span className="block text-[10px] text-gray-400">{row.detail}</span>}</dt><dd className="shrink-0 tabular-nums text-gray-200">{row.value}</dd></div>)}
        <div className="flex justify-between gap-3 px-2.5 py-1.5 sm:col-span-2"><dt className="font-semibold text-gray-200">Total event costs</dt><dd className="font-semibold tabular-nums text-red-300">{reportMoney(finance.costs)}</dd></div>
        <div className={'flex justify-between gap-3 px-2.5 py-2 font-semibold sm:col-span-2 '+(finance.net>=0?'bg-green-500/10 text-green-300':'bg-red-500/10 text-red-300')}><dt>Net event finances</dt><dd className="tabular-nums">{finance.net>=0?'+':'−'}{reportMoney(Math.abs(finance.net))}</dd></div>
      </dl>
    </div>
    <details><summary className="flex cursor-pointer flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10px]"><span className="text-green-400">▸ Ranking credit & trophy status</span><span className="break-words text-gray-400">{finance.location} · Event complete</span></summary><TournamentRewards event={{id:finance.tournamentId,startDate:finance.startDate,name:finance.name}}/></details>
  </section>;
}
