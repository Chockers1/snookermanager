import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// Logical viewports and pixel density are separate: this emulates the browser
// content area, not Windows' native display-settings UI or browser chrome zoom.
export default defineConfig({
  ...base,
  testMatch: /screen-matrix\.spec\.ts/,
  timeout: 180_000,
  projects: [
    { name: '1440p', use: { browserName: 'chromium', viewport: { width: 2560, height: 1440 } } },
    { name: '4k', use: { browserName: 'chromium', viewport: { width: 3840, height: 2160 } } },
    { name: '4k-200-percent-density', use: { browserName: 'chromium', viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 } },
    { name: '1080p-150-percent-density', use: { browserName: 'chromium', viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 } },
    { name: 'firefox-laptop', use: { browserName: 'firefox', viewport: { width: 1366, height: 768 } } },
    { name: 'edge-laptop', use: { browserName: 'chromium', channel: 'msedge', viewport: { width: 1366, height: 768 } } },
  ],
});
