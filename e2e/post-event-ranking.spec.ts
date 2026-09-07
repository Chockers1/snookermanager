import { test, expect } from '@playwright/test';
import { postEventRankingFixture } from '../test-support/postEventRankingFixture';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { processRankingCalendar } from '../src/hooks/useGameState';
import { capturePostEventRankings, postEventRanking } from '../src/game/postEventRanking';

for (const published of [false, true]) test('post-event inbox makes ranking publication clear: ' + published, async ({ page }) => {
  const fixture = postEventRankingFixture();
  const state = published ? capturePostEventRankings(processRankingCalendar({ ...fixture.state, currentDate: fixture.message.eventRanking!.publication })) : fixture.state;
  const message = state.inbox.find(m => m.id === fixture.message.id)!;
  const expected = postEventRanking(state, fixture.finance, message.eventRanking)!;
  await page.setViewportSize({ width: published ? 1440 : 390, height: 960 });
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state) });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  await page.evaluate(() => { history.pushState({}, '', '/inbox'); dispatchEvent(new PopStateEvent('popstate')); });
  const select = page.getByRole('combobox', { name: 'Select inbox message' });
  if (await select.isVisible()) await select.selectOption(message.id);
  else await page.getByRole('button', { name: new RegExp(message.subject) }).click();
  const report = page.getByRole('region', { name: 'Post-event report' });
  await expect(report).toContainText(expected.detail);
  await expect(report.getByLabel('Event ranking update')).toContainText('+£30,000 ranking credit');
  await expect(report.getByLabel('Event ranking update')).toContainText(message.eventRanking!.publication);
  if (published) await expect(report).toContainText(expected.change!);
  else await expect(report).not.toContainText('No movement');
  expect(await report.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
});
