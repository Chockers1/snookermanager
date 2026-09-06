import { describe, expect, it } from 'vitest';
import { matchObjectives, assessMatchObjectives, matchDebrief, coachingAdvice } from './matchInsights';
import { recordEncounter, getRivalry, learnedCounter } from './careerDepth/relationships';
import { createStarterState, enterTournamentState, getNextEligibleTournament, bookTravelState, confirmTournamentPreparationState, continueToNextTournamentState, startLiveMatchState, finalizeLiveMatch, repairGameState } from '../hooks/useGameState';
import { getDefaultPreparationAllocations } from './tournamentPreparation';
import type { Match } from '../types/game';

function fixtureMatch(id: string): Match {
  const state = createStarterState(), opponent = state.worldPlayers[0];
  return { ...state.matches[0], id, tournamentId: state.tournaments[0].id, playedOn: state.currentDate, playerName: state.player.fullName, opponentId: opponent.id, opponentName: opponent.playerName, playerRanking: 100, opponentRanking: 10, round: 'Last 32', bestOf: 7, playerFrames: 3, opponentFrames: 4, result: 'Lost', highestBreak: 65, opponentHighestBreak: 70, fifties: 1, centuries: 0, potSuccess: 80, longPotSuccess: 75, safetySuccess: 70, fouls: 1, fatigueChange: 8, playerTactic: 'Attack', frameHistory: [] };
}
describe('connected match development', () => {
  it('sets attainable objectives for underdogs and uses the actual match length', () => {
    const state = createStarterState();
    state.rankings = state.rankings.map(r => r.playerName === state.player.fullName ? { ...r, ranking: 100 } : r);
    const short = matchObjectives(state, 5, 7), long = matchObjectives(state, 5, 19);
    expect(short.find(g => g.id === 'frames')?.target).toBe(1);
    expect(long.find(g => g.id === 'frames')?.target).toBe(3);
    expect(matchObjectives(state, 5, 1).map(g => g.id)).toEqual(['break']);
    expect(matchObjectives(state, 100, 4).find(g => g.id === 'frames')?.target).toBe(1);
  });
  it('recognises progress in defeat without assigning retroactive objectives', () => {
    const match = fixtureMatch('goal');
    const goals = assessMatchObjectives([{ id: 'frames', label: 'Win a frame', target: 1 }, { id: 'break', label: '40 break', target: 40 }], match);
    expect(goals.every(g => g.achieved)).toBe(true);
    expect(assessMatchObjectives(undefined, match)).toEqual([]);
  });
  it('uses recorded frame margins and fouls to recommend specific training', () => {
    const state = createStarterState(); const match = { ...fixtureMatch('review'), fouls: 8, frameHistory: [{ frame: '1', player: '60', opponent: '65', winner: 'Other' }] };
    const review = matchDebrief(state, match);
    expect(review.training.kind).toBe('cue-action');
    expect(review.training.reason).toContain('8 fouls');
    expect(review.evidence.join(' ')).toContain('within 15 points');
    expect(review.training.sessions).toContain('Line-Up Drill');
  });
  it('gives cautious advice with little evidence and protects imminent event preparation', () => {
    const state = createStarterState(); state.matches = []; state.player.fatigue = 72;
    const event = { ...state.tournaments[0], startDate: state.currentDate };
    const advice = coachingAdvice(state, 'Unknown player', event);
    expect(advice.tactic).toBe('Safety'); expect(advice.tactical).toContain('72%');
    expect(advice.evidence).toContain('Fewer than three'); expect(advice.schedule).toContain('Match Prep, Review and Rest');
  });
  it('builds durable rivalry history, counters familiar tactics, and ignores single-frame deciders', () => {
    let state = createStarterState(); const match = { ...fixtureMatch('r1'), opponentId: state.worldPlayers[0].id, opponentName: state.worldPlayers[0].playerName };
    for (let i=0;i<3;i++) state = recordEncounter(state, { ...match, id: 'r' + i });
    const rivalry = getRivalry(state, match.opponentName)!;
    expect(rivalry.rivalry).toBe(true); expect(rivalry.deciders).toBe(3);
    expect(rivalry.meetings).toHaveLength(3); expect(learnedCounter(state, match.opponentName)).toBe('Tight');
    expect(recordEncounter(state, { ...match, id: 'r2' })).toBe(state);
    const reloaded = JSON.parse(JSON.stringify(state)); expect(getRivalry(reloaded, match.opponentName)).toEqual(rivalry);
    const single = recordEncounter({ ...state, careerDepth: { ...state.careerDepth!, relationships: {} } }, { ...match, id:'single', bestOf:1, playerFrames:0, opponentFrames:1 });
    expect(getRivalry(single, match.opponentName)?.deciders).toBe(0);
  });
  it.each([false, true])('locks goals and awards progress once, including rivalry rebound: %s', (rivalry) => {
    let state = createStarterState(); const event = getNextEligibleTournament(state)!;
    state = enterTournamentState(state, event.id); state = bookTravelState(state, event.id);
    state = confirmTournamentPreparationState(state,event.id,'balanced',getDefaultPreparationAllocations(),[]);
    state = continueToNextTournamentState(state); state = startLiveMatchState(state,event.id);
    expect(state.liveMatch?.objectives?.length).toBeGreaterThan(0);
    const goals = state.liveMatch!.objectives;
    expect(repairGameState(JSON.parse(JSON.stringify(state))).liveMatch?.objectives).toEqual(goals);
    state.player.confidence=65;
    if (rivalry) {
      const opponent=state.worldPlayers.find(p=>p.playerName===state.liveMatch!.opponentName)!;
      state.careerDepth!.relationships[opponent.id]={opponentId:opponent.id,name:opponent.playerName,wins:1,losses:2,deciders:2,rivalry:true,recent:['L'],tactics:{Attack:3}};
    }
    const live = { ...state.liveMatch!, status:'Completed' as const, playerFrames:state.liveMatch!.framesNeeded, opponentFrames:0, playerHighestBreak:100 };
    const after = finalizeLiveMatch(state,live);
    expect(after.matches[0].objectives?.every(g=>g.achieved)).toBe(true);
    expect(after.matches[0].debrief?.confidenceBonus).toBe(rivalry ? 2 : 1);
    expect(after.player.confidence - state.player.confidence).toBe(after.matches[0].confidenceChange);
    expect(after.careerDepth?.objectiveRecord?.achieved).toBe(goals!.length);
    expect(finalizeLiveMatch(after,live)).toBe(after);
  });
});
