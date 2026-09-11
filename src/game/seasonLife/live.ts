import type { LiveMatchState } from '../../hooks/useGameState';
import { bounded } from '../careerDepth/shared';
export function prepareTeamVisit(l:LiveMatchState):LiveMatchState {
 const c=l.teamContext;if(!c)return l;
 const home=c.order[c.turn]<2;
 const ai=c.order[c.turn],di=c.order[(c.turn+1)%c.order.length];
 const own=c.members[home?ai:di],opp=c.members[home?di:ai];
 const boost=(p:typeof own)=>({...p.profile,cueBallControl:bounded(p.profile.cueBallControl+c.coordination)});
 return {...l,playerAtTable:home?l.playerName:l.opponentName,playerVisitProfile:boost(own),opponentVisitProfile:boost(opp),playerConfidence:own.confidence,opponentConfidence:opp.confidence,playerFatigue:own.fatigue,opponentFatigue:opp.fatigue,playerClutch:own.profile.bigMatchNerve,opponentClutch:opp.profile.bigMatchNerve,plannedWinChance:bounded(50+(own.profile.breakBuilding-opp.profile.breakBuilding)*.6,15,85)};
}
export function completeTeamFrame(before:LiveMatchState,after:LiveMatchState):LiveMatchState {
 const c=before.teamContext;if(!c)return after;
 const won=after.playerFrames>before.playerFrames;
 const members=c.members.map((p,i)=>!c.order.includes(i)?p:({...p,confidence:bounded(p.confidence+((i<2)===won?2:-2),25,99),fatigue:bounded(p.fatigue+Math.max(1.5,3-p.profile.stamina/100))}));
 // Partners choose a fixed order for the frame; starting sides alternate each frame.
 const turn=after.frameStarterName===after.playerName?0:1;
 return {...after,teamContext:{...c,members,turn}};
}
export function finishTeamVisit(before:LiveMatchState,after:LiveMatchState):LiveMatchState {
 const c=before.teamContext;if(!c)return after;
 const log=after.visitHistory[0];if(!log||log.id===before.visitHistory[0]?.id)return after;
 const index=c.order[c.turn],frameEnded=after.frameHistory.length>before.frameHistory.length;
 const base=after.teamContext??c;
 const members=base.members.map((p,i)=>i===index?{...p,visits:p.visits+Number(before.currentBreak===0),pots:p.pots+Number(log.success&&log.points>0),fouls:p.fouls+Number(log.foulOccurred),points:p.points+log.points,highestBreak:Math.max(p.highestBreak,log.breakTotal),confidence:frameEnded?p.confidence:index<2?after.playerConfidence:after.opponentConfidence,fatigue:frameEnded?p.fatigue:index<2?after.playerFatigue:after.opponentFatigue}:p);
 const turn=frameEnded?base.turn:log.retainedTable?c.turn:(c.turn+1)%c.order.length;
 return {...after,teamContext:{...base,members,turn,foulReplayTurn:!frameEnded && log.foulOccurred && index>=2?c.turn:undefined},visitHistory:[{...log,participantId:c.members[index].id},...after.visitHistory.slice(1)],feed:after.feed.map((f,i)=>i===0?{...f,text:c.members[index].name+': '+f.text}:f)};
}

/** A request to play again returns the offender to the table, preserving the frame's order. */
export function replayTeamFoul(l:LiveMatchState):LiveMatchState {
 const c=l.teamContext;if(c?.foulReplayTurn===undefined||l.status!=='In Progress')return l;
 return prepareTeamVisit({...l,currentBreak:0,teamContext:{...c,turn:c.foulReplayTurn,foulReplayTurn:undefined},lastVisitSummary:'Offender requested to play again. Penalty stands; playing order is unchanged.'});
}
