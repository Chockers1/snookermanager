import { CareerDisclosure } from '../components/career/CareerDepthPanels';
import { PlayerLink } from '../components/game/PlayerLink';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../context/useGame';
import { rivalryExplanation, rivalryMeetings, rivalryRecords, rivalryStage } from '../game/careerDepth/rivalryView';

export function RivalriesPage() {
  const { gameState } = useGame();
  const [filter, setFilter] = useState('All opponents');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>();
  const records = rivalryRecords(gameState);
  const established = records.filter(r => r.rivalry).length;
  const visible = records.filter(r => (filter === 'All opponents' || r.rivalry) && r.name.toLowerCase().includes(search.toLowerCase()));
  const selected = visible.find(r => r.opponentId === selectedId) ?? visible[0];
  return <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-hidden" data-testid="rivalries-page">
    <header className="flex shrink-0 flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold text-white">Rivalries</h1><p className="mt-1 text-sm text-gray-400">Your opponents, shared history and matches that matter.</p></div><Link className="btn-secondary" to="/career/stats">Legacy Stats</Link></header>
    <CareerDisclosure title="How rivalries work" summary={`${established} established rivalries · ${records.length} recorded opponents · How it works`}><div className="space-y-3 overflow-y-auto p-4 text-sm text-gray-300"><p>{rivalryExplanation}</p><p>Established rivals can learn your repeated tactics. Beating a rival after losing your previous meeting can give a small confidence boost.</p>{established === 0 && <p>No established rivalry yet. Your head-to-head history is building below.</p>}</div></CareerDisclosure>
    <div className="flex shrink-0 flex-wrap gap-3"><label className="text-sm text-gray-400">Show<select aria-label="Rivalry filter" className="ml-2 rounded border border-border bg-background p-2 text-white" value={filter} onChange={e=>setFilter(e.target.value)}><option>All opponents</option><option>Established rivalries</option></select></label><input aria-label="Search opponents" placeholder="Search opponents" className="min-w-0 max-w-full rounded border border-border bg-background p-2 text-sm text-white" value={search} onChange={e=>setSearch(e.target.value)} /></div>
    <div className="grid min-h-0 flex-1 grid-rows-[minmax(7rem,0.4fr)_minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,2fr)] lg:grid-rows-1">
      <section aria-label="Opponents" tabIndex={0} className="card min-h-0 min-w-0 space-y-2 overflow-y-auto overscroll-contain p-2">
        <p className="p-2 text-xs text-gray-400">{visible.length} opponents · select a head-to-head</p>
        {visible.map(r => <div key={r.opponentId} className={'rounded-lg border p-3 ' + (r.opponentId === selected?.opponentId ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-border')}>
          <h2 className="break-words text-sm font-semibold text-white"><PlayerLink name={r.name} id={r.opponentId}/></h2>
          <p className="mt-1 text-xs text-gray-300">{r.wins}–{r.losses}{r.draws ? '–'+r.draws : ''} · {rivalryStage(r)}</p>
          <button type="button" aria-label={`View ${r.name} head-to-head`} aria-pressed={r.opponentId === selected?.opponentId} className="mt-2 min-h-8 w-full rounded bg-background/40 px-2 py-1 text-left text-xs text-emerald-300 focus-visible:outline" onClick={() => setSelectedId(r.opponentId)}>View head-to-head →</button>
        </div>)}
        {!visible.length && <p className="p-3 text-sm text-gray-400">{records.length ? 'No opponents match this filter.' : 'Complete matches to start recording your opponent history.'}</p>}
      </section>
      {visible.filter(r => r.opponentId === selected?.opponentId).map(r => {
      const player = gameState.worldPlayers.find(p=>p.id===r.opponentId);
      const meetings = rivalryMeetings(gameState,r);
      return <article key={r.opponentId} aria-label={r.name + ' head-to-head'} tabIndex={0} className="card min-h-0 min-w-0 space-y-3 overflow-y-auto overscroll-contain p-4">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-lg font-semibold text-white break-words"><PlayerLink name={r.name} id={r.opponentId}/></h2><p className="text-xs text-gray-400">{player ? player.nation + ' · Age ' + player.age : 'Recorded opponent'}{player?.retired ? ' · Retired' : ''}{gameState.careerDepth?.partnerId===r.opponentId ? ' · Practice partner' : ''}</p></div><span className={r.rivalry ? 'text-sm text-amber-300' : 'text-sm text-gray-400'}>{rivalryStage(r)}</span></div>
        <div className="flex flex-wrap justify-between gap-2"><p className="font-semibold text-white">H2H {r.wins}–{r.losses}{r.draws ? '–'+r.draws : ''}</p><span className="text-sm text-gray-400">Intensity {r.intensity === undefined ? 'Not recorded' : r.intensity + '/100'}</span></div>
        <p className="text-xs text-gray-400">Wins–losses{r.draws ? '–draws' : ''}, from your perspective · {r.deciders} deciders · {r.closeMatches ?? '—'} close matches · {r.finals ?? '—'} finals</p>
        <p className="text-sm text-gray-300">Recent decisive results: {r.recent.length ? r.recent.join(' · ') : 'None recorded'}</p>
        <details open className="border-t border-border pt-3"><summary className="cursor-pointer text-sm text-green-400">Recent meetings · {meetings.length} available</summary><div className="mt-3 space-y-3">{meetings.map(m=><div key={m.id} className="text-sm"><p className="text-white">{m.result} {m.score} · {m.round}</p><p className="text-xs text-gray-400">{m.date || 'Date not recorded'} · {m.event}</p></div>)}<p className="text-xs text-gray-500">Up to eight surviving meeting records. Older saves may retain head-to-head totals without full match details or intensity.</p></div></details>
      </article>;
    })}
    {!visible.length && <p className="card min-h-0 overflow-y-auto p-4 text-sm text-gray-400">Select an opponent after completing a match, or change your search and filter.</p>}
    </div>
  </div>;
}
