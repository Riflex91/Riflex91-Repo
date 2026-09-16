const PRODUCTION_RELEASE_PREFIX = 'releases/v3';
const PREVIEW_RELEASE_PREFIX = 'previews/v3';
const RELEASE_ARTIFACTS = new Set([
  'src/release-version.js',
  'dist/aio-v3.js',
  'dist/aio-v3-runtime.js'
]);

function previewReleaseSha(env) {
  const sha = String(env && env.PREVIEW_RELEASE_SHA || '').trim().toLowerCase();
  return /^[0-9a-f]{40}$/.test(sha) ? sha : null;
}

function releaseScope(env) {
  const sha = previewReleaseSha(env);
  return sha
    ? { kind: 'preview', sha, prefix: `${PREVIEW_RELEASE_PREFIX}/${sha}` }
    : { kind: 'production', sha: null, prefix: PRODUCTION_RELEASE_PREFIX };
}

function releaseObjectKey(relativePath, env) {
  const path = String(relativePath || '').replace(/^\/+/, '');
  if (!RELEASE_ARTIFACTS.has(path)) throw new Error(`UNSUPPORTED_RELEASE_ARTIFACT:${path}`);
  return `${releaseScope(env).prefix}/${path}`;
}

export {
  PREVIEW_RELEASE_PREFIX,
  PRODUCTION_RELEASE_PREFIX,
  RELEASE_ARTIFACTS,
  previewReleaseSha,
  releaseObjectKey,
  releaseScope
};
