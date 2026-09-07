import { describe, expect, it } from 'vitest';
import { createStarterState } from '../hooks/useGameState';
import { emergingStars } from './emergingStars';
import { announceSeasonTourChanges, createSeasonTourChanges, tourChangesMessage } from './seasonTourChanges';

function fixture() {
  const state = createStarterState();
  const seed = state.worldPlayers.find(p => p.playerName !== state.player.fullName)!;
  const player = (name: string, age: number, overall: number, potential: number) => ({ ...structuredClone(seed), id: name, playerName: name, age, overallRating: overall, developmentPotential: potential, hasTourCard: false, retired: false });
  state.worldPlayers = [player('Youth Star', 17, 68, 96), player('Strong Amateur', 24, 80, 85), player('Ordinary Prospect', 18, 60, 80),
    { ...player('Established Pro', 22, 90, 99), hasTourCard: true }, { ...player('Retired Prospect', 20, 80, 99), retired: true }, player('Older Amateur', 32, 85, 99)];
  return { state, player };
}

describe('emerging-star spotlight', () => {
  it('selects exceptional youth and amateur ratings, shows the reasons, and excludes established pros and ordinary prospects', () => {
    const { state } = fixture();
    const before = structuredClone(state);
    expect(emergingStars(state).map(p => p.name)).toEqual(['Youth Star', 'Strong Amateur']);
    expect(emergingStars(state)[0]).toMatchObject({ age: 17, overall: 68, potential: 96, circuit: 'Youth pathway' });
    expect(emergingStars(state)[0].detail).toContain('exceptional potential');
    expect(emergingStars(state)[1].detail).toContain('standout current ability');
    expect(state).toEqual(before);
  });
  it('keeps the strongest five unique prospects in stable order and uses confirmed pathway membership', () => {
    const { state, player } = fixture();
    state.worldPlayers = Array.from({ length: 8 }, (_, i) => player('Prospect ' + i, 20, 65 + i, 90 + i));
    state.worldPlayers.push(structuredClone(state.worldPlayers[7]));
    state.competitionTables.qTour = [{ ...state.competitionTables.world[0], playerName: 'Prospect 7' }];
    const stars = emergingStars(state);
    expect(stars).toHaveLength(5);
    expect(stars[0]).toMatchObject({ name: 'Prospect 7', circuit: 'Q Tour', overall: 72, potential: 97 });
    state.worldPlayers.reverse();
    expect(emergingStars(state)).toEqual(stars);
  });
  it('includes newly promoted stars only when their prior amateur status is recorded', () => {
    const { state } = fixture();
    const before = structuredClone(state);
    state.worldPlayers[0].hasTourCard = true;
    state.worldPlayers[0].cardSource = 'Q School';
    expect(emergingStars(state, before)[0].circuit).toBe('Q School → Main tour');
    expect(emergingStars(state).some(p => p.name === 'Youth Star')).toBe(false);
  });
  it('does not invent exceptional ratings or fill a quiet spotlight', () => {
    const { state } = fixture();
    state.worldPlayers = state.worldPlayers.filter(p => p.playerName === 'Ordinary Prospect');
    expect(emergingStars(state)).toEqual([]);
    state.worldPlayers[0].overallRating = 85;
    state.worldPlayers[0].developmentPotential = undefined;
    expect(emergingStars(state)).toEqual([]);
  });
  it('freezes the report and upgrades a current-season older email once with an explicit ratings date', () => {
    const { state } = fixture();
    const report = createSeasonTourChanges(state);
    expect(tourChangesMessage(report).preview).toContain('2 emerging stars');
    state.tourChangesReport = { ...report, sections: report.sections.filter(s => s.id !== 'emergingStars') };
    state.inbox = [tourChangesMessage(state.tourChangesReport)];
    state.tourChangesAnnouncedSeason = state.season;
    const upgraded = announceSeasonTourChanges(state);
    const stars = upgraded.inbox[0].tourChangesReport!.sections.find(s => s.id === 'emergingStars')!;
    expect(stars.asOf).toBe(state.currentDate);
    expect(stars.people).toHaveLength(2);
    expect(announceSeasonTourChanges(upgraded)).toBe(upgraded);
    const frozen = structuredClone(stars);
    upgraded.worldPlayers[0].developmentPotential = 70;
    expect(announceSeasonTourChanges(upgraded).inbox[0].tourChangesReport!.sections.find(s => s.id === 'emergingStars')).toEqual(frozen);
    const older = { ...state, season: '2030/31', tourChangesAnnouncedSeason: '2030/31' };
    expect(announceSeasonTourChanges(older).inbox[0]).toEqual(state.inbox[0]);
  });
});
