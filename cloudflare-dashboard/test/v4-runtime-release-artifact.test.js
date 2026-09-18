import test from 'node:test';
import assert from 'node:assert/strict';
import freeTierWorker from '../src/worker-free-tier.js';
import {
  parseV4RuntimeReleaseRead,
  isV4RuntimeReleaseRead,
  handleV4RuntimeReleaseArtifact
} from '../src/v4-runtime-release-artifact.js';

const RELEASE_SHA = '4068ad0d95de77abd8f067b33969562f3f3b5209';

test('V4 release path bindet Runtime-Datei an exakten 40-stelligen Git-SHA', () => {
  const request = new Request(`https://example.test/v4/releases/${RELEASE_SHA}/aio-v4-runtime.js`);
  const parsed = parseV4RuntimeReleaseRead(request);
  assert.equal(parsed.releaseSha, RELEASE_SHA);
  assert.equal(parsed.datei, 'aio-v4-runtime.js');
  assert.equal(parsed.objectKey, `releases/v4/${RELEASE_SHA}/aio-v4-runtime.js`);
  assert.equal(isV4RuntimeReleaseRead(request), true);

  assert.equal(isV4RuntimeReleaseRead(new Request('https://example.test/v4/releases/latest/aio-v4-runtime.js')), false);
  assert.equal(isV4RuntimeReleaseRead(new Request(`https://example.test/v4/releases/${RELEASE_SHA}/falsch.js`)), false);
  assert.equal(isV4RuntimeReleaseRead(new Request(`https://example.test/v4/releases/${RELEASE_SHA.toUpperCase()}/aio-v4-runtime.js`)), false);
});

test('V4 Runtime und SHA-256 werden public, CORS und no-store aus getrennten immutable R2-Objekten gelesen', async () => {
  const seen = [];
  const env = {
    LOG_ARCHIVE: {
      async get(key) {
        seen.push(key);
        if (key.endsWith('.sha256')) return { body: 'a'.repeat(64) + '  aio-v4-runtime.js\n', etag: 'sha-etag' };
        return { body: '/* Adventure Land AiO Bot V4 | generated | production runtime */', etag: 'runtime-etag' };
      }
    }
  };

  const runtime = await handleV4RuntimeReleaseArtifact(
    new Request(`https://example.test/v4/releases/${RELEASE_SHA}/aio-v4-runtime.js`, {
      headers: { origin: 'https://adventure.land' }
    }),
    env
  );
  assert.equal(runtime.status, 200);
  assert.equal(runtime.headers.get('access-control-allow-origin'), '*');
  assert.equal(runtime.headers.get('cache-control'), 'no-store, max-age=0');
  assert.equal(runtime.headers.get('x-aio-v4-release-sha'), RELEASE_SHA);
  assert.match(runtime.headers.get('content-type') || '', /application\/javascript/);

  const hash = await handleV4RuntimeReleaseArtifact(
    new Request(`https://example.test/v4/releases/${RELEASE_SHA}/aio-v4-runtime.sha256`),
    env
  );
  assert.equal(hash.status, 200);
  assert.match(hash.headers.get('content-type') || '', /text\/plain/);
  assert.equal(hash.headers.get('x-aio-v4-release-sha'), RELEASE_SHA);
  assert.deepEqual(seen, [
    `releases/v4/${RELEASE_SHA}/aio-v4-runtime.js`,
    `releases/v4/${RELEASE_SHA}/aio-v4-runtime.sha256`
  ]);
});

test('Top-level Worker routet V4 Release-Artefakte direkt ohne Archiv-Quota-Wrapping', async () => {
  const seen = [];
  const env = {
    LOG_ARCHIVE: {
      async get(key) {
        seen.push(key);
        return { body: 'runtime-v4', etag: 'v4-etag' };
      }
    }
  };
  const response = await freeTierWorker.fetch(
    new Request(`https://example.test/v4/releases/${RELEASE_SHA}/aio-v4-runtime.js`),
    env,
    { waitUntil() {} }
  );
  assert.equal(response.status, 200);
  assert.deepEqual(seen, [`releases/v4/${RELEASE_SHA}/aio-v4-runtime.js`]);
  assert.equal(await response.text(), 'runtime-v4');
});

test('V4 Release-Artefakt fehlt fail-safe mit CORS und Release-SHA', async () => {
  const env = { LOG_ARCHIVE: { async get() { return null; } } };
  const response = await handleV4RuntimeReleaseArtifact(
    new Request(`https://example.test/v4/releases/${RELEASE_SHA}/aio-v4-runtime.js`),
    env
  );
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  assert.equal(response.headers.get('x-aio-v4-release-sha'), RELEASE_SHA);
  const payload = await response.json();
  assert.equal(payload.error, 'v4 release artifact not published');
});
