'use strict';

const OBJECT_STORAGE_CONFIG_NAME = 'AIO_V3_BACKBLAZE_CONFIG';
const OBJECT_STORAGE_SCHEMA_VERSION = 1;
const EXPLICIT_DELETE_CONFIRMATION = 'DELETE_EXPLICITLY';
const EMPTY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

function text(value, max = 1000) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function clone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function bytesOf(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  if (typeof value === 'string') return new TextEncoder().encode(value);
  throw new ObjectStorageError('OBJECT_STORAGE_BODY_INVALID', 'Object body must be string or bytes.');
}

function assertCrypto(cryptoImpl) {
  if (!cryptoImpl || !cryptoImpl.subtle || typeof cryptoImpl.subtle.digest !== 'function') {
    throw new ObjectStorageError('OBJECT_STORAGE_CRYPTO_UNAVAILABLE', 'WebCrypto is required for S3 signing.');
  }
  return cryptoImpl;
}

function rfc3986(value) {
  return encodeURIComponent(String(value)).replace(/[!'()*]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);
}

function canonicalPath(bucket, key) {
  return `/${rfc3986(bucket)}/${String(key).split('/').map(rfc3986).join('/')}`;
}

function normalizePrefix(value) {
  const prefix = text(value, 300).replace(/^\/+|\/+$/g, '');
  if (!prefix) return '';
  validateRelativeKey(prefix, 'OBJECT_STORAGE_PREFIX_INVALID');
  return prefix;
}

function validateRelativeKey(value, code = 'OBJECT_STORAGE_KEY_INVALID') {
  const key = text(value, 1024).replace(/^\/+/, '');
  if (!key || key.length > 1024 || /[\u0000-\u001f\u007f]/.test(key)) {
    throw new ObjectStorageError(code, 'Object key is invalid.');
  }
  const parts = key.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..')) {
    throw new ObjectStorageError(code, 'Object key contains an unsafe path segment.');
  }
  return key;
}

function validateConfig(input) {
  if (!input || typeof input !== 'object') {
    throw new ObjectStorageError('OBJECT_STORAGE_CONFIG_MISSING', `${OBJECT_STORAGE_CONFIG_NAME} is not available.`);
  }
  if (Number(input.schemaVersion) !== OBJECT_STORAGE_SCHEMA_VERSION) {
    throw new ObjectStorageError('OBJECT_STORAGE_CONFIG_VERSION_UNSUPPORTED', 'Object storage config version is unsupported.');
  }
  const provider = text(input.provider, 80);
  if (!provider) throw new ObjectStorageError('OBJECT_STORAGE_PROVIDER_INVALID', 'Object storage provider is missing.');

  let endpoint;
  try { endpoint = new URL(text(input.endpoint, 1000)); } catch (_) {
    throw new ObjectStorageError('OBJECT_STORAGE_ENDPOINT_INVALID', 'Object storage endpoint is invalid.');
  }
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || (endpoint.pathname && endpoint.pathname !== '/') || endpoint.search || endpoint.hash) {
    throw new ObjectStorageError('OBJECT_STORAGE_ENDPOINT_INVALID', 'Object storage endpoint must be a root HTTPS URL.');
  }

  const region = text(input.region, 80);
  if (!/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/.test(region)) {
    throw new ObjectStorageError('OBJECT_STORAGE_REGION_INVALID', 'Object storage region is invalid.');
  }
  const bucket = text(input.bucket, 63);
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket) || bucket.includes('..')) {
    throw new ObjectStorageError('OBJECT_STORAGE_BUCKET_INVALID', 'Object storage bucket is invalid.');
  }
  const prefix = normalizePrefix(input.prefix || '');
  const keyId = text(input.keyId, 256);
  const applicationKey = text(input.applicationKey, 512);
  if (keyId.length < 4 || applicationKey.length < 8) {
    throw new ObjectStorageError('OBJECT_STORAGE_CREDENTIALS_INVALID', 'Object storage credentials are missing or invalid.');
  }
  return Object.freeze({
    schemaVersion: OBJECT_STORAGE_SCHEMA_VERSION,
    provider,
    endpoint: endpoint.origin,
    region,
    bucket,
    prefix,
    keyId,
    applicationKey
  });
}

function readGlobalConfig(root = globalThis) {
  return validateConfig(root && root[OBJECT_STORAGE_CONFIG_NAME]);
}

function safeConfigStatus(root = globalThis) {
  const raw = root && root[OBJECT_STORAGE_CONFIG_NAME];
  if (!raw || typeof raw !== 'object') {
    return { configured: false, schemaVersion: OBJECT_STORAGE_SCHEMA_VERSION, autoDelete: false };
  }
  try {
    const config = validateConfig(raw);
    return {
      configured: true,
      schemaVersion: config.schemaVersion,
      provider: config.provider,
      endpointHost: new URL(config.endpoint).host,
      region: config.region,
      bucket: config.bucket,
      prefix: config.prefix,
      autoDelete: false,
      capabilities: { put: true, head: true, explicitDelete: true, selfTest: true }
    };
  } catch (error) {
    return {
      configured: false,
      schemaVersion: OBJECT_STORAGE_SCHEMA_VERSION,
      autoDelete: false,
      error: sanitizeError(error)
    };
  }
}

class ObjectStorageError extends Error {
  constructor(code, message, details = null) {
    super(message || code);
    this.name = 'ObjectStorageError';
    this.code = code;
    this.details = details ? clone(details) : null;
  }
}

function sanitizeError(error) {
  if (error instanceof ObjectStorageError) {
    return { code: error.code, message: text(error.message, 240), details: error.details ? clone(error.details) : null };
  }
  const message = text(error && error.message || error, 240) || 'Object storage request failed.';
  return { code: 'OBJECT_STORAGE_FAILED', message };
}

function toHex(bytes) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(data, cryptoImpl = globalThis.crypto) {
  const bytes = bytesOf(data);
  const digest = await assertCrypto(cryptoImpl).subtle.digest('SHA-256', bytes);
  return toHex(new Uint8Array(digest));
}

async function hmacSha256(key, data, cryptoImpl = globalThis.crypto) {
  const cryptoApi = assertCrypto(cryptoImpl);
  const keyBytes = typeof key === 'string' ? new TextEncoder().encode(key) : bytesOf(key);
  const cryptoKey = await cryptoApi.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await cryptoApi.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(String(data)));
  return new Uint8Array(signature);
}

function amzTimestamp(now) {
  return now.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function normalizeHeaderValue(value) {
  return String(value == null ? '' : value).trim().replace(/\s+/g, ' ');
}

async function signS3Request(input) {
  const {
    method,
    url,
    config,
    payloadHash = EMPTY_SHA256,
    headers = {},
    now = new Date(),
    cryptoImpl = globalThis.crypto
  } = input;
  const target = url instanceof URL ? url : new URL(url);
  const timestamp = amzTimestamp(now);
  const dateStamp = timestamp.slice(0, 8);
  const signed = {
    host: target.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': timestamp
  };
  for (const [name, value] of Object.entries(headers || {})) {
    const lower = String(name).toLowerCase();
    if (lower === 'authorization' || lower === 'host') continue;
    signed[lower] = normalizeHeaderValue(value);
  }
  const names = Object.keys(signed).sort();
  const canonicalHeaders = names.map((name) => `${name}:${normalizeHeaderValue(signed[name])}\n`).join('');
  const signedHeaders = names.join(';');
  const canonicalRequest = [
    String(method || 'GET').toUpperCase(),
    target.pathname || '/',
    target.searchParams.toString(),
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    timestamp,
    credentialScope,
    await sha256Hex(canonicalRequest, cryptoImpl)
  ].join('\n');
  const dateKey = await hmacSha256(`AWS4${config.applicationKey}`, dateStamp, cryptoImpl);
  const regionKey = await hmacSha256(dateKey, config.region, cryptoImpl);
  const serviceKey = await hmacSha256(regionKey, 's3', cryptoImpl);
  const signingKey = await hmacSha256(serviceKey, 'aws4_request', cryptoImpl);
  const signature = toHex(await hmacSha256(signingKey, stringToSign, cryptoImpl));
  return {
    timestamp,
    signedHeaders,
    authorization: `AWS4-HMAC-SHA256 Credential=${config.keyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    canonicalRequest,
    stringToSign
  };
}

function classifyHttpFailure(status) {
  if (status === 401 || status === 403) return 'OBJECT_STORAGE_AUTH_OR_PERMISSION';
  if (status === 404) return 'OBJECT_STORAGE_NOT_FOUND';
  if (status >= 500) return 'OBJECT_STORAGE_PROVIDER_UNAVAILABLE';
  return 'OBJECT_STORAGE_REQUEST_REJECTED';
}

class S3CompatibleObjectStore {
  constructor(config, options = {}) {
    this.config = validateConfig(config);
    this.fetchImpl = options.fetchImpl || globalThis.fetch;
    this.cryptoImpl = options.cryptoImpl || globalThis.crypto;
    this.now = options.now || (() => new Date());
    this.sleepImpl = options.sleepImpl || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    if (typeof this.fetchImpl !== 'function') {
      throw new ObjectStorageError('OBJECT_STORAGE_FETCH_UNAVAILABLE', 'fetch is required for object storage.');
    }
    assertCrypto(this.cryptoImpl);
  }

  status() {
    const config = this.config;
    return {
      configured: true,
      schemaVersion: config.schemaVersion,
      provider: config.provider,
      endpointHost: new URL(config.endpoint).host,
      region: config.region,
      bucket: config.bucket,
      prefix: config.prefix,
      autoDelete: false,
      capabilities: { put: true, head: true, explicitDelete: true, selfTest: true }
    };
  }

  objectKey(relativeKey) {
    const key = validateRelativeKey(relativeKey);
    return this.config.prefix ? `${this.config.prefix}/${key}` : key;
  }

  objectUrl(relativeKey) {
    const key = this.objectKey(relativeKey);
    return new URL(canonicalPath(this.config.bucket, key), `${this.config.endpoint}/`);
  }

  async _request(method, relativeKey, options = {}) {
    const url = this.objectUrl(relativeKey);
    const body = options.body == null ? null : bytesOf(options.body);
    const payloadHash = body == null ? EMPTY_SHA256 : await sha256Hex(body, this.cryptoImpl);
    const unsignedHeaders = {};
    if (options.contentType) unsignedHeaders['content-type'] = text(options.contentType, 200);
    if (options.metadataSha256) unsignedHeaders['x-amz-meta-aio-sha256'] = options.metadataSha256;
    const signed = await signS3Request({
      method,
      url,
      config: this.config,
      payloadHash,
      headers: unsignedHeaders,
      now: this.now(),
      cryptoImpl: this.cryptoImpl
    });
    const requestHeaders = {
      ...unsignedHeaders,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': signed.timestamp,
      Authorization: signed.authorization
    };
    let response;
    try {
      response = await this.fetchImpl(url.toString(), {
        method,
        headers: requestHeaders,
        body: body == null || method === 'HEAD' ? undefined : body,
        cache: 'no-store'
      });
    } catch (_) {
      throw new ObjectStorageError(
        'OBJECT_STORAGE_CORS_OR_NETWORK',
        'Object storage could not be reached. Check browser CORS rules, network access, and endpoint settings.'
      );
    }
    if (!response || !response.ok) {
      const status = response && Number(response.status) || 0;
      throw new ObjectStorageError(classifyHttpFailure(status), `Object storage request failed with HTTP ${status || 'unknown'}.`, { status });
    }
    return { response, url, payloadHash, signed };
  }

  async put(relativeKey, body, options = {}) {
    const bytes = bytesOf(body);
    const sha256 = await sha256Hex(bytes, this.cryptoImpl);
    const result = await this._request('PUT', relativeKey, {
      body: bytes,
      contentType: options.contentType || 'application/octet-stream',
      metadataSha256: sha256
    });
    return {
      stored: true,
      key: this.objectKey(relativeKey),
      bytes: bytes.byteLength,
      sha256,
      etag: result.response.headers && result.response.headers.get ? result.response.headers.get('etag') : null,
      versionId: result.response.headers && result.response.headers.get ? result.response.headers.get('x-amz-version-id') : null
    };
  }

  async head(relativeKey, expected = {}) {
    const result = await this._request('HEAD', relativeKey);
    const headers = result.response.headers;
    const lengthValue = headers && headers.get ? headers.get('content-length') : null;
    const length = lengthValue == null ? null : Number(lengthValue);
    const sha256 = headers && headers.get ? headers.get('x-amz-meta-aio-sha256') : null;
    if (expected.bytes != null && (!Number.isFinite(length) || length !== Number(expected.bytes))) {
      throw new ObjectStorageError('OBJECT_STORAGE_VERIFY_SIZE_MISMATCH', 'Stored object size does not match the uploaded payload.', { expectedBytes: Number(expected.bytes), actualBytes: Number.isFinite(length) ? length : null });
    }
    if (expected.sha256 && sha256 && sha256.toLowerCase() !== String(expected.sha256).toLowerCase()) {
      throw new ObjectStorageError('OBJECT_STORAGE_VERIFY_HASH_MISMATCH', 'Stored object hash metadata does not match the uploaded payload.');
    }
    if (expected.sha256 && !sha256 && expected.requireHashMetadata === true) {
      throw new ObjectStorageError('OBJECT_STORAGE_VERIFY_HASH_NOT_EXPOSED', 'Hash metadata is not visible. Expose x-amz-meta-aio-sha256 in the bucket CORS rule.');
    }
    return {
      exists: true,
      key: this.objectKey(relativeKey),
      bytes: Number.isFinite(length) ? length : null,
      sha256: sha256 || null,
      etag: headers && headers.get ? headers.get('etag') : null,
      versionId: headers && headers.get ? headers.get('x-amz-version-id') : null
    };
  }

  async putAndVerify(relativeKey, body, options = {}) {
    const stored = await this.put(relativeKey, body, options);
    const verified = await this.head(relativeKey, {
      bytes: stored.bytes,
      sha256: stored.sha256,
      requireHashMetadata: options.requireHashMetadata !== false
    });
    return { stored: true, verified: true, key: stored.key, bytes: stored.bytes, sha256: stored.sha256, versionId: stored.versionId || verified.versionId || null };
  }

  async delete(relativeKey, confirmation) {
    if (confirmation !== EXPLICIT_DELETE_CONFIRMATION) {
      throw new ObjectStorageError('OBJECT_STORAGE_DELETE_CONFIRMATION_REQUIRED', `Deletion requires confirmation ${EXPLICIT_DELETE_CONFIRMATION}.`);
    }
    await this._request('DELETE', relativeKey);
    return { deleted: true, key: this.objectKey(relativeKey), explicit: true };
  }

  async selfTest(options = {}) {
    const randomPart = text(options.randomPart || Math.random().toString(36).slice(2), 40).replace(/[^a-zA-Z0-9_-]/g, '') || 'probe';
    const timestamp = this.now().toISOString().replace(/[:.]/g, '-');
    const relativeKey = `_health/${timestamp}-${randomPart}.json`;
    const payload = JSON.stringify({ schemaVersion: 1, type: 'AIO_V3_OBJECT_STORAGE_SELF_TEST', createdAt: this.now().toISOString() });
    const result = await this.putAndVerify(relativeKey, payload, { contentType: 'application/json', requireHashMetadata: true });
    let cleanup = { requested: options.cleanup === true, deleted: false };
    if (options.cleanup === true) {
      const cleanupDelayMs = Math.max(1000, Math.min(10000, Number(options.cleanupDelayMs) || 1100));
      await this.sleepImpl(cleanupDelayMs);
      cleanup = await this.delete(relativeKey, EXPLICIT_DELETE_CONFIRMATION);
      cleanup.requested = true;
      cleanup.delayMs = cleanupDelayMs;
    }
    return { ok: true, provider: this.config.provider, bucket: this.config.bucket, key: result.key, bytes: result.bytes, sha256: result.sha256, verified: true, cleanup };
  }
}

function createStoreFromGlobal(root = globalThis, options = {}) {
  return new S3CompatibleObjectStore(readGlobalConfig(root), options);
}

function installObjectStorageApi(api, root = globalThis, options = {}) {
  if (!api || typeof api !== 'object') return null;
  const store = () => createStoreFromGlobal(root, options);
  api.objectStorage = Object.freeze({
    status: () => safeConfigStatus(root),
    put: (key, body, requestOptions = {}) => store().putAndVerify(key, body, requestOptions),
    head: (key) => store().head(key),
    deleteExplicit: (key, confirmation) => store().delete(key, confirmation),
    selfTest: (selfTestOptions = {}) => store().selfTest(selfTestOptions),
    deleteConfirmation: EXPLICIT_DELETE_CONFIRMATION
  });
  return api.objectStorage;
}

module.exports = {
  OBJECT_STORAGE_CONFIG_NAME,
  OBJECT_STORAGE_SCHEMA_VERSION,
  EXPLICIT_DELETE_CONFIRMATION,
  EMPTY_SHA256,
  ObjectStorageError,
  S3CompatibleObjectStore,
  validateConfig,
  readGlobalConfig,
  safeConfigStatus,
  canonicalPath,
  sha256Hex,
  signS3Request,
  sanitizeError,
  createStoreFromGlobal,
  installObjectStorageApi
};
