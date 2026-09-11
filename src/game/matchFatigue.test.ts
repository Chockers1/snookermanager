import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStarterState, enterTournamentState, bookTravelState, confirmTournamentPreparationState, startLiveMatchState, advanceLiveVisit, resolveCompletedLiveFrame, finalizeLiveMatch, simulateTournamentMatchState, type GameState } from '../hooks/useGameState';
import { getDefaultPreparationAllocations } from './tournamentPreparation';
import { pendingMatchBreak, resolveSessionBreak, sessionPlan } from './realism/sessions';
import type { BreakChoice } from './realism/types';

type Live = NonNullable<GameState['liveMatch']>;
function fixture() {
  let state = createStarterState();
  state.player.cash = 100000;
  const event = state.tournaments.find(t => t.name === 'Shanghai Masters')!;
  state = enterTournamentState(state, event.id);
  state = bookTravelState(state, event.id);
  state = confirmTournamentPreparationState(state, event.id, 'balanced', getDefaultPreparationAllocations(), []);
  state = startLiveMatchState({ ...state, currentDate: event.startDate }, event.id);
  if (!state.liveMatch) throw new Error(state.lastAction);
  return { state, event, live: state.liveMatch };
}

// Alternate cleared-table results to exercise every frame and session of a
// decider. No visit costs are added: this is the minimum seated workload.
function decider(base: Live, bestOf: number, stamina: number, choice: BreakChoice) {
  let live: Live = { ...base, bestOf, framesNeeded: Math.ceil(bestOf / 2),
    playerFrames: 0, opponentFrames: 0, currentFrame: 1, frameHistory: [],
    playerFatigue: 0, opponentFatigue: 0, sessions: sessionPlan(bestOf),
    playerVisitProfile: { ...base.playerVisitProfile, stamina, handSteadiness: stamina },
    opponentVisitProfile: { ...base.opponentVisitProfile, stamina, handSteadiness: stamina } };
  for (let frame = 0; frame < bestOf; frame++) {
    live = resolveCompletedLiveFrame({ ...live, playerPoints: frame % 2 === 0 ? 70 : 0,
      opponentPoints: frame % 2 === 0 ? 0 : 70, currentBreak: 0,
      tableState: { redsRemaining: 0, coloursRemaining: [] } }, 'Simmed');
    if (pendingMatchBreak(live)) live = resolveSessionBreak(live, choice);
  }
  return live;
}

afterEach(() => vi.restoreAllMocks());
describe('match fatigue workload and settlement', () => {
  it('keeps difficulty out of match attributes, preparation and winning chances',()=>{
    const {state,event}=fixture();const outputs=[];
    for(const difficulty of ['relaxed','standard','demanding'] as const){
      vi.spyOn(Math,'random').mockReturnValue(.3);
      const match=startLiveMatchState({...state,liveMatch:null,difficulty},event.id).liveMatch!;
      outputs.push({player:match.playerVisitProfile,opponent:match.opponentVisitProfile,chance:match.plannedMatchWinChance,confidence:match.playerConfidence,fatigue:match.playerFatigue});
    }
    expect(outputs[0]).toEqual(outputs[1]);expect(outputs[1]).toEqual(outputs[2]);
  });
  it('lets a tired cautious opponent take scoring chances instead of choosing endless safeties',()=>{
    const {live}=fixture();vi.spyOn(Math,'random').mockReturnValue(.01);
    const tired:Live={...live,playerAtTable:live.opponentName,opponentApproach:'Tight',opponentFatigue:80,opponentVisitProfile:{...live.opponentVisitProfile,longPotting:90,safetyPlay:90},currentVisit:1};
    expect(advanceLiveVisit(tired,undefined,'simulated','shot').visitHistory[0].decision).toBe('Pot Attempt');
    const specialist={...tired,opponentVisitProfile:{...tired.opponentVisitProfile,longPotting:60}};
    expect(advanceLiveVisit(specialist,undefined,'simulated','shot').visitHistory[0].decision).toBe('Safety Exchange');
    expect(advanceLiveVisit({...specialist,currentVisit:3},undefined,'simulated','shot').visitHistory[0].decision).toBe('Pot Attempt');
  });
  it('allows a safety-first player to pot the remaining colours',()=>{
    const {live}=fixture();vi.spyOn(Math,'random').mockReturnValue(.01);
    const cautious:Live={...live,playerAtTable:live.playerName,tacticalPlan:'Safety',currentVisit:3,tableState:{redsRemaining:0,coloursRemaining:['Yellow','Green','Brown','Blue','Pink','Black']}};
    expect(advanceLiveVisit(cautious,undefined,'simulated','shot').visitHistory[0].decision).toBe('Pot Attempt');
  });

  it('leaves both players tired after a 25-frame decider even at elite stamina', () => {
    const { live } = fixture();
    for (const choice of ['recover', 'reset', 'review'] as const) {
      const finished = decider(live, 25, 99, choice);
      expect(finished.playerFrames).toBe(13);
      expect(finished.opponentFrames).toBe(12);
      expect(finished.playerFatigue).toBeGreaterThan(8);
      expect(finished.opponentFatigue).toBeGreaterThan(8);
      expect(finished.sessions?.completedBreaks).toHaveLength(5);
    }
  });

  it('rewards stamina and rest without eliminating long-match workload', () => {
    const { live } = fixture();
    const elite = decider(live, 25, 99, 'recover');
    const developing = decider(live, 25, 50, 'recover');
    const mentalReset = decider(live, 25, 99, 'reset');
    expect(developing.playerFatigue).toBeGreaterThan(elite.playerFatigue + 10);
    expect(mentalReset.playerFatigue).toBeGreaterThan(elite.playerFatigue + 5);
    expect(elite.playerFatigue).toBeLessThan(40);
  });

  it('retains the completed live fatigue instead of subtracting break recovery again', () => {
    const { state, live } = fixture();
    state.player.fatigue = 0;
    const finished = decider(live, 25, 75, 'reset');
    const result = finalizeLiveMatch(state, finished);
    expect(result.player.fatigue).toBeCloseTo(finished.playerFatigue, 2);
    const match = result.matches.find(m => m.sourceMatchId === finished.sessionId)!;
    expect(match.fatigueChange).toBeCloseTo(finished.playerFatigue, 2);
    expect(finalizeLiveMatch(result, finished).player.fatigue).toBe(result.player.fatigue);
  });

  it('records genuine net recovery without changing the value seen at match end', () => {
    const { state, live } = fixture();
    state.player.fatigue = 65;
    const finished = { ...decider(live, 25, 99, 'recover'), playerFatigue: 57.345 };
    const result = finalizeLiveMatch(state, finished);
    expect(result.player.fatigue).toBe(57.35);
    expect(result.matches.find(m => m.sourceMatchId === finished.sessionId)?.fatigueChange).toBe(-7.65);
  });

  it('charges Quick Sim workload for a fresh player', () => {
    const { state, event } = fixture();
    state.player.fatigue = 0;
    state.liveMatch = null;
    let seed = 104729;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    });
    const result = simulateTournamentMatchState(state, event.id);
    const match = result.matches.find(m => m.tournamentId === event.id)!;
    expect(match, result.lastAction).toBeDefined();
    expect(match.playerFrames + match.opponentFrames).toBeGreaterThanOrEqual(6);
    expect(result.player.fatigue).toBeGreaterThan(5);
    expect(match.fatigueChange).toBe(result.player.fatigue);
  });
});
