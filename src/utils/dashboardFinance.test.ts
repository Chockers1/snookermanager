import { describe, expect, it } from 'vitest';
import { createStarterState } from '../hooks/useGameState';
import { dashboardFinance } from './dashboardFinance';

describe('dashboard financial summary', () => {
  it('uses recorded balances with the live balance last, and current-month ledger totals', () => {
    const state = createStarterState();
    state.currentDate = '2026-05-11';
    state.player.cash = 1250;
    const snapshot = state.history.snapshots[0];
    state.history.snapshots = [
      { ...snapshot, date: '2026-05-02', cash: 1000 },
      { ...snapshot, date: '2026-05-02', cash: 1100 },
      { ...snapshot, date: '2026-04-30', cash: 999 },
      { ...snapshot, date: '2026-05-11', cash: 999 },
    ];
    state.finance.ledger = [
      { id: 'a', date: '2026-05-02', amount: 500, type: 'Income', description: 'Prize', category: 'Prize' },
      { id: 'b', date: '2026-05-03', amount: -250, type: 'Expense', description: 'Travel', category: 'Travel' },
      { id: 'c', date: '2026-04-30', amount: 999, type: 'Income', description: 'Old', category: 'Prize' },
      { id: 'd', date: '2026-05-30', amount: 999, type: 'Income', description: 'Future', category: 'Prize' },
    ];
    const result = dashboardFinance(state);
    expect(result.trend.map(p => p.balance)).toEqual([1100, 1250]);
    expect(result).toMatchObject({ income: 500, expenses: 250, net: 250, balance: 1250 });
  });
  it('does not fabricate a trend or income when no history exists', () => {
    const state = createStarterState();
    state.history.snapshots = [];
    state.finance.ledger = [];
    expect(dashboardFinance(state).trend).toHaveLength(1);
    expect(dashboardFinance(state).income).toBe(0);
  });
});
