import { readCareerSave } from './read-career-save';
import { plusDays } from '../src/game/careerDepth/shared';
import { expect, test } from '@playwright/test';
import { createNewCareerState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { ACCESSIBILITY_KEY } from '../src/game/accessibility';
for (const [width, height, scale] of [[1920, 1080, 100], [1366, 768, 130], [1100, 768, 100], [390, 844, 100]]) {
 test(`staff stays within the page at ${width}, ${scale}%`, async ({ page }) => {
  const state = createNewCareerState(); state.firstWeekGuide!.dismissed = true;
  // Fund the selected elite coach's renewal and full remaining-contract payout.
  if (width === 1920) { state.player.cash = 50_000; state.finance.cash = 50_000; }
  if (width === 1366 || width === 1100) state.coachContracts = state.coaches.slice(0, width === 1100 ? 2 : 1).map((coach, i) => ({
   coachId: coach.id, slot: i === 0 ? 'Lead Coach' : 'Specialist Coach', startedWeek: state.week,
   contractWeeks: 24, weeksRemaining: 24, contractLabel: 'Season Contract', weeklyCost: 32, totalCost: 768,
  }));
  await page.setViewportSize({ width, height });
  await page.addInitScript(({ key, value, accessibility, scale }) => {
   localStorage.setItem(key, value); localStorage.setItem(accessibility, JSON.stringify({ textScale: scale, reducedMotion: true }));
  }, { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state), accessibility: ACCESSIBILITY_KEY, scale });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.getByRole('heading', { name: 'Upcoming & Recent Results', exact: true })).toBeVisible();
  await page.evaluate(() => { history.pushState({}, '', '/staff/coaches'); dispatchEvent(new PopStateEvent('popstate')); });
  const fits = async () => {
   expect(await page.locator('main').evaluate(el => el.scrollHeight <= el.clientHeight + 2 && el.scrollWidth <= el.clientWidth + 2)).toBe(true);
   const box = (await page.getByTestId('staff-page').boundingBox())!;
   expect(box.y + box.height).toBeLessThanOrEqual(height);
  };
  for (const name of ['Recruitment', 'My team']) {
   await page.getByRole('tab', { name, exact: true }).click(); await fits();
   await page.screenshot({ path: `artifacts/staff-${width}-${name.replace(' ', '-')}.png` });
  }
  await page.getByRole('tab', { name: 'My team', exact: true }).click();
  await expect(page.getByTestId('staff-team').getByRole('region')).toHaveCount(2);
  if (width >= 1024) expect(await page.getByTestId('staff-team').getByRole('region').evaluateAll(cards => cards.every(card => card.scrollHeight <= card.clientHeight + 2))).toBe(true);
  await expect(page.getByRole('heading', { name: 'Lead Coach', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Specialist Coach', exact: true })).toBeVisible();
  await expect(page.getByText('Working relationships & agreed development', { exact: true })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Recruitment', exact: true }).click();
  if (width === 1920) {
   const tactical = page.getByRole('button', { name: 'View Amara Keene', exact: true });
   await expect(tactical).toContainText('Trains: Safety Play · Composure');
   await expect(tactical).toContainText('+14.59%');
   await tactical.click();
   await page.getByRole('tab', { name: 'Impact', exact: true }).click();
   await expect(page.locator('#coach-detail-panel')).toContainText('capped at 30%');
   await expect(page.locator('#coach-detail-panel')).toContainText('Safety Play');
   await expect(page.locator('#coach-detail-panel')).not.toContainText('Tactical bonus');
  }
  await page.getByRole('tab', { name: 'Contract', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Contract Options', exact: true })).toBeVisible(); await fits();
  await page.getByLabel('Search coaches').fill('Nobody matches this');
  await expect(page.getByText(/No coaches match these filters/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Contract Options', exact: true })).toHaveCount(0);
  await page.getByLabel('Search coaches').fill('');
  if (width === 1920) {
   await page.getByLabel('Sort coaches').selectOption('cost');
   await page.getByRole('button', { name: 'Hire as Lead Coach', exact: true }).click();
   await page.getByRole('tab', { name: 'My team', exact: true }).click();
   await expect(page.getByRole('button', { name: 'Review development together', exact: true })).toBeVisible();
   const card = page.getByRole('region', { name: 'Lead Coach', exact: true });
   await expect(card).toContainText('Strengths'); await expect(card).toContainText('Weaknesses'); await expect(card).toContainText('Overall');
   await expect(card.getByRole('tab')).toHaveCount(0);
   await card.getByRole('button', { name: 'Manage contract', exact: true }).click();
   const before = await readCareerSave(page);
   const current = before.coachContracts[0];
   await page.getByRole('dialog').getByLabel('Lead Coach extension length').selectOption('4 Week Clinic');
   await page.getByRole('dialog').getByRole('button', { name: 'Renew contract', exact: true }).click();
   await page.getByRole('button', { name: 'Confirm renewal', exact: true }).click();
   await expect.poll(async () => (await readCareerSave(page)).coachContracts[0].weeksRemaining).toBe(current.weeksRemaining + 4);
   const renewed = await readCareerSave(page);
   expect(renewed.coachContracts[0].endsOn).toBe(plusDays(current.endsOn ?? before.careerDepth!.seasonLife!.staff[current.coachId].end!, 28));
   expect(renewed.player.cash).toBe(before.player.cash);
   await expect(page.getByRole('tab', { name: 'My team', exact: true })).toHaveAttribute('aria-selected', 'true');
   await card.getByRole('button', { name: 'Manage contract', exact: true }).click();
   await page.getByRole('dialog').getByRole('button', { name: 'Terminate contract', exact: true }).click();
   await page.getByRole('button', { name: 'Close editor', exact: true }).click();
   expect((await readCareerSave(page)).coachContracts).toHaveLength(1);
   await card.getByRole('button', { name: 'Manage contract', exact: true }).click();
   await page.getByRole('dialog').getByRole('button', { name: 'Terminate contract', exact: true }).click();
   const payout = renewed.coachContracts[0].weeksRemaining * renewed.coachContracts[0].weeklyCost;
   await expect(page.getByRole('dialog')).toContainText('Pay the remaining contract');
   await page.getByRole('button', { name: 'Confirm termination', exact: true }).click();
   await expect(card).toContainText('No coach hired');
   await expect.poll(async () => (await readCareerSave(page)).coachContracts.length).toBe(0);
   expect((await readCareerSave(page)).player.cash).toBe(renewed.player.cash - payout);
  }
  await page.getByRole('tab', { name: 'My team', exact: true }).focus(); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Recruitment', exact: true })).toHaveAttribute('aria-selected', 'true');
 });
}
