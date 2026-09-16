const path = require('node:path');

function resourcePath(root, rawUrl) {
  const url = new URL(rawUrl);
  if (url.protocol !== 'scm:' || url.host !== 'game' || url.username || url.password) return null;
  const pathname = decodeURIComponent(url.pathname);
  if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').some(part => part === '..' || part === '.')) return null;
  const target = path.resolve(root, '.' + pathname);
  return target === root || target.startsWith(root + path.sep) ? target : null;
}
module.exports = { resourcePath };
