import { expect, test } from '@playwright/test';
import { createNewCareerState, createStarterState, getNextEligibleTournament } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';

for (const width of [1366, 390]) for (const alreadyOpen of [false, true]) {
 test(`guide selects an eligible event and its tour/month at ${width}, calendar open: ${alreadyOpen}`, async ({ page }) => {
  const state = createNewCareerState({ fullName: 'Rob Taylor', nationality: 'England', age: 15, startingLevelId: 'start-club-junior', handedness: 'Right-handed', cueStyle: '', playingStyle: '', personalityArchetype: '', sliders: [], backgroundId: '' });
  state.equipment = createStarterState().equipment;
  state.firstWeekGuide!.completed = ['training', 'equipment']; state.firstWeekGuide!.minimized = false;
  const event = getNextEligibleTournament(state)!;
  expect(event.name).toBe('Summer Junior Club League');
  const month = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(new Date(event.startDate + 'T12:00:00'));
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state) });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.locator('#main-content')).toBeVisible();
  const before = await readCareerSave(page);
  const guide = page.getByRole('region', { name: 'First week guide' });
  if (alreadyOpen) {
   await guide.getByRole('button', { name: 'Minimise first-week guide' }).click();
   await page.evaluate(() => { history.pushState({}, '', '/calendar'); dispatchEvent(new PopStateEvent('popstate')); });
   await page.getByRole('button', { name: 'Previous month' }).click();
   await page.getByLabel('Tour filter', {exact:true}).selectOption('Main Tour');
   await page.getByRole('button', { name: 'Open first-week guide', exact: true }).click();
  }
  await guide.getByRole('link', { name: 'Open calendar', exact: true }).click();
  await expect(page).toHaveURL(new RegExp('tournament=' + event.id));
  await expect(page.getByLabel('Tour filter', {exact:true})).toHaveValue('Junior Pathway');
  await expect(page.getByRole('heading', { name: event.name, exact: true, level: 2 })).toBeVisible();
  await expect(page.locator('#main-content')).toContainText(month);
  await expect(page.locator('#main-content')).not.toContainText('No events match this month');
  await expect(guide).toHaveCount(0);
  const viewed = await readCareerSave(page);
  expect(viewed.currentDate).toBe(before.currentDate); expect(viewed.player.cash).toBe(before.player.cash);
  expect(viewed.tournaments.find(t => t.id === event.id)?.status).toBe(before.tournaments.find(t => t.id === event.id)?.status);
  await page.getByRole('button', { name: 'Enter Tournament', exact: true }).click();
  await expect.poll(async () => (await readCareerSave(page)).tournaments.find(t => t.id === event.id)?.status).toBe('Entered');
  await page.getByRole('button', {name:'Close tournament details',exact:true}).click();
  await page.getByRole('button', { name: 'Open first-week guide', exact: true }).click();
  await expect(guide.getByRole('heading', { name: 'Arrange travel and accommodation' })).toBeVisible();
 });
}
