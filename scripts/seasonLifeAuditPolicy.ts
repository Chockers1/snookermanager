import { advanceLiveVisit, hireCoachState, type GameState } from '../src/hooks/useGameState';
import { seasonLifeAction } from '../src/game/seasonLife';
import { lifeOf } from '../src/game/seasonLife/shared';
import { nextTeamMatch, settleTeamMatch } from '../src/game/seasonLife/teams';
export function manageSeasonLife(s:GameState):GameState {
 if(!s.careerDepth?.seasonLife)return s;
 let next=s;
 for(const [id,r] of Object.entries(lifeOf(next).staff))if(r.notice&&!r.notice.choice)next=seasonLifeAction(next,{type:'life-staff',id,choice:'decline'});
 if(!next.coachContracts.length){const junior=next.coaches.find(c=>c.id.startsWith('junior-coach-'));if(junior)next=hireCoachState(next,junior.id);}
 for(const i of lifeOf(next).interviews)if(!i.response)next=seasonLifeAction(next,{type:'life-interview',id:i.id,response:'praise'});
 if(lifeOf(next).form)next=seasonLifeAction(next,{type:'life-recovery',route:'training'});
 for(const e of lifeOf(next).teams)if(e.status==='invited')next=seasonLifeAction(next,{type:'life-team',id:e.id,choice:'accept',partnerId:e.partnerOptions[0]?.id});
 for(let tries=0;tries<4;tries++){
  const e=lifeOf(next).teams.find(t=>t.status==='accepted'&&t.start<=next.currentDate&&t.end>=next.currentDate);if(!e)break;
  const ti=nextTeamMatch(e);if(ti<0 || ti===2&&e.end>next.currentDate)break;
  next=seasonLifeAction(next,{type:'life-play-team',id:e.id});if(!next.liveMatch?.teamContext)break;
  const before={matches:next.matches.length,titles:next.history.tournamentHistory.length,cash:next.player.cash};
  let live=next.liveMatch;for(let n=0;n<6000&&live.status==='In Progress';n++)live=advanceLiveVisit(live,undefined,'simulated');
  if(live.status!=='Completed')throw new Error('Team engine stalled');
  next=settleTeamMatch(next,live);if(next.matches.length!==before.matches||next.history.tournamentHistory.length!==before.titles)throw new Error('Team match contaminated singles records');
 }
 return next;
}
