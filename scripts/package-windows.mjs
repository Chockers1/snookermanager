import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { packager } from '@electron/packager';
import { flipFuses, FuseVersion, FuseV1Options } from '@electron/fuses';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const dist = path.join(root, 'dist');
const stage = path.join(dist, 'desktop-stage');
const output = path.join(dist, 'windows');
// These fixed build-only children are the only recursively replaced directories.
for (const folder of [stage, output, path.join(dist, 'packager')]) {
  if (!folder.startsWith(dist + path.sep)) throw new Error('Unsafe output path');
  await fs.rm(folder, { recursive: true, force: true });
}
await fs.mkdir(path.join(stage, 'web'), { recursive: true });
await fs.cp(path.join(dist, 'assets'), path.join(stage, 'web/assets'), { recursive: true });
await fs.copyFile(path.join(dist, 'index.html'), path.join(stage, 'web/index.html'));
const publicFiles = ['manifest.webmanifest', 'assetts/ingame/in-game-logo.svg', 'assetts/ingame/main-menu-background-3840x2160.png', 'assetts/ingame/loading-screen-background-3840x2160.png', 'assetts/icons/favicon.svg', 'assetts/icons/favicon.ico', 'assetts/icons/apple-touch-icon-180x180.png', 'assetts/icons/web-app-icon-192x192.png', 'assetts/icons/web-app-icon-512x512.png', 'assetts/icons/windows-executable-icon.ico'];
for (const file of publicFiles) { const target = path.join(stage, 'web', file); await fs.mkdir(path.dirname(target), { recursive: true }); await fs.copyFile(path.join(root, 'public', file), target); }
for (const file of ['main.cjs', 'paths.cjs']) await fs.copyFile(path.join(root, 'desktop', file), path.join(stage, file));
await fs.writeFile(path.join(stage, 'package.json'), JSON.stringify({ name: 'snooker-career-manager', productName: 'Snooker Career Manager', version: pkg.version, main: 'main.cjs', private: true }));
const [built] = await packager({ dir: stage, out: path.join(dist, 'packager'), name: 'Snooker Career Manager', executableName: 'Snooker Career Manager', platform: 'win32', arch: 'x64', electronVersion: pkg.devDependencies.electron, appVersion: pkg.version, buildVersion: pkg.version, asar: true, prune: true, overwrite: true, icon: path.join(root, 'public/assetts/icons/windows-executable-icon.ico'), win32metadata: { CompanyName: 'Snooker Career Manager', ProductName: 'Snooker Career Manager', FileDescription: 'Snooker Career Manager', 'requested-execution-level': 'asInvoker' } });
await fs.rename(built, output);
// Retain notices for production libraries bundled into Vite's JavaScript.
// Electron's own LICENSE / LICENSES.chromium.html are retained by packager.
const lock = JSON.parse(await fs.readFile(path.join(root, 'package-lock.json'), 'utf8'));
const notices = ['Snooker Career Manager — bundled JavaScript dependency notices',
  'Electron and Chromium notices are supplied separately beside this file.'];
for (const [location, dependency] of Object.entries(lock.packages).sort(([a], [b]) => a.localeCompare(b))) {
  if (!location || dependency.dev || dependency.devOptional) continue;
  const folder = path.join(root, location);
  let names;
  try { names = await fs.readdir(folder); } catch { throw new Error('Missing runtime dependency: ' + location); }
  notices.push(`\n${location} @ ${dependency.version} (${dependency.license || 'see notice'})`);
  const licenses = names.filter(name => /^(?:licen[sc]e|copying|notice)(?:[.-]|$)/i.test(name));
  if (location === 'node_modules/victory-vendor') {
    if (dependency.version !== '37.3.6') throw new Error('Review the vendored Victory license after upgrading');
    notices.push(await fs.readFile(path.join(root, 'desktop/licenses/victory-vendor-37.3.6.txt'), 'utf8'));
    for (const vendor of await fs.readdir(path.join(folder, 'lib-vendor'))) {
      licenses.push('lib-vendor/' + vendor + '/LICENSE');
    }
  } else if (!licenses.length) throw new Error('Review missing dependency license: ' + location);
  for (const name of licenses) {
    if ((await fs.stat(path.join(folder, name))).isFile()) notices.push(await fs.readFile(path.join(folder, name), 'utf8'));
  }
}
await fs.writeFile(path.join(output, 'THIRD_PARTY_NOTICES.txt'), notices.join('\n\n'));
await flipFuses(path.join(output, 'Snooker Career Manager.exe'), { version: FuseVersion.V1, [FuseV1Options.RunAsNode]: false, [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false, [FuseV1Options.OnlyLoadAppFromAsar]: true });
await fs.rm(stage, { recursive: true, force: true });
console.log('Windows game: ' + output);
