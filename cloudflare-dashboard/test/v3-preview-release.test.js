import test from 'node:test';
import assert from 'node:assert/strict';
import { previewObject, handlePreviewRelease } from '../src/worker-preview-release.js';

const SHA = '0ea078ad303972156975360c3ba39168181024a0';

function envWithBody(body = 'runtime-code') {
  const seen = [];
  return {
    seen,
    env: {
      LOG_ARCHIVE: {
        async get(key) {
          seen.push(key);
          return {
            body,
            etag: 'preview-etag',
            writeHttpMetadata() {}
          };
        }
      }
    }
  };
}

test('previewObject maps SHA-scoped runtime and bootstrap paths to preview-only R2 keys', () => {
  assert.deepEqual(previewObject(`/v3-preview/${SHA}/dist/aio-v3-runtime.js`), {
    sourceSha: SHA,
    key: `previews/v3/${SHA}/dist/aio-v3-runtime.js`,
    contentType: 'application/javascript; charset=utf-8'
  });
  assert.deepEqual(previewObject(`/v3-preview/${SHA}/dist/aio-v3.js`), {
    sourceSha: SHA,
    key: `previews/v3/${SHA}/dist/aio-v3.js`,
    contentType: 'application/javascript; charset=utf-8'
  });
  assert.equal(previewObject('/v3/dist/aio-v3-runtime.js'), null);
  assert.equal(previewObject('/v3-preview/not-a-sha/dist/aio-v3-runtime.js'), null);
});

test('preview worker serves only SHA-scoped preview artifacts with no-store CORS headers', async () => {
  const fixture = envWithBody('exact-preview-runtime');
  const response = await handlePreviewRelease(
    new Request(`https://preview.example/v3-preview/${SHA}/dist/aio-v3-runtime.js`),
    fixture.env
  );
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'exact-preview-runtime');
  assert.deepEqual(fixture.seen, [`previews/v3/${SHA}/dist/aio-v3-runtime.js`]);
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
  assert.equal(response.headers.get('x-aio-preview-source-sha'), SHA);
});

test('preview worker cannot read production release paths', async () => {
  const fixture = envWithBody('must-not-be-read');
  const response = await handlePreviewRelease(
    new Request('https://preview.example/v3/dist/aio-v3-runtime.js'),
    fixture.env
  );
  assert.equal(response.status, 404);
  assert.deepEqual(fixture.seen, []);
});
