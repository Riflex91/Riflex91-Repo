import { releaseObjectKey, releaseScope } from './release-artifact-scope.js';

const RUNTIME_RELEASE_PATH = '/v3/dist/aio-v3-runtime.js';
const RUNTIME_RELEASE_RELATIVE = 'dist/aio-v3-runtime.js';
const RUNTIME_RELEASE_OBJECT = 'releases/v3/dist/aio-v3-runtime.js';

function isRuntimeReleaseRead(request) {
  if (!request || request.method !== 'GET') return false;
  try {
    return new URL(request.url).pathname === RUNTIME_RELEASE_PATH;
  } catch (_) {
    return false;
  }
}

function errorResponse(message, status) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer'
    }
  });
}

async function handleRuntimeReleaseArtifact(request, env) {
  if (!isRuntimeReleaseRead(request)) return null;
  const bucket = env && env.LOG_ARCHIVE;
  if (!bucket || typeof bucket.get !== 'function') {
    return errorResponse('R2_BINDING_UNAVAILABLE', 503);
  }
  const scope = releaseScope(env);
  const key = releaseObjectKey(RUNTIME_RELEASE_RELATIVE, env);
  const object = await bucket.get(key);
  if (!object) return errorResponse(scope.kind === 'preview' ? 'preview runtime not published' : 'release runtime not published', 404);
  const headers = new Headers({
    'content-type': 'application/javascript; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'no-store, max-age=0',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'x-aio-release-scope': scope.kind
  });
  if (scope.sha) headers.set('x-aio-preview-sha', scope.sha);
  if (typeof object.writeHttpMetadata === 'function') object.writeHttpMetadata(headers);
  headers.set('content-type', 'application/javascript; charset=utf-8');
  headers.set('access-control-allow-origin', '*');
  headers.set('cache-control', 'no-store, max-age=0');
  headers.set('x-aio-release-scope', scope.kind);
  if (scope.sha) headers.set('x-aio-preview-sha', scope.sha);
  if (object.httpEtag || object.etag) headers.set('etag', object.httpEtag || object.etag);
  return new Response(object.body, { status: 200, headers });
}

export {
  RUNTIME_RELEASE_PATH,
  RUNTIME_RELEASE_RELATIVE,
  RUNTIME_RELEASE_OBJECT,
  isRuntimeReleaseRead,
  handleRuntimeReleaseArtifact
};
