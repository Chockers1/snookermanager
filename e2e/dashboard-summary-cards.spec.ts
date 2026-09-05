import { expect, test } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY } from '../src/game/saveStorage';

for (const size of [{ width: 1920, height: 1080 }, { width: 1280, height: 720 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 375, height: 812 }]) {
  test(`dashboard summary cards contain their content at ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    const state = createStarterState();
    const coach = state.coaches.find(c => c.id === state.currentCoachId);
    if (coach) coach.name = 'Alexandria Montgomery-Wellington';
    state.history.snapshots = [1, 3, 5, 7, 9].map((day, i) => ({ ...state.history.snapshots[0], date: `2026-05-${String(day).padStart(2, '0')}`, cash: 14000 + i * 800 - (i === 3 ? 1500 : 0), week: i + 1 }));
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (/width.*height|height.*width/i.test(m.text()) && /chart/i.test(m.text())) errors.push(m.text()); });
    await page.addInitScript(({ key, save }) => localStorage.setItem(key, save), { key: ACTIVE_SAVE_KEY, save: JSON.stringify(state) });
    await page.goto('/');
    await page.getByRole('button', { name: /Continue Career/ }).click();
    for (const id of ['dashboard-career-content', 'dashboard-finance-content']) {
      const content = page.getByTestId(id);
      await content.scrollIntoViewIfNeeded();
      await expect(content).toBeVisible();
      const fit = await content.evaluate(el => {
        const card = el.closest('button')!.getBoundingClientRect();
        return [...el.querySelectorAll('dt, dd, p')].every(node => { const r = node.getBoundingClientRect(); return r.left >= card.left && r.right <= card.right + 1 && r.bottom <= card.bottom + 1; });
      });
      expect(fit).toBe(true);
    }
    const finance = page.getByTestId('dashboard-finance-content');
    await expect(finance.getByText('Balance', { exact: true })).toBeVisible();
    await expect(finance.locator('.recharts-area-curve')).toBeVisible();
    expect(await finance.locator('.recharts-surface').evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(80);
    expect(errors).toEqual([]);
    if (size.width >= 1280) { await page.evaluate(() => document.querySelector('#main-content')?.scrollTo(0, 0)); }
    await page.screenshot({ path: `artifacts/dashboard-summary-${size.width}.png`, fullPage: false });
  });
}
