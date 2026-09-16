import { describe, expect, it } from 'vitest';
import { advanceWeekState, createStarterState, enterTournamentState, getNextEligibleTournament, skipTournamentState } from '../hooks/useGameState';
import { initializeCareerDepth } from './careerDepth';
import { depthOf, plusDays } from './careerDepth/shared';
import { scheduleCommitment } from './careerDepth/commitments';

function fixture(offset = 25) {
  const state = initializeCareerDepth(createStarterState());
  const events = ['British Open', 'Wuhan Open'].map(name => state.tournaments.find(t => t.name === name)!);
  state.tournaments = [0, offset].map((days, i) => ({ ...events[i],
    startDate: plusDays(state.currentDate, days + 3), endDate: plusDays(state.currentDate, days + 8),
    entryDeadline: plusDays(state.currentDate, days), status: 'Available' as const }));
  return state;
}

describe('skipping advances the career to the next entry decision', () => {
  it('settles normal training, money and CPU results, stopping exactly seven days before entry closes', () => {
    const state = fixture();
    const [declined, target] = state.tournaments;
    const next = skipTournamentState(state, declined.id);
    expect(next.currentDate).toBe(plusDays(target.entryDeadline!, -7));
    expect(next.week).toBeGreaterThan(state.week);
    expect(next.player.cash).not.toBe(state.player.cash);
    expect(next.attributes).not.toEqual(state.attributes);
    const published = Object.values(next.rollingRankings!.events).find(e => e.tournamentId === declined.id)!;
    expect(published.applied).toBe(true);
    const final = published.bracket!.at(-1)!.matches[0];
    expect(final.top.score).toEqual(expect.any(Number));
    expect(final.bottom.score).toEqual(expect.any(Number));
    expect(next.matches).toEqual(state.matches);
    expect(next.tournaments.find(t => t.id === declined.id)?.status).toBe('Skipped');
    expect(getNextEligibleTournament(next)?.id).toBe(target.id);
    expect(next.tournaments.find(t => t.id === target.id)?.status).toBe('Available');
    expect(next.travel.bookings[target.id]).toBeUndefined();
    expect(next.history.tournamentHistory.find(h => h.tournamentId === declined.id)?.entryPaid ?? 0).toBe(0);
    expect(next.inbox[0].subject).toBe(`Invitation: ${target.name}`);
    expect(next.lastAction).toContain(`Advanced to ${next.currentDate}`);
    const repeated = skipTournamentState(JSON.parse(JSON.stringify(next)), declined.id);
    expect(repeated.currentDate).toBe(next.currentDate);
    expect(repeated.player.cash).toBe(next.player.cash);
  });

  it('does not apply the next weekly settlement early at a partial-week stop', () => {
    const state = fixture(10);
    const next = skipTournamentState(state, state.tournaments[0].id);
    expect(next.currentDate).toBe(plusDays(state.currentDate, 3));
    expect(next.player.cash).toBe(state.player.cash);
    expect(next.week).toBe(state.week);
    expect(depthOf(next).nextSettlementDate).toBe(depthOf(state).nextSettlementDate);
    const settled = advanceWeekState(next);
    expect(settled.week).toBe(state.week + 1);
  });

  it('explains why no time passes when the next deadline is already close', () => {
    const state = fixture(5);
    const next = skipTournamentState(state, state.tournaments[0].id);
    expect(next.currentDate).toBe(state.currentDate);
    expect(next.lastAction).toContain('Already within the next entry window');
  });

  it('stops at a booked commitment rather than simulating through it', () => {
    const state = fixture();
    const booked = scheduleCommitment(state, 'club-work', plusDays(state.currentDate, 9));
    const next = skipTournamentState(booked, state.tournaments[0].id);
    expect(next.currentDate).toBe(plusDays(state.currentDate, 9));
    expect(depthOf(next).commitments[0].status).toBe('scheduled');
  });

  it('does not advance past an existing tournament entry', () => {
    const state = fixture();
    const entered = enterTournamentState(state, state.tournaments[1].id);
    const next = skipTournamentState(entered, state.tournaments[0].id);
    expect(next.currentDate).toBe(state.currentDate);
    expect(next.lastAction).toContain('Tournament Hub');
  });

  it('does not jump dates or loop when no eligible event remains', () => {
    const state = fixture();
    state.tournaments = state.tournaments.slice(0, 1);
    const next = skipTournamentState(state, state.tournaments[0].id);
    expect(next.currentDate).toBe(state.currentDate);
    expect(next.lastAction).toContain('No other eligible event');
  });
});
