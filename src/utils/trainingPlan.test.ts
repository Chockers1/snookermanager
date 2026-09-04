import { describe, expect, it } from "vitest";
import {
  buildFocusedTrainingPlan,
  getTrainingSessionOptionId,
  TRAINING_FOCUS_PRESETS,
} from "./trainingPlan";

describe("training focus presets", () => {
  it("builds a full editable week for every focus", () => {
    for (const preset of TRAINING_FOCUS_PRESETS) {
      const week = buildFocusedTrainingPlan(preset.id, "2026-05-11", 35);
      expect(week).toHaveLength(7);
      expect(
        week.every((day) => day.morning && day.afternoon && day.evening),
      ).toBe(true);
    }
  });

  it("produces meaningfully different potting, safety and recovery weeks", () => {
    const sessionIds = (focus: "potting" | "safety" | "recovery") =>
      buildFocusedTrainingPlan(focus, "2026-05-11", 35)
        .flatMap((day) => [day.morning, day.afternoon, day.evening])
        .map(getTrainingSessionOptionId);

    const potting = sessionIds("potting");
    const safety = sessionIds("safety");
    const recovery = sessionIds("recovery");
    expect(
      potting.filter((id) => id === "break-building").length,
    ).toBeGreaterThan(2);
    expect(
      safety.filter((id) => id === "safety-exchanges").length,
    ).toBeGreaterThan(2);
    expect(
      recovery.filter((id) => id === "rest" || id === "recovery").length,
    ).toBe(21);
  });

  it("protects event and booked travel sessions in every focus", () => {
    const competition = [
      { name: "Welsh Open", location: "Llandudno", startDate: "2026-05-14" },
    ];

    for (const preset of TRAINING_FOCUS_PRESETS) {
      const week = buildFocusedTrainingPlan(
        preset.id,
        "2026-05-11",
        35,
        competition,
        true,
      );
      expect(week[2].afternoon.title).toBe("Travel");
      expect(week[3].competitionName).toBe("Welsh Open");
      expect(week[3].afternoon.title).toBe("Match Simulation");
    }
  });
});
