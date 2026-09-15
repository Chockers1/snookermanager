import { expect, test } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { initializeRollingRankings } from '../src/game/rollingRankings';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { ACCESSIBILITY_KEY } from '../src/game/accessibility';
for (const [width, height, scale] of [[1920, 1080, 100], [1366, 768, 130], [1280, 720, 100], [390, 844, 100]]) test(`ranking layout and navigation at ${width}, ${scale}%`, async ({ page }) => {
 const state = initializeRollingRankings(createStarterState());
 state.firstWeekGuide = {version:1,dismissed:true,completed:[],skipped:[]};
 const due = new Date(Date.parse(state.currentDate + 'T12:00:00Z') + 10 * 86400000).toISOString().slice(0, 10);
 const key = 'layout-pending:' + state.currentDate;
 state.rollingRankings!.events[key] = { key, tournamentId: 'layout-pending', name: 'English Open', season: state.season, completedOn: due, ranking: true, applied: false, bracket: [] };
 state.rollingRankings!.earnings.push({ id: key + ':human', eventKey: key, playerName: state.player.fullName, amount: 16500, earnedOn: due, expiresOn: '2030-01-01', season: state.season });
 const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
 await page.setViewportSize({ width, height });
 await page.addInitScript(({ key, value, accessibility, scale }) => {
  localStorage.setItem(key, value); localStorage.setItem(accessibility, JSON.stringify({ textScale: scale, reducedMotion: true }));
 }, { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state), accessibility: ACCESSIBILITY_KEY, scale });
 await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
 await expect(page.getByRole('heading', { name: 'Upcoming & Recent Results', exact: true })).toBeVisible();
 await page.evaluate(() => { history.pushState({}, '', '/rankings'); dispatchEvent(new PopStateEvent('popstate')); });
 const assertFits = async () => {
  expect(await page.locator('main').evaluate(el => el.scrollHeight <= el.clientHeight + 2 && el.scrollWidth <= el.clientWidth + 2)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
 };
 for (const name of ['World Ranking', 'One-Year Ranking', 'Youth Ranking', 'Amateur Ranking', 'Q Tour Ranking', 'Q School OOM', 'Senior Ranking']) {
  await page.getByRole('button', { name, exact: true }).click(); await assertFits();
  const regions = page.getByLabel('Pathway standings', { exact: true });
  if (await regions.count()) for (const option of await regions.locator('option').allTextContents()) {
   await regions.selectOption(option); await assertFits();
  }
 }
 await page.getByRole('button', { name: 'World Ranking', exact: true }).click();
 await page.getByLabel('Search players', { exact: true }).fill(state.player.fullName);
 await expect(page.locator('tbody tr')).toHaveCount(1);
 await expect(page.locator('tbody tr')).toContainText(state.player.fullName);
 await page.getByLabel('Search players', { exact: true }).fill('nonexistent-player');
 await expect(page.getByText('No players match your search.')).toBeVisible();
 await page.getByRole('button', { name: 'Find me', exact: true }).click();
 await expect(page.locator('tr[data-human=true]')).toBeInViewport();
 await expect(page.getByLabel('Search players', { exact: true })).toHaveValue('');
 await page.screenshot({ path: `artifacts/rankings-redesign-${width}.png` });
 await page.getByRole('button', { name: 'How this list works', exact: true }).click();
 await expect(page.getByRole('dialog')).toContainText('two years'); await page.keyboard.press('Escape');
 for (const name of ['Your race', 'Pathway']) {
  await page.getByRole('tab', { name, exact: true }).click(); await assertFits();
  if (name === 'Your race') {
   await expect(page.getByRole('region', { name: 'Pending ranking credit' })).toContainText('£16,500');
   const insights = page.getByLabel('Ranking insights');
   for (const title of ['Ranking Movement', 'Next Target', 'Recent Ranking Sources', 'Event Scenarios', 'Form']) {
    const heading = insights.getByRole('heading', { name: title, exact: true });
    await heading.scrollIntoViewIfNeeded(); await expect(heading).toBeVisible();
    const card = heading.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " card ")][1]');
    expect(await card.evaluate(el => el.scrollHeight <= el.clientHeight + 2 && el.scrollWidth <= el.clientWidth + 2), title).toBe(true);
   }
  } else await expect(page.getByText(/Qualification races/)).toBeVisible();
 }
 await page.getByRole('tab', { name: 'Pathway', exact: true }).focus(); await page.keyboard.press('Home');
 await expect(page.getByRole('tab', { name: 'Standings', exact: true })).toHaveAttribute('aria-selected', 'true');
 expect(errors).toEqual([]);
});
