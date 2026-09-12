import {describe,it,expect} from 'vitest';
import {createStarterState,getTournamentEntryAccess} from '../hooks/useGameState';
import {rankingEventKey} from './rollingRankings';
import {reviewLockedAuditEntry} from '../../scripts/auditEntryReview';
function fixture(rank=17){
 const s=createStarterState();s.currentDate='2051-03-31';s.season='2050/51';s.careerDepth={...s.careerDepth!,stories:[]};
 const main={...s.tournaments.find(t=>t.formatId==='worldChampionshipMain')!,startDate:'2051-04-18',endDate:'2051-05-04',status:'Entered' as const,seedingCutoffDate:'2051-03-31'};
 const qual={...s.tournaments.find(t=>t.formatId==='worldChampionshipQualifying')!,startDate:'2051-04-07',endDate:'2051-04-16',status:'Available' as const,seedingCutoffDate:'2051-03-31'};
 s.tournaments=[main,qual];s.careerSystems.pro.hasTourCard=true;s.liveMatch=null;s.tournamentProgress={...s.tournamentProgress,tournamentId:main.id,completedRounds:[]};
 s.rollingRankings={...s.rollingRankings!,seedings:Object.fromEntries([main,qual].map(t=>[rankingEventKey(t),{date:'2051-03-31',world:{[s.player.fullName]:rank},oneYear:{}}]))};
 return s;
}
describe('audit provisional entry review',()=>{
 it('releases an invalid World main-draw reservation before qualifying closes',()=>{
  const s=fixture(),[main,qual]=s.tournaments;expect(getTournamentEntryAccess(s,main).allowed).toBe(false);expect(getTournamentEntryAccess(s,qual).allowed).toBe(true);
  const reviewed=reviewLockedAuditEntry(s);expect(reviewed.tournaments[0].status).toBe('Available');expect(reviewed.currentDate).toBe('2051-03-31');expect(reviewLockedAuditEntry(reviewed)).toBe(reviewed);
 });
 it('keeps an eligible locked main-draw booking',()=>{const s=fixture(15);expect(reviewLockedAuditEntry(s)).toBe(s)});
 it('does not withdraw before selection locks',()=>{const s=fixture();s.rollingRankings!.seedings={};expect(reviewLockedAuditEntry(s)).toBe(s)});
 it('honours the ordinary in-progress match withdrawal guard',()=>{const s=fixture();s.liveMatch={...createStarterState().liveMatch!,tournamentId:s.tournaments[0].id,status:'In Progress'};expect(reviewLockedAuditEntry(s).tournaments[0].status).toBe('Entered')});
});
