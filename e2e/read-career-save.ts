import { expect, type Page } from '@playwright/test';
import { applyInboxReadOverlay, inboxReadStorageKey } from '../src/game/inboxReadState';
import { ACTIVE_SAVE_KEY, ACTIVE_SAVE_SLOT_KEY, decodeCareerSave } from '../src/game/saveStorage';
import type { GameState } from '../src/hooks/useGameState';

export async function readCareerSave(page: Page): Promise<GameState> {
  // Match Centre uses its own fullscreen layout rather than the dashboard shell.
  await expect(page.locator('#main-content').or(page.getByTestId('live-match-score-centre')).first()).toBeVisible({ timeout: 60000 });
  await expect(page.getByText('Saving…', { exact: true })).toBeHidden({ timeout: 60000 });
  const raw = await readStoredCareerValue(page, ACTIVE_SAVE_KEY);
  if (!raw) throw new Error('No saved career');
  const slotId = await readStoredCareerValue(page, ACTIVE_SAVE_SLOT_KEY);
  const overlay = await page.evaluate(key => localStorage.getItem(key), inboxReadStorageKey(slotId));
  return applyInboxReadOverlay(JSON.parse(decodeCareerSave(raw)) as GameState, raw, overlay);
}

export async function readStoredCareerValue(page: Page, key: string): Promise<string | null> {
  return page.evaluate(async key => {
    const databases = await indexedDB.databases();
    if (!databases.some(db => db.name === 'snooker-career-saves-v1')) return localStorage.getItem(key);
    return new Promise<string | null>((resolve, reject) => {
      const request = indexedDB.open('snooker-career-saves-v1', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result, tx = db.transaction('entries', 'readonly');
        const value = tx.objectStore('entries').get(key);
        tx.oncomplete = () => { db.close(); resolve(value.result ?? null); };
        tx.onabort = () => { db.close(); reject(tx.error); };
      };
    });
  }, key);
}
