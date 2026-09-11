// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPlayerBackgroundCatalog,
  createPlayerIdentitySeed,
  createPlayerSliderCatalog,
} from "../data/gameContent";
import {
  ACTIVE_SAVE_SLOT_KEY,
  ACTIVE_SAVE_KEY,
  decodeCareerSave,
  readSaveSlotIndex,
  SAVE_SLOT_PREFIX,
} from "../game/saveStorage";
import { type NewCareerConfig, createStarterState, useGameState } from "./useGameState";

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
afterEach(() => vi.restoreAllMocks());

describe("career save slots", () => {
  it("creates independent autosave slots and can load either career", async () => {
    const { result } = renderHook(() => useGameState());

    await act(async () => result.current.resetCareer(buildCareerConfig("Alice Breaker")));
    await waitFor(() => expect(result.current.savePending).toBe(false));
    const firstSlot = readSaveSlotIndex()[0];
    expect(firstSlot?.playerName).toBe("Alice Breaker");
    if (!firstSlot) return;
    expect(window.localStorage.getItem(ACTIVE_SAVE_SLOT_KEY)).toBe(firstSlot.id);

    await act(async () => result.current.resetCareer(buildCareerConfig("Ben Safety")));
    await waitFor(() => expect(result.current.savePending).toBe(false));
    const slots = readSaveSlotIndex();
    const secondSlot = slots.find((slot) => slot.playerName === "Ben Safety");
    expect(slots).toHaveLength(2);
    expect(secondSlot).toBeDefined();
    expect(decodeCareerSave(window.localStorage.getItem(`${SAVE_SLOT_PREFIX}${firstSlot.id}`)!)).toContain(
      "Alice Breaker",
    );

    await act(async () => {
      expect(await result.current.loadSaveSlot(firstSlot.id)).toBe(true);
    });
    await waitFor(() => expect(result.current.savePending).toBe(false));
    expect(result.current.gameState.player.fullName).toBe("Alice Breaker");
    expect(window.localStorage.getItem(ACTIVE_SAVE_SLOT_KEY)).toBe(firstSlot.id);
  }, 30000);
  it('keeps the previous career and removes only the incomplete new slot when activation fails', async () => {
    const { result } = renderHook(() => useGameState());
    await act(async () => result.current.resetCareer(buildCareerConfig('Existing Career')));
    await waitFor(() => expect(result.current.savePending).toBe(false));
    const previousSlot = readSaveSlotIndex()[0];
    const previousSave = window.localStorage.getItem(ACTIVE_SAVE_KEY);
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
      if (key === ACTIVE_SAVE_SLOT_KEY && value !== previousSlot.id) throw new DOMException('Blocked', 'SecurityError');
      originalSetItem.call(window.localStorage, key, value);
    });
    await act(async () => { await expect(result.current.resetCareer(buildCareerConfig('Unfinished Career'))).rejects.toThrow('browser could not save'); });
    expect(result.current.gameState.player.fullName).toBe('Existing Career');
    expect(readSaveSlotIndex()).toEqual([previousSlot]);
    expect(window.localStorage.getItem(ACTIVE_SAVE_KEY)).toBe(previousSave);
    expect(Object.keys(window.localStorage).filter(key => key.startsWith(SAVE_SLOT_PREFIX))).toHaveLength(1);
  }, 30000);
});


describe('failed career loading preserves durable saves', () => {
  it.each(['not-json', '{}'])('rejects corrupt active payload %s without creating a replacement career', async payload => {
    localStorage.setItem(ACTIVE_SAVE_KEY, payload);
    const { result, unmount } = renderHook(() => useGameState());
    expect(result.current.saveWarning).toContain('original is preserved');
    await act(async () => expect(await result.current.continueActiveCareer()).toBe(false));
    expect(result.current.careerSessionMode).toBe('launcher');
    expect(localStorage.getItem(ACTIVE_SAVE_KEY)).toBe(payload);
    expect(readSaveSlotIndex()).toHaveLength(0);
    unmount();
  });
  it('validates named saves before replacing the active career', async () => {
    const { result, unmount } = renderHook(() => useGameState());
    await act(async () => result.current.resetCareer(buildCareerConfig('Kept Career')));
    await waitFor(() => expect(result.current.savePending).toBe(false));
    const previous = localStorage.getItem(ACTIVE_SAVE_KEY), slot = localStorage.getItem(ACTIVE_SAVE_SLOT_KEY);
    localStorage.setItem(SAVE_SLOT_PREFIX + 'damaged', 'damaged-json');
    await act(async () => expect(await result.current.loadSaveSlot('damaged')).toBe(false));
    expect(localStorage.getItem(ACTIVE_SAVE_KEY)).toBe(previous);
    expect(localStorage.getItem(ACTIVE_SAVE_SLOT_KEY)).toBe(slot);
    expect(result.current.gameState.player.fullName).toBe('Kept Career');
    unmount();
  }, 30000);
  it('rolls back import writes when activation fails after writing its slot and index', async () => {
    const { result, unmount } = renderHook(() => useGameState());
    await act(async () => result.current.resetCareer(buildCareerConfig('Kept Career')));
    await waitFor(() => expect(result.current.savePending).toBe(false));
    const previous = localStorage.getItem(ACTIVE_SAVE_KEY), slot = localStorage.getItem(ACTIVE_SAVE_SLOT_KEY), index = readSaveSlotIndex();
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function(key,value) {
      if (key === ACTIVE_SAVE_SLOT_KEY && value !== slot) throw new DOMException('Full', 'QuotaExceededError');
      original.call(localStorage,key,value);
    });
    const incoming = createStarterState(); incoming.player.fullName = 'Incoming Career';
    await act(async () => expect(await result.current.importCareer(JSON.stringify(incoming))).toBe(false));
    expect(localStorage.getItem(ACTIVE_SAVE_KEY)).toBe(previous);
    expect(localStorage.getItem(ACTIVE_SAVE_SLOT_KEY)).toBe(slot);
    expect(readSaveSlotIndex()).toEqual(index);
    expect(result.current.gameState.player.fullName).toBe('Kept Career');
    unmount();
  }, 30000);
});
