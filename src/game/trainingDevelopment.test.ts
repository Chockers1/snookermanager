import { COACH_TRAINING_SKILLS, coachTrainingBonus } from './coachTraining';
import type { Coach, CoachContract } from '../types/game';
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


describe('coach specialisms match advertised training benefits', () => {
  for (const type of Object.keys(COACH_TRAINING_SKILLS) as Coach['type'][]) it(`${type} helps the stated skills in either slot, with matching settlement`, () => {
    const state = fresh();
    const coach = { ...state.coaches[0], type, level: 'Elite' as const, compatibility: 88 };
    state.coaches = [coach];
    const week = buildFocusedTrainingPlan('balanced', state.currentDate, 10).map((day, i) => ({ ...day,
      morning: buildTrainingCell(TRAINING_SESSION_OPTIONS[(i * 2) % TRAINING_SESSION_OPTIONS.length].id),
      afternoon: buildTrainingCell(TRAINING_SESSION_OPTIONS[(i * 2 + 1) % TRAINING_SESSION_OPTIONS.length].id), evening: buildTrainingCell('rest') }));
    const baseline = previewTrainingDevelopment(state, week);
    const contract: CoachContract = { coachId: coach.id, slot: 'Lead Coach', startedWeek: state.week, contractWeeks: 8, weeksRemaining: 8, contractLabel: '8 Week Trial', weeklyCost: 100, totalCost: 800 };
    const lead = previewTrainingDevelopment({ ...state, coachContracts: [contract] }, week);
    const specialist = { ...state, coachContracts: [{ ...contract, slot: 'Specialist Coach' as const }] };
    expect(previewTrainingDevelopment(specialist, week)).toEqual(lead);
    const applied = applyTrainingPlanState(specialist, week);
    const beforeSkills = { ...state.attributes.technical, ...state.attributes.mental, ...state.attributes.physical };
    const afterSkills = { ...applied.attributes.technical, ...applied.attributes.mental, ...applied.attributes.physical };
    for (const item of baseline) {
      const actual = lead.find(g => g.label === item.label)!.value;
      expect(actual).toBeCloseTo(item.value * (1 + coachTrainingBonus(coach, item.label)), 8);
      expect(afterSkills[item.label] - beforeSkills[item.label]).toBeCloseTo(actual, 8);
    }
    expect(baseline.some(g => COACH_TRAINING_SKILLS[type].includes(g.label))).toBe(true);
    expect(previewTrainingDevelopment(specialist, buildFocusedTrainingPlan('recovery', state.currentDate, 10))).toEqual([]);
  });
  it('adds overlapping coaches up to the 30% ceiling', () => {
    const state = fresh();
    const coach = { ...state.coaches[0], type: 'Tactical' as const, level: 'Elite' as const, compatibility: 100 };
    state.coaches = [coach, { ...coach, id: 'second-specialist' }];
    const week = buildFocusedTrainingPlan('safety', state.currentDate, 10);
    const baseline = previewTrainingDevelopment(state, week).find(g => g.label === 'Safety Play')!.value;
    state.coachContracts = state.coaches.map((c, i) => ({ coachId: c.id, slot: i ? 'Specialist Coach' : 'Lead Coach', startedWeek: state.week, contractWeeks: 8, weeksRemaining: 8, contractLabel: '8 Week Trial', weeklyCost: 100, totalCost: 800 }));
    expect(previewTrainingDevelopment(state, week).find(g => g.label === 'Safety Play')!.value).toBeCloseTo(baseline * 1.3, 8);
  });
});
