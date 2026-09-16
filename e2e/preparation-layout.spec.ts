import { expect, test } from '@playwright/test';
import { bookTravelState, createStarterState, enterTournamentState, getNextEligibleTournament } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';

for (const [width, height] of [[1920, 1080], [1366, 768], [1280, 720], [390, 844]]) {
  test(`preparation controls and forecasts remain readable at ${width}x${height}`, async ({ page }) => {
    let state = createStarterState();
    const tournament = getNextEligibleTournament(state)!;
    state = bookTravelState(enterTournamentState(state, tournament.id), tournament.id);
    if (state.firstWeekGuide) state.firstWeekGuide.dismissed = true;
    await page.setViewportSize({ width, height });
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state) });
    await page.goto('/');
    await page.getByRole('button', { name: /Continue Career/ }).click();
    await expect(page.getByRole('heading', { name: 'Upcoming & Recent Results', exact: true })).toBeVisible();
    await page.evaluate(() => { history.pushState({}, '', '/tournament/preparation'); dispatchEvent(new PopStateEvent('popstate')); });
    const workspace = page.getByTestId('tournament-preparation-viewport');
    await expect(workspace.getByRole('heading', { name: 'Preparation allocation', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirm plan', exact: true })).toBeEnabled();
    expect(await workspace.innerText()).not.toMatch(/\d+\.\d{3,}/);
    expect(await workspace.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    if (width >= 1280) {
      expect(await page.locator('main').evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
      const clipped = await workspace.locator('.prep-panel, .prep-allocation-card, .prep-form, .prep-service').evaluateAll(elements => elements.filter(el => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1).map(el => el.className));
      expect(clipped).toEqual([]);
    }
    await page.getByRole('button', { name: /Physio session/ }).click();
    await expect(page.getByRole('button', { name: /Physio session/ })).toHaveAttribute('aria-pressed', 'true');
    await page.screenshot({ path: `artifacts/preparation-redesign/${width}x${height}.png`, fullPage: true });
    await page.getByRole('button', { name: /Reset/, exact: true }).click();
    await expect(page.getByRole('button', { name: /Physio session/ })).toHaveAttribute('aria-pressed', 'false');
    await page.getByRole('tab', { name: 'Skill boosts', exact: true }).click();
    await expect(workspace.getByText('Permanent attributes stay unchanged.', { exact: true })).toBeVisible();
    if (width >= 1280) {
      expect(await page.locator('main').evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
      expect(await workspace.locator('.prep-form').evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
    }
    if (width === 1366) {
      await page.evaluate(() => {
        localStorage.setItem('snooker-accessibility-v1', JSON.stringify({ textScale: 130 }));
        dispatchEvent(new Event('snooker-accessibility'));
      });
      await expect(page.locator('html')).toHaveAttribute('data-text-scale', '130');
      expect(await workspace.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      await page.getByRole('button', { name: 'Confirm plan', exact: true }).scrollIntoViewIfNeeded();
      await expect(page.getByRole('button', { name: 'Confirm plan', exact: true })).toBeInViewport();
    }
  });
}
