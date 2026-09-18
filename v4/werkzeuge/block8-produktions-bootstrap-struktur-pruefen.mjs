import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const repoWurzel = path.resolve(wurzel, '..');
const dateien = [
  'laufzeit/quelle/ausfuehrung/adventure-land-produktions-bootstrap.ts',
  'laufzeit/quelle/ausfuehrung/adventure-land-produktions-einstieg.ts',
  'laufzeit/quelle/ausfuehrung/adventure-land-gruppen-lebensnachweis-austausch.ts',
  'laufzeit/tests/block8-produktions-bootstrap.test.mjs',
  'laufzeit/tests/block8-produktions-einstieg.test.mjs',
  'laufzeit/tests/block8-lebensnachweis-austausch.test.mjs',
  'laufzeit/tests/block8-produktions-loader.test.mjs',
  'laufzeit/tests/block8-produktions-runtime-bundle.test.mjs',
  'werkzeuge/adventure-land-v4-bootstrap.js',
  'werkzeuge/produktions-runtime-bauen.mjs',
  'dokumentation/BLOCK-8-PRODUKTIONS-BOOTSTRAP.md'
];
for (const relativ of dateien) await access(path.join(wurzel, relativ));

const bootstrap = await readFile(path.join(wurzel, dateien[0]), 'utf8');
for (const pflicht of [
  'new LaufzeitSteuerung()',
  'new AktionsSteuerung({ laufzeitSteuerung: this.laufzeitSteuerung })',
  'new AdventureLandLesezugriff',
  'beobachteSpielzustand',
  'planeKampfSicherheitsSchritt',
  'erstelleGruppenTeilnehmerMeldungAusKampfsicherheit',
  'AdventureLandGruppenLebensnachweisAustausch',
  'koordiniereGruppe',
  'PRODUKTIONS_GRUPPEN_LEBENSNACHWEIS_MAXIMAL_ALTER_MILLIS = 8_000',
  'gruppenLebensnachweisMaximalAlterMillisekunden',
  'laufzeitSteuerung: this.laufzeitSteuerung.status()',
  'holeLaufzeitSteuerung()',
  'planeGruppenAktionen',
  'uebersetzeEigeneGruppenPlanSchritte',
  "freigegebeneArten: ['gemeinsames_ziel_bearbeiten']",
  'uebergibGruppenAktionsAnfragenAnSteuerung',
  'GRUPPEN_AKTIONS_NAMEN.gemeinsamesZielBearbeiten',
  'installiereAdventureLandGruppenZielLiveSmoke',
  'MINDESTENS_AKTIVE_GRUPPEN_TEILNEHMER = 2',
  'gruppenZielVorbereitungVerbraucht',
  'neu.gesendetAm < vorher.gesendetAm',
  'neu.laufendeNummer <= vorher.laufendeNummer',
  'Doppelte Gruppen-Teilnehmerkennung',
  'pruefeGruppenZustand',
  'Produktions-Gruppendiagnosezeitpunkt',
  'lokalerLebensnachweis',
  'koordination',
  'genau eine laufende zentrale Gruppenzielanfrage',
  'this.gestoppt = true',
  'Produktions-Sicherheitszeit darf nicht rueckwaerts laufen.',
  'Produktions-Bootstrap wurde gestoppt; Gruppenarbeit wird fail-safe beendet.'
]) {
  if (!bootstrap.includes(pflicht)) throw new Error(`Produktions-Bootstrap verletzt Pflichtkette: ${pflicht}`);
}
for (const verboten of [
  'reicheAnfrageEin(',
  "angefordertVon: 'gruppen-aktionsplanung'",
  "aktion: 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN'"
]) {
  if (bootstrap.includes(verboten)) {
    throw new Error(`Produktions-Bootstrap darf keine fertige Gruppen-AktionsAnfrage konstruieren oder direkt einreichen: ${verboten}`);
  }
}
for (const aktionsName of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'use_hp_or_mp', 'loot', 'command_character', 'send_party_invite']) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(bootstrap)) {
    throw new Error(`Produktions-Bootstrap darf Adventure Land nicht direkt aufrufen: ${aktionsName}.`);
  }
}

const einstieg = await readFile(path.join(wurzel, dateien[1]), 'utf8');
for (const pflicht of [
  "PRODUKTIONS_LAUFZEIT_GLOBALER_NAME = 'V4ProduktionsLaufzeit'",
  'installiereAdventureLandProduktionsLaufzeit',
  'aktivFreigegeben === true',
  'explizites Gruppenfaehigkeitsprofil',
  'bootstrap.installiereLebensnachweisEmpfang()',
  "PRODUKTIONS_LEBENSNACHWEIS_INTERVALL_MILLIS = 2_000",
  'starteLebensnachweisTimer',
  'pausiereLebensnachweisAutomatik',
  'setzeLebensnachweisAutomatikFort',
  'lebensnachweisSendeErfolge',
  'lebensnachweisSendeFehler',
  'performanceTrickErforderlich',
  'performanceTrickVerfuegbar',
  'performanceTrickAufgerufen',
  'performanceTrickLetzterFehler',
  "Reflect.get(codeKontext, 'performance_trick')",
  'aktivierePerformanceTrick();',
  'bootstrap.pruefeGruppenZustand()',
  "PRODUKTIONS_LAUFZEIT_VERSION = '1.1.5'",
  'new SichereBasisBedienung',
  'bootstrap.holeLaufzeitSteuerung()',
  'bootstrap.holeZentraleAktionsSteuerung()',
  'basisBedienStatus',
  'erstelleBasisBedienAnfrage',
  'fuehreBasisBedienAnfrage',
  'pruefeBasisBedienMutation',
  'erwarteteLaufzeitGeneration',
  'ausdruecklichBestaetigt',
  'bootstrap.bereiteGruppenZielVor',
  'bootstrap.installiereGruppenZielLiveSmoke',
  'bootstrap.stoppe()',
  'Object.freeze'
]) {
  if (!einstieg.includes(pflicht)) throw new Error(`Produktions-Laufzeiteinstieg ist unvollstaendig: ${pflicht}`);
}
for (const aktionsName of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite']) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(einstieg)) {
    throw new Error(`Produktions-Laufzeiteinstieg darf Adventure Land nicht direkt aufrufen: ${aktionsName}.`);
  }
}

const austausch = await readFile(path.join(wurzel, dateien[2]), 'utf8');
for (const pflicht of [
  "['receivers', 'locals']",
  'bestaetigteCmEmpfaenger',
  'send_cm hat den Zielcharakter nicht als Empfaenger bestaetigt',
  'send_cm hat den vertrauten Zielcharakter als Empfaenger bestaetigt'
]) {
  if (!austausch.includes(pflicht)) throw new Error(`Lebensnachweis-Austausch fehlt Zustellbestaetigung: ${pflicht}`);
}

const einstiegTests = await readFile(path.join(wurzel, dateien[4]), 'utf8');
for (const pflicht of [
  'besitzt autonomen 2s-Heartbeat mit Pause Fortsetzen und Transportmetriken',
  'blockiert aktive Browserlaufzeit fail-safe ohne performance_trick',
  'verlangt performance_trick nicht in Adventure Lands Desktoplaufzeit',
  'zaehlt fehlende send_cm-Empfaengerbestaetigung als Heartbeat-Fehler',
  'bietet nur den gesicherten Basisbedienungs-Kanal',
  'Bot-Pause laeuft durch BedienSicherung und laesst Produktionsheartbeat aktiv',
  'blockiert stale Basisbedienung an der aktuellen Generation',
  'gesperrte oder gestoppte Produktionsruntime erlaubt nur read-only Diagnose'
]) {
  if (!einstiegTests.includes(pflicht)) throw new Error(`Produktions-Laufzeiteinstieg-Test fehlt: ${pflicht}`);
}

const austauschTests = await readFile(path.join(wurzel, dateien[5]), 'utf8');
if (!austauschTests.includes('fehlende send_cm-Empfaengerbestaetigung gilt als Sendefehler')) {
  throw new Error('Lebensnachweis-Austausch-Test fuer fehlende Empfaengerbestaetigung fehlt.');
}

const loader = await readFile(path.join(wurzel, 'werkzeuge/adventure-land-v4-bootstrap.js'), 'utf8');
for (const pflicht of [
  'AIO_V4_BOOTSTRAP_CONFIG',
  'runtimeUrl',
  'runtimeUrl fehlt',
  'runtimeSha256',
  'runtimeSha256 fehlt',
  'HTTPS-URL',
  'berechneSha256',
  "subtle.digest('SHA-256'",
  'Adventure Land AiO Bot V4 | generated | production runtime',
  'V4ProduktionsLaufzeit',
  "cache: 'no-store'",
  '(0, eval)(code)'
]) {
  if (!loader.includes(pflicht)) throw new Error(`Adventure-Land-V4-Loader ist unvollstaendig: ${pflicht}`);
}
if (/https?:\/\//.test(loader)) throw new Error('Der V4-Loader darf keine erfundene oder fest verdrahtete Runtime-URL enthalten.');
for (const aktionsName of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite']) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(loader)) {
    throw new Error(`Adventure-Land-V4-Loader darf keine Spielaktion aufrufen: ${aktionsName}.`);
  }
}

const bundler = await readFile(path.join(wurzel, 'werkzeuge/produktions-runtime-bauen.mjs'), 'utf8');
for (const pflicht of [
  "import { execFile } from 'node:child_process'",
  "import { createHash } from 'node:crypto'",
  "node_modules', 'typescript', 'bin', 'tsc'",
  "module: 'NodeNext'",
  "moduleResolution: 'NodeNext'",
  'strict: true',
  'exactOptionalPropertyTypes: true',
  'noEmitOnError: true',
  'Externer Runtime-Import ist nicht erlaubt',
  'Adventure Land AiO Bot V4 | generated | production runtime',
  'entry.installiereAdventureLandProduktionsLaufzeit',
  "createHash('sha256')",
  'aio-v4-runtime.sha256',
  '--pruefen'
]) {
  if (!bundler.includes(pflicht)) throw new Error(`V4-Produktionsruntime-Bundler ist unvollstaendig: ${pflicht}`);
}

const allgemeinerDeployWorkflow = await readFile(
  path.join(repoWurzel, '.github/workflows/deploy-cloudflare.yml'),
  'utf8'
);
for (const pflicht of [
  '"cloudflare-dashboard/**"',
  '"v3/**"',
  'Build V3 bootstrap and runtime artifacts',
  'Deploy Worker and dashboard',
  'Publish V3 release artifacts to R2',
  'Verify V3 release artifacts in R2'
]) {
  if (!allgemeinerDeployWorkflow.includes(pflicht)) {
    throw new Error(`Allgemeiner V3/Dashboard-Deploy-Workflow ist unvollstaendig: ${pflicht}`);
  }
}
for (const verboten of [
  '"v4/**"',
  'Install V4 build dependencies',
  'Build and verify V4 production runtime artifacts',
  'Publish immutable V4 runtime release to R2',
  'releases/v4/',
  'Verify immutable V4 runtime release in R2',
  'Verify immutable V4 runtime release over public HTTPS',
  'aio-v4-runtime.js',
  'aio-v4-runtime.sha256'
]) {
  if (allgemeinerDeployWorkflow.includes(verboten)) {
    throw new Error(`Allgemeiner V3/Dashboard-Deploy-Workflow darf keinen V4-Release-Pfad mehr besitzen: ${verboten}`);
  }
}
const allgemeineCleanupTreffer =
  allgemeinerDeployWorkflow.match(/- name: Remove temporary deploy config/g) ?? [];
if (allgemeineCleanupTreffer.length !== 1) {
  throw new Error(
    `Allgemeiner V3/Dashboard-Deploy-Workflow muss genau einen Cleanup-Schritt enthalten; gefunden: ${allgemeineCleanupTreffer.length}.`
  );
}

const v4ReleaseWorkflow = await readFile(
  path.join(repoWurzel, '.github/workflows/release-v4-runtime.yml'),
  'utf8'
);
for (const pflicht of [
  'name: release-v4-runtime-immutable',
  'workflow_dispatch:',
  'release_sha:',
  'confirmation:',
  'PUBLISH-V4-IMMUTABLE:$RELEASE_SHA',
  'BLOCK-8-5-RUNTIME-1-1-5-RELEASE-CANDIDATE.json',
  'npm run produktions-runtime:bauen',
  '--experimental-auto-create=false',
  '--experimental-provision=false',
  'releases/v4/$RELEASE_SHA/aio-v4-runtime.js',
  'releases/v4/$RELEASE_SHA/aio-v4-runtime.sha256',
  'Verify immutable V4 objects from R2',
  'Verify immutable V4 release over existing public HTTPS worker',
  'x-aio-v4-release-sha',
  'access-control-allow-origin',
  'cache-control:.*no-store'
]) {
  if (!v4ReleaseWorkflow.includes(pflicht)) {
    throw new Error(`Isolierter V4-Release-Workflow ist unvollstaendig: ${pflicht}`);
  }
}
for (const verboten of [
  'push:',
  'pull_request:',
  'wrangler deploy',
  'wrangler d1',
  'bucket lifecycle',
  'releases/v3/',
  'working-directory: v3'
]) {
  if (v4ReleaseWorkflow.includes(verboten)) {
    throw new Error(`Isolierter V4-Release-Workflow darf keinen automatischen oder V3/Worker/D1/Lifecycle-Pfad besitzen: ${verboten}`);
  }
}

const releaseHandler = await readFile(path.join(repoWurzel, 'cloudflare-dashboard/src/v4-runtime-release-artifact.js'), 'utf8');
for (const pflicht of [
  '/v4/releases/',
  '[0-9a-f]{40}',
  'aio-v4-runtime.js',
  'aio-v4-runtime.sha256',
  'releases/v4/',
  'access-control-allow-origin',
  'no-store, max-age=0',
  'x-aio-v4-release-sha'
]) {
  if (!releaseHandler.includes(pflicht)) throw new Error(`V4-Cloudflare-Release-Handler ist unvollstaendig: ${pflicht}`);
}

const tests = await readFile(path.join(wurzel, 'laufzeit/tests/block8-produktions-bootstrap.test.mjs'), 'utf8');
for (const pflicht of [
  'startet standardmaessig gesperrt',
  'berechnet lokalen Lebensnachweis aus echter Produktions-Safety',
  'nutzt vorhandenen vertrauensgebundenen Empfang fuer reale Gruppenplanung',
  'Produktions-Gruppendiagnose beobachtet aktiv stale reconnect und Aufgabenwechsel ohne zentrale Aktion',
  'Produktions-Gruppendiagnose misst Remote-Freshness ab lokalem Empfang statt Senderuhr',
  'gruppenLebensnachweisMaximalAlterMillisekunden, 8_000',
  'verwirft replayte und zeitlich aeltere Remote-Meldungen',
  'blockiert doppelte Teilnehmerkennungen',
  'blockiert Solo-Zielauftrag ohne zweiten frischen Gruppenteilnehmer',
  'blockiert Gruppenziel wenn der zweite Teilnehmer seit lokalem Empfang veraltet ist',
  'installiert Live-Smoke nur fuer den exakt vorbereiteten zentralen Zielauftrag',
  'stoppt Empfang, Smoke und laufende Gruppenarbeit fail-safe',
  'teilt exakt eine LaufzeitSteuerung mit der zentralen AktionsSteuerung'
]) {
  if (!tests.includes(pflicht)) throw new Error(`Produktions-Bootstrap-Test fehlt: ${pflicht}`);
}

console.log('Block 8/8.5 Produktions-Bootstrap geprueft: gemeinsame Laufzeit-/AktionsSteuerung, sichere Basisbedienung ueber BedienSicherung, Browser-performance_trick-Preflight, autonomer 2s-Produktionsheartbeat getrennt von Bot-Pause, bestaetigte send_cm-Empfaengerliste, read-only Gruppendiagnose, 8s Live-TTL, Zwei-Teilnehmer-Gate, one-shot Vorbereitung, HTTPS+SHA-256-Loader sowie getrennte V3/Dashboard- und manuelle immutable V4-Release-Workflows.');
