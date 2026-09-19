import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { baueProduktionsRuntime } from './produktions-runtime-bauen.mjs';

const wurzel = process.cwd();
const manifestPfad = path.join(
  wurzel,
  'dokumentation',
  'BLOCK-8-5-RUNTIME-1-1-5-RELEASE-CANDIDATE.json'
);
const einstiegPfad = path.join(
  wurzel,
  'laufzeit',
  'quelle',
  'ausfuehrung',
  'adventure-land-produktions-einstieg.ts'
);
const workflowPfad = path.join(
  wurzel,
  '..',
  '.github',
  'workflows',
  'release-v4-runtime.yml'
);

const manifest = JSON.parse(await readFile(manifestPfad, 'utf8'));
const einstieg = await readFile(einstiegPfad, 'utf8');
const workflow = await readFile(workflowPfad, 'utf8');

if (manifest.schemaVersion !== 1) throw new Error('Release-Candidate besitzt eine unbekannte schemaVersion.');
if (manifest.status !== 'release_candidate') throw new Error('Release-Candidate-Status muss release_candidate sein.');
if (!/^[a-f0-9]{40}$/.test(manifest.releaseSha)) {
  throw new Error('Release-Candidate releaseSha muss ein exakter lowercase Git-SHA sein.');
}
if (manifest.runtimeVersion !== '1.1.5') throw new Error('Release-Candidate muss Runtime 1.1.5 binden.');
if (manifest.laufzeitPfadKennung !== 'block8.5-basisbedienung-runtime') {
  throw new Error('Release-Candidate ist nicht an den erwarteten Block-8.5-Laufzeitpfad gebunden.');
}
if (manifest.aenderungsKennung !== `git:${manifest.releaseSha}`) {
  throw new Error('Release-Candidate aenderungsKennung muss exakt git:<releaseSha> entsprechen.');
}
if (manifest.bundleVersion !== '4.0.0-alpha.0') {
  throw new Error('Release-Candidate besitzt eine unerwartete Bundle-Version.');
}
if (!Number.isSafeInteger(manifest.moduleCount) || manifest.moduleCount <= 0) {
  throw new Error('Release-Candidate moduleCount ist ungueltig.');
}
if (!Number.isSafeInteger(manifest.bytes) || manifest.bytes <= 10_000) {
  throw new Error('Release-Candidate bytes ist ungueltig.');
}
if (!/^[a-f0-9]{64}$/.test(manifest.sha256)) {
  throw new Error('Release-Candidate sha256 ist ungueltig.');
}

for (const feld of ['deploymentPerformed', 'publicHttpsVerified']) {
  if (manifest[feld] !== true) {
    throw new Error(`Release-Candidate muss den bestaetigten Deployment-/HTTPS-Nachweis fuer ${feld} tragen.`);
  }
}
if (manifest.adventureLandShadowVerified !== true) {
  throw new Error('Release-Candidate muss den real bestandenen Adventure-Land-Schattennachweis tragen.');
}
if (manifest.adventureLandControlledLiveVerified !== true) {
  throw new Error('Release-Candidate muss den real bestandenen kontrollierten Adventure-Land-Live-Nachweis tragen.');
}
for (const feld of [
  'adventureLandSoakVerified',
  'block9Freigegeben',
  'block85Completed'
]) {
  if (manifest[feld] !== true) {
    throw new Error(`Release-Candidate muss den real bestandenen vollstaendigen Block-8.5-Nachweis fuer ${feld} tragen.`);
  }
}
if (manifest.nextDevelopmentBlock !== '8.6') {
  throw new Error('Release-Candidate muss nach Block 8.5 den aktualisierten Fahrplan mit Block 8.6 als naechstem Entwicklungsblock tragen.');
}
if (manifest.block9RoadmapStartApproved !== false) {
  throw new Error('Das historische 8.5-Gate darf den aktualisierten Fahrplan nicht umgehen: Block 9 bleibt bis Block 8.6 gesperrt.');
}
if (!manifest.shadowEvidence || typeof manifest.shadowEvidence !== 'object') {
  throw new Error('Release-Candidate braucht den kanonisch gebundenen SchattenEvidence-Nachweis.');
}
for (const [feld, erwartet] of Object.entries({
  reportFile: 'Eingefügter Text(20260918-234800).txt',
  reportBytes: 10123,
  reportSha256: '78af6a837af689e786c5166d49624f194ad72d888f76f7712012073c1675d8c1',
  reportCreatedAt: '2026-09-18T23:47:54.673Z',
  performedAt: 1789775267498,
  laufKennung: 'block8-5-schatten-1789775266269',
  evidenceFile: 'BLOCK-8-5-SCHATTEN-FREIGABE-NACHWEIS.json'
})) {
  if (manifest.shadowEvidence[feld] !== erwartet) {
    throw new Error(`Release-Candidate shadowEvidence besitzt unerwarteten Wert fuer ${feld}.`);
  }
}

if (!manifest.controlledLiveEvidence || typeof manifest.controlledLiveEvidence !== 'object') {
  throw new Error('Release-Candidate braucht den kanonisch gebundenen kontrollierten Live-Nachweis.');
}
for (const [feld, erwartet] of Object.entries({
  source: 'chat_paste',
  reportCreatedAt: '2026-09-19T00:04:55.339Z',
  performedAt: 1789776285337,
  laufKennung: 'block8-5-schatten-1789775266269',
  runnerVersion: '1.1.0',
  evidenceFile: 'BLOCK-8-5-KONTROLLIERT-LIVE-FREIGABE-NACHWEIS.json'
})) {
  if (manifest.controlledLiveEvidence[feld] !== erwartet) {
    throw new Error(`Release-Candidate controlledLiveEvidence besitzt unerwarteten Wert fuer ${feld}.`);
  }
}

if (!manifest.soakEvidence || typeof manifest.soakEvidence !== 'object') {
  throw new Error('Release-Candidate braucht den kanonisch gebundenen Soak-Nachweis.');
}
for (const [feld, erwartet] of Object.entries({
  source: 'chat_paste',
  reportCreatedAt: '2026-09-19T07:28:36.564Z',
  performedAt: 1789802325319,
  laufKennung: 'block8-5-schatten-1789775266269',
  durationMs: 600000,
  samples: 120,
  expectedSamples: 118,
  heartbeatSuccessesBefore: 4,
  heartbeatSuccessesAfter: 304,
  heartbeatErrorsBefore: 0,
  heartbeatErrorsAfter: 0,
  evidenceFile: 'BLOCK-8-5-SOAK-FREIGABE-NACHWEIS.json'
})) {
  if (manifest.soakEvidence[feld] !== erwartet) {
    throw new Error(`Release-Candidate soakEvidence besitzt unerwarteten Wert fuer ${feld}.`);
  }
}

if (!manifest.deploymentEvidence || typeof manifest.deploymentEvidence !== 'object') {
  throw new Error('Release-Candidate braucht den bestaetigten DeploymentEvidence-Nachweis.');
}
for (const [feld, erwartet] of Object.entries({
  workflow: 'deploy-cloudflare',
  runId: 35402650432,
  jobId: 105785689083,
  releaseSha: manifest.releaseSha,
  sha256: manifest.sha256,
  publicRuntimeUrl: `https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/${manifest.releaseSha}/aio-v4-runtime.js`,
  publicSha256Url: `https://aio-bot-dashboard.hansijuergenlul.workers.dev/v4/releases/${manifest.releaseSha}/aio-v4-runtime.sha256`
})) {
  if (manifest.deploymentEvidence[feld] !== erwartet) {
    throw new Error(`Release-Candidate DeploymentEvidence besitzt unerwarteten Wert fuer ${feld}.`);
  }
}

if (!einstieg.includes("PRODUKTIONS_LAUFZEIT_VERSION = '1.1.5'")) {
  throw new Error('Produktionsruntime-Quelle ist nicht Runtime 1.1.5.');
}

for (const pflicht of [
  'name: release-v4-runtime-immutable',
  'workflow_dispatch:',
  'release_sha:',
  'confirmation:',
  'PUBLISH-V4-IMMUTABLE:$RELEASE_SHA',
  'ref: ${{ inputs.release_sha }}',
  'BLOCK-8-5-RUNTIME-1-1-5-RELEASE-CANDIDATE.json',
  'npm run produktions-runtime:bauen',
  '--experimental-auto-create=false',
  '--experimental-provision=false',
  'releases/v4/$RELEASE_SHA/aio-v4-runtime.js',
  'Verify immutable V4 objects from R2',
  'Verify immutable V4 release over existing public HTTPS worker',
  'x-aio-v4-release-sha'
]) {
  if (!workflow.includes(pflicht)) {
    throw new Error(`Deployment-Workflow besitzt die erforderliche immutable Release-Sicherung nicht: ${pflicht}`);
  }
}

const build = await baueProduktionsRuntime({ schreiben: false });

if (build.module !== manifest.moduleCount) {
  throw new Error(
    `Release-Candidate moduleCount stimmt nicht: erwartet ${manifest.moduleCount}, gebaut ${build.module}.`
  );
}
if (build.bytes !== manifest.bytes) {
  throw new Error(
    `Release-Candidate bytes stimmt nicht: erwartet ${manifest.bytes}, gebaut ${build.bytes}.`
  );
}
if (build.sha256 !== manifest.sha256) {
  throw new Error(
    `Release-Candidate SHA-256 stimmt nicht: erwartet ${manifest.sha256}, gebaut ${build.sha256}.`
  );
}

console.log(
  `Runtime-1.1.5 Release-Candidate reproduzierbar: ${build.module} Module, ${build.bytes} Bytes, SHA-256 ${build.sha256}; Deployment/HTTPS, Offline, Schatten, kontrolliert live und Soak sind bestaetigt; das historische Block-8.5-Gate ist vollstaendig bestanden, naechster Entwicklungsblock ist 8.6.`
);
