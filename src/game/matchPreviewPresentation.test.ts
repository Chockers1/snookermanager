import { describe, expect, it } from 'vitest';
import { previewDifficulty } from './matchPreviewPresentation';
import { pathwayEntryReason } from './pathwayRules';
import { createNewCareerState } from '../hooks/useGameState';
import { rankingRoster } from './rankingPresentation';

describe('junior preview and cross-circuit entrants', () => {
  it('uses public ability, not incomparable ranking positions', () => {
    expect(previewDifficulty(51, 73)).toBe('Lower rated');
    expect(previewDifficulty(73, 51)).toBe('Higher rated');
    expect(previewDifficulty(51, 53)).toBe('Similar ratings');
    expect(previewDifficulty(51)).toBe('Unknown strength');
  });
  it('admits an off-tour 20-year-old but excludes 21-year-olds and professional cards', () => {
    const s = createNewCareerState();
    const event = s.tournaments.find(t => t.name === 'Summer Junior Club League')!;
    expect(event).toBeDefined();
    const entrant = { name: 'Bailey Zimmer', nation: 'GER', age: 20, hasTourCard: false };
    expect(pathwayEntryReason(event, entrant)).toBeNull();
    expect(pathwayEntryReason(event, { ...entrant, age: 21 })).toContain('under 21');
    expect(pathwayEntryReason(event, { ...entrant, hasTourCard: true })).toContain('off-tour');
  });
  it('includes eligible amateurs absent from youth seeds without changing earned results', () => {
    const s = createNewCareerState();
    const p = s.worldPlayers.find(p => p.playerName !== s.player.fullName)!;
    p.age = 20; p.hasTourCard = false; p.retired = false;
    s.competitionTables.youth = s.competitionTables.youth.filter(row => row.playerName !== p.playerName);
    const before = JSON.stringify(s.competitionTables);
    expect(rankingRoster(s, 'youth').find(row => row.playerName === p.playerName)).toMatchObject({ points: 0, eventsPlayed: 0 });
    expect(JSON.stringify(s.competitionTables)).toBe(before);
    p.age = 21; expect(rankingRoster(s, 'youth').some(row => row.playerName === p.playerName)).toBe(false);
    p.age = 20; p.hasTourCard = true; expect(rankingRoster(s, 'youth').some(row => row.playerName === p.playerName)).toBe(false);
  });
});
