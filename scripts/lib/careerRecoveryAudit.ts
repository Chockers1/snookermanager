type CashState = {currentDate:string;season:string;player:{cash:number;age:number};finance:{cashFlow:number;baseCashFlow:number};lastAction:string};
export type DebtEpisode = {startedOn:string;season:string;age:number;minimumCash:number;startingWeeklyNet:number;startingBaseIncome:number;startedAfter:string;recoveredOn:string|null;recoveredAfter:string|null;recoveryWeeklyNet:number|null;days:number};
const daysBetween=(start:string,end:string)=>Math.max(0,Math.round((Date.parse(end)-Date.parse(start))/86400000));
// Re-observing an earlier state around a composite advance can describe the same debt twice.
export function mergeOverlappingDebtEpisodes(episodes:DebtEpisode[]):DebtEpisode[]{
 const result:DebtEpisode[]=[];
 for(const item of [...episodes].sort((a,b)=>a.startedOn.localeCompare(b.startedOn))){
  const previous=result.at(-1);
  const end=previous?.recoveredOn??(previous?new Date(Date.parse(previous.startedOn)+previous.days*86400000).toISOString().slice(0,10):'');
  if(previous&&item.startedOn<end){
   previous.minimumCash=Math.min(previous.minimumCash,item.minimumCash);
   const itemEnd=item.recoveredOn??new Date(Date.parse(item.startedOn)+item.days*86400000).toISOString().slice(0,10);
   if(itemEnd>=end){previous.recoveredOn=item.recoveredOn;previous.recoveredAfter=item.recoveredAfter;previous.recoveryWeeklyNet=item.recoveryWeeklyNet}
   previous.days=daysBetween(previous.startedOn,itemEnd>end?itemEnd:end);
  }else result.push({...item});
 }
 return result;
}
export class CareerRecoveryAudit {
 private episodes:DebtEpisode[]=[];
 private active:DebtEpisode|null=null;
 private samples=0;
 private latestDate='';
 private lowestCash=Number.POSITIVE_INFINITY;
 observe(state:CashState,checkpoint:string){
  if(state.currentDate<this.latestDate)return;
  this.latestDate=state.currentDate;
  this.samples++;this.lowestCash=Math.min(this.lowestCash,state.player.cash);
  if(state.player.cash<0){
   if(!this.active){this.active={startedOn:state.currentDate,season:state.season,age:state.player.age,minimumCash:state.player.cash,startingWeeklyNet:state.finance.cashFlow,startingBaseIncome:state.finance.baseCashFlow,startedAfter:checkpoint+': '+state.lastAction,recoveredOn:null,recoveredAfter:null,recoveryWeeklyNet:null,days:0};this.episodes.push(this.active)}
   this.active.minimumCash=Math.min(this.active.minimumCash,state.player.cash);
   this.active.days=daysBetween(this.active.startedOn,state.currentDate);
  }else if(this.active){
   this.active.recoveredOn=state.currentDate;this.active.recoveredAfter=checkpoint+': '+state.lastAction;this.active.recoveryWeeklyNet=state.finance.cashFlow;this.active.days=daysBetween(this.active.startedOn,state.currentDate);this.active=null;
  }
 }
 summary(){const episodes=mergeOverlappingDebtEpisodes(this.episodes);return {samples:this.samples,lowestCash:Number.isFinite(this.lowestCash)?this.lowestCash:null,episodes,recovered:episodes.filter(e=>e.recoveredOn!==null).length,unresolved:this.active?{...this.active}:null,coverage:'Observed cash transitions and calendar/season checkpoints; internal intermediate mutations inside a composite game action are not sampled.'}}
}
