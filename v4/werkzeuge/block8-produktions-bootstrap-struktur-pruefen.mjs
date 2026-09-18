import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const dateien = [
  'laufzeit/quelle/ausfuehrung/adventure-land-produktions-bootstrap.ts',
  'laufzeit/quelle/ausfuehrung/adventure-land-produktions-einstieg.ts',
  'laufzeit/tests/block8-produktions-bootstrap.test.mjs',
  'laufzeit/tests/block8-produktions-einstieg.test.mjs',
  'laufzeit/tests/block8-produktions-loader.test.mjs',
  'laufzeit/tests/block8-produktions-runtime-bundle.test.mjs',
  'werkzeuge/adventure-land-v4-bootstrap.js',
  'werkzeuge/produktions-runtime-bauen.mjs',
  'dokumentation/BLOCK-8-PRODUKTIONS-BOOTSTRAP.md'
];
for (const relativ of dateien) await access(path.join(wurzel, relativ));

const bootstrap = await readFile(path.join(wurzel, dateien[0]), 'utf8');
for (const pflicht of [
  'new AktionsSteuerung()',
  'new AdventureLandLesezugriff',
  'beobachteSpielzustand',
  'planeKampfSicherheitsSchritt',
  'erstelleGruppenTeilnehmerMeldungAusKampfsicherheit',
  'AdventureLandGruppenLebensnachweisAustausch',
  'koordiniereGruppe',
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

const tests = await readFile(path.join(wurzel, 'laufzeit/tests/block8-produktions-bootstrap.test.mjs'), 'utf8');
for (const pflicht of [
  'startet standardmaessig gesperrt',
  'berechnet lokalen Lebensnachweis aus echter Produktions-Safety',
  'nutzt vorhandenen vertrauensgebundenen Empfang fuer reale Gruppenplanung',
  'verwirft replayte und zeitlich aeltere Remote-Meldungen',
  'blockiert doppelte Teilnehmerkennungen',
  'blockiert Solo-Zielauftrag ohne zweiten frischen Gruppenteilnehmer',
  'blockiert Gruppenziel wenn der zweite Teilnehmer veraltet ist',
  'installiert Live-Smoke nur fuer den exakt vorbereiteten zentralen Zielauftrag',
  'stoppt Empfang, Smoke und laufende Gruppenarbeit fail-safe'
]) {
  if (!tests.includes(pflicht)) throw new Error(`Produktions-Bootstrap-Test fehlt: ${pflicht}`);
}

console.log('Block 8 Produktions-Bootstrap geprueft: eine zentrale AktionsSteuerung, mindestens zwei frische Teilnehmer, monotone Lebensnachweise, one-shot Vorbereitung, echte Safety, passiver Laufzeiteinstieg, HTTPS+SHA-256-Loader und reproduzierbares Bundle.');
