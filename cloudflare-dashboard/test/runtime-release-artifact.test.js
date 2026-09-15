import test from 'node:test';
import assert from 'node:assert/strict';
import freeTierWorker from '../src/worker-free-tier.js';
import {
  RUNTIME_RELEASE_OBJECT,
  RUNTIME_RELEASE_PATH,
  handleRuntimeReleaseArtifact
} from '../src/runtime-release-artifact.js';

test('runtime release artifact is public, CORS-enabled, and served from its dedicated R2 key', async () => {
  const seen = [];
  const env = {
    LOG_ARCHIVE: {
      async get(key) {
        seen.push(key);
        return {
          body: '/* Adventure Land AiO Bot runtime */',
          etag: 'runtime-etag'
        };
      }
    }
  };
  const request = new Request(`https://example.test${RUNTIME_RELEASE_PATH}`, {
    headers: { origin: 'https://adventure.land' }
  });
  const response = await handleRuntimeReleaseArtifact(request, env);

  assert.equal(response.status, 200);
  assert.deepEqual(seen, [RUNTIME_RELEASE_OBJECT]);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
  assert.match(response.headers.get('content-type') || '', /application\/javascript/);
  assert.match(await response.text(), /Adventure Land AiO Bot runtime/);
});

test('top-level free-tier worker routes the runtime path directly without archive quota wrapping', async () => {
  const seen = [];
  const env = {
    LOG_ARCHIVE: {
      async get(key) {
        seen.push(key);
        return { body: 'runtime-bundle', etag: 'runtime-etag' };
      }
    }
  };
  const request = new Request(`https://example.test${RUNTIME_RELEASE_PATH}`, {
    headers: { origin: 'https://adventure.land' }
  });
  const response = await freeTierWorker.fetch(request, env, { waitUntil() {} });

  assert.equal(response.status, 200);
  assert.deepEqual(seen, [RUNTIME_RELEASE_OBJECT]);
  assert.equal(await response.text(), 'runtime-bundle');
});

test('runtime release fails closed when the runtime artifact has not been published', async () => {
  const env = { LOG_ARCHIVE: { async get() { return null; } } };
  const request = new Request(`https://example.test${RUNTIME_RELEASE_PATH}`);
  const response = await handleRuntimeReleaseArtifact(request, env);

  assert.equal(response.status, 404);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  const payload = await response.json();
  assert.equal(payload.error, 'release runtime not published');
});
