import { useState } from 'react';
import { Award, Trophy } from 'lucide-react';
import { legacyRate, type CareerLegacy } from '../../game/careerLegacy';
import { formatMoney } from '../../utils/formatters';

export function LegacyRecords({ stats }: { stats: CareerLegacy }) {
  const [category, setCategory] = useState('All titles');
  const [visible, setVisible] = useState(12);
  const categories = [...new Set(stats.trophies.map(t => t.category))].sort();
  const trophies = stats.trophies.filter(t => category === 'All titles' || t.category === category);
  const groups = [
    { title: 'Break building', rows: [
      ['Highest break', stats.highestBreak || '—'], ['Centuries (100+)', stats.centuries],
      ['50+ breaks (includes centuries)', stats.detailedMatches ? stats.fifties : '—'],
      ['147 maximums', stats.maximumMatches ? stats.maximums : '—'],
    ] },
    { title: 'Match performance', rows: [
      ['Pot success', legacyRate(stats.potTotal, stats.performanceFrames)],
      ['Long pot success', legacyRate(stats.longPotTotal, stats.performanceFrames)],
      ['Safety success', legacyRate(stats.safetyTotal, stats.performanceFrames)],
      ['Fouls per match', stats.detailedMatches ? (stats.fouls / stats.detailedMatches).toFixed(1) : '—'],
    ] },
    { title: 'Frames & results', rows: [
      ['Frames won / lost', stats.framesWon + ' / ' + stats.framesLost],
      ['Frame win rate', legacyRate(stats.framesWon * 100, stats.framesWon + stats.framesLost)],
      ['Matches lost / drawn', stats.losses + ' / ' + stats.draws],
      ['Deciders won / played', stats.decidersWon + ' / ' + stats.deciders],
    ] },
    { title: 'Winning runs', rows: [
      ['Decider win rate', legacyRate(stats.decidersWon * 100, stats.deciders)],
      ['Whitewash wins', stats.whitewashes],
      ['Best winning streak', stats.bestWinStreak], ['Current winning streak', stats.currentWinStreak],
    ] },
  ];
  return <>
    <section className="card" aria-labelledby="career-records-heading">
      <div className="card-header"><div><h2 id="career-records-heading" className="text-base font-semibold text-white">Career Records</h2><p className="mt-1 text-xs text-gray-400">Your numbers across every circuit and season.</p></div><Award className="h-5 w-5 shrink-0 text-green-400" /></div>
      <div className="card-body grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
        {groups.map(group => <div key={group.title}><h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-green-400">{group.title}</h3><dl className="space-y-3">{group.rows.map(([label, value]) => <div key={label} className="flex items-baseline justify-between gap-3 text-xs"><dt className="text-gray-400">{label}</dt><dd className="shrink-0 font-semibold tabular-nums text-white">{value}</dd></div>)}</dl></div>)}
      </div>
      <div className="border-t border-border px-4 py-3 text-xs leading-relaxed text-gray-400">
        <p>Potting and safety rates are frame-weighted averages of simulated match estimates ({stats.performanceMatches} matches). Whitewashes exclude single-frame events.</p>
        {stats.recoveredHistory && <p className="mt-1">Older saves use surviving records: detailed breaks and fouls cover {stats.detailedMatches} of {stats.matchesPlayed} matches; frames and streaks cover {stats.frameMatches}. Exact maximum counts cover {stats.maximumMatches} matches. Missing records are not treated as zero.</p>}
        {!stats.recoveredHistory && <p className="mt-1">Career totals and trophies are saved permanently as you complete matches.</p>}
      </div>
    </section>

    <section className="card overflow-hidden" aria-labelledby="trophy-cabinet-heading">
      <div className="card-header flex-wrap gap-3"><div><h2 id="trophy-cabinet-heading" className="flex items-center gap-2 text-base font-semibold text-white"><Trophy className="h-5 w-5 text-amber-400" /> Trophy Cabinet <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-xs text-amber-300">{stats.trophies.length}</span></h2><p className="mt-1 text-xs text-gray-400">Every recorded title, from your first local win to the biggest stage.</p></div>
        {categories.length > 0 && <select aria-label="Trophy category" value={category} onChange={e => { setCategory(e.target.value); setVisible(12); }} className="max-w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-gray-200"><option>All titles</option>{categories.map(c => <option key={c}>{c}</option>)}</select>}
      </div>
      {stats.trophies.length === 0 ? <div className="px-6 py-10 text-center"><Trophy className="mx-auto mb-3 h-10 w-10 text-amber-400/40" /><h3 className="font-semibold text-white">Your first trophy awaits</h3><p className="mt-2 text-sm text-gray-400">Win a tournament to add its trophy here. Qualifying places and tour cards are career achievements, separate from titles.</p></div>
      : <div className="card-body"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{trophies.slice(0, visible).map(t => <article key={t.id} className="flex min-w-0 flex-col rounded-xl border border-amber-400/20 bg-gradient-to-b from-amber-400/[0.08] to-surface p-5">
        <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold uppercase tracking-wide text-amber-300">{t.category}</span><span className="text-xs text-gray-400">{t.season}</span></div>
        <Trophy aria-hidden="true" className={'mx-auto my-5 h-12 w-12 ' + (t.category === 'Major' ? 'text-amber-300' : 'text-amber-500')} strokeWidth={1.4} />
        <h3 className="text-center text-sm font-semibold leading-snug text-white">{t.name}</h3><p className="mt-1 text-center text-[10px] text-gray-400">{t.circuit}</p>
        <div className="mt-auto pt-4"><p className="border-t border-amber-400/15 pt-3 text-xs text-gray-300">{t.opponent ? 'Final: ' + t.score + ' vs ' + t.opponent : 'Champion · final details unavailable'}</p><div className="mt-2 flex flex-wrap justify-between gap-2 text-[10px] text-gray-400"><time dateTime={t.date}>{t.date}</time><span className="text-amber-300">{formatMoney(t.prizeMoney)} event earnings</span></div></div>
      </article>)}</div>{trophies.length > visible && <button className="btn-secondary mt-4 text-xs" type="button" onClick={() => setVisible(v => v + 12)}>Show more trophies ({trophies.length - visible} remaining)</button>}
      {stats.recoveredHistory && <p className="mt-4 text-xs text-gray-400">The cabinet restores titles with surviving event records. Earlier titles without an archived event cannot be reconstructed.</p>}</div>}
    </section>
  </>;
}
