'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflowPath = path.resolve(__dirname, '..', '..', '.github', 'workflows', 'deploy-cloudflare.yml');
const autoVersionWorkflowPath = path.resolve(__dirname, '..', '..', '.github', 'workflows', 'v3-auto-version-main.yml');

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

test('automatic version bump deploys the exact release commit through the reusable Cloudflare workflow', () => {
  const deploySource = fs.readFileSync(workflowPath, 'utf8');
  const autoVersionSource = fs.readFileSync(autoVersionWorkflowPath, 'utf8');

  assert.match(deploySource, /workflow_call:/);
  assert.match(deploySource, /release_sha:/);
  assert.match(deploySource, /ref: \$\{\{ inputs\.release_sha \|\| github\.sha \}\}/);

  assert.doesNotMatch(
    deploySource,
    /push:[\s\S]*paths:[\s\S]*- "v3\/src\/release-version\.js"/,
    'direct main push deploy must not race the automatic release bump for V3 artifacts'
  );
  assert.doesNotMatch(
    deploySource,
    /push:[\s\S]*paths:[\s\S]*- "v3\/dist\/aio-v3\.js"/,
    'direct main push deploy must not publish a pre-bump V3 browser bundle'
  );

  assert.match(autoVersionSource, /outputs:[\s\S]*release_sha: \$\{\{ steps\.publish\.outputs\.release_sha \}\}/);
  assert.match(autoVersionSource, /echo "release_sha=\$\{base_sha\}" >> "\$GITHUB_OUTPUT"/);
  assert.match(autoVersionSource, /echo "release_sha=\$\{release_sha\}" >> "\$GITHUB_OUTPUT"/);
  assert.match(autoVersionSource, /deploy-release:/);
  assert.match(autoVersionSource, /needs: auto-version/);
  assert.match(autoVersionSource, /uses: \.\/\.github\/workflows\/deploy-cloudflare\.yml/);
  assert.match(autoVersionSource, /release_sha: \$\{\{ needs\.auto-version\.outputs\.release_sha \}\}/);
  assert.match(autoVersionSource, /secrets: inherit/);
});
