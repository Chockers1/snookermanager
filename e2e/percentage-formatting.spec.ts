import { expect, test } from '@playwright/test';
import { betweenMatchFixture } from '../test-support/betweenMatchFixture';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';

test('player condition displays never expose floating-point tails across career screens', async ({ page }) => {
  const { state } = betweenMatchFixture();
  state.player.fatigue = 5.210000000000001;
  state.player.confidence = 83.05000000000001;
  state.player.morale = 92.1 + 0.6;
  state.trainingCondition.strain = 12.300000000000002;
  state.trainingCondition.burnout = 4.200000000000001;
  state.matches[0].fatigueChange = 1.2000000000000028;
  state.matches[0].confidenceChange = 1.9000000000000057;
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(({ key, save }) => localStorage.setItem(key, save), { key: ACTIVE_SAVE_KEY, save: encodeCareerSave(state) });
  await page.goto('/');
  await page.getByRole('button', { name: /Continue Career/ }).click();
  const screens = [
    ['/tournaments/hub', /Shanghai Masters/],
    ['/player/attributes', /Player Attributes/],
    ['/training', /Build This Week/],
    ['/training/report', /Fortnightly Training Report/],
    ['/mental', /Mental State/],
    ['/health', /Health Centre/],
    ['/tournament/preparation', /Prepare for/],
    ['/match/result', /Match Review/],
    ['/season-review', /End of Season/],
  ] as const;
  for (const [route, heading] of screens) {
    await page.evaluate(route => { history.pushState({}, '', route); dispatchEvent(new PopStateEvent('popstate')); }, route);
    await expect(page.locator('#main-content h1').first(), route).toHaveText(heading);
    const text = await page.locator('body').innerText();
    expect(text.match(/[-+]?\d+\.\d{3,}%/g), route).toBeNull();
    if (route === '/player/attributes') {
      const fitness = page.getByText('Match Fitness', { exact: true }).locator('..');
      await expect(fitness).toContainText('94.79% ready');
      const circle = fitness.locator('.rounded-full');
      await expect(circle).toHaveText('95');
      const fits = await circle.evaluate(element => {
        const number = element.querySelector('span')!.getBoundingClientRect();
        const ring = element.getBoundingClientRect();
        return number.left >= ring.left && number.right <= ring.right;
      });
      expect(fits).toBe(true);
      expect(text.match(/\d+\.\d{3,}/g), route).toBeNull();
    }
    if (route === '/tournaments/hub') {
      const readiness = page.getByRole('heading', { name: 'Match Readiness' }).locator('..').locator('..');
      await expect(readiness).toContainText('94.79%');
      await expect(readiness).toContainText('83.05%');
    }
  }
  const saved = await readCareerSave(page);
  expect(saved.player.fatigue).toBe(state.player.fatigue);
  expect(saved.player.confidence).toBe(state.player.confidence);
});
