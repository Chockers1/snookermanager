import type { GameState } from '../hooks/useGameState';

/** Recorded balances only: never invent a rising curve for a new career. */
export function dashboardFinance(state: GameState) {
  const month = state.currentDate.slice(0, 7);
  const recorded = new Map<string, number>();
  for (const snapshot of state.history.snapshots) {
    if (snapshot.date.startsWith(month) && snapshot.date <= state.currentDate && Number.isFinite(snapshot.cash)) recorded.set(snapshot.date, snapshot.cash);
  }
  recorded.set(state.currentDate, state.player.cash);
  const trend = [...recorded].sort(([a], [b]) => a.localeCompare(b)).map(([date, balance]) => ({
    date, label: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`)), balance,
  }));
  const entries = state.finance.ledger.filter(row => row.date.startsWith(month) && row.date <= state.currentDate && Number.isFinite(row.amount));
  const income = entries.filter(row => row.type === 'Income').reduce((sum, row) => sum + Math.abs(row.amount), 0);
  const expenses = entries.filter(row => row.type === 'Expense').reduce((sum, row) => sum + Math.abs(row.amount), 0);
  return { trend, income, expenses, net: income - expenses, balance: state.player.cash };
}
