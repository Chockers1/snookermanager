// Development CLI only. Not imported by the app or included in the desktop allowlist.
import { _electron as electron, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { parseCaptureOptions } from './steam-capture-config.mjs';

const options = parseCaptureOptions(process.argv.slice(2));
const source = path.resolve(options.save);
const original = await fs.readFile(source);
const save = JSON.parse(original.toString('utf8'));
if (!save.player?.fullName || !save.season) throw new Error('Use a portable career export from Save Manager.');
if (options.screen === 'match' && (!save.liveMatch || save.liveMatch.status === 'Completed')) throw new Error('The match shot needs an exported career with a real match in progress. No match will be invented.');
const digest = data => createHash('sha256').update(data).digest('hex');
const executable = path.resolve('dist/windows/Snooker Career Manager.exe');
await fs.access(executable);
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'SCM capture '));
const environment = { ...process.env }; delete environment.ELECTRON_RUN_AS_NODE;
let app;
try {
  app = await electron.launch({ executablePath: executable, args: ['--scm-data-dir=' + profile], cwd: os.tmpdir(), env: environment, timeout: 60000 });
  const page = await app.firstWindow();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await app.evaluate(({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows()[0];
    window.unmaximize(); window.setContentSize(1920, 1080);
  });
  await expect(page.getByRole('heading', { name: 'Your career starts here.' })).toBeVisible({ timeout: 60000 });
  await page.locator('input[type="file"]').setInputFiles(source);
  await expect(page.getByTitle(save.player.fullName, { exact: true })).toBeVisible({ timeout: 120000 });
  const review = page.getByRole('button', { name: 'Close review', exact: true });
  if (await review.isVisible()) await review.click();
  await page.evaluate(route => { history.pushState({}, '', route); dispatchEvent(new PopStateEvent('popstate')); }, options.route);
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('main')).not.toContainText('Loading table view...', { timeout: 60000 });
  await expect(page.locator('main')).not.toContainText('The table view failed to load');
  const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scale: devicePixelRatio, route: location.pathname }));
  const needsSeasonReview = viewport.route === '/season-review' && save.seasonReview?.pending;
  if (viewport.route !== options.route && !needsSeasonReview) throw new Error(`Game redirected to ${viewport.route}; use a save eligible for ${options.route}.`);
  if (needsSeasonReview) console.warn('This export is awaiting season rollover. The genuine season review remains open. Resolve it manually in this copy or use a mid-season export; no progression gate was bypassed.');
  expect(errors).toEqual([]);
  expect(digest(await fs.readFile(source))).toBe(digest(original));
  const report = { version: await app.evaluate(({ app }) => app.getVersion()), screen: options.screen, requestedScreenReady: viewport.route === options.route, sourceSha256: digest(original), isolatedProfile: profile, viewport, errors, sourceUnchanged: true, automaticImagesCreated: false };
  await fs.mkdir('artifacts/steam-pass2', { recursive: true });
  await fs.writeFile('artifacts/steam-pass2/capture-session.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.log('Independent capture copy ready. No time advanced, results invented, or screenshots captured.');
  console.log('Use normal UI in this copy. Capture only a genuine populated screen; check dimensions and close dialogs first.');
  if (viewport.width !== 1920 || viewport.height !== 1080) console.warn('Display constrained the requested size. Select a suitable display before final capture.');
  if (options.check) {
    await page.getByRole('button', { name: 'Career and save options' }).click();
    await expect(page.getByRole('button', { name: 'Return to Main Menu', exact: true })).toBeEnabled({ timeout: 120000 });
    await page.getByRole('button', { name: 'Return to Main Menu', exact: true }).click();
    const closed = app.waitForEvent('close', { timeout: 30000 });
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].close());
    await closed;
  } else await app.waitForEvent('close', { timeout: 0 });
  app = null;
} finally {
  if (app) {
    // Electron launch may use a wrapper process on Windows. Exit the owned app
    // itself so a failed import cannot leave its EXE locked during rebuilding.
    await app.evaluate(({ app }) => app.exit(1)).catch(() => app.process().kill());
  }
  if (digest(await fs.readFile(source)) !== digest(original)) {
    console.error('Source export changed during the session.');
    process.exitCode = 1;
  }
  console.log('Capture profile retained for inspection: ' + profile);
}
