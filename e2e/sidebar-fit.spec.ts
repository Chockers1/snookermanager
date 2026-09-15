import { expect, test } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { ACCESSIBILITY_KEY } from '../src/game/accessibility';
import { sidebarGroups } from '../src/utils/routing';

for (const [width, height, scale] of [[1920, 1080, 100], [1920, 900, 100], [1366, 768, 130], [1280, 720, 130]]) {
 test(`desktop sidebar fits ${width}x${height} at ${scale}%`, async ({ page }) => {
  const state = createStarterState();
  state.firstWeekGuide = {version: 1, dismissed: true, completed: [], skipped: []};
  await page.setViewportSize({width, height});
  await page.addInitScript(({save, key, preferences, scale}) => {
   localStorage.setItem(key, save);
   localStorage.setItem(preferences, JSON.stringify({textScale: scale, reducedMotion: true}));
  }, {save: encodeCareerSave(state), key: ACTIVE_SAVE_KEY, preferences: ACCESSIBILITY_KEY, scale});
  await page.goto('/');
  await page.getByRole('button', {name: /Continue Career/}).click();
  const sidebar = page.locator('.app-sidebar');
  await expect(sidebar.getByRole('link', {name: 'Season Review', exact: true})).toBeVisible();
  const dimensions = await sidebar.evaluate(el => ({height: el.clientHeight, content: el.scrollHeight, width: el.clientWidth, contentWidth: el.scrollWidth}));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.height + 1);
  expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.width + 1);
  const links = sidebar.getByRole('link');
  await expect(links).toHaveCount(sidebarGroups.reduce((sum, group) => sum + group.items.length, 0));
  await links.first().focus();
  for (const [index, link] of (await links.all()).entries()) {
   if (index) await page.keyboard.press('Tab');
   await expect(link).toBeFocused();
   await expect(link).toBeInViewport({ratio: 1});
  }
  await page.screenshot({path: `artifacts/sidebar-fit-${width}-${height}.png`});
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/season-review$/);
 });
}
