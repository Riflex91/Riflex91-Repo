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
  'deploy-cloudflare.yml'
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

for (const feld of [
  'deploymentPerformed',
  'publicHttpsVerified',
  'adventureLandShadowVerified',
  'adventureLandControlledLiveVerified',
  'adventureLandSoakVerified',
  'block9Freigegeben'
]) {
  if (manifest[feld] !== false) {
    throw new Error(`Release-Candidate darf ${feld} noch nicht als bestanden markieren.`);
  }
}

if (!einstieg.includes("PRODUKTIONS_LAUFZEIT_VERSION = '1.1.5'")) {
  throw new Error('Produktionsruntime-Quelle ist nicht Runtime 1.1.5.');
}

for (const pflicht of [
  'workflow_dispatch:',
  'release_sha:',
  'ref: ${{ inputs.release_sha || github.sha }}',
  'Build and verify V4 production runtime artifacts',
  'Publish immutable V4 runtime release to R2',
  'releases/v4/$RELEASE_SHA/aio-v4-runtime.js',
  'Verify immutable V4 runtime release in R2',
  'Verify immutable V4 runtime release over public HTTPS',
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
  `Runtime-1.1.5 Release-Candidate reproduzierbar: ${build.module} Module, ${build.bytes} Bytes, SHA-256 ${build.sha256}; Deployment und reale Adventure-Land-Freigaben bleiben offen.`
);
