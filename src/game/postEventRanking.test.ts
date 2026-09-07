import { describe, expect, it } from 'vitest';
import { postEventRankingFixture } from '../../test-support/postEventRankingFixture';
import { capturePostEventRankings, postEventRanking } from './postEventRanking';
import { processRankingCalendar } from '../hooks/useGameState';

describe('post-event ranking publication', () => {
  it('marks an authentic completed event as pending rather than no movement', () => {
    const { state, message, finance } = postEventRankingFixture();
    const info = postEventRanking(state, finance, message.eventRanking)!;
    expect(info.pending).toBe(true);
    expect(info.snapshot.credit).toBe(30000);
    expect(info.detail).toBe('Ranking credit pending');
    expect(message.summary?.find(s => s.label === 'World Ranking')?.detail).toBe('Ranking credit pending');
    expect(info.snapshot.after).toBeUndefined();
  });
  it('captures the exact publication ranking and keeps it when later rankings change', () => {
    const { state, message, finance } = postEventRankingFixture();
    const publication = message.eventRanking!.publication;
    const updated = capturePostEventRankings(processRankingCalendar({ ...state, currentDate: publication }));
    const saved = updated.inbox.find(m => m.id === message.id)!.eventRanking!;
    const info = postEventRanking(updated, finance, saved)!;
    expect(info.pending).toBe(false);
    expect(info.snapshot.after).toBe(updated.rollingRankings!.revisions.find(r => r.date === publication)!.world[state.player.fullName]);
    expect(info.change).toMatch(/^#\d+ → #\d+$/);
    const older = structuredClone(updated);
    older.currentDate = '2031-01-01';
    older.rollingRankings!.revisions = [{ date: older.currentDate, world: { [state.player.fullName]: 100 }, oneYear: {} }];
    older.rollingRankings!.earnings = [];
    older.rollingRankings!.events = {};
    older.tournaments = [];
    expect(postEventRanking(older, finance, saved)?.snapshot).toEqual(saved);
  });
  it('does not invent movement when an older publication snapshot is missing', () => {
    const { state, message, finance } = postEventRankingFixture();
    state.currentDate = message.eventRanking!.publication;
    state.rollingRankings!.revisions = [];
    const info = postEventRanking(state, finance)!;
    expect(info.pending).toBe(false);
    expect(info.movement).toBeUndefined();
    expect(info.detail).toContain('unavailable');
  });
  it('reports up, down and unchanged using published ranks instead of the current player rank', () => {
    const { state, message, finance } = postEventRankingFixture();
    const publication = message.eventRanking!.publication;
    state.currentDate = publication;
    for (const [after, detail] of [[12, 'Up 2 places'], [16, 'Down 2 places'], [14, 'No movement at publication']] as const) {
      state.rollingRankings!.revisions = [{date:finance.startDate, world:{[state.player.fullName]:14}, oneYear:{}}, {date:publication, world:{[state.player.fullName]:after}, oneYear:{}}];
      expect(postEventRanking(state, finance)?.detail).toBe(detail);
    }
  });
});
