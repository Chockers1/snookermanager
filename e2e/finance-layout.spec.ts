import { expect, test } from '@playwright/test';
import { createNewCareerState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { ACCESSIBILITY_KEY } from '../src/game/accessibility';
import { readCareerSave } from './read-career-save';
for (const [width, height, scale] of [[1920, 1080, 100], [1366, 768, 130], [1100, 768, 100], [390, 844, 100]]) {
 test(`finance fits one screen at ${width}, ${scale}%`, async ({ page }) => {
  const state = createNewCareerState(); state.firstWeekGuide!.dismissed = true;
  state.finance.ledger = Array.from({ length: 30 }, (_, i) => ({ id: `expense-${i}`, date: state.currentDate, description: `Recorded expense ${i}`, category: 'Staff', type: 'Expense' as const, amount: 32 }));
  await page.setViewportSize({ width, height });
  await page.addInitScript(({ key, save, accessibility, scale }) => {
   localStorage.setItem(key, save); localStorage.setItem(accessibility, JSON.stringify({ textScale: scale, reducedMotion: true }));
  }, { key: ACTIVE_SAVE_KEY, save: encodeCareerSave(state), accessibility: ACCESSIBILITY_KEY, scale });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.getByRole('heading', { name: 'Upcoming & Recent Results', exact: true })).toBeVisible();
  await page.evaluate(() => { history.pushState({}, '', '/finance'); dispatchEvent(new PopStateEvent('popstate')); });
  const tabs = page.getByRole('tablist', { name: 'Finance sections' });
  for (const name of ['Overview', 'Income & Costs', 'Transactions', 'Budget', 'Season']) {
   await tabs.getByRole('tab', { name, exact: true }).click();
   expect(await page.locator('main').evaluate(el => el.scrollHeight <= el.clientHeight + 2 && el.scrollWidth <= el.clientWidth + 2)).toBe(true);
   await page.screenshot({ path: `artifacts/finance-${width}-${name.replaceAll(' ', '-')}.png` });
   if (name === 'Overview' && width >= 1024) {
    const chart = await page.getByRole('heading', { name: 'Recurring Monthly Estimate', exact: true }).locator('..').locator('..').boundingBox();
    const panel = await page.locator('#finance-panel').boundingBox();
    expect(chart!.y + chart!.height).toBeLessThanOrEqual(panel!.y + panel!.height + 2);
   }
   if (name === 'Transactions') {
    await expect(page.getByRole('cell', { name: 'Recorded expense 29 Staff', exact: true })).toHaveCount(1);
    await expect(page.getByRole('cell', { name: '-£32', exact: true })).toHaveCount(30);
   }
   if (name === 'Budget') {
    const before = await readCareerSave(page);
    await page.getByRole('button', { name: 'Manage Budget', exact: true }).click();
    const editor = page.getByRole('dialog', { name: 'Monthly Budget Manager' });
    await expect(editor).toBeVisible();
    await editor.getByRole('spinbutton').first().fill('10000');
    await editor.getByRole('button', { name: 'Save Allocation' }).click();
    await expect(editor).toHaveCount(0);
    expect((await readCareerSave(page)).player.cash).toBe(before.player.cash);
   }
  }
  await tabs.getByRole('tab', { name: 'Season', exact: true }).focus(); await page.keyboard.press('Home');
  await expect(tabs.getByRole('tab', { name: 'Overview', exact: true })).toHaveAttribute('aria-selected', 'true');
 });
}
