import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { betweenMatchFixture } from '../test-support/betweenMatchFixture';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { ACCESSIBILITY_KEY } from '../src/game/accessibility';
import { readCareerSave } from './read-career-save';

test.describe.configure({ mode: 'parallel' });
const careerFixture = betweenMatchFixture().state;

const groups = {
  career: ['/', '/player/attributes', '/career/progression', '/career/stats', '/career/rivalries'],
  preparation: ['/training', '/staff/coaches', '/equipment/cues', '/equipment/chalk-tips', '/equipment/cases', '/equipment/maintenance', '/equipment/table-setup'],
  competition: ['/calendar', '/tournaments/hub', '/tournaments/draw', '/match/preview', '/rankings', '/travel'],
  support: ['/finance', '/sponsorship', '/sponsorship/contract', '/mental', '/health'],
  records: ['/inbox', '/season-review', '/settings', '/saves', '/match/result', '/players/' + encodeURIComponent(careerFixture.worldPlayers[0].playerName)],
};

async function navigate(page: Page, route: string) {
  await page.evaluate(route => { history.pushState({}, '', route); dispatchEvent(new PopStateEvent('popstate')); }, route);
  await expect(page).toHaveURL(url => url.pathname === route);
  const roots: Record<string, string> = {
    '/player/attributes': 'attributes-page', '/career/progression': 'career-progression-page',
    '/career/stats': 'legacy-stats-page', '/career/rivalries': 'rivalries-page', '/training': 'training-planner',
    '/staff/coaches': 'staff-page', '/finance': 'finance-page', '/calendar': 'calendar-page',
    '/tournaments/hub': 'tournament-hub-viewport', '/match/preview': 'match-preview-viewport',
    '/rankings': 'rankings-page', '/travel': 'travel-planner-viewport', '/sponsorship': 'sponsorship-page',
    '/sponsorship/contract': 'sponsor-contract-page', '/mental': 'mental-viewport', '/health': 'health-viewport',
    '/season-review': 'season-review-viewport', '/settings': 'settings-viewport', '/saves': 'save-manager-page',
  };
  const root = route.startsWith('/equipment/') ? 'equipment-page' : route.startsWith('/players/') ? 'player-profile' : roots[route];
  // React's lazy route can briefly retain the previous tab bar after the URL
  // changes. Wait for the destination itself before collecting its controls.
  if (root) await expect(page.getByTestId(root)).toBeVisible();
  else if (route === '/match/result') await expect(page.getByRole('heading', { name: 'Match Review', exact: true })).toBeVisible();
  else if (route === '/tournaments/draw') await expect(page.locator('.draw-workspace')).toBeVisible();
  else if (route === '/inbox') await expect(page.getByTestId('inbox-message-body')).toBeVisible();
  await expect(page.locator('main')).not.toContainText('Loading table view...');
  await expect(page.locator('main')).not.toContainText('The table view failed to load');
  await expect.poll(async () => (await page.locator('main').innerText()).trim().length).toBeGreaterThan(60);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

test.beforeEach(async ({ page }, info) => {
  const state = structuredClone(careerFixture);
  state.firstWeekGuide = { version: 1, dismissed: true, completed: [], skipped: [] };
  if (info.title.startsWith('staff contract')) state.coachContracts = [{ coachId: state.coaches[0].id, slot: 'Lead Coach', startedWeek: state.week, contractWeeks: 24, weeksRemaining: 24, contractLabel: 'Season Contract', weeklyCost: 100, totalCost: 2400 }];
  await page.addInitScript(({ key, save, accessibility }) => {
    if (!sessionStorage.getItem('screen-matrix-fixture')) {
      localStorage.setItem(key, save);
      localStorage.setItem(accessibility, JSON.stringify({ textScale: 130, reducedMotion: true }));
      sessionStorage.setItem('screen-matrix-fixture', '1');
    }
  }, { key: ACTIVE_SAVE_KEY, save: encodeCareerSave(state), accessibility: ACCESSIBILITY_KEY });
  await page.goto('/');
  await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.getByRole('heading', { name: 'Upcoming & Recent Results', exact: true })).toBeVisible();
});

test('live match controls and reload', async ({ page }, info) => {
  await navigate(page, '/match/preview');
  await page.getByRole('button', { name: 'Start Match', exact: true }).click();
  await expect(page.getByTestId('live-match-score-centre')).toBeVisible();
  await inspect(page, info, 'Live match before frame');
  for (const name of [/Auto Play/, /Sim Frame/, /Sim Match/]) await expect(page.getByRole('button', { name }).first()).toBeInViewport({ ratio: 1 });
  for (const button of await page.getByTestId('frame-tactics').getByRole('button').all()) {
    await expect(button).toBeInViewport({ ratio: 1 });
    expect(await button.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(2);
  }
  await page.getByRole('button', { name: /Sim Frame/ }).click();
  await expect.poll(async () => (await readCareerSave(page)).liveMatch?.currentFrame).toBe(2);
  await inspect(page, info, 'Live match after frame');
  await page.screenshot({ path: info.outputPath('live-match.png') });
  await page.reload();
  await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.getByRole('heading', { name: 'Upcoming & Recent Results', exact: true })).toBeVisible();
  await page.evaluate(() => { history.pushState({}, '', '/match/live'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.getByTestId('live-match-score-centre')).toBeVisible();
  expect((await readCareerSave(page)).liveMatch?.currentFrame).toBe(2);
  await inspect(page, info, 'Live match after reload');
});

test('staff contract dialogs retain visible actions', async ({ page }, info) => {
  await navigate(page, '/staff/coaches');
  await page.getByRole('tab', { name: 'My team', exact: true }).click();
  const manage = page.getByRole('region', { name: 'Lead Coach', exact: true }).getByRole('button', { name: 'Manage contract' });
  await manage.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Terminate contract', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Confirm termination', exact: true })).toBeInViewport({ ratio: 1 });
  const box = (await dialog.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await page.screenshot({ path: info.outputPath('staff-termination.png') });
  await dialog.getByRole('button', { name: 'Close editor' }).click();
  expect((await readCareerSave(page)).coachContracts).toHaveLength(1);
});

async function inspect(page: Page, info: TestInfo, state: string) {
  const measurements = await page.locator('main').evaluate(main => {
    const rect = main.getBoundingClientRect();
    return {
      width: innerWidth, height: innerHeight,
      pageOverflow: document.documentElement.scrollWidth - innerWidth,
      mainHorizontal: main.scrollWidth - main.clientWidth,
      mainVertical: main.scrollHeight - main.clientHeight,
      bottom: rect.bottom,
      brokenImages: [...document.images].filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src),
      selectedTabs: [...main.querySelectorAll('[role="tab"][aria-selected="true"]')].map(el => el.textContent),
    };
  });
  await info.attach(state, { body: JSON.stringify(measurements), contentType: 'application/json' });
  expect.soft(measurements.pageOverflow, state + ': document width').toBeLessThanOrEqual(2);
  expect.soft(measurements.mainHorizontal, state + ': main width').toBeLessThanOrEqual(2);
  // These reports deliberately retain document flow at enlarged text sizes.
  // Standard-size desktop fit is covered by their dedicated layout tests.
  const accessibleDocumentFlow = ['/match/result', '/travel', '/tournaments/draw'].some(route => state.startsWith(route));
  if (!accessibleDocumentFlow) expect.soft(measurements.mainVertical, state + ': page scrolling').toBeLessThanOrEqual(2);
  if (state.startsWith('/travel')) {
    const booking = page.getByRole('button', { name: 'Confirm Travel', exact: true });
    await booking.scrollIntoViewIfNeeded();
    await expect(booking).toBeInViewport();
    expect.soft(await page.locator('.trip-option').evaluateAll(cards => cards.every(card => card.scrollWidth <= card.clientWidth + 2 && card.scrollHeight <= card.clientHeight + 2)), 'enlarged travel cards remain readable').toBe(true);
  }
  if (state.startsWith('/tournaments/draw')) {
    const rankings = page.getByRole('button', { name: 'View Rankings', exact: true });
    await rankings.scrollIntoViewIfNeeded();
    await expect(rankings).toBeInViewport();
  }
  expect.soft(measurements.bottom, state + ': main bottom').toBeLessThanOrEqual(measurements.height + 2);
  expect.soft(measurements.brokenImages, state + ': images').toEqual([]);
}

for (const [group, routes] of Object.entries(groups)) test(`${group}: pages and nested tabs at 130% text`, async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const route of routes) {
    await navigate(page, route);
    await inspect(page, info, route);
    if (route === '/match/result') {
      await page.getByRole('heading', { name: 'Career Impact', exact: true }).scrollIntoViewIfNeeded();
      await expect(page.getByRole('heading', { name: 'Career Impact', exact: true })).toBeInViewport();
      await page.getByRole('button', { name: /Continue Tournament|View Completed Bracket/ }).first().scrollIntoViewIfNeeded();
      await expect(page.getByRole('button', { name: /Continue Tournament|View Completed Bracket/ }).first()).toBeInViewport();
    }
    if (route === '/rankings') {
      for (const circuit of await page.getByRole('navigation', { name: 'Ranking circuits' }).getByRole('button').all()) {
        await circuit.click();
        await expect(circuit).toHaveAttribute('aria-pressed', 'true');
        await inspect(page, info, route + ' / ' + await circuit.innerText());
      }
    }
    // Tab IDs plus the current visible set distinguish nested tabs from parents.
    const visited = new Set<string>();
    for (let step = 0; step < 40; step++) {
      const tabs = page.getByRole('tab').filter({ visible: true });
      const options = await tabs.evaluateAll(elements => elements.map(el => ({ name: el.textContent?.trim() ?? '', id: el.id, disabled: el.getAttribute('aria-disabled') === 'true' || (el as HTMLButtonElement).disabled })));
      const signature = options.map(o => o.id || o.name).join('|');
      const index = options.findIndex(o => !o.disabled && !visited.has(signature + ':' + (o.id || o.name)));
      if (index === -1) break;
      const choice = options[index];
      visited.add(signature + ':' + (choice.id || choice.name));
      await tabs.nth(index).click();
      await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true');
      await inspect(page, info, route + ' / ' + choice.name);
    }
    if (['/training', '/health', '/career/stats', '/rankings', '/match/preview'].includes(route)) {
      await page.screenshot({ path: info.outputPath(route.replaceAll('/', '-') + '.png') });
    }
  }
  expect(errors).toEqual([]);
});

test('training editors: base, development and form', async ({ page }, info) => {
  await navigate(page, '/training');
  for (const name of [/Development & practice/, /Form assessment/, /Training base/]) {
    const opener = page.getByRole('button', { name }).first();
    await opener.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const dimensions = await dialog.evaluate(el => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: innerWidth, height: innerHeight, overflow: el.scrollWidth - el.clientWidth };
    });
    expect(dimensions.x).toBeGreaterThanOrEqual(0); expect(dimensions.y).toBeGreaterThanOrEqual(0);
    expect(dimensions.right).toBeLessThanOrEqual(dimensions.width); expect(dimensions.bottom).toBeLessThanOrEqual(dimensions.height);
    expect(dimensions.overflow).toBeLessThanOrEqual(2);
    if (name.source === 'Training base') {
      await dialog.getByLabel('Base location', { exact: true }).selectOption('HongKong');
      const confirm = dialog.getByRole('button', { name: 'Confirm base and costs', exact: true });
      await confirm.scrollIntoViewIfNeeded(); await expect(confirm).toBeInViewport({ ratio: 1 });
    }
    await page.screenshot({ path: info.outputPath(name.source.replaceAll(' ', '-') + '.png') });
    await dialog.getByRole('button', { name: 'Close editor' }).focus();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(opener).toBeFocused();
  }
});
