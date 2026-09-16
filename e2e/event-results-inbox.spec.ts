import { expect, test } from '@playwright/test';
import { victoryFixture } from '../test-support/victoryFixture';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';

for (const width of [1280, 390]) test(`one event report contains the full run at ${width}`, async ({ page }) => {
  const { state, event } = victoryFixture();
  const report = state.inbox.find(m => m.subject === `Post-event report: ${event.name}`)!;
  const results = report.eventResults!;
  state.inbox = [report, { id: 'old-win', subject: `Win at ${event.name}`, sender: 'Tournament Office', preview: 'Won a previous round.', priority: 'High', date: 'Today', actionLabel: 'Continue Tournament', actionRoute: '/tournaments/hub' }];
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ key, save }) => localStorage.setItem(key, save), { key: ACTIVE_SAVE_KEY, save: encodeCareerSave(state) });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();
  await page.evaluate(id => { history.pushState({}, '', `/inbox?message=${encodeURIComponent(id)}`); dispatchEvent(new PopStateEvent('popstate')); }, report.id);
  await expect(page.getByRole('region', { name: 'Post-event report', exact: true })).toBeVisible();
  await expect(page.getByLabel('Inbox messages')).not.toContainText(`Win at ${event.name}`);
  const summary = page.locator('summary').filter({ hasText: 'Your event results' });
  await summary.focus(); await page.keyboard.press('Enter');
  const list = page.getByRole('list', { name: 'Event match results' });
  await expect(list).toBeVisible();
  await expect(list.getByRole('listitem')).toHaveCount(results.length);
  for (const result of results) await expect(list).toContainText(`${result.round} · ${result.opponentName}`);
  await expect(list).toContainText('Won 10–9');
});
