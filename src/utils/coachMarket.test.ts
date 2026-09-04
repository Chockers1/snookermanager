import { describe, expect, it } from "vitest";
import { coachCatalog } from "../data/gameContent";
import {
  getCoachAffordabilityForecast,
  getCoachContractOptions,
  getCoachPriceBand,
  getCoachProjectedImpact,
} from "./coachMarket";

describe("expanded coach market", () => {
  it("provides 32 named coaches across every price band", () => {
    expect(coachCatalog).toHaveLength(32);
    expect(new Set(coachCatalog.map((coach) => coach.name)).size).toBe(32);
    expect(new Set(coachCatalog.map(getCoachPriceBand))).toEqual(
      new Set(["Budget", "Value", "Premium", "Elite"]),
    );
  });

  it("offers clinics, trials, longer deals and season contracts", () => {
    const options = getCoachContractOptions(coachCatalog[0]);
    expect(options.map((option) => option.label)).toEqual([
      "4 Week Clinic",
      "8 Week Trial",
      "16 Week Deal",
      "Season Contract",
    ]);
    expect(
      options.every((option) => option.weeklyCost > 0 && option.totalCost > 0),
    ).toBe(true);
  });

  it("calculates gameplay impact and blocks unaffordable appointments", () => {
    const impact = getCoachProjectedImpact(coachCatalog[0]);
    expect(impact.primaryGain).toBeGreaterThan(0);
    expect(impact.tacticalBonus).toBeGreaterThan(0);

    const option = getCoachContractOptions(coachCatalog.at(-1)!)[3];
    expect(getCoachAffordabilityForecast(100, 50, 0, option).affordable).toBe(
      false,
    );
    expect(
      getCoachAffordabilityForecast(100_000, 2_000, 0, option),
    ).toMatchObject({
      affordable: true,
      status: "Affordable",
    });
  });
});
