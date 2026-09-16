import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { listPackage, extractFile, statFile } from '@electron/asar';

const root = path.resolve('dist/windows');
const reportFolder = path.resolve('artifacts/steam');
await fs.mkdir(reportFolder, { recursive: true });
export const secretPatterns = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['github-token', /\b(?:ghp_|github_pat_)[A-Za-z0-9_]{30,}/],
  ['aws-access-key', /\bAKIA[A-Z0-9]{16}\b/],
  ['google-api-key', /\bAIza[0-9A-Za-z_-]{30,}/],
  ['service-account', /"type"\s*:\s*"service_account"/],
];
const forbidden = /(^|[/\\])(?:\.env(?:\..*)?|\.git|\.github|\.codex|node_modules|test-results|playwright-report|coverage|screenshots|test-support|tests?|e2e|artifacts)([/\\]|$)|\.(?:map|pdb|pem|key|log|db|sqlite|ps1|ts|tsx)$/i;
const findings = [], inventory = [];
async function inspect(name, buffer) {
  if (forbidden.test(name)) findings.push({ file: name, type: 'forbidden release file' });
  for (const [type, pattern] of secretPatterns) if (pattern.test(buffer.toString('utf8'))) findings.push({ file: name, type });
  inventory.push({ file: name, bytes: buffer.length, sha256: createHash('sha256').update(buffer).digest('hex') });
}
async function walk(folder) {
  for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) await walk(file);
    else await inspect(path.relative(root, file).replaceAll('\\', '/'), await fs.readFile(file));
  }
}
await fs.access(path.join(root, 'Snooker Career Manager.exe'));
await walk(root);
const asar = path.join(root, 'resources/app.asar');
for (const entry of listPackage(asar)) {
  const name = entry.replaceAll('\\', '/').replace(/^\//, '');
  const archivePath = path.normalize(name);
  if (statFile(asar, archivePath).files) continue;
  if (!['package.json', 'main.cjs', 'paths.cjs'].includes(name) && !name.startsWith('web/')) findings.push({ file: name, type: 'unexpected app payload' });
  await inspect('app.asar/' + name, extractFile(asar, archivePath));
}
const report = { at: new Date().toISOString(), root, physicalBytes: inventory.filter(row => !row.file.startsWith('app.asar/')).reduce((n, row) => n + row.bytes, 0), files: inventory, findings, scope: 'Filename denylist, staged payload allowlist and known credential-pattern scan; not a guarantee against unknown secret formats.' };
await fs.writeFile(path.join(reportFolder, 'package-inventory.json'), JSON.stringify(report, null, 2));
if (findings.length) { console.error(JSON.stringify(findings)); process.exitCode = 1; }
else console.log(`Package inventory passed: ${inventory.length} physical and archived file entries; no prohibited files or recognised credential patterns.`);
