import { test, expect } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';
for (const tired of [false, true]) test('health treatment gives clear feedback when ' + (tired ? 'tired' : 'healthy'), async ({ page }) => {
  const state = createStarterState();
  state.firstWeekGuide={version:1,dismissed:true,completed:[],skipped:[]};
  state.player.fatigue = tired ? 36 : 0;
  state.trainingCondition.strain = tired ? 22 : 0;
  state.trainingCondition.burnout = tired ? 12 : 0;
  state.trainingCondition.injuryWeeks = 0;
  state.health.activeIssue = null;
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state) });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.getByRole('heading', { name: 'Upcoming & Recent Results', exact: true })).toBeVisible();
  await page.evaluate(() => { history.pushState({}, '', '/health'); dispatchEvent(new PopStateEvent('popstate')); });
  if (!tired) {
    await expect(page.getByTestId('health-viewport')).not.toContainText('20% risk of worsening');
    await expect(page.getByText('0 / 10', { exact: true })).toBeVisible();
    await page.getByRole('tab',{name:'Treatments',exact:true}).click();
    await expect(page.getByRole('button', { name: 'No treatment needed', exact: true })).toBeDisabled();
  } else {
    await page.getByRole('tab',{name:'Treatments',exact:true}).click();
    const button = page.getByRole('button', { name: 'Apply treatment', exact: true });
    await expect(button).toBeEnabled();
    await button.click();
    await expect(page.getByRole('status')).toContainText('Treatment applied. Review on');
    const saved = await readCareerSave(page);
    expect(saved.player.fatigue).toBe(24);
    expect(saved.player.cash).toBe(state.player.cash);
    expect(saved.health.history[0].treatment).toBe('Rest');
  }
});
