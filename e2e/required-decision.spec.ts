import { startLiveMatchState } from '../src/hooks/useGameState';
import { resolveTestDecisions } from '../test-support/resolveTestDecisions';
import { expect, test } from '@playwright/test';
import { requiredDecisionFixture } from '../test-support/requiredDecisionFixture';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';

for (const width of [1366, 390]) test('required decision pauses the career until answered at ' + width, async ({ page }) => {
  const { state, story } = requiredDecisionFixture();
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ key, value }) => {
    if (!sessionStorage.getItem('required-decision-fixture')) {
      localStorage.setItem(key, value); sessionStorage.setItem('required-decision-fixture', '1');
    }
  }, { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state) });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.locator('#main-content')).toBeVisible();
  const before = await readCareerSave(page);
  const open = async (route: string) => page.evaluate(route => {
    history.pushState({}, '', route); dispatchEvent(new PopStateEvent('popstate'));
  }, route);
  await open('/tournaments/hub');
  await expect(page.getByRole('button', { name: 'Quick Sim', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Resolve Inbox Decision', exact: true }).click();
  await expect(page).toHaveURL(new RegExp('message=' + encodeURIComponent(story.id)));
  await expect(page.getByRole('region', { name: 'Career decision', exact: true })).toBeVisible();
  // Reading is not a response. The block also survives reopening the career.
  await page.reload(); await page.getByRole('button', { name: /Continue Career/ }).click();
  await open('/tournaments/hub');
  await expect(page.getByRole('button', { name: 'Quick Sim', exact: true })).toBeDisabled();
  await open('/mental');
  await page.getByRole('tab',{name:'Recovery plans',exact:true}).click();
  await page.getByRole('button', { name: 'Apply selected plan', exact: true }).first().click();
  await expect(page).toHaveURL(new RegExp('message=' + encodeURIComponent(story.id)));
  const blocked = await readCareerSave(page);
  expect(blocked.player.cash).toBe(before.player.cash);
  expect(blocked.player.fatigue).toBe(before.player.fatigue);
  expect(blocked.currentDate).toBe(before.currentDate);
  expect(blocked.matches).toEqual(before.matches);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: `artifacts/career-v012/required-decision-${width}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Keep my approach', exact: true }).click();
  await expect(page.getByRole('link', { name: /Decision required:/ })).toHaveCount(0);
  await open('/tournaments/hub');
  await expect(page.getByRole('button', { name: 'Quick Sim', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Quick Sim', exact: true }).click();
  await expect.poll(async () => (await readCareerSave(page)).matches.length).toBe(before.matches.length + 1);
});


test('an interrupted live match cannot bypass a required decision through shortcuts or autoplay', async ({ page }) => {
  const { state: waiting, story, event } = requiredDecisionFixture();
  let state = startLiveMatchState(resolveTestDecisions(waiting), event.id);
  state = { ...state, careerDepth: { ...state.careerDepth!, stories: [story] } };
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value),
    { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state) });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.locator('#main-content')).toBeVisible();
  const before = await readCareerSave(page);
  const openLive = async () => {
    await page.evaluate(() => { history.pushState({}, '', '/match/live'); dispatchEvent(new PopStateEvent('popstate')); });
    await expect(page.getByRole('button', { name: /^Sim Frame/ })).toBeVisible();
  };
  await openLive(); await page.locator('body').click({ position: { x: 1, y: 1 } });
  await page.keyboard.press('f');
  await expect(page).toHaveURL(new RegExp('message=' + encodeURIComponent(story.id)));
  await openLive(); await page.getByRole('button', { name: /^Auto Play/ }).click();
  await expect(page).toHaveURL(new RegExp('message=' + encodeURIComponent(story.id)));
  const blocked = await readCareerSave(page);
  expect(blocked.liveMatch).toEqual(before.liveMatch);
  expect(blocked.player).toEqual(before.player);
  expect(blocked.matches).toEqual(before.matches);
});
