import { expect, test } from '@playwright/test';
import { createNewCareerState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { ACCESSIBILITY_KEY } from '../src/game/accessibility';
for (const [width, height, scale] of [[1920, 1080, 100], [1366, 768, 100], [1366, 768, 130], [1100, 768, 100]]) {
 test(`training fits ${width}x${height} at ${scale}%`, async ({ page }) => {
  const state = createNewCareerState(); state.firstWeekGuide!.dismissed = true;
  await page.setViewportSize({ width, height });
  await page.addInitScript(({ key, value, accessibility, scale }) => {
   localStorage.setItem(key, value); localStorage.setItem(accessibility, JSON.stringify({ textScale: scale, reducedMotion: true }));
  }, { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state), accessibility: ACCESSIBILITY_KEY, scale });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.getByRole('heading', { name: 'Upcoming & Recent Results', exact: true })).toBeVisible();
  await page.evaluate(() => { history.pushState({}, '', '/training'); dispatchEvent(new PopStateEvent('popstate')); });
  for (const tab of ['Plan', 'Development', 'Events']) {
   await page.getByRole('tab', { name: tab, exact: true }).click();
   const overflow = await page.getByTestId('training-planner').evaluate(root => [document.querySelector('main')!, root, ...root.querySelectorAll('*')].filter(el => {
    const style = getComputedStyle(el);
    return ['auto', 'scroll'].includes(style.overflowY) && el.scrollHeight > el.clientHeight + 2;
   }).map(el => ({ tag: el.tagName, text: el.textContent?.slice(0, 80), height: el.clientHeight, scroll: el.scrollHeight })));
   expect(overflow).toEqual([]);
   await expect(page.getByRole('button', { name: 'Apply Plan', exact: true })).toBeVisible();
   await expect(page.getByLabel('Sun Evening', { exact: true }).filter({ visible: true })).toBeVisible();
  }
  await page.getByRole('tab', { name: 'Development', exact: true }).click();
  await page.screenshot({ path: `artifacts/training-fit-${width}-${scale}.png` });
 });
}
