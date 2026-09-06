import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../context/useGame';
import { rivalryExplanation, rivalryMeetings, rivalryRecords, rivalryStage } from '../game/careerDepth/rivalryView';

export function RivalriesPage() {
  const { gameState } = useGame();
  const [filter, setFilter] = useState('All opponents');
  const [search, setSearch] = useState('');
  const records = rivalryRecords(gameState);
  const established = records.filter(r => r.rivalry).length;
  const visible = records.filter(r => (filter === 'All opponents' || r.rivalry) && r.name.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-4 pb-6">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold text-white">Rivalries</h1><p className="mt-1 text-sm text-gray-400">Your opponents, shared history and matches that matter.</p></div><Link className="btn-secondary" to="/career/stats">Legacy Stats</Link></header>
    <section className="card p-4 space-y-2"><h2 className="font-semibold text-white">{established} established rivalries · {records.length} recorded opponents</h2><p className="text-sm text-gray-400">{rivalryExplanation}</p><p className="text-sm text-gray-400">Established rivals can learn your repeated tactics. Beating a rival after losing your previous meeting can give a small confidence boost.</p>{established === 0 && <p className="text-sm text-amber-300">No established rivalry yet. Your head-to-head history is building below.</p>}</section>
    <div className="flex flex-wrap gap-3"><label className="text-sm text-gray-400">Show<select aria-label="Rivalry filter" className="ml-2 rounded border border-border bg-background p-2 text-white" value={filter} onChange={e=>setFilter(e.target.value)}><option>All opponents</option><option>Established rivalries</option></select></label><input aria-label="Search opponents" placeholder="Search opponents" className="min-w-0 max-w-full rounded border border-border bg-background p-2 text-sm text-white" value={search} onChange={e=>setSearch(e.target.value)} /></div>
    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{visible.map(r => {
      const player = gameState.worldPlayers.find(p=>p.id===r.opponentId);
      const meetings = rivalryMeetings(gameState,r);
      return <article key={r.opponentId} aria-label={r.name + ' head-to-head'} className="card min-w-0 p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-lg font-semibold text-white break-words">{r.name}</h2><p className="text-xs text-gray-400">{player ? player.nation + ' · Age ' + player.age : 'Recorded opponent'}{player?.retired ? ' · Retired' : ''}{gameState.careerDepth?.partnerId===r.opponentId ? ' · Practice partner' : ''}</p></div><span className={r.rivalry ? 'text-sm text-amber-300' : 'text-sm text-gray-400'}>{rivalryStage(r)}</span></div>
        <div className="flex flex-wrap justify-between gap-2"><p className="font-semibold text-white">H2H {r.wins}–{r.losses}{r.draws ? '–'+r.draws : ''}</p><span className="text-sm text-gray-400">Intensity {r.intensity === undefined ? 'Not recorded' : r.intensity + '/100'}</span></div>
        <p className="text-xs text-gray-400">Wins–losses{r.draws ? '–draws' : ''}, from your perspective · {r.deciders} deciders · {r.closeMatches ?? '—'} close matches · {r.finals ?? '—'} finals</p>
        <p className="text-sm text-gray-300">Recent decisive results: {r.recent.length ? r.recent.join(' · ') : 'None recorded'}</p>
        <details className="border-t border-border pt-3"><summary className="cursor-pointer text-sm text-green-400">Recent meetings · {meetings.length} available</summary><div className="mt-3 space-y-3">{meetings.map(m=><div key={m.id} className="text-sm"><p className="text-white">{m.result} {m.score} · {m.round}</p><p className="text-xs text-gray-400">{m.date || 'Date not recorded'} · {m.event}</p></div>)}<p className="text-xs text-gray-500">Up to eight surviving meeting records. Older saves may retain head-to-head totals without full match details or intensity.</p></div></details>
      </article>;
    })}</div>
    {!visible.length && <p className="card p-6 text-sm text-gray-400">{records.length ? 'No opponents match this filter.' : 'Complete matches to start recording your opponent history.'}</p>}
  </div>;
}
