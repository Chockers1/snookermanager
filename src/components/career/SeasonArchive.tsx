import {useEffect,useState} from 'react';
import {useGame} from '../../context/useGame';
import {readArchivedSeason} from '../../game/careerArchive';
import type {RankedEvent} from '../../game/rollingRankings';
import {PlayerLink} from '../game/PlayerLink';

/** Browsing an old draw never replaces current gameplay state or advances time. */
export function SeasonArchive(){
 const {gameState}=useGame();const [season,setSeason]=useState('');const [events,setEvents]=useState<RankedEvent[]>([]);const [message,setMessage]=useState('');const [opened,setOpened]=useState('');const [retry,setRetry]=useState(0);
 const choices=[...new Set([...Object.keys(gameState.historyArchive?.seasons??{}),...Object.values(gameState.rollingRankings?.events??{}).map(e=>e.season)])].sort().reverse();
 useEffect(()=>{let cancelled=false;if(!season)return;
  async function load(){setMessage('Loading historical season…');try{
   const archived=await readArchivedSeason(gameState,season);
   const rows={...archived};for(const e of Object.values(gameState.rollingRankings?.events??{}))if(e.season===season&&!e.archived)rows[e.key]=e;
   if(!cancelled){setEvents(Object.values(rows).sort((a,b)=>a.completedOn.localeCompare(b.completedOn)));setMessage('');}
  }catch(error){if(!cancelled)setMessage(error instanceof Error?error.message:'History could not be loaded.');}}
  void load();return()=>{cancelled=true};
 },[gameState,season,retry]);
 return <details id="season-archive" className="card"><summary className="cursor-pointer p-4 font-semibold text-white">World season archive · past tournaments and draws</summary><div className="space-y-3 p-4 pt-0"><p className="text-xs text-gray-400">Historical seasons load only when selected. All surviving scores and records are preserved; browsing does not change your career.</p><label className="text-sm text-gray-200">Season <select aria-label="Archive season" className="ml-2 rounded border border-border bg-surface p-2" value={season} onChange={e=>{setSeason(e.target.value);setEvents([]);setOpened('')}}><option value="">Choose a season</option>{choices.map(s=><option key={s}>{s}</option>)}</select></label>{message&&<p role="status" className="text-xs text-amber-200">{message} <button className="underline" onClick={()=>setRetry(n=>n+1)}>Retry</button></p>}
 <div className="max-h-[65vh] space-y-2 overflow-auto">{events.map(e=><article key={e.key} className="rounded border border-border p-3"><button className="w-full text-left text-sm text-white" aria-expanded={opened===e.key} onClick={()=>setOpened(opened===e.key?'':e.key)}>{e.completedOn} · {e.name} · {e.ranking?'Ranking event':'Non-ranking event'}</button>{opened===e.key&&<div className="mt-3 space-y-3 text-xs text-gray-300">{e.bracket.length?e.bracket.map(r=><section key={r.label}><h3 className="font-semibold text-white">{r.label}</h3><div className="mt-2 space-y-1">{r.matches.filter(m=>!m.placeholder).map(m=><p key={m.id}><PlayerLink name={m.top.name}/> · {m.top.score??'—'}–{m.bottom.score??'—'} · <PlayerLink name={m.bottom.name}/></p>)}</div></section>):<><p>Only finishing records survive in this older save; individual scores were not retained before the archive feature.</p>{e.outcomes?.map(o=><p key={o.player}><PlayerLink name={o.player}/> · {o.finish}{o.matches===undefined?'':` · ${o.wins??0}W ${o.losses??0}L ${o.draws??0}D`}</p>)}</>}</div>}</article>)}</div></div></details>;
}
