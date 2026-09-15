import test from 'node:test';
import assert from 'node:assert/strict';
import { RELEASE_OBJECTS, handleReleaseArtifact } from '../src/worker-r2-logs.js';

test('public v3 release mirror serves the exact R2 artifact without a read key', async () => {
  const seen = [];
  const env = {
    LOG_ARCHIVE: {
      async get(key) {
        seen.push(key);
        return {
          body: "'use strict';\nconst RELEASE_VERSION = '3.0.0-alpha.test';\n",
          etag: 'release-etag'
        };
      }
    }
  };
  const request = new Request('https://example.test/v3/src/release-version.js', {
    headers: { origin: 'https://adventure.land' }
  });
  const response = await handleReleaseArtifact(request, env, '/v3/src/release-version.js');

  assert.equal(response.status, 200);
  assert.deepEqual(seen, [RELEASE_OBJECTS['/v3/src/release-version.js']]);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  assert.match(response.headers.get('content-type') || '', /application\/javascript/);
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
  assert.match(await response.text(), /RELEASE_VERSION/);
});

test('release mirror fails closed when an artifact has not been published', async () => {
  const env = { LOG_ARCHIVE: { async get() { return null; } } };
  const request = new Request('https://example.test/v3/dist/aio-v3.js');
  const response = await handleReleaseArtifact(request, env, '/v3/dist/aio-v3.js');

  assert.equal(response.status, 404);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  const payload = await response.json();
  assert.equal(payload.error, 'release artifact not published');
});
