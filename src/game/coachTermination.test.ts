import { describe, expect, it } from 'vitest';
import { createStarterState, fireCoachState } from '../hooks/useGameState';
import { getCoachTerminationCost } from '../utils/coachMarket';

function fixture(cash = 5000, weeksRemaining = 24) {
  const s = createStarterState();
  s.coachContracts = [{ coachId: s.coaches[0].id, slot: 'Lead Coach', contractLabel: 'Season Contract', contractWeeks: 24, weeksRemaining, weeklyCost: 32, totalCost: 768, startedWeek: s.week }];
  s.player.cash = cash;
  s.finance.cash = cash;
  return s;
}
describe('early coach termination', () => {
  it('settles only unpaid weeks at the signed rate and records the expense once', () => {
    const s = fixture(5000, 10), id = s.coaches[0].id;
    const result = fireCoachState(s, id);
    expect(result.player.cash).toBe(4680);
    expect(result.coachContracts).toHaveLength(0);
    expect(result.finance.ledger.filter(e => e.id.startsWith('coach-termination-'))).toEqual([expect.objectContaining({ amount: 320, type: 'Expense', category: 'Staff' })]);
    expect(result.inbox[0].preview).toContain('£320');
    expect(fireCoachState(result, id)).toBe(result);
  });
  it('blocks an unaffordable payout without removing staff or charging money', () => {
    const s = fixture(767), result = fireCoachState(s, s.coaches[0].id);
    expect(result.player.cash).toBe(767);
    expect(result.coachContracts).toEqual(s.coachContracts);
    expect(result.finance.ledger).toEqual(s.finance.ledger);
    expect(result.lastAction).toContain('£768');
  });
  it('allows exact affordability and does not charge for fully paid weeks', () => {
    const s = fixture(768);
    expect(fireCoachState(s, s.coaches[0].id).player.cash).toBe(0);
    const paid = fixture(500, 0);
    expect(fireCoachState(paid, paid.coaches[0].id).player.cash).toBe(500);
  });
  it('uses the current agreed rate after renewal, with currency precision', () => {
    expect(getCoachTerminationCost({ weeksRemaining: 28, weeklyCost: 38.5 })).toBe(1078);
    expect(getCoachTerminationCost({ weeksRemaining: 3, weeklyCost: 32.33 })).toBe(96.99);
  });
});
