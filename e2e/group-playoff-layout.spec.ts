import { test, expect } from '@playwright/test';
import { createStarterState, enterTournamentState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';

for (const width of [390, 1705]) test('group semi-final match cards fit at ' + width, async ({ page }) => {
  let state = createStarterState();
  const event = state.tournaments.find(t => t.name === 'Championship League Invitational')!;
  state = enterTournamentState(state, event.id);
  const semi = state.tournamentProgress.draw.find(r => r.label === 'Group 1 Semi Final')!;
  const players = [...new Map(state.tournamentProgress.draw[0].matches.flatMap(m => [m.top, m.bottom]).map(p => [p.name, p])).values()];
  const human = players.find(p => p.name === state.player.fullName)!;
  const opponents = players.filter(p => p.name !== state.player.fullName);
  semi.matches = [
    { id: 'layout-semi-1', top: { ...opponents[0], score: 3 }, bottom: { ...opponents[1], score: 1 } },
    { id: 'layout-semi-2', top: { ...human, score: undefined }, bottom: { ...opponents[2], score: undefined } },
  ];
  state.tournamentProgress.currentRound = semi.label;
  await page.setViewportSize({ width, height: 910 });
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: ACTIVE_SAVE_KEY, value: encodeCareerSave(state) });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  await page.evaluate(() => { history.pushState({}, '', '/tournaments/hub'); dispatchEvent(new PopStateEvent('popstate')); });
  await page.getByLabel('Group stage', { exact: true }).selectOption('Group 1 Semi Final');
  const fixtures = page.getByRole('region', { name: 'Group 1 Semi Final fixtures', exact: true });
  const first = fixtures.getByRole('article', { name: 'Group 1 Semi Final match 1', exact: true });
  const second = fixtures.getByRole('article', { name: 'Group 1 Semi Final match 2', exact: true });
  await expect(first).toContainText('Completed');
  await expect(first).toContainText('Won');
  await expect(second).toContainText('Your next match');
  await expect(second.getByRole('link', { name: state.player.fullName, exact: true })).toBeVisible();
  for (const card of [first, second]) expect(await card.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const a = (await first.boundingBox())!, b = (await second.boundingBox())!;
  if (width > 640) expect(Math.abs(a.y - b.y)).toBeLessThan(2);
  else expect(b.y).toBeGreaterThanOrEqual(a.y + a.height);
  await fixtures.screenshot({ path: 'artifacts/group-semi-final-' + width + '.png' });
  await page.getByLabel('Group stage', { exact: true }).selectOption('Group 1');
  await expect(page.getByRole('table', { name: 'Group table' })).toBeVisible();
});
