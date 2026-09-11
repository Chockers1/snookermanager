import { describe, expect, it } from 'vitest';
import { formatInboxTrainingReport } from './inboxFormatting';
import { formatAttributeChange, formatAttribute } from './formatters';
import { createStarterState, advanceWeekState } from '../hooks/useGameState';

const message = {
 subject: 'Fortnightly training report: Season 1 · Week 10 · 15 improved',
 preview: 'Focus +0.31893333333333374 (now 66.0569333333333), Safety Play -0.1906666666666723 (now 67.026). Review your development.',
 summary: [
  { label: 'Focus', value: '+0.31893333333333374', detail: 'Now 66.0569333333333 · mental' },
  { label: 'Safety Play', value: '-0.1906666666666723', detail: 'Now 67.026 · technical' },
  { label: 'Youth Ranking', value: '#11', detail: 'No movement' },
 ],
};
describe('training report precision', () => {
 it('formats existing reports without changing stored values, ranks or dates', () => {
  const before = JSON.stringify(message), shown = formatInboxTrainingReport(message);
  expect(shown.preview).toBe('Focus +0.32 (now 66.06), Safety Play -0.19 (now 67.03). Review your development.');
  expect(shown.summary[0]).toMatchObject({ value: '+0.32', detail: 'Now 66.06 · mental' });
  expect(shown.summary[1]).toMatchObject({ value: '-0.19', detail: 'Now 67.03 · technical' });
  expect(shown.summary[2]).toBe(message.summary[2]); expect(shown.subject).toBe(message.subject);
  expect(JSON.stringify(message)).toBe(before); expect(formatInboxTrainingReport(shown)).toEqual(shown);
 });
 it('leaves unrelated messages alone', () => {
  const other = { ...message, subject: 'Build 0.1.1 details' };
  expect(formatInboxTrainingReport(other)).toBe(other);
 });
 it.each([[0.31893333333333374, '+0.32'], [-0.1906666666666723, '-0.19'], [1, '+1.00'], [0, '0.00'], [-0.00000001, '0.00'], [NaN, '—']])('formats signed %s as %s', (value, expected) => {
  expect(formatAttributeChange(value as number)).toBe(expected);
 });
 it('generates rounded report strings while retaining exact development records', () => {
  const start = createStarterState(); start.attributes.mental.Focus = 65.738;
  let state = advanceWeekState(start);
  for (let week = 0; week < 6 && !state.inbox.some(m => m.subject.startsWith('Monthly training report:')); week++) state = advanceWeekState(state);
  const report = state.inbox.find(m => m.subject.startsWith('Monthly training report:'))!;
  expect(report).toBeDefined();
  expect(JSON.stringify({ preview: report.preview, summary: report.summary })).not.toMatch(/\d+\.\d{3,}/);
  const changes = state.trainingCondition.reportSnapshot!.lastReport!.changes;
  expect(changes.some(c => c.delta !== Number(c.delta.toFixed(2)))).toBe(true);
  for (const change of changes.filter(c => report.summary!.some(item => item.label === c.label))) {
   const item = report.summary!.find(item => item.label === change.label)!;
   expect(item.value).toBe(formatAttributeChange(change.delta));
   expect(item.detail).toBe(`Now ${formatAttribute(change.current)} · ${change.group}`);
  }
 });
});
