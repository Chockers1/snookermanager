import { test, expect } from '@playwright/test';
import { qualificationFixture } from '../test-support/qualificationFixture';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';

test('existing qualifying email shows a clear confirmation and opens the correct main event', async ({ page }) => {
  const state = qualificationFixture();
  const message = state.inbox.find(m => m.subject === 'Post-event report: International Championship Qualifying')!;
  const main = state.tournaments.find(t => t.name === 'International Championship')!;
  message.qualificationReport = undefined;
  message.summary![0].value = 'Winner';
  message.preview = 'Winner after a 6-1 result.';
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state) });
  await page.goto('/');
  await page.getByRole('button', { name: /Continue Career/ }).click();
  await page.evaluate(() => { history.pushState({}, '', '/inbox'); dispatchEvent(new PopStateEvent('popstate')); });
  await page.getByText(message.subject, { exact: true }).first().click();
  const report = page.getByRole('region', { name: 'Post-event report', exact: true });
  await expect(report).toContainText('Qualified for International Championship');
  await expect(report).toContainText('One best-of-11 qualifying match was required');
  await expect(report).toContainText('No further qualifying match is needed');
  await expect(report).toContainText(main.startDate);
  await report.getByRole('link', { name: 'View International Championship entry & travel' }).click();
  await expect(page).toHaveURL(new RegExp('/calendar\\?tournament=' + main.id));
  await expect(page.getByRole('heading', { name: 'International Championship', level: 2, exact: true })).toBeVisible();
});
