import { describe, expect, it } from 'vitest';
import { applyTrainingPlanState, createStarterState, previewTrainingDevelopment, type GameState } from '../../hooks/useGameState';
import { buildTrainingCell } from '../../utils/trainingPlan';
import { depthOf, plusDays } from '../careerDepth/shared';
import { realismAction, realismOf, reconcileRealism } from './index';
import { LOCATIONS } from './travel';
import { effectiveBaseTrainingMultiplier, locationTrainingMultiplier, TRAINING_LOCATION_PROFILES } from './base';

function fixture(home = 'Wuhan'): GameState {
  const seed = createStarterState();
  return { ...seed, player: { ...seed.player, fatigue: 15, cash: 50000 }, tournaments: [], liveMatch: null,
    trainingAppliedWeek: -1, health: { ...seed.health, activeIssue: null },
    careerDepth: { ...depthOf(seed), stories: [], commitments: [], project: null, nextSettlementDate: plusDays(seed.currentDate, 7) },
    realism: { ...realismOf(seed), base: 'club', home, location: home, journeys: {} },
    trainingPlan: seed.trainingPlan.map(d => ({ ...d, competitionName: undefined,
      morning: buildTrainingCell('long-pot-routine'), afternoon: buildTrainingCell('safety-exchanges'), evening: buildTrainingCell('rest') })) };
}

describe('training location programmes', () => {
  it('covers every destination with distinct, valid specialisms and an equal trade-off', () => {
    const seed = fixture(), labels = Object.values(seed.attributes).flatMap(group => Object.keys(group));
    expect(Object.keys(TRAINING_LOCATION_PROFILES).sort()).toEqual(Object.keys(LOCATIONS).sort());
    const signatures = new Set<string>();
    for (const profile of Object.values(TRAINING_LOCATION_PROFILES)) {
      expect(new Set([...profile.strengths, profile.tradeoff]).size).toBe(3);
      for (const label of [...profile.strengths, profile.tradeoff]) expect(labels).toContain(label);
      signatures.add([...profile.strengths].sort().join('|') + profile.tradeoff);
    }
    expect(signatures.size).toBe(Object.keys(LOCATIONS).length);
  });
  it('changes earned training gains, and the preview agrees with settlement', () => {
    const state = fixture();
    const neutral = { ...state, realism: { ...state.realism!, home: 'Unknown legacy base', location: 'Unknown legacy base' } };
    const gains = previewTrainingDevelopment(state, state.trainingPlan);
    const baseline = previewTrainingDevelopment(neutral, neutral.trainingPlan);
    for (const [label, factor] of [['Long Potting', 1.06], ['Safety Play', 0.96]] as const) {
      const gain = gains.find(g => g.label === label)!.value;
      expect(gain).toBeGreaterThan(0);
      expect(gain).toBeCloseTo(baseline.find(g => g.label === label)!.value * factor, 8);
      const applied = applyTrainingPlanState(state);
      expect(applied.attributes.technical[label] - state.attributes.technical[label]).toBeCloseTo(gain, 8);
      expect(applyTrainingPlanState(applied).attributes).toEqual(applied.attributes);
    }
  });
  it('uses the edited timetable for both preview and settlement access limits', () => {
    const state = fixture();
    state.trainingPlan = state.trainingPlan.map(d => ({ ...d, morning: buildTrainingCell('rest'), afternoon: buildTrainingCell('rest') }));
    const edited = fixture().trainingPlan;
    const forecast = previewTrainingDevelopment(state, edited);
    expect(forecast).toEqual(previewTrainingDevelopment({ ...state, trainingPlan: edited }, edited));
    const applied = applyTrainingPlanState(state, edited);
    expect(applied.attributes.technical['Long Potting'] - state.attributes.technical['Long Potting']).toBeCloseTo(forecast.find(g => g.label === 'Long Potting')!.value, 8);
    expect(previewTrainingDevelopment(state, state.trainingPlan)).toEqual([]);
  });
  it('shares the facility cap and disables all specialisms and trade-offs away from home', () => {
    const state = fixture(); state.realism!.base = 'academy';
    expect(effectiveBaseTrainingMultiplier(state, 'Long Potting', 1.5)).toBe(1.15);
    expect(effectiveBaseTrainingMultiplier(state, 'Safety Play', 1.5)).toBeCloseTo(1.15 * 0.96);
    const away = { ...state, realism: { ...state.realism!, location: 'Britain' } };
    for (const label of ['Long Potting', 'Safety Play', 'Stamina']) expect(locationTrainingMultiplier(away, label)).toBe(1);
    expect(locationTrainingMultiplier(state, 'Stamina')).toBe(1);
  });
  it('activates after relocation arrival and survives reload without replaying costs or gains', () => {
    const state = fixture('Britain');
    const booked = realismAction(state, { type: 'base', base: 'club', location: 'Wuhan' });
    expect(booked.realism!.home).toBe('Wuhan');
    expect(locationTrainingMultiplier(booked, 'Long Potting')).toBe(1);
    const arrived = reconcileRealism({ ...booked, currentDate: plusDays(state.currentDate, 2) });
    expect(locationTrainingMultiplier(arrived, 'Long Potting')).toBe(1.06);
    const loaded = reconcileRealism(JSON.parse(JSON.stringify(arrived)));
    expect(loaded.player.cash).toBe(arrived.player.cash);
    expect(loaded.attributes).toEqual(state.attributes);
    expect(previewTrainingDevelopment(loaded, loaded.trainingPlan)).toEqual(previewTrainingDevelopment(arrived, arrived.trainingPlan));
  });
});
