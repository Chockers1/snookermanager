import { describe, expect, it } from 'vitest';
import { createNewCareerState, createStarterState, finishSeasonState, startNextSeasonState } from '../hooks/useGameState';
import { attributeComparison, initialAttributeHistory, monthsBefore, recordAttributeHistory, recoverAttributeHistory } from './attributeHistory';
import { decodeCareerSave, encodeCareerSave } from './saveStorage';

const copy = <T,>(value: T): T => structuredClone(value);
describe('attribute history', () => {
  it('captures the real career start and preserves it after development and save roundtrips', () => {
    const state = createNewCareerState();
    const original = copy(state.attributes);
    state.currentDate = '2026-06-15'; state.attributes.technical['Long Potting'] += 4;
    const next = recordAttributeHistory(state);
    expect(next.attributeHistory!.careerStart!.attributes).toEqual(original);
    expect(next.attributeHistory!.snapshots.at(-1)!.attributes.technical['Long Potting']).toBe(original.technical['Long Potting'] + 4);
    expect(recordAttributeHistory(next)).toBe(next);
    const reloaded = JSON.parse(decodeCareerSave(encodeCareerSave(next)));
    expect(attributeComparison(reloaded, 'start').baseline!.attributes).toEqual(original);
  });
  it('uses calendar months, clamps month ends and selects a recorded baseline without interpolation', () => {
    expect(monthsBefore('2028-05-31', 3)).toBe('2028-02-29');
    expect(monthsBefore('2027-05-31', 3)).toBe('2027-02-28');
    let state = createStarterState(); state.currentDate = '2024-05-11'; state.attributes.technical['Long Potting'] = 40;
    state.attributeHistory = initialAttributeHistory(state);
    for (const [date, value] of [['2025-05-11', 50], ['2025-11-11', 60], ['2026-02-11', 70], ['2026-05-11', 80]] as const) {
      state = recordAttributeHistory({ ...state, currentDate: date, attributes: { ...state.attributes, technical: { ...state.attributes.technical, 'Long Potting': value } } });
    }
    for (const [period, value] of [['start',40],['3',70],['6',60],['12',50],['24',40]] as const) expect(attributeComparison(state,period).baseline!.attributes.technical['Long Potting']).toBe(value);
    state.attributes.technical['Long Potting'] = 65;
    expect(state.attributes.technical['Long Potting'] - attributeComparison(state,'3').baseline!.attributes.technical['Long Potting']).toBe(-5);
    expect(attributeComparison(createNewCareerState(), '24').note).toContain('Career started within this period');
  });
  it('recovers the last complete training report and labels missing legacy history honestly', () => {
    const state = createStarterState(); state.attributeHistory = undefined;
    const attributes = copy(state.attributes); attributes.technical['Long Potting'] = 65;
    state.trainingCondition.reportSnapshot = { date: '2026-05-04', attributes, weeksTracked: 0, fatigue: 0, strain: 0, burnout: 0, lastReport: { startDate:'2026-04-20',endDate:'2026-05-04',changes:[{group:'technical',label:'Long Potting',current:65,delta:3}],trainingLoad:0,adaptation:100,fatigueChange:0,strainChange:0,burnoutChange:0 } };
    const next = recordAttributeHistory(state);
    expect(next.attributeHistory!.snapshots[0].attributes.technical['Long Potting']).toBe(62);
    expect(attributeComparison(next,'start').note).toContain('Exact career-start attributes were not saved');
    expect(attributeComparison(next,'24').note).toContain('Partial history');
    expect(attributeComparison(next,'season').baseline!.overall).toBeUndefined();
    expect(next.attributeHistory!.careerStart).toBeUndefined();
  });
  it('merges an older same-career save without changing progress, attributes, finances or contracts', () => {
    const older = createStarterState(); older.attributeHistory = undefined;
    const current = copy(older); current.season = '2027/28'; current.currentDate = '2027-07-01';
    current.attributes.technical['Long Potting'] += 10; current.trainingCondition.seasonStartAttributes = copy(current.attributes);
    current.player.cash += 1234;
    const next = recoverAttributeHistory(current,encodeCareerSave(older));
    expect({ ...next, attributeHistory: undefined }).toEqual(current);
    expect(attributeComparison(next,'start').baseline!.attributes.technical['Long Potting']).toBe(older.trainingCondition.seasonStartAttributes.technical['Long Potting']);
    expect(attributeComparison(next,'season').baseline!.attributes).toEqual(current.attributes);
    expect(recoverAttributeHistory(next,encodeCareerSave(older))).toEqual(next);
    expect(() => recoverAttributeHistory(current,JSON.stringify({ ...older,worldSeed:older.worldSeed+1 }))).toThrow('same career');
    expect(() => recoverAttributeHistory(older,JSON.stringify(current))).toThrow('earlier attribute');
    const broken=copy(older);broken.attributes.technical['Long Potting']=101;
    expect(() => recoverAttributeHistory(current,JSON.stringify(broken))).toThrow('valid earlier');
  });
  it('retains recent daily records and permanent baselines over fifty years without unlimited daily growth', () => {
    let state = createStarterState(); state.currentDate = '2026-05-11'; state.attributeHistory = initialAttributeHistory(state);
    const start = copy(state.attributeHistory.careerStart);
    const points = [];
    for (let year=2026;year<2076;year++) for(let month=1;month<=12;month++) for(const day of [1,8,15,22]) points.push({date:year+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0'),attributes:copy(state.attributes),overall:80});
    state.attributeHistory.snapshots = points;
    state = recordAttributeHistory({...state,currentDate:'2076-01-01'});
    expect(state.attributeHistory!.careerStart).toEqual(start);
    expect(state.attributeHistory!.snapshots.length).toBeLessThan(1300);
    expect(state.attributeHistory!.snapshots.some(p=>p.date==='2074-01-15')).toBe(true);
  });
  it('keeps career gains across actual season rollover while resetting only the season comparison', () => {
    const state=createStarterState(); const start=copy(state.attributeHistory!.careerStart!);
    state.attributes.technical['Long Potting']+=5;
    state.currentDate='2027-06-29'; state.tournaments=state.tournaments.map(t=>({...t,status:'Skipped'}));
    const closed=finishSeasonState(recordAttributeHistory(state));
    const next=startNextSeasonState(closed);
    expect(next.season).not.toBe(state.season);
    expect(next.attributeHistory!.careerStart).toEqual(start);
    expect(attributeComparison(next,'season').baseline!.attributes).toEqual(next.trainingCondition.seasonStartAttributes);
    expect(attributeComparison(next,'start').baseline!.attributes).toEqual(start.attributes);
  },30000);
});
