import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const workflowPfad = path.join(wurzel, '..', '.github', 'workflows', 'release-v4-runtime.yml');
const workflow = await readFile(workflowPfad, 'utf8');

for (const pflicht of [
  'name: release-v4-runtime-immutable',
  'workflow_dispatch:',
  'release_sha:',
  'confirmation:',
  'PUBLISH-V4-IMMUTABLE:$RELEASE_SHA',
  '$GITHUB_REF',
  'refs/heads/main',
  'ref: ${{ github.sha }}',
  'path: control',
  'ref: ${{ inputs.release_sha }}',
  'path: release',
  'BLOCK-8-5-RUNTIME-1-1-5-RELEASE-CANDIDATE.json',
  "manifest.runtimeVersion !== '1.1.5'",
  "manifest.aenderungsKennung !== 'git:' + releaseSha",
  'manifest.block9Freigegeben !== false',
  'npm run produktions-runtime:bauen',
  'sha256sum dist/aio-v4-runtime.js',
  'wc -c < dist/aio-v4-runtime.js',
  'Require Cloudflare credentials',
  'aio-v4-runtime-release-only',
  '--experimental-auto-create=false',
  '--experimental-provision=false',
  'wrangler r2 bucket info "$R2_BUCKET"',
  'api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/r2/buckets/$R2_BUCKET/objects/$key',
  'if [ "$http_status" = "200" ]',
  'cmp "$file" "$temp"',
  'if [ "$http_status" != "404" ]',
  'wrangler r2 object put "$R2_BUCKET/$key"',
  'releases/v4/$RELEASE_SHA/aio-v4-runtime.js',
  'releases/v4/$RELEASE_SHA/aio-v4-runtime.sha256',
  'Verify immutable V4 objects from R2',
  'Verify immutable V4 release over existing public HTTPS worker',
  'x-aio-v4-release-sha',
  'access-control-allow-origin',
  'cache-control:.*no-store',
  'Cleanup isolated temporary files'
]) {
  if (!workflow.includes(pflicht)) {
    throw new Error(`V4-only Runtime-Release-Workflow fehlt: ${pflicht}`);
  }
}

for (const verboten of [
  'wrangler deploy',
  'wrangler d1',
  'bucket lifecycle',
  'releases/v3/',
  'Publish V3',
  'Build V3',
  'v3/scripts',
  'working-directory: v3',
  'aio-v3-runtime.js',
  'aio-v3.js',
  'release-version.js'
]) {
  if (workflow.includes(verboten)) {
    throw new Error(`V4-only Runtime-Release-Workflow darf V3/Worker/D1/Lifecycle nicht veraendern: ${verboten}`);
  }
}

if (/^\s*push\s*:/m.test(workflow)) {
  throw new Error('V4-only Runtime-Release-Workflow darf keinen push-Trigger besitzen.');
}
if (/^\s*pull_request\s*:/m.test(workflow)) {
  throw new Error('V4-only Runtime-Release-Workflow darf keinen pull_request-Trigger besitzen.');
}

const autoCreateFlags = workflow.match(/--experimental-auto-create=false/g) ?? [];
const provisionFlags = workflow.match(/--experimental-provision=false/g) ?? [];
if (autoCreateFlags.length !== 4 || provisionFlags.length !== 4) {
  throw new Error(
    'V4-only Runtime-Release-Workflow muss automatische Provisionierung an allen vier Wrangler-R2-Aufrufen deaktivieren.'
  );
}

const putVorkommen = workflow.match(/wrangler r2 object put/g) ?? [];
if (putVorkommen.length !== 1) {
  throw new Error(
    `V4-only Runtime-Release-Workflow muss genau einen zentralen R2-put-Aufruf besitzen, gefunden: ${putVorkommen.length}.`
  );
}

const releaseSchluessel = workflow.match(/releases\/v4\/\$RELEASE_SHA\/aio-v4-runtime(?:\.js|\.sha256)/g) ?? [];
if (new Set(releaseSchluessel).size !== 2) {
  throw new Error('V4-only Runtime-Release-Workflow muss exakt Runtime- und SHA-Artefakt unter dem Release-SHA binden.');
}

console.log(
  'V4-only Runtime-Release-Workflow geprueft: nur manueller Dispatch, exakte Candidate-Bindung, kein V3/Worker/D1/Lifecycle-Pfad, immutable R2-Pruefung vor Put und vollstaendige R2-/HTTPS-Rueckverifikation.'
);
