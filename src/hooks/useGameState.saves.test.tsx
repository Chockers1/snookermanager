// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createPlayerBackgroundCatalog,
  createPlayerIdentitySeed,
  createPlayerSliderCatalog,
} from "../data/gameContent";
import {
  ACTIVE_SAVE_SLOT_KEY,
  readSaveSlotIndex,
  SAVE_SLOT_PREFIX,
} from "../game/saveStorage";
import { type NewCareerConfig, useGameState } from "./useGameState";

function buildCareerConfig(fullName: string): NewCareerConfig {
  return {
    fullName,
    nationality: "New Zealand",
    age: 18,
    handedness: createPlayerIdentitySeed.handedness as
      | "Right-handed"
      | "Left-handed",
    cueStyle: createPlayerIdentitySeed.cueStyle,
    playingStyle: createPlayerIdentitySeed.playingStyle,
    personalityArchetype: createPlayerIdentitySeed.personalityArchetype,
    sliders: createPlayerSliderCatalog.map((slider) => ({ ...slider })),
    backgroundId:
      createPlayerBackgroundCatalog[1]?.id ??
      createPlayerBackgroundCatalog[0].id,
    startingLevelId: "start-rookie-pro",
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("career save slots", () => {
  it("creates independent autosave slots and can load either career", () => {
    const { result } = renderHook(() => useGameState());

    act(() => result.current.resetCareer(buildCareerConfig("Alice Breaker")));
    const firstSlot = readSaveSlotIndex()[0];
    expect(firstSlot?.playerName).toBe("Alice Breaker");
    if (!firstSlot) return;
    expect(window.localStorage.getItem(ACTIVE_SAVE_SLOT_KEY)).toBe(firstSlot.id);

    act(() => result.current.resetCareer(buildCareerConfig("Ben Safety")));
    const slots = readSaveSlotIndex();
    const secondSlot = slots.find((slot) => slot.playerName === "Ben Safety");
    expect(slots).toHaveLength(2);
    expect(secondSlot).toBeDefined();
    expect(window.localStorage.getItem(`${SAVE_SLOT_PREFIX}${firstSlot.id}`)).toContain(
      "Alice Breaker",
    );

    act(() => {
      expect(result.current.loadSaveSlot(firstSlot.id)).toBe(true);
    });
    expect(result.current.gameState.player.fullName).toBe("Alice Breaker");
    expect(window.localStorage.getItem(ACTIVE_SAVE_SLOT_KEY)).toBe(firstSlot.id);
  });
});
