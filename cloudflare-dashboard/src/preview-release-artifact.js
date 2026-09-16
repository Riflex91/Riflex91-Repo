import { releaseObjectKey, releaseScope } from './release-artifact-scope.js';

const PREVIEW_RELEASE_PATHS = Object.freeze({
  '/v3/src/release-version.js': 'src/release-version.js',
  '/v3/dist/aio-v3.js': 'dist/aio-v3.js',
  '/v3/dist/aio-v3-runtime.js': 'dist/aio-v3-runtime.js'
});

function previewError(message, status) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'cache-control': 'no-store, max-age=0',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer'
    }
  });
}

function isPreviewReleaseRead(request, env) {
  if (!request || request.method !== 'GET' || releaseScope(env).kind !== 'preview') return false;
  try {
    return !!PREVIEW_RELEASE_PATHS[new URL(request.url).pathname];
  } catch (_) {
    return false;
  }
}

async function handlePreviewReleaseArtifact(request, env) {
  if (!isPreviewReleaseRead(request, env)) return null;
  const scope = releaseScope(env);
  const path = new URL(request.url).pathname;
  const relative = PREVIEW_RELEASE_PATHS[path];
  const bucket = env && env.LOG_ARCHIVE;
  if (!bucket || typeof bucket.get !== 'function') return previewError('R2_BINDING_UNAVAILABLE', 503);
  const key = releaseObjectKey(relative, env);
  const object = await bucket.get(key);
  if (!object) return previewError('preview artifact not published', 404);

  const headers = new Headers({
    'content-type': 'application/javascript; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'no-store, max-age=0',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'x-aio-release-scope': 'preview',
    'x-aio-preview-sha': scope.sha
  });
  if (typeof object.writeHttpMetadata === 'function') object.writeHttpMetadata(headers);
  headers.set('content-type', 'application/javascript; charset=utf-8');
  headers.set('access-control-allow-origin', '*');
  headers.set('cache-control', 'no-store, max-age=0');
  headers.set('x-aio-release-scope', 'preview');
  headers.set('x-aio-preview-sha', scope.sha);
  if (object.httpEtag || object.etag) headers.set('etag', object.httpEtag || object.etag);
  return new Response(object.body, { status: 200, headers });
}

export {
  PREVIEW_RELEASE_PATHS,
  handlePreviewReleaseArtifact,
  isPreviewReleaseRead
};
