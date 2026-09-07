import type { GameState } from '../hooks/useGameState';

export type EmergingStar = { id: string; name: string; nation: string; age: number; overall: number; potential: number; circuit: string; detail: string };

/** A prospect watch based on recorded ratings, not a promise of future success. */
export function emergingStars(state: GameState, before?: GameState): EmergingStar[] {
  const previous = new Map(before?.worldPlayers.map(p => [p.id, p]));
  const pathwayKeys = ['youth', 'amateur', 'qTour', 'qSchool'] as const;
  const fields = Object.fromEntries(pathwayKeys.map(key => [key, new Set(state.competitionTables[key].map(row => row.playerName))]));
  const seen = new Set<string>();
  const stars: EmergingStar[] = [];
  for (const p of state.worldPlayers) {
    const old = previous.get(p.id);
    const graduate = p.hasTourCard && old?.hasTourCard === false;
    if (p.playerName === state.player.fullName || p.retired || p.age > 25 || p.age < 12 || (p.hasTourCard && !graduate) || /^Qualifier \d+$/i.test(p.playerName) || seen.has(p.playerName)) continue;
    if (!Number.isFinite(p.overallRating) || !Number.isFinite(p.developmentPotential)) continue;
    const overall = Math.round(p.overallRating!);
    const potential = Math.round(Math.max(p.overallRating!, p.developmentPotential!));
    const outstandingAbility = overall >= (p.age <= 21 ? 70 : 78);
    const outstandingPotential = potential >= (p.age <= 21 ? 90 : 92);
    if (!outstandingAbility && !outstandingPotential) continue;
    seen.add(p.playerName);
    const circuit = graduate ? (p.cardSource ?? 'Qualifying pathway') + ' → Main tour'
      : p.age <= 21 && fields.youth.has(p.playerName) ? 'Youth'
      : fields.qTour.has(p.playerName) ? 'Q Tour'
      : fields.amateur.has(p.playerName) ? 'Amateur'
      : fields.qSchool.has(p.playerName) ? 'Q School'
      : p.age <= 21 ? 'Youth pathway' : 'Amateur pathway';
    const reason = [outstandingAbility ? 'standout current ability' : '', outstandingPotential ? 'exceptional potential' : ''].filter(Boolean).join(' and ');
    const detail = `${circuit} · OVR ${overall} · POT ${potential} · ${reason}.`;
    stars.push({ id: p.id, name: p.playerName, nation: p.nation, age: p.age, overall, potential, circuit, detail });
  }
  return stars.sort((a, b) => b.potential - a.potential || b.overall - a.overall || a.age - b.age || a.name.localeCompare(b.name)).slice(0, 5);
}
