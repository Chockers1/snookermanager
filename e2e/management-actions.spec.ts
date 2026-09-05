import { expect, test, type Page } from '@playwright/test';
import { readCareerSave } from './read-career-save';
import { ACTIVE_SAVE_KEY } from '../src/game/saveStorage';
import { bookTravelState, createStarterState, enterTournamentState, getNextEligibleTournament } from '../src/hooks/useGameState';

async function openCareer(page: Page, route: string, state = createStarterState()) {
  await page.addInitScript(({ key, value }) => {
    if (!sessionStorage.getItem('management-fixture')) {
      localStorage.setItem(key, value);
      sessionStorage.setItem('management-fixture', '1');
    }
  }, { key: ACTIVE_SAVE_KEY, value: JSON.stringify(state) });
  await page.goto('/');
  await page.getByRole('button', { name: /Continue Career/ }).click();
  await page.evaluate((url) => {
    history.pushState({}, '', url);
    dispatchEvent(new PopStateEvent('popstate'));
  }, route);
}

test('preparation allocation is capped, forecasts respond, and confirmation persists', async ({ page }) => {
  let career = createStarterState();
  const tournament = getNextEligibleTournament(career)!;
  career = bookTravelState(enterTournamentState(career, tournament.id), tournament.id);
  await openCareer(page, '/tournament/preparation', career);
  const confirm = page.getByRole('button', { name: 'Confirm plan' });
  await expect(page.getByText('100% allocated', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Increase Potting', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Decrease Potting', exact: true }).click();
  await expect(confirm).toBeDisabled();
  await page.getByRole('button', { name: 'Increase Recovery', exact: true }).click();
  await expect(page.getByText('100% allocated', { exact: true })).toBeVisible();
  await expect(confirm).toBeEnabled();
  await page.getByRole('button', { name: /Physio session/ }).click();
  await confirm.click();
  await expect(page).toHaveURL(/\/match\/preview/);
  await expect.poll(async () => (await readCareerSave(page)).travel.bookings[tournament.id].preparation).toMatchObject({ allocations: { potting: 15, recovery: 25 }, supportIds: ['physio'] });
  await page.reload();
  await page.getByRole('button', { name: /Continue Career/ }).click();
  await page.evaluate(() => { history.pushState({}, '', '/tournament/preparation'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.getByText('100% allocated', { exact: true })).toBeVisible();
  await expect(confirm).toBeEnabled();
});

test('finance exports a report and saves budget allocations without spending cash', async ({ page }) => {
  const career = createStarterState();
  await openCareer(page, '/finance', career);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/\.csv$/);
  await page.getByRole('button', { name: 'Manage Budget' }).click();
  const dialog = page.getByRole('dialog', { name: 'Monthly Budget Manager' });
  await expect(dialog).toBeVisible();
  const input = dialog.getByRole('spinbutton').first();
  const target = Number(await input.inputValue()) + 100;
  await input.fill(String(target));
  await dialog.getByRole('button', { name: 'Save Allocation' }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('button', { name: 'Manage Budget' }).click();
  await expect(dialog.getByRole('spinbutton').first()).toHaveValue(String(target));
  const cash = (await readCareerSave(page)).player.cash;
  expect(cash).toBe(career.player.cash);
});

test('sponsor slots select their own signing destination and comparison opens', async ({ page }) => {
  const career = createStarterState();
  career.sponsors = [];
  await openCareer(page, '/sponsorship', career);
  for (const slot of ['Cue Case', 'Social Media Partner']) {
    await page.getByRole('button', { name: new RegExp(`Vacant.*${slot}`) }).click();
    await expect(page.getByRole('button', { name: `Fill ${slot}`, exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Compare Offers', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Close Comparison', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close Comparison', exact: true }).click();
  await page.getByRole('button', { name: 'Fill Social Media Partner', exact: true }).click();
  await expect.poll(async () => (await readCareerSave(page)).sponsors.map(sponsor => sponsor.slot)).toContain('Social Media Partner');
});
