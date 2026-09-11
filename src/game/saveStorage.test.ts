import LZString from 'lz-string';
import { describe, expect, it } from 'vitest';
import { createStarterState, processRankingCalendar } from '../hooks/useGameState';
import { decodeCareerSave, decodeCareerSaveAsync, encodeCareerSave } from './saveStorage';

describe('career save compression', () => {
  it('reads old JSON and losslessly round-trips new saves', () => {
    const state = createStarterState();
    const json = JSON.stringify(state);
    expect(decodeCareerSave(json)).toBe(json);
    expect(decodeCareerSave('snooker-lz-v1:'+LZString.compressToUTF16(json))).toBe(json);
    expect(decodeCareerSave(encodeCareerSave(state))).toBe(json);
    expect(encodeCareerSave(state).length).toBeLessThan(json.length / 3);
  });
  it('keeps a first-season active save portable and lossless; named copies use IndexedDB', () => {
    const initial = createStarterState();
    const end = initial.tournaments.map(t => t.endDate ?? t.startDate).sort().at(-1)!;
    const state = processRankingCalendar({ ...initial, currentDate: end });
    const encoded = encodeCareerSave(state);
    expect(encoded.length * 2).toBeLessThan(5 * 1024 * 1024);
    expect(JSON.parse(decodeCareerSave(encoded))).toEqual(state);
    expect(Object.values(state.rollingRankings!.events).length).toBeGreaterThan(30);
  }, 60000);
});

 it('native decompression preserves all save data and rejects damaged gzip', async () => {
   const state={player:'Élliot',history:Array.from({length:2000},(_,i)=>({season:i,score:'13–12'}))};
   const encoded=encodeCareerSave(state);
   expect(await decodeCareerSaveAsync(encoded)).toBe(JSON.stringify(state));
   expect(await decodeCareerSaveAsync(JSON.stringify(state))).toBe(JSON.stringify(state));
   await expect(decodeCareerSaveAsync('snooker-gzip-v2:AAAA')).rejects.toThrow();
 });
