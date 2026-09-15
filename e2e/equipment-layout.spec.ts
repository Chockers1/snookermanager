import { expect, test } from '@playwright/test';
import { createNewCareerState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { ACCESSIBILITY_KEY } from '../src/game/accessibility';
for (const [width, height, scale] of [[1920, 1080, 100], [1366, 768, 130], [1100, 768, 100], [390, 844, 100]]) {
 test(`equipment fits one screen at ${width}, ${scale}%`, async ({ page }) => {
  const state = createNewCareerState(); state.firstWeekGuide!.dismissed = true;
  await page.setViewportSize({ width, height });
  await page.addInitScript(({ key, save, accessibility, scale }) => {
   localStorage.setItem(key, save); localStorage.setItem(accessibility, JSON.stringify({ textScale: scale, reducedMotion: true }));
  }, { key: ACTIVE_SAVE_KEY, save: encodeCareerSave(state), accessibility: ACCESSIBILITY_KEY, scale });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.getByRole('heading', { name: 'Upcoming & Recent Results', exact: true })).toBeVisible();
  await page.evaluate(() => { history.pushState({}, '', '/equipment/cues'); dispatchEvent(new PopStateEvent('popstate')); });
  const fits = async () => expect(await page.locator('main').evaluate(el => el.scrollHeight <= el.clientHeight + 2 && el.scrollWidth <= el.clientWidth + 2)).toBe(true);
  const categories = page.getByRole('tablist', { name: 'Equipment categories' });
  for (const name of ['Cues', 'Chalk', 'Tips', 'Cases', 'Training Facility', 'Maintenance']) {
   await categories.getByRole('tab', { name, exact: true }).click();
   await expect(page.getByRole('region', { name: 'Equipment items' })).toBeVisible();
   await fits();
   await page.getByRole('region', { name: 'Equipment items' }).getByRole('button').first().click();
   for (const detail of ['Selected Item', 'My Setup', 'History']) {
    await page.getByRole('tablist', { name: 'Equipment details' }).getByRole('tab', { name: detail, exact: true }).click();
    await fits();
   }
  }
  await categories.getByRole('tab', { name: 'Cues', exact: true }).click();
  await page.screenshot({ path: `artifacts/equipment-${width}.png` });
  await categories.getByRole('tab', { name: 'Cues', exact: true }).focus(); await page.keyboard.press('ArrowRight');
  await expect(categories.getByRole('tab', { name: 'Chalk', exact: true })).toHaveAttribute('aria-selected', 'true');
 });
}
