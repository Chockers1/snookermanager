import type { GameState } from '../hooks/useGameState';
import type { SponsorDeal } from '../types/game';
import { sponsorMarketProfile } from './sponsorMarket';

/** Annual negotiation ceilings follow current exposure; existing payments never
 * change. A successful negotiation cannot compound forever from an old offer. */
export function sponsorRenewalCeiling(state: GameState) {
  const tier=sponsorMarketProfile(state).tier;
  return [0,350,1000,2600,6400,14000][tier];
}
export function sponsorRenewalQuote(state:GameState,sponsor:SponsorDeal,compliance=sponsor.compliance??100) {
  const candidate=Math.round(sponsor.monthlyValue*Math.min(1.18,Math.max(.95,.92+sponsor.brandFit/500+compliance/1000)));
  return Math.min(candidate,sponsorRenewalCeiling(state));
}
export function sponsorWeeklyPayment(sponsors:SponsorDeal[]) {
  // Twelve monthly payments over a 52-week career year, not thirteen.
  return Math.round(sponsors.reduce((n,s)=>n+s.monthlyValue,0)*12/52*100)/100;
}

/** Publicity builds recognition, but cannot create elite reputation without results. */
export function publicityReputationGain(reputation:number,week:number,sponsors:SponsorDeal[]) {
  return week%4===0 && sponsors.some(s=>s.perk==='Publicity') ? Math.min(1,Math.max(0,60-reputation)) : 0;
}
