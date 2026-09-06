import { describe, expect, it } from 'vitest';
import { createStarterState, acceptSponsorState, calculateSponsorMatchBonus, finishSeasonState, startNextSeasonState } from '../hooks/useGameState';
import { reconcileSponsorMarket, sponsorMarketProfile, seasonalSponsorBlocker } from './sponsorMarket';
function fresh(label='World Ranking',rank=18,rep=87) {
  const state=createStarterState();state.worldSeed=12345;state.sponsorMarket=undefined;state.sponsorOffers=[];state.sponsors=[];
  state.player.reputation=rep;state.player.rankingLabel=label;state.player.careerStage=label;
  state.careerSystems.pro.hasTourCard=label==='World Ranking';state.careerSystems.lateCareer.seniorActive=label==='Senior Ranking';
  const row={...state.rankings[0],playerName:state.player.fullName,ranking:rank};state.rankings=[row];
  return state;
}
describe('seasonal sponsor market',()=>{
  it('creates reproducible approaches and never rerolls quotes on repeated refreshes',()=>{
    const first=reconcileSponsorMarket(fresh()),again=reconcileSponsorMarket(fresh());
    expect(first.sponsorOffers).toEqual(again.sponsorOffers);expect(first.sponsorOffers).toHaveLength(6);
    expect(new Set(first.sponsorOffers.map(o=>o.name)).size).toBe(6);
    expect(reconcileSponsorMarket(first)).toBe(first);
    const changed=structuredClone(first);changed.sponsorOffers[0].status='Rejected';changed.sponsorOffers[1].monthlyValue+=250;changed.sponsorOffers[1].negotiationCount=1;
    expect(reconcileSponsorMarket(changed)).toBe(changed);
  });
  it('uses circuit before rank: a youth or Q School number one cannot attract global offers',()=>{
    const youth=reconcileSponsorMarket(fresh('Youth Ranking',1)),school=reconcileSponsorMarket(fresh('Q School Ranking',1)),senior=reconcileSponsorMarket(fresh('Senior Ranking',1)),elite=reconcileSponsorMarket(fresh('World Ranking',1));
    expect(sponsorMarketProfile(youth).tier).toBe(1);expect(sponsorMarketProfile(school).tier).toBe(2);expect(sponsorMarketProfile(senior).tier).toBe(3);expect(sponsorMarketProfile(elite).tier).toBe(5);
    expect(Math.max(...youth.sponsorOffers.map(o=>o.monthlyValue))).toBeLessThan(Math.min(...school.sponsorOffers.map(o=>o.monthlyValue)));
    expect(Math.max(...school.sponsorOffers.map(o=>o.monthlyValue))).toBeLessThan(Math.min(...elite.sponsorOffers.map(o=>o.monthlyValue)));
    expect(sponsorMarketProfile(fresh('World Ranking',1,5)).tier).toBe(1);
  });
  it('rotates companies each season while preserving signed contracts and keeping the market bounded',()=>{
    let state=reconcileSponsorMarket(fresh());
    const contract=createStarterState().sponsors[0];state.sponsors=[{...contract,id:state.sponsorOffers[0].id,name:state.sponsorOffers[0].name,monthlyValue:2222,weeksRemaining:100}];state.sponsorOffers[0].status='Accepted';
    const agreed=structuredClone(state.sponsors);
    for(let year=2027;year<2047;year++){
      const priorIds=state.sponsorMarket!.companyIds;state={...state,season:year+'/'+String(year+1).slice(-2)};state=reconcileSponsorMarket(state);
      expect(state.sponsors).toEqual(agreed);expect(state.sponsorOffers.filter(o=>o.status==='Available')).toHaveLength(6);
      expect(state.sponsorMarket!.companyIds.some(id=>priorIds.includes(id))).toBe(false);
      expect(state.sponsorOffers.length).toBeLessThanOrEqual(7);
      expect(state.sponsorOffers.filter(o=>o.status==='Available').some(o=>o.name===agreed[0].name)).toBe(false);
    }
  });
  it('adds two approaches once when the player reaches a higher sponsor level',()=>{
    let state=reconcileSponsorMarket(fresh('World Ranking',80));const old=structuredClone(state.sponsorOffers);
    state.rankings[0].ranking=18;state=reconcileSponsorMarket(state);
    expect(state.sponsorOffers).toHaveLength(8);expect(state.sponsorOffers.slice(2)).toEqual(old);
    expect(reconcileSponsorMarket(state)).toBe(state);
    state.rankings[0].ranking=80;state=reconcileSponsorMarket(state);state.rankings[0].ranking=18;
    expect(reconcileSponsorMarket(state)).toBe(state);
  });
  it('honours quoted and negotiated terms through signing and blocks expired or no-longer-qualified offers',()=>{
    const state=createStarterState();state.sponsors=[];state.player.reputation=100;
    const offer=state.sponsorOffers.find(o=>o.seasonal)!;offer.monthlyValue+=250;offer.negotiationCount=1;
    const accepted=acceptSponsorState(state,offer.id);
    const contract=accepted.sponsors.find(s=>s.id===offer.id)!;
    expect(contract.monthlyValue).toBe(offer.monthlyValue);
    expect(accepted.sponsorOffers.find(o=>o.id===offer.id)?.negotiationCount).toBe(1);
    const resigned=acceptSponsorState({...accepted,sponsors:[]},offer.id);expect(resigned.sponsors).toHaveLength(0);
    const late={...state,season:'2099/00'};expect(seasonalSponsorBlocker(late,offer)).toContain('expired');expect(acceptSponsorState(late,offer.id).sponsors).toHaveLength(0);
    const demoted={...state,careerSystems:{...state.careerSystems,pro:{...state.careerSystems.pro,hasTourCard:false}},player:{...state.player,rankingLabel:'Youth Ranking',careerStage:'Youth'}};
    expect(seasonalSponsorBlocker(demoted,offer)).toContain('requires');expect(acceptSponsorState(demoted,offer.id).sponsors).toHaveLength(0);
    const bonus=calculateSponsorMatchBonus(contract,state.tournaments[0],{round:'Final',result:'Won',centuries:0,highestBreak:80},18);
    expect(bonus?.amount).toBeGreaterThan(0);
    const nextYear=calculateSponsorMatchBonus(contract,{...state.tournaments[0],startDate:'2027-07-01'},{round:'Final',result:'Won',centuries:0,highestBreak:80},18);
    expect(nextYear?.key).not.toBe(bonus?.key);
    const negotiatedBonus=calculateSponsorMatchBonus({...contract,bonusClause:contract.bonusClause+' · Ranking title +£5,000'},{...state.tournaments[0],rankingType:'World Ranking'},{round:'Final',result:'Won',centuries:0,highestBreak:80},18);
    expect(negotiatedBonus?.amount).toBe(bonus!.amount+5000);
  });
  it('adds the first seasonal cohort to a legacy save without deleting its current offers or contracts',()=>{
    const state=fresh();const legacy={...createStarterState().sponsorOffers[0],id:'legacy-offer',name:'Existing Company',seasonal:undefined,negotiationCount:1};state.sponsorOffers=[legacy];state.sponsors=createStarterState().sponsors;
    const next=reconcileSponsorMarket(state);expect(next.sponsorOffers).toContainEqual(legacy);expect(next.sponsors).toBe(state.sponsors);
    expect(next.inbox.filter(m=>m.id.startsWith('sponsor-market:'+state.season))).toHaveLength(1);
  });
  it('refreshes through real season rollover and keeps that cohort when the review is dismissed',()=>{
    const state=createStarterState();state.currentDate='2027-06-29';state.tournaments=state.tournaments.map(t=>({...t,status:'Skipped'}));
    const previousIds=state.sponsorMarket!.companyIds;
    const finished=finishSeasonState(state);expect(finished.sponsorMarket?.season).toBe('2027/28');
    expect(finished.sponsorMarket!.companyIds.some(id=>previousIds.includes(id))).toBe(false);
    const next=startNextSeasonState(finished);expect(next.sponsorMarket).toEqual(finished.sponsorMarket);expect(next.sponsorOffers).toEqual(finished.sponsorOffers);
  },30000);
});
