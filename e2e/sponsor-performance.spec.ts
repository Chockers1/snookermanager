import { expect, test } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';

for (const noOffers of [false, true]) test(`sponsor satisfaction and warnings remain visible ${noOffers ? 'without open offers' : 'with offers'}`, async ({ page }) => {
  const state = createStarterState();
  const sponsor = state.sponsors[0];
  sponsor.performance = { ...sponsor.performance!, satisfaction: 31.5, warningAtMatch: 5, matchesReviewed: 8, lastChange: -3 };
  if (noOffers) state.sponsorOffers = state.sponsorOffers.map(offer => ({ ...offer, status: 'Rejected' }));
  await page.setViewportSize(noOffers ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
  await page.addInitScript(({ key, value }) => { if (!sessionStorage.getItem('sponsor-performance-test')) { localStorage.clear(); localStorage.setItem(key, value); sessionStorage.setItem('sponsor-performance-test', '1'); } }, { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state) });
  await page.goto('/');
  await page.getByRole('button', { name: /Continue Career/ }).click();
  await page.evaluate(() => { history.pushState({}, '', '/sponsorship'); dispatchEvent(new PopStateEvent('popstate')); });
  const panel = page.locator('details').filter({ has: page.getByText('Satisfaction · Unhappy', { exact: true }) }).first();
  await expect(panel).toBeVisible();
  await panel.locator('summary').click();
  await expect(panel.getByText(/Aim to win/)).toBeVisible();
  await expect(panel.getByText(/3 more competitive matches before cancellation is possible/)).toBeVisible();
  await expect(panel.getByText(/Promotional obligations/)).toBeVisible();
  const before = (await readCareerSave(page)).sponsors[0].performance;
  await page.reload(); await page.getByRole('button', { name: /Continue Career/ }).click();
  expect((await readCareerSave(page)).sponsors[0].performance).toEqual(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});
