import type { Coach, CoachContractOption } from "../types/game";

export type CoachPriceBand =
  "All" | "Budget" | "Value" | "Premium" | "Elite" | "Short-term";

export function getCoachContractOptions(
  coach: Pick<Coach, "weeklyCost">,
): CoachContractOption[] {
  return [
    {
      label: "4 Week Clinic",
      weeklyCost: Math.round(coach.weeklyCost * 1.1),
      totalCost: Math.round(coach.weeklyCost * 1.1) * 4,
    },
    {
      label: "8 Week Trial",
      weeklyCost: coach.weeklyCost,
      totalCost: coach.weeklyCost * 8,
      selected: true,
    },
    {
      label: "16 Week Deal",
      weeklyCost: Math.round(coach.weeklyCost * 0.95),
      totalCost: Math.round(coach.weeklyCost * 0.95) * 16,
    },
    {
      label: "Season Contract",
      weeklyCost: Math.round(coach.weeklyCost * 0.9),
      totalCost: Math.round(coach.weeklyCost * 0.9) * 24,
    },
  ];
}

export function getCoachContractWeeks(contractLabel?: string) {
  if (/4/i.test(contractLabel ?? "")) return 4;
  if (/16/i.test(contractLabel ?? "")) return 16;
  if (/season|24/i.test(contractLabel ?? "")) return 24;
  return 8;
}

export function getCoachSlotLimit(ranking: number, reputation: number) {
  return ranking <= 16 || reputation >= 58 ? 2 : 1;
}

export function getCoachAvailability(
  coach: Pick<Coach, "minimumRanking" | "minimumReputation" | "unlockLabel">,
  ranking: number,
  reputation: number,
) {
  const minimumRanking = coach.minimumRanking ?? 999;
  const minimumReputation = coach.minimumReputation ?? 0;

  if (ranking > minimumRanking && reputation < minimumReputation) {
    return {
      available: false,
      reason:
        coach.unlockLabel ??
        `Unlock at Top ${minimumRanking} or ${minimumReputation} reputation`,
    };
  }

  return { available: true, reason: "Available now" };
}

export function getCoachPriceBand(
  coach: Pick<Coach, "weeklyCost" | "level">,
): Exclude<CoachPriceBand, "All" | "Short-term"> {
  if (coach.weeklyCost < 250) return "Budget";
  if (coach.weeklyCost <= 450) return "Value";
  if (coach.weeklyCost <= 700) return "Premium";
  return "Elite";
}

export function getCoachProjectedImpact(coach: Coach) {
  const strongestRating = Math.max(
    coach.technical,
    coach.tactical,
    coach.mental,
    coach.motivation,
  );
  const primaryGain = Number(
    (((strongestRating - 45) / 15) * (coach.compatibility / 100)).toFixed(1),
  );
  const tacticalBonus = Math.max(
    1,
    Math.round((coach.tactical - 50) / 10 + coach.compatibility / 35),
  );
  const fatigueReduction =
    coach.type === "Fitness"
      ? Math.max(2, Math.round((coach.motivation - 55) / 8))
      : 0;
  const primaryLabel =
    coach.type === "Break Building"
      ? "Break Building"
      : coach.type === "Cue Action"
        ? "Cue Ball Control"
        : coach.type === "Mental"
          ? "Composure"
          : coach.type === "Fitness"
            ? "Recovery Rate"
            : coach.type === "Tactical"
              ? "Safety Play"
              : "Long Potting";
  return {
    primaryLabel,
    primaryGain: Math.max(0.5, primaryGain),
    tacticalBonus,
    fatigueReduction,
  };
}

export function getCoachAffordabilityForecast(
  cash: number,
  currentWeeklyCashFlow: number,
  currentCoachSpend: number,
  option: Pick<CoachContractOption, "weeklyCost" | "totalCost"> | undefined,
) {
  const weeklyCost = option?.weeklyCost ?? 0;
  const projectedWeeklyCashFlow = currentWeeklyCashFlow - weeklyCost;
  const cashCoverWeeks = weeklyCost > 0 ? Math.floor(cash / weeklyCost) : 999;
  const affordable = Boolean(
    option && cash >= option.totalCost * 0.2 && cashCoverWeeks >= 4,
  );
  const status = !option
    ? "Select a contract"
    : !affordable
      ? "Not affordable"
      : projectedWeeklyCashFlow >= 0
        ? "Affordable"
        : cashCoverWeeks >= 16
          ? "Manageable"
          : "High risk";
  return {
    affordable,
    status,
    weeklyCost,
    projectedStaffSpend: currentCoachSpend + weeklyCost,
    projectedWeeklyCashFlow,
    cashCoverWeeks,
  };
}
