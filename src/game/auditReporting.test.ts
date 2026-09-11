import {describe,it,expect} from 'vitest';
import {repairAuditTournamentFlags} from '../utils/auditTournamentFlags';
type Row=Parameters<typeof repairAuditTournamentFlags>[0];
const row=(result:string,type='Invitational')=>({result,type,name:'Championship League Invitational',levelBucket:'invitationals',isQualifier:false,isRankingEvent:false,isWorldMainDraw:false,titleAwarded:true,countedInTotalTitleRecord:true,countedInMajorTitleRecord:true,canonicalResult:{roundReached:result,resultLabel:result,isTitle:true}} as Row);
describe('audit result classification',()=>{
 it('repairs stale winner flags without treating Winners Group as a title',()=>{
  expect([row('Eliminated in Winners Group'),row('Eliminated in Winners Group Semi Final'),row('Winner')].map(repairAuditTournamentFlags).map(t=>t.countedInTotalTitleRecord)).toEqual([false,false,true]);
 });
 it('uses the game major class and excludes qualification from trophy totals',()=>{
  const qualifier={...row('Winner','Major'),isQualifier:true,levelBucket:'qSchool'} as Row;
  const summary=[row('Winner'),row('Winner','Major'),qualifier].map(repairAuditTournamentFlags);
  expect(summary.map(t=>t.countedInTotalTitleRecord)).toEqual([true,true,false]);expect(summary.map(t=>t.countedInMajorTitleRecord)).toEqual([false,true,false]);
 });
});
