const { app, BrowserWindow, Menu, protocol, session, dialog } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { resourcePath } = require('./paths.cjs');

// Stable across versions and installation locations. Never store saves beside the EXE.
app.setName('Snooker Career Manager');
const customProfile = app.commandLine.getSwitchValue('scm-data-dir');
const relativeProfile = customProfile ? path.relative(path.dirname(process.execPath), path.resolve(customProfile)) : null;
if (customProfile && (!path.isAbsolute(customProfile) || !relativeProfile || (!relativeProfile.startsWith('..' + path.sep) && relativeProfile !== '..' && !path.isAbsolute(relativeProfile)))) throw new Error('Custom save folder must be absolute and outside the installation.');
const profile = customProfile || path.join(app.getPath('appData'), 'Snooker Career Manager');
app.setPath('userData', profile);
app.setPath('sessionData', profile);
app.setAppUserModelId('SnookerCareerManager.Desktop');
protocol.registerSchemesAsPrivileged([{ scheme: 'scm', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);

function log(kind, detail) {
  try {
    const folder = path.join(profile, 'logs');
    fs.mkdirSync(folder, { recursive: true });
    const file = path.join(folder, 'desktop.log');
    if (fs.existsSync(file) && fs.statSync(file).size > 512 * 1024) {
      const previous = path.join(folder, 'desktop.previous.log');
      fs.rmSync(previous, { force: true });
      fs.renameSync(file, previous);
    }
    fs.appendFileSync(file, JSON.stringify({ at: new Date().toISOString(), kind, detail }) + '\n');
  } catch { /* Logging must not prevent startup or saving. */ }
}
process.on('uncaughtException', error => { log('main-error', error.message.slice(0, 1000)); dialog.showErrorBox('Snooker Career Manager', 'The desktop application encountered an error. Your saves are kept in your user profile. Restart the game and check logs/desktop.log there.'); app.exit(1); });

if (!app.requestSingleInstanceLock()) app.quit();
else {
  let window;
  app.on('second-instance', () => { if (window) { if (window.isMinimized()) window.restore(); window.focus(); } });
  app.whenReady().then(async () => {
    const root = path.join(app.getAppPath(), 'web');
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
    protocol.handle('scm', async request => {
      try {
        let file = resourcePath(root, request.url);
        if (!file || !['GET', 'HEAD'].includes(request.method)) return new Response('Forbidden', { status: 403 });
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
          if (new URL(request.url).pathname.startsWith('/assets/') || new URL(request.url).pathname.startsWith('/assetts/')) return new Response('Not found', { status: 404 });
          file = path.join(root, 'index.html');
        }
        return new Response(request.method === 'HEAD' ? null : await fs.promises.readFile(file), { headers: {
          'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
          'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-src 'none'",
          'X-Content-Type-Options': 'nosniff',
        } });
      } catch { return new Response('Resource unavailable', { status: 404 }); }
    });
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] }, (_details, callback) => callback({ cancel: true }));
    Menu.setApplicationMenu(null);
    window = new BrowserWindow({ width: 1440, height: 900, minWidth: 1024, minHeight: 700, show: false, backgroundColor: '#09130f', title: 'Snooker Career Manager', icon: path.join(root, 'assetts/icons/windows-executable-icon.ico'), webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, devTools: false, spellcheck: false } });
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', (event, url) => { if (!resourcePath(root, url)) event.preventDefault(); });
    window.webContents.on('will-attach-webview', event => event.preventDefault());
    window.webContents.on('will-prevent-unload', () => {
      dialog.showMessageBoxSync(window, { type: 'info', title: 'Saving your career', message: 'Your latest progress is still saving. Please wait, then close the game again.', buttons: ['Keep playing'], defaultId: 0 });
    });
    window.webContents.on('render-process-gone', (_event, details) => { log('renderer-exit', details.reason); dialog.showErrorBox('Snooker Career Manager', 'The game window stopped responding. Restart the game to reopen the last saved career.'); });
    window.webContents.on('did-fail-load', (_event, code) => log('load-failed', code));
    window.once('ready-to-show', () => window.show());
    window.on('closed', () => { window = null; });
    log('launch', { version: app.getVersion(), electron: process.versions.electron });
    await window.loadURL('scm://game/');
  }).catch(error => { log('startup-failed', error.message); dialog.showErrorBox('Unable to start', 'Game resources could not be loaded. Verify the installation files in Steam.'); app.exit(1); });
  app.on('window-all-closed', () => app.quit());
}
