import { expect, test } from '@playwright/test';
import { ACTIVE_SAVE_KEY, SAVE_SLOT_PREFIX, decodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave, readStoredCareerValue } from './read-career-save';

test('Start Career reclaims space from four legacy saves without deleting them', async ({ page }) => {
  await page.addInitScript(({ prefix }) => {
    localStorage.clear();
    for (let i = 0; i < 4; i++) localStorage.setItem(`${prefix}legacy-${i}`, JSON.stringify({ player: { fullName: `Legacy ${i}` }, notes: 'Old save history. '.repeat(15000) }));
    const size = () => Object.keys(localStorage).reduce((sum, key) => sum + localStorage.getItem(key)!.length, 0);
    const limit = size() + 100;
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (this === localStorage && size() - (this.getItem(key)?.length ?? 0) + String(value).length > limit) throw new DOMException('Storage full', 'QuotaExceededError');
      setItem.call(this, key, value);
    };
  }, { prefix: SAVE_SLOT_PREFIX });
  await page.goto('/');
  await page.getByRole('button', { name: /New Career/ }).click();
  await page.locator('input').first().fill('Storage Recovery');
  for (let step = 0; step < 3; step++) await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: 'Start Career', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Storage Recovery').first()).toBeVisible();
  expect((await readCareerSave(page)).player.fullName).toBe('Storage Recovery');
  const oldSaves = await Promise.all(Array.from({length:4},(_,i)=>readStoredCareerValue(page,`${SAVE_SLOT_PREFIX}legacy-${i}`)));
  for (const [index, raw] of oldSaves.entries()) expect(JSON.parse(decodeCareerSave(raw!)).player.fullName).toBe(`Legacy ${index}`);
});

test('a blocked write shows an error and preserves the entered player for retry', async ({ page }) => {
  await page.addInitScript(({ prefix }) => {
    localStorage.clear();
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function(value, key) {
      if (typeof key === 'string' && key.startsWith(prefix) && !sessionStorage.getItem('allow-test-save')) throw new DOMException('Storage disabled', 'SecurityError');
      return put.call(this, value, key);
    };
  }, { prefix: SAVE_SLOT_PREFIX });
  await page.goto('/');
  await page.getByRole('button', { name: /New Career/ }).click();
  await page.locator('input').first().fill('Retry Player');
  for (let step = 0; step < 3; step++) await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: 'Start Career', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('career could not be saved');
  await expect(page).toHaveURL(/\/new-career/);
  await expect(page.getByRole('button', { name: 'Start Career', exact: true })).toBeEnabled();
  expect(await readStoredCareerValue(page, ACTIVE_SAVE_KEY)).toBeNull();
  await page.evaluate(() => sessionStorage.setItem('allow-test-save', 'yes'));
  await page.getByRole('button', { name: 'Start Career', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  expect((await readCareerSave(page)).player.fullName).toBe('Retry Player');
});
