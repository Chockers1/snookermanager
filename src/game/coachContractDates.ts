import type {GameState} from '../hooks/useGameState';
import {plusDays} from './careerDepth/shared';
/** Preserve an already-announced legacy date; never shorten a signed contract. */
export function ensureCoachContractDates(s:GameState):GameState {
 let changed=false;
 const coachContracts=s.coachContracts.map(c=>{
  if(c.endsOn)return c;
  changed=true;const r=s.careerDepth?.seasonLife?.staff[c.coachId];
  const key=c.startedWeek+':'+c.contractWeeks+':'+c.totalCost;
  return {...c,endsOn:r?.contractKey===key&&r.end?r.end:plusDays(s.currentDate,c.weeksRemaining*7)};
 });
 return changed?{...s,coachContracts}:s;
}
