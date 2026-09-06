import type { GameState } from '../hooks/useGameState';
import type { PlayerAttributes } from '../types/game';
import { calculateOverallRating } from '../utils/calculations';
import { decodeCareerSave } from './saveStorage';

export type AttributeBaseline = { attributes: PlayerAttributes; date?: string; overall?: number };
export type AttributeSnapshot = AttributeBaseline & { date: string };
export type AttributeHistory = {
  careerStart?: AttributeSnapshot;
  seasons: Record<string, AttributeBaseline>;
  snapshots: AttributeSnapshot[];
};
export const attributePeriods = [
  { value: 'start', label: 'Since start' }, { value: 'season', label: 'This season' },
  { value: '3', label: '3 months' }, { value: '6', label: '6 months' },
  { value: '12', label: '12 months' }, { value: '24', label: '24 months' },
] as const;
export type AttributePeriod = typeof attributePeriods[number]['value'];
const groups = ['technical', 'mental', 'physical'] as const;
const clone = (attributes: PlayerAttributes): PlayerAttributes => structuredClone(attributes);
function snapshot(state: GameState): AttributeSnapshot {
  return { date: state.currentDate, attributes: clone(state.attributes), overall: calculateOverallRating({ attributes: state.attributes, personalityTraits: state.player.personalityTraits, playingStyle: state.player.playingStyle }) };
}
export function monthsBefore(date: string, months: number) {
  const d = new Date(date + 'T12:00:00Z');
  const day = d.getUTCDate();
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}
export function initialAttributeHistory(state: GameState): AttributeHistory {
  const start = snapshot(state);
  return { careerStart: start, seasons: { [state.season]: start }, snapshots: [start] };
}
function legacyHistory(state: GameState): AttributeHistory {
  const report = state.trainingCondition.reportSnapshot;
  const snapshots: AttributeSnapshot[] = [];
  if (report?.date && report.date <= state.currentDate) {
    snapshots.push({ date: report.date, attributes: clone(report.attributes) });
    const last = report.lastReport;
    // A fortnightly report lists every changed attribute, including declines.
    if (last && last.endDate === report.date && last.startDate < report.date) {
      const before = clone(report.attributes);
      for (const change of last.changes) before[change.group][change.label] -= change.delta;
      snapshots.unshift({ date: last.startDate, attributes: before });
    }
  }
  return { seasons: { [state.season]: { attributes: clone(state.trainingCondition.seasonStartAttributes ?? state.attributes) } }, snapshots };
}
function compact(points: AttributeSnapshot[], today: string) {
  const cutoff = monthsBefore(today, 26);
  // Keep exact daily records for every selectable rolling window, and the first
  // and last record of older months. Career and season baselines are separate.
  return points.filter((point, index) => point.date >= cutoff || index === 0 || index === points.length - 1 || points[index - 1]?.date.slice(0, 7) !== point.date.slice(0, 7) || points[index + 1]?.date.slice(0, 7) !== point.date.slice(0, 7));
}
export function recordAttributeHistory(state: GameState): GameState {
  const history = state.attributeHistory ?? legacyHistory(state);
  const current = snapshot(state);
  const last = history.snapshots.at(-1);
  if (last?.date === current.date && last.overall === current.overall && JSON.stringify(last.attributes) === JSON.stringify(current.attributes) && history.seasons[state.season]) return state.attributeHistory ? state : { ...state, attributeHistory: history };
  const points = [...history.snapshots.filter(p => p.date < current.date), current];
  return { ...state, attributeHistory: { ...history, seasons: { ...history.seasons, [state.season]: history.seasons[state.season] ?? { attributes: clone(state.trainingCondition.seasonStartAttributes), date: current.date, overall: current.overall } }, snapshots: compact(points, state.currentDate) } };
}
export function attributeComparison(state: GameState, period: AttributePeriod) {
  const history = recordAttributeHistory(state).attributeHistory!;
  let baseline: AttributeBaseline | undefined;
  let note: string;
  if (period === 'season') {
    baseline = history.seasons[state.season];
    note = state.season + ' season baseline' + (baseline?.date ? ' · ' + baseline.date : ' · exact baseline date was not saved');
  } else if (period === 'start') {
    baseline = history.careerStart;
    if (baseline) note = 'Career start · ' + baseline.date;
    else {
      const season = Object.keys(history.seasons).sort()[0];
      baseline = history.seasons[season];
      note = 'Partial history: earliest saved season baseline (' + season + '). Exact career-start attributes were not saved.';
    }
  } else {
    const target = monthsBefore(state.currentDate, Number(period));
    if (history.careerStart && target <= history.careerStart.date) {
      baseline = history.careerStart;
      note = 'Career started within this period · ' + baseline.date;
    } else {
      baseline = history.snapshots.filter(p => p.date <= target).at(-1) ?? history.snapshots[0];
      note = baseline?.date && baseline.date <= target
        ? 'Requested from ' + target + ' · recorded baseline ' + baseline.date
        : 'Partial history: requested from ' + target + ', earliest dated record ' + baseline?.date + '.';
    }
  }
  return { baseline, note: note + ' · Current ' + state.currentDate };
}
function validAttributes(value: unknown, reference: PlayerAttributes): value is PlayerAttributes {
  if (!value || typeof value !== 'object') return false;
  return groups.every(group => {
    const values = (value as PlayerAttributes)[group];
    return values && Object.keys(reference[group]).every(key => typeof values[key] === 'number' && Number.isFinite(values[key]) && values[key] >= 0 && values[key] <= 100);
  });
}
/** Merge only historical measurements; never restore gameplay from an old save. */
export function recoverAttributeHistory(state: GameState, serialized: string): GameState {
  const source = JSON.parse(decodeCareerSave(serialized)) as GameState;
  if (!source.worldSeed || source.worldSeed !== state.worldSeed || source.player?.fullName !== state.player.fullName) throw new Error('Choose an older save from this same career.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(source.currentDate) || source.currentDate > state.currentDate || !validAttributes(source.attributes, state.attributes) || !source.trainingCondition || !/^\d{4}\/\d{2}$/.test(source.season)) throw new Error('This file does not contain valid earlier attribute records.');
  const older = recordAttributeHistory(source).attributeHistory!;
  const current = recordAttributeHistory(state).attributeHistory!;
  const baselines = [...Object.values(older.seasons), ...older.snapshots, ...(older.careerStart ? [older.careerStart] : [])];
  if (baselines.some(p => !validAttributes(p.attributes, state.attributes) || (p.date && (!/^\d{4}-\d{2}-\d{2}$/.test(p.date) || p.date > source.currentDate)))) throw new Error('The file contains invalid attribute history.');
  // Existing records win when dates or seasons overlap.
  const points = new Map([...older.snapshots, ...current.snapshots].map(p => [p.date, p]));
  return { ...state, attributeHistory: { careerStart: current.careerStart ?? older.careerStart, seasons: { ...older.seasons, ...current.seasons }, snapshots: compact([...points.values()].sort((a, b) => a.date.localeCompare(b.date)), state.currentDate) } };
}
