import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { parseDocument } from 'yaml';
const workflows = {};
for (const file of await fs.readdir('.github/workflows')) {
  if (!/\.ya?ml$/.test(file)) continue;
  const doc = parseDocument(await fs.readFile('.github/workflows/' + file, 'utf8'), { uniqueKeys: true });
  assert.equal(doc.errors.length, 0, file + ': invalid YAML');
  workflows[file] = doc.toJS();
}
const qa = workflows['steam-qa.yml'];
assert.deepEqual(Object.keys(qa.on), ['workflow_dispatch']);
assert.equal(qa.on.workflow_dispatch.inputs.upload_to_qa.default, false);
assert.match(qa.jobs.build.if, /STEAM_QA_ENABLED/);
assert.equal(qa.jobs.upload.environment, 'steam-qa');
const deploy = qa.jobs.upload.steps.find(step => step.uses?.startsWith('game-ci/steam-deploy@'));
assert.match(deploy.uses, /@[a-f0-9]{40}$/);
assert.equal(deploy.with.releaseBranch, 'qa');
assert.equal(deploy.with.firstDepotIdOverride, '${{ vars.STEAM_WINDOWS_DEPOT_ID }}');
for (const job of Object.values(workflows['quality.yml'].jobs)) assert.ok(!JSON.stringify(job).includes('steam-deploy'));
const app = await fs.readFile('steam/app_build_TEMPLATE.vdf', 'utf8');
const depot = await fs.readFile('steam/depot_build_WINDOWS_TEMPLATE.vdf', 'utf8');
assert.match(app, /"AppID"\s+"<STEAM_APP_ID>"/);
assert.match(app, /"Preview"\s+"1"/);
assert.match(app, /"SetLive"\s+""/);
assert.match(app, /"<STEAM_WINDOWS_DEPOT_ID>"/);
assert.match(depot, /"DepotID"\s+"<STEAM_WINDOWS_DEPOT_ID>"/);
console.log('Workflow YAML and offline Steam safeguards passed; no Steam commands executed.');
