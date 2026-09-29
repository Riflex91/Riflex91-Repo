const ALHD_PUBLIC_PREFIX = '/alhd/releases/';

function parseAlhdPublicAssetRead(request) {
  if (!request || request.method !== 'GET') return null;
  let pathname;
  try { pathname = new URL(request.url).pathname; } catch (_) { return null; }
  const match = /^\/alhd\/releases\/(\d+(?:\.\d+){0,3})\/([A-Za-z0-9._/-]+\.png)$/.exec(pathname);
  if (!match) return null;
  const version = match[1];
  const assetPath = match[2];
  if (!assetPath || assetPath.includes('..') || assetPath.includes('//') || assetPath.startsWith('/')) return null;
  return Object.freeze({
    version,
    assetPath,
    pathname,
    objectKey: `releases/alhd/${version}/${assetPath}`
  });
}

function isAlhdPublicAssetRead(request) {
  return parseAlhdPublicAssetRead(request) !== null;
}

function errorResponse(message, status, version = null) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'no-store, max-age=0',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer'
  };
  if (version) headers['x-alhd-release-version'] = version;
  return new Response(JSON.stringify({ok:false,error:message}), {status,headers});
}

async function handleAlhdPublicAsset(request, env) {
  const parsed = parseAlhdPublicAssetRead(request);
  if (!parsed) return null;
  const bucket = env && env.LOG_ARCHIVE;
  if (!bucket || typeof bucket.get !== 'function') return errorResponse('R2_BINDING_UNAVAILABLE',503,parsed.version);
  const object = await bucket.get(parsed.objectKey);
  if (!object) return errorResponse('ALHD public asset not published',404,parsed.version);

  const headers = new Headers({
    'content-type':'image/png',
    'access-control-allow-origin':'*',
    'cache-control':'public, max-age=31536000, immutable',
    'x-content-type-options':'nosniff',
    'referrer-policy':'no-referrer',
    'x-alhd-release-version':parsed.version
  });
  if (typeof object.writeHttpMetadata === 'function') object.writeHttpMetadata(headers);
  headers.set('content-type','image/png');
  headers.set('access-control-allow-origin','*');
  headers.set('cache-control','public, max-age=31536000, immutable');
  headers.set('x-content-type-options','nosniff');
  headers.set('referrer-policy','no-referrer');
  headers.set('x-alhd-release-version',parsed.version);
  if (object.httpEtag || object.etag) headers.set('etag',object.httpEtag || object.etag);
  return new Response(object.body,{status:200,headers});
}

export {
  ALHD_PUBLIC_PREFIX,
  parseAlhdPublicAssetRead,
  isAlhdPublicAssetRead,
  handleAlhdPublicAsset
};
