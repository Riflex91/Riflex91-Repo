'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflowPath = path.resolve(__dirname, '..', '..', '.github', 'workflows', 'deploy-cloudflare.yml');

test('Cloudflare deploy publishes the V3 bundle before advancing the release version pointer', () => {
  const source = fs.readFileSync(workflowPath, 'utf8');
  assert.match(source, /v3\/src\/release-version\.js/);
  assert.match(source, /v3\/dist\/aio-v3\.js/);
  const bundlePut = source.indexOf('r2 object put aio-v3-logs/releases/v3/dist/aio-v3.js');
  const versionPut = source.indexOf('r2 object put aio-v3-logs/releases/v3/src/release-version.js');
  assert.ok(bundlePut >= 0, 'bundle R2 publication must exist');
  assert.ok(versionPut > bundlePut, 'release-version pointer must be published after the bundle');
  assert.match(source, /r2 object get aio-v3-logs\/releases\/v3\/dist\/aio-v3\.js/);
  assert.match(source, /cmp \.\.\/v3\/dist\/aio-v3\.js \/tmp\/aio-v3\.js/);
});
