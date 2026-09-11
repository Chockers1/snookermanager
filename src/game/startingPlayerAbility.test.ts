import { describe, expect, it, vi } from 'vitest';
import { startingPlayerAbility, type StartingCircuit } from './startingPlayerAbility';
import { createNewCareerState, repairGameState } from '../hooks/useGameState';
import { annualCpuDevelopment } from './worldIntegrity';

function fresh(seed: number, startingLevelId = 'start-club-junior', age = 15) {
  let value = seed;
  const random = vi.spyOn(Math, 'random').mockImplementation(() => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  });
  try {
    return createNewCareerState({ fullName: 'Generation Audit', nationality: 'England', age,
      handedness: 'Right-handed', cueStyle: 'Traditional', playingStyle: 'Balanced',
      personalityArchetype: '', sliders: [], backgroundId: '', startingLevelId });
  } finally { random.mockRestore(); }
}
const profile = (age: number, circuit: StartingCircuit = 'qSchool', name = 'Young Prospect', rank = 1) =>
  startingPlayerAbility({ name, age, circuit, rank, fieldSize: 256 });

describe('starting ability and potential', () => {
  it('accounts for development stage instead of treating a Q School seed as elite ability', () => {
    expect(profile(14).overallRating).toBeLessThan(profile(18).overallRating);
    expect(profile(18).overallRating).toBeLessThan(profile(25).overallRating);
    expect(profile(15, 'youth').overallRating).toBeLessThan(profile(15, 'qTour').overallRating);
    expect(profile(25).overallRating).toBeLessThanOrEqual(86);
    expect(profile(15).developmentPotential).toBeGreaterThan(profile(15).overallRating);
    expect(profile(15, 'qTour', 'Young Prospect', 1).overallRating).toBeGreaterThan(profile(15, 'qTour', 'Young Prospect', 256).overallRating);
  });
  it('keeps exceptional potential rare and separate from current ability, with deterministic variation', () => {
    const players = Array.from({ length: 1000 }, (_, i) => profile(15, 'qSchool', 'Prospect ' + i));
    const exceptional = players.filter(p => p.developmentPotential >= 96);
    expect(exceptional.length).toBeGreaterThan(20); expect(exceptional.length).toBeLessThan(100);
    expect(Math.max(...players.map(p => p.overallRating))).toBeLessThanOrEqual(78);
    expect(new Set(players.map(p => p.overallRating)).size).toBeGreaterThan(6);
    expect(profile(15)).toEqual(profile(15));
    const talent = exceptional[0];
    expect(annualCpuDevelopment(15, talent.overallRating, talent.developmentPotential, 'Prospect')).toBeGreaterThan(0);
  });
  it('preserves established professional starting strength', () => {
    expect(startingPlayerAbility({ name: 'Tour Champion', age: 29, circuit: 'world', rank: 1, fieldSize: 128, professionalOverall: 96 }).overallRating).toBe(96);
  });
  it('creates plausible young opponents across multiple seeds and starting paths', () => {
    for (const [seed, path, age] of [[104729, 'start-club-junior', 15], [130363, 'start-elite-amateur', 19], [155921, 'start-q-tour', 22], [204732, 'start-rookie-pro', 25]] as const) {
      const state = fresh(seed, path, age);
      const young = state.worldPlayers.filter(p => p.playerName !== state.player.fullName && p.age < 18 && !p.hasTourCard);
      expect(young.length).toBeGreaterThan(30);
      for (const player of young) {
        expect(player.overallRating, player.playerName).toBeLessThanOrEqual(82);
        expect(player.developmentPotential, player.playerName).toBeGreaterThan(player.overallRating!);
      }
      expect(state.worldPlayers.filter(p => p.hasTourCard && p.overallRating! >= 90).length).toBeGreaterThan(5);
    }
  }, 20000);
  it('does not regenerate existing ratings or missing potential when an older save is loaded', () => {
    const state = fresh(314159);
    const old = state.worldPlayers.find(p => p.playerName !== state.player.fullName && p.age < 18 && !p.hasTourCard)!;
    old.overallRating = 96; delete old.developmentPotential;
    const attributes = structuredClone(state.attributes);
    const loaded = repairGameState(JSON.parse(JSON.stringify(state)));
    const again = repairGameState(JSON.parse(JSON.stringify(loaded)));
    for (const save of [loaded, again]) {
      expect(save.worldPlayers.find(p => p.id === old.id)).toMatchObject({ age: old.age, overallRating: 96 });
      expect(save.worldPlayers.find(p => p.id === old.id)?.developmentPotential).toBeUndefined();
      expect(save.attributes).toEqual(attributes);
    }
  }, 20000);
});
