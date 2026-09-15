import { expect, test } from '@playwright/test';
import { createNewCareerState } from '../src/hooks/useGameState';
import { ACTIVE_SAVE_KEY, encodeCareerSave } from '../src/game/saveStorage';
import { ACCESSIBILITY_KEY } from '../src/game/accessibility';
for (const [width, height, scale] of [[1920, 1080, 100], [1366, 768, 130], [1100, 768, 100], [390, 844, 100]]) {
 test(`career progression fits one screen at ${width}, ${scale}%`, async ({ page }) => {
  const state = createNewCareerState(); state.firstWeekGuide!.dismissed = true;
  await page.setViewportSize({ width, height });
  await page.addInitScript(({ key, save, accessibility, scale }) => {
   localStorage.setItem(key, save); localStorage.setItem(accessibility, JSON.stringify({ textScale: scale, reducedMotion: true }));
  }, { key: ACTIVE_SAVE_KEY, save: encodeCareerSave(state), accessibility: ACCESSIBILITY_KEY, scale });
  await page.goto('/'); await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.getByRole('heading', { name: 'Upcoming & Recent Results', exact: true })).toBeVisible();
  await page.evaluate(() => { history.pushState({}, '', '/career/progression'); dispatchEvent(new PopStateEvent('popstate')); });
  const tabs = page.getByRole('tablist', { name: 'Career progression sections' });
  for (const name of ['Overview', 'Full Pathway', 'Events', 'Career Snapshot']) {
   await tabs.getByRole('tab', { name, exact: true }).click();
   expect(await page.locator('main').evaluate(el => el.scrollHeight <= el.clientHeight + 2 && el.scrollWidth <= el.clientWidth + 2)).toBe(true);
   if (name === 'Overview') {
    if (width >= 1024) for (const body of await page.locator('.pathway-overview-body').all()) {
     expect(await body.evaluate(el => el.scrollHeight <= el.clientHeight + 2)).toBe(true);
    }
    await page.getByRole('button', {name: 'Stage details', exact: true}).click();
    await expect(page.getByRole('dialog')).toContainText('Requirements');
    await page.keyboard.press('Escape');
    await page.getByRole('button', {name: /What comes next/}).click();
    await expect(page.getByRole('dialog')).toContainText('Unlocks');
    await page.keyboard.press('Escape');
   }
   if (name === 'Events') {
    const events = page.getByTestId('pathway-events');
    await expect(events.getByRole('region', { name: 'Current stage events' })).toBeVisible();
    expect(await events.evaluate(el => el.scrollHeight <= el.clientHeight + 2 && el.scrollWidth <= el.clientWidth + 2)).toBe(true);
    for (const card of await events.locator('.pathway-event').all()) {
     expect(await card.evaluate(el => el.scrollHeight <= el.clientHeight + 2 && el.scrollWidth <= el.clientWidth + 2)).toBe(true);
     await expect(card).toHaveAttribute('href', /\/calendar\?tournament=/);
    }
   }
   if (name === 'Full Pathway') {
    const stages = page.getByRole('region', { name: 'Pathway stages' });
    await expect(stages.getByRole('button')).toHaveCount(14);
    expect(await stages.evaluate(el => el.scrollHeight <= el.clientHeight + 2 && el.scrollWidth <= el.clientWidth + 2)).toBe(true);
    const bounds = await stages.boundingBox();
    for (const card of await stages.getByRole('button').all()) {
     const box = await card.boundingBox();
     expect(box!.y).toBeGreaterThanOrEqual(bounds!.y - 1);
     expect(box!.y + box!.height).toBeLessThanOrEqual(bounds!.y + bounds!.height + 1);
     expect(await card.evaluate(el => el.scrollHeight <= el.clientHeight + 2)).toBe(true);
    }
    if (name === 'Career Snapshot' && width >= 1024) {
    for (const panel of await page.getByTestId('career-snapshot').locator('.snapshot-body').all()) {
     expect(await panel.evaluate(el => el.scrollHeight <= el.clientHeight + 2)).toBe(true);
    }
   }
   await page.screenshot({ path: `artifacts/full-pathway-all-${width}.png` });
    await stages.getByRole('button').last().click();
    await expect(page.getByRole('dialog')).toContainText('Requirements');
    await expect(page.getByRole('dialog')).toContainText('Unlocks');
    await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByLabel('Tier', { exact: true }).selectOption({ index: 1 });
    expect(await stages.getByRole('button').count()).toBeLessThan(14);
   }
   if (name === 'Career Snapshot' && width >= 1024) {
    for (const panel of await page.getByTestId('career-snapshot').locator('.snapshot-body').all()) {
     expect(await panel.evaluate(el => el.scrollHeight <= el.clientHeight + 2)).toBe(true);
    }
   }
   await page.screenshot({ path: `artifacts/career-progression-${width}-${name.replaceAll(' ', '-')}.png` });
  }
  await tabs.getByRole('tab', { name: 'Career Snapshot' }).focus(); await page.keyboard.press('Home');
  await expect(tabs.getByRole('tab', { name: 'Overview', exact: true })).toHaveAttribute('aria-selected', 'true');
  await tabs.getByRole('tab', { name: 'Events', exact: true }).click();
  const eventLink = page.getByTestId('pathway-events').locator('.pathway-event').first();
  if (await eventLink.count()) {
   const target = await eventLink.getAttribute('href');
   await eventLink.focus(); await page.keyboard.press('Enter');
   await expect(page).toHaveURL(url => url.pathname + url.search === target);
  }
 });
}
