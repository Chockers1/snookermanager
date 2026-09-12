import { describe, expect, it } from 'vitest';
import { advanceWeekState, buyCueState, createStarterState, repairGameState } from '../hooks/useGameState';
import { ensureManagementReportBaseline, settleMonthlyManagementReport } from './monthlyManagementReport';

const messages = (state: ReturnType<typeof createStarterState>) => state.inbox.filter(item => item.subject.startsWith('Monthly management report'));
function fixture(date: string) {
  const state = createStarterState();
  return ensureManagementReportBaseline({ ...state, currentDate: date, managementReportBaseline: undefined, inbox: [] });
}

describe('monthly management reports', () => {
  it('accumulates all cash and condition changes, publishes once at a month boundary and resets the baseline', () => {
    let state = fixture('2026-05-11');
    const baseline = state.managementReportBaseline!;
    for (const date of ['2026-05-18', '2026-05-25']) {
      state = settleMonthlyManagementReport({ ...state, currentDate: date, player: { ...state.player, cash: state.player.cash + 100, confidence: state.player.confidence - .35 } });
      expect(messages(state)).toHaveLength(0);
    }
    state = buyCueState(state, 'cue-13'); // Purchases during the period must count, not just scheduled weekly income.
    state = JSON.parse(JSON.stringify(state));
    state = settleMonthlyManagementReport({ ...state, currentDate: '2026-06-01', attributes: { ...state.attributes, technical: { ...state.attributes.technical, 'Long Potting': baseline.attributes.technical['Long Potting'] + .318933333333 } } });
    expect(messages(state)).toHaveLength(1);
    expect(state.player.inboxCount).toBe(state.inbox.filter(item => !item.read).length);
    const report = messages(state)[0];
    expect(report.subject).toBe('Monthly management report · May 2026');
    expect(report.preview).toContain('2026-05-11 to 2026-06-01');
    expect(report.summary?.find(row => row.label === 'Cash change')?.value).toBe('+£105.00');
    expect(report.summary?.find(row => row.label === 'Confidence')?.detail).toBe('-0.70 over this report period');
    expect(report.summary?.find(row => row.label === 'Training progress')?.detail).toContain('+0.32');
    expect(JSON.stringify(report)).not.toContain('this week');
    expect(JSON.stringify(report)).not.toMatch(/\d+\.\d{3,}/);
    expect(messages(settleMonthlyManagementReport(state))).toHaveLength(1);
    const next = settleMonthlyManagementReport({ ...state, currentDate: '2026-07-01', player: { ...state.player, cash: state.player.cash - 35 } });
    expect(messages(next)[0].summary?.[0].value).toBe('−£35.00');
  });

  it.each([['2026-12-28', '2027-01-04'], ['2028-02-28', '2028-03-06']])('handles calendar boundaries including %s without assuming four weeks', (start, end) => {
    const state = fixture(start);
    expect(messages(settleMonthlyManagementReport({ ...state, currentDate: end }))).toHaveLength(1);
  });

  it('migrates older saves neutrally and retains historical weekly mail', () => {
    const state = fixture('2028-09-13');
    state.managementReportBaseline = undefined;
    state.inbox = [{ id: 'old-weekly', sender: 'Career Manager', subject: 'Season 3 · Week 10 report', preview: 'Historical weekly figures.', priority: 'Medium', read: true, date: '2028-09-10' }];
    const restored = repairGameState(JSON.parse(JSON.stringify(state)));
    expect(messages(restored)).toHaveLength(0);
    expect(restored.managementReportBaseline?.date).toBe(state.currentDate);
    expect(restored.player.cash).toBe(state.player.cash);
    expect(restored.inbox.find(item => item.id === 'old-weekly')).toMatchObject(state.inbox[0]);
    const again = repairGameState(JSON.parse(JSON.stringify(restored)));
    expect(again.managementReportBaseline).toEqual(restored.managementReportBaseline);
    expect(messages(again)).toHaveLength(0);
  });

  it('weekly advancement keeps settling costs/training but no longer sends weekly management mail', () => {
    let state = fixture('2026-05-18');
    state = { ...state, tournaments: state.tournaments.map(t => ({ ...t, status: 'Skipped' })), careerDepth: { ...state.careerDepth!, stories: [], nextSettlementDate: '2026-05-25' } };
    state = advanceWeekState(state);
    expect(messages(state)).toHaveLength(0);
    const next = advanceWeekState(state);
    expect(next.currentDate).toBe('2026-06-01');
    expect(messages(next)).toHaveLength(1);
    expect(next.inbox.some(item => /^Season \d+ · Week \d+ report$/.test(item.subject))).toBe(false);
  }, 20000);
});
