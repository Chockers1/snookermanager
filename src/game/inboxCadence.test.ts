import { describe, expect, it } from 'vitest';
import { compactRoutineInbox } from './inboxCadence';
import type { InboxMessage } from '../types/game';
import { createStarterState, enterTournamentState, bookTravelState, confirmTournamentPreparationState, getNextEligibleTournament } from '../hooks/useGameState';
import { getDefaultPreparationAllocations } from './tournamentPreparation';
import { updateWorldDigest } from './realism/digest';
import { realismOf } from './realism';

const reference = { id: 'event', startDate: '2026-09-21' };
const message = (id: string, subject: string, sender = 'Career Manager'): InboxMessage => ({ id, subject, sender, preview: id + ' details', date: '2026-09-16', priority: 'Medium', read: false });
const receipt = (id: string, subject: string, sender: string): InboxMessage => ({ ...message(id, subject, sender), tournamentReference: reference });

describe('routine inbox cadence', () => {
  it('keeps confirmations together, resolves the exact invitation, and preserves decisions and deadlines', () => {
    const decision = message('story:deciders', 'Turning deciding frames around');
    const deadline = message('entry-reminder', 'Tournament entry reminders');
    const invitation = receipt('invitation', 'Invitation: Test Open', 'Tournament Office');
    const result = compactRoutineInbox([
      receipt('prep', 'Test Open preparation confirmed', 'Performance Team'),
      receipt('travel', 'Test Open travel booked', 'Travel Desk'),
      receipt('entry', 'Entered Test Open', 'Tournament Office'), invitation, decision, deadline,
      message('result', 'Post-event report: Test Open'),
    ]);
    expect(result).toHaveLength(5);
    expect(result[0]).toMatchObject({ subject: 'Event arrangements: Test Open', read: true, priority: 'Low' });
    expect(result[0].summary?.map(s => s.detail)).toEqual(['prep details', 'travel details', 'entry details']);
    expect(result.find(m => m.id === invitation.id)?.read).toBe(true);
    expect(result).toContain(decision); expect(result).toContain(deadline);
    expect(result.find(m => m.id === 'result')?.read).toBe(false);
    expect(compactRoutineInbox(JSON.parse(JSON.stringify(result)))).toEqual(result);
    const unread = { ...result[0], read: false };
    expect(compactRoutineInbox([unread])[0].read).toBe(false);
  });
  it('never joins different event editions or guesses the edition of unknown old receipts', () => {
    const first = receipt('first', 'Entered Test Open', 'Tournament Office');
    const next = { ...first, id: 'next', tournamentReference: { ...reference, startDate: '2027-09-21' } };
    const unknown = message('old', 'Entered Test Open', 'Tournament Office');
    expect(compactRoutineInbox([next, first, unknown])).toHaveLength(3);
    expect(compactRoutineInbox([unknown])[0]).toBe(unknown);
  });
  it('retains the newest rebooking details without repeatedly appending old confirmations', () => {
    const old = compactRoutineInbox([receipt('old', 'Test Open travel booked', 'Travel Desk')]);
    const next = compactRoutineInbox([receipt('new', 'Test Open travel booked', 'Travel Desk'), ...old]);
    expect(next).toHaveLength(1); expect(next[0].summary).toHaveLength(1);
    expect(next[0].summary![0].detail).toBe('new details');
  });
  it.each(['Monthly', 'Fortnightly'])('combines matching weekly and %s reports with all summaries and warnings intact', (cadence) => {
    const weekly = { ...message('weekly', 'Season 1 · Week 18 report'), priority: 'High' as const,
      summary: [{ label: 'Weekly cash flow', value: '+£47' }], read: true };
    const training = { ...message('training', `${cadence} training report: Season 1 · Week 18 · 14 improved`),
      summary: [{ label: 'Focus', value: '+0.32' }] };
    const older = message('older', 'Season 1 · Week 17 report');
    const result = compactRoutineInbox([weekly, training, older]);
    expect(result).toHaveLength(2); expect(result[0]).toMatchObject({ id: 'training', priority: 'High', read: false });
    expect(result[0].preview).toContain(weekly.preview); expect(result[0].summary).toHaveLength(2);
    expect(result[1]).toBe(older); expect(compactRoutineInbox(result)).toEqual(result);
  });
  it('applies the policy to real entry, travel and preparation actions', () => {
    let state = createStarterState(); state.player.cash = 50000;
    const event = getNextEligibleTournament(state)!;
    state = enterTournamentState(state, event.id);
    state = bookTravelState(state, event.id);
    state = confirmTournamentPreparationState(state, event.id, 'balanced', getDefaultPreparationAllocations(), []);
    const receipts = state.inbox.filter(m => m.routineArrangement?.reference.id === event.id);
    expect(receipts).toHaveLength(1); expect(receipts[0].summary).toHaveLength(3);
    expect(receipts[0].read).toBe(true);
    expect(state.player.inboxCount).toBe(state.inbox.filter(m => !m.read).length);
  });
  it('updates one weekly tour-news edition, preserves read status and starts another on Monday', () => {
    let state = createStarterState(); state.currentDate = '2026-09-16'; state.matches = []; state.inbox = [];
    state.realism = { ...realismOf(state), digest: [], seenEvents: [], seenMatches: [] };
    const event = (id: string) => ({ key: id, tournamentId: id, name: id, season: state.season,
      completedOn: state.currentDate, applied: true, ranking: false,
      bracket: [{ label: 'Final', matches: [{ id, top: { name: 'Named winner', nation: 'ENG', rank: 1, score: 3 }, bottom: { name: 'Named finalist', nation: 'ENG', rank: 2, score: 1 } }] }] });
    state.rollingRankings = { ...state.rollingRankings!, events: { a: event('First event') } };
    state = updateWorldDigest(state); state.inbox[0].read = true;
    state.currentDate = '2026-09-18'; state.rollingRankings!.events.b = event('Second event');
    state = updateWorldDigest(state);
    expect(state.inbox).toHaveLength(1); expect(state.inbox[0].read).toBe(true);
    expect(state.inbox[0].preview).toContain('First event'); expect(state.inbox[0].preview).toContain('Second event');
    expect(state.realism!.digest).toHaveLength(1);
    expect(updateWorldDigest(JSON.parse(JSON.stringify(state))).inbox).toEqual(state.inbox);
    state.currentDate = '2026-09-21'; state.rollingRankings!.events.c = event('Third event');
    state = updateWorldDigest(state); expect(state.inbox).toHaveLength(2); expect(state.inbox[0].read).toBe(false);
  });
});
