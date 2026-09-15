'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workerPath = path.resolve(__dirname, '..', '..', 'cloudflare-dashboard', 'src', 'worker-r2-logs.js');
const freeTierWorkerPath = path.resolve(__dirname, '..', '..', 'cloudflare-dashboard', 'src', 'worker-free-tier.js');

test('V3 release mirror endpoints are public read-only R2 routes with CORS', () => {
  const source = fs.readFileSync(workerPath, 'utf8');
  assert.match(source, /'\/v3\/src\/release-version\.js': 'releases\/v3\/src\/release-version\.js'/);
  assert.match(source, /'\/v3\/dist\/aio-v3\.js': 'releases\/v3\/dist\/aio-v3\.js'/);
  assert.match(source, /access-control-allow-origin/);
  assert.match(source, /application\/javascript/);
  assert.match(source, /request\.method === 'GET' && RELEASE_OBJECTS\[path\]/);
});

test('free-tier worker routes the two public release artifacts through direct R2 reads', () => {
  const source = fs.readFileSync(freeTierWorkerPath, 'utf8');
  assert.match(source, /PUBLIC_RELEASE_PATHS/);
  assert.match(source, /'\/v3\/src\/release-version\.js'/);
  assert.match(source, /'\/v3\/dist\/aio-v3\.js'/);
  assert.match(source, /isPublicReleaseRead/);
  assert.match(source, /directReleaseRead/);
  assert.match(source, /guardedEnv\(env, \{ directReleaseRead: releaseRead \}\)/);
});
