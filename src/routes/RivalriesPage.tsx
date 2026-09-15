import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Flame, Search, Swords, Trophy, Users } from 'lucide-react';
import { PlayerLink } from '../components/game/PlayerLink';
import { SectionTabs } from '../components/ui/SectionTabs';
import { useGame } from '../context/useGame';
import { rivalryExplanation, rivalryMeetings, rivalryRecords, rivalryStage } from '../game/careerDepth/rivalryView';
import { formatAttribute, formatPercent } from '../utils/formatters';

const tabs = ['Overview', 'Meetings', 'How rivalries work'] as const;
const initials = (name: string) => name.split(' ').map(part => part[0]).slice(0, 2).join('');

export function RivalriesPage() {
  const { gameState } = useGame();
  const [filter, setFilter] = useState('All opponents');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>();
  const [tab, setTab] = useState<typeof tabs[number]>('Overview');
  const records = rivalryRecords(gameState);
  const established = records.filter(r => r.rivalry).length;
  const visible = records.filter(r => (filter === 'All opponents' || r.rivalry) && r.name.toLowerCase().includes(search.trim().toLowerCase()));
  const selected = visible.find(r => r.opponentId === selectedId) ?? visible[0];
  const player = selected && gameState.worldPlayers.find(p => p.id === selected.opponentId);
  const meetings = selected ? rivalryMeetings(gameState, selected) : [];
  const total = selected ? selected.wins + selected.losses + (selected.draws ?? 0) : 0;
  const latest = meetings[0];
  return <div className="rivalries-page" data-testid="rivalries-page">
    <header className="rivals-page-heading"><div><span className="rivals-eyebrow">Competition & connection</span><h1>Rivalries</h1><p>Your opponents, shared history and matches that matter.</p></div><div className="rivals-heading-actions"><span><Flame/><b>{established}</b> established</span><span><Users/><b>{records.length}</b> opponents</span><Link className="btn-secondary text-xs" to="/career/stats">Legacy Stats <ArrowUpRight size={14}/></Link></div></header>
    <div className="rivals-layout">
      <section className="rivals-browser" aria-label="Opponents">
        <div className="rivals-browser-tools"><label className="rivals-search"><Search size={15}/><input aria-label="Search opponents" placeholder="Find an opponent" value={search} onChange={e => setSearch(e.target.value)}/></label><div><select aria-label="Rivalry filter" value={filter} onChange={e => setFilter(e.target.value)}><option>All opponents</option><option>Established rivalries</option></select><span>{visible.length} shown</span></div></div>
        <div className="rivals-opponent-list" tabIndex={0} aria-label="Recorded opponents">
          {visible.map(r => <div key={r.opponentId} className={'rivals-opponent' + (r.opponentId === selected?.opponentId ? ' is-selected' : '')}><div className="rivals-avatar">{initials(r.name)}</div><div className="rivals-opponent-name"><h2><PlayerLink name={r.name} id={r.opponentId}/></h2><span>{rivalryStage(r)}</span></div><button type="button" aria-label={`View ${r.name} head-to-head`} aria-pressed={r.opponentId === selected?.opponentId} onClick={() => setSelectedId(r.opponentId)}><strong>{r.wins}–{r.losses}{r.draws ? '–' + r.draws : ''}</strong><span>View H2H →</span></button></div>)}
          {!visible.length && <div className="rivals-list-empty"><Search/><p>{records.length ? 'No opponents match this filter.' : 'Your first opponent is still to come.'}</p>{records.length > 0 && <button className="btn-secondary text-xs" onClick={() => { setSearch(''); setFilter('All opponents'); }}>Clear filters</button>}</div>}
        </div>
      </section>
      {selected ? <article className="rivals-detail" aria-label={selected.name + ' head-to-head'}>
        <header className="rivals-hero"><div className="rivals-hero-identity"><div className="rivals-avatar">{initials(selected.name)}</div><div><span className="rivals-eyebrow">{rivalryStage(selected)}</span><h2><PlayerLink name={selected.name} id={selected.opponentId}/></h2><p>{player ? `${player.nation} · Age ${player.age}` : 'Recorded opponent'}{player?.retired ? ' · Retired' : ''}{gameState.careerDepth?.partnerId === selected.opponentId ? ' · Practice partner' : ''}</p></div></div><div className="rivals-hero-score"><span>H2H {selected.wins}–{selected.losses}{selected.draws ? '–' + selected.draws : ''}</span><small>Your wins · losses{selected.draws ? ' · draws' : ''}</small></div></header>
        <SectionTabs id="rivals-detail" label="Rivalry details" tabs={tabs} active={tab} onChange={setTab}/>
        <div className="rivals-tab-body" id="rivals-detail-panel" role="tabpanel" aria-labelledby={`rivals-detail-tab-${tabs.indexOf(tab)}`} tabIndex={0}>
          {tab === 'Overview' && <div className="rivals-overview">
            <section className="rivals-record"><div className="rivals-section-title"><h3>The head-to-head</h3><span>{total} recorded meetings</span></div><div className="rivals-score-cards"><div><span>Your wins</span><strong>{selected.wins}</strong></div><div><span>Opponent wins</span><strong>{selected.losses}</strong></div><div><span>Draws</span><strong>{selected.draws ?? 0}</strong></div></div><div className="rivals-result-bar" aria-label={`${selected.wins} wins, ${selected.losses} losses, ${selected.draws ?? 0} draws`}><span style={{width: `${total ? selected.wins / total * 100 : 0}%`}}/><span style={{width: `${total ? selected.losses / total * 100 : 0}%`}}/><span style={{width: `${total ? (selected.draws ?? 0) / total * 100 : 0}%`}}/></div><p>{total ? `${formatPercent(selected.wins / total * 100)} of recorded meetings won` : 'No completed meetings recorded'}</p></section>
            <section className="rivals-intensity"><div className="rivals-section-title"><h3><Flame size={16}/>Rivalry intensity</h3><strong>{selected.intensity === undefined ? 'Unrecorded' : `${formatAttribute(selected.intensity)}/100`}</strong></div><div className="rivals-intensity-track"><span style={{width: `${Math.max(0, Math.min(100, selected.intensity ?? 0))}%`}}/></div><p>{selected.intensity === undefined ? 'This older record has no saved intensity. Your head-to-head totals are retained.' : 'The weight of your shared history, not a skill bonus or an unlock percentage.'}</p><div className="rivals-moments"><div><b>{selected.deciders}</b><span>Deciders</span></div><div><b>{selected.closeMatches ?? '—'}</b><span>Close matches</span></div><div><b>{selected.finals ?? '—'}</b><span>Finals together</span></div></div></section>
            <section className="rivals-recent"><div className="rivals-section-title"><h3>Recent decisive results</h3><span>Newest first · draws excluded</span></div><div className="rivals-form">{selected.recent.length ? [...selected.recent].reverse().map((result, index) => <span key={index} data-result={result} title={result === 'W' ? 'Win' : 'Loss'}>{result}</span>) : <p>No decisive results retained.</p>}</div></section>
            <section className="rivals-latest"><div className="rivals-section-title"><h3>Latest recorded meeting</h3><button onClick={() => setTab('Meetings')}>All meetings →</button></div>{latest ? <><strong>{latest.result} {latest.score}</strong><p>{latest.event} · {latest.round}</p><span>{latest.date || 'Date not recorded'}</span></> : <p>Head-to-head totals survive, but individual match details are not available.</p>}</section>
          </div>}
          {tab === 'Meetings' && <section className="rivals-meetings"><div className="rivals-section-title"><h3>Recent meetings</h3><span>{meetings.length} available · newest first</span></div><div className="rivals-meeting-list">{meetings.map(m => <div className="rivals-meeting" key={m.id}><div className="rivals-meeting-result" data-result={m.result}><strong>{m.score}</strong><span>{m.result}</span></div><div><h4>{m.event}</h4><p>{m.round}</p></div><time>{m.date || 'Date not recorded'}</time></div>)}</div>{!meetings.length && <p>No individual meeting details are available for this opponent.</p>}<p className="rivals-history-note">Up to eight surviving meeting records. Older saves may retain head-to-head totals without full match details or intensity. All scores are from your perspective.</p></section>}
          {tab === 'How rivalries work' && <section className="rivals-explainer"><Swords/><h3>History makes a rivalry</h3><p>{rivalryExplanation}</p><div><h4>Familiar tactics</h4><p>Established rivals can learn your repeated tactics. Review your meetings and use the Match Centre to adjust your approach.</p></div><div><h4>Responding to a defeat</h4><p>Beating a rival after losing your previous meeting can give a small confidence boost.</p></div><div><h4>Keep the whole career in view</h4><p>Open a player’s name for their profile, career results and titles. This page focuses on your encounters together.</p></div></section>}
        </div>
      </article> : <div className="rivals-empty"><Swords/><span className="rivals-eyebrow">Your story with the competition</span><h2>{records.length ? 'No matching opponents' : 'Every rivalry starts with a match'}</h2><p>{records.length ? 'Change the filter or search to explore your shared history.' : 'Completed singles matches build your head-to-head records. Repeated close matches, deciders and finals can turn an opponent into a rival.'}</p>{!records.length && <Link className="btn-primary text-xs" to="/tournaments/hub">Go to Tournament Hub</Link>}<div><Trophy size={18}/><p>{rivalryExplanation}</p></div></div>}
    </div>
  </div>;
}
