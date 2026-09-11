import {recommendSeason} from './careerDepth/seasonPlanning';
import {describe,it,expect} from 'vitest';
import {createStarterState,repairGameState,getTournamentEntryAccess,withdrawTournamentState,evolveWorldPlayersForNextSeason} from '../hooks/useGameState';
function veteran(){
 const s=createStarterState();s.player.age=83;s.player.rankingLabel='Senior Ranking';s.player.worldRanking=999;
 s.careerSystems.pro={...s.careerSystems.pro,hasTourCard:false,worldRank:999,yearsRemaining:0};s.careerSystems.lateCareer.retired=false;
 s.tournaments=s.tournaments.map(t=>({...t,status:'Available'}));
 s.competitionTables.world=s.competitionTables.world.filter(r=>r.playerName!==s.player.fullName);s.competitionTables.oneYear=s.competitionTables.oneYear.filter(r=>r.playerName!==s.player.fullName);
 return s;
}
describe('permanent retirement and existing entries',()=>{
 it('waits for booked competition, then retires permanently across repeated reloads',()=>{
  const s=veteran(),event=s.tournaments.find(t=>t.type==='Senior')!;event.status='Entered';
  const waiting=withdrawTournamentState(s,'missing-event');expect(waiting.careerSystems.lateCareer.retired).toBe(false);
  expect(waiting.careerSystems.lateCareer.retirementPending).toBe(true);
  expect(getTournamentEntryAccess(waiting,{...event,status:'Available'}).reason).toContain('Retirement follows');
  const finished=withdrawTournamentState(waiting,event.id);
  expect(finished.careerSystems.lateCareer.retired).toBe(true);
  const reloaded=withdrawTournamentState(repairGameState({...finished,player:{...finished.player,rankingLabel:'Retired'},competitionTables:{...finished.competitionTables,senior:[]}}),'missing-event');
  expect(reloaded.careerSystems.lateCareer.retired).toBe(true);
  expect(reloaded.player.cash).toBe(finished.player.cash);expect(reloaded.attributes).toEqual(finished.attributes);
  expect(reloaded.worldPlayers.find(p=>p.playerName===s.player.fullName)?.retired).toBe(true);
  const next=evolveWorldPlayersForNextSeason(reloaded.worldPlayers,reloaded.competitionTables,{...reloaded.player,age:84},false,reloaded.careerSystems.pro,2027);
  expect(next.find(p=>p.playerName===s.player.fullName)?.retired).toBe(true);
 });
 it('honours a started legacy entry but rejects new entry after retirement',()=>{
  const s=veteran(),event=s.tournaments.find(t=>t.type==='Senior')!;s.careerSystems.lateCareer.retired=true;event.status='Entered';
  s.history.tournamentHistory=[{...s.history.tournamentHistory[0],tournamentId:event.id,startDate:event.startDate,matchesPlayed:2}] as typeof s.history.tournamentHistory;
  expect(getTournamentEntryAccess(s,event).allowed).toBe(true);
  expect(getTournamentEntryAccess(s,{...event,status:'Available'})).toMatchObject({allowed:false,reason:'This player is retired from competitive events.'});
  const unrelated={...event,startDate:'2099-01-01'};expect(getTournamentEntryAccess(s,unrelated).allowed).toBe(false);
  expect(recommendSeason(s).find(r=>r.event.name==='World Championship')?.blockedReason).toContain('retired');
 });
 it('allows an unplayed legacy entry to be withdrawn without inventing a result',()=>{
  const s=veteran(),event=s.tournaments.find(t=>t.type==='Senior')!;event.status='Entered';s.careerSystems.lateCareer.retired=true;
  const withdrawn=withdrawTournamentState(s,event.id);
  expect(withdrawn.tournaments.find(t=>t.id===event.id)?.status).toBe('Available');expect(withdrawn.matches).toEqual(s.matches);
  expect(withdrawn.careerSystems.lateCareer.retired).toBe(true);
 });
});
