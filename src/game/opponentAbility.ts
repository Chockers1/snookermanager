import type { PlayerAttributes } from '../types/game';
import type { GameState } from '../hooks/useGameState';

/** Public ability, stable individual strengths and recorded development; never a circuit seed. */
export function opponentAttributes(player: Pick<GameState['worldPlayers'][number],'id'|'overallRating'|'skillDevelopment'>): PlayerAttributes {
 const rating=player.overallRating??50;
 let hash=7;for(const c of player.id)hash=(Math.imul(hash,31)+c.charCodeAt(0))>>>0;
 const groups={technical:['Long Potting','Break Building','Cue Ball Control','Safety Play','Consistency'],mental:['Composure','Focus','Resilience','Professionalism','Big Match Nerve'],physical:['Stamina','Balance','Shoulder Health','Hand Steadiness','Recovery Rate']} as const;
 const result=Object.fromEntries(Object.entries(groups).map(([group,labels])=>[group,Object.fromEntries(labels.map((label,i)=>[label,rating+((hash>>>(i*4))%7)-3]))])) as PlayerAttributes;
 const weights={technical:.46,mental:.34,physical:.2};
 const mean=Object.entries(result).reduce((n,[g,attrs])=>n+Object.values(attrs).reduce((a,b)=>a+b,0)/5*weights[g as keyof typeof weights],0);
 for(const attrs of Object.values(result))for(const label of Object.keys(attrs))attrs[label]=Math.max(1,Math.min(99,attrs[label]+rating-mean));
 const offsets=player.skillDevelopment?.offsets;
 if(offsets){for(const [group,label,value] of [['technical','Long Potting',offsets.longPotting],['technical','Break Building',offsets.breakBuilding],['technical','Safety Play',offsets.safetyPlay],['mental','Composure',offsets.composure],['physical','Stamina',offsets.stamina]] as const)result[group][label]=Math.max(1,Math.min(99,result[group][label]+value));}
 return result;
}
