import type { GameState } from '../../hooks/useGameState';
import { careerMessage, depthOf } from '../careerDepth/shared';
import type { LifeStory, SeasonLifeState } from './types';
export function lifeOf(s: GameState): SeasonLifeState { return s.careerDepth!.seasonLife!; }
export function putLife(s: GameState, life: SeasonLifeState): GameState { return { ...s, careerDepth: { ...depthOf(s), seasonLife: life } }; }
export function lifeStory(s: GameState, story: LifeStory): GameState {
 const l=lifeOf(s); if(l.stories.some(x=>x.id===story.id)||l.archivedStories?.some(x=>x.id===story.id)) return s;
 const stories=[story,...l.stories],resolved=stories.filter(x=>x.resolved),archived=resolved.slice(60),archivedIds=new Set(archived.map(x=>x.id));
 return careerMessage(putLife(s,{...l,stories:stories.filter(x=>!archivedIds.has(x.id)),archivedStories:[...(l.archivedStories??[]),...archived.map(x=>({id:x.id,title:x.title,date:x.resolved!,text:x.steps.at(-1)?.text??x.defaultText}))]}),story.id,story.title,story.steps[0]?.text ?? story.defaultText);
}
export function storyStep(s: GameState,id:string,text:string,resolved=false): GameState {
 const l=lifeOf(s),story=l.stories.find(x=>x.id===id); if(!story || story.resolved || story.steps.some(x=>x.text===text)) return s;
 const next=putLife(s,{...l,stories:l.stories.map(x=>x.id===id?{...x,steps:[...x.steps,{date:s.currentDate,text}].slice(-3),resolved:resolved?s.currentDate:undefined}:x)});
 return careerMessage(next,id+':'+story.steps.length,story.title,text);
}
export function settleLifeMoney(s:GameState,id:string,amount:number,description:string):GameState {
 if(!amount || s.finance.ledger.some(x=>x.id===id))return s;
 return {...s,player:{...s.player,cash:s.player.cash+amount},finance:{...s.finance,ledger:[{id,date:s.currentDate,description,amount:Math.abs(amount),type:amount>0?'Income':'Expense',category:amount>0?'Other':'Training'},...s.finance.ledger]}};
}
