'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createHmac, createHash, webcrypto } = require('node:crypto');
const {
  OBJECT_STORAGE_CONFIG_NAME,
  EXPLICIT_DELETE_CONFIRMATION,
  ObjectStorageError,
  S3CompatibleObjectStore,
  validateConfig,
  safeConfigStatus,
  canonicalPath,
  canonicalQuery,
  signS3Request,
  installObjectStorageApi
} = require('../src/ops/object-storage-s3');

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

function hex(buffer) { return Buffer.from(buffer).toString('hex'); }
function hmac(key, data) { return createHmac('sha256', key).update(data).digest(); }
function sha(data) { return createHash('sha256').update(data).digest('hex'); }
function encode(value) { return encodeURIComponent(String(value)).replace(/[!'()*]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`); }

function expectedCanonicalQuery(searchParams) {
  const pairs = [];
  for (const [name, value] of searchParams.entries()) pairs.push([encode(name), encode(value)]);
  pairs.sort((left, right) => left[0] === right[0] ? (left[1] < right[1] ? -1 : left[1] > right[1] ? 1 : 0) : (left[0] < right[0] ? -1 : 1));
  return pairs.map(([name, value]) => `${name}=${value}`).join('&');
}

function expectedAuthorization({ method, url, config, payloadHash, headers, now }) {
  const target = new URL(url);
  const timestamp = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = timestamp.slice(0, 8);
  const signed = { host: target.host, 'x-amz-content-sha256': payloadHash, 'x-amz-date': timestamp };
  for (const [name, value] of Object.entries(headers)) signed[name.toLowerCase()] = String(value).trim().replace(/\s+/g, ' ');
  const names = Object.keys(signed).sort();
  const canonicalHeaders = names.map((name) => `${name}:${signed[name]}\n`).join('');
  const signedHeaders = names.join(';');
  const canonicalRequest = [method, target.pathname, expectedCanonicalQuery(target.searchParams), canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const scope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', timestamp, scope, sha(canonicalRequest)].join('\n');
  const dateKey = hmac(Buffer.from(`AWS4${config.applicationKey}`), dateStamp);
  const regionKey = hmac(dateKey, config.region);
  const serviceKey = hmac(regionKey, 's3');
  const signingKey = hmac(serviceKey, 'aws4_request');
  const signature = hex(hmac(signingKey, stringToSign));
  return `AWS4-HMAC-SHA256 Credential=${config.keyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

function headers(values) {
  const normalized = new Map(Object.entries(values).map(([key, value]) => [key.toLowerCase(), String(value)]));
  return { get(name) { return normalized.get(String(name).toLowerCase()) ?? null; } };
}

test('validates bridge config without exposing secrets in status', () => {
  const validated = validateConfig(CONFIG);
  assert.equal(validated.bucket, 'al-aio-bot');
  const root = { [OBJECT_STORAGE_CONFIG_NAME]: CONFIG };
  const status = safeConfigStatus(root);
  assert.equal(status.configured, true);
  assert.equal(status.bucket, 'al-aio-bot');
  assert.equal(status.capabilities.explicitVersionDelete, true);
  const serialized = JSON.stringify(status);
  assert.equal(serialized.includes(CONFIG.keyId), false);
  assert.equal(serialized.includes(CONFIG.applicationKey), false);
});

test('rejects unsafe endpoint, prefix and object keys', async () => {
  assert.throws(() => validateConfig({ ...CONFIG, endpoint: 'http://example.test' }), /root HTTPS URL/);
  assert.throws(() => validateConfig({ ...CONFIG, prefix: 'v4/../secret' }), /unsafe path segment/);
  const store = new S3CompatibleObjectStore(CONFIG, { fetchImpl: async () => ({ ok: true, headers: headers({}) }), cryptoImpl: webcrypto });
  assert.throws(() => store.objectKey('../secret'), /unsafe path segment/);
});

test('uses path-style S3 URL with RFC3986 encoding', () => {
  assert.equal(canonicalPath('al-aio-bot', 'v4/raw/a b+c.json'), '/al-aio-bot/v4/raw/a%20b%2Bc.json');
});

test('canonical query is RFC3986 encoded and sorted for SigV4', () => {
  const url = new URL('https://example.invalid/object');
  url.searchParams.append('z', 'a b');
  url.searchParams.append('versionId', '4_z+/=');
  url.searchParams.append('a', '2');
  assert.equal(canonicalQuery(url.searchParams), 'a=2&versionId=4_z%2B%2F%3D&z=a%20b');
});

test('creates deterministic AWS Signature V4 authorization', async () => {
  const now = new Date('2026-09-16T16:00:00.000Z');
  const url = 'https://s3.eu-central-003.backblazeb2.com/al-aio-bot/v4/test.json';
  const bodyHash = sha('hello');
  const customHeaders = { 'content-type': 'application/json', 'x-amz-meta-aio-sha256': bodyHash };
  const actual = await signS3Request({ method: 'PUT', url, config: CONFIG, payloadHash: bodyHash, headers: customHeaders, now, cryptoImpl: webcrypto });
  const expected = expectedAuthorization({ method: 'PUT', url, config: CONFIG, payloadHash: bodyHash, headers: customHeaders, now });
  assert.equal(actual.authorization, expected);
  assert.match(actual.signedHeaders, /host/);
  assert.match(actual.signedHeaders, /x-amz-content-sha256/);
  assert.match(actual.signedHeaders, /x-amz-date/);
});

test('PUT plus HEAD verifies bytes and sha metadata without returning secrets', async () => {
  const calls = [];
  const body = 'durable replay probe';
  const expectedHash = sha(body);
  const fakeFetch = async (url, options) => {
    calls.push({ url, options });
    if (options.method === 'PUT') return { ok: true, status: 200, headers: headers({ etag: '"abc"', 'x-amz-version-id': 'v1' }) };
    if (options.method === 'HEAD') return { ok: true, status: 200, headers: headers({ 'content-length': Buffer.byteLength(body), 'x-amz-meta-aio-sha256': expectedHash, etag: '"abc"' }) };
    throw new Error('unexpected');
  };
  const store = new S3CompatibleObjectStore(CONFIG, { fetchImpl: fakeFetch, cryptoImpl: webcrypto, now: () => new Date('2026-09-16T16:00:00.000Z') });
  const result = await store.putAndVerify('raw/test.json', body, { contentType: 'application/json' });
  assert.equal(result.verified, true);
  assert.equal(result.bytes, Buffer.byteLength(body));
  assert.equal(result.sha256, expectedHash);
  assert.equal(result.versionId, 'v1');
  assert.deepEqual(calls.map((call) => call.options.method), ['PUT', 'HEAD']);
  assert.match(calls[0].options.headers.Authorization, /^AWS4-HMAC-SHA256 /);
  assert.equal(calls[0].options.headers['x-amz-meta-aio-sha256'], expectedHash);
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes(CONFIG.keyId), false);
  assert.equal(serialized.includes(CONFIG.applicationKey), false);
});

test('requires hash metadata to be exposed when verification requests it', async () => {
  const fakeFetch = async (_url, options) => {
    if (options.method === 'PUT') return { ok: true, status: 200, headers: headers({}) };
    return { ok: true, status: 200, headers: headers({ 'content-length': '3' }) };
  };
  const store = new S3CompatibleObjectStore(CONFIG, { fetchImpl: fakeFetch, cryptoImpl: webcrypto });
  await assert.rejects(() => store.putAndVerify('raw/test.bin', 'abc'), (error) => error instanceof ObjectStorageError && error.code === 'OBJECT_STORAGE_VERIFY_HASH_NOT_EXPOSED');
});

test('maps browser fetch rejection to sanitized CORS/network error', async () => {
  const store = new S3CompatibleObjectStore(CONFIG, { fetchImpl: async () => { throw new TypeError('Failed to fetch with secret K004-test-application-secret'); }, cryptoImpl: webcrypto });
  await assert.rejects(() => store.head('raw/test.bin'), (error) => {
    assert.equal(error.code, 'OBJECT_STORAGE_CORS_OR_NETWORK');
    assert.equal(error.message.includes(CONFIG.applicationKey), false);
    return true;
  });
});

test('permanent DELETE requires explicit confirmation and an exact version ID', async () => {
  const calls = [];
  const now = new Date('2026-09-16T16:00:00.000Z');
  const store = new S3CompatibleObjectStore(CONFIG, {
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, status: 204, headers: headers({}) };
    },
    cryptoImpl: webcrypto,
    now: () => now
  });
  await assert.rejects(() => store.deleteVersion('raw/test.bin', 'version-1'), (error) => error.code === 'OBJECT_STORAGE_DELETE_CONFIRMATION_REQUIRED');
  assert.deepEqual(calls, []);
  const result = await store.deleteVersion('raw/test.bin', 'version-1', EXPLICIT_DELETE_CONFIRMATION);
  assert.equal(result.deleted, true);
  assert.equal(result.permanent, true);
  assert.equal(result.versionId, 'version-1');
  assert.equal(calls.length, 1);
  const requestUrl = new URL(calls[0].url);
  assert.equal(requestUrl.searchParams.get('versionId'), 'version-1');
  assert.equal(calls[0].options.headers.Authorization, expectedAuthorization({
    method: 'DELETE',
    url: calls[0].url,
    config: CONFIG,
    payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    headers: {},
    now
  }));
});

test('self-test does not delete unless cleanup is explicitly requested', async () => {
  const methods = [];
  const urls = [];
  let payloadHash = null;
  const payload = JSON.stringify({ schemaVersion: 1, type: 'AIO_V3_OBJECT_STORAGE_SELF_TEST', createdAt: '2026-09-16T16:00:00.000Z' });
  const fakeFetch = async (url, options) => {
    methods.push(options.method);
    urls.push(url);
    if (options.method === 'PUT') {
      payloadHash = options.headers['x-amz-meta-aio-sha256'];
      return { ok: true, status: 200, headers: headers({ 'x-amz-version-id': 'version-selftest' }) };
    }
    if (options.method === 'HEAD') {
      return { ok: true, status: 200, headers: headers({ 'content-length': String(Buffer.byteLength(payload)), 'x-amz-meta-aio-sha256': payloadHash }) };
    }
    return { ok: true, status: 204, headers: headers({}) };
  };
  const store = new S3CompatibleObjectStore(CONFIG, { fetchImpl: fakeFetch, cryptoImpl: webcrypto, now: () => new Date('2026-09-16T16:00:00.000Z'), sleepImpl: async () => {} });
  const first = await store.selfTest({ randomPart: 'no-delete' });
  assert.equal(first.cleanup.deleted, false);
  assert.deepEqual(methods, ['PUT', 'HEAD']);
  methods.length = 0;
  urls.length = 0;
  const second = await store.selfTest({ randomPart: 'with-delete', cleanup: true });
  assert.equal(second.cleanup.deleted, true);
  assert.equal(second.cleanup.permanent, true);
  assert.deepEqual(methods, ['PUT', 'HEAD', 'DELETE']);
  assert.equal(new URL(urls[2]).searchParams.get('versionId'), 'version-selftest');
});

test('self-test refuses name-only cleanup when provider version ID is unavailable', async () => {
  const methods = [];
  let payloadHash = null;
  const payload = JSON.stringify({ schemaVersion: 1, type: 'AIO_V3_OBJECT_STORAGE_SELF_TEST', createdAt: '2026-09-16T16:00:00.000Z' });
  const fakeFetch = async (_url, options) => {
    methods.push(options.method);
    if (options.method === 'PUT') {
      payloadHash = options.headers['x-amz-meta-aio-sha256'];
      return { ok: true, status: 200, headers: headers({}) };
    }
    if (options.method === 'HEAD') return { ok: true, status: 200, headers: headers({ 'content-length': String(Buffer.byteLength(payload)), 'x-amz-meta-aio-sha256': payloadHash }) };
    throw new Error('DELETE must not be attempted');
  };
  const store = new S3CompatibleObjectStore(CONFIG, { fetchImpl: fakeFetch, cryptoImpl: webcrypto, now: () => new Date('2026-09-16T16:00:00.000Z'), sleepImpl: async () => {} });
  await assert.rejects(() => store.selfTest({ cleanup: true }), (error) => error.code === 'OBJECT_STORAGE_CLEANUP_VERSION_ID_REQUIRED');
  assert.deepEqual(methods, ['PUT', 'HEAD']);
});

test('runtime API reads config lazily so bridge can inject after bot startup', async () => {
  const root = {};
  const api = {};
  installObjectStorageApi(api, root, { fetchImpl: async () => ({ ok: true, status: 200, headers: headers({}) }), cryptoImpl: webcrypto });
  assert.equal(api.objectStorage.status().configured, false);
  root[OBJECT_STORAGE_CONFIG_NAME] = CONFIG;
  assert.equal(api.objectStorage.status().configured, true);
  assert.equal(api.objectStorage.status().bucket, 'al-aio-bot');
  assert.equal(typeof api.objectStorage.deleteVersionExplicit, 'function');
  assert.equal(api.objectStorage.deleteExplicit, undefined);
});
