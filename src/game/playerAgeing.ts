import type { PlayerAttributes } from '../types/game';
import type { GameState } from '../hooks/useGameState';

export type DeclineProfile = { startAge: number; rate: number };
type AgeingPlayer = { id: string; declineProfile?: DeclineProfile };
const hash = (text: string) => [...text].reduce((n,c) => Math.imul(n ^ c.charCodeAt(0),16777619) >>> 0,2166136261);
function valid(profile?: DeclineProfile): profile is DeclineProfile {
  return Boolean(profile && Number.isInteger(profile.startAge) && profile.startAge >= 35 && profile.startAge <= 40 && Number.isFinite(profile.rate) && profile.rate >= .65 && profile.rate <= 1.45);
}
/** Separate seeded draws make onset and pace independent, stable across reloads and renaming. */
export function playerDecline(player: AgeingPlayer, worldSeed = 0): DeclineProfile {
  if (valid(player.declineProfile)) return player.declineProfile;
  return { startAge: 35 + hash(worldSeed+':'+player.id+':decline-onset') % 6,
    rate: (65 + hash(worldSeed+':'+player.id+':decline-rate') % 81) / 100 };
}
export function annualDecline(age: number, profile: DeclineProfile) {
  return age < profile.startAge ? 0 : Math.min(3,.55+(age-profile.startAge)*.12)*profile.rate;
}
export function ageAttributeLoss(age:number,profile:DeclineProfile) {
  const loss=annualDecline(age,profile),years=Math.max(0,age-profile.startAge);
  const mentalRamp=Math.min(1,Math.max(0,years-5)/10);
  // Match the CPU overall decline using the same 46/34/20 rating weights.
  // Within each group, preserve slower loss of positional and learned mental skills.
  const weightedLoss=.46*.6*((3+2*.55)/5)+.2*1.5*((3+2*.65)/5)+.34*.2*mentalRamp*((2+2*.4)/5);
  const scale=1/weightedLoss;
  return {physical:-loss*1.5*scale,technical:-loss*.6*scale,mental:-loss*.2*mentalRamp*scale};
}
export function ensurePlayerDeclines(state:GameState):GameState {
  const human=playerDecline({id:'human',declineProfile:state.player.declineProfile},state.worldSeed);
  let changed=human!==state.player.declineProfile;
  const worldPlayers=state.worldPlayers.map(p=>{
    const profile=p.playerName===state.player.fullName ? human : playerDecline(p,state.worldSeed);
    if(profile===p.declineProfile)return p;
    changed=true;return {...p,declineProfile:profile};
  });
  return changed?{...state,player:{...state.player,declineProfile:human},worldPlayers}:state;
}

/** Future annual changes only; save migration never reapplies missed ageing. */
export function applySeasonalAgeRegression(attributes: PlayerAttributes, age: number, decline: DeclineProfile): PlayerAttributes {
  const loss=ageAttributeLoss(age,decline);
  const next={technical:{...attributes.technical},mental:{...attributes.mental},physical:{...attributes.physical}};
  const groups=[
    {group:next.physical, labels:['Stamina','Recovery Rate','Shoulder Health','Hand Steadiness','Balance'], delta:loss.physical, eased:.65, full:3},
    {group:next.technical, labels:['Long Potting','Cue Ball Control','Break Building','Safety Play','Consistency'], delta:loss.technical, eased:.55, full:3},
    {group:next.mental, labels:['Focus','Composure','Resilience','Big Match Nerve'], delta:loss.mental, eased:.4, full:2},
  ];
  // Distribute the same overall loss as CPU ageing. Decline eases as an
  // individual skill falls, rather than exhausting physical attributes first
  // while leaving learned skills untouched. No attributes are raised here.
  const weights=[.2/5,.46/5,.34/5];
  const cells=groups.flatMap(({group,labels,delta,eased,full},groupIndex)=>labels.filter(label=>label in group).map((label,index)=>({group,label,weight:weights[groupIndex],pace:-delta*(index>=full?eased:1)*Math.pow(group[label]/100,2)})));
  let budget=annualDecline(age,decline);
  let available=cells.filter(c=>c.pace>0&&c.group[c.label]>1);
  for(let pass=0;pass<cells.length&&budget>1e-10&&available.length;pass++){
    const weightedPace=available.reduce((n,c)=>n+c.pace*c.weight,0);
    let spent=0;
    for(const c of available){const loss=Math.min(c.group[c.label]-1,budget*c.pace/weightedPace);c.group[c.label]-=loss;spent+=loss*c.weight;}
    budget-=spent;available=available.filter(c=>c.group[c.label]>1+1e-10);
  }
  return next;
}
