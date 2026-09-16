import { _electron as electron, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';

const reportDir = path.resolve('artifacts/steam');
await fs.mkdir(reportDir, { recursive: true });
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'SCM packaged smoke '));
const install = path.join(temporary, 'Steam Library', 'steamapps', 'common', 'Snooker Career Manager');
const data = path.join(temporary, 'User Data');
console.log('Copying package into isolated installation: ' + install);
await fs.cp(path.resolve('dist/windows'), install, { recursive: true });
console.log('Package copied.');
async function hashes(folder, prefix = '') {
  const rows = [];
  for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name), name = prefix + entry.name;
    if (entry.isDirectory()) rows.push(...await hashes(file, name + '/'));
    else rows.push([name, createHash('sha256').update(await fs.readFile(file)).digest('hex')]);
  }
  return rows.sort((a,b) => a[0].localeCompare(b[0]));
}
const before = await hashes(install), errors = [], failedResources = [], network = [];
const environment = { ...process.env }; delete environment.ELECTRON_RUN_AS_NODE;
let app;
async function launch() {
  console.log('Launching packaged executable.');
  app = await electron.launch({ executablePath: path.join(install, 'Snooker Career Manager.exe'), args: ['--scm-data-dir=' + data], cwd: os.tmpdir(), env: environment, timeout: 60000 });
  const page = await app.firstWindow();
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => failedResources.push({ url: request.url(), error: request.failure()?.errorText }));
  page.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
  await expect(page.getByRole('heading', { name: 'Your career starts here.' })).toBeVisible({ timeout: 60000 });
  console.log('Launcher ready.');
  return page;
}
async function closeNormally() {
  console.log('Closing packaged window normally.');
  const exited = app.waitForEvent('close', { timeout: 30000 });
  await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].close(); });
  await exited;
  app = null;
}
try {
  let page = await launch();
  const native = await app.evaluate(({ app, BrowserWindow }) => {
    const webContents = BrowserWindow.getAllWindows()[0].webContents;
    webContents.openDevTools();
    return { packaged: app.isPackaged, version: app.getVersion(), userData: app.getPath('userData'), devTools: webContents.isDevToolsOpened() };
  });
  expect(native.packaged).toBe(true); expect(native.userData).toBe(data); expect(native.devTools).toBe(false);
  // Create via real UI; repeat launch proves IndexedDB is durable on the local scheme.
  await page.getByRole('button', { name: /Demo Career/ }).click();
  await expect(page.getByRole('heading', { name: 'Upcoming & Recent Results', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Career and save options' }).click();
  await expect(page.getByRole('button', { name: 'Return to Main Menu', exact: true })).toBeEnabled({ timeout: 30000 });
  await page.getByRole('button', { name: 'Return to Main Menu', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your career starts here.' })).toBeVisible();
  await closeNormally();
  page = await launch();
  await page.getByRole('button', { name: /Continue Career/ }).click();
  await expect(page.getByRole('heading', { name: 'Upcoming & Recent Results', exact: true })).toBeVisible();
  for (const [route, heading] of [['/training', 'Build This Week'], ['/rankings', 'Rankings'], ['/saves', 'Save Manager']]) {
    await page.evaluate(route => { history.pushState({}, '', route); dispatchEvent(new PopStateEvent('popstate')); }, route);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await expect(page.locator('main')).not.toContainText('Loading table view...');
    await expect(page.locator('main')).not.toContainText('The table view failed to load');
  }
  await page.getByRole('tab', { name: 'Import & export', exact: true }).click();
  const exportPath = path.join(temporary, 'portable-career.json');
  await app.evaluate(({ session }, exportPath) => {
    globalThis.__smokeDownload = 'waiting';
    session.defaultSession.once('will-download', (_event, item) => {
      item.setSavePath(exportPath);
      item.once('done', (_event, status) => { globalThis.__smokeDownload = status; });
    });
  }, exportPath);
  await page.getByRole('button', { name: 'Export Career', exact: true }).click();
  await expect.poll(() => app.evaluate(() => globalThis.__smokeDownload), { timeout: 30000 }).toBe('completed');
  const original = JSON.parse(await fs.readFile(exportPath, 'utf8'));
  expect(original.player.fullName).toBeTruthy();
  await page.getByLabel('Import career file').setInputFiles(exportPath);
  await expect(page.getByText('Imported as a separate career and made it active.', { exact: false })).toBeVisible();
  let legacy = null;
  if (process.env.SCM_LEGACY_SAVE) {
    console.log('Checking legacy portable save import and restart.');
    const legacyFile = path.resolve(process.env.SCM_LEGACY_SAVE);
    const legacySave = JSON.parse(await fs.readFile(legacyFile, 'utf8'));
    await page.getByRole('tab', { name: 'Import & export', exact: true }).click();
    await page.getByLabel('Import career file').setInputFiles(legacyFile);
    await expect(page.locator('main')).toContainText(legacySave.season, { timeout: 120000 });
    await expect(page.getByText('Imported as a separate career and made it active.', { exact: false })).toBeVisible({ timeout: 120000 });
    const review = page.getByRole('button', { name: 'Close review', exact: true });
    if (await review.isVisible()) await review.click();
    await page.getByRole('button', { name: 'Career and save options' }).click();
    await expect(page.getByRole('button', { name: 'Return to Main Menu', exact: true })).toBeEnabled({ timeout: 120000 });
    await page.getByRole('button', { name: 'Return to Main Menu', exact: true }).click();
    await expect(page.getByRole('button', { name: /Continue Career/ })).toBeEnabled();
    await closeNormally();
    page = await launch();
    await expect(page.getByRole('button', { name: /Continue Career/ })).toBeEnabled();
    await page.getByRole('button', { name: /Continue Career/ }).click();
    await expect(page.getByTitle(legacySave.player.fullName, { exact: true })).toBeVisible({ timeout: 120000 });
    await expect(page.getByRole('heading', { name: legacySave.seasonReview?.pending ? 'Season Review' : 'Upcoming & Recent Results', exact: true })).toBeVisible({ timeout: 120000 });
    legacy = { schemaVersion: legacySave.schemaVersion, season: legacySave.season, importedAndReopened: true };
    console.log('Legacy career reopened: ' + legacySave.season);
  }
  // Do not ask Chromium to reload while the save-protection handler is active.
  const pendingReview = page.getByRole('button', { name: 'Close review', exact: true });
  if (await pendingReview.isVisible()) await pendingReview.click();
  await page.getByRole('button', { name: 'Career and save options' }).click();
  await expect(page.getByRole('button', { name: 'Return to Main Menu', exact: true })).toBeEnabled({ timeout: 120000 });
  await page.getByRole('button', { name: 'Return to Main Menu', exact: true }).click();
  await page.goto('scm://game/training');
  await expect(page.getByRole('heading', { name: 'Your career starts here.' })).toBeVisible();
  await page.goto('scm://game/settings');
  await expect(page.getByText('Version ' + native.version, { exact: false })).toBeVisible();
  expect(await page.locator('img').evaluateAll(images => images.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src))).toEqual([]);
  await page.screenshot({ path: path.join(reportDir, 'packaged-settings.png') });
  expect(errors).toEqual([]); expect(failedResources).toEqual([]); expect(network).toEqual([]);
  await closeNormally();
  expect(await hashes(install)).toEqual(before);
  await fs.writeFile(path.join(reportDir, 'packaged-smoke.json'), JSON.stringify({ passed: true, native, install, data, legacy, checks: ['relocated path with spaces', 'packaged EXE', 'no HTTP requests/dev server', 'durable save and reopen', 'portable save export/import', 'deep link loading', 'version in settings', 'images loaded', 'normal window close', 'no install-directory changes'], errors, failedResources, network }, null, 2));
  console.log('Packaged smoke passed; report in artifacts/steam/packaged-smoke.json');
} catch (error) {
  if (app) await app.windows()[0]?.screenshot({ path: path.join(reportDir, 'packaged-failure.png') }).catch(() => {});
  await fs.writeFile(path.join(reportDir, 'packaged-smoke.json'), JSON.stringify({ passed: false, error: error.message, errors, failedResources, network, install, data }, null, 2));
  throw error;
} finally {
  // Only failure cleanup reaches this branch. Never hang CI behind an unload
  // confirmation in this disposable test profile; successful closes use the UI.
  if (app) app.process().kill();
  // Retain isolated smoke folder for diagnosis; never remove a user's save folder.
}
