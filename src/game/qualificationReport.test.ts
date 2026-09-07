import { describe, expect, it } from 'vitest';
import { qualificationFixture } from '../../test-support/qualificationFixture';
import { qualificationReportForMessage } from './qualificationReport';
import { getTournamentEntryAccess, repairGameState } from '../hooks/useGameState';
import { recordedMajorQualifiers } from './rollingRankings';

describe('qualifying completion reports', () => {
  it('confirms the one-match qualification, grants main-draw access and retains the report across rollover', () => {
    const state = qualificationFixture();
    const main = state.tournaments.find(t => t.name === 'International Championship')!;
    const message = state.inbox.find(m => m.subject === 'Post-event report: International Championship Qualifying')!;
    expect(message.qualificationReport?.mainEventName).toBe(main.name);
    expect(message.qualificationReport?.explanation).toContain('One best-of-11 qualifying match');
    expect(message.summary?.[0].value).toBe('Qualified for International Championship');
    expect(message.preview).toContain('No further qualifying match is needed');
    expect(state.lastAction).not.toContain('took the title');
    expect(recordedMajorQualifiers(state, main)).toContain(state.player.fullName);
    expect(getTournamentEntryAccess(state, main).allowed).toBe(true);
    const restored = repairGameState(JSON.parse(JSON.stringify(state)));
    expect(restored.inbox.find(m => m.id === message.id)?.qualificationReport).toEqual(message.qualificationReport);
    expect(qualificationReportForMessage({ ...restored, tournaments: [], history: { ...restored.history, tournamentHistory: [] } }, message)).toEqual(message.qualificationReport);
    const legacy = { ...message, qualificationReport: undefined };
    expect(qualificationReportForMessage(state, legacy, { id: message.eventFinance!.tournamentId, name: message.eventFinance!.name, startDate: message.eventFinance!.startDate })).toEqual(message.qualificationReport);
  });
  it('does not award qualification for a defeat', () => {
    const state = qualificationFixture(false);
    const message = state.inbox.find(m => m.subject === 'Post-event report: International Championship Qualifying')!;
    const main = state.tournaments.find(t => t.name === 'International Championship')!;
    expect(message.qualificationReport).toBeUndefined();
    expect(message.summary?.[0].value).toMatch(/^Lost/);
    expect(getTournamentEntryAccess(state, main).allowed).toBe(false);
  });
});
