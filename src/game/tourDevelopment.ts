import { playerDecline, ensurePlayerDeclines } from './playerAgeing';
import type { GameState } from '../hooks/useGameState';
import { bounded } from './careerDepth/shared';
export type TourSkills = { longPotting: number; breakBuilding: number; safetyPlay: number; composure: number; stamina: number };
export type TourDevelopment = { reviewedMonth: string; focus: keyof TourSkills; offsets: TourSkills; history: { month: string; text: string }[] };
const skills: (keyof TourSkills)[] = ['longPotting','breakBuilding','safetyPlay','composure','stamina'];
export const skillLabels: Record<keyof TourSkills,string> = { longPotting:'Long potting',breakBuilding:'Break building',safetyPlay:'Safety',composure:'Composure',stamina:'Stamina' };
const hash = (text: string) => [...text].reduce((n,c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
const monthNumber = (date: string) => Number(date.slice(0,4))*12 + Number(date.slice(5,7))-1;
const monthLabel = (n: number) => `${Math.floor(n/12)}-${String(n%12+1).padStart(2,'0')}`;
export function evolveTourSkills(state: GameState): GameState {
  state = ensurePlayerDeclines(state);
  const month = state.currentDate.slice(0,7);
  let changed = false;
  const worldPlayers = state.worldPlayers.map(p => {
    if (p.retired || p.playerName === state.player.fullName) return p;
    const declineProfile = playerDecline(p,state.worldSeed);
    const old = p.skillDevelopment;
    if (old && monthNumber(old.reviewedMonth) >= monthNumber(month)) return p;
    changed = true;
    if (!old) return { ...p,skillDevelopment:{ reviewedMonth:month,focus:skills[hash(p.id)%skills.length],offsets:{longPotting:0,breakBuilding:0,safetyPlay:0,composure:0,stamina:0},history:[] } };
    let next = { ...old,offsets:{...old.offsets},history:[...old.history] };
    for (let m=monthNumber(old.reviewedMonth)+1;m<=monthNumber(month);m++) {
      const focus = skills[(hash(p.id)+Math.floor(m/3))%skills.length];
      const support = bounded(((p.coachQuality ?? 55)+(p.trainingLoad ?? 50))/110,.5,1.5);
      const headroom = bounded(((p.developmentPotential ?? 85)-(p.overallRating ?? 65))/20,0,1);
      const growth = p.age<=25 ? .16*support*headroom : p.age<=34 ? .05*support : .015;
      const note: string[] = [];
      for (const skill of skills) {
        const decline = p.age>=declineProfile.startAge ? (skill==='stamina'?.18:skill==='longPotting'?.09:0)*declineProfile.rate : 0;
        const practice = skill===focus ? .10*support : 0;
        const delta = (p.injuryWeeks ? 0 : growth+practice)-decline;
        const before = next.offsets[skill];
        next.offsets[skill] = Math.round(bounded(before+delta,-8,8)*100)/100;
        if (Math.abs(next.offsets[skill]-before)>=.08) note.push(`${skillLabels[skill]} ${next.offsets[skill]>before?'improving':'declining'}`);
      }
      next = { ...next,reviewedMonth:monthLabel(m),focus,history:[...next.history,{month:monthLabel(m),text:note.length ? note.join('; ')+'.' : `Maintaining form; working on ${skillLabels[focus].toLowerCase()}.`}].slice(-12) };
    }
    return {...p,skillDevelopment:next};
  });
  return changed ? {...state,worldPlayers} : state;
}
export function developmentEdge(development?: TourDevelopment) {
  if (!development) return 0;
  return Object.values(development.offsets).reduce((a,b)=>a+b,0)/5;
}
export function applyTourSkills<T extends TourSkills>(profile: T, development?: TourDevelopment): T {
  if (!development) return profile;
  return {...profile,...Object.fromEntries(skills.map(k=>[k,bounded(profile[k]+development.offsets[k],1,99)]))};
}
