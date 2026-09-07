import { describe, expect, it } from 'vitest';
import { applyTrainingPlanState, createStarterState, previewTrainingDevelopment } from '../hooks/useGameState';
import { buildFocusedTrainingPlan, buildTrainingCell, trainingSkillWork, TRAINING_SESSION_OPTIONS } from '../utils/trainingPlan';

const fresh = () => {
  const state = createStarterState();
  state.trainingAppliedWeek = -1;
  state.health.activeIssue = null;
  state.trainingCondition.injuryWeeks = 0;
  state.tournaments = state.tournaments.map(t => ({ ...t, status: 'Skipped' }));
  state.coachContracts = [];
  state.player.fatigue = 10;
  return state;
};

describe('session-specific development', () => {
  it('covers all fifteen attributes across available drills, without a required project', () => {
    const state = fresh();
    const week = buildFocusedTrainingPlan('balanced', state.currentDate, 10);
    const covered = new Set<string>();
    for (const option of TRAINING_SESSION_OPTIONS) {
      const plan = week.map(d => ({ ...d, morning: buildTrainingCell(option.id), afternoon: buildTrainingCell('rest'), evening: buildTrainingCell('rest') }));
      for (const skill of Object.keys(trainingSkillWork(plan))) covered.add(skill);
    }
    expect([...covered].sort()).toEqual(Object.keys({...state.attributes.technical, ...state.attributes.mental, ...state.attributes.physical}).sort());
  });
  it('safety practice builds safety more than potting, and preview matches applied gains', () => {
    const state = fresh();
    const week = buildFocusedTrainingPlan('safety', state.currentDate, 10);
    const preview = previewTrainingDevelopment(state, week);
    expect(preview.find(g => g.label === 'Safety Play')!.value).toBeGreaterThan(preview.find(g => g.label === 'Long Potting')?.value ?? 0);
    const after = applyTrainingPlanState(state, week);
    const beforeSkills = {...state.attributes.technical, ...state.attributes.mental, ...state.attributes.physical};
    const afterSkills = {...after.attributes.technical, ...after.attributes.mental, ...after.attributes.physical};
    for (const gain of preview) expect(afterSkills[gain.label] - beforeSkills[gain.label]).toBeCloseTo(gain.value, 8);
    expect(previewTrainingDevelopment(after, week)).toEqual([]);
    expect(applyTrainingPlanState(after, week).attributes).toEqual(after.attributes);
  });
  it('more practice matters, while overload, injury, mastery and protected days restrict gains', () => {
    const state = fresh();
    const plan = buildFocusedTrainingPlan('recovery', state.currentDate, 10);
    plan[0].morning = buildTrainingCell('safety-exchanges');
    const gain = (s = state) => previewTrainingDevelopment(s, plan).find(g => g.label === 'Safety Play')?.value ?? 0;
    const one = gain();
    plan[1].morning = buildTrainingCell('safety-exchanges');
    expect(gain()).toBeCloseTo(one * 2);
    expect(gain({...state, player: {...state.player, fatigue: 90}})).toBeLessThan(gain());
    expect(gain({...state, trainingCondition: {...state.trainingCondition, injuryWeeks: 2}})).toBe(0);
    expect(gain({...state, attributes: {...state.attributes, technical: {...state.attributes.technical, 'Safety Play': 99}}})).toBeLessThan(one);
    expect(trainingSkillWork(plan.map(d => ({...d, competitionName: 'Real match'})))).toEqual({});
    expect(trainingSkillWork(plan.map(d => ({...d, careerCommitmentId: 'work'})))).toEqual({});
    expect(trainingSkillWork(buildFocusedTrainingPlan('recovery', state.currentDate, 10))).toEqual({});
  });
});
