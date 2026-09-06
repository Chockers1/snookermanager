import type { SeasonStartReport as Report } from '../../game/seasonStartReport';
import { reportMoney } from '../../game/eventFinancialReport';
const dateLabel = (date: string) => new Date(date + 'T12:00:00Z').toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric', timeZone:'UTC' });
export function SeasonStartReport({ report, live }: { report: Report; live: boolean }) {
  const next = report.events.find(e => e.id === report.nextEventId);
  const days = next ? Math.max(0, Math.round((Date.parse(next.date+'T12:00:00Z') - Date.parse(report.asOf+'T12:00:00Z')) / 86400000)) : 0;
  const last = report.lastSeason;
  const draws = last ? Math.max(0, last.matches-last.wins-last.losses) : 0;
  const stats = [
    {label:report.rankingLabel, value:report.ranking === null ? 'Unranked' : '#'+report.ranking},
    {label:'Available funds', value:reportMoney(report.cash)},
    {label:'Sponsorship', value:reportMoney(report.sponsorIncome)+'/mo · '+report.sponsorCount+' deals'},
    {label:'Career stage', value:report.careerStage},
    {label:'Confidence', value:Math.round(report.confidence)+'%'},
    {label:'Freshness', value:Math.round(report.freshness)+'%'},
  ];
  return <section aria-label="New season briefing" className="mt-2 space-y-2 text-[11px] leading-4">
    <p className="text-[10px] text-gray-400">{live ? 'Current season briefing' : 'Saved season briefing'} · As of {dateLabel(report.asOf)}</p>
    <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]"><div className="space-y-2"><div className="grid grid-cols-2 gap-1.5">{stats.map(stat => <div key={stat.label} className="min-w-0 rounded border border-border bg-background/30 px-2 py-1"><p className="text-[10px] text-gray-400">{stat.label}</p><p className="break-words font-semibold text-white">{stat.value}</p></div>)}</div>
    <div className="rounded border border-border px-2 py-1.5"><p className="font-semibold text-green-300">{report.tourStatus}</p><p className="text-[10px] text-gray-400">{report.previousSeason}: {last ? last.wins+'W · '+last.losses+'L'+(draws ? ' · '+draws+'D' : '')+' · '+last.titles+' titles · '+reportMoney(last.prize)+' prize money' : 'No season summary recorded.'}</p></div>
    <div className="rounded border border-green-500/25 bg-green-500/5 px-2 py-1.5"><h3 className="font-semibold text-white">{next ? 'Next event · '+next.name : 'No eligible event scheduled'}</h3>{next ? <p className="text-[10px] text-gray-300">{next.location} · {dateLabel(next.date)} · {days ? 'in '+days+' days' : next.date === report.asOf ? 'Starts today' : 'Under way'} · {next.status}<br/>{['Entered','Booked'].includes(next.status) ? 'Entry secured. Review travel and preparation in the Tournament Hub.' : 'Entry closes '+dateLabel(next.deadline)+'. Open the calendar to enter and arrange preparation.'}</p> : <p className="text-gray-400">Check qualification requirements in the calendar or use the time for training and recovery.</p>}</div>
    </div><div className="min-w-0 space-y-2"><div className="overflow-hidden rounded border border-border"><h3 className="border-b border-border px-2 py-1.5 font-semibold text-white">Key tournaments · your {report.previousSeason} results</h3>
      {report.events.length ? <><div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)] gap-2 border-b border-border px-2 py-1 text-[10px] text-gray-500"><span>Event / date</span><span>This season</span><span>Last season</span></div><ul className="divide-y divide-border/60">{report.events.map(event => <li key={event.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)] gap-2 px-2 py-1.5">
        <div className="min-w-0"><p className="break-words font-medium text-white">{event.name}{event.priority && <span className="text-[9px] text-green-300"> · Priority</span>}</p><p className="text-[10px] text-gray-400">{dateLabel(event.date)}</p></div>
        <div className="min-w-0"><p className={event.status === 'Not eligible' ? 'text-amber-300' : 'text-green-300'}>{event.status}</p><p className="break-words text-[10px] leading-3.5 text-gray-400">{event.reason ?? (['Entered','Booked'].includes(event.status) ? 'Entry secured' : 'Closes '+dateLabel(event.deadline))}</p></div>
        <div className="min-w-0"><p className="break-words text-gray-200">{event.previousFinish}</p>{event.previousPrize !== undefined && <p className="text-[10px] text-gray-400">{reportMoney(event.previousPrize)} prize</p>}</div>
      </li>)}</ul></> : <p className="px-2 py-2 text-gray-400">No upcoming eligible events or priority tournaments.</p>}
    </div>
    <p className="text-[10px] leading-3.5 text-gray-500">Eligibility can change before selection cutoffs. “No recorded appearance” means no matching result survives in your save.</p>
    </div></div>
  </section>;
}
