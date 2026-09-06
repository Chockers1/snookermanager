import { careerLegacyOf } from './careerLegacy';
import { describe, expect, it, vi } from 'vitest';
import { createStarterState, resolveTournamentDrawRound, bookTravelState, confirmTournamentPreparationState, continueToNextTournamentState, startLiveMatchState, finalizeLiveMatch, getNextEligibleTournament, getTournamentEntryAccess, enterTournamentState, repairGameState, applyTrainingPlanState, type GameState } from '../hooks/useGameState';
import { entryDeadline, entryTimeline, reconcileEntryReminders, entryReminderDates } from './tournamentEntry';
import { reserveSeasonBlock, removeSeasonBlock, setPriority, boardOf } from './seasonBoard';
import { reconcileAchievements } from './careerAchievements';
import { evolveTourSkills, applyTourSkills, developmentEdge } from './tourDevelopment';
import { frameStory, visitStory } from './contextCommentary';
import { depthOf, plusDays } from './careerDepth/shared';
import { protectCommitmentSessions, tournamentCommitmentConflict } from './careerDepth/commitments';
import { startProject, progressDevelopment } from './careerDepth/developmentProjects';
import { rankingEventKey } from './rollingRankings';
import type { Match, BracketRound } from '../types/game';
import { getDefaultPreparationAllocations } from './tournamentPreparation';
function fresh() { const s=createStarterState();return {...s,matches:[],inbox:[],trainingAppliedWeek:null,player:{...s.player,cash:200000,fatigue:40}}; }
function match(s:GameState,id:string):Match {return {...createStarterState().matches[0],id,tournamentId:s.tournaments[0].id,playedOn:s.currentDate,playerName:s.player.fullName,opponentName:'Opponent',result:'Won',round:'Last 32',highestBreak:101,centuries:1,televised:true,bestOf:7,playerFrames:4,opponentFrames:1};}
describe('entry dates and reminders',()=>{
  it('separates selection cutoff from inclusive entry deadline and blocks late cash charges',()=>{
    const s=fresh(),event={...getNextEligibleTournament(s)!,status:'Available' as const,entryDeadline:plusDays(s.currentDate,4)};
    s.tournaments=[event];
    expect(entryDeadline(event)).toBe(event.entryDeadline);
    expect(entryTimeline(s,event).cutoff).not.toBe(event.entryDeadline);
    const last={...s,currentDate:event.entryDeadline};expect(getTournamentEntryAccess(last,event).allowed).toBe(true);
    const late={...s,currentDate:plusDays(event.entryDeadline,1)};
    expect(getTournamentEntryAccess(late,event).reason).toContain('Entry closed');
    expect(enterTournamentState(late,event.id).player.cash).toBe(late.player.cash);
    expect(getTournamentEntryAccess(late,{...event,status:'Entered'}).allowed).toBe(true);
  });
  it('uses frozen ranking selection and sends persistent one-week/final reminders only for eligible events',()=>{
    let s=fresh();const event={...getNextEligibleTournament(s)!,entryDeadline:plusDays(s.currentDate,7)};s.tournaments=[event];
    s=reconcileEntryReminders(s,()=>true) as typeof s;expect(s.inbox).toHaveLength(1);
    const keys=depthOf(s).entryReminders;
    expect(reconcileEntryReminders({...s,inbox:[]},()=>true).inbox).toHaveLength(0);
    s={...s,currentDate:plusDays(s.currentDate,6)};const last=reconcileEntryReminders(s,()=>true);
    expect(depthOf(last).entryReminders).toHaveLength(2);expect(keys).toHaveLength(1);
    expect(reconcileEntryReminders({...s,careerDepth:{...depthOf(s),entryReminders:[]}},()=>false).inbox).toEqual(s.inbox);
    expect(entryReminderDates(s,()=>false)).toEqual([]);
    const locked={...s,rollingRankings:{...s.rollingRankings!,seedings:{...s.rollingRankings!.seedings,[rankingEventKey(event)]:{date:event.startDate,world:{},oneYear:{}}}}};
    expect(entryTimeline(locked,event).locked).toBe(true);
  });
});
describe('season planning board',()=>{
  it('persists priorities, reserves actual focused sessions, and blocks overlapping event entry',()=>{
    let s:GameState=fresh();const event=getNextEligibleTournament(s)!;s=setPriority(s,event.id);
    expect(boardOf(JSON.parse(JSON.stringify(s))).priorities).toContain(event.id);
    const start=plusDays(depthOf(s).nextSettlementDate,-7);
    s=reserveSeasonBlock(s,{start,kind:'training',focus:'long-pot'});
    const plan=protectCommitmentSessions(s,s.trainingPlan.map(d=>({...d,competitionName:undefined})));
    expect(plan.every(d=>d.morning.title==='Long Pot Routine'&&d.afternoon.title==='Review'&&d.evening.title==='Rest')).toBe(true);
    expect(tournamentCommitmentConflict(s,{...event,startDate:plusDays(start,3),endDate:plusDays(start,4)})).toContain('protected training');
    const project=startProject(s,'long-pot');expect(progressDevelopment(project,plan).careerDepth?.project?.completedWeeks).toBe(1);
    const removed=removeSeasonBlock(s,boardOf(s).blocks[0].id);expect(boardOf(removed).blocks).toHaveLength(0);
  });
  it('rejects overlapping bookings and makes rest weeks reduce fatigue without a booking fee',()=>{
    let s:GameState=fresh();const start=plusDays(depthOf(s).nextSettlementDate,-7),cash=s.player.cash;
    s=reserveSeasonBlock(s,{start,kind:'rest',focus:'stamina'});
    expect(s.player.cash).toBe(cash);
    expect(boardOf(reserveSeasonBlock(s,{start,kind:'training',focus:'safety'})).blocks).toHaveLength(1);
    s={...s,trainingPlan:s.trainingPlan.map(d=>({...d,competitionName:undefined}))};
    expect(protectCommitmentSessions(s,s.trainingPlan).every(d=>d.morning.title==='Rest')).toBe(true);
    const applied=applyTrainingPlanState(s);expect(applied.player.fatigue).toBeLessThan(s.player.fatigue);
    expect(boardOf(removeSeasonBlock(applied,boardOf(s).blocks[0].id)).blocks).toHaveLength(1);
    expect(reserveSeasonBlock(s,{start:'bad',kind:'rest',focus:'stamina'}).lastAction).toContain('valid');
  });
});
describe('achievement evidence',()=>{
  it('initializes old-save goals and tour profiles on load without changing money or date',()=>{
    const s=fresh();s.careerDepth={...depthOf(s),achievements:undefined};
    s.history.legacy={...careerLegacyOf(s),highestBreak:109,centuries:1};
    s.worldPlayers=s.worldPlayers.map(p=>({...p,skillDevelopment:undefined}));
    const loaded=repairGameState(s);
    expect(depthOf(loaded).achievements?.some(a=>a.id==='century')).toBe(true);
    expect(loaded.worldPlayers.some(p=>p.skillDevelopment)).toBe(true);
    expect(loaded.player.cash).toBe(s.player.cash);expect(loaded.currentDate).toBe(s.currentDate);
    expect(depthOf(repairGameState(loaded)).achievements).toEqual(depthOf(loaded).achievements);
  });
  it('unlocks all four from qualifying evidence, persists them and never repeats notifications',()=>{
    let s:GameState=fresh();s.careerSystems.pro.hasTourCard=false;s.careerDepth={...depthOf(s),achievements:[]};s=reconcileAchievements(s);s={...s,matches:[{...match(s,'milestone'),round:'Semi Final'}],careerSystems:{...s.careerSystems,pro:{...s.careerSystems.pro,hasTourCard:true}}};
    const earned=reconcileAchievements(s);expect(depthOf(earned).achievements).toHaveLength(4);
    expect(earned.inbox.filter(i=>i.id.startsWith('achievement:'))).toHaveLength(4);
    expect(reconcileAchievements({...earned,matches:[],inbox:[]}).inbox).toHaveLength(0);
    expect(depthOf(repairGameState(JSON.parse(JSON.stringify(earned)))).achievements).toHaveLength(4);
  });
  it('does not treat a qualifying final or a non-televised victory as those achievements',()=>{
    let s:GameState=fresh();s.careerSystems.pro.hasTourCard=false;s.careerDepth={...depthOf(s),achievements:[]};const qualifier=s.tournaments.find(t=>t.type==='Q School'&&!/review/i.test(t.name))!;s.tournaments=[qualifier];
    s={...s,matches:[{...match(s,'qualifier'),round:'Final',highestBreak:45,centuries:0,televised:false}],history:{...s.history,legacy:undefined}};
    const earned=reconcileAchievements(s);expect(depthOf(earned).achievements).toEqual([]);
  });
});
describe('tour skill development',()=>{
  it('starts old saves at today, develops prospects and veterans differently, and is reload/step invariant',()=>{
    const s=fresh(),p={...s.worldPlayers.find(p=>p.playerName!==s.player.fullName)!,skillDevelopment:undefined};
    const base=evolveTourSkills({...s,currentDate:'2026-01-01',worldPlayers:[{...p,id:'young',age:18,developmentPotential:95,overallRating:60,injuryWeeks:0},{...p,id:'old',age:48,injuryWeeks:0},{...p,id:'retired',retired:true}]});
    expect(base.worldPlayers[0].skillDevelopment?.history).toHaveLength(0);
    const jump=evolveTourSkills({...base,currentDate:'2027-01-01'});
    let stepped=base;for(let m=2;m<=13;m++)stepped=evolveTourSkills({...stepped,currentDate:m===13?'2027-01-01':`2026-${String(m).padStart(2,'0')}-01`});
    expect(stepped.worldPlayers).toEqual(jump.worldPlayers);
    expect(developmentEdge(jump.worldPlayers[0].skillDevelopment)).toBeGreaterThan(0);
    expect(jump.worldPlayers[1].skillDevelopment!.offsets.stamina).toBeLessThan(0);
    expect(jump.worldPlayers[2].skillDevelopment).toBeUndefined();
    expect(evolveTourSkills(jump)).toBe(jump);
    const profile={longPotting:70,breakBuilding:70,safetyPlay:70,composure:70,stamina:70};
    expect(applyTourSkills(profile,jump.worldPlayers[1].skillDevelopment).stamina).toBeLessThan(profile.stamina);
  });
});
describe('evidence-based commentary',()=>{
  it('recognises a real comeback and a decider without inventing them in short matches',()=>{
    const frames=['B','B','A','A'].map((winner,i)=>({frame:String(i+1),winner,player:'60',opponent:'50'}));
    const live={playerName:'A',opponentName:'B',playerFrames:2,opponentFrames:2,bestOf:5,framesNeeded:3,frameHistory:frames};
    expect(frameStory(live,true)).toContain('completes the comeback');
    expect(frameStory({...live,playerFrames:1,frameHistory:frames.slice(0,3)},true)).toContain('deciding frame');
    expect(frameStory({...live,bestOf:1,framesNeeded:1,playerFrames:0,opponentFrames:0,frameHistory:[]},true)).toBe('');
  });
  it('calls out a personal best only once and missed scoring chances only with evidence',()=>{
    const args={actorName:'A',success:true,foul:false,pot:true,previousBreak:65,breakTotal:72,personalBest:70,previousMatchBest:60,player:true,pointsBefore:65,otherPoints:0,remaining:82};
    expect(visitStory(args)).toContain('career best');
    expect(visitStory({...args,previousMatchBest:80})).toBe('');
    expect(visitStory({...args,success:false,previousBreak:35})).toContain('ends on 35');
    expect(visitStory({...args,success:false,foul:true})).toBe('');
  });
});

describe('development reaches match simulation',()=>{
  it('changes CPU win chances using the player development snapshot',()=>{
    const state=fresh(),event=getNextEligibleTournament(state)!;
    const draw=(edge:number):BracketRound[]=>[{label:'Final',matches:[{id:'cpu',top:{name:'A',rank:1,nation:'ENG',developmentEdge:edge},bottom:{name:'B',rank:1,nation:'ENG'},placeholder:false}]}];
    const baseline=resolveTournamentDrawRound(draw(0),event,'Final','Human',()=>.52)[0].matches[0];
    const developed=resolveTournamentDrawRound(draw(8),event,'Final','Human',()=>.52)[0].matches[0];
    expect(baseline.top.score).toBeLessThan(baseline.bottom.score!);expect(developed.top.score).toBeGreaterThan(developed.bottom.score!);
  });
  it('carries individual skills into live play and records televised evidence on settlement',()=>{
    const random=vi.spyOn(Math,'random').mockReturnValue(.5);
    try {
      let state:GameState=fresh();const event=getNextEligibleTournament(state)!;
      state=enterTournamentState(state,event.id);state=bookTravelState(state,event.id);
      state=confirmTournamentPreparationState(state,event.id,'balanced',getDefaultPreparationAllocations(),[]);state=continueToNextTournamentState(state);
      const baseline=startLiveMatchState(state,event.id).liveMatch!;
      state={...state,worldPlayers:state.worldPlayers.map(p=>p.playerName===baseline.opponentName?{...p,skillDevelopment:{reviewedMonth:state.currentDate.slice(0,7),focus:'safetyPlay',offsets:{longPotting:0,breakBuilding:0,safetyPlay:4,composure:0,stamina:0},history:[]}}:p),tournaments:state.tournaments.map(t=>t.id===event.id?{...t,televisedRounds:[baseline.round]}:t)};
      state=startLiveMatchState(state,event.id);expect(state.liveMatch!.opponentVisitProfile.safetyPlay).toBeGreaterThan(baseline.opponentVisitProfile.safetyPlay);
      expect(state.liveMatch!.careerBestAtStart).toBeDefined();
      const settled=finalizeLiveMatch(state,{...state.liveMatch!,status:'Completed',playerFrames:state.liveMatch!.framesNeeded,opponentFrames:0,playerHighestBreak:101});
      expect(settled.matches[0].televised).toBe(true);expect(depthOf(settled).achievements?.some(a=>a.id==='televised-win')).toBe(true);
    } finally {random.mockRestore();}
  });
});
