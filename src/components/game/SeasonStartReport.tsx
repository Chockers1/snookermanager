import type { SeasonStartReport as Report } from '../../game/seasonStartReport';
import { reportMoney } from '../../game/eventFinancialReport';
import { formatPercent } from '../../utils/formatters';
import { InboxReportSummary } from './InboxReportSummary';

const dateLabel = (date: string) => new Date(date + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export function SeasonStartReport({ report, live }: { report: Report; live: boolean }) {
  const next = report.events.find(event => event.id === report.nextEventId);
  const days = next ? Math.max(0, Math.round((Date.parse(next.date + 'T12:00:00Z') - Date.parse(report.asOf + 'T12:00:00Z')) / 86400000)) : 0;
  const last = report.lastSeason;
  const draws = last ? Math.max(0, last.matches - last.wins - last.losses) : 0;
  const stats = [
    { label: report.rankingLabel, value: report.ranking === null ? 'Unranked' : '#' + report.ranking },
    { label: 'Available funds', value: reportMoney(report.cash) },
    { label: 'Sponsorship', value: reportMoney(report.sponsorIncome) + '/mo', detail: report.sponsorCount + ' active deals' },
    { label: 'Career stage', value: report.careerStage, detail: report.tourStatus },
    { label: 'Confidence', value: formatPercent(report.confidence) },
    { label: 'Freshness', value: formatPercent(report.freshness) },
    { label: report.previousSeason + ' season record', value: last ? last.titles + ' titles' : 'Not recorded',
      detail: last ? last.wins + 'W · ' + last.losses + 'L' + (draws ? ' · ' + draws + 'D' : '') + ' · ' + reportMoney(last.prize) + ' prize money' : 'No season summary recorded.' },
  ];
  return <section aria-label="New season briefing" className="mt-3 min-w-0 max-w-3xl space-y-3">
    <p className="text-[11px] leading-4 text-gray-400">{live ? 'Current season briefing' : 'Saved season briefing'} · As of {dateLabel(report.asOf)}</p>
    <InboxReportSummary items={stats} />
    <section className="rounded-lg border border-border bg-background/30 px-4 py-3">
      <h3 className="text-xs font-semibold text-gray-300">{next ? 'Next event · ' + next.name : 'No eligible event scheduled'}</h3>
      {next ? <><p className="mt-1 text-[11px] leading-4 text-gray-300">{next.location} · {dateLabel(next.date)} · {days ? 'in ' + days + ' days' : next.date === report.asOf ? 'Starts today' : 'Under way'} · {next.status}</p>
        <p className="mt-1 text-[10px] leading-4 text-gray-500">{['Entered', 'Booked'].includes(next.status) ? 'Entry secured. Review travel and preparation in the Tournament Hub.' : 'Entry closes ' + dateLabel(next.deadline) + '. Open the calendar to enter and arrange preparation.'}</p></>
        : <p className="mt-1 text-[11px] text-gray-400">Check qualification requirements in the calendar or use the time for training and recovery.</p>}
    </section>
    <section className="overflow-hidden rounded-lg border border-border bg-background/30">
      <h3 className="border-b border-border px-4 py-2 text-xs font-semibold text-gray-300">Key tournaments · your {report.previousSeason} results</h3>
      {report.events.length ? <>
        <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)] gap-3 border-b border-border px-4 py-2 text-[10px] text-gray-500 sm:grid"><span>Event / date</span><span>This season</span><span>Last season</span></div>
        <ul className="divide-y divide-border/70">{report.events.map(event => <li key={event.id} className="grid gap-2 px-4 py-3 text-[11px] leading-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)] sm:gap-3">
          <div className="min-w-0"><p className="break-words font-medium text-white">{event.name}{event.priority && <span className="text-green-300"> · Priority</span>}</p><p className="text-[10px] text-gray-400">{dateLabel(event.date)}</p></div>
          <div className="min-w-0"><p className="text-[10px] text-gray-500 sm:hidden">This season</p><p className={event.status === 'Not eligible' ? 'text-amber-300' : 'text-green-300'}>{event.status}</p><p className="break-words text-[10px] text-gray-400">{event.reason ?? (['Entered', 'Booked'].includes(event.status) ? 'Entry secured' : 'Closes ' + dateLabel(event.deadline))}</p></div>
          <div className="min-w-0"><p className="text-[10px] text-gray-500 sm:hidden">Last season</p><p className="break-words text-gray-200">{event.previousFinish}</p>{event.previousPrize !== undefined && <p className="text-[10px] text-gray-400">{reportMoney(event.previousPrize)} prize</p>}</div>
        </li>)}</ul>
      </> : <p className="px-4 py-3 text-xs text-gray-400">No upcoming eligible events or priority tournaments.</p>}
    </section>
    <p className="text-[10px] leading-4 text-gray-500">Eligibility can change before selection cutoffs. “No recorded appearance” means no matching result survives in your save.</p>
  </section>;
}
