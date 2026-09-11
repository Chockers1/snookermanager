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
import { formatMoney } from '../utils/formatters';
export function OpponentProfilePage(){
 const {id=''}=useParams();
 return <PlayerProfileContent key={id}/>;
}
function PlayerProfileContent(){
 const {id=''}=useParams();const {gameState,actOnRealism}=useGame();const [limit,setLimit]=useState(15);const [selectedSeason,setSelectedSeason]=useState('recent');
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
 return <div className="space-y-4 pb-6"><header className="card p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs text-green-400">Player profile</p><h1 className="mt-1 text-2xl font-bold text-white">{name}</h1><p className="mt-1 text-sm text-gray-400">{player?player.nation+' · Age '+player.age+(rank&&!player.retired?' · World #'+rank:'')+' · '+(player.retired?'Retired':player.tourSurvivalStatus):'Only surviving public results are available for this player.'}</p></div><Link className="btn-secondary" to="/rankings">Rankings</Link></div></header>
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Career matches',legacy?.matchesPlayed??totals?.matches],['Wins / losses',legacy?legacy.wins+' / '+legacy.losses:totals?totals.wins+' / '+totals.losses:undefined],['Competitive titles',legacy?.trophies.length??totals?.titles],['Career earnings',legacy?formatMoney(legacy.prizeMoney):totals?formatMoney(totals.prize):undefined]].map(([label,value])=><div key={label} className="card p-4"><p className="text-xs text-gray-400">{label}</p><p className="mt-2 text-xl font-bold text-white">{value??'Not recorded'}</p></div>)}</div>
 <div className="grid gap-4 lg:grid-cols-2"><section className="card p-4"><h2 className="font-semibold text-white">Scouting report</h2>{human?<Link className="text-sm text-green-400" to="/player/attributes">View your own attributes</Link>:<><p className="mt-2 text-sm text-white">Overall: <strong>{scouting.ability}</strong> · Potential: <strong>{scouting.potential}</strong></p><p className="mt-2 text-xs text-gray-400">{scouting.samples} observations · {scouting.confidence}% scouting confidence. Scouting builds your tactical and performance assessment.</p><p className="mt-2 text-xs text-gray-300">{scouting.note}</p><ul className="mt-2 space-y-1 text-xs text-gray-400">{scouting.evidence.map(e=><li key={e}>{e}</li>)}</ul>{player&&<button className="btn-secondary mt-3 text-xs" disabled={!watch||player.retired} onClick={()=>actOnRealism({type:'scout',opponentId:player.id})}>{watch?'Scout recorded match · one evening':'No unreviewed match available'}</button>}<p role="status" className="mt-2 text-xs text-amber-300">{gameState.lastAction}</p></>}</section>
 <section className="card p-4"><h2 className="font-semibold text-white">Your head-to-head</h2>{relation?<><p className="mt-2 text-xl text-white">{relation.wins}–{relation.losses}{relation.draws?'–'+relation.draws:''}</p><p className="mt-1 text-xs text-gray-400">Wins–losses{relation.draws?'–draws':''} · {rivalryStage(relation)} · {relation.deciders} deciders</p><div className="mt-3 max-h-48 space-y-2 overflow-y-auto">{rivalryMeetings(gameState,relation).map(m=><p key={m.id} className="text-xs text-gray-300">{m.date} · {m.event} · {m.result} {m.score}</p>)}</div></>:<p className="mt-3 text-sm text-gray-400">{human?'This is your own profile.':'No recorded meetings with you yet.'}</p>}</section></div>
 <section className="card p-4"><h2 className="font-semibold text-white">Current form</h2><div className="mt-3 flex flex-wrap gap-2">{recent.map(m=><span key={m.id} title={m.result+' '+m.score+' vs '+m.opponent} className={'rounded px-2 py-1 text-xs '+(m.result==='Won'?'bg-green-500/15 text-green-300':'bg-surface-light text-gray-300')}>{m.result} {m.score}</span>)}</div>{!recent.length&&<p className="mt-2 text-sm text-gray-400">No published recent match records.</p>}</section>
 <section className="card p-4"><h2 className="font-semibold text-white">Titles and achievements</h2><p className="mt-1 text-xs text-gray-400">{player?.majorTitles??'Unknown'} major titles · Listed events below have surviving final results. Older aggregate totals may include events no longer retained.</p><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{history.filter(e=>e.result==='Winner').map(e=><div key={e.key} className="rounded border border-amber-400/20 p-3"><p className="text-sm text-white">{e.name}</p><p className="mt-1 text-xs text-amber-300">{e.season} · {e.category}</p></div>)}</div></section>
 <section className="card p-4"><h2 className="font-semibold text-white">Ranking history</h2><p className="mt-1 text-xs text-gray-400">Closing positions on every circuit; the current season shows today's positions. — means no recorded position.</p><div className="mt-3 max-h-72 overflow-auto"><table className="w-full whitespace-nowrap text-left text-xs"><thead><tr className="text-gray-400"><th className="p-2">Season</th>{profileRankingColumns.map(([,key,label])=><th className="p-2" key={key}>{label}</th>)}</tr></thead><tbody>{seasons.map(s=><tr key={s.season} className="border-t border-border text-gray-300"><td className="p-2">{s.season}{s.live?' · Current':''}</td>{s.ranks.map((rank,i)=><td className="p-2" key={i}>{rank?'#'+rank:'—'}</td>)}</tr>)}</tbody></table>{!seasons.length&&<p className="text-xs text-gray-400">No historical rankings recorded.</p>}</div>
 {rankings.some(r=>/^\d{4}-/.test(r.label))&&<details className="mt-3 text-xs"><summary className="cursor-pointer text-green-400">Main-tour ranking changes by date</summary><div className="mt-2 max-h-48 overflow-auto"><table className="w-full text-left"><thead><tr><th>Date</th><th>World</th><th>One-year</th></tr></thead><tbody>{rankings.filter(r=>/^\d{4}-/.test(r.label)).reverse().map((r,i)=><tr key={r.label+':'+i}><td>{r.label}</td><td>{r.world?'#'+r.world:'—'}</td><td>{r.oneYear?'#'+r.oneYear:'—'}</td></tr>)}</tbody></table></div></details>}</section>
 <section className="card p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-white">Season records · every circuit</h2><label className="text-xs text-gray-300">View season <select aria-label="Player history season" className="ml-2 rounded border border-border bg-surface p-2" value={selectedSeason} onChange={event=>{setSelectedSeason(event.target.value);setLimit(15)}}><option value="recent">Recent results · career summaries</option><option value="all">Load all historical results</option>{seasons.map(s=><option key={s.season} value={s.season}>{s.season}{s.live?' · Current':''}</option>)}</select></label></div>
 <p className="mt-2 text-xs text-gray-400">All tours included. Select a season to see its events below. Current-season totals cover published results. Older missing details are marked as unrecorded.</p>
 <div className="mt-3 max-h-72 overflow-auto"><table className="w-full whitespace-nowrap text-left text-xs"><thead><tr className="text-gray-400">{['Season','Career status','Matches','W–L–D','Titles','Prize','Event records'].map(t=><th className="p-2" key={t}>{t}</th>)}</tr></thead><tbody>{seasons.filter(s=>['all','recent'].includes(selectedSeason)||s.season===selectedSeason).map(s=><tr key={s.season} className="border-t border-border text-gray-300"><td className="p-2"><button className="text-green-400 underline" onClick={()=>{setSelectedSeason(s.season);setLimit(15)}}>{s.season}{s.live?' · Current':''}</button>{s.partial&&<span className="ml-2 text-amber-300">Partial</span>}</td><td className="p-2">{s.status}</td><td className="p-2">{s.matches??'—'}</td><td className="p-2">{s.wins??'—'}–{s.losses??'—'}–{s.draws??'—'}</td><td className="p-2">{s.titles}</td><td className="p-2">{s.prize===null?'Not recorded':formatMoney(s.prize)}</td><td className="p-2">{gameState.historyArchive?.seasons[s.season] && selectedSeason !== s.season && selectedSeason !== 'all' ? <button className="text-green-400 underline" onClick={()=>{setSelectedSeason(s.season);setLimit(15)}}>Load results</button> : s.events.length}</td></tr>)}</tbody></table></div></section>
 <section className="card p-4"><h2 className="font-semibold text-white">Career results</h2>{archiveStatus&&<p role="status" className="my-2 text-xs text-amber-200">{archiveStatus} <button className="underline" onClick={()=>setRetry(v=>v+1)}>Retry history</button></p>}{gameState.historyArchive&&selectedSeason==='recent'&&<p className="mt-2 text-xs text-gray-400">Older titles and career totals are retained. Select a season or Load all historical results to retrieve its full records.</p>}<p className="mt-1 text-xs text-gray-400">{selectedSeason==='all'?'All seasons':selectedSeason==='recent'?'Recent results':selectedSeason} · Every circuit · Published results only. Open an event for opponents and scores.</p><div className="mt-3 space-y-2">{filteredHistory.slice(0,limit).map(e=><details key={e.key} className="rounded border border-border p-3"><summary className="cursor-pointer text-sm text-white">{e.date} · {e.name} · {e.result}</summary><p className="mt-2 text-xs text-gray-400">{e.season} · {e.circuit} · {e.prize===undefined?'Prize not recorded':formatMoney(e.prize)}</p><ul className="mt-3 space-y-2 text-xs text-gray-300">{!e.matches.length&&<li>{gameState.rollingRankings?.events[e.key]?.archived && !archiveView?.events[e.key] ? <button className="text-green-400 underline" onClick={()=>{setSelectedSeason(e.season);setLimit(15)}}>Load stored scores from {e.season}</button> : 'Final placing retained; individual scores were not recorded in this save.'}</li>}{e.matches.map(m=><li key={m.id}>{m.round} · <PlayerLink name={m.opponent}/> · {m.result} {m.score}</li>)}</ul></details>)}</div>{filteredHistory.length>limit&&<button className="btn-secondary mt-3 text-xs" onClick={()=>setLimit(v=>v+15)}>Show more results</button>}{!filteredHistory.length&&<p className="mt-2 text-xs text-gray-400">No event details survive in this save.</p>}</section>
 </div>;
}
