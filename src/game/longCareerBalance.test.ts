import {sponsorMarketProfile} from './sponsorMarket';
import {sponsorOfferCatalog,createPlayerIdentitySeed,createPlayerSliderCatalog,createPlayerBackgroundCatalog,tableSetupCatalog} from '../data/gameContent';
import {recurringCost} from './careerDepth/seasonPlanning';
import {createNewCareerState,updateBudgetTargetsState} from '../hooks/useGameState';
import {buildFinanceData} from '../utils/liveRouteData';
import {careerLegacyOf} from './careerLegacy';
import {describe,expect,it} from 'vitest';
import {createStarterState,scheduleTreatmentState,renewSponsorState,renegotiateSponsorState} from '../hooks/useGameState';
import {backgroundWeeklySupport,careerDifficulty} from './careerDifficulty';
import {publicityReputationGain,sponsorRenewalCeiling,sponsorRenewalQuote,sponsorWeeklyPayment} from './sponsorEconomy';
import {applySeasonalAgeRegression} from './playerAgeing';
describe('long career finances and recovery',()=>{
 it('tapers support without taxing winnings and restores it when reserves fall',()=>{
  const s=createStarterState();s.finance.baseCashFlow=200;
  for(const [cash,support] of [[-500,200],[25000,200],[62500,100],[100000,0],[40000000,0]]){
   s.player.cash=cash;expect(backgroundWeeklySupport(s)).toBe(support);expect(s.player.cash).toBe(cash);
  }
  s.player.cash=10000;expect(backgroundWeeklySupport(s)).toBe(200);
  s.finance.baseCashFlow=-120;s.player.cash=40000000;expect(backgroundWeeklySupport(s)).toBe(-120);
 });

 it.each([['start-club-junior',12],['start-national-youth',15],['start-elite-amateur',18],['start-q-tour',21],['start-rookie-pro',30],['start-top-64',40],['start-masters',50]] as const)('starts %s with only offers from its current tour market', (startingLevelId,age)=>{
  const s=createNewCareerState({fullName:'Market Test',nationality:'ENG',age,handedness:'Right-handed',cueStyle:createPlayerIdentitySeed.cueStyle,playingStyle:createPlayerIdentitySeed.playingStyle,personalityArchetype:createPlayerIdentitySeed.personalityArchetype,sliders:createPlayerSliderCatalog.map(x=>({...x})),backgroundId:createPlayerBackgroundCatalog[0].id,startingLevelId});
  expect(s.sponsorOffers.length).toBeGreaterThan(0);
  expect(s.sponsorOffers.every(o=>o.seasonal?.season===s.season)).toBe(true);
  expect(s.sponsorOffers.every(o=>(o.seasonal?.requiredTier??99)<=sponsorMarketProfile(s).tier)).toBe(true);
  expect(s.sponsors).toEqual([]);
 });
 it('caps refreshed legacy offers at current exposure and keeps signed terms',()=>{
  let s=createStarterState();s.sponsorOffers=sponsorOfferCatalog.map(o=>({...o,status:'Available' as const,negotiationCount:0,notes:[]}));s.player.reputation=100;s.player.rankingLabel='Senior Ranking';s.careerSystems.pro.hasTourCard=false;s.careerSystems.lateCareer.seniorActive=true;
  s.rankings=[{...s.rankings[0],playerName:s.player.fullName,ranking:1}];s.sponsors=[{...s.sponsors[0],monthlyValue:9999}];
  s=updateBudgetTargetsState(s,{});
  const legacy=s.sponsorOffers.filter(o=>!o.seasonal&&o.status==='Available');expect(legacy.length).toBeGreaterThan(0);
  for(const offer of legacy){expect(offer.monthlyValue).toBeLessThanOrEqual(sponsorRenewalCeiling(s));expect(offer.note).not.toContain('World number one');}
  expect(s.sponsors[0].monthlyValue).toBe(9999);
 });

 it('does not turn treatment into permanent attributes or allow repeat immediate recovery',()=>{
  const s=createStarterState();s.player.fatigue=65;s.player.cash=10000;
  const treated=scheduleTreatmentState(s,'treat-2');expect(treated.attributes).toEqual(s.attributes);expect(treated.player.fatigue).toBeLessThan(s.player.fatigue);
  const again=scheduleTreatmentState(treated,'treat-1');expect(again.player).toEqual(treated.player);expect(again.lastAction).toContain('already underway');
  const reloaded=JSON.parse(JSON.stringify(treated));expect(scheduleTreatmentState(reloaded,'treat-2').player).toEqual(treated.player);
 });
 it('caps new commercial terms after card loss without cutting the existing contract',()=>{
  const s=createStarterState();s.careerSystems.pro.hasTourCard=false;s.player.rankingLabel='Amateur Ranking';s.careerSystems.lateCareer.seniorActive=false;s.player.reputation=100;
  const sponsor={...s.sponsors[0],monthlyValue:20000,renewalStatus:'Offered' as const,renewalOfferValue:23000};s.sponsors=[sponsor];
  expect(sponsorRenewalQuote(s,sponsor)).toBeLessThanOrEqual(1000);expect(s.sponsors[0].monthlyValue).toBe(20000);
  const renewed=renewSponsorState(s,sponsor.id);expect(renewed.sponsors[0].monthlyValue).toBe(sponsorRenewalCeiling(s));
  const negotiated=renegotiateSponsorState(s,sponsor.id),again=renegotiateSponsorState(negotiated,sponsor.id);
  expect(again.sponsors[0].renewalOfferValue).toBe(negotiated.sponsors[0].renewalOfferValue);
  s.careerSystems.lateCareer.retired=true;expect(sponsorRenewalQuote(s,sponsor)).toBe(0);expect(renewSponsorState(s,sponsor.id).sponsors[0].monthlyValue).toBe(20000);
 });
 it('caps passive publicity at 60 without reducing earned reputation or agreed payments',()=>{
  const sponsor={...createStarterState().sponsors[0],perk:'Publicity' as const,monthlyValue:500};
  let reputation=20;
  for(let week=1;week<=52*30;week++)reputation+=publicityReputationGain(reputation,week,[sponsor]);
  expect(reputation).toBe(60);expect(publicityReputationGain(59.7,4,[sponsor])).toBeCloseTo(.3);
  expect(publicityReputationGain(95,4,[sponsor])).toBe(0);expect(publicityReputationGain(20,3,[sponsor])).toBe(0);
  expect(sponsor.monthlyValue).toBe(500);
 });
 it('pays twelve monthly sponsorship amounts across a year',()=>{
  const s=createStarterState();s.sponsors=[{...s.sponsors[0],monthlyValue:5200}];expect(sponsorWeeklyPayment(s.sponsors)*52).toBe(62400);
 });
 it('charges twelve monthly facility rents and keeps the planner in agreement',()=>{
  const s=createStarterState();const free=tableSetupCatalog[0];const paid=tableSetupCatalog.find(t=>t.monthlyRental!==free.monthlyRental)!;
  s.equipment.currentTableId=free.id;const before=updateBudgetTargetsState(s,{});const after=updateBudgetTargetsState({...before,equipment:{...before.equipment,currentTableId:paid.id}},{});
  const weekly=Math.round(paid.monthlyRental*12/52*100)/100-Math.round(free.monthlyRental*12/52*100)/100;
  expect(before.finance.cashFlow-after.finance.cashFlow).toBeCloseTo(weekly,2);
  expect(recurringCost(after)-recurringCost(before)).toBeCloseTo(weekly,2);
 });
 it('makes difficulty prospective and financial, with neutral legacy defaults',()=>{
  const s=createStarterState();s.finance.baseCashFlow=200;s.player.cash=10000;delete s.difficulty;
  expect(backgroundWeeklySupport(s)).toBe(200);expect(careerDifficulty(s).label).toBe('Standard');
  expect(backgroundWeeklySupport({...s,difficulty:'relaxed'})).toBe(300);expect(backgroundWeeklySupport({...s,difficulty:'demanding'})).toBe(150);
  s.finance.baseCashFlow=-100;for(const difficulty of ['relaxed','standard','demanding'] as const)expect(backgroundWeeklySupport({...s,difficulty})).toBe(-100);
  s.careerSystems.lateCareer.retired=true;for(const difficulty of ['relaxed','standard','demanding'] as const)expect(backgroundWeeklySupport({...s,difficulty})).toBe(0);
 });
 it('allows gradual decline without exhausting the lowest physical attributes first',()=>{
  const s=createStarterState();let attrs=s.attributes;for(const group of Object.values(attrs))for(const key of Object.keys(group))group[key]=90;
  for(let age=40;age<=65;age++)attrs=applySeasonalAgeRegression(attrs,age,{startAge:40,rate:.88});
  expect(Math.min(...Object.values(attrs.physical))).toBeGreaterThan(10);
  expect(Math.max(...Object.values(attrs.physical))-Math.min(...Object.values(attrs.physical))).toBeLessThan(25);
 });
 it('keeps lifetime winnings out of monthly projections and counts recurring cash flow once',()=>{
  const s=createStarterState();const before=buildFinanceData(s);
  s.history.legacy={...careerLegacyOf(s),prizeMoney:40000000};
  const after=buildFinanceData(s);
  expect(after.incomeBreakdown).toEqual(before.incomeBreakdown);
  expect(after.expenseBreakdown).toEqual(before.expenseBreakdown);
  expect(after.forecastCards[0].projectedBalance).toBeCloseTo(s.player.cash+s.finance.cashFlow*52/12,2);
  const net=after.incomeBreakdown.reduce((n,r)=>n+r.value,0)-after.expenseBreakdown.reduce((n,r)=>n+r.value,0);
  expect(net).toBeCloseTo(s.finance.cashFlow*52/12,0);
 });

});
