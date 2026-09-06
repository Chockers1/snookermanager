import { describe, expect, it } from 'vitest';
import { detailedTournamentCatalog } from '../data/pathwayCalendarData';
import { resolveTournamentFormat } from '../data/tournamentFormats';
import { createStarterState, buildTournamentDraw, resolveTournamentDrawRound, getTournamentEntryAccess, getTournamentEntryCashRequirement, enterTournamentState, repairGameState, evolveWorldPlayersForNextSeason } from '../hooks/useGameState';
import { pathwayAgeLimit, pathwayEntryReason, pathwayStandings, qTourQualification, seniorQualification, pathwayCardAwards, pathwayPlacementPrize, nationRegion } from './pathwayRules';
import { recordRankingEvent, qualifiedNames } from './rollingRankings';
import type { BracketRound } from '../types/game';
const event = (id: string) => detailedTournamentCatalog.find(t => t.id === id)!;
function amateur(age = 17, nation = 'ENG') {
  const s = createStarterState(); s.player.age = age; s.player.dateOfBirth = undefined; s.player.nationality = nation; s.player.worldRanking = 999; s.player.cash = 100000; s.player.careerStage = 'Elite Amateur'; s.player.rankingLabel = 'Amateur Ranking'; s.careerSystems.pro.hasTourCard = false; s.careerSystems.pro.worldRank = 999; s.careerSystems.pro.currentTier = 'Amateur';
  return s;
}
const entrant = { name: 'Test Player', age: 17, nation: 'ENG', hasTourCard: false };
function complete(state: ReturnType<typeof createStarterState>, id: string) {
  const t = event(id), f = resolveTournamentFormat(t), draw = buildTournamentDraw(state,t,f.roundStructure[0],false,()=>.2);
  for(const r of f.roundStructure) resolveTournamentDrawRound(draw,t,r,'',()=>.2);
  return { state: recordRankingEvent(state,t,draw,()=>({prizeMoney:0})), draw };
}
function final(a: string,b: string, score=4): BracketRound[] { return [{label:'Final',matches:[{id:a+b,top:{name:a,nation:'ENG',rank:1,score},bottom:{name:b,nation:'ENG',rank:2,score:0}}]}]; }
describe('other tour eligibility and qualification',()=>{
  it.each([['pc-03',15,true],['pc-03',16,false],['pc-97',15,true],['pc-97',16,false],['pc-98',17,true],['pc-98',18,false],['pc-99',20,true],['pc-99',21,false],['pc-95',18,true],['pc-95',19,false]] as const)('%s age %s eligibility is %s',(id,age,allowed)=>{
    expect(getTournamentEntryAccess(amateur(age),event(id)).allowed).toBe(allowed);
  });
  it('uses the EBSA March cutoff rather than age on event day',()=>{
    const s=amateur(15); s.player.dateOfBirth='2011-03-20';
    expect(getTournamentEntryAccess(s,event('pc-97')).reason).toContain('2027-03-31');
    s.player.dateOfBirth='2011-04-01'; expect(getTournamentEntryAccess(s,event('pc-97')).allowed).toBe(true);
  });
  it('opens Q School and Q Tour to eligible junior entrants',()=>{
    for(const id of ['pc-48','pc-31']) expect(getTournamentEntryAccess(amateur(15),event(id)).allowed,id).toBe(true);
  });
  it('requires citizenship for Asia Q School and federation routes',()=>{
    expect(getTournamentEntryAccess(amateur(18,'ENG'),event('pc-50')).allowed).toBe(false);
    expect(getTournamentEntryAccess(amateur(18,'NZL'),event('pc-50')).allowed).toBe(true);
    expect(getTournamentEntryAccess(amateur(18,'NZL'),event('pc-100')).allowed).toBe(false);
    expect(getTournamentEntryAccess(amateur(18,'ENG'),event('pc-103')).allowed).toBe(false);
    expect(nationRegion('IRN')).toBe('Middle East');
  });
  it('accepts active professionals in seniors events from age 40',()=>{
    const s=createStarterState(); s.player.age=40; s.player.dateOfBirth=undefined;
    expect(getTournamentEntryAccess(s,event('pc-83')).allowed).toBe(true);
    s.player.age=39; expect(getTournamentEntryAccess(s,event('pc-83')).allowed).toBe(false);
  });
  it('requires six months of regional residence, not a short trip',()=>{
    const t=event('pc-40');
    expect(pathwayEntryReason(t,entrant)).toContain('six months');
    expect(pathwayEntryReason(t,{...entrant,residence:'Americas',residentSince:'2026-07-11'})).toContain('six months');
    expect(pathwayEntryReason(t,{...entrant,residence:'Americas',residentSince:'2026-07-10'})).toBeNull();
  });
  it('charges a Q School campaign once for both events',()=>{
    let s=amateur(); s=enterTournamentState(s,'pc-48');
    expect(s.player.cash).toBe(100000-960);
    expect(getTournamentEntryCashRequirement(s,event('pc-49'))).toBe(0);
    expect(getTournamentEntryCashRequirement(s,event('pc-50'))).toBe(560);
  });
  it('filters every persisted CPU opponent by event eligibility',()=>{
    const s=createStarterState();
    for(const t of detailedTournamentCatalog.filter(t=>['Junior','Regional Youth','National Youth','Amateur','Q School','Q Tour','Senior'].includes(t.type))) {
      const f=resolveTournamentFormat(t); if(!f.roundStructure.length) continue;
      const draw=buildTournamentDraw(s,t,f.roundStructure[0],false);
      for(const name of new Set(draw.flatMap(r=>r.matches.flatMap(m=>[m.top.name,m.bottom.name])))) {
        const p=s.worldPlayers.find(p=>p.playerName===name); if(!p)continue;
        expect(pathwayEntryReason(t,{name,nation:p.nation,age:p.age,hasTourCard:p.hasTourCard,retired:p.retired},s),t.name+' '+name).toBeNull();
      }
    }
  });
  it('removes UK Event 1 card winners from Event 2 and awards eight distinct cards',()=>{
    let s=createStarterState(); const first=complete(s,'pc-48'); s=first.state;
    const winners=qualifiedNames(first.draw); expect(winners).toHaveLength(4);
    const second=complete(s,'pc-49');
    const names=second.draw.flatMap(r=>r.matches.flatMap(m=>[m.top.name,m.bottom.name]));
    winners.forEach(n=>expect(names).not.toContain(n));
    expect([...pathwayCardAwards(second.state).values()].filter(v=>v==='Q School')).toHaveLength(8);
  });
  it('keeps circuit standings separate and guarantees event champions a playoff place',()=>{
    let s=createStarterState();
    for(let i=0;i<20;i++) s=recordRankingEvent(s,{...event('pc-31'),id:'e'+i,name:'Europe - Event '+i,startDate:'2026-08-01',endDate:'2026-08-04'},final(i<4?'Leader':'P'+i,'L'+i),()=>({prizeMoney:0}));
    s=recordRankingEvent(s,event('pc-40'),final('Regional','Rival'),()=>({prizeMoney:0}));
    expect(pathwayStandings(s,'Europe').some(r=>r.name==='Regional')).toBe(false);
    const q=qTourQualification(s); expect(q.automatic).toBe('Leader'); expect(q.playoff).not.toContain('Leader'); expect(q.playoff).toContain('P19'); expect(q.playoff).toContain('Regional');
    expect(pathwayStandings(s,'Europe').find(r=>r.name==='L1')?.points).toBe(0);
  });
  it('promotes actual CPU Q School qualifiers at season rollover',()=>{
    const result=complete(createStarterState(),'pc-48'), s=result.state, cards=pathwayCardAwards(s);
    const next=evolveWorldPlayersForNextSeason(s.worldPlayers,s.competitionTables,{...s.player,age:s.player.age+1},s.careerSystems.pro.hasTourCard,s.careerSystems.pro,2027,cards);
    for(const name of qualifiedNames(result.draw)) expect(next.find(p=>p.playerName===name),name).toMatchObject({hasTourCard:true,cardSource:'Q School',yearsRemaining:2});
  });
  it('does not let an unqualified amateur enter the Global Play-Offs',()=>expect(getTournamentEntryAccess(amateur(),event('pc-47')).allowed).toBe(false));
  it('does not duplicate senior ranking qualifiers across the two lists',()=>{
    let s=createStarterState(); const names=s.worldPlayers.filter(p=>p.age>=40&&!p.retired).slice(0,6).map(p=>p.playerName);
    for(let i=0;i<3;i++)s=recordRankingEvent(s,{...event('pc-83'),id:'s'+i},final(names[i],names[i+3]),()=>({prizeMoney:0}));
    const q=seniorQualification(s,'2027-04-01'); expect(new Set(q.ranking).size).toBe(q.ranking.length); expect(q.ranking.length).toBe(4);
  });
  it('pays the Q Tour finishing prizes and realistic senior winner purse',()=>{
    expect(pathwayPlacementPrize(event('pc-31'),'Last 16',false)).toBe(750);
    expect(pathwayPlacementPrize(event('pc-31'),'Final',true)).toBe(6000);
    expect(pathwayPlacementPrize(event('pc-83'),'Final',true)).toBe(1000);
  });
  it('migrates an unplayed regional draw and leaves completed records alone',()=>{
    let s=amateur(20,'NZL'); s=enterTournamentState(s,'pc-29'); s.tournamentProgress.rulesVersion=2; s.tournamentProgress.draw=[];
    const fixed=repairGameState(s); expect(fixed.tournamentProgress.draw[0].groupRule).toBe('amateur'); expect(fixed.tournamentProgress.rulesVersion).toBe(3);
  });
  it.each([['pc-30',[5,5,5,5,5,5,7]],['pc-35',[7,7,7,7,7,9,11]],['pc-40',[7,7,7,7,7,7]],['pc-45',[7,7,7,7,7,7]],['pc-29',[5,7,7,7,9]]])('uses the event-specific frame sequence for %s',(id,lengths)=>{
    const f=resolveTournamentFormat(event(id as string));expect(f.roundStructure.map(r=>f.roundBestOf![r])).toEqual(lengths);
  });
  it('all age-limited events have a clear age rule',()=>expect(detailedTournamentCatalog.filter(t=>pathwayAgeLimit(t)).length).toBeGreaterThan(15));
});
