import type { Page } from '@playwright/test';
import { ACTIVE_SAVE_KEY, decodeCareerSave } from '../src/game/saveStorage';
import type { GameState } from '../src/hooks/useGameState';

export async function readCareerSave(page: Page): Promise<GameState> {
  const raw = await page.evaluate(key => localStorage.getItem(key), ACTIVE_SAVE_KEY);
  if (!raw) throw new Error('No saved career');
  return JSON.parse(decodeCareerSave(raw)) as GameState;
}
