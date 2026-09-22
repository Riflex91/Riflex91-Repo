import test from 'node:test';
import assert from 'node:assert/strict';
import freeTierWorker from '../src/worker-free-tier.js';
import {
  RELEASE_OBJECTS,
  handleReleaseArtifact,
  releaseContentType,
  releaseObjectKey
} from '../src/worker-r2-logs.js';

test('V5 manifest and updater have fixed public R2 release mappings', () => {
  assert.equal(
    RELEASE_OBJECTS['/v5/roadmap/v5-autonomous-test-manifest.json'],
    'releases/v5/roadmap/v5-autonomous-test-manifest.json'
  );
  assert.equal(
    RELEASE_OBJECTS['/v5/werkzeuge/v5-autonomous-test-ingame-updater.js'],
    'releases/v5/werkzeuge/v5-autonomous-test-ingame-updater.js'
  );
  assert.equal(
    releaseObjectKey('/v5/werkzeuge/pr20-6-mluck-autonomous-live-5m.js'),
    'releases/v5/werkzeuge/pr20-6-mluck-autonomous-live-5m.js'
  );
  assert.equal(releaseObjectKey('/v5/werkzeuge/../secret.js'), null);
  assert.equal(releaseObjectKey('/v5/grundlage/secret.js'), null);
});

test('V5 manifest is public CORS JSON and independent from read keys', async () => {
  const seen = [];
  const env = {
    LOG_ARCHIVE: {
      async get(key) {
        seen.push(key);
        return {
          body: '{"schemaVersion":1,"enabled":true}',
          etag: 'v5-manifest-etag'
        };
      }
    }
  };
  const path = '/v5/roadmap/v5-autonomous-test-manifest.json';
  const request = new Request('https://example.test' + path, {
    headers: { origin: 'https://adventure.land' }
  });
  const response = await handleReleaseArtifact(request, env, path);
  assert.equal(response.status, 200);
  assert.deepEqual(seen, [releaseObjectKey(path)]);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  assert.match(response.headers.get('content-type') || '', /application\/json/);
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
});

test('dynamic V5 test package is public JavaScript through top-level free-tier worker', async () => {
  const seen = [];
  const env = {
    LOG_ARCHIVE: {
      async get(key) {
        seen.push(key);
        return {
          body: "globalThis.V5PR206MluckTest={version:'1.0.0'};",
          etag: 'v5-package-etag'
        };
      }
    }
  };
  const path = '/v5/werkzeuge/pr20-6-mluck-autonomous-live-5m.js';
  const request = new Request('https://example.test' + path, {
    headers: { origin: 'https://adventure.land' }
  });
  const response = await freeTierWorker.fetch(request, env, { waitUntil() {} });
  assert.equal(response.status, 200);
  assert.deepEqual(seen, [releaseObjectKey(path)]);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  assert.match(response.headers.get('content-type') || '', /application\/javascript/);
  assert.match(await response.text(), /V5PR206MluckTest/);
});

test('release content type is deterministic by extension', () => {
  assert.equal(releaseContentType('/x.json'), 'application/json; charset=utf-8');
  assert.equal(releaseContentType('/x.js'), 'application/javascript; charset=utf-8');
});
