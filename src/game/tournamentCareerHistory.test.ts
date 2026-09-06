import { describe,expect,it } from 'vitest';
import { finishSeasonState,repairGameState,startNextSeasonState,enterTournamentState,getNextEligibleTournament } from '../hooks/useGameState';
import { historyEdition,tournamentHistoryFixture } from '../../test-support/tournamentHistoryFixture';
import { recoverTournamentArchive,createTournamentBriefing,enrichTournamentMessages,eventIdentity,retainTournamentArchive,tournamentCareerEditions,tournamentEditionSummary,tournamentHistoryOptions,tournamentRoundHistory } from './tournamentCareerHistory';
import { reconcileEntryReminders } from './tournamentEntry';
import { createSeasonStartReport } from './seasonStartReport';

describe('tournament career history',()=>{
  it('selects all seasons, keeps qualifiers separate and finds prior and best appearances',()=>{
    const state=tournamentHistoryFixture(),world=state.tournaments.find(t=>t.name==='World Championship')!;
    const briefing=createTournamentBriefing(state,world);
    expect(briefing).toMatchObject({appearances:2,previous:{season:'2026/27',finish:'Lost in Last 32',lastOpponent:'Malik Langford',lastScore:'8–10'},best:{season:'2024/25',finish:'Lost in Quarter Final'}});
    expect(tournamentCareerEditions(state,eventIdentity(world))).toHaveLength(3);
    expect(tournamentHistoryOptions(state).some(t=>t.name==='World Championship Qualifying')).toBe(true);
    const renamed={...world,id:'changed-calendar-id'};expect(createTournamentBriefing(state,renamed)).toEqual({...briefing,tournament:eventIdentity(renamed)});
    expect(createSeasonStartReport(state,()=>({allowed:true,reason:null})).events.find(e=>e.id===world.id)?.previousFinish).toBe('Lost in Last 32');
  });
  it('uses complete round results including group draws instead of inflated legacy aggregate counts',()=>{
    const state=tournamentHistoryFixture(),entry=state.history.tournamentHistory[0];
    entry.roundResults=[{round:'Stage One Groups',opponentName:'One',result:'Won',playerFrames:3,opponentFrames:1},{round:'Stage One Groups',opponentName:'Two',result:'Drawn',playerFrames:2,opponentFrames:2},{round:'Stage One Groups',opponentName:'Three',result:'Lost',playerFrames:1,opponentFrames:3}];entry.matchesPlayed=10;entry.wins=8;entry.losses=2;
    expect(tournamentEditionSummary(state,entry)).toMatchObject({matches:3,wins:1,losses:1,draws:1});
    expect(tournamentRoundHistory(state,entry).map(r=>r.opponent)).toEqual(['One','Two','Three']);
    entry.roundResults=undefined;entry.rounds=['Last 32: Lost 8-10'];state.history.matchLog=[];
    expect(tournamentRoundHistory(state,entry)[0].opponent).toBe('Not recorded');
  });
  it('freezes invitation history before a season changes and avoids matching qualifiers by substring',()=>{
    const state=tournamentHistoryFixture(),world=state.tournaments.find(t=>t.name==='World Championship')!;
    const enriched=enrichTournamentMessages(state);const original=structuredClone(enriched.inbox[0].tournamentBriefings);
    expect(enrichTournamentMessages(enriched)).toBe(enriched);
    enriched.season='2028/29';enriched.history.tournamentHistory.unshift(historyEdition(world,'2027/28','Winner'));
    expect(enrichTournamentMessages(enriched).inbox[0].tournamentBriefings).toEqual(original);
    const unrelated={...state,inbox:[{...state.inbox[0],tournamentReference:undefined,subject:'Invitation: World Championship Qualifying'}]};
    const result=enrichTournamentMessages(unrelated).inbox[0].tournamentBriefings;
    expect(result?.[0].tournament.name).not.toBe('World Championship');
  });
  it('shows missing last-season participation and a previous appearance without inventing a defeat',()=>{
    const state=tournamentHistoryFixture(),world=state.tournaments.find(t=>t.name==='World Championship')!;
    state.history.tournamentHistory=state.history.tournamentHistory.filter(e=>e.season!=='2026/27');
    expect(createTournamentBriefing(state,world)).toMatchObject({previous:undefined,lastAppearance:{season:'2024/25'},appearances:1});
  });
  it('retains every edition beyond 240 entries and keeps personal rounds when compacting full draws',()=>{
    const state=tournamentHistoryFixture(),entry=state.history.tournamentHistory[0];
    const entries=Array.from({length:600},(_,i)=>({...entry,id:'history-'+i,bracket:[{label:'Last 32',matches:[]}]}));
    const kept=retainTournamentArchive(entries);expect(kept).toHaveLength(600);expect(kept[599].roundResults).toEqual(entry.roundResults);expect(kept[599].bracket).toBeUndefined();expect(kept[0].bracket).toBeDefined();
    state.history.tournamentHistory=entries;
    state.player.cash=1000000;
    const available=getNextEligibleTournament(state)!;
    const entered=enterTournamentState(state,available.id);
    expect(entered.history.tournamentHistory).toHaveLength(601);
    expect(entered.tournaments.find(t=>t.id===available.id)?.status).toBe('Entered');
  });
  it('keeps earlier-season results when a tournament ID is reused on the new calendar',()=>{
    const state=tournamentHistoryFixture(),entry=state.history.tournamentHistory[0];
    state.matches=[{...state.matches[0],id:'previous-edition-match',tournamentId:entry.tournamentId,season:entry.season,playedOn:entry.startDate}];
    state.history.matchLog=[{id:'prior-log',season:entry.season,date:entry.startDate,tournamentId:entry.tournamentId,tournamentName:entry.tournamentName,eventType:entry.eventType,round:'Last 32',opponentName:'Malik Langford',result:'Lost',score:'8-10',bestOf:19,playerFrames:8,opponentFrames:10,wentToDecider:false,pressurePeak:50,prizeMoney:12000,rankingPoints:12000}];
    const repaired=repairGameState(state);
    expect(repaired.matches.some(m=>m.id==='previous-edition-match')).toBe(true);expect(repaired.history.matchLog.some(m=>m.id==='prior-log')).toBe(true);expect(repaired.history.tournamentHistory.some(h=>h.id===entry.id)).toBe(true);
  });
  it('attaches separate prior results to multi-event deadline reminders',()=>{
    const state=tournamentHistoryFixture(),event=state.tournaments.find(t=>t.name==='World Championship')!;
    state.currentDate='2028-04-16';event.entryDeadline='2028-04-17';
    const next=reconcileEntryReminders(state,t=>t.id===event.id);
    expect(next.inbox[0].tournamentBriefings?.[0].previous?.finish).toBe('Lost in Last 32');
  });
  it('recovers a missing real player edition from the tour ledger without re-awarding money or inventing breaks',()=>{
    const state=tournamentHistoryFixture(),world=state.tournaments.find(t=>t.name==='World Championship')!;
    state.history.tournamentHistory=state.history.tournamentHistory.filter(e=>e.tournamentId!==world.id);
    const key=world.id+':2027-04-17';
    state.rollingRankings!.events[key]={key,tournamentId:world.id,name:world.name,season:'2026/27',completedOn:'2027-05-03',ranking:true,applied:true,bracket:[{label:'Last 32',matches:[{id:'genuine-match',top:{name:'Malik Langford',rank:2,nation:'BEL',score:10},bottom:{name:state.player.fullName,rank:18,nation:'ENG',highlighted:true,score:8}}]}]};
    state.rollingRankings!.earnings.push({id:'recorded-zero-prize',eventKey:key,playerName:state.player.fullName,season:'2026/27',earnedOn:'2027-05-03',expiresOn:'2029-05-03',amount:0});
    const restored=recoverTournamentArchive(state);
    expect({...restored,history:state.history}).toEqual(state);
    expect(createTournamentBriefing(restored,world).previous).toMatchObject({finish:'Lost in Last 32',lastOpponent:'Malik Langford',lastScore:'8–10',prize:0,highestBreak:null,centuries:null});
    expect(recoverTournamentArchive(restored)).toBe(restored);
    expect(repairGameState(restored).history.tournamentHistory.some(e=>e.recoveredFromLedger && e.tournamentId===world.id)).toBe(true);
    state.rollingRankings!.earnings=[];
    expect(createTournamentBriefing(recoverTournamentArchive(state),world).previous?.prize).toBeNull();
    state.rollingRankings!.events[key].bracket[0].matches[0].bottom.highlighted=false;
    expect(recoverTournamentArchive(state)).toBe(state);
  });
  it('preserves history and archived invitations through actual rollover and review dismissal',()=>{
    const state=tournamentHistoryFixture();state.currentDate='2028-06-29';state.tournaments=state.tournaments.map(t=>({...t,status:'Skipped'}));
    const original=structuredClone(state.history.tournamentHistory);
    const next=startNextSeasonState(finishSeasonState(state));
    for(const entry of original)expect(next.history.tournamentHistory).toContainEqual(entry);
    expect(next.season).toBe('2028/29');
  },30000);
});
