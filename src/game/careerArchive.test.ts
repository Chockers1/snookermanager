// @vitest-environment node
import {afterEach,describe,expect,it,vi} from 'vitest';
const disk=vi.hoisted(()=>new Map<string,string>());
vi.mock('./saveStorage',async(importOriginal)=>({...await importOriginal<typeof import('./saveStorage')>(),hasCareerDatabase:()=>true,commitCareerStorage:vi.fn(async(entries:[string,string][])=>{for(const[k,v]of entries)disk.set(k,v)}),readSavedCareer:async(k:string)=>disk.get(k)??null,encodeCareerSave:JSON.stringify,decodeCareerSaveAsync:async(s:string)=>s}));
import {archiveCareerHistory,materializeCareerHistory,readArchivedPlayer,readArchivedSeason} from './careerArchive';
import {createStarterState} from '../hooks/useGameState';
import {commitCareerStorage} from './saveStorage';
afterEach(()=>{vi.unstubAllGlobals();vi.clearAllMocks();disk.clear()});
function fixture(){
 const s=createStarterState();s.season='2050/51';s.currentDate='2050-09-01';
 s.payoutRepair={version:1,date:s.currentDate,events:0,credits:0,cashAdjustment:0,unresolved:[],adjustments:[]};
 s.rollingRankings!.events={old:{key:'old',name:'Old championship',season:'2026/27',tournamentId:'old',completedOn:'2027-04-01',ranking:true,applied:true,bracket:[],outcomes:[{player:s.player.fullName,finish:'Winner',matches:6,wins:6,losses:0},{player:s.worldPlayers[1].playerName,finish:'Lost in Semi Final',matches:5,wins:4,losses:1}],prizeAwards:{[s.player.fullName]:1000,[s.worldPlayers[1].playerName]:250}},recent:{key:'recent',name:'Current event',season:s.season,tournamentId:'new',completedOn:s.currentDate,ranking:true,applied:true,bracket:[]}};
 const sample=s.worldPlayers[0].seasons[0]??{season:'2026/27',matches:5,wins:3,losses:2,prizeMoney:250,titles:0,hasTourCard:true};
 s.worldPlayers[0].seasons=Array.from({length:24},(_,i)=>({...sample,season:`${2049-i}/${String(2050-i).slice(2)}`})) as typeof s.worldPlayers[0]['seasons'];
 return s;
}
describe('lossless on-demand career archive',()=>{
 it('keeps gameplay windows, restores every field, and does not mutate the source',async()=>{
  vi.stubGlobal('indexedDB',{});const s=fixture(),before=structuredClone(s);const compact=await archiveCareerHistory(s);
  expect(s).toEqual(before);expect(compact.worldPlayers[0].seasons).toHaveLength(4);
  expect(compact.rollingRankings!.events.old.archived).toBe(true);expect(compact.rollingRankings!.events.recent).toEqual(s.rollingRankings!.events.recent);
  expect(await readArchivedPlayer(compact,s.worldPlayers[0].id)).toHaveLength(20);
  expect((await readArchivedSeason(compact,'2026/27')).old).toEqual(s.rollingRankings!.events.old);
  expect(await materializeCareerHistory(compact)).toEqual(s);
  const count=disk.size;expect(await archiveCareerHistory(compact)).toBe(compact);expect(disk.size).toBe(count);
 });
 it('retains shared chunks for older copies and fails exports when a chunk is missing',async()=>{
  vi.stubGlobal('indexedDB',{});const compact=await archiveCareerHistory(fixture());const copy=structuredClone(compact);
  expect(await materializeCareerHistory(copy)).toEqual(await materializeCareerHistory(compact));
  disk.delete(Object.values(compact.historyArchive!.seasons)[0]);await expect(materializeCareerHistory(copy)).rejects.toThrow('unavailable');
 });
 it('does not publish a compact state after a failed archive write',async()=>{
  vi.stubGlobal('indexedDB',{});const s=fixture(),before=structuredClone(s);vi.mocked(commitCareerStorage).mockRejectedValueOnce(new Error('Quota'));
  await expect(archiveCareerHistory(s)).rejects.toThrow('Quota');expect(s).toEqual(before);
 });
 it('rejects a corrupted but parseable chunk instead of silently exporting changed records',async()=>{
  vi.stubGlobal('indexedDB',{});const compact=await archiveCareerHistory(fixture());
  const key=Object.values(compact.historyArchive!.seasons)[0];disk.set(key,'{}');
  await expect(readArchivedSeason(compact,'2026/27')).rejects.toThrow('integrity check');
 });

});
