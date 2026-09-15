import { expect, test } from '@playwright/test';
import { victoryFixture } from '../test-support/victoryFixture';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';

for (const width of [1280, 390]) test(`player names navigate across career pages at ${width}`, async ({ page }) => {
  test.setTimeout(120000);
  const { state, match } = victoryFixture();
  state.seasonReview = null;
  const opponent = state.worldPlayers.find(p => p.playerName === match.opponentName)!;
  state.inbox.unshift({ id: 'player-links-news', sender: 'Career Manager', subject: 'Player news', preview: `${opponent.playerName} congratulated ${state.player.fullName}.`, priority: 'Medium', date: 'Today', read: false, summary: [{ label: 'Opponent', value: opponent.playerName, detail: `Next meeting with ${opponent.playerName}.` }] });
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(({ key, save }) => { if (!sessionStorage.getItem('all-player-links')) { localStorage.setItem(key, save); sessionStorage.setItem('all-player-links', '1'); } }, { key: ACTIVE_SAVE_KEY, save: encodeCareerSave(state) });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  const navigate = async (path: string) => {
    await page.evaluate(path => { history.pushState({}, '', path); dispatchEvent(new PopStateEvent('popstate')); }, path);
  };
  const profile = async (name: string) => { await expect(page.getByRole('heading', { name, exact: true })).toBeVisible(); await expect(page.getByRole('tab', { name: 'Overview', exact: true })).toHaveAttribute('aria-selected', 'true'); };
  for (const [path, heading, name] of [
    ['/player/attributes', `Player Attributes - ${state.player.fullName}`, state.player.fullName],
    ['/training/report', 'Monthly Training Report', state.player.fullName],
    ['/match/result', 'Match Review', opponent.playerName],
    ['/career/stats#trophy-cabinet', 'Career Stats & Legacy', opponent.playerName],
    ['/rankings', 'Rankings', opponent.playerName],
  ]) {
    await navigate(path);
    const celebration = page.getByRole('button', { name: 'Continue to match review', exact: true });
    if (path === '/match/result') { await expect(celebration).toBeVisible(); await celebration.click(); }
    await expect(page.getByRole('heading', { name: heading, exact: true }).first()).toBeVisible();
    const link = page.locator('main').getByRole('link', { name, exact: true }).first();
    await expect(link).toBeVisible(); await link.click(); await profile(name);
  }
  await navigate('/inbox?message=player-links-news');
  await page.getByLabel('Inbox messages').getByRole('button', { name: 'Player news', exact: true }).click();
  const mention = page.getByTestId('inbox-message-body').getByRole('link', { name: opponent.playerName, exact: true }).first();
  await expect(mention).toHaveAttribute('href', `/players/${encodeURIComponent(opponent.id)}`);
  await expect(page.locator('button a, a a')).toHaveCount(0);
  await mention.focus(); await page.keyboard.press('Enter'); await profile(opponent.playerName);
  await navigate('/inbox?message=player-links-news');
  const listMention = page.getByLabel('Inbox messages').getByRole('link', { name: opponent.playerName, exact: true }).first();
  await listMention.click(); await profile(opponent.playerName);
  expect(errors).toEqual([]);
});
