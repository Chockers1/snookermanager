import { expect, test } from '@playwright/test';
import { createNewCareerState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';

for (const width of [1366, 390]) test(`training edits, reset, save and support editors work at ${width}`, async ({ page }) => {
  const state = createNewCareerState(); state.firstWeekGuide!.dismissed = true;
  await page.setViewportSize({ width, height: width === 390 ? 844 : 768 });
  await page.addInitScript(({ key, save }) => {
    if (!sessionStorage.getItem('training-fixture')) { localStorage.setItem(key, save); sessionStorage.setItem('training-fixture', '1'); }
  }, { key: ACTIVE_SAVE_KEY, save: encodeCareerSave(state) });
  async function training() {
    await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
    await expect(page.getByRole('heading', { name: 'Upcoming & Recent Results', exact: true })).toBeVisible();
    await page.evaluate(() => { history.pushState({}, '', '/training'); dispatchEvent(new PopStateEvent('popstate')); });
    await expect(page.getByRole('heading', { name: 'Weekly Timetable', exact: true })).toBeVisible();
  }
  await training();
  const morning = page.getByLabel('Mon Morning', { exact: true }).filter({ visible: true });
  const original = await morning.inputValue();
  await morning.selectOption('fitness');
  await expect(page.getByRole('status').filter({ hasText: 'Unsaved changes' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(morning).toHaveValue(original);
  await page.getByRole('region', {name:'Training focus'}).getByRole('button', {name:/^Recovery/}).click();
  await expect(morning).not.toHaveValue(original);
  await morning.selectOption('fitness');
  await page.getByRole('button', { name: 'Apply Plan', exact: true }).click();
  await expect.poll(async () => (await readCareerSave(page)).trainingPlan[0].morning.title).toBe('Fitness');
  if (width === 390) {
    await page.getByRole('group', {name:'Choose training day'}).getByRole('button',{name:'Sun',exact:true}).click();
    await expect(page.getByLabel('Sun Evening',{exact:true}).filter({visible:true})).toBeVisible();
  }
  for (const name of ['Development & practice: Choose', 'Form assessment: Review', 'Training base: Manage']) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  expect(await page.locator('main').evaluate(el => el.scrollHeight <= el.clientHeight + 2 && el.scrollWidth <= el.clientWidth + 2)).toBe(true);
  await page.screenshot({path:`artifacts/training-redesign-workflow-${width}.png`});
  await training(); await expect(morning).toHaveValue('fitness');
});
