import type { SeasonEndReport as Report } from '../../game/seasonEndReport';
import { reportMoney } from '../../game/eventFinancialReport';

export function SeasonEndReport({ report }: { report: Report }) {
  const r = report.record;
  const draws = Math.max(0, r.matchesPlayed - r.wins - r.losses);
  const sameTable = r.openingRankingLabel === r.closingRankingLabel;
  const movement = r.openingRanking - r.closingRanking;
  const rankingDetail = sameTable ? (movement === 0 ? 'No movement' : (movement > 0 ? 'Up ' : 'Down ') + Math.abs(movement) + ' places') : 'Ranking circuit changed';
  const stats = [
    { label: 'Match record', value: r.wins + 'W · ' + r.losses + 'L' + (draws ? ' · ' + draws + 'D' : ''), detail: r.matchesPlayed + ' matches · ' + (r.matchesPlayed ? Math.round(r.wins / r.matchesPlayed * 100) + '% won' : 'No matches played') },
    { label: r.closingRankingLabel, value: '#' + r.closingRanking, detail: rankingDetail + ' · opening #' + r.openingRanking },
    { label: 'Titles', value: String(r.titles), detail: r.majorTitles + ' major titles · ' + r.tourCardsWon + ' tour cards earned' },
    { label: 'Season prize money', value: reportMoney(r.prizeMoney), detail: 'Tournament winnings, before expenses' },
    { label: 'Break building', value: 'High break ' + r.highestBreak, detail: r.centuries + ' centuries (100+)' },
    { label: 'Best result', value: r.bestResult || 'No completed events', detail: '' },
  ];
  return <section aria-label="End of season report" className="mt-2 space-y-2 text-[11px] leading-4">
    <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-3">{stats.map(stat => <div key={stat.label} className="min-w-0 rounded border border-border bg-background/30 px-2 py-1.5">
      <p className="text-[10px] text-gray-400">{stat.label}</p><p className="break-words font-semibold text-white">{stat.value}</p><p className="text-[10px] leading-3.5 text-gray-400">{stat.detail}</p>
    </div>)}</div>
    {report.closingCash !== undefined && <div className="flex flex-wrap justify-between gap-x-3 rounded border border-border px-2 py-1 text-gray-300"><span>Closing bank balance <strong className="text-white">{reportMoney(report.closingCash)}</strong></span>{report.cashMovement && <span className="text-[10px]">Cash change {report.cashMovement.from}–{report.cashMovement.to}: {report.cashMovement.change >= 0 ? '+' : '−'}{reportMoney(Math.abs(report.cashMovement.change))}</span>}</div>}
    {report.decision ? <div className="rounded border border-green-500/25 bg-green-500/5 px-2 py-1.5"><h3 className="font-semibold text-green-300">{report.decision.title}</h3><p className="text-gray-300">{report.decision.detail}</p><p className="mt-1 text-gray-300"><span className="font-semibold text-white">Next season: </span>{report.decision.expectation}</p></div> : <p className="text-gray-400">The tour-card decision was not retained in this older report.</p>}
    <div className="grid gap-2 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="min-w-0 rounded border border-border px-2 py-1.5"><h3 className="mb-1 font-semibold text-white">Major tournament winners</h3>{report.majorWinners?.length ? <ul className="space-y-1">{report.majorWinners.map((w,i) => <li key={w.tournamentName + i} className="flex flex-wrap justify-between gap-x-3"><span className="text-gray-400">{w.tournamentName}</span><span className={w.playerWon ? 'font-semibold text-green-300' : 'text-gray-200'}>{w.winner}</span></li>)}</ul> : <p className="text-gray-400">Major winners were not recorded in this older report.</p>}</div>
      <div className="min-w-0 rounded border border-border px-2 py-1.5"><h3 className="mb-1 font-semibold text-white">Closing world rankings</h3>{report.finalRankings?.length ? <ol className="space-y-1">{report.finalRankings.map(row => <li key={row.ranking} className="flex flex-wrap justify-between gap-x-2"><span className="text-gray-200">#{row.ranking} {row.playerName}</span><span className="text-[10px] text-gray-400">{row.points.toLocaleString('en-GB')} pts</span></li>)}</ol> : <p className="text-gray-400">{report.worldNumberOne ? '#1 ' + report.worldNumberOne : 'Closing standings were not retained.'}</p>}<p className="mt-2 text-[10px] text-gray-400">Season totals use surviving event records. Cash change, when available, covers the dates shown.</p></div>
    </div>
  </section>;
}
