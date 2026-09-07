import { describe,it,expect } from 'vitest';
import { playerWorldFixture } from '../../test-support/playerWorldFixture';
import { playerEventHistory,playerSeasonHistory,profileScouting,resolveProfilePlayer } from './playerProfile';
import { compactRankingLedger } from './rollingRankings';
import { tournamentRewards,exhibitionAchievements } from './tournamentRewards';
import { eventAtmosphere,matchWalkout,notableDrawMatches,crowdReaction } from './tournamentAtmosphere';
describe('public player history and rewards',()=>{
 it('includes the current season and every historical circuit, with published trophies and prize totals',()=>{
  const {state,opponent}=playerWorldFixture();
  const event=Object.values(state.rollingRankings!.events)[0];event.eventType='Amateur';event.prizeAwards={[opponent.playerName]:7500};
  opponent.seasons=[{season:'2025/26',matches:8,wins:6,losses:2,titles:1,prizeMoney:300,youthRank:2,amateurRank:12,qTourRank:11,status:'Youth'} as typeof opponent.seasons[number]];
  const row=state.competitionTables.world[0];state.competitionTables.amateur=[{...row,playerName:opponent.playerName,ranking:3}];
  const records=playerSeasonHistory(state,opponent.playerName);
  expect(records.map(s=>s.season)).toEqual(['2026/27','2025/26']);
  expect(records[0]).toMatchObject({live:true,matches:1,wins:1,losses:0,draws:0,titles:1,prize:7500});
  expect(records[0].ranks[3]).toBe(3);expect(records[1].ranks.slice(2,5)).toEqual([2,12,11]);
  event.applied=false;expect(playerSeasonHistory(state,opponent.playerName)[0]).toMatchObject({matches:0,titles:0,prize:0});
 });
 it('keeps season totals after bracket compaction and marks already-missing older details honestly',()=>{
  const {state,opponent}=playerWorldFixture();state.currentDate='2040-01-01';state.season='2039/40';
  const compact=compactRankingLedger(state);
  expect(playerSeasonHistory(compact,opponent.playerName).find(s=>s.season==='2026/27')).toMatchObject({matches:1,wins:1,losses:0,draws:0,titles:0,prize:null});
  Object.values(compact.rollingRankings!.events)[0].outcomes=[{player:opponent.playerName,finish:'Winner'}];
  expect(playerSeasonHistory(compact,opponent.playerName).find(s=>s.season==='2026/27')).toMatchObject({matches:null,wins:null,partial:true});
  opponent.seasons=Array.from({length:15},(_,i)=>({season:(2024-i)+'/'+String(2025-i).slice(2),matches:2,wins:1,losses:1,titles:0,prizeMoney:0,status:'Q Tour'} as typeof opponent.seasons[number]));
  expect(playerSeasonHistory(state,opponent.playerName)).toHaveLength(17);
 });

 it('resolves IDs and names, shows public overall and potential without scouting, and lists recorded scores',()=>{const {state,opponent}=playerWorldFixture();opponent.overallRating=82;opponent.developmentPotential=94;expect(resolveProfilePlayer(state,opponent.id)?.playerName).toBe(opponent.playerName);expect(profileScouting(state,opponent.playerName)).toMatchObject({samples:0,ability:String(Math.round(opponent.overallRating)),potential:String(Math.round(Math.max(opponent.overallRating,opponent.developmentPotential)))});const result=playerEventHistory(state,opponent.playerName)[0];expect(result.category).toBe('Exhibition achievement');expect(result.result).toBe('Winner');expect(result.matches[0].score).toBe('3–2')});
 it('does not reveal future CPU results',()=>{const {state,opponent}=playerWorldFixture();state.currentDate='2026-09-02';expect(playerEventHistory(state,opponent.playerName)).toEqual([])});
 it('retains final placing and exhibition identity when old CPU draws are compacted',()=>{const {state,opponent}=playerWorldFixture();state.currentDate='2030-01-01';const compact=compactRankingLedger(state);const result=playerEventHistory(compact,opponent.playerName)[0];expect(result.result).toBe('Winner');expect(result.category).toBe('Exhibition achievement');expect(result.matches).toEqual([]);expect(compactRankingLedger(compact).rollingRankings?.events).toEqual(compact.rollingRankings?.events)});
 it('shows exhibition achievements without paying cash or creating competitive titles',()=>{const {state,event}=playerWorldFixture();const before=JSON.stringify(state);const r=tournamentRewards(state,event);expect(r.credit).toBe(0);expect(r.trophy).toBe('Exhibition achievement');expect(exhibitionAchievements(state)).toHaveLength(1);expect(JSON.stringify(state)).toBe(before)});
 it('shows exact pending and published world credit separately from prize cash',()=>{const {state,event}=playerWorldFixture();event.type='Ranking';event.rankingType='World Ranking';state.history.tournamentHistory[0].eventType='Ranking';state.history.tournamentHistory[0].rankingPoints=4000;state.rollingRankings!.earnings=[{id:'credit',eventKey:event.id+':'+event.startDate,playerName:state.player.fullName,amount:4000,earnedOn:'2026-09-25',expiresOn:'2028-09-25',season:state.season}];expect(tournamentRewards(state,event)).toMatchObject({prize:7500,credit:4000,creditStatus:'Publishes 2026-09-25'});state.currentDate='2026-09-25';expect(tournamentRewards(state,event).creditStatus).toBe('Published 2026-09-25')});
 it('does not turn an unknown historical prize into zero',()=>{const {state,event}=playerWorldFixture();state.history.tournamentHistory[0].recoveredFromLedger={prizeKnown:false};expect(tournamentRewards(state,event).prize).toBeUndefined()});
});
describe('event atmosphere',()=>{
 it('uses a recorded defending champion and national home support',()=>{const {state,event,opponent}=playerWorldFixture();const next={...event,startDate:'2027-09-01'};const a=eventAtmosphere(state,next);expect(a.defendingChampion).toBe(opponent.playerName);expect(matchWalkout(a,[opponent.playerName])).toContain('defending champion');expect(matchWalkout(a,[opponent.playerName])).toContain('home crowd');expect(crowdReaction(a,opponent.playerName,'century')).toContain('crowd');expect(a.qualifiers).toEqual([])});
 it('does not declare the current event champion the defending champion',()=>{const {state,event}=playerWorldFixture();expect(eventAtmosphere(state,event).defendingChampion).toBeUndefined()});
 it('reports only completed notable matches elsewhere in the draw',()=>{const {state,bracket,opponent}=playerWorldFixture();expect(notableDrawMatches(bracket,state.player.fullName)[0]).toMatchObject({winner:opponent.playerName,label:'Seed upset',score:'3–2'});expect(notableDrawMatches(bracket,opponent.playerName)).toEqual([]);bracket[0].matches[0].bottom.score=undefined;expect(notableDrawMatches(bracket,state.player.fullName)).toEqual([])});
});
