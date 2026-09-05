import { expect, test } from '@playwright/test';
import { appRoutes } from '../src/utils/routing';
import { coachCatalog } from '../src/data/gameContent';
import { ACTIVE_SAVE_KEY } from '../src/game/saveStorage';
import { createStarterState } from '../src/hooks/useGameState';

// Start an actual career before visiting routes: reloading a saved URL alone
// deliberately opens the launcher, which is not a route smoke test.
for (const route of appRoutes.filter((entry) => entry.path !== '/match/live')) {
  test(`active career renders ${route.path} without runtime errors`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error' || (message.type() === 'warning' && /width|height|chart/i.test(message.text()))) errors.push(message.text());
    });
    await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, value), {
      key: ACTIVE_SAVE_KEY, value: JSON.stringify(createStarterState()),
    });
    await page.goto('/');
    await page.getByRole('button', { name: /Continue Career/ }).click();
    const target = route.path.replace(':id', coachCatalog[0].id);
    const started = Date.now();
    await page.evaluate((url) => {
      window.history.pushState({}, '', url);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, target);
    await expect(page).toHaveURL((url) => url.pathname === target);
    const main = page.locator('#main-content');
    await expect(main).toBeVisible();
    await expect(main).not.toContainText('Loading table view...');
    await expect(main).not.toContainText('Your career starts here.');
    await expect(main).not.toContainText('The table view failed to load');
    await expect.poll(async () => (await main.innerText()).trim().length).toBeGreaterThan(60);
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await testInfo.attach('route-performance', { body: JSON.stringify({ route: target, interactiveMs: Date.now() - started, errors }), contentType: 'application/json' });
    expect(errors).toEqual([]);
  });
}

for (const width of [320, 768, 1280, 1920]) {
  test(`dashboard actions and long player names remain reachable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const career = createStarterState();
    career.player.fullName = 'Alexandria Montgomery-Wellington';
    career.player.firstName = 'Alexandria';
    await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, value), {
      key: ACTIVE_SAVE_KEY, value: JSON.stringify(career),
    });
    await page.goto('/');
    await page.getByRole('button', { name: /Continue Career/ }).click();
    const name = page.locator('header').getByText(career.player.fullName, { exact: true });
    await expect(name).toBeVisible();
    if (width < 1280) await page.getByRole('button', { name: 'Tournament next step' }).click();
    const enter = page.getByRole('button', { name: 'Enter Tournament', exact: true });
    await expect(enter).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Skip This Event', exact: true })).toBeInViewport();
    await enter.click();
    await expect(page).toHaveURL(/\/tournaments\/hub/);
    await expect(page.getByRole('button', { name: 'Book Travel', exact: true }).first()).toBeVisible();
  });
}
