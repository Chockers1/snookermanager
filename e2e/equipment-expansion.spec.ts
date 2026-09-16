import { expect, test } from '@playwright/test';
import { createStarterState } from '../src/hooks/useGameState';
import { expandedCues, expandedChalks, expandedTips, expandedCases } from '../src/data/equipmentExpansion';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { readCareerSave } from './read-career-save';

for (const width of [1280, 390]) test(`new equipment can be selected, purchased and restored at ${width}`, async ({ page }) => {
  const state = createStarterState(); state.player.cash = 100000;
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ key, save }) => {
    if (!sessionStorage.getItem('equipment-expansion-fixture')) {
      localStorage.setItem(key, save); sessionStorage.setItem('equipment-expansion-fixture', '1');
    }
  }, { key: ACTIVE_SAVE_KEY, save: encodeCareerSave(state) });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();
  const navigate = async (route: string) => {
    await page.evaluate(route => { history.pushState({}, '', route); dispatchEvent(new PopStateEvent('popstate')); }, route);
    await expect(page.getByRole('heading', { name: 'Cue Shop', exact: true })).toBeVisible();
  };
  const groups = [
    { route: '/equipment/cues', items: expandedCues, action: /^Buy Cue -/ },
    { route: '/equipment/chalk-tips#tips', items: expandedTips, action: /^Buy Tip$/ },
    { route: '/equipment/chalk-tips#chalk', items: expandedChalks, action: /^Buy chalk pack/ },
    { route: '/equipment/cases', items: expandedCases, action: /^Buy Case$/ },
  ];
  for (const group of groups) {
    await navigate(group.route);
    for (const item of group.items) await expect(page.getByRole('button').filter({ has: page.getByRole('heading', { name: item.name, exact: true }) })).toHaveCount(1);
    const selected = group.items.at(-1)!;
    await page.getByRole('button').filter({ has: page.getByRole('heading', { name: selected.name, exact: true }) }).click();
    await expect(page.getByText(selected.description!, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: group.action }).click();
    if (group.items === expandedChalks) await expect(page.getByRole('button', { name: 'Chalk equipped', exact: true })).toBeDisabled();
  }
  const saved = await readCareerSave(page);
  expect(saved.player.cash).toBe(100000 - 22000 - 180 - 150 - 10800);
  expect(saved.equipment).toMatchObject({ currentCueId: 'cue-27', currentTipId: 'tip-31', currentChalkId: 'chalk-31', currentCaseId: 'case-27' });
  expect(saved.equipment.chalkStock['chalk-31']).toBe(5);
  await page.reload(); await page.getByRole('button', { name: /Continue Career/ }).click();await expect(page.getByRole('heading',{name:'Upcoming & Recent Results',exact:true})).toBeVisible();
  await navigate('/equipment/cases');
  const restored = await readCareerSave(page);
  expect(restored.player.cash).toBe(saved.player.cash);
  expect(restored.equipment).toEqual(saved.equipment);
  expect(errors).toEqual([]);
});
