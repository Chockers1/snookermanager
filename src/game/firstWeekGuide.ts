import type { GameState } from '../hooks/useGameState';
export const guideSteps = [
 {id:'training',title:'Plan your training',route:'/training',action:'Open training',explanation:'Choose a focus, include rest, then Apply Plan. Applying commits the week’s training effects. Check the expected development and fatigue before confirming.'},
 {id:'equipment',title:'Check your match equipment',route:'/equipment/cues',action:'Check equipment',explanation:'You need an equipped cue, usable chalk and a fitted tip. Use equipment you already own, or choose affordable essentials if anything is missing. Premium upgrades are optional; keep money for entry and travel.'},
 {id:'entry',title:'Choose and enter an event',route:'/calendar',action:'Open calendar',explanation:'Choose an event on your tour. Check its deadline, eligibility and expected costs before entering. A locked event explains what is missing.'},
 {id:'travel',title:'Arrange travel and accommodation',route:'/travel',action:'Open travel',explanation:'Book travel for your entered event. Review hotel nightly costs and arrival time. Progressing further can mean extra nights.'},
 {id:'preparation',title:'Prepare and reach the event',route:'/tournament/preparation',action:'Prepare for the event',explanation:'Confirm your pre-match preparation. The Tournament Hub will explain whether you need to advance to the start date or take another action.'},
 {id:'match',title:'Play your first match',route:'/tournaments/hub',action:'Open Tournament Hub',explanation:'Use Play Next Match for live play or Quick Sim. You can use Tab and Enter on match controls. After the match, review the result and training advice.'},
] as const;
export type GuideStep = typeof guideSteps[number]['id'];
export type FirstWeekGuideState = {startedOn:string;dismissed:boolean;completed:GuideStep[];skipped:GuideStep[];equipmentReviewed?:boolean};
export function freshGuide(state:Pick<GameState,'currentDate'>):FirstWeekGuideState {return {startedOn:state.currentDate,dismissed:false,completed:[],skipped:[]}}
export function reconcileFirstWeekGuide(state:GameState):GameState {
 const guide=state.firstWeekGuide;if(!guide)return state;
 const done=new Set(guide.completed);const played=state.matches.some(m=>m.result!=='In Progress')||state.history.matchLog.length>0;
 if(state.trainingAppliedWeek!==null)done.add('training');
 if(guide.equipmentReviewed)done.add('equipment');
 if(state.tournaments.some(t=>t.status==='Entered')||state.liveMatch||played)done.add('entry');
 if(Object.keys(state.travel.bookings).length||state.liveMatch||played)done.add('travel');
 if(Object.values(state.travel.bookings).some(b=>b.preparation)||state.liveMatch||played)done.add('preparation');
 if(played)done.add('match');
 const completed=guideSteps.filter(step=>done.has(step.id)).map(s=>s.id);
 return completed.join()===guide.completed.join()?state:{...state,firstWeekGuide:{...guide,completed}};
}
export function guideView(state:GameState){
 const guide=reconcileFirstWeekGuide(state).firstWeekGuide;
 const pending=guideSteps.filter(s=>!guide?.completed.includes(s.id)&&!guide?.skipped.includes(s.id));
 return {guide,pending,current:pending[0],finished:Boolean(guide&&!pending.length)};
}
