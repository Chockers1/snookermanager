import { COACH_TRAINING_SKILLS, coachTrainingBonus } from '../game/coachTraining';
import type { Coach, CoachContract, CoachContractOption } from "../types/game";

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
  return { skills: COACH_TRAINING_SKILLS[coach.type], trainingBonus: coachTrainingBonus(coach) };
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

export function getCoachTerminationCost(contract: Pick<CoachContract, "weeklyCost" | "weeksRemaining">) {
  return Math.round(Math.max(0, contract.weeksRemaining) * Math.max(0, contract.weeklyCost) * 100) / 100;
}
