import { expect, test } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';
function fixture() {
  const state = createStarterState();
  state.currentDate = '2027-04-17';
  state.tournaments = state.tournaments.map(t => ({ ...t, status:'Skipped' }));
  return state;
}
for (const viewport of [{width:1280,height:720},{width:390,height:844},{width:320,height:568}]) test('finish season and review at ' + viewport.width + 'px', async ({page}) => {
  test.setTimeout(90000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize(viewport);
  await page.addInitScript(({key,value}) => { if (!sessionStorage.getItem('season-fixture')) { localStorage.setItem(key,value); sessionStorage.setItem('season-fixture','1'); } }, { key:ACTIVE_SAVE_KEY, value:encodeCareerSave(fixture()) });
  await page.goto('/'); await page.getByRole('button',{name:/Continue Career/}).click();
  if (viewport.width < 1280) await page.getByRole('button',{name:'Tournament next step'}).click();
  await page.getByRole('button',{name:'Finish Season',exact:true}).click();
  const dialog = page.getByRole('dialog',{name:'2026/27 Season Review'});
  await expect(dialog).toBeVisible({timeout:30000});
  await expect(dialog.getByRole('heading',{name:'Final World Rankings'})).toBeVisible();
  await expect(dialog.getByRole('heading',{name:'Major Tournament Winners'})).toBeVisible();
  await expect(dialog.getByRole('button',{name:'Start New Season'})).toBeInViewport();
  await page.screenshot({path:'artifacts/season-review-' + viewport.width + '.png'});
  expect(await dialog.evaluate(e => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible();
  await page.reload(); await page.getByRole('button',{name:/Continue Career/}).click(); await expect(dialog).not.toBeVisible();
  await page.evaluate(() => { history.pushState({}, '', '/season-review'); dispatchEvent(new PopStateEvent('popstate')); });
  // Reload retains the pending review and its dismissal, with the full report still actionable.
  await expect(page.getByRole('button',{name:'Start New Season'})).toBeVisible();
  const before = await readCareerSave(page); expect(before.seasonReview?.pending).toBe(true);
  expect(before.currentDate).toBe('2027-06-30');
  if (viewport.width === 1280) {
    await page.getByRole('button',{name:'Open Review Popup',exact:true}).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button',{name:'Start New Season'}).click();
  } else await page.getByRole('button',{name:'Start New Season'}).click();
  await expect(page).toHaveURL('/');
  await expect.poll(async () => (await readCareerSave(page)).seasonReview).toBeNull();
  const after = await readCareerSave(page); expect(after.season).toBe('2027/28');
  await expect(page.getByTestId('season-week')).toHaveText('Season 2 · Week 1');
  await expect(page.getByTestId('season-week')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  expect(after.history.seasonRecords).toHaveLength(1);
  expect(after.tournaments.some(t => t.status === 'Available')).toBe(true);
  expect(errors).toEqual([]);
});
