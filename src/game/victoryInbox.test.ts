import { describe, expect, it } from 'vitest';
import { victoryFixture } from '../../test-support/victoryFixture';
import { qualificationFixture } from '../../test-support/qualificationFixture';
import { captureVictoryMessages, victoryForMessage, victoryMessageTitle, victoryMessagePreview } from './victoryInbox';

describe('championship inbox reports', () => {
  it('captures a final at event completion and upgrades an existing generic message', () => {
    const {state,event} = victoryFixture();
    const message = state.inbox.find(m=>m.subject===`Post-event report: ${event.name}`)!;
    expect(message.victoryReport?.score).toBe('10–9');
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
