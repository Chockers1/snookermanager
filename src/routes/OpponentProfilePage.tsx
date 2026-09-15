import { PlayerNames } from '../components/game/PlayerNames';
import { readArchivedPlayer, readArchivedSeason } from '../game/careerArchive';
import type { GameState } from '../hooks/useGameState';
import { careerLegacyOf } from '../game/careerLegacy';
import { useEffect, useMemo, useState } from 'react';
import { Link,useParams } from 'react-router-dom';
import { useGame } from '../context/useGame';
import { PlayerLink } from '../components/game/PlayerLink';
import { resolveProfilePlayer,playerEventHistory,playerRankingHistory,playerSeasonHistory,profileRankingColumns,profileScouting } from '../game/playerProfile';
import { watchableMatch } from '../game/realism/scouting';
import { rivalryMeetings,rivalryStage } from '../game/careerDepth/rivalryView';
import { formatMoney, formatPercent } from '../utils/formatters';
import { ArrowUpRight, Trophy, Target, Medal, CalendarDays, History, Users, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
type ProfileTab = 'Overview' | 'Results' | 'Trophies' | 'History';
const profileTabs: ProfileTab[] = ['Overview', 'Results', 'Trophies', 'History'];
function SectionTitle({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold text-white">{title}</h2>{children}</div>;
}
function ResultBadge({ result }: { result: string }) {
  const won = result === 'Won', lost = result === 'Lost';
  return <span className={'inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold ' + (won ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' : lost ? 'border-rose-400/20 bg-rose-400/10 text-rose-200' : 'border-sky-400/20 bg-sky-400/10 text-sky-200')} title={result} aria-label={result}>{won ? 'W' : lost ? 'L' : 'D'}</span>;
}
export function OpponentProfilePage(){
 const {id=''}=useParams();
 return <PlayerProfileContent key={id}/>;
}
function PlayerProfileContent(){
 const {id=''}=useParams();const {gameState,actOnRealism}=useGame();const [limit,setLimit]=useState(15);const [tab,setTab]=useState<ProfileTab>('Overview');const [scoutRequested,setScoutRequested]=useState(false);const [selectedSeason,setSelectedSeason]=useState('recent');
 const [archiveView,setArchiveView]=useState<{source:GameState; rows:GameState['worldPlayers'][number]['seasons']; events:NonNullable<GameState['rollingRankings']>['events']}|null>(null);
 const [archiveStatus,setArchiveStatus]=useState('');
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  let cancelled=false;
  const target=resolveProfilePlayer(gameState,id);
  if(!gameState.historyArchive||!target)return;
  async function load(){
   setArchiveStatus('Loading saved history…');
   try {
    const rows=await readArchivedPlayer(gameState,target!.id);
    const events:NonNullable<GameState['rollingRankings']>['events']={};
    const seasons=selectedSeason==='all'?Object.keys(gameState.historyArchive!.seasons):selectedSeason==='recent'?[]:[selectedSeason];
    for(const season of seasons){
     const saved=await readArchivedSeason(gameState,season);
     if(cancelled)return;
     for(const [key,e] of Object.entries(saved)){
      const outcome=e.outcomes?.find(o=>o.player===target!.playerName);
      const bracket=e.bracket.map(r=>({...r,matches:r.matches.filter(m=>m.top.name===target!.playerName||m.bottom.name===target!.playerName)}));
      if(outcome||bracket.some(r=>r.matches.length)) events[key]={...e,bracket,outcomes:outcome?[outcome]:undefined};
     }
    }
    if(!cancelled){setArchiveView({source:gameState,rows,events});setArchiveStatus('');}
   }catch(error){if(!cancelled)setArchiveStatus(error instanceof Error?error.message:'Could not load history.');}
  }
  void load();return()=>{cancelled=true};
 },[gameState,id,selectedSeason,retry]);
 const profileState=useMemo(()=>{
  if(!archiveView||archiveView.source!==gameState)return gameState;
  const target=resolveProfilePlayer(gameState,id);
  return {...gameState,worldPlayers:gameState.worldPlayers.map(p=>p.id===target?.id?{...p,seasons:[...p.seasons,...archiveView.rows].sort((a,b)=>b.season.localeCompare(a.season))}:p),rollingRankings:gameState.rollingRankings?{...gameState.rollingRankings,events:{...gameState.rollingRankings.events,...archiveView.events}}:undefined};
 },[archiveView,gameState,id]);
 const player=resolveProfilePlayer(gameState,id);const name=player?.playerName??id;const human=name===gameState.player.fullName;const rank=gameState.competitionTables.world.find(p=>p.playerName===name)?.ranking;
 const legacy=human?careerLegacyOf(gameState):undefined;
 const {history,rankings,scouting,seasons}=useMemo(()=>{
  const profileName=resolveProfilePlayer(profileState,id)?.playerName??id;
  const history=playerEventHistory(profileState,profileName);
  return {history,rankings:playerRankingHistory(profileState,profileName),scouting:profileScouting(gameState,profileName),seasons:playerSeasonHistory(profileState,profileName,history)};
 },[gameState,profileState,id]);
 const filteredHistory=['all','recent'].includes(selectedSeason)?history:history.filter(e=>e.season===selectedSeason);
 const seasonTotal=(key:'matches'|'wins'|'losses'|'titles'|'prize')=>seasons.reduce((sum,s)=>sum+(s[key]??0),0);
 const totals=player?{matches:Math.max(player.totalMatches,seasonTotal('matches')),wins:Math.max(player.wins,seasonTotal('wins')),losses:Math.max(player.losses,seasonTotal('losses')),titles:Math.max(player.titles,seasonTotal('titles')),prize:Math.max(player.totalPrizeMoney,seasonTotal('prize'))}:undefined;
 const relation=player?gameState.careerDepth?.relationships[player.id]:undefined;const watch=player?watchableMatch(gameState,player.id):null;
 const recent=history.flatMap(e=>[...e.matches].reverse()).slice(0,10);

 const matches = legacy?.matchesPlayed ?? totals?.matches;
 const wins = legacy?.wins ?? totals?.wins;
 const losses = legacy?.losses ?? totals?.losses;
 const titles = legacy?.trophies.length ?? totals?.titles;
 const prize = legacy?.prizeMoney ?? totals?.prize;
 const winRate = matches && wins != null ? formatPercent(wins / matches * 100) : '—';
 const thisSeason = seasons.find(s => s.season === gameState.season);
 const honours = history.filter(e => e.result === 'Winner');
 const trophies = honours.filter(e => !e.category.includes('achievement'));
 const achievements = honours.filter(e => e.category.includes('achievement'));
 const meetings = relation ? rivalryMeetings(gameState, relation) : [];
 const initials = name.split(/\s+/).map(part => part[0]).slice(0, 2).join('');
 const seasonSelector = <label className="flex items-center gap-2 text-xs text-gray-400">Season
   <select aria-label="Player history season" className="min-h-10 max-w-full rounded-lg border border-border bg-background px-3 text-xs text-white" value={selectedSeason} onChange={event => { setSelectedSeason(event.target.value); setLimit(15); }}>
     <option value="recent">Recent results</option><option value="all">All seasons · load history</option>
     {seasons.map(s => <option key={s.season} value={s.season}>{s.season}{s.live ? ' · Current' : ''}</option>)}
   </select>
 </label>;
 const openSeason = (season: string) => { setSelectedSeason(season); setLimit(15); setTab('Results'); };
 return <div className="flex min-w-0 flex-col gap-3 xl:min-h-full" data-testid="player-profile">
   <header className="relative shrink-0 overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/50 via-surface to-surface p-4 sm:p-6">
     <div className="flex flex-wrap items-start justify-between gap-4">
       <div className="flex min-w-0 flex-1 items-center gap-4">
         <div aria-hidden="true" className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10 text-2xl font-black text-emerald-200 sm:h-20 sm:w-20">{initials}</div>
         <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">{human ? 'Your career profile' : 'Player profile'}</p>
           <h1 className="mt-1 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">{name}</h1>
           <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-300">
             {player ? <><span>{player.nation}</span><span>Age {player.age}</span><span className="rounded bg-white/5 px-2 py-1">{player.retired ? 'Retired' : player.tourSurvivalStatus}</span>{rank && !player.retired ? <span className="font-semibold text-emerald-300">World #{rank}</span> : null}</> : <span>Surviving public results</span>}
           </div>
         </div>
       </div>
       <div className="flex w-full flex-wrap items-center justify-between gap-4 sm:w-auto">
         <div className="flex gap-2" aria-label="Public player ratings">
           <div className="min-w-20 rounded-lg border border-emerald-400/25 bg-background/30 px-4 py-2 text-center"><p className="text-[9px] uppercase tracking-wider text-emerald-300">Overall</p><p className="mt-1 text-2xl font-bold tabular-nums text-white">{scouting.ability}</p></div>
           <div className="min-w-20 rounded-lg border border-border bg-background/30 px-4 py-2 text-center"><p className="text-[9px] uppercase tracking-wider text-gray-400">Potential</p><p className="mt-1 text-2xl font-bold tabular-nums text-white">{scouting.potential}</p></div>
         </div>
         <Link className="btn-secondary min-h-10 shrink-0 text-xs" to="/rankings">Rankings <ArrowUpRight className="h-3.5 w-3.5"/></Link>
       </div>
     </div>
     <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-white/10 pt-4 lg:grid-cols-4">
       {[
         { label: 'Career matches', value: matches?.toLocaleString('en-GB'), detail: wins == null ? 'Results not recorded' : `${wins} wins · ${losses ?? '—'} losses` },
         { label: 'Win rate', value: winRate, detail: 'Across recorded career matches' },
         { label: 'Competitive titles', value: titles, detail: `${player?.majorTitles ?? '—'} major titles` },
         { label: 'Career earnings', value: prize == null ? '—' : formatMoney(prize), detail: 'Tournament prize money' },
       ].map(stat => <div key={stat.label} className="min-w-0"><p className="text-[10px] text-gray-400">{stat.label}</p><p className="mt-1 break-words text-xl font-bold tabular-nums text-white sm:text-2xl">{stat.value ?? '—'}</p><p className="mt-1 text-[10px] text-gray-500">{stat.detail}</p></div>)}
     </div>
   </header>

   <div role="tablist" aria-label="Player profile sections" className="flex shrink-0 gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1">
     {profileTabs.map((item, index) => <button type="button" key={item} role="tab" id={`profile-tab-${item}`} aria-selected={tab === item} aria-controls={`profile-panel-${item}`} tabIndex={tab === item ? 0 : -1}
       onClick={() => setTab(item)} onKeyDown={event => {
         const next = event.key === 'ArrowRight' ? (index + 1) % profileTabs.length : event.key === 'ArrowLeft' ? (index + profileTabs.length - 1) % profileTabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? profileTabs.length - 1 : null;
         if (next == null) return; event.preventDefault(); setTab(profileTabs[next]); document.getElementById(`profile-tab-${profileTabs[next]}`)?.focus();
       }} className={'flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 ' + (tab === item ? 'bg-emerald-500/15 text-emerald-300' : 'text-gray-400 hover:bg-white/5 hover:text-white')}>
       {index === 0 ? <Users className="hidden h-3.5 w-3.5 sm:block"/> : index === 1 ? <Target className="hidden h-3.5 w-3.5 sm:block"/> : index === 2 ? <Trophy className="hidden h-3.5 w-3.5 sm:block"/> : <History className="hidden h-3.5 w-3.5 sm:block"/>}{item}
     </button>)}
   </div>

   <div role="tabpanel" id={`profile-panel-${tab}`} aria-labelledby={`profile-tab-${tab}`} className="flex min-w-0 flex-1 flex-col">
   {tab === 'Overview' && <div className="grid flex-1 items-stretch gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
     <div className="flex min-w-0 flex-col gap-3">
       <section className="card p-4 xl:flex-1"><SectionTitle title="Current form"><span className="text-[10px] text-gray-500">Last {recent.length} recorded matches · newest first</span></SectionTitle>
         {recent.length ? <><div className="flex flex-wrap gap-2">{recent.map(m => <div key={m.id} className="flex min-w-12 flex-col items-center gap-1.5"><ResultBadge result={m.result}/><span className="text-[10px] tabular-nums text-gray-400">{m.score}</span></div>)}</div><p className="mt-3 text-xs text-gray-400">{recent.filter(m => m.result === 'Won').length} wins · {recent.filter(m => m.result === 'Lost').length} losses · {recent.filter(m => m.result === 'Drawn').length} draws</p></> : <p className="text-xs text-gray-400">No published recent match records.</p>}
       </section>
       <section className="card p-4 xl:flex-1"><SectionTitle title={`${gameState.season} at a glance`}><CalendarDays className="h-4 w-4 text-emerald-400"/></SectionTitle>
         {thisSeason ? <><div className="grid grid-cols-3 gap-3"><div><p className="text-[10px] text-gray-400">Wins–losses–draws</p><p className="mt-1 font-semibold text-white">{thisSeason.wins ?? '—'}–{thisSeason.losses ?? '—'}–{thisSeason.draws ?? '—'}</p></div><div><p className="text-[10px] text-gray-400">Titles</p><p className="mt-1 font-semibold text-white">{thisSeason.titles}</p></div><div><p className="text-[10px] text-gray-400">Prize money</p><p className="mt-1 break-words font-semibold text-emerald-300">{thisSeason.prize == null ? '—' : formatMoney(thisSeason.prize)}</p></div></div><button className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-300 hover:underline" onClick={() => openSeason(thisSeason.season)}>Explore this season <ChevronRight className="h-3 w-3"/></button></> : <p className="text-xs text-gray-400">No results recorded for this season.</p>}
       </section>
       <section className="card p-4 xl:flex-1"><SectionTitle title="Latest results"><button className="text-xs text-emerald-300 hover:underline" onClick={() => setTab('Results')}>All results →</button></SectionTitle>
         <div className="divide-y divide-border/70">{history.slice(0, 5).map(e => <div key={e.key} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"><div className="min-w-0"><p className="break-words text-xs font-medium text-white">{e.name}</p><p className="mt-1 text-[10px] text-gray-500">{e.date} · {e.circuit}</p></div><span className={'max-w-[45%] text-right text-[11px] ' + (e.result === 'Winner' ? 'text-amber-300' : 'text-gray-300')}>{e.result}</span></div>)}</div>{!history.length && <p className="text-xs text-gray-400">No published event records yet.</p>}
       </section>
     </div>
     <div className="flex min-w-0 flex-col gap-3">
       <section className="card overflow-hidden xl:flex-1"><div className="p-4"><SectionTitle title="Your head-to-head">{relation && <span className="rounded bg-amber-500/10 px-2 py-1 text-[10px] text-amber-200">{rivalryStage(relation)}</span>}</SectionTitle>
         {relation ? <><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2 text-center"><div><p className="text-3xl font-bold tabular-nums text-emerald-300">{relation.wins}</p><p className="mt-1 text-[10px] text-gray-400">Your wins</p></div><span className="text-gray-600">—</span><div><p className="text-3xl font-bold tabular-nums text-white">{relation.losses}</p><p className="mt-1 text-[10px] text-gray-400">Their wins</p></div></div><p className="mt-2 text-center text-[10px] text-gray-500">{relation.deciders} deciding frames{relation.draws ? ` · ${relation.draws} draws` : ''}</p></> : <p className="text-xs text-gray-400">{human ? 'This is your own profile.' : 'Your first meeting is still to come.'}</p>}
       </div>{meetings.length > 0 && <div className="max-h-48 divide-y divide-border/60 overflow-y-auto border-t border-border bg-background/25 px-4">{meetings.slice(0, 5).map(m => <div key={m.id} className="flex items-center gap-2 py-2.5"><ResultBadge result={m.result}/><div className="min-w-0 flex-1"><p className="break-words text-[11px] text-gray-300">{m.event}</p><p className="text-[9px] text-gray-500">{m.date}</p></div><b className="text-xs tabular-nums text-white">{m.score}</b></div>)}</div>}</section>
       <section className="card p-4 xl:flex-1"><SectionTitle title="Scouting report"><Target className="h-4 w-4 text-emerald-400"/></SectionTitle>
         {human ? <Link className="text-xs text-emerald-300 hover:underline" to="/player/attributes">View your own attributes →</Link> : <><div className="flex justify-between text-[11px]"><span className="text-gray-400">{scouting.samples} observations</span><span className="text-emerald-300">{scouting.confidence}% report confidence</span></div><div className="my-2 h-1.5 rounded bg-background"><div className="h-full rounded bg-emerald-500" style={{ width: `${scouting.confidence}%` }}/></div>
           <p className="mt-3 text-xs leading-relaxed text-gray-300"><PlayerNames text={scouting.note}/></p>
           <details className="mt-3 text-xs"><summary className="cursor-pointer text-gray-400 hover:text-white">Assessment evidence</summary><ul className="mt-2 space-y-2 text-[11px] leading-relaxed text-gray-400">{scouting.evidence.map(e => <li key={e}><PlayerNames text={e}/></li>)}</ul></details>
           {player && <button className="btn-secondary mt-4 min-h-10 w-full justify-center text-xs" disabled={!watch || player.retired} onClick={() => { actOnRealism({ type: 'scout', opponentId: player.id }); setScoutRequested(true); }}>{watch ? 'Scout recorded match · one evening' : 'No unreviewed match available'}</button>}
           {scoutRequested && <p role="status" className="mt-2 text-[11px] text-amber-200"><PlayerNames text={gameState.lastAction}/></p>}
         </>}
       </section>
     </div>
   </div>}

   {tab === 'Results' && <section className="card p-4 sm:p-5"><SectionTitle title="Career results">{seasonSelector}</SectionTitle>
     <p className="mb-4 text-xs text-gray-400">{selectedSeason === 'all' ? 'All seasons' : selectedSeason === 'recent' ? 'Recent results' : selectedSeason} · Every circuit · Published results only. Open an event for opponents and scores.</p>
     {archiveStatus && <p role="status" className="mb-3 rounded border border-amber-500/25 p-3 text-xs text-amber-200">{archiveStatus} <button className="ml-2 underline" onClick={() => setRetry(v => v + 1)}>Retry history</button></p>}
     {gameState.historyArchive && selectedSeason === 'recent' && <p className="mb-3 text-[11px] text-gray-500">Older career totals are retained. Choose a season to load its full results.</p>}
     <div className="space-y-2">{filteredHistory.slice(0, limit).map(e => <details key={e.key} className="group rounded-lg border border-border bg-background/20 open:border-emerald-500/30"><summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-3">
       <ChevronRight className="h-4 w-4 shrink-0 text-gray-500 transition-transform group-open:rotate-90"/><div className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold text-white">{e.name}</span><span className="mt-1 block text-[10px] text-gray-500">{e.date} · {e.circuit}</span></div><span className={'max-w-[45%] text-right text-xs ' + (e.result === 'Winner' ? 'text-amber-300' : 'text-gray-300')}>{e.result}</span>
     </summary><div className="border-t border-border px-3 py-3 sm:px-6"><p className="mb-3 text-[11px] text-gray-400">{e.season} · {e.prize === undefined ? 'Prize not recorded' : formatMoney(e.prize) + ' prize'}</p><ul className="space-y-2 text-xs">{e.matches.map(m => <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="w-24 text-gray-500">{m.round}</span><span className="min-w-0 flex-1 text-white"><PlayerLink name={m.opponent}/></span><span className="text-gray-300">{m.result} <b className="ml-1 tabular-nums">{m.score}</b></span></li>)}</ul>
       {!e.matches.length && <p className="text-xs text-gray-400">{gameState.rollingRankings?.events[e.key]?.archived && !archiveView?.events[e.key] ? <button className="text-emerald-300 underline" onClick={() => openSeason(e.season)}>Load stored scores from {e.season}</button> : 'Final placing retained; individual scores were not recorded in this save.'}</p>}
     </div></details>)}</div>
     {filteredHistory.length > limit && <button className="btn-secondary mt-4 text-xs" onClick={() => setLimit(v => v + 15)}>Show more results</button>}{!filteredHistory.length && <p className="py-8 text-center text-sm text-gray-400">No event details recorded for this selection.</p>}
   </section>}

   {tab === 'Trophies' && <div className="space-y-3"><section className="card p-4 sm:p-5"><SectionTitle title="Trophy cabinet"><span className="text-xs text-amber-300">{titles ?? '—'} competitive titles · {player?.majorTitles ?? '—'} majors</span></SectionTitle>
     <p className="mb-4 text-xs text-gray-400">Recorded winning campaigns. Older aggregate totals may include trophies whose event details were not retained.</p>
     <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{trophies.map(e => <article key={e.key} className="relative flex min-h-36 flex-col rounded-xl border border-amber-400/20 bg-gradient-to-br from-amber-500/10 to-background/30 p-4"><Trophy className="mb-3 h-6 w-6 text-amber-300"/><h3 className="text-sm font-semibold text-white">{e.name}</h3><p className="mt-1 text-[11px] text-amber-200">{e.season} · {e.category}</p><button className="mt-4 self-start text-[11px] text-gray-400 hover:text-white hover:underline" onClick={() => openSeason(e.season)}>View season results →</button></article>)}</div>
     {!trophies.length && <div className="py-8 text-center"><Trophy className="mx-auto h-8 w-8 text-gray-600"/><p className="mt-3 text-sm text-gray-400">No individual trophy details recorded.</p></div>}
   </section>{achievements.length > 0 && <section className="card p-4 sm:p-5"><SectionTitle title="Other achievements"><Medal className="h-4 w-4 text-sky-300"/></SectionTitle><p className="mb-3 text-xs text-gray-400">Qualification places and exhibition achievements are separate from competitive titles.</p><div className="grid gap-2 sm:grid-cols-2">{achievements.map(e => <div key={e.key} className="rounded-lg border border-border bg-background/20 p-3"><p className="text-sm font-medium text-white">{e.name}</p><p className="mt-1 text-[11px] text-sky-200">{e.season} · {e.category}</p></div>)}</div></section>}</div>}

   {tab === 'History' && <div className="space-y-3"><section className="card p-4 sm:p-5"><SectionTitle title="Ranking history"><History className="h-4 w-4 text-emerald-300"/></SectionTitle><p className="mb-3 text-xs text-gray-400">Closing positions on every circuit; the current season shows today's positions. — means unrecorded.</p><div className="max-h-80 overflow-auto rounded-lg border border-border"><table className="w-full whitespace-nowrap text-left text-xs"><thead className="sticky top-0 bg-surface-light text-gray-400"><tr><th className="p-3 font-medium">Season</th>{profileRankingColumns.map(([, key, label]) => <th className="p-3 font-medium" key={key}>{label}</th>)}</tr></thead><tbody>{seasons.map(s => <tr key={s.season} className={'border-t border-border ' + (s.live ? 'bg-emerald-500/5 text-emerald-200' : 'text-gray-300')}><td className="p-3 font-medium">{s.season}{s.live ? ' · Current' : ''}</td>{s.ranks.map((rank, i) => <td className="p-3 tabular-nums" key={i}>{rank ? '#' + rank : '—'}</td>)}</tr>)}</tbody></table>{!seasons.length && <p className="p-4 text-xs text-gray-400">No historical rankings recorded.</p>}</div>
     {rankings.some(r => /^\d{4}-/.test(r.label)) && <details className="mt-3 text-xs"><summary className="cursor-pointer text-emerald-300">Main-tour ranking changes by date</summary><div className="mt-3 max-h-48 overflow-auto"><table className="w-full text-left text-xs"><thead className="text-gray-500"><tr><th className="p-2">Date</th><th className="p-2">World</th><th className="p-2">One-year</th></tr></thead><tbody>{rankings.filter(r => /^\d{4}-/.test(r.label)).reverse().map((r, i) => <tr key={r.label + ':' + i} className="border-t border-border text-gray-300"><td className="p-2">{r.label}</td><td className="p-2">{r.world ? '#' + r.world : '—'}</td><td className="p-2">{r.oneYear ? '#' + r.oneYear : '—'}</td></tr>)}</tbody></table></div></details>}
   </section><section className="card p-4 sm:p-5"><SectionTitle title="Season records · every circuit"/>
     <p className="mb-3 text-xs text-gray-400">All tours included. Select a season to explore its events. Missing historical details remain unrecorded.</p>
     <div className="max-h-96 overflow-auto rounded-lg border border-border"><table className="w-full whitespace-nowrap text-left text-xs"><thead className="sticky top-0 bg-surface-light text-gray-400"><tr>{['Season', 'Career status', 'Matches', 'W–L–D', 'Titles', 'Prize', 'Event records'].map(t => <th className="p-3 font-medium" key={t}>{t}</th>)}</tr></thead><tbody>{seasons.map(s => <tr key={s.season} className="border-t border-border text-gray-300"><td className="p-3"><button className="text-emerald-300 hover:underline" onClick={() => openSeason(s.season)}>{s.season}{s.live ? ' · Current' : ''}</button>{s.partial && <span className="ml-2 text-[9px] text-amber-300">Partial</span>}</td><td className="p-3">{s.status}</td><td className="p-3 tabular-nums">{s.matches ?? '—'}</td><td className="p-3 tabular-nums">{s.wins ?? '—'}–{s.losses ?? '—'}–{s.draws ?? '—'}</td><td className="p-3 tabular-nums">{s.titles}</td><td className="p-3 tabular-nums">{s.prize == null ? 'Not recorded' : formatMoney(s.prize)}</td><td className="p-3">{gameState.historyArchive?.seasons[s.season] && selectedSeason !== s.season && selectedSeason !== 'all' ? <button className="text-emerald-300 hover:underline" onClick={() => openSeason(s.season)}>Load results</button> : s.events.length}</td></tr>)}</tbody></table></div>
   </section></div>}
   </div>
 </div>;
}
