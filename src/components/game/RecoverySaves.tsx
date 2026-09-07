import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../../context/useGame';
import { listRecoverySaves, type RecoverySave } from '../../game/recoverySaves';
export function RecoverySaves() {
 const { restoreRecoverySave, saveWarning } = useGame(); const navigate = useNavigate();
 const [records,setRecords]=useState<RecoverySave[]>([]); const [message,setMessage]=useState('Loading recovery saves…');
 const [busy,setBusy]=useState(false); const [career,setCareer]=useState('all');
 async function refresh(){try { const saves=await listRecoverySaves(); setRecords(saves);setMessage(saves.length?'Choose a snapshot to restore as a new career copy.':'No backups yet. Automatic snapshots begin when you continue a career.');}catch(error){setMessage(error instanceof Error?error.message:'Could not load backups.')}}
 useEffect(()=>{let alive=true;void listRecoverySaves().then(saves=>{if(alive){setRecords(saves);setMessage(saves.length?'Choose a snapshot to restore as a new career copy.':'No backups yet. Automatic snapshots begin when you continue a career.');}}).catch(error=>{if(alive)setMessage(error instanceof Error?error.message:'Could not load backups.');});return()=>{alive=false}},[]);
 async function restore(id:string){setBusy(true);try{const result=await restoreRecoverySave(id);setMessage(result.message);if(result.success)navigate('/saves');}finally{setBusy(false)}}
 const careers=[...new Map(records.map(r=>[r.careerId,r])).values()];
 return <section className="card p-4" aria-label="Save recovery"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-white">Automatic backups & recovery</h2><button className="btn-secondary text-xs" disabled={busy} onClick={()=>void refresh()}>Refresh backups</button></div>
 <p className="mt-2 text-xs text-gray-400">Per career: six progress snapshots, two backups before season rollover and two before restore. These are stored on this browser; export a portable backup to keep a copy elsewhere.</p>
 {saveWarning&&<p role="alert" className="mt-2 text-xs text-amber-300">{saveWarning}</p>}
 <label className="mt-3 block text-xs text-gray-400">Career<select className="ml-2 max-w-full rounded border border-border bg-surface p-2 text-white" aria-label="Recovery career" value={career} onChange={e=>setCareer(e.target.value)}><option value="all">All careers</option>{careers.map(r=><option key={r.careerId} value={r.careerId}>{r.player} · {r.careerId.slice(-6)}</option>)}</select></label>
 <div className="mt-3 max-h-96 space-y-2 overflow-y-auto">{records.filter(r=>career==='all'||r.careerId===career).map(r=><div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-border bg-surface-light/30 p-3"><div className="min-w-0"><p className="text-sm font-semibold text-white">{r.player} · {r.season} · {r.date}</p><p className="mt-1 text-xs text-green-300">{r.reason} · {r.rank?'Rank #'+r.rank:'Unranked'} · {r.matches} career matches</p><p className="mt-1 break-words text-xs text-gray-400">{r.progress} · Saved {new Date(r.savedAt).toLocaleString()}</p></div><button className="btn-secondary shrink-0 text-xs" disabled={busy} onClick={()=>void restore(r.id)}>Restore copy</button></div>)}</div>
 <p role="status" className="mt-3 text-xs text-gray-300">{busy?'Restoring backup…':message}</p></section>;
}
