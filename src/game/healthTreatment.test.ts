import { describe, expect, it } from 'vitest';
import { createStarterState, scheduleTreatmentState } from '../hooks/useGameState';
import { buildHealthCentreData } from '../utils/liveRouteData';
import { treatmentEffects } from './healthSystem';
function healthy() {
  const state = createStarterState();
  state.player.fatigue = 0;
  state.trainingCondition.strain = 0;
  state.trainingCondition.burnout = 0;
  state.trainingCondition.injuryWeeks = 0;
  state.health.activeIssue = null;
  return state;
}
describe('visible and useful treatment', () => {
  it('shows healthy players as healthy and prevents unnecessary charges or free attribute gains', () => {
    const state = healthy();
    const data = buildHealthCentreData(state);
    expect(data.currentIssue).toMatchObject({ title: 'No treatment needed', severity: 'None', painLevel: '0 / 10', recoveryProgress: 100, riskOfPlaying: 0 });
    for (const treatment of treatmentEffects) {
      const result = scheduleTreatmentState(state, treatment.id);
      expect(result.player).toEqual(state.player);
      expect(result.attributes).toEqual(state.attributes);
      expect(result.finance).toEqual(state.finance);
      expect(result.health).toEqual(state.health);
      expect(result.lastAction).toContain('No treatment needed');
    }
  });
  it('records immediate recovery and actual cost even without an active injury', () => {
    const state = healthy();
    state.player.cash = 1000;
    state.player.fatigue = 36;
    state.trainingCondition.strain = 22;
    state.trainingCondition.burnout = 12;
    const result = scheduleTreatmentState(state, 'treat-2');
    expect(result.currentDate).toBe(state.currentDate);
    expect(result.player.cash).toBe(820);
    expect(result.player.fatigue).toBe(27);
    expect(result.trainingCondition.strain).toBe(0);
    expect(result.trainingCondition.burnout).toBe(8);
    expect(result.lastAction).toContain('Fatigue 36% → 27%');
    expect(result.health.history[0]).toMatchObject({ treatment: 'Physio Treatment', issue: 'Recovery support' });
    expect(result.finance.ledger.find(t => t.category === 'Health')).toMatchObject({ amount: 180, type: 'Expense' });
    expect(result.inbox[0].preview).toContain('calendar date is unchanged');
  });
});
