import { repairHumanSeasonRows } from './humanWorldRecord';
import type { GameState } from '../hooks/useGameState';
import type { RankedEvent } from './rollingRankings';
import { compactEventOutcomes, qualifiedNames } from './rollingRankings';
import { hasCareerDatabase, commitCareerStorage, readSavedCareer, encodeCareerSave, decodeCareerSaveAsync } from './saveStorage';

/** Content-addressed, immutable chunks may be shared by slots and recovery saves.
 * Never remove a chunk while an older recovery snapshot could still refer to it. */
export type CareerArchive = { version: 1; seasons: Record<string,string>; players: Record<string,string[]>; formerProfessionals: string[] };
type PlayerSeasons = GameState['worldPlayers'][number]['seasons'];
const prefix='snooker-history-v1:';
async function contentHash(json: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(json))),v=>v.toString(16).padStart(2,'0')).join('');
}
async function putChunk(value: unknown) {
  const json=JSON.stringify(value);
  const key=prefix+await contentHash(json);
  if(!await readSavedCareer(key)) await commitCareerStorage([[key,encodeCareerSave(value)]]);
  return key;
}
async function readChunk<T>(key: string): Promise<T> {
  const payload=await readSavedCareer(key);
  if(!payload) throw new Error('Historical season data is unavailable. Restore a complete portable backup; do not clear browser storage.');
  const json=await decodeCareerSaveAsync(payload);
  if(key !== prefix+await contentHash(json)) throw new Error('Historical data failed its integrity check. Restore a complete portable backup; the original archive has been preserved.');
  return JSON.parse(json) as T;
}
export function readArchivedSeason(state: GameState, season: string): Promise<Record<string,RankedEvent>> {
  const key=state.historyArchive?.seasons[season];
  return key?readChunk<Record<string,RankedEvent>>(key):Promise.resolve({});
}
export function readArchivedPlayer(state: GameState, id: string) {
  const keys=state.historyArchive?.players[id]??[];
  return Promise.all(keys.map(key=>readChunk<PlayerSeasons>(key))).then(rows=>{const merged=rows.flat().sort((a,b)=>b.season.localeCompare(a.season));return state.worldPlayers.some(p=>p.id===id&&p.playerName===state.player.fullName)?repairHumanSeasonRows(state,merged):merged;});
}

/** Keep the previous and current event seasons and four active CPU seasons, plus tiny selection summaries. Retired players need only their latest season in live memory.
 * This runs on a repaired snapshot, before publishing its smaller active payload. */
export async function archiveCareerHistory(state: GameState): Promise<GameState> {
  if(typeof indexedDB==='undefined'||!hasCareerDatabase()||!state.rollingRankings||!state.payoutRepair) return state;
  const year=Number(state.season.slice(0,4));
  const groups=new Map<string,Record<string,RankedEvent>>();
  for(const e of Object.values(state.rollingRankings.events)) {
    if(e.archived || !e.applied || Number(e.season.slice(0,4))>=year-1) continue;
    const group=groups.get(e.season)??{};group[e.key]=e;groups.set(e.season,group);
  }
  const liveSeasonCount = (p: GameState['worldPlayers'][number]) => p.retired ? 1 : 4;
  const older=state.worldPlayers.filter(p=>p.seasons.length>liveSeasonCount(p));
  if(!groups.size&&!older.length) return state;
  const archive:CareerArchive={version:1,seasons:{...state.historyArchive?.seasons},players:{...state.historyArchive?.players},formerProfessionals:[...state.historyArchive?.formerProfessionals??[]]};
  const events={...state.rollingRankings.events};
  for(const [season,group] of groups) {
    const previous=archive.seasons[season]?await readChunk<Record<string,RankedEvent>>(archive.seasons[season]):{};
    archive.seasons[season]=await putChunk({...previous,...group});
    for(const e of Object.values(group)) {
      const outcomes=(e.outcomes??compactEventOutcomes(e.bracket)).filter(o=>o.finish==='Winner'||o.player===state.player.fullName);
      events[e.key]={...e,archived:true,archivedQualifiers:qualifiedNames(e.bracket),bracket:[],outcomes,prizeAwards:Object.fromEntries(outcomes.flatMap(o=>e.prizeAwards?.[o.player]===undefined?[]:[[o.player,e.prizeAwards[o.player]]]))};
    }
    await new Promise<void>(resolve=>setTimeout(resolve,0));
  }
  const replacements=new Map<string,PlayerSeasons>();
  const former=new Set(archive.formerProfessionals);
  for(const p of older) {
    const rows=p.seasons.slice(liveSeasonCount(p));
    const key=await putChunk(rows);
    archive.players[p.id]=[...new Set([...(archive.players[p.id]??[]),key])];
    if(rows.some(s=>s.hasTourCard)) former.add(p.id);
    replacements.set(p.id,p.seasons.slice(0,liveSeasonCount(p)));
  }
  archive.formerProfessionals=[...former];
  return {...state,historyArchive:archive,rollingRankings:{...state.rollingRankings,events},worldPlayers:state.worldPlayers.map(p=>replacements.has(p.id)?{...p,seasons:replacements.get(p.id)!,archivedSelectionSeasons:[...p.seasons.slice(liveSeasonCount(p)).map(s=>({season:s.season,worldRank:s.worldRank,mainTourEvents:s.mainTourEvents})),...(p.archivedSelectionSeasons??[])].slice(0,12-liveSeasonCount(p))}:p)};
}

/** Exports are self-contained. Missing chunks fail loudly instead of exporting a
 * seemingly successful but incomplete career. Import requires no other browser. */
export async function materializeCareerHistory(state: GameState): Promise<GameState> {
  if(!state.historyArchive) return state;
  const events={...state.rollingRankings?.events};
  for(const season of Object.keys(state.historyArchive.seasons)) {
    for(const [key,event] of Object.entries(await readArchivedSeason(state,season))) if(!events[key]||events[key].archived) events[key]=event;
  }
  const worldPlayers=[];
  for(const p of state.worldPlayers) {
    const rows=new Map([...(await readArchivedPlayer(state,p.id)),...p.seasons].map(s=>[s.season,s]));
    const {archivedSelectionSeasons:removed,...fullPlayer}=p;void removed;
    worldPlayers.push({...fullPlayer,seasons:[...rows.values()].sort((a,b)=>b.season.localeCompare(a.season))});
  }
  const {historyArchive:removed,...rest}=state;void removed;
  return {...rest,worldPlayers,rollingRankings:state.rollingRankings?{...state.rollingRankings,events}:undefined};
}
