import type { GameState } from '../../hooks/useGameState';
import type { Match } from '../../types/game';
import { bounded, careerMessage, depthOf, plusDays } from '../careerDepth/shared';
import { lifeOf, putLife, storyStep } from './shared';
import type { Interview } from './types';
export function offerInterview(s:GameState,m:Match):GameState {
 const l=lifeOf(s),event=s.tournaments.find(t=>t.id===m.tournamentId),relationship=depthOf(s).relationships[m.opponentId??''];
 const majorFinal=m.round==='Final'&&(m.tournamentClass==='Major'||event?.type==='Major');
 const breakthrough=m.televised&&m.result==='Won'&&!l.televisedBreakthroughSeen;
 const rivalry=relationship?.rivalry&&Math.abs(m.playerFrames-m.opponentFrames)<=1;
 if(!majorFinal&&!breakthrough&&!rivalry || l.interviews.some(x=>x.id==='interview:'+(m.season??s.season)+':'+m.tournamentId))return s;
 const interview:Interview={id:'interview:'+(m.season??s.season)+':'+m.tournamentId,eventId:m.tournamentId,title:majorFinal?'After the final':breakthrough?'Televised breakthrough':'Rivalry interview',context:`${event?.name??m.tournamentId}: ${m.playerName} ${m.result.toLowerCase()} ${m.playerFrames}–${m.opponentFrames} against ${m.opponentName}.`,opponentId:m.opponentId,created:s.currentDate,deadline:plusDays(s.currentDate,3)};
 return careerMessage(putLife(s,{...l,televisedBreakthroughSeen:l.televisedBreakthroughSeen||breakthrough,interviews:[interview,...l.interviews].slice(0,100)}),interview.id,interview.title,interview.context+' Optional interview; no reply by '+interview.deadline+' means no comment, without penalty.');
}
export function answerInterview(s:GameState,id:string,response:NonNullable<Interview['response']>):GameState {
 const l=lifeOf(s),interview=l.interviews.find(i=>i.id===id);if(!interview||interview.response||s.currentDate>interview.deadline)return s;
 const d=depthOf(s),relationship=d.relationships[interview.opponentId??''];
 const opponent=s.worldPlayers.find(p=>p.id===interview.opponentId);
 const personality=interview.opponentId?(l.mediaPersonalities?.[interview.opponentId]??(['reserved','competitive','gracious'] as const)[Array.from(interview.opponentId).reduce((n,c)=>n+c.charCodeAt(0),s.worldSeed)%3]):'reserved';
 const previous=l.interviews.filter(i=>i.opponentId===interview.opponentId&&i.response==='challenge').length;
 const baseReaction=response==='private'?'Declined comment. No penalty.':response==='praise'?'Respectful words acknowledged. Rivalry intensity softened slightly.':response==='candid'?(s.coachContracts.length?'Candid reflection shared with your coach. Small trust increase.':'Candid reflection recorded. You continue preparing independently.'):`A competitive challenge was recorded. ${previous?'Repeated challenges bring stronger public expectations.':'Expectations are raised briefly.'}`;
 const reaction=baseReaction+(opponent&&response!=='private'?` ${opponent.playerName}'s ${personality} media temperament ${personality==='competitive'&&response==='challenge'?'makes the challenge more pointed.':personality==='gracious'&&response==='praise'?'makes your praise particularly welcome.':'keeps the reaction measured.'}`:'');
 let next=putLife(s,{...l,mediaPersonalities:interview.opponentId?{...l.mediaPersonalities,[interview.opponentId]:personality}:l.mediaPersonalities,expectationsUntil:response==='challenge'?plusDays(s.currentDate,14):l.expectationsUntil,interviews:l.interviews.map(i=>i.id===id?{...i,response,answered:s.currentDate,reaction}:i)});
 if(response==='challenge')next={...next,careerDepth:{...depthOf(next),mediaExpectationsUntil:plusDays(s.currentDate,14)}};
 if(relationship && response!=='private')next={...next,careerDepth:{...depthOf(next),relationships:{...d.relationships,[relationship.opponentId]:{...relationship,intensity:bounded((relationship.intensity??40)+(response==='challenge'?(personality==='competitive'?4:2):response==='praise'?-2:0)),respect:bounded((relationship.respect??50)+(response==='praise'?(personality==='gracious'?3:2):response==='challenge'&&previous?-1:0))}}}};
 if(response==='candid'){
  const coaches={...depthOf(next).coachRelationships};for(const c of s.coachContracts){const r=coaches[c.coachId]??{trust:55,note:''};coaches[c.coachId]={...r,trust:bounded(r.trust+1),note:'Candid post-match reflection.'};}next={...next,careerDepth:{...depthOf(next),coachRelationships:coaches}};
 }
 return {...next,lastAction:reaction};
}
export function mediaBehaviourNote(s:GameState):string|undefined {
 const statements=s.careerDepth?.seasonLife?.interviews.filter(i=>i.response==='challenge'&&(i.answered??'')>=plusDays(s.currentDate,-90))??[];
 return statements.length>=3?`${statements.length} competitive challenges in the last 90 days have raised public expectations; commercial review considers repeated behaviour, not one answer.`:undefined;
}
export function reviewMajorPreparation(s:GameState,m:Match):GameState {
 let next=s;
 for(const story of lifeOf(s).stories.filter(x=>x.kind==='staff'&&m.tournamentClass==='Major'&&!x.resolved&&x.steps.length>=2))next=storyStep(next,story.id,`Major-event review: ${m.playerName} ${m.result.toLowerCase()} ${m.playerFrames}–${m.opponentFrames} against ${m.opponentName}. ${s.coachContracts.length?'An employed coach was available for preparation.':'Independent preparation kept the career playable.'}`,true);
 for(const story of lifeOf(s).stories.filter(x=>x.kind==='return'&&!x.resolved&&x.subjectId===m.opponentId))next=storyStep(next,story.id,`Met again: ${m.playerFrames}–${m.opponentFrames}. The injury return now has a recorded competitive outcome.`,true);
 return next;
}
