import type { GameState, FinanceTransaction } from '../hooks/useGameState';
import type { Tournament } from '../types/game';
import { detailedTournamentCatalog } from '../data/pathwayCalendarData';
import { scheduledPlacementPrize, tournamentPrizeSchedule, withTournamentPrizes } from '../data/tournamentPrizes';
import { recordRankingEvent, rebuildRollingRankings, isAttachedQualifying, qualifiedNames, countsForWorldRanking } from './rollingRankings';
import { financialReportForMessage, financialSummary, reportMoney } from './eventFinancialReport';

export type PayoutRepair = { version:1; date:string; events:number; credits:number; cashAdjustment:number; unresolved:string[]; adjustments:Array<{key:string;name:string;season:string;before:number;after:number}> };
type Award = (t:Tournament,round:string,champion:boolean)=>{prizeMoney:number;rankingPoints:number};
const oldFunds:Record<string,number> = {'Shanghai Masters':825000,'Saudi Arabia Masters':2200000,'Wuhan Open':700000,'English Open':550000,'English Open Qualifying':80000,'British Open':550000,"Xi'an Grand Prix":850000,'Northern Ireland Open':550000,'International Championship Qualifying':90000,'International Championship':825000,'Champion of Champions':500000,'Riyadh Season Championship':600000,'UK Championship Qualifying':1000000,'UK Championship':1200000,'Shoot Out':175000,'Scottish Open':550000,'Masters':800000,'German Masters':480000,'World Grand Prix':480000,'Welsh Open Qualifying':85000,'Players Championship':520000,'Welsh Open':550000,'World Open Qualifying':90000,'World Open':850000,'Tour Championship':900000,'World Championship Qualifying':2500000,'World Championship':2500000};
function oldPrize(t:Tournament,round:string,champion:boolean) {
  if(champion && isAttachedQualifying(t)) return 0;
  const fund=oldFunds[t.name]??t.prizeMoney;
  return champion?Math.round(fund*.5):/\bfinal\b/i.test(round)&&!/semi|quarter|section/i.test(round)?Math.round(fund*.22):/semi.?final/i.test(round)?Math.round(fund*.08):/quarter.?final/i.test(round)?Math.round(fund*.03):0;
}
const money=(n:number)=>Math.round(n*100)/100;
/** One-time reconciliation from recorded finishes only. Never resimulate a draw. */
export function repairTournamentPayouts(input:GameState,award:Award):GameState {
  if(input.payoutRepair?.version===1) return input;
  let state=structuredClone(input);
  const report:PayoutRepair={version:1,date:state.currentDate,events:0,credits:0,cashAdjustment:0,unresolved:[],adjustments:[]};
  const oldEvents=Object.values(state.rollingRankings?.events??{});
  const correctedKeys=new Set<string>();
  const cpuDeltas=new Map<string,Map<string,number>>();
  const oneYearCpuDeltas=new Map<string,number>();
  const addCpu=(name:string,season:string,delta:number,ranking:boolean)=>{
    if(name===state.player.fullName || !delta) return;
    if(ranking && season===state.season) oneYearCpuDeltas.set(name,money((oneYearCpuDeltas.get(name)??0)+delta));
    const rows=cpuDeltas.get(name)??new Map<string,number>(); rows.set(season,money((rows.get(season)??0)+delta));cpuDeltas.set(name,rows);
  };
  for(const event of oldEvents) {
    if(event.prizeVersion===1 || !tournamentPrizeSchedule(event)) continue;
    const template=state.tournaments.find(t=>t.id===event.tournamentId)??detailedTournamentCatalog.find(t=>t.id===event.tournamentId);
    if(!template || !event.bracket.length) { report.unresolved.push(event.name+' '+event.season+': full draw unavailable'); continue; }
    if(event.bracket.some(r=>r.matches.some(m=>!m.placeholder && (typeof m.top.score!=='number'||typeof m.bottom.score!=='number')))) {report.unresolved.push(event.name+' '+event.season+': draw incomplete');continue;}
    const t=withTournamentPrizes({...template,name:event.name,startDate:event.key.slice(-10),endDate:event.completedOn});
    const finishes=new Map<string,{round:string;champion:boolean}>();
    for(const round of event.bracket) for(const match of round.matches) {
      if(typeof match.top.score!=='number'||typeof match.bottom.score!=='number'||match.top.score===match.bottom.score||match.placeholder) continue;
      const winner=match.top.score>match.bottom.score?match.top.name:match.bottom.name;
      const loser=match.top.score>match.bottom.score?match.bottom.name:match.top.name;
      finishes.set(loser,{round:round.label,champion:false});
      if(round.label==='Final') finishes.set(winner,{round:round.label,champion:true});
    }
    const qualified=isAttachedQualifying(t)?new Set(qualifiedNames(event.bracket)):new Set<string>();
    if([...finishes.values()].some(f=>scheduledPlacementPrize(t,f.round,f.champion)===undefined)) { report.unresolved.push(event.name+' '+event.season+': legacy round labels unavailable');continue; }
    const ledger=state.rollingRankings!;
    const oldEarnings=ledger.earnings.filter(e=>e.eventKey===event.key);
    const { [event.key]:removed, ...events }=ledger.events; void removed;
    const rebuilt=recordRankingEvent({...state,season:event.season,rollingRankings:{...ledger,legacyEventKeys:ledger.legacyEventKeys.filter(k=>k!==event.key),earnings:ledger.earnings.filter(e=>e.eventKey!==event.key),events}},t,event.bracket,award).rollingRankings!;
    const newEarnings=rebuilt.earnings.filter(e=>e.eventKey===event.key).map(e=>{
      const old=oldEarnings.find(o=>o.playerName===e.playerName);
      if(!old || old.amount!==e.amount) report.credits++;
      // Preserve publication and expiry choices; the correction changes awards.
      return old?{...e,earnedOn:old.earnedOn,expiresOn:old.expiresOn,fixedExpiry:old.fixedExpiry}:e;
    });
    const prizes=rebuilt.events[event.key].prizeAwards!;
    for(const [name,finish] of finishes) addCpu(name,event.season,(prizes[name]??0)-(qualified.has(name)?0:event.prizeAwards?.[name]??oldPrize(t,finish.round,finish.champion)),countsForWorldRanking(t));
    state={...state,rollingRankings:{...ledger,earnings:[...ledger.earnings.filter(e=>e.eventKey!==event.key),...newEarnings],events:{...ledger.events,[event.key]:{...event,prizeAwards:prizes,prizeVersion:1}}}};
    correctedKeys.add(event.key);
  }
  const changes=new Map<string,{prize:number;credit:number;delta:number;season:string;round:string;date:string;ranking:boolean}>();
  for(const h of state.history.tournamentHistory) {
    if(h.status!=='Completed'||!h.matchesPlayed||h.result==='Completed') continue;
    const template=state.tournaments.find(t=>t.id===h.tournamentId)??detailedTournamentCatalog.find(t=>t.id===h.tournamentId);
    if(!template || !tournamentPrizeSchedule({name:h.tournamentName})) continue;
    const key=h.tournamentId+':'+h.startDate;
    const event=state.rollingRankings?.events[key];
    if(event?.prizeVersion===1 && !correctedKeys.has(key)) continue;
    // Recovered ranking entries alone are not cash receipts. A retained complete
    // draw supports the same legacy award reconstruction used for CPU players.
    if(h.recoveredFromLedger && !correctedKeys.has(key)) {report.unresolved.push(h.tournamentName+' '+h.season+': original cash receipt unavailable');continue;}
    const round=h.roundResults?.at(-1)?.round??h.canonicalResult?.roundReached??h.result.replace(/^Lost in /,'');
    const t=withTournamentPrizes({...template,name:h.tournamentName});
    const prize=scheduledPlacementPrize(t,round,h.result==='Winner');
    if(prize===undefined) {report.unresolved.push(h.tournamentName+' '+h.season+': finishing stage unavailable');continue;}
    const earning=state.rollingRankings?.earnings.find(e=>e.eventKey===key&&e.playerName===state.player.fullName);
    // Without a retained whole-tour draw, do not inject a human-only ranking fix.
    const credit=correctedKeys.has(key)?earning?.amount??0:h.rankingPoints;
    const oldEvent=oldEvents.find(e=>e.key===key);
    const paidBefore=h.recoveredFromLedger?(oldEvent?.prizeAwards?.[state.player.fullName]??oldPrize(t,round,h.result==='Winner')):h.prizeMoney;
    const delta=money(prize-paidBefore);
    changes.set(key,{prize,credit,delta,season:h.season,round,date:state.history.matchLog.find(m=>m.tournamentId===h.tournamentId&&m.season===h.season&&m.round===round)?.date??h.endDate??h.startDate,ranking:countsForWorldRanking(t)});
    if(delta || credit!==h.rankingPoints) report.adjustments.push({key,name:h.tournamentName,season:h.season,before:paidBefore,after:prize});
    report.cashAdjustment=money(report.cashAdjustment+delta);
    if(!event) report.unresolved.push(h.tournamentName+' '+h.season+': opening/legacy ranking estimate retained');
  }
  const bySeason=(season:string)=>[...changes.values()].filter(c=>c.season===season).reduce((n,c)=>n+c.delta,0);
  const oneYearHumanDelta=[...changes.values()].filter(c=>c.season===state.season&&c.ranking).reduce((n,c)=>n+c.delta,0);
  const seasonPrize=<T extends {season:string;prizeMoney:number}>(s:T):T=>({...s,prizeMoney:money(s.prizeMoney+bySeason(s.season))});
  const total=report.cashAdjustment;
  const cash=money(state.player.cash+total);
  const legacy=state.history.legacy;
  const hKey=(h:{tournamentId:string;season:string})=>state.history.tournamentHistory.find(e=>e.tournamentId===h.tournamentId&&e.season===h.season);
  const matchChange=(m:{tournamentId:string;season?:string;round:string})=>{
    const h=hKey({...m,season:m.season??state.season});const c=h&&changes.get(h.tournamentId+':'+h.startDate);
    return c?.round===m.round?c:undefined;
  };
  const transactions:FinanceTransaction[]=report.adjustments.filter(a=>a.before!==a.after).map(a=>({id:'prize-repair-v1:'+a.key,date:state.currentDate,description:`Prize correction: ${a.name} (${a.season}) · ${reportMoney(a.before)} → ${reportMoney(a.after)}`,category:'Prize correction',type:a.after>a.before?'Income':'Expense',amount:Math.abs(a.after-a.before)}));
  state={...state,player:{...state.player,cash},finance:{...state.finance,cash,ledger:[...transactions,...state.finance.ledger]},
    tournaments:state.tournaments.map(withTournamentPrizes),
    seasonReview:state.seasonReview?{...state.seasonReview,completedSeason:seasonPrize(state.seasonReview.completedSeason)}:state.seasonReview,
    matches:state.matches.map(m=>{const c=matchChange(m);return c?{...m,prizeMoneyEarned:c.prize,rankingPointsGained:c.credit}:m;}),
    history:{...state.history,
      legacy:legacy?{...legacy,prizeMoney:money(legacy.prizeMoney+total),trophies:legacy.trophies.map(t=>{const h=hKey(t);const c=h&&changes.get(h.tournamentId+':'+h.startDate);return c?{...t,prizeMoney:c.prize}:t;})}:undefined,
      matchLog:state.history.matchLog.map(m=>{const c=matchChange(m);return c?{...m,prizeMoney:c.prize,rankingPoints:c.credit}:m;}),
      tournamentHistory:state.history.tournamentHistory.map(h=>{const c=changes.get(h.tournamentId+':'+h.startDate);return c?{...h,prizeMoney:c.prize,rankingPoints:c.credit,recoveredFromLedger:h.recoveredFromLedger?{prizeKnown:true}:undefined,canonicalResult:h.canonicalResult?{...h.canonicalResult,prizeMoney:c.prize,rankingPoints:c.credit}:undefined}:h;}),
      seasonRecords:state.history.seasonRecords.map(seasonPrize),
      snapshots:state.history.snapshots.map(s=>({...s,totalPrizeMoney:money(s.totalPrizeMoney+[...changes.values()].filter(c=>c.date<=s.date).reduce((n,c)=>n+c.delta,0))})),
    },
    competitionTables:{...state.competitionTables,...Object.fromEntries(['world','oneYear'].map(key=>[key,state.competitionTables[key as 'world'|'oneYear'].map(r=>{
      const deltas=cpuDeltas.get(r.playerName);const delta=r.playerName===state.player.fullName?(key==='world'?total:oneYearHumanDelta):key==='world'?[...(deltas?.values()??[])].reduce((a,b)=>a+b,0):oneYearCpuDeltas.get(r.playerName)??0;
      return {...r,prizeMoney:money(Math.max(0,r.prizeMoney+delta))};
    })]))},
    worldPlayers:state.worldPlayers.map(p=>{const ds=p.playerName===state.player.fullName?new Map(state.history.seasonRecords.map(s=>[s.season,bySeason(s.season)])):cpuDeltas.get(p.playerName);const archived=[...(ds?.entries()??[])].filter(([season])=>season!==state.season).reduce((n,[,d])=>n+d,0);return {...p,totalPrizeMoney:money(Math.max(0,p.totalPrizeMoney+archived)),seasons:p.seasons.map(s=>({...s,prizeMoney:money(Math.max(0,s.prizeMoney+(ds?.get(s.season)??0)))}))};}),
  };
  // Ranking revisions store positions, not the expired money needed to reconstruct
  // historical lists. Retain locked draws/seedings, start a corrected list today.
  if(correctedKeys.size && state.rollingRankings) state=rebuildRollingRankings({...state,rollingRankings:{...state.rollingRankings,revisions:[]}},state.currentDate,true);
  state={...state,inbox:state.inbox.map(original=>{
    const message=original.seasonReport?{...original,seasonReport:{...original.seasonReport,record:seasonPrize(original.seasonReport.record)}}:original;
    const finance=financialReportForMessage(state,message); if(!finance) return message;
    const key=finance.tournamentId+':'+finance.startDate;const c=changes.get(key);
    const updated=c?{...finance,prize:c.prize,income:c.prize+finance.sponsor,net:c.prize+finance.sponsor-finance.costs}:finance;
    const earning=state.rollingRankings?.earnings.find(e=>e.eventKey===key&&e.playerName===state.player.fullName);
    return {...message,eventFinance:updated,eventRanking:message.eventRanking?{...message.eventRanking,credit:earning?.amount??message.eventRanking.credit,before:undefined,after:undefined}:undefined,
      victoryReport:message.victoryReport?{...message.victoryReport,prize:updated.prize,credit:earning?.amount??message.victoryReport.credit}:undefined,
      summary:message.summary?[...message.summary.filter(s=>!['Prize money','Sponsor bonus','Event costs','Net finances'].includes(s.label)),...financialSummary(updated)]:undefined};
  })};
  report.events=correctedKeys.size;report.unresolved=[...new Set(report.unresolved)];
  state.payoutRepair=report;
  if(report.events || report.adjustments.length) state.inbox=[{id:'payout-repair-v1',sender:'Tournament Office',subject:'Prize awards and rankings corrected',date:state.currentDate,priority:'High',read:false,
    preview:`Corrected ${report.events} recorded event draws for every player. Your net cash adjustment is ${total>=0?'+':'−'}${reportMoney(Math.abs(total))}. Prize corrections include missing payments and overpayments. Original match results and locked draws remain recorded. ${report.unresolved.length} older event records could not be fully reconciled; opening estimates remain. Earlier ranking movements cannot be reconstructed from incomplete expired ledgers.`,
    actionLabel:'View corrected rankings',actionRoute:'/rankings',summary:report.adjustments.map(a=>({label:a.name+' · '+a.season,value:reportMoney(a.after),detail:`Previous award ${reportMoney(a.before)} · adjustment ${a.after-a.before>=0?'+':'−'}${reportMoney(Math.abs(a.after-a.before))}`,tone:a.after>=a.before?'positive' as const:'negative' as const})).concat(report.unresolved.map(detail=>({label:'Older record needs review',value:'Not fully reconciled',detail,tone:'negative' as const})))},...state.inbox];
  return state;
}
