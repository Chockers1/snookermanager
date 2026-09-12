import { expect, test } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';

for (const width of [1280, 390]) test(`accepted invitation offers travel immediately and after reload at ${width}`, async ({ page }) => {
  const state = createStarterState();
  state.player.cash = 100000;
  const event = state.tournaments.find(t => t.name === 'British Open')!;
  state.inbox = [{ id: 'invite-travel-test', sender: 'Tournament Office', subject: `Invitation: ${event.name}`, preview: 'Enter, then book travel.', date: 'Today', priority: 'High', read: false, actionLabel: 'Review Event', actionRoute: '/calendar', tournamentReference: { id: event.id, startDate: event.startDate } }];
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ key, save }) => {
    if (!sessionStorage.getItem('invite-travel-fixture')) { localStorage.setItem(key, save); sessionStorage.setItem('invite-travel-fixture', '1'); }
  }, { key: ACTIVE_SAVE_KEY, save: encodeCareerSave(state) });
  const openInvitation = async () => {
    await page.evaluate(() => { history.pushState({}, '', '/inbox?message=invite-travel-test'); dispatchEvent(new PopStateEvent('popstate')); });
    await page.getByLabel('Inbox messages').getByRole('button', { name: /Invitation: British Open/ }).click();
    await expect(page.getByRole('heading', { name: 'Invitation: British Open', exact: true })).toBeVisible();
  };
  await page.goto('/');
  await page.getByRole('button', { name: /Continue Career/ }).click();
  await openInvitation();
  const actions = page.getByTestId('inbox-message-actions');
  await actions.getByRole('button', { name: 'Enter Tournament', exact: true }).click();
  await expect(actions.getByRole('button', { name: 'Book Travel', exact: true })).toBeVisible();
  await expect(actions.getByRole('button', { name: 'Review Event', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Invitation: British Open', exact: true })).toBeVisible();
  const entered = await readCareerSave(page);
  expect(entered.tournaments.find(t => t.id === event.id)?.status).toBe('Entered');
  expect(entered.travel.bookings[event.id]).toBeUndefined();
  await page.reload(); await page.getByRole('button', { name: /Continue Career/ }).click();
  await openInvitation();
  await actions.getByRole('button', { name: 'Book Travel', exact: true }).click();
  await expect(page).toHaveURL(/\/travel$/);
  await expect(page.getByRole('heading', { name: 'Travel Planner', exact: true })).toBeVisible();
  await expect(page.locator('main')).toContainText('British Open');
  await page.getByRole('button', { name: 'Confirm Travel', exact: true }).click();
  await expect.poll(async () => Boolean((await readCareerSave(page)).travel.bookings[event.id])).toBe(true);
  await openInvitation();
  await expect(page.getByText('Travel booked', { exact: true })).toBeVisible();
  await expect(actions.getByRole('button', { name: 'Book Travel', exact: true })).toHaveCount(0);
});
