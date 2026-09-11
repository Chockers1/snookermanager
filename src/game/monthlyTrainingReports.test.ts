import { describe, expect, it } from 'vitest';
import { applyTrainingPlanState, createStarterState } from '../hooks/useGameState';
const reports = (s: ReturnType<typeof createStarterState>) => s.inbox.filter(m => m.subject.startsWith('Monthly training report:'));
function train(s: ReturnType<typeof createStarterState>, date: string) {
 return applyTrainingPlanState({ ...s, currentDate: date, week: s.week + 1, trainingAppliedWeek: null });
}
describe('monthly training reports', () => {
 it('accumulates a calendar month, publishes once, and keeps exact period totals through reload', () => {
  let state = createStarterState();
  const before = structuredClone(state.attributes);
  for (const date of ['2026-05-11', '2026-05-18', '2026-05-25']) {
   state = train(state, date); expect(reports(state)).toHaveLength(0);
  }
  state = train(JSON.parse(JSON.stringify(state)), '2026-06-01');
  expect(reports(state)).toHaveLength(1);
  const report = state.trainingCondition.reportSnapshot!.lastReport!;
  expect(report).toMatchObject({ startDate: '2026-05-11', endDate: '2026-06-01', cadence: 'monthly' });
  for (const change of report.changes) expect(change.delta).toBeCloseTo(state.attributes[change.group][change.label] - before[change.group][change.label], 8);
  expect(reports(state)[0].preview).toContain('2026-05-11 to 2026-06-01');
  expect(JSON.stringify(reports(state))).not.toContain('two weeks');
  expect(reports(applyTrainingPlanState(state))).toHaveLength(1);
  for (const date of ['2026-06-08', '2026-06-15', '2026-06-22', '2026-06-29']) state = train(state, date);
  expect(reports(state)).toHaveLength(1);
  state = train(state, '2026-07-06');
  expect(reports(state)).toHaveLength(2);
  expect(state.trainingCondition.reportSnapshot!.lastReport).toMatchObject({ startDate: '2026-06-01', endDate: '2026-07-06' });
 }, 20000);
 it('carries pending fortnightly progress into the next monthly report without rewriting old mail', () => {
  let state = train(createStarterState(), '2026-05-25');
  const old = { id: 'old-fortnight', sender: 'Head Coach', subject: 'Fortnightly training report: Season 1 · Week 1 · 0 improved', preview: 'Earlier two-week results.', priority: 'Medium' as const, date: '2026-05-18', read: true };
  state.inbox = [old, ...state.inbox];
  const baseline = structuredClone(state.trainingCondition.reportSnapshot!);
  state = train(JSON.parse(JSON.stringify(state)), '2026-06-01');
  expect(reports(state)).toHaveLength(1);
  expect(state.inbox.find(m => m.id === old.id)).toMatchObject(old);
  expect(state.trainingCondition.reportSnapshot!.lastReport!.startDate).toBe(baseline.date);
 }, 20000);
 it.each([['2026-12-28','2027-01-04'], ['2028-02-21','2028-02-28','2028-03-06']])('uses calendar boundaries for year rollover and February (%s)', (...dates) => {
  let state = createStarterState();
  for (const date of dates.slice(0,-1)) { state = train(state, date); expect(reports(state)).toHaveLength(0); }
  state = train(state, dates.at(-1)!);
  expect(reports(state)).toHaveLength(1);
 }, 20000);
});
