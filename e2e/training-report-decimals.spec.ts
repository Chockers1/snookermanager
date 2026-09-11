import { expect, test } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';
for (const width of [1366, 390]) test('old training reports show two decimals at ' + width, async ({ page }) => {
 const state = createStarterState();
 state.attributes.mental.Focus = 66.0569333333333;
 const message = { ...state.inbox[0], id: 'training-decimals', subject: 'Fortnightly training report: Season 1 · Week 10 · 15 improved',
  preview: 'Focus +0.31893333333333374 (now 66.0569333333333). Review your development, form, ranking and workload below.',
  summary: [{ label: 'Focus', value: '+0.31893333333333374', detail: 'Now 66.0569333333333 · mental', tone: 'positive' as const }],
  actionRoute: '/training/report', actionLabel: 'View Training Report', read: false };
 state.inbox = [message];
 await page.setViewportSize({ width, height: 900 });
 await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state) });
 await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
 await expect(page.locator('#main-content')).toBeVisible();
 await page.evaluate(() => { history.pushState({}, '', '/inbox?message=training-decimals'); dispatchEvent(new PopStateEvent('popstate')); });
 const summary = page.getByRole('region', { name: 'Report summary' });
 await expect(summary).toContainText('+0.32'); await expect(summary).toContainText('Now 66.06');
 await expect(page.locator('#main-content')).not.toContainText('0.318933');
 await expect(page.locator('#main-content')).not.toContainText('66.056933');
 const save = await readCareerSave(page);
 expect(save.attributes.mental.Focus).toBe(state.attributes.mental.Focus);
 expect(save.inbox.find(m => m.id === message.id)?.preview).toBe(message.preview);
 await page.evaluate(() => { history.pushState({}, '', '/training/report'); dispatchEvent(new PopStateEvent('popstate')); });
 await expect(page.locator('#main-content')).toContainText('66.06');
 await expect(page.locator('#main-content')).not.toContainText('66.056933');
});
