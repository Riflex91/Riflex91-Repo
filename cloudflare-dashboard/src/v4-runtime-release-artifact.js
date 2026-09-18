const V4_RUNTIME_RELEASE_PREFIX = '/v4/releases/';
const V4_RUNTIME_DATEIEN = Object.freeze([
  'aio-v4-runtime.js',
  'aio-v4-runtime.sha256'
]);

function parseV4RuntimeReleaseRead(request) {
  if (!request || request.method !== 'GET') return null;
  let pathname;
  try {
    pathname = new URL(request.url).pathname;
  } catch (_) {
    return null;
  }
  const match = /^\/v4\/releases\/([0-9a-f]{40})\/(aio-v4-runtime\.js|aio-v4-runtime\.sha256)$/.exec(pathname);
  if (!match) return null;
  const releaseSha = match[1];
  const datei = match[2];
  if (!V4_RUNTIME_DATEIEN.includes(datei)) return null;
  return Object.freeze({
    releaseSha,
    datei,
    pathname,
    objectKey: `releases/v4/${releaseSha}/${datei}`
  });
}

function isV4RuntimeReleaseRead(request) {
  return parseV4RuntimeReleaseRead(request) !== null;
}

function errorResponse(message, status, releaseSha = null) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'no-store, max-age=0',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer'
  };
  if (releaseSha) headers['x-aio-v4-release-sha'] = releaseSha;
  return new Response(JSON.stringify({ ok: false, error: message }), { status, headers });
}

async function handleV4RuntimeReleaseArtifact(request, env) {
  const release = parseV4RuntimeReleaseRead(request);
  if (!release) return null;

  const bucket = env && env.LOG_ARCHIVE;
  if (!bucket || typeof bucket.get !== 'function') {
    return errorResponse('R2_BINDING_UNAVAILABLE', 503, release.releaseSha);
  }

  const object = await bucket.get(release.objectKey);
  if (!object) return errorResponse('v4 release artifact not published', 404, release.releaseSha);

  const contentType = release.datei.endsWith('.js')
    ? 'application/javascript; charset=utf-8'
    : 'text/plain; charset=utf-8';
  const headers = new Headers({
    'content-type': contentType,
    'access-control-allow-origin': '*',
    'cache-control': 'no-store, max-age=0',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'x-aio-v4-release-sha': release.releaseSha
  });
  if (typeof object.writeHttpMetadata === 'function') object.writeHttpMetadata(headers);
  headers.set('content-type', contentType);
  headers.set('access-control-allow-origin', '*');
  headers.set('cache-control', 'no-store, max-age=0');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'no-referrer');
  headers.set('x-aio-v4-release-sha', release.releaseSha);
  if (object.httpEtag || object.etag) headers.set('etag', object.httpEtag || object.etag);

  return new Response(object.body, { status: 200, headers });
}

export {
  V4_RUNTIME_RELEASE_PREFIX,
  V4_RUNTIME_DATEIEN,
  parseV4RuntimeReleaseRead,
  isV4RuntimeReleaseRead,
  handleV4RuntimeReleaseArtifact
};
