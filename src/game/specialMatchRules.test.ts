import { describe, expect, it } from 'vitest';
import { createStarterState, enterTournamentState, bookTravelState, confirmTournamentPreparationState, startLiveMatchState, advanceLiveVisit, simulateTournamentMatchState } from '../hooks/useGameState';
import { getDefaultPreparationAllocations } from './tournamentPreparation';
import { reconcileRealism } from './realism';
import { shootOutClock, stepShootOut, stepBallShootOut, attemptGoldenBall } from './specialMatchRules';
import { sessionPlan, pendingMatchBreak } from './realism/sessions';
function fixture() {
  let state = createStarterState(); state.player.cash = 100000;
  const event = state.tournaments.find(t => t.name === 'Shoot Out')!; state.tournaments = [event];
  state = enterTournamentState(state, event.id); state = bookTravelState(state, event.id);
  state = confirmTournamentPreparationState(state, event.id, 'balanced', getDefaultPreparationAllocations(), []);
  state = reconcileRealism({ ...state, currentDate: event.startDate });
  return { state, event, live: startLiveMatchState(state, event.id).liveMatch! };
}
describe('special match rules', () => {
  it('changes the shot clock at five minutes', () => { expect(shootOutClock(299)).toBe(15); expect(shootOutClock(300)).toBe(10); });
  it('ends at ten minutes using actual points, and uses blue-ball attempts for tied scores', () => {
    const { live } = fixture();
    const timed = { ...live, playerPoints: 20, opponentPoints: 8, special: { ...live.special!, elapsedSeconds: 599 } };
    const next = stepShootOut(timed, undefined, () => .5);
    expect(next.special).toMatchObject({ elapsedSeconds: 600, frameComplete: true });
    const tied = stepShootOut({ ...timed, opponentPoints: 20 }, undefined, () => .5);
    expect(tied.special?.tieBall).toBe('Blue'); expect(tied.special?.frameComplete).toBe(false);
    const first = stepBallShootOut(tied, 'Blue', () => 0);
    expect(first.special?.frameComplete).toBe(false);
    const second = stepBallShootOut(first, 'Blue', () => .99);
    expect(second.special?.frameComplete).toBe(true); expect(second.playerPoints).toBeGreaterThan(second.opponentPoints);
  });
  it('awards a clock foul and ball in hand without replaying the shot', () => {
    const { live } = fixture();
    const next = stepShootOut({ ...live, playerAtTable: live.playerName, tempo: 'Deliberate', special: { ...live.special!, elapsedSeconds: 301 } }, undefined, () => .99);
    expect(next.special?.ballInHand).toBe(true); expect(next.opponentPoints).toBe(4);
    expect(next.playerAtTable).toBe(live.opponentName);
  });
  it('finishes manual and quick Shoot Out matches over exactly one timed frame', () => {
    const { live, state, event } = fixture(); let played = live;
    for (let i = 0; i < 1000 && played.status !== 'Completed'; i++) played = advanceLiveVisit(played);
    expect(played.status).toBe('Completed'); expect(played.frameHistory).toHaveLength(1); expect(played.timeElapsedMinutes).toBeLessThanOrEqual(10);
    const quick = simulateTournamentMatchState(state, event.id);
    expect(quick.matches[0].bestOf).toBe(1); expect(quick.matches[0].playerFrames + quick.matches[0].opponentFrames).toBe(1);
  });
  it('replaces a seniors deciding frame with black-ball attempts', () => {
    const { live } = fixture();
    let next: typeof live = { ...live, bestOf: 7, framesNeeded: 4, playerFrames: 3, opponentFrames: 3, currentFrame: 7, special: { rules: ['blackBallDecider'], elapsedSeconds: 0 } };
    for (let i = 0; i < 500 && next.status !== 'Completed'; i++) next = advanceLiveVisit(next) as typeof next;
    expect(next.status).toBe('Completed'); expect(next.special?.tieBall).toBe('Black');
    expect(next.playerPoints + next.opponentPoints).toBe(7);
  });
  it('only offers the golden ball after a 147 and never attempts it twice', () => {
    const { live } = fixture(); const special = { rules: ['goldenBall'], elapsedSeconds: 0 };
    expect(attemptGoldenBall({ ...live, currentBreak: 140, special }, () => 0).currentBreak).toBe(140);
    const maximum = attemptGoldenBall({ ...live, currentBreak: 147, playerAtTable: live.playerName, playerPoints: 147, special }, () => 0);
    expect(maximum.playerHighestBreak).toBe(167); expect(maximum.playerPoints).toBe(167);
    expect(attemptGoldenBall(maximum, () => 0).playerPoints).toBe(167);
  });
  it('does not put a mid-session interval in a best-of-seven match', () => {
    const { live } = fixture();
    expect(pendingMatchBreak({ ...live, playerFrames: 2, opponentFrames: 2, sessions: sessionPlan(7) })).toBeNull();
    expect(pendingMatchBreak({ ...live, playerFrames: 2, opponentFrames: 2, sessions: sessionPlan(9) })?.kind).toBe('interval');
  });
});
