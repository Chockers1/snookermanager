import {describe,it,expect} from 'vitest';
import {createNewCareerState} from '../hooks/useGameState';
import {currentPublishedRanking,currentRankingTab,rankingRoster} from './rankingPresentation';

describe('starting ranking presentation',()=>{
 it('opens the youth path without presenting its seeding position or movement as earned',()=>{
  const s=createNewCareerState();s.player.rankingLabel='Youth Ranking';
  s.competitionTables.youth=[{id:'human',playerName:s.player.fullName,nation:'ENG',ranking:47,movement:35,points:0,prizeMoney:0,eventsPlayed:0,wins:0,losses:0,titles:0}];
  expect(currentRankingTab(s)).toBe('youth');expect(currentPublishedRanking(s)).toBeUndefined();
  s.competitionTables.youth[0]={...s.competitionTables.youth[0],eventsPlayed:1,points:25,ranking:3,movement:0};
  expect(currentPublishedRanking(s)?.ranking).toBe(3);
 });
 it('shows named seed rosters without manufacturing current-season points or modifying gameplay',()=>{
  const s=createNewCareerState();const before=JSON.stringify(s.competitionTables);
  for(const key of ['youth','amateur','qTour','qSchool','senior'] as const){
   const rows=rankingRoster(s,key);expect(rows.length).toBeGreaterThan(0);
   expect(rows.every(r=>(key==='youth'?s.worldPlayers.some(p=>p.playerName===r.playerName)||r.playerName===s.player.fullName:s.competitionTables[key].some(original=>original.playerName===r.playerName)))).toBe(true);
   expect(rows.every(r=>{const p=s.worldPlayers.find(p=>p.playerName===r.playerName);const age=r.playerName===s.player.fullName?s.player.age:p!.age;return key==='youth'?age<=21:key==='senior'?age>=40:true})).toBe(true);
   expect(rows.every(r=>r.points===0&&r.eventsPlayed===0&&r.prizeMoney===0&&r.titles===0&&r.movement===0)).toBe(true);
   s.player.rankingLabel=key==='qTour'?'Q Tour Ranking':key==='qSchool'?'Q School OOM':key==='senior'?'Senior Ranking':key==='youth'?'Youth Ranking':'Amateur Ranking';
   expect(currentPublishedRanking(s)).toBeUndefined();
  }
  expect(JSON.stringify(s.competitionTables)).toBe(before);
 });
});
