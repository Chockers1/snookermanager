import { describe, expect, it } from 'vitest';
import { createChampionshipDraw, groupsInRound, groupTable, applyGroupResult, nextGroupFixture, resolveChampionshipStage, championshipEarnings, fixtureComplete, groupFrameOrder } from './championshipLeague';
import { createStarterState, enterTournamentState, bookTravelState, confirmTournamentPreparationState, startLiveMatchState, finalizeLiveMatch, repairGameState, simulateTournamentMatchState, processRankingCalendar, advanceLiveVisit } from '../hooks/useGameState';
import { reconcileRealism } from './realism';
import { getDefaultPreparationAllocations } from './tournamentPreparation';

export function leagueFixture() {
  let state=createStarterState();
  state.player.cash=100000;
  const event=state.tournaments.find(t=>t.id==='pc-52')!;
  state.tournaments=[event];
  state=enterTournamentState(state,event.id);
  state=bookTravelState(state,event.id);
  state=confirmTournamentPreparationState(state,event.id,'balanced',getDefaultPreparationAllocations(),[]);
  state=reconcileRealism({...state,currentDate:event.startDate});
  return {state,event};
}
const field=Array.from({length:128},(_,i)=>({name:'Player '+(i+1),rank:i+1,nation:'ENG'}));

describe('Championship League groups',()=>{
  it('creates 32 four-player round robins with three unique opponents per player',()=>{
    const draw=createChampionshipDraw(field), groups=groupsInRound(draw[0]);
    expect(groups).toHaveLength(32);expect(draw[0].matches).toHaveLength(192);
    for(const group of groups) {
      const table=groupTable(group.matches);expect(table).toHaveLength(4);
      for(const p of table) expect(group.matches.filter(m=>m.top.name===p.name||m.bottom.name===p.name)).toHaveLength(3);
    }
  });
  it('awards one point for draws and retains the next fixture after a loss',()=>{
    let draw=createChampionshipDraw(field);
    const first=nextGroupFixture(draw,draw[0].label,'Player 1')!;
    const result=applyGroupResult(draw,draw[0].label,'Player 1',first.bottom.name,2,2,[80],[70]);draw=result.draw;
    const group=groupsInRound(draw[0]).find(g=>g.matches.some(m=>m.top.name==='Player 1'))!;
    expect(groupTable(group.matches).find(p=>p.name==='Player 1')).toMatchObject({played:1,drawn:1,points:1,won:0});
    expect(result.nextRound).toBe('Stage One Groups');
    const second=nextGroupFixture(draw,draw[0].label,'Player 1')!;
    expect(second.bottom.name).not.toBe(first.bottom.name);
    const loss=applyGroupResult(draw,draw[0].label,'Player 1',second.bottom.name,0,3,[30],[90]);
    expect(loss.nextRound).toBe('Stage One Groups');
  });
  it('completes 253 fixtures through 32, 8 and 2 groups and one final',()=>{
    const draw=createChampionshipDraw(field);
    for(const label of draw.map(r=>r.label)) resolveChampionshipStage(draw,label,()=>.1);
    expect(draw.map(r=>r.matches.length)).toEqual([192,48,12,1]);
    expect(draw.flatMap(r=>r.matches).every(fixtureComplete)).toBe(true);
    const champion=draw[3].matches[0].top.name;
    expect(championshipEarnings(draw,champion)).toBe(33000);
    expect(field.reduce((n,p)=>n+championshipEarnings(draw,p.name),0)).toBe(328000);
  });
  it('supports 3–0, 3–1 and 2–2 without playing a fifth group frame',()=>{
    expect(groupFrameOrder(.5,()=>.1)).toEqual([true,true,true]);
    let values=[.1,.9,.1,.9];expect(groupFrameOrder(.5,()=>values.shift()!)).toEqual([true,false,true,false]);
    values=[.1,.9,.1,.1];expect(groupFrameOrder(.5,()=>values.shift()!)).toEqual([true,false,true,true]);
  });
  it('records drawn live matches, preserves them on reload and advances only after three fixtures',()=>{
    const fixture=leagueFixture(); const event=fixture.event; let state=fixture.state;
    state=startLiveMatchState(state,event.id);
    expect(state.liveMatch?.bestOf).toBe(4);expect(state.liveMatch?.framesNeeded).toBe(3);
    const live={...state.liveMatch!,playerFrames:2,opponentFrames:2,status:'Completed' as const};
    const before=state.player.cash;
    state=finalizeLiveMatch(state,live);
    expect(state.matches[0].result).toBe('Drawn');expect(state.player.cash).toBe(before);
    expect(state.tournamentProgress.currentRound).toBe('Stage One Groups');
    expect(state.history.tournamentHistory[0].matchesPlayed).toBe(1);
    expect(state.history.tournamentHistory[0].losses).toBe(0);
    expect(finalizeLiveMatch(state,live).player.cash).toBe(state.player.cash);
    const reloaded=repairGameState(JSON.parse(JSON.stringify(state)));
    expect(reloaded.tournamentProgress.draw).toEqual(state.tournamentProgress.draw);
    expect(reloaded.player.form.at(-1)).toBe('D');
    const next=startLiveMatchState(reloaded,event.id);
    expect(next.liveMatch?.opponentName).not.toBe(live.opponentName);
  });
  it('lets a player win all nine group games and the final with one title and correct earnings',()=>{
    const fixture=leagueFixture(); const event=fixture.event; let state=fixture.state;
    for(let i=0;i<10;i++) {
      state=startLiveMatchState(state,event.id);
      expect(state.liveMatch?.status).toBe('In Progress');
      state=finalizeLiveMatch(state,{...state.liveMatch!,playerFrames:3,opponentFrames:0,status:'Completed'});
      expect(state.tournamentProgress.completedRounds).toHaveLength(i+1);
    }
    expect(state.tournamentProgress.currentRound).toBeNull();
    expect(state.tournaments[0].status).toBe('Completed');
    expect(state.history.tournamentHistory[0]).toMatchObject({matchesPlayed:10,wins:10,prizeMoney:33000,result:'Winner'});
    expect(state.rollingRankings!.earnings.find(e=>e.eventKey===event.id+':'+event.startDate && e.playerName===state.player.fullName)?.amount).toBe(33000);
  });
  it('ends a live drawn match at four frames',()=>{
    const fixture=leagueFixture(); const event=fixture.event; let state=fixture.state;state=startLiveMatchState(state,event.id);
    state.liveMatch={...state.liveMatch!,playerFrames:2,opponentFrames:1,currentFrame:4};
    for(let i=0;i<300 && state.liveMatch?.status==='In Progress';i++) state={...state,liveMatch:advanceLiveVisit(state.liveMatch!,undefined,'simulated')};
    expect(state.liveMatch?.status).toBe('Completed');
    expect(state.liveMatch!.playerFrames+state.liveMatch!.opponentFrames).toBe(4);
  });
  it('quick sim plays a single group fixture and upgrades an unplayed legacy bracket',()=>{
    const fixture=leagueFixture(); const event=fixture.event; let state=fixture.state;
    state=simulateTournamentMatchState(state,event.id);
    expect(state.tournamentProgress.completedRounds).toHaveLength(1);
    expect(state.tournamentProgress.currentRound).toBe('Stage One Groups');
    const legacy=leagueFixture().state; legacy.tournamentProgress.draw=[{label:'Stage One Groups',matches:legacy.tournamentProgress.draw[0].matches.slice(0,64).map(m=>({...m,group:undefined}))}];
    const repaired=processRankingCalendar(legacy);
    expect(groupsInRound(repaired.tournamentProgress.draw[0])).toHaveLength(32);
  });
  it('finishing with a win does not qualify a player who lost their first two group games',()=>{
    const fixture=leagueFixture(), event=fixture.event; let state=fixture.state;
    for(let i=0;i<3;i++) {
      state=startLiveMatchState(state,event.id);
      state=finalizeLiveMatch(state,{...state.liveMatch!,playerFrames:i===2?3:0,opponentFrames:i===2?0:3,status:'Completed'});
    }
    expect(state.tournamentProgress.currentRound).toBeNull();
    expect(state.history.tournamentHistory[0]).toMatchObject({matchesPlayed:3,wins:1,losses:2,result:'Eliminated in Stage One Groups'});
    expect(state.history.tournamentHistory[0].canonicalResult?.isTitle).toBe(false);
    expect(state.lastAction).not.toContain('took the title');
    expect(state.tournamentProgress.draw.flatMap(r=>r.matches).every(fixtureComplete)).toBe(true);
  });
  it('uses recorded breaks to resolve a group tied on all match and frame criteria',()=>{
    const draw=createChampionshipDraw(field), group=groupsInRound(draw[0])[0];
    const allDrawn=group.matches.map(m=>({...m,top:{...m.top,score:2},bottom:{...m.bottom,score:2},topBreaks:[m.top.name==='Player 1'?140:70],bottomBreaks:[m.bottom.name==='Player 1'?140:70]}));
    expect(groupTable(allDrawn)[0]).toMatchObject({name:'Player 1',points:3,drawn:3,difference:0});
  });

});
