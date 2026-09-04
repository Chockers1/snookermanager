export type PreparationFocusId =
  | "custom"
  | "balanced"
  | "potting"
  | "safety"
  | "match-ready"
  | "mental"
  | "fitness"
  | "recovery";

export type PreparationAllocationId =
  | "potting"
  | "breakBuilding"
  | "tactical"
  | "mental"
  | "fitness"
  | "recovery";

export type PreparationAllocations = Record<PreparationAllocationId, number>;

export type PreparationSupportId =
  | "table-hire"
  | "physio"
  | "coach"
  | "psychologist"
  | "equipment-service";

export type PreparationEffects = {
  cost: number;
  confidenceDelta: number;
  fatigueDelta: number;
  strainDelta: number;
  sharpnessDelta: number;
  readinessDelta: number;
  familiarityBonus: number;
  attributeBonuses: Record<string, number>;
};

export type TournamentPreparationPlan = {
  focusId: PreparationFocusId;
  allocations: PreparationAllocations;
  supportIds: PreparationSupportId[];
  effects: PreparationEffects;
  confirmedWeek: number;
  confirmedDate: string;
};

export const preparationAllocationMeta: Array<{
  id: PreparationAllocationId;
  label: string;
  description: string;
}> = [
  { id: "potting", label: "Potting", description: "Long potting · consistency" },
  { id: "breakBuilding", label: "Break Building", description: "Scoring · cue ball" },
  { id: "tactical", label: "Tactical", description: "Safety · composure" },
  { id: "mental", label: "Mental", description: "Confidence · focus" },
  { id: "fitness", label: "Fitness", description: "Stamina · mobility" },
  { id: "recovery", label: "Recovery", description: "Fatigue · strain" },
];

export const preparationFocuses: Array<{
  id: PreparationFocusId;
  label: string;
  description: string;
  allocations: PreparationAllocations;
}> = [
  { id: "balanced", label: "Balanced", description: "Ready without overload", allocations: { potting: 20, breakBuilding: 20, tactical: 15, mental: 15, fitness: 10, recovery: 20 } },
  { id: "potting", label: "Potting & Scoring", description: "Sharpness and scoring", allocations: { potting: 30, breakBuilding: 30, tactical: 10, mental: 10, fitness: 5, recovery: 15 } },
  { id: "safety", label: "Safety & Tactical", description: "Tactical control", allocations: { potting: 10, breakBuilding: 10, tactical: 35, mental: 20, fitness: 5, recovery: 20 } },
  { id: "match-ready", label: "Match Ready", description: "Opening-match rhythm", allocations: { potting: 20, breakBuilding: 25, tactical: 20, mental: 15, fitness: 5, recovery: 15 } },
  { id: "mental", label: "Mental", description: "Confidence routine", allocations: { potting: 10, breakBuilding: 10, tactical: 15, mental: 40, fitness: 5, recovery: 20 } },
  { id: "fitness", label: "Fitness", description: "Physical base", allocations: { potting: 10, breakBuilding: 10, tactical: 10, mental: 10, fitness: 40, recovery: 20 } },
  { id: "recovery", label: "Recovery", description: "Freshness first", allocations: { potting: 5, breakBuilding: 5, tactical: 10, mental: 10, fitness: 5, recovery: 65 } },
];

export const preparationSupports: Array<{
  id: PreparationSupportId;
  label: string;
  detail: string;
  cost: number;
}> = [
  { id: "table-hire", label: "Practice table hire", detail: "+1 sharpness", cost: 85 },
  { id: "physio", label: "Physio session", detail: "-5 fatigue · -4 strain", cost: 70 },
  { id: "coach", label: "Coach session", detail: "+2 tactical form", cost: 110 },
  { id: "psychologist", label: "Sports psychologist", detail: "+3 confidence", cost: 90 },
  { id: "equipment-service", label: "Equipment service", detail: "+2 familiarity", cost: 65 },
];

export function getPreparationFocus(id: PreparationFocusId) {
  if (id === "custom") {
    return {
      id,
      label: "Custom allocation",
      description: "Your manual preparation mix",
      allocations: getDefaultPreparationAllocations(),
    };
  }
  return preparationFocuses.find((focus) => focus.id === id) ?? preparationFocuses[0];
}

export function getDefaultPreparationAllocations(): PreparationAllocations {
  return { ...getPreparationFocus("balanced").allocations };
}

function boundedBonus(value: number, divisor: number, maximum: number) {
  return Math.min(maximum, Math.max(0, Math.round(value / divisor)));
}

export function calculatePreparationEffects(
  allocations: PreparationAllocations,
  supportIds: PreparationSupportId[],
): PreparationEffects {
  const support = new Set(supportIds);
  const practiceLoad = allocations.potting + allocations.breakBuilding + allocations.tactical;
  const overload = Math.max(0, practiceLoad + allocations.fitness - 85);
  const sharpnessDelta = boundedBonus(practiceLoad, 22, 5) + (support.has("table-hire") ? 1 : 0);
  const fatigueDelta = Math.round(overload / 8) - boundedBonus(allocations.recovery, 6, 10) - (support.has("physio") ? 5 : 0);
  const strainDelta = Math.round(overload / 10) - boundedBonus(allocations.recovery, 12, 6) - (support.has("physio") ? 4 : 0);
  const confidenceDelta = boundedBonus(allocations.mental, 18, 3) + (support.has("psychologist") ? 3 : 0);
  const tacticalSupport = support.has("coach") ? 2 : 0;
  const familiarityBonus = support.has("equipment-service") ? 2 : 0;
  const recoveryReadiness = Math.max(0, -fatigueDelta) + Math.max(0, -strainDelta);
  const readinessDelta = Math.max(-8, Math.min(15, Math.round(sharpnessDelta + confidenceDelta / 2 + recoveryReadiness / 3 - overload / 5)));

  return {
    cost: preparationSupports
      .filter((item) => support.has(item.id))
      .reduce((total, item) => total + item.cost, 0),
    confidenceDelta,
    fatigueDelta,
    strainDelta,
    sharpnessDelta,
    readinessDelta,
    familiarityBonus,
    attributeBonuses: {
      "Long Potting": boundedBonus(allocations.potting, 12, 4),
      Consistency: boundedBonus(allocations.potting, 20, 3),
      "Break Building": boundedBonus(allocations.breakBuilding, 11, 4),
      "Cue Ball Control": boundedBonus(allocations.breakBuilding, 18, 3),
      "Safety Play": boundedBonus(allocations.tactical, 11, 4) + tacticalSupport,
      Composure: boundedBonus(allocations.tactical + allocations.mental, 25, 3) + tacticalSupport,
      Focus: boundedBonus(allocations.mental, 14, 4) + (support.has("psychologist") ? 1 : 0),
      "Big Match Nerve": boundedBonus(allocations.mental, 20, 3),
      Stamina: boundedBonus(allocations.fitness, 13, 4),
      Balance: boundedBonus(allocations.fitness, 22, 2),
    },
  };
}

export function getPreparationTone(delta: number, lowerIsBetter = false) {
  if (delta === 0) return "neutral" as const;
  const improves = lowerIsBetter ? delta < 0 : delta > 0;
  return improves ? "positive" as const : "negative" as const;
}
