import { expect, test } from '@playwright/test';
import { createNewCareerState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { ACCESSIBILITY_KEY } from '../src/game/accessibility';
import { plusDays } from '../src/game/careerDepth/shared';

for (const width of [1366, 390]) for (const populated of [false, true]) {
 test(`form evidence is readable at ${width}, records: ${populated}`, async ({ page }) => {
  const state = createNewCareerState(); state.firstWeekGuide!.dismissed = true;
  const life = state.careerDepth!.seasonLife!;
  if (populated) {
   life.evidence = Array.from({ length: 7 }, (_, i) => ({ id: 'evidence-' + i, date: state.currentDate, openings: 10, openingsMade: 5, strongLeads: 3, leadsLost: 1 }));
   life.form = { id: 'form:layout', kind: 'long-pot', started: state.currentDate, ends: plusDays(state.currentDate, 42), progress: 34, route: 'training', evidence: 'Repeated long-opening results below your earlier baseline.', fatigue: 34, confidence: 67 };
  } else { life.evidence = []; delete life.form; }
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ key, value, accessibility }) => {
   localStorage.setItem(key, value);
   localStorage.setItem(accessibility, JSON.stringify({ textScale: 130, reducedMotion: true }));
  }, { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state), accessibility: ACCESSIBILITY_KEY });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.locator('#main-content')).toBeVisible();
  await page.evaluate(() => { history.pushState({}, '', '/training'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.locator('#main-content')).not.toContainText('Tactical & scheduling advice');
  const support = page.getByLabel('Training support');
  await expect(support).toContainText('Development & practice'); await expect(support).toContainText('Training base');
  if (width >= 1280) {
    const tops = await support.locator(':scope > section').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().top));
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(2);
    expect(await page.locator('main').evaluate(el => el.scrollHeight <= el.clientHeight + 2)).toBe(true);
  }
  await page.screenshot({ path: `artifacts/training-support-${width}-${populated}.png` });
  await page.getByRole('button', { name: /Form assessment/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Form evidence and recovery', exact: true });
  await expect(dialog).toBeVisible();
  const bounds = (await dialog.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(width); expect(bounds.y + bounds.height).toBeLessThanOrEqual(900);
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const records = dialog.getByRole('region', { name: 'Recorded form evidence' });
  if (populated) {
   await expect(dialog.getByRole('button', { name: 'Targeted training', exact: true })).toHaveAttribute('aria-pressed', 'true');
   await expect(records.locator('dl')).toHaveCount(6);
   await expect(records.locator('dl').first()).toContainText('5 of 10');
   await expect(records.locator('dl').first()).toContainText('1 of 3');
   await records.locator('dl').last().scrollIntoViewIfNeeded();
  } else {
   await expect(dialog.getByRole('heading', { name: 'No match evidence recorded yet' })).toBeVisible();
   await expect(dialog.locator('table')).toHaveCount(0);
   await expect(records).toContainText('Play matches in Match Centre');
  }
  await page.screenshot({ path: `artifacts/career-v012/form-recovery-${width}-${populated}.png` });
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
 });
}
