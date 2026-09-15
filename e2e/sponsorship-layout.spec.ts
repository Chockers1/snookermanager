import { expect, test } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { ACCESSIBILITY_KEY } from '../src/game/accessibility';
for (const [width, height, scale] of [[1920, 1080, 100], [1366, 768, 130], [1100, 768, 100], [390, 844, 100]]) {
 test(`sponsorship fits one screen at ${width}, ${scale}%`, async ({ page }) => {
  const state = createStarterState(); if (state.firstWeekGuide) state.firstWeekGuide.dismissed = true;
  if (width === 1100) { state.sponsors = []; state.player.reputation = 0; state.player.worldRanking = 120; }
  await page.setViewportSize({ width, height });
  await page.addInitScript(({ key, save, accessibility, scale }) => {
   localStorage.setItem(key, save); localStorage.setItem(accessibility, JSON.stringify({ textScale: scale, reducedMotion: true }));
  }, { key: ACTIVE_SAVE_KEY, save: encodeCareerSave(state), accessibility: ACCESSIBILITY_KEY, scale });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.getByRole('heading', { name: 'Upcoming & Recent Results', exact: true })).toBeVisible();
  await page.evaluate(() => { history.pushState({}, '', '/sponsorship'); dispatchEvent(new PopStateEvent('popstate')); });
  const slots = page.getByRole('group', { name: 'Sponsor slots' });
  await expect(slots.getByRole('button')).toHaveCount(3);
  const fits = async () => expect(await page.locator('main').evaluate(el => el.scrollHeight <= el.clientHeight + 2 && el.scrollWidth <= el.clientWidth + 2)).toBe(true);
  if (state.sponsors[0]) {
   await slots.getByRole('button', { name: new RegExp(state.sponsors[0].name) }).click();
   const dialog = page.getByRole('dialog');
   await expect(dialog).toContainText('Contract remaining');
   await expect(dialog).toContainText('Satisfaction');
   await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
  }
  const tabs = page.getByRole('tablist', { name: 'Sponsorship sections' });
  for (const name of ['Offers', 'Comparison', 'Commercial Profile']) {
   await tabs.getByRole('tab', { name, exact: true }).click(); await fits();
   if (name === 'Offers') {
    const offers = page.getByRole('table', { name: 'Available sponsor offers' });
    await expect(offers.getByRole('columnheader')).toHaveText(['Company', 'Contract', 'Monthly Pay', 'Brand Fit', 'Risk']);
    if (await offers.getByRole('button').count()) {
     const company = await offers.getByRole('button').first().innerText();
     await offers.getByRole('button').first().focus(); await page.keyboard.press('Enter');
     await expect(page.getByRole('heading', { name: company, exact: true })).toBeVisible();
    }
   }
   if (name === 'Offers' && width < 1024) {
    await page.getByRole('tablist', { name: 'Offer view' }).getByRole('tab', { name: 'Details', exact: true }).click(); await fits();
   }
   await page.screenshot({ path: `artifacts/sponsorship-${width}-${name.replaceAll(' ', '-')}.png` });
  }
  await tabs.getByRole('tab', { name: 'Commercial Profile' }).focus(); await page.keyboard.press('Home');
  await expect(tabs.getByRole('tab', { name: 'Offers', exact: true })).toHaveAttribute('aria-selected', 'true');
 });
}
