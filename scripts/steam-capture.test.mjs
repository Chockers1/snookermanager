import test from 'node:test';
import assert from 'node:assert/strict';
import { captureRoutes, parseCaptureOptions } from './steam-capture-config.mjs';

test('requires an explicit export, never defaults to the live player profile', () => {
  assert.throws(() => parseCaptureOptions([]), /--save/);
  assert.throws(() => parseCaptureOptions(['--save', '--check']), /needs a value/);
});
test('allows only documented game screens and preserves a Windows path with spaces', () => {
  const save = 'C:\\My Careers\\real career.json';
  for (const [screen, route] of Object.entries(captureRoutes)) {
    assert.deepEqual(parseCaptureOptions(['--save', save, '--screen', screen, '--check']), { save, screen, route, check: true });
  }
  assert.throws(() => parseCaptureOptions(['--save', save, '--screen', 'https://example.com']), /Choose --screen/);
  assert.throws(() => parseCaptureOptions(['--save', save, '--profile', 'live']), /Unknown argument/);
});
