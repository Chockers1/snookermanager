import fs from 'node:fs';
import {repairGameState, getTournamentEntryAccess, advanceWeekState, startNextSeasonState} from '../src/hooks/useGameState';
import {playCenturyMatch} from './centuryAuditRecorder';
import {pendingStory} from '../src/game/careerDepth/shared';
import {careerDepthAction} from '../src/game/careerDepth';
const source=process.argv[2],original=JSON.parse(fs.readFileSync(source,'utf8'));let state=repairGameState(original);
const event=state.tournaments.find(t=>t.status==='Entered')!;
const before={date:state.currentDate,retired:state.careerSystems.lateCareer.retired,access:getTournamentEntryAccess(state,event),round:state.tournamentProgress.currentRound,cash:state.player.cash,matches:state.matches.length};
let random=104729;Math.random=()=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return random/4294967296;};
const results=[];
for(let i=0;i<10&&state.tournaments.some(t=>t.id===event.id&&t.status==='Entered');i++){
 const story=pendingStory(state);if(story)state=careerDepthAction(state,{type:'decision',id:story.id,choice:story.kind==='deciders'||story.kind==='early-exits'?'continue':'protect'});
 const old=state;state=playCenturyMatch(state,event.id);results.push({message:state.lastAction,date:state.currentDate,round:state.tournamentProgress.currentRound,retired:state.careerSystems.lateCareer.retired});
 if(state.matches[0]?.id===old.matches[0]?.id)throw Error('Match still blocked: '+state.lastAction);
}
if(state.tournaments.some(t=>t.status==='Entered'))throw Error('Tournament did not finish');
const story=pendingStory(state);if(story)state=careerDepthAction(state,{type:'decision',id:story.id,choice:'protect'});
const completed=state;state=advanceWeekState(state);if(state.seasonReview?.pending)state=startNextSeasonState(state);
const after={date:state.currentDate,retired:state.careerSystems.lateCareer.retired,worldRetired:state.worldPlayers.find(p=>p.playerName===state.player.fullName)?.retired,cash:state.player.cash,matches:state.matches.length};
if(state.currentDate<=completed.currentDate)throw Error('Calendar still blocked: '+state.lastAction);
fs.mkdirSync('artifacts/retirement-fixes',{recursive:true});fs.writeFileSync('artifacts/retirement-fixes/reproduction.json',JSON.stringify({source,before,results,after},null,2));
fs.writeFileSync('artifacts/retirement-fixes/continued-save.json',JSON.stringify(state));fs.writeFileSync('artifacts/retirement-fixes/continued-rng.json',JSON.stringify({randomState:random}));console.log({before,results,after});
