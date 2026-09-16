'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const { S3CompatibleObjectStore } = require('../src/ops/object-storage-s3');

const CONFIG = Object.freeze({
  schemaVersion: 1,
  provider: 'backblaze-b2',
  endpoint: 'https://s3.eu-central-003.backblazeb2.com',
  region: 'eu-central-003',
  bucket: 'al-aio-bot',
  prefix: 'v4',
  keyId: '004-test-key-id',
  applicationKey: 'K004-test-application-secret'
});

function emptyHeaders() {
  return { get() { return null; } };
}

test('binds the default browser fetch implementation to globalThis', async () => {
  const originalFetch = globalThis.fetch;
  let receiver = null;
  let method = null;

  globalThis.fetch = async function (_url, options) {
    receiver = this;
    method = options && options.method;
    return { ok: true, status: 200, headers: emptyHeaders() };
  };

  try {
    const store = new S3CompatibleObjectStore(CONFIG, { cryptoImpl: webcrypto });
    await store.head('raw/browser-fetch-binding.bin');
    assert.equal(receiver, globalThis);
    assert.equal(method, 'HEAD');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
