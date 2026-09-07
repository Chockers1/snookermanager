import { describe, expect, it } from 'vitest';
import { createStarterState } from '../hooks/useGameState';
import { applyInboxReadOverlay, encodeInboxReadOverlay, inboxReadStorageKey, isInboxReadOnlyChange, updateInboxReadState } from './inboxReadState';

function fixture() {
  const state = createStarterState();
  state.inbox = [0, 1].map(i => ({ id: 'message-' + i, sender: 'Manager', subject: 'Update ' + i, preview: 'Report', priority: 'Medium' as const, read: false, date: 'Today' }));
  return state;
}
describe('lightweight inbox read state', () => {
  it('changes only read flags, badges and status text, with no career recalculation', () => {
    const state = fixture(), next = updateInboxReadState(state, 'message-0');
    expect(next.inbox.map(m => m.read)).toEqual([true, false]);
    expect(next.player.inboxCount).toBe(1);
    expect(next.player.notificationCount).toBe(1);
    expect(next.history).toBe(state.history);
    expect(next.competitionTables).toBe(state.competitionTables);
    expect(next.worldPlayers).toBe(state.worldPlayers);
    expect(next.player.cash).toBe(state.player.cash);
    expect(next.currentDate).toBe(state.currentDate);
    expect(isInboxReadOnlyChange(state, next)).toBe(true);
    expect(updateInboxReadState(next, 'message-0')).toBe(next);
    expect(updateInboxReadState(next, 'missing')).toBe(next);
    const all = updateInboxReadState(next);
    expect(all.player.inboxCount).toBe(0);
    expect(updateInboxReadState(all, 'message-1', false).player.inboxCount).toBe(1);
  });
  it('never shortcuts gameplay or message-content changes', () => {
    const state = fixture(), read = updateInboxReadState(state, 'message-0');
    expect(isInboxReadOnlyChange(state, { ...read, currentDate: '2030-01-01' })).toBe(false);
    expect(isInboxReadOnlyChange(state, { ...read, player: { ...read.player, cash: 999 } })).toBe(false);
    expect(isInboxReadOnlyChange(state, { ...read, history: { ...read.history } })).toBe(false);
    expect(isInboxReadOnlyChange(state, { ...read, inbox: read.inbox.map(m => ({ ...m, preview: 'Different report' })) })).toBe(false);
    expect(isInboxReadOnlyChange(state, { ...read, inbox: read.inbox.slice(0, 1) })).toBe(false);
  });
  it('restores read state from a tiny overlay bound to the exact career and base save', () => {
    const state = fixture(), read = updateInboxReadState(state, 'message-0');
    const overlay = encodeInboxReadOverlay(read, 'base-save');
    expect(overlay.length).toBeLessThan(500);
    expect(applyInboxReadOverlay(state, 'base-save', overlay).inbox).toEqual(read.inbox);
    expect(applyInboxReadOverlay(state, 'different-save', overlay)).toBe(state);
    const other = { ...state, player: { ...state.player, id: 'another-career' } };
    expect(applyInboxReadOverlay(other, 'base-save', overlay)).toBe(other);
    expect(inboxReadStorageKey('slot-one')).not.toBe(inboxReadStorageKey('slot-two'));
    expect(applyInboxReadOverlay(state, 'base-save', 'broken JSON')).toBe(state);
    expect(applyInboxReadOverlay(state, 'base-save', null)).toBe(state);
  });
});
