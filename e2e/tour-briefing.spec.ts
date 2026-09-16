import { expect, test } from '@playwright/test';
import { createNewCareerState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';

for (const width of [1366, 390]) test('existing youth career receives a standard tour briefing once at ' + width, async ({ page }) => {
  const state = createNewCareerState({ fullName: 'Rob Taylor', nationality: 'England', handedness: 'Right-handed', cueStyle: '', playingStyle: '', personalityArchetype: '', sliders: [], backgroundId: '', age: 15, startingLevelId: 'start-club-junior' });
  delete state.tourBriefing;
  state.inbox = state.inbox.filter(m => !m.id.startsWith('tour-briefing:'));
  state.firstWeekGuide!.dismissed = true;
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ key, value }) => {
    if (!sessionStorage.getItem('briefing-fixture')) {
      localStorage.setItem(key, value); sessionStorage.setItem('briefing-fixture', '1');
      localStorage.setItem('snooker-accessibility-v1', JSON.stringify({ textScale: 130 }));
    }
  }, { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state) });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.locator('#main-content')).toBeVisible();
  await page.getByRole('button', { name: /^Open inbox/ }).click();
  await expect(page).toHaveURL(/inbox/);
  const message = page.getByRole('button', { name: 'Your tour explained · Youth circuit', exact: true });
  await message.click();
  const body = page.getByTestId('inbox-message-body');
  await expect(body.getByRole('heading', { name: 'Your tour explained · Youth circuit', exact: true })).toBeVisible();
  await expect(body.getByRole('region', { name: 'Report summary' })).toBeVisible();
  await expect(body.getByText('Develop and test your game', { exact: true })).toBeVisible();
  await expect(body.getByText(/Prize money and starting seeds are not ranking points/)).toBeVisible();
  const saved = await readCareerSave(page);
  expect(saved.tourBriefing).toMatchObject({ tour: 'youth', sequence: 1 });
  expect(saved.inbox.filter(m => m.id.startsWith('tour-briefing:'))).toHaveLength(1);
  expect(saved.player.cash).toBe(state.player.cash);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.screenshot({ path: `artifacts/career-v012/tour-briefing-${width}.png`, fullPage: true });
  await page.getByRole('button', { name: 'View tour calendar', exact: true }).click();
  await expect(page).toHaveURL(/calendar/);
  await page.reload(); await page.getByRole('button', { name: /Continue Career/ }).click();
  const reloaded = await readCareerSave(page);
  expect(reloaded.tourBriefing).toEqual(saved.tourBriefing);
  expect(reloaded.inbox.filter(m => m.id.startsWith('tour-briefing:'))).toHaveLength(1);
});
