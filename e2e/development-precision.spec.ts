import { expect, test } from '@playwright/test';
import { createStarterState, getNextEligibleTournament, enterTournamentState, bookTravelState } from '../src/hooks/useGameState';
import { startProject } from '../src/game/careerDepth/developmentProjects';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';

for (const width of [1366, 390]) test(`development decimals are display-only at ${width}`, async ({ page }) => {
  let state = createStarterState();
  const event = getNextEligibleTournament(state)!;
  state = bookTravelState(enterTournamentState(state, event.id), event.id);
  expect(state.travel.bookings[event.id]).toBeTruthy();
  const before = 77.11171428571429, consistency = 80.06352380952382;
  state.attributes.technical['Long Potting'] = before;
  state.attributes.technical.Consistency = consistency;
  if (state.firstWeekGuide) state.firstWeekGuide.dismissed = true;
  state = startProject(state, 'long-pot');
  state.attributes.technical['Long Potting'] += 0.23;
  state.attributes.technical.Consistency -= 0.03;
  state.careerDepth!.projectHistory.push({ ...state.careerDepth!.project!, id: 'previous-project', status: 'completed', completedWeeks: 4,
    closingAttributes: { 'Long Potting': before + 0.23, Consistency: consistency - 0.03 } });
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ key, value }) => {
    if (!sessionStorage.getItem('development-precision')) { localStorage.setItem(key, value); sessionStorage.setItem('development-precision', '1'); }
  }, { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state) });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.getByRole('heading', { name: 'Upcoming & Recent Results', exact: true })).toBeVisible();
  const route = async (path: string) => page.evaluate(path => { history.pushState({}, '', path); dispatchEvent(new PopStateEvent('popstate')); }, path);
  await route('/training'); await page.getByRole('button', { name: /Development & practice/ }).click();
  const editor = page.getByRole('dialog', { name: 'Development project & practice partner' });
  await expect(editor).toContainText('77.11 → 77.34 (+0.23)'); await expect(editor).toContainText('80.06 → 80.03 (-0.03)');
  expect(await editor.innerText()).not.toMatch(/\d+\.\d{3,}/);
  expect(await editor.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await editor.getByRole('button', { name: 'Close editor' }).click();
  const saved = await readCareerSave(page);
  expect(saved.careerDepth!.project!.baseline['Long Potting']).toBe(before);
  expect(saved.attributes.technical['Long Potting']).toBe(before + 0.23);
  await route('/season-review'); await page.getByRole('button', { name: /Career history ·/ }).click();
  const history = page.getByRole('dialog', { name: 'Career story and development history' });
  await expect(history).toContainText('Long Potting: 77.11 → 77.34');
  await expect(history).toContainText('Consistency: 80.06 → 80.03');
  expect(await history.innerText()).not.toMatch(/\d+\.\d{3,}/);
  await history.getByRole('button', { name: 'Close editor' }).click();
  await route('/tournament/preparation');
  await expect(page.getByText(/77\.11|77\.34/).first()).toBeVisible();
  expect(await page.locator('main').innerText()).not.toMatch(/\d+\.\d{3,}/);
});
