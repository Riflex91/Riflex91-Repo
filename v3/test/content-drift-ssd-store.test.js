'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { ContentDriftSsdStore, validateKey, validateSnapshot } =
  require('../src/world/content-drift-ssd-store');

const key = 'aio-v3-content-drift-v1:My_Ranger2';
const sample = JSON.stringify({ schemaVersion: 1, savedAt: 1, records: [], catalog: {} });

function fakeHost(overrides = {}) {
  const calls = [];
  const current = { found: false, value: null, revision: 0 };
  const root = {
    AbortController,
    setTimeout,
    clearTimeout,
    async fetch(url, options) {
      calls.push({ url, options });
      if (overrides.failHttp) return { ok: false, status: 503 };
      if (options.method === 'GET') {
        return { ok: true, json: async () => ({ ok: true, ...current }) };
      }
      if (options.method === 'POST') {
        const body = JSON.parse(options.body);
        if (body.expectedRevision !== current.revision) {
          return { ok: false, status: 409 };
        }
        current.found = true;
        current.value = body.value;
        current.revision++;
        return { ok: true, json: async () => ({ ok: true, revision: current.revision }) };
      }
      throw new Error('UNEXPECTED_HTTP_VERB');
    }
  };
  return { root, calls, current };
}

test('SSD V3 drift read + CAS write + verified readback; never browser localStorage', async () => {
  const { root, calls } = fakeHost();
  Object.defineProperty(root, 'localStorage', { get() { throw new Error('BROWSER_STORAGE_ACCESSED'); } });
  const store = new ContentDriftSsdStore({ root });
  assert.deepEqual(await store.read(key), { found: false, revision: 0 });
  const ack = await store.write(key, sample, 0);
  assert.deepEqual(ack, { confirmed: true, revision: 1 });
  assert.deepEqual(await store.read(key), { found: true, value: sample, revision: 1 });
  assert.deepEqual(calls.map(x => x.options.method), ['GET','POST','GET','GET']);
  assert.equal(calls.every(x => x.url ===
    'http://127.0.0.1:17392/v1/storage?key=' + encodeURIComponent(key)), true);
  assert.equal(calls.every(x => x.options.credentials === 'omit'), true);
  assert.equal(calls.every(x => x.options.cache === 'no-store'), true);
  await assert.rejects(store.write(key, sample, 0), /AIO_V3_SSD_HTTP_409/);
});

test('SSD V3 rejects malformed keys, sensitive namespaces and invalid snapshots', async () => {
  assert.doesNotThrow(() => validateKey(key));
  for (const forbidden of ['albot:h19:pending:v1:My_Merchant',
    '../evil', 'aio-v3-content-drift-v1:../escape', 'cstore_AIO_V3_WORLD_MODEL']) {
    assert.throws(() => validateKey(forbidden), /AIO_V3_SSD_KEY_INVALID/);
  }
  assert.doesNotThrow(() => validateSnapshot(sample));
  for (const invalid of ['{', '{}', JSON.stringify({ schemaVersion: 7, records: [], catalog: {} })]) {
    assert.throws(() => validateSnapshot(invalid), /AIO_V3_SSD_SNAPSHOT_INVALID/);
  }
  const store = new ContentDriftSsdStore({ root: fakeHost().root });
  await assert.rejects(store.write(key, sample), /AIO_V3_SSD_REVISION_REQUIRED/);
});

test('SSD V3 transport fails closed on host outage and readback mismatch', async () => {
  const out = new ContentDriftSsdStore({ root: fakeHost({ failHttp: true }).root });
  await assert.rejects(out.read(key), /AIO_V3_SSD_HTTP_503/);
  await assert.rejects(out.write(key, sample, 0), /AIO_V3_SSD_HTTP_503/);
  const f = fakeHost();
  const store = new ContentDriftSsdStore({ root: f.root });
  const original = f.root.fetch;
  f.root.fetch = async (...args) => {
    const response = await original(...args);
    if (args[1].method === 'POST') f.current.value = '{tampered';
    return response;
  };
  await assert.rejects(store.write(key, sample, 0), /AIO_V3_SSD_SNAPSHOT_INVALID/);
});

test('SSD V3 requires explicitly supplied fetch and abort capabilities', async () => {
  const store = new ContentDriftSsdStore({ root: {} });
  await assert.rejects(store.read(key), /AIO_V3_SSD_HOST_UNAVAILABLE/);
});
