import {tableSetupCatalog} from '../data/gameContent';
import {recurringCost} from './careerDepth/seasonPlanning';
import {updateBudgetTargetsState} from '../hooks/useGameState';
import {buildFinanceData} from '../utils/liveRouteData';
import {careerLegacyOf} from './careerLegacy';
import {describe,expect,it} from 'vitest';
import {createStarterState,scheduleTreatmentState,renewSponsorState,renegotiateSponsorState} from '../hooks/useGameState';
import {backgroundWeeklySupport,careerDifficulty} from './careerDifficulty';
import {sponsorRenewalCeiling,sponsorRenewalQuote,sponsorWeeklyPayment} from './sponsorEconomy';
import {applySeasonalAgeRegression} from './playerAgeing';
describe('long career finances and recovery',()=>{
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
  const s=createStarterState();s.finance.baseCashFlow=200;delete s.difficulty;
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
