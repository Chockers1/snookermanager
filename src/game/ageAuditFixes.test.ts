import {describe,it,expect} from 'vitest';
import {createStarterState,createNewCareerState,repairGameState,getTournamentEntryAccess,buildTournamentDraw,getTournamentEntryRound,evolveWorldPlayersForNextSeason, type GameState} from '../hooks/useGameState';
import {createPlayerStartingLevelCatalog,createPlayerIdentitySeed,createPlayerSliderCatalog,createPlayerBackgroundCatalog} from '../data/gameContent';
import {getEligibleStartingLevels,getValidatedStartingLevel} from '../utils/newCareerConfig';
import {getProTourAccessBand} from './rankingPolicy';
import {repairHumanWorldRecord,humanSeasonStats,repairHumanSeasonRows} from './humanWorldRecord';
import {playerSeasonHistory} from './playerProfile';
import {tournamentEligibility} from './tournamentEligibility';

function protectedPlayer(rank=134){
 const s=createStarterState();s.currentDate='2026-06-01';s.player.worldRanking=rank;
 s.careerSystems.pro={...s.careerSystems.pro,worldRank:rank,hasTourCard:true,currentYear:2,yearsRemaining:1,cardSource:'Q School',oneYearRank:140};
 s.competitionTables.world=s.competitionTables.world.map(r=>r.playerName===s.player.fullName?{...r,ranking:rank}:r);
 s.rollingRankings!.seedings={};return s;
}
describe('full age audit regressions',()=>{
 it.each(['World Championship Qualifying','UK Championship Qualifying','English Open Qualifying','International Championship Qualifying','Welsh Open Qualifying','World Open Qualifying','German Masters','Saudi Arabia Masters'])('honours a protected #134 card for %s',name=>{
  const s=protectedPlayer(),event=s.tournaments.find(t=>t.name===name)!;expect(event).toBeDefined();
  expect(getTournamentEntryAccess(s,event)).toMatchObject({allowed:true,accessBand:'bottomTour'});
  const draw=buildTournamentDraw(s,event,getTournamentEntryRound(s,event));expect(draw.flatMap(r=>r.matches).some(m=>m.top.name===s.player.fullName||m.bottom.name===s.player.fullName)).toBe(true);
  expect(tournamentEligibility(s,event).selection).not.toMatch(/inside 128.*required/);
  s.careerSystems.pro.hasTourCard=false;expect(getTournamentEntryAccess(s,event).allowed).toBe(false);
 });
 it('preserves selection restrictions while recognising active professional status',()=>{
  const s=protectedPlayer();expect(getProTourAccessBand(999,true)).toBe('bottomTour');expect(getProTourAccessBand(134,false)).toBe('offTour');
  for(const name of ['Masters','Players Championship','World Championship'])expect(getTournamentEntryAccess(s,s.tournaments.find(t=>t.name===name)!).allowed,name).toBe(false);
  const top=protectedPlayer(12);expect(getTournamentEntryAccess(top,top.tournaments.find(t=>t.name==='World Championship Qualifying')!).allowed).toBe(false);
 });
 it('keeps a CPU card below #128 for its protected year, then expires it normally',()=>{
  const s=createStarterState(),p=s.worldPlayers.find(p=>p.playerName!==s.player.fullName)!;const row=s.competitionTables.world.find(r=>r.playerName===p.playerName)!;
  const tables={...s.competitionTables,world:s.competitionTables.world.map(r=>r===row?{...r,ranking:140}:r)};
  const players=s.worldPlayers.map(r=>r.id===p.id?{...r,age:25,hasTourCard:true,yearsRemaining:2,currentYear:1,cardSource:'Q School' as const}:r);
  const next=evolveWorldPlayersForNextSeason(players,tables,s.player,true,s.careerSystems.pro,2027,new Map());
  expect(next.find(r=>r.id===p.id)).toMatchObject({hasTourCard:true,yearsRemaining:1,currentYear:2});
  const expired=evolveWorldPlayersForNextSeason(next,tables,s.player,true,s.careerSystems.pro,2028,new Map());
  const result=expired.find(r=>r.id===p.id)!;
  // An available vacancy can grant a fresh top-up card, but cannot extend the old Q School protection.
  expect(result.cardSource).not.toBe('Q School');
  if(result.hasTourCard)expect(result).toMatchObject({cardSource:'Top Up',yearsRemaining:1,currentYear:1});
  else expect(result.yearsRemaining).toBe(0);
 });
 it('offers a valid starting route at every supported age, including 49',()=>{
  for(let age=12;age<=80;age++){
   const eligible=getEligibleStartingLevels(createPlayerStartingLevelCatalog,age);expect(eligible.length,'age '+age).toBeGreaterThan(0);
   expect(eligible).toContain(getValidatedStartingLevel(createPlayerStartingLevelCatalog,age,'start-masters'));
  }
  expect(getValidatedStartingLevel(createPlayerStartingLevelCatalog,49,'start-masters').id).toBe('start-bottom-tour');
  expect(()=>getValidatedStartingLevel([],49)).toThrow('No eligible starting route');
  expect(()=>getValidatedStartingLevel(createPlayerStartingLevelCatalog,81)).toThrow('No eligible starting route');
  const s=createNewCareerState({fullName:'Age 49 Test',nationality:'ENG',age:49,handedness:'Right-handed',cueStyle:createPlayerIdentitySeed.cueStyle,playingStyle:createPlayerIdentitySeed.playingStyle,personalityArchetype:createPlayerIdentitySeed.personalityArchetype,sliders:createPlayerSliderCatalog.map(s=>({...s})),backgroundId:createPlayerBackgroundCatalog[0].id,startingLevelId:'start-masters'});expect(s.player.age).toBe(49);expect(s.player.careerStage).not.toMatch(/junior/i);expect(s.careerSystems.pro.hasTourCard).toBe(true);
 });
 it('repairs human season copies from canonical matches, including draws, without replaying effects',()=>{
  const s=createStarterState();const summary={season:'2025/26',matchesPlayed:11,wins:6,losses:3,titles:1,prizeMoney:2000} as GameState['history']['seasonRecords'][number];s.history.seasonRecords=[summary];
  const p=s.worldPlayers.find(p=>p.playerName===s.player.fullName)!;p.totalMatches=4;p.wins=4;p.losses=2;
  p.seasons=[{season:'2025/26',matches:4,wins:6,losses:3,titles:0,prizeMoney:0,worldRank:18}as typeof p.seasons[number]];
  const fixed=repairHumanWorldRecord(s),copy=fixed.worldPlayers.find(r=>r.id===p.id)!;
  expect(copy).toMatchObject({totalMatches:11,wins:6,losses:3});expect(copy.seasons[0]).toMatchObject({...humanSeasonStats(summary),worldRank:18});
  const loaded=repairGameState(s);expect(loaded.worldPlayers.find(r=>r.id===p.id)?.seasons[0]).toMatchObject(humanSeasonStats(loaded.history.seasonRecords[0]));
  expect(repairHumanWorldRecord(fixed)).toBe(fixed);expect(fixed.player).toBe(s.player);expect(fixed.finance).toBe(s.finance);expect(fixed.inbox).toBe(s.inbox);expect(fixed.liveMatch).toBe(s.liveMatch);
  expect(repairHumanSeasonRows(s,p.seasons)[0].matches).toBe(11);
  const archived={...s,worldPlayers:s.worldPlayers.map(r=>r.id===p.id?{...r,seasons:[]}:r)};
  expect(playerSeasonHistory(archived,s.player.fullName,[]).find(r=>r.season==='2025/26')).toMatchObject({matches:11,wins:6,losses:3,draws:2,prize:2000});
 });
});
