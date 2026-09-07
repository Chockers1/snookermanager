import type { GameState } from '../hooks/useGameState';
import { ACTIVE_SAVE_KEY, decodeCareerSave } from './saveStorage';
import { readAccessibility } from './accessibility';
declare const __GAME_BUILD__: {version:string;revision:string;builtAt:string};
export const gameBuild=typeof __GAME_BUILD__==='undefined'?{version:'0.0.0',revision:'development',builtAt:'unknown'}:__GAME_BUILD__;
export const DIAGNOSTICS_KEY='snooker-diagnostics-v1';
export type DiagnosticAction={at:string;career:string;date:string;week:number;action:string;route:string;event:string|null;round:string|null};
export type DiagnosticError={at:string;message:string;stack?:string};
const errors:DiagnosticError[]=[];
export const diagnosticCareer=(state:GameState)=>state.worldSeed+':'+state.player.id+':'+state.player.fullName;
export function readDiagnosticActions():DiagnosticAction[]{try{const data=JSON.parse(localStorage.getItem(DIAGNOSTICS_KEY)??'[]');return Array.isArray(data)?data.filter((row):row is DiagnosticAction=>row&&typeof row.career==='string'&&typeof row.action==='string'&&typeof row.route==='string'&&typeof row.date==='string').slice(-50):[]}catch{return []}}
export function recordDiagnosticAction(state:GameState,route:string){
 const actions=readDiagnosticActions(),career=diagnosticCareer(state),last=actions.at(-1);
 if(last?.career===career&&last.action===state.lastAction&&last.date===state.currentDate&&last.route===route)return;
 const action:DiagnosticAction={at:new Date().toISOString(),career,date:state.currentDate,week:state.week,action:state.lastAction.slice(0,1500),route:route.split('?')[0],event:state.tournamentProgress.tournamentId,round:state.tournamentProgress.currentRound};
 try{localStorage.setItem(DIAGNOSTICS_KEY,JSON.stringify([...actions,action].slice(-50)))}catch{/* Reporting must never block gameplay or autosave. */}
}
export function recordDiagnosticError(error:unknown){const e=error instanceof Error?error:new Error(String(error));errors.push({at:new Date().toISOString(),message:e.message.slice(0,2000),stack:e.stack?.slice(0,6000)});if(errors.length>10)errors.shift()}
export function buildBugReport(state:GameState|null,description:string,route:string){
 let save:unknown=state;let rawSave:string|null=null;
 if(!state){try{rawSave=localStorage.getItem(ACTIVE_SAVE_KEY);save=rawSave?JSON.parse(decodeCareerSave(rawSave)):null}catch{/* Retain the raw damaged save for diagnosis. */}}
 const candidate=save&&typeof save==='object'?save as Partial<GameState>:null;
 const reportState=state??(candidate?.player&&typeof candidate.player.fullName==='string'&&typeof candidate.worldSeed==='number'&&candidate.tournamentProgress?candidate as GameState:null);
 return {format:'snooker-bug-report',reportVersion:1,createdAt:new Date().toISOString(),game:gameBuild,description:description.slice(0,8000),route:route.split('?')[0],environment:{userAgent:typeof navigator==='undefined'?'Unknown':navigator.userAgent,viewport:typeof window==='undefined'?null:{width:innerWidth,height:innerHeight},accessibility:readAccessibility()},progress:reportState?{player:reportState.player.fullName,season:reportState.season,date:reportState.currentDate,week:reportState.week,event:reportState.tournamentProgress.tournamentId,round:reportState.tournamentProgress.currentRound}:null,recentActions:readDiagnosticActions().filter(a=>reportState&&a.career===diagnosticCareer(reportState)),errors:[...errors],save,...(!state&&save===null&&rawSave?{unreadableSave:rawSave}:{})};
}
export function downloadBugReport(state:GameState|null,description:string,route:string){const report=buildBugReport(state,description,route),url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='snooker-bug-report-'+new Date().toISOString().slice(0,10)+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
