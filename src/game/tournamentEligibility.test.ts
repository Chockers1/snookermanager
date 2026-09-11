import { describe, expect, it } from 'vitest';
import { createStarterState, getTournamentEntryAccess } from '../hooks/useGameState';
import { tournamentEligibility } from './tournamentEligibility';
import { rankingEventKey } from './rollingRankings';
import type { Tournament } from '../types/game';

const eventOf = (name: string, type: Tournament['type']): Tournament => ({ ...createStarterState().tournaments[0], id: name, name, type, startDate: '2030-01-10', endDate: '2030-01-15', status: 'Available' as const, formatId: undefined, seedingCutoffDate: '2030-01-03' });
describe('visible tournament entry criteria', () => {
 it('explains mixed youth levels and the exact age date', () => {
  const s=createStarterState(), t=eventOf('Summer Junior Club League','Junior'), c=tournamentEligibility(s,t);
  expect(c.field).toContain('Under-21');expect(c.selection).toContain('Q Tour');expect(c.selection).toContain('stronger eligible players');
  expect(c.restrictions.join(' ')).toContain('2030-01-10');expect(c.restrictions.join(' ')).toContain('younger than 21');
 });
 it.each([['Players Championship',16],['World Grand Prix',32],['Tour Championship',12]])('uses the one-year list for %s', (name,limit)=>{
  const s=createStarterState(),t=eventOf(name,'Ranking');
  s.careerSystems.pro.hasTourCard=true;
  s.rollingRankings!.seedings[rankingEventKey(t)]={date:'2030-01-03',world:{[s.player.fullName]:21},oneYear:{[s.player.fullName]:8}};
  const c=tournamentEligibility(s,t);expect(c.field).toBe(`Top ${limit} · One-Year Ranking`);expect(c.yourSelection).toContain('One-Year Ranking #8');expect(c.status).toBe('Meets entry rules currently');
 });
 it('uses the locked world top 16 for Masters even with a high one-year rank',()=>{
  const s=createStarterState(),t=eventOf('Masters','Invitational');s.careerSystems.pro.hasTourCard=true;
  s.rollingRankings!.seedings[rankingEventKey(t)]={date:'2030-01-03',world:{[s.player.fullName]:21},oneYear:{[s.player.fullName]:8}};
  expect(tournamentEligibility(s,t).field).toBe('Top 16 · World Ranking');expect(getTournamentEntryAccess(s,t).allowed).toBe(false);
  s.rollingRankings!.seedings[rankingEventKey(t)].world[s.player.fullName]=16;
  expect(getTournamentEntryAccess(s,t).allowed).toBe(true);
 });
 it.each(['World Championship','UK Championship'])('includes qualifiers rather than describing %s as top-16-only',(name)=>{
  const c=tournamentEligibility(createStarterState(),eventOf(name,'Major'));expect(c.field).toContain('successful qualifiers');expect(c.selection).toContain('not top-16-only');
 });
 it('distinguishes pro-ams, senior fields and Q School citizenship',()=>{
  const s=createStarterState();expect(tournamentEligibility(s,eventOf('Pro-Am Challenge','Amateur')).field).toContain('professional');
  expect(tournamentEligibility(s,eventOf('World Seniors Championship','Senior')).field).toContain('40+');
  expect(tournamentEligibility(s,eventOf('Asia-Oceania Q School Event 1','Q School')).restrictions.join(' ')).toContain('Asian/Oceanian citizenship');
 });
 it('shows changing access without mutating the save or creating entry',()=>{
  const s=createStarterState(), t=eventOf('Summer Junior Club League','Junior'), before=JSON.stringify(s);
  tournamentEligibility(s,t);expect(JSON.stringify(s)).toBe(before);
  t.status='Entered';expect(tournamentEligibility(s,t).status).toBe('Entry secured');
 });
});
