import { test, expect, type Page } from '@playwright/test';
import { createNewCareerState } from '../src/hooks/useGameState';
import { careerLegacyOf, recordLegacyMatch } from '../src/game/careerLegacy';
import { ACCESSIBILITY_KEY } from '../src/game/accessibility';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import type { Match } from '../src/types/game';
async function open(page: Page, populated: boolean | 'rt' = false) {
  const state = createNewCareerState();
  if (populated === 'rt') {
    state.history.legacy = { ...careerLegacyOf(state), matchesPlayed: 38, wins: 23, losses: 15, centuries: 7, prizeMoney: 240000 };
    state.player.legacyScore = 100; state.player.reputation = 100;
  } else if (populated) {
    let stats = careerLegacyOf(state);
    for (let i = 0; i < 14; i++) {
      const m: Match = { id: 'legacy-' + i, season: '2026/27', tournamentId: 'legacy-event-' + i, round: 'Final', bestOf: 7, playerName: state.player.fullName, opponentName: 'Samir Gallagher', playerRanking: 13, opponentRanking: 20, playerFrames: 4, opponentFrames: 3, result: 'Won', highestBreak: 147, opponentHighestBreak: 90, fifties: 4, centuries: 2, maximumBreaks: i === 0 ? 2 : 0, potSuccess: 88, longPotSuccess: 76, safetySuccess: 81, fouls: 2, confidenceChange: 0, fatigueChange: 0, prizeMoneyEarned: 1000, rankingPointsGained: 1000 };
      stats = recordLegacyMatch(stats, m, { id: m.tournamentId, tournamentId: m.tournamentId, name: i === 13 ? 'World Championship' : 'County Open ' + (i + 1), season: '2026/27', date: '2026-08-01', category: i === 13 ? 'Major' : 'Amateur', circuit: i === 13 ? 'World Snooker Tour' : 'Amateur Circuit', opponent: m.opponentName, score: '4–3', prizeMoney: 1000 });
    }
    state.history.legacy = stats;
  }
  await page.addInitScript(({ key, save }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, save); }, { key: ACTIVE_SAVE_KEY, save: encodeCareerSave(state) });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click(); await expect(page.getByRole('heading', { name: 'Upcoming & Recent Results', exact: true })).toBeVisible();
  await page.evaluate(() => { history.pushState({}, '', '/career/stats'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.getByRole('heading', { name: 'Career Stats & Legacy' })).toBeVisible();
  const guide = page.getByRole('button', { name: 'Minimise first-week guide', exact: true }); if (await guide.isVisible()) await guide.click();
}
test('new careers have empty records and an honest trophy cabinet', async ({ page }) => {
  await open(page);
  await page.getByRole('tab', { name: 'Trophies', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your first trophy awaits' })).toBeVisible();
  await page.getByRole('tab', { name: 'Records', exact: true }).click();
  await page.getByRole('tab', { name: 'Records', exact: true }).click();
  const records = page.getByRole('region', { name: 'Career Records' });
  await expect(records).toContainText('Centuries (100+)');
  await expect(records.locator('div').filter({ has: page.locator('dt', { hasText: /^Pot success$/ }) }).last()).toContainText('—');
});
test('records and trophy filters work and survive reload', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1100 }); await open(page, true);
  await page.getByRole('tab', { name: 'Records', exact: true }).click();
  const records = page.getByRole('region', { name: 'Career Records' });
  await expect(records).toContainText('88.0%'); await expect(records).toContainText('147 maximums');
  await page.getByRole('tab', { name: 'Trophies', exact: true }).click();
  const cabinet = page.getByRole('region', { name: /Trophy Cabinet/ });
  await expect(cabinet.getByRole('article')).toHaveCount(12);
  await cabinet.getByRole('button', { name: /Show more trophies/ }).click(); await expect(cabinet.getByRole('article')).toHaveCount(14);
  await page.getByLabel('Trophy category').selectOption('Major'); await expect(cabinet.getByRole('article')).toHaveCount(1);
  await expect(cabinet).toContainText('World Championship'); await expect(cabinet).toContainText('4–3 vs Samir Gallagher');
  await page.locator('#main-content').evaluate(el => { el.scrollTop = 0; });
  await page.screenshot({ path: 'test-results/legacy-desktop.png', fullPage: true });
  await page.reload(); await page.getByRole('button', { name: /Continue Career/ }).click(); await expect(page.getByRole('heading', { name: 'Upcoming & Recent Results', exact: true })).toBeVisible();
  await page.evaluate(() => { history.pushState({}, '', '/career/stats'); dispatchEvent(new PopStateEvent('popstate')); });
  await page.getByRole('tab', { name: 'Records', exact: true }).click(); await expect(records).toContainText('88.0%');
  await page.getByRole('tab', { name: 'Trophies', exact: true }).click(); await expect(cabinet).toContainText('World Championship'); expect(errors).toEqual([]);
});
test('Legacy remains readable on a narrow screen without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await open(page, true);
  await page.getByRole('tab', { name: 'Trophies', exact: true }).click();
  await page.getByLabel('Trophy category').selectOption('Major');
  const width = await page.locator('#main-content').evaluate(el => ({ content: el.scrollWidth, viewport: el.clientWidth }));
  expect(width.content).toBeLessThanOrEqual(width.viewport + 1);
  await expect(page.getByRole('heading', { name: 'World Championship', exact: true })).toBeVisible();
  await page.locator('#main-content').evaluate(el => { el.scrollTop = 0; });
  await page.screenshot({ path: 'test-results/legacy-mobile.png', fullPage: true });
});

test('RT’s titleless save no longer shows a perfect legacy or world champion label', async ({ page }) => {
  await open(page, 'rt');
  const score = page.getByRole('region', { name: 'Legacy score' });
  await expect(score.locator('span.text-4xl')).toHaveText('2');
  await expect(score).toContainText('Tour Professional'); await expect(score).not.toContainText('World Champion');
  await page.getByRole('tab', { name: 'Tournament History', exact: true }).click();
  await expect(page.getByRole('columnheader', { name: 'Ranking Credit' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Legacy Impact' })).toHaveCount(0);
});

for (const width of [1920, 1366, 390]) test(`Legacy tabs contain long records at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : width === 1366 ? 768 : 900 });
  if (width === 1366) await page.addInitScript(key => localStorage.setItem(key, JSON.stringify({ textScale: 130, reducedMotion: true })), ACCESSIBILITY_KEY);
  await open(page, true);
  for (const tab of ['Overview', 'Records', 'Trophies', 'Tournament History', 'Trends', 'Goals', 'Stories']) {
    await page.getByRole('tab', { name: tab, exact: true }).click();
    await expect(page.getByRole('tabpanel')).toBeVisible();
    if (width >= 1024 && ['Overview', 'Records', 'Trends'].includes(tab)) {
      expect(await page.getByRole('tabpanel').evaluate(el => el.scrollHeight <= el.clientHeight + 2)).toBe(true);
    }
    if (width >= 1024 && tab === 'Overview') {
      expect(await page.locator('.legacy-identity').evaluate(el => el.scrollHeight <= el.clientHeight + 2)).toBe(true);
    }
    if (['Overview', 'Records', 'Trends'].includes(tab)) await page.screenshot({ path: `artifacts/legacy-redesign-${width}-${tab}.png` });
    if (width === 1920 && tab === 'Overview') await page.screenshot({ path: 'artifacts/legacy-overview-contained.png' });
    expect(await page.locator('main').evaluate(el => el.scrollHeight <= el.clientHeight + 2)).toBe(true);
    expect(await page.locator('main').evaluate(el => el.scrollWidth <= el.clientWidth + 2)).toBe(true);
  }
  await expect(page.getByRole('button', { name: /Season stories, interviews/ })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Overview', exact: true }).focus(); await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'Stories', exact: true })).toBeFocused();
  await page.evaluate(() => { history.pushState({}, '', '/career/stats#trophy-cabinet'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.getByRole('tab', { name: 'Trophies', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.screenshot({ path: `artifacts/legacy-tabs-${width}.png` });
});
