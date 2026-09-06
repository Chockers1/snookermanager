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
  return {physical:-loss*1.5,technical:-loss*.6,mental:-loss*.2*Math.min(1,Math.max(0,years-5)/10)};
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
