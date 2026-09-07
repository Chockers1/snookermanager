import type { Page } from '@playwright/test';
import { applyInboxReadOverlay, inboxReadStorageKey } from '../src/game/inboxReadState';
import { ACTIVE_SAVE_KEY, ACTIVE_SAVE_SLOT_KEY, decodeCareerSave } from '../src/game/saveStorage';
import type { GameState } from '../src/hooks/useGameState';

export async function readCareerSave(page: Page): Promise<GameState> {
  const raw = await page.evaluate(key => localStorage.getItem(key), ACTIVE_SAVE_KEY);
  if (!raw) throw new Error('No saved career');
  const slotId = await page.evaluate(key => localStorage.getItem(key), ACTIVE_SAVE_SLOT_KEY);
  const overlay = await page.evaluate(key => localStorage.getItem(key), inboxReadStorageKey(slotId));
  return applyInboxReadOverlay(JSON.parse(decodeCareerSave(raw)) as GameState, raw, overlay);
}
