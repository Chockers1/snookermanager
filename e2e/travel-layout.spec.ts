import { expect, test } from '@playwright/test';
import { bookTravelState, createStarterState, enterTournamentState, getNextEligibleTournament, getTravelPackageEstimate } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';

for (const [width, height] of [[1920,1080], [1366,768], [1280,720], [390,844]]) {
  test(`travel choices fit and book correctly at ${width}x${height}`, async ({ page }) => {
    let state = createStarterState();
    state.player.cash = 50000;
    const event = getNextEligibleTournament(state)!;
    if (width === 1280) event.location = 'Kai Tak Arena, Kowloon City';
    state = enterTournamentState(state, event.id);
    if (width === 1366) state = bookTravelState(state, event.id, 'travel-5', 'hotel-4');
    if (state.firstWeekGuide) state.firstWeekGuide.dismissed = true;
    await page.setViewportSize({width, height});
    await page.addInitScript(({key,value}) => localStorage.setItem(key,value), {key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state)});
    await page.goto('/');
    await page.getByRole('button', {name: /Continue Career/}).click();
    await expect(page.getByRole('heading', {name:'Upcoming & Recent Results',exact:true})).toBeVisible();
    await page.evaluate(() => { history.pushState({}, '', '/travel'); dispatchEvent(new PopStateEvent('popstate')); });
    const workspace = page.getByTestId('travel-planner-viewport');
    await expect(workspace.getByRole('heading', {name: 'Travel Options', exact:true})).toBeVisible();
    await expect(workspace.locator('.trip-option')).toHaveCount(12);
    await workspace.getByRole('button', {name: /(First Class Rail|Premium flexible flight).*fare/}).click();
    await expect(workspace.getByRole('button', {name: /(First Class Rail|Premium flexible flight).*fare/})).toHaveAttribute('aria-pressed','true');
    if (width >= 1280) {
      expect(await workspace.locator('.trip-summary,.trip-option,.trip-choices').evaluateAll(els => els.filter(el => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1).map(el => el.className))).toEqual([]);
    }
    await page.screenshot({path:`artifacts/travel-redesign/${width}x${height}-transport.png`,fullPage:true});
    await expect(workspace.getByRole('tablist')).toHaveCount(0);
    await expect(workspace.getByRole('heading', {name:'Hotel Options',exact:true})).toBeVisible();
    await expect(workspace.locator('.trip-option')).toHaveCount(12);
    await workspace.getByRole('button', {name: /Serviced Apartment.*night/}).focus();
    await page.keyboard.press('Enter');
    await expect(workspace.getByRole('button', {name: /Serviced Apartment.*night/})).toHaveAttribute('aria-pressed','true');
    expect(await workspace.innerText()).not.toMatch(/\d+\.\d{3,}/);
    expect(await workspace.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    if (width >= 1280) {
      expect(await page.locator('main').evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
      expect(await workspace.locator('.trip-summary,.trip-option,.trip-choices').evaluateAll(els => els.filter(el => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1).map(el => el.className))).toEqual([]);
    }
    await page.screenshot({path:`artifacts/travel-redesign/${width}x${height}-hotels.png`,fullPage:true});
    if (width === 1366) {
      await expect(workspace.getByText('Refund on update', {exact:true})).toBeVisible();
      await page.evaluate(() => { localStorage.setItem('snooker-accessibility-v1', JSON.stringify({textScale:130})); dispatchEvent(new Event('snooker-accessibility')); });
      await expect(page.locator('html')).toHaveAttribute('data-text-scale','130');
      expect(await workspace.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    }
    const estimate = getTravelPackageEstimate(state, 'travel-6', 'hotel-6', event.id);
    await workspace.getByRole('button', {name:'Confirm Travel',exact:true}).click();
    await expect.poll(async () => (await readCareerSave(page)).travel.bookings[event.id]?.hotelOptionId).toBe('hotel-6');
    const saved = await readCareerSave(page);
    expect(saved.travel.bookings[event.id].travelOptionId).toBe('travel-6');
    expect(saved.player.cash).toBeCloseTo(state.player.cash - estimate.totalCost + (state.travel.bookings[event.id]?.totalCost ?? 0),2);
    await expect(page).toHaveURL(/tournament\/preparation/);
  });
}


test('Auto Plan stays within the available booking budget', async ({ page }) => {
  let state = createStarterState();
  const event = getNextEligibleTournament(state)!;
  state = enterTournamentState(state, event.id);
  state.player.cash = 300;
  if (state.firstWeekGuide) state.firstWeekGuide.dismissed = true;
  await page.setViewportSize({width:1280,height:720});
  await page.addInitScript(({key,value}) => localStorage.setItem(key,value), {key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state)});
  await page.goto('/');
  await page.getByRole('button', {name:/Continue Career/}).click();
  await expect(page.getByRole('heading', {name:'Upcoming & Recent Results',exact:true})).toBeVisible();
  await page.evaluate(() => { history.pushState({}, '', '/travel'); dispatchEvent(new PopStateEvent('popstate')); });
  await page.getByRole('button', {name:'Auto Plan',exact:true}).click();
  await expect(page.getByRole('button', {name:'Confirm Travel',exact:true})).toBeEnabled();
  await page.getByRole('button', {name:'Confirm Travel',exact:true}).click();
  await expect.poll(async () => (await readCareerSave(page)).travel.bookings[event.id]?.totalCost).toBeLessThanOrEqual(300);
  expect((await readCareerSave(page)).player.cash).toBeGreaterThanOrEqual(0);
});


test('a started journey locks choices without clipping the booking explanation', async ({ page }) => {
  let state = createStarterState();
  const event = getNextEligibleTournament(state)!;
  state = bookTravelState(enterTournamentState(state, event.id), event.id, 'travel-6', 'hotel-6');
  const journey = state.realism!.journeys[`${event.id}:${event.startDate}`];
  state.currentDate = journey.departure;
  if (state.firstWeekGuide) state.firstWeekGuide.dismissed = true;
  await page.setViewportSize({width:1280,height:720});
  await page.addInitScript(({key,value}) => localStorage.setItem(key,value), {key:ACTIVE_SAVE_KEY,value:encodeCareerSave(state)});
  await page.goto('/');
  await page.getByRole('button', {name:/Continue Career/}).click();
  await expect(page.getByRole('heading', {name:'Upcoming & Recent Results',exact:true})).toBeVisible();
  await page.evaluate(() => { history.pushState({}, '', '/travel'); dispatchEvent(new PopStateEvent('popstate')); });
  const workspace = page.getByTestId('travel-planner-viewport');
  await expect(workspace.getByText('Journey started. Your booked package is locked.', {exact:true})).toBeVisible();
  await expect(workspace.getByRole('button', {name:'Confirm Travel',exact:true})).toBeDisabled();
  await expect(workspace.locator('.trip-option:disabled')).toHaveCount(12);
  expect(await page.locator('main').evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
  expect(await workspace.locator('.trip-summary').evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
  await workspace.getByRole('button', {name:'Preparation',exact:true}).click();
  await expect(page).toHaveURL(/tournament\/preparation/);
});
