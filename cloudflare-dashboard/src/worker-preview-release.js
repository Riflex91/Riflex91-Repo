const PREVIEW_RUNTIME_RE = /^\/v3-preview\/([0-9a-f]{40})\/dist\/(aio-v3(?:-runtime)?\.js)$/;
const PREVIEW_VERSION_RE = /^\/v3-preview\/([0-9a-f]{40})\/src\/(release-version\.js)$/;

function corsHeaders(extra = {}) {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, OPTIONS',
    'cache-control': 'no-store, max-age=0',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    ...extra
  };
}

function response(message, status = 200, extra = {}) {
  return new Response(message, { status, headers: corsHeaders(extra) });
}

function previewObject(pathname) {
  const runtime = String(pathname || '').match(PREVIEW_RUNTIME_RE);
  if (runtime) {
    return {
      sourceSha: runtime[1],
      key: `previews/v3/${runtime[1]}/dist/${runtime[2]}`,
      contentType: 'application/javascript; charset=utf-8'
    };
  }
  const version = String(pathname || '').match(PREVIEW_VERSION_RE);
  if (version) {
    return {
      sourceSha: version[1],
      key: `previews/v3/${version[1]}/src/${version[2]}`,
      contentType: 'application/javascript; charset=utf-8'
    };
  }
  return null;
}

async function handlePreviewRelease(request, env) {
  if (!request) return response('bad request', 400);
  if (request.method === 'OPTIONS') return response('', 204);
  if (request.method !== 'GET') return response('method not allowed', 405, { allow: 'GET, OPTIONS' });

  let url;
  try { url = new URL(request.url); } catch (_) { return response('bad request', 400); }
  if (url.pathname === '/health') {
    return response(JSON.stringify({ ok: true, mode: 'aio-v3-preview-release-v1' }), 200, {
      'content-type': 'application/json; charset=utf-8'
    });
  }

  const artifact = previewObject(url.pathname);
  if (!artifact) return response('preview artifact not found', 404);
  const bucket = env && env.LOG_ARCHIVE;
  if (!bucket || typeof bucket.get !== 'function') return response('R2_BINDING_UNAVAILABLE', 503);

  const object = await bucket.get(artifact.key);
  if (!object) return response('preview artifact not published', 404, {
    'x-aio-preview-source-sha': artifact.sourceSha
  });

  const headers = new Headers(corsHeaders({
    'content-type': artifact.contentType,
    'x-aio-preview-source-sha': artifact.sourceSha
  }));
  if (typeof object.writeHttpMetadata === 'function') object.writeHttpMetadata(headers);
  headers.set('content-type', artifact.contentType);
  headers.set('access-control-allow-origin', '*');
  headers.set('cache-control', 'no-store, max-age=0');
  headers.set('x-aio-preview-source-sha', artifact.sourceSha);
  if (object.httpEtag || object.etag) headers.set('etag', object.httpEtag || object.etag);
  return new Response(object.body, { status: 200, headers });
}

export { PREVIEW_RUNTIME_RE, PREVIEW_VERSION_RE, previewObject, handlePreviewRelease };
export default { fetch: handlePreviewRelease };
