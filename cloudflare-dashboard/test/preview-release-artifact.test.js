import test from 'node:test';
import assert from 'node:assert/strict';
import freeTierWorker from '../src/worker-free-tier.js';
import {
  PREVIEW_RELEASE_PREFIX,
  PRODUCTION_RELEASE_PREFIX,
  previewReleaseSha,
  releaseObjectKey,
  releaseScope
} from '../src/release-artifact-scope.js';
import { isPreviewReleaseRead } from '../src/preview-release-artifact.js';

const SHA = '0123456789abcdef0123456789abcdef01234567';

test('release artifact scope defaults to production and requires a full hexadecimal preview SHA', () => {
  assert.equal(previewReleaseSha({}), null);
  assert.equal(previewReleaseSha({ PREVIEW_RELEASE_SHA: 'abc123' }), null);
  assert.deepEqual(releaseScope({}), {
    kind: 'production',
    sha: null,
    prefix: PRODUCTION_RELEASE_PREFIX
  });
  assert.equal(releaseObjectKey('dist/aio-v3-runtime.js', {}), 'releases/v3/dist/aio-v3-runtime.js');
});

test('preview scope maps every v3 release artifact into a SHA-isolated R2 prefix', () => {
  const env = { PREVIEW_RELEASE_SHA: SHA.toUpperCase() };
  assert.equal(previewReleaseSha(env), SHA);
  assert.deepEqual(releaseScope(env), {
    kind: 'preview',
    sha: SHA,
    prefix: `${PREVIEW_RELEASE_PREFIX}/${SHA}`
  });
  assert.equal(releaseObjectKey('src/release-version.js', env), `previews/v3/${SHA}/src/release-version.js`);
  assert.equal(releaseObjectKey('dist/aio-v3.js', env), `previews/v3/${SHA}/dist/aio-v3.js`);
  assert.equal(releaseObjectKey('dist/aio-v3-runtime.js', env), `previews/v3/${SHA}/dist/aio-v3-runtime.js`);
  assert.throws(() => releaseObjectKey('../secret', env), /UNSUPPORTED_RELEASE_ARTIFACT/);
});

test('preview worker serves bootstrap, runtime and version exclusively from the pinned SHA prefix', async () => {
  const seen = [];
  const env = {
    PREVIEW_RELEASE_SHA: SHA,
    LOG_ARCHIVE: {
      async get(key) {
        seen.push(key);
        return { body: `artifact:${key}`, etag: `etag-${seen.length}` };
      }
    }
  };
  const ctx = { waitUntil() {} };
  for (const path of ['/v3/src/release-version.js', '/v3/dist/aio-v3.js', '/v3/dist/aio-v3-runtime.js']) {
    const request = new Request(`https://preview.example${path}`, { headers: { origin: 'https://adventure.land' } });
    assert.equal(isPreviewReleaseRead(request, env), true);
    const response = await freeTierWorker.fetch(request, env, ctx);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-aio-release-scope'), 'preview');
    assert.equal(response.headers.get('x-aio-preview-sha'), SHA);
    assert.equal(response.headers.get('access-control-allow-origin'), '*');
    assert.match(await response.text(), new RegExp(`^artifact:previews/v3/${SHA}/`));
  }
  assert.deepEqual(seen, [
    `previews/v3/${SHA}/src/release-version.js`,
    `previews/v3/${SHA}/dist/aio-v3.js`,
    `previews/v3/${SHA}/dist/aio-v3-runtime.js`
  ]);
});

test('invalid preview SHA cannot activate preview routing', () => {
  const request = new Request('https://preview.example/v3/dist/aio-v3-runtime.js');
  assert.equal(isPreviewReleaseRead(request, { PREVIEW_RELEASE_SHA: 'not-a-sha' }), false);
});
