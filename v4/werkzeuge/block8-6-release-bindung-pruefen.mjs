import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { baueBlock86Candidate } from './block8-6-candidate-bauen.mjs';

const wurzel = process.cwd();
const repoWurzel = path.join(wurzel, '..');
const manifestPfad = path.join(wurzel, 'dokumentation', 'BLOCK-8-6-9-RELEASE-CANDIDATE.json');
const workflowPfad = path.join(repoWurzel, '.github', 'workflows', 'release-v4-block8-6-candidate.yml');
const dokumentPfad = path.join(wurzel, 'dokumentation', 'BLOCK-8-6-9-RELEASE-CANDIDATE.md');
const deploymentDokumentPfad = path.join(wurzel, 'dokumentation', 'BLOCK-8-6-9-CANDIDATE-DEPLOYMENT-NACHWEIS.md');

const manifest = JSON.parse(await readFile(manifestPfad, 'utf8'));
const workflow = await readFile(workflowPfad, 'utf8');
const dokument = await readFile(dokumentPfad, 'utf8');
const deploymentDokument = await readFile(deploymentDokumentPfad, 'utf8');

const erwartet = Object.freeze({
  releaseSha: 'ca0dfee7685563c8b6003469300c8fd08777b053',
  mergedByCommit: 'a767c18334cfb20422abea04105bc0cbd40603a5',
  candidateVersion: '1.0.0',
  runtimeVersion: '1.1.5',
  bundleVersion: '4.0.0-alpha.0',
  moduleCount: 51,
  bytes: 396471,
  sha256: 'b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5',
  laufzeitPfadKennung: 'block8.6-capability-runtime'
});

if (manifest.schemaVersion !== 1 || manifest.status !== 'release_candidate') {
  throw new Error('Block-8.6-Release-Candidate besitzt unbekannte Schema-/Statuswerte.');
}
for (const [feld, wert] of Object.entries(erwartet)) {
  if (manifest[feld] !== wert) throw new Error('Block-8.6-Release-Candidate besitzt unerwarteten Wert fuer ' + feld + '.');
}
if (manifest.aenderungsKennung !== 'git:' + manifest.releaseSha) {
  throw new Error('Block-8.6-Release-Candidate aenderungsKennung muss exakt git:<releaseSha> sein.');
}
if (manifest.sourceArtifact !== 'dist/aio-v4-block8-6-candidate.js' ||
    manifest.sourceSha256Artifact !== 'dist/aio-v4-block8-6-candidate.sha256') {
  throw new Error('Block-8.6-Release-Candidate bindet nicht die erwarteten lokalen Candidate-Artefakte.');
}
if (manifest.publicArtifactAlias !== 'aio-v4-runtime.js' ||
    manifest.publicSha256Alias !== 'aio-v4-runtime.sha256') {
  throw new Error('Block-8.6-Release-Candidate muss den bestehenden oeffentlichen V4-Transportnamen verwenden.');
}
if (manifest.offlineReplayVerified !== true) {
  throw new Error('Block-8.6-Release-Candidate muss die bestandene Offline-/Replay-Stufe binden.');
}
for (const feld of ['deploymentPerformed', 'publicHttpsVerified']) {
  if (manifest[feld] !== true) throw new Error('Bestaetigter Deployment-/HTTPS-Nachweis fehlt fuer ' + feld + '.');
}
for (const feld of [
  'adventureLandShadowVerified',
  'adventureLandControlledLiveVerified',
  'adventureLandSoakVerified',
  'block86Completed',
  'block9Freigegeben'
]) {
  if (manifest[feld] !== false) throw new Error('Reale Adventure-Land-Freigabe muss bis zum separaten Nachweis false bleiben: ' + feld + '.');
}
if (manifest.nextOperationalStep !== 'adventure_land_shadow') {
  throw new Error('Naechster operativer Schritt muss adventure_land_shadow sein.');
}

const alt = manifest.immutableRuntime115;
if (!alt || alt.moduleCount !== 31 || alt.bytes !== 228607 ||
    alt.sha256 !== '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f') {
  throw new Error('Historische Runtime 1.1.5 ist im Block-8.6-Manifest nicht exakt gebunden.');
}

const evidence = manifest.offlineEvidence;
if (!evidence || evidence.pullRequest !== 407 || evidence.candidateHeadSha !== manifest.releaseSha) {
  throw new Error('Offline-Evidenz ist nicht an PR #407 und den exakten Candidate-Head gebunden.');
}
for (const [name, e, runId, runNumber, jobId] of [
  ['v4Ci', evidence.v4Ci, 35440445689, 383, 105890209278],
  ['v4GrundlagePruefen', evidence.v4GrundlagePruefen, 35440445635, 1630, 105890209231]
]) {
  if (!e || e.runId !== runId || e.runNumber !== runNumber || e.jobId !== jobId || e.conclusion !== 'success') {
    throw new Error('Offline-Evidenz besitzt unerwartete CI-Bindung fuer ' + name + '.');
  }
}
if (evidence.mainTests?.passed !== 626 || evidence.mainTests?.total !== 626 ||
    evidence.additionalChecks?.passed !== 37 || evidence.additionalChecks?.total !== 37 ||
    evidence.namingCheck !== 'passed' ||
    evidence.replayCoverage !== 'BLOCK-8-6-8-REPLAY-REGRESSION.md') {
  throw new Error('Offline-/Replay-Abnahme ist unvollstaendig gebunden.');
}

const deployment = manifest.deploymentEvidence;
if (!deployment ||
    deployment.workflow !== 'release-v4-block8-6-candidate-immutable' ||
    deployment.runId !== 35441831873 ||
    deployment.runNumber !== 4 ||
    deployment.jobId !== 105893861206 ||
    deployment.controlHeadSha !== '07e2af0f721219b50586b4c5e08cece717048610' ||
    deployment.releaseSha !== manifest.releaseSha ||
    deployment.sha256 !== manifest.sha256 ||
    deployment.r2Bucket !== 'aio-v3-logs' ||
    deployment.r2RuntimeKey !== 'releases/v4/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.js' ||
    deployment.r2Sha256Key !== 'releases/v4/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.sha256' ||
    deployment.publicRuntimeUrl !== 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.js' ||
    deployment.publicSha256Url !== 'https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/ca0dfee7685563c8b6003469300c8fd08777b053/aio-v4-runtime.sha256' ||
    deployment.conclusion !== 'success' ||
    deployment.completedAt !== '2026-09-19T12:05:07Z') {
  throw new Error('Deployment-/HTTPS-Evidenz ist nicht exakt an den erfolgreichen Block-8.6-Run gebunden.');
}

const gebaut = await baueBlock86Candidate({ schreiben: false });
if (gebaut.candidateVersion !== manifest.candidateVersion ||
    gebaut.module !== manifest.moduleCount ||
    gebaut.bytes !== manifest.bytes ||
    gebaut.sha256 !== manifest.sha256) {
  throw new Error('Aktueller Block-8.6-Candidate ist nicht bytegenau mit dem gebundenen Release-Candidate identisch.');
}
if (gebaut.immutableRuntime115.module !== alt.moduleCount ||
    gebaut.immutableRuntime115.bytes !== alt.bytes ||
    gebaut.immutableRuntime115.sha256 !== alt.sha256) {
  throw new Error('Candidate-Build bestaetigt die historische Runtime-1.1.5-Bindung nicht.');
}

for (const pflicht of [
  'name: release-v4-block8-6-candidate-immutable',
  'workflow_dispatch:',
  'release_sha:',
  'confirmation:',
  'PUBLISH-V4-BLOCK8-6:$RELEASE_SHA',
  'refs/heads/main',
  'ref: ${{ github.sha }}',
  'path: control',
  'ref: ${{ inputs.release_sha }}',
  'path: release',
  'BLOCK-8-6-9-RELEASE-CANDIDATE.json',
  "manifest.laufzeitPfadKennung !== 'block8.6-capability-runtime'",
  'manifest.offlineReplayVerified !== true',
  'npm run block8-6-candidate:bauen',
  'aio-v4-block8-6-candidate.js',
  'aio-v4-block8-6-candidate.sha256',
  'EXPECTED_MODULES',
  'baueBlock86Candidate',
  'Require Cloudflare credentials',
  'aio-v4-block8-6-release-only',
  'wrangler r2 bucket info "$R2_BUCKET"',
  '--config /tmp/wrangler-v4-block86-release.jsonc >/dev/null',
  '--remote',
  'wrangler r2 object get "$R2_BUCKET/$runtime_key"',
  'wrangler r2 object get "$R2_BUCKET/$sha_key"',
  'api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/r2/buckets/$R2_BUCKET/objects/$key',
  'if [ "$http_status" = "200" ]',
  'cmp "$file" "$temp"',
  'if [ "$http_status" != "404" ]',
  'wrangler r2 object put "$R2_BUCKET/$key"',
  'releases/v4/$RELEASE_SHA/aio-v4-runtime.js',
  'releases/v4/$RELEASE_SHA/aio-v4-runtime.sha256',
  'Verify immutable Block 8.6 objects from R2',
  'Verify immutable Block 8.6 candidate over existing public HTTPS worker',
  'x-aio-v4-release-sha',
  'access-control-allow-origin',
  'cache-control:.*no-store',
  'Cleanup isolated temporary files'
]) {
  if (!workflow.includes(pflicht)) throw new Error('Block-8.6-Release-Workflow fehlt: ' + pflicht);
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
  if (workflow.includes(verboten)) throw new Error('Block-8.6-Release-Workflow darf V3/Worker/D1/Lifecycle nicht veraendern: ' + verboten);
}
if (/^\s*push\s*:/m.test(workflow) || /^\s*pull_request\s*:/m.test(workflow)) {
  throw new Error('Block-8.6-Release-Workflow darf nur workflow_dispatch besitzen.');
}
const puts = workflow.match(/wrangler r2 object put/g) ?? [];
if (puts.length !== 1) throw new Error('Block-8.6-Release-Workflow braucht genau einen zentralen R2-put-Aufruf.');
if (workflow.includes('--experimental-auto-create') || workflow.includes('--experimental-provision')) {
  throw new Error('Block-8.6-Release-Workflow darf keine von Wrangler 4.135.0 fuer diesen Pfad unbestaetigten Experimental-Flags verwenden.');
}
const bucketInfoBlock = workflow.match(/npx wrangler r2 bucket info[\s\S]*?\/dev\/null/)?.[0] ?? '';
if (!bucketInfoBlock || bucketInfoBlock.includes('--remote')) {
  throw new Error('Wrangler r2 bucket info muss die in Produktion bestaetigte Syntax ohne --remote verwenden.');
}
const remoteObjectOps = workflow.match(/wrangler r2 object (?:put|get)[\s\S]*?--remote/g) ?? [];
if (remoteObjectOps.length !== 3) {
  throw new Error('Block-8.6-Release-Workflow muss --remote exakt fuer einen Object-Put und zwei Object-Gets verwenden.');
}
for (const pflicht of [
  'finaler Block-8.6-Candidate technisch gebunden',
  'immutable veröffentlicht und öffentlich per HTTPS verifiziert',
  '`ca0dfee7685563c8b6003469300c8fd08777b053`',
  '51 Module',
  '396471 Bytes',
  '`b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5`',
  'deploymentPerformed=true',
  'publicHttpsVerified=true',
  'adventureLandShadowVerified=false',
  'adventureLandControlledLiveVerified=false',
  'adventureLandSoakVerified=false',
  'block9Freigegeben=false',
  'PUBLISH-V4-BLOCK8-6:<release_sha>',
  'keine V3-Build-, V3-Release-, Worker-Deploy-, D1- oder Lifecycle-Autorität'
]) {
  if (!dokument.includes(pflicht)) throw new Error('Block-8.6-Release-Dokumentation fehlt: ' + pflicht);
}
for (const pflicht of [
  'Candidate-Deployment- und HTTPS-Nachweis',
  '`35441831873`',
  '`105893861206`',
  '`ca0dfee7685563c8b6003469300c8fd08777b053`',
  '`b5d39ac692157ec98c9c77cc7d4afca0b39a0b67abbabbcc31b863a6b0f77ea5`',
  '`deploymentPerformed=true`',
  '`publicHttpsVerified=true`',
  '`adventureLandShadowVerified=false`',
  'Adventure-Land-Schattenlauf'
]) {
  if (!deploymentDokument.includes(pflicht)) throw new Error('Block-8.6-Deployment-Nachweis fehlt: ' + pflicht);
}

console.log(
  'Block 8.6.9 Release-Bindung geprueft: exakter gruener Candidate ' +
  manifest.releaseSha +
  ', 51 Module / 396471 Bytes / SHA-256 ' +
  manifest.sha256 +
  '; Offline/Replay sowie Deployment/HTTPS gebunden; Schatten/Live/Soak bleiben gesperrt.'
);
