import { expect, test } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { ensureManagementReportBaseline, settleMonthlyManagementReport } from '../src/game/monthlyManagementReport';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';

for (const width of [1280, 390]) test(`monthly management report uses the normal inbox at ${width}`, async ({ page }) => {
  let state = createStarterState();
  state = ensureManagementReportBaseline({ ...state, currentDate: '2026-05-11', inbox: [], managementReportBaseline: undefined });
  state = settleMonthlyManagementReport({ ...state, currentDate: '2026-06-01', player: { ...state.player, cash: state.player.cash + 5680.12, confidence: state.player.confidence - .7000000000000028 } });
  const baseline = state.managementReportBaseline;
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ key, save }) => {
    if (!sessionStorage.getItem('monthly-management-fixture')) { localStorage.setItem(key, save); sessionStorage.setItem('monthly-management-fixture', '1'); }
  }, { key: ACTIVE_SAVE_KEY, save: encodeCareerSave(state) });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  const inbox = async () => {
    await page.evaluate(() => { history.pushState({}, '', '/inbox'); dispatchEvent(new PopStateEvent('popstate')); });
    await page.getByLabel('Inbox messages').getByRole('button', { name: /Monthly management report/ }).click();
    await expect(page.getByRole('heading', { name: 'Monthly management report · May 2026', exact: true })).toBeVisible();
  };
  await inbox();
  await expect(page.getByText('Cash change', { exact: true })).toBeVisible();
  await expect(page.getByText('+£5,680.12', { exact: true })).toBeVisible();
  await expect(page.getByText('-0.70 over this report period', { exact: true })).toBeVisible();
  await expect(page.locator('main')).not.toContainText('Weekly cash flow');
  await page.reload(); await page.getByRole('button', { name: /Continue Career/ }).click(); await inbox();
  const saved = await readCareerSave(page);
  expect(saved.inbox.filter(message => message.subject.startsWith('Monthly management report'))).toHaveLength(1);
  expect(saved.managementReportBaseline).toEqual(baseline);
  expect(saved.player.cash).toBe(state.player.cash);
});
