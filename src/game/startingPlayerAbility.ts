/** Starting profiles only: never use this to recalculate a saved player's ability. */
export type StartingCircuit = 'world' | 'qSchool' | 'qTour' | 'amateur' | 'senior' | 'youth';
const bound = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const hash = (text: string) => [...text].reduce((value, char) => Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0, 2166136261);
const matureRanges: Record<Exclude<StartingCircuit, 'world'>, readonly [number, number]> = {
  youth: [44, 67], amateur: [48, 77], qTour: [58, 83], qSchool: [54, 83], senior: [50, 78],
};

export function startingPlayerAbility(input: {
  name: string; age: number; circuit: StartingCircuit; rank: number; fieldSize: number;
  professionalOverall?: number;
}): { overallRating: number; developmentPotential: number } {
  const { name, age, circuit, rank, fieldSize } = input;
  const talent = hash(`${name}:potential`) % 100;
  const potential = talent >= 94 ? 96 + talent % 4
    : talent >= 78 ? 90 + talent % 6
      : talent >= 48 ? 84 + talent % 6
        : talent >= 18 ? 76 + talent % 8 : 68 + talent % 8;
  const variation = (hash(`${name}:ability`) % 7) - 3;
  let overall: number;
  if (circuit === 'world' && input.professionalOverall !== undefined) {
    overall = input.professionalOverall;
  } else {
    const [floor, ceiling] = matureRanges[circuit === 'world' ? 'qSchool' : circuit];
    const seedQuality = 1 - bound((rank - 1) / Math.max(1, fieldSize - 1), 0, 1);
    // Youth seed strength is already a junior baseline. Other pathways describe
    // more mature competitors, so their teenagers have further to develop.
    const developmentGap = Math.max(0, (circuit === 'youth' ? 18 : 21) - age) * 2;
    const exceptional = age < 21 && talent >= 94 && hash(`${name}:early-development`) % 4 === 0 ? 4 : 0;
    overall = Math.round(bound(floor + seedQuality * (ceiling - floor) + variation - developmentGap + exceptional, 38, 86));
  }
  // A young player's projected ceiling must leave development ahead of them.
  const headroom = age < 21 ? Math.ceil((23 - age) / 2) : age < 25 ? 2 : 0;
  return { overallRating: overall, developmentPotential: bound(Math.max(potential, overall + headroom), overall, 99) };
}
