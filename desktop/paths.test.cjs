const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { resourcePath } = require('./paths.cjs');
const root = path.resolve('test resources');
test('serves local assets and deep links under the packaged root', () => {
  assert.equal(resourcePath(root, 'scm://game/assets/app.js'), path.join(root, 'assets/app.js'));
  assert.equal(resourcePath(root, 'scm://game/players/Rob%20Taylor'), path.join(root, 'players/Rob Taylor'));
});
test('rejects foreign origins and escaped filesystem paths', () => {
  for (const url of ['https://game/', 'file:///etc/passwd', 'scm://evil/', 'scm://user@game/', 'scm://game/%2e%2e%2fsecret', 'scm://game/%5csecret', 'scm://game/%00']) assert.equal(resourcePath(root, url), null);
});
