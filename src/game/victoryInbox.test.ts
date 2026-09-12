import { describe, expect, it } from 'vitest';
import { victoryFixture } from '../../test-support/victoryFixture';
import { qualificationFixture } from '../../test-support/qualificationFixture';
import { captureVictoryMessages, victoryForMessage, victoryMessageTitle, victoryMessagePreview } from './victoryInbox';

describe('championship inbox reports', () => {
  it('captures a final at event completion and upgrades an existing generic message', () => {
    const {state,event} = victoryFixture();
    const message = state.inbox.find(m=>m.subject===`Post-event report: ${event.name}`)!;
    expect(message.victoryReport?.score).toBe('10–9');
    expect(state.inbox.filter(m => m.subject.startsWith('Win at '))).toHaveLength(0);
    expect(state.inbox.filter(m => m.subject === `Post-event report: ${event.name}`)).toHaveLength(1);
    expect(message.eventResults).toEqual(state.history.tournamentHistory.find(h => h.tournamentId === event.id)!.roundResults);
    expect(message.eventResults!.length).toBeGreaterThan(1);
    expect(message.eventResults!.at(-1)).toMatchObject({ round: 'Final', result: 'Won', playerFrames: 10, opponentFrames: 9 });

    expect(victoryMessageTitle(message)).toBe('Champion: Wuhan Open');
    expect(victoryMessagePreview(message)).toContain('£140,000 prize secured');
    delete message.victoryReport;
    expect(victoryForMessage(state,message)?.frameHighlight).toBe('Deciding frame: 106–0');
    const updated = captureVictoryMessages(state).inbox.find(m=>m.id===message.id)!;
    expect(updated.victoryReport?.milestone).toBe('First recorded ranking title');
  });
  it('keeps the exact final when recent matches and old event data are pruned', () => {
    const {state,event} = victoryFixture();
    const message = state.inbox.find(m=>m.subject===`Post-event report: ${event.name}`)!;
    const snapshot = structuredClone(message.victoryReport);
    expect(snapshot).toBeDefined();
    state.matches=[]; state.history.tournamentHistory=[]; state.tournaments=[];
    state.season='2031/32';
    expect(victoryForMessage(state,message)).toEqual(snapshot);
    expect(captureVictoryMessages(state).inbox.find(m=>m.id===message.id)?.victoryReport).toEqual(snapshot);
  });
  it('does not turn qualifying or other messages into champion announcements', () => {
    const state=qualificationFixture();
    expect(captureVictoryMessages(state).inbox.some(m=>m.victoryReport)).toBe(false);
    const {state:won}=victoryFixture();
    expect(won.inbox.filter(m=>m.victoryReport)).toHaveLength(1);
  });
});
