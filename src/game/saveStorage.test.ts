import { describe, expect, it } from 'vitest';
import { createStarterState, processRankingCalendar } from '../hooks/useGameState';
import { decodeCareerSave, encodeCareerSave } from './saveStorage';

describe('career save compression', () => {
  it('reads old JSON and losslessly round-trips new saves', () => {
    const state = createStarterState();
    const json = JSON.stringify(state);
    expect(decodeCareerSave(json)).toBe(json);
    expect(decodeCareerSave(encodeCareerSave(state))).toBe(json);
    expect(encodeCareerSave(state).length).toBeLessThan(json.length / 3);
  });
  it('keeps an active copy and two named saves within the browser budget after a CPU season', () => {
    const initial = createStarterState();
    const end = initial.tournaments.map(t => t.endDate ?? t.startDate).sort().at(-1)!;
    const state = processRankingCalendar({ ...initial, currentDate: end });
    const encoded = encodeCareerSave(state);
    expect(encoded.length * 2 * 3).toBeLessThan(5 * 1024 * 1024);
    expect(JSON.parse(decodeCareerSave(encoded))).toEqual(state);
    expect(Object.values(state.rollingRankings!.events).length).toBeGreaterThan(30);
  }, 60000);
});
