import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const dateien = [
  'laufzeit/quelle/vertraege/entscheidungs-datensatz.ts',
  'laufzeit/quelle/telemetrie/gruppen-entscheidungs-datensatz.ts',
  'laufzeit/quelle/telemetrie/entscheidungs-aktions-korrelation.ts',
  'laufzeit/quelle/vertraege/runtime-gesundheit.ts',
  'laufzeit/quelle/telemetrie/runtime-gesundheit.ts',
  'laufzeit/tests/block8-5-entscheidungs-datensatz.test.mjs',
  'laufzeit/tests/block8-5-entscheidungs-aktions-korrelation.test.mjs',
  'laufzeit/tests/block8-5-runtime-gesundheit.test.mjs',
  'dokumentation/BLOCK-8-5-ENTSCHEIDUNGSDATENSATZ.md',
  'dokumentation/BLOCK-8-5-ENTSCHEIDUNG-AKTION-ERGEBNIS.md',
  'dokumentation/BLOCK-8-5-RUNTIMEGESUNDHEIT.md',
  'dokumentation/BLOCK-8-5-WISSENSTRANSFER-V3-V4.md',
  'dokumentation/BLOCK-8-5-PLAN.md'
];

for (const relativ of dateien) await access(path.join(wurzel, relativ));

const vertrag = await readFile(path.join(wurzel, dateien[0]), 'utf8');
for (const pflicht of [
  'EntscheidungsDatensatz',
  'schemaVersion: 1',
  'eingabeFingerabdruck',
  'fachlicherFingerabdruck',
  'aktionsAnfrageKennungen',
  'tatsaechlichesErgebnis'
]) {
  if (!vertrag.includes(pflicht)) throw new Error(`EntscheidungsDatensatz-Vertrag fehlt: ${pflicht}`);
}

const gruppenDatensatz = await readFile(path.join(wurzel, dateien[1]), 'utf8');
for (const pflicht of [
  'erstelleGruppenEntscheidungsDatensatz',
  'kanonisiereJson',
  'berechneSha256',
  'gesendetAm',
  'laufendeNummer',
  'koordinationsStatus',
  'aktionsAnfrageKennungen: Object.freeze([])',
  'tatsaechlichesErgebnis: null'
]) {
  if (!gruppenDatensatz.includes(pflicht)) throw new Error(`Gruppen-EntscheidungsDatensatz fehlt: ${pflicht}`);
}

for (const verboten of ['Date.now(', 'Math.random(']) {
  if (gruppenDatensatz.includes(verboten)) {
    throw new Error(`EntscheidungsDatensatz darf keine versteckte Laufzeiteingabe verwenden: ${verboten}`);
  }
}

for (const aktionsName of [
  'attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp',
  'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite',
  'buy', 'sell', 'send_item', 'upgrade', 'compound'
]) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(gruppenDatensatz)) {
    throw new Error(`EntscheidungsDatensatz darf keine Adventure-Land-Aktion aufrufen: ${aktionsName}.`);
  }
}

const korrelation = await readFile(path.join(wurzel, dateien[2]), 'utf8');
for (const pflicht of [
  'verknuepfeGruppenEntscheidungMitAktionsAnfragen',
  'werteGruppenEntscheidungMitAktionsZustaendenAus',
  'werteGruppenEntscheidungMitAktionsErgebnissenAus',
  "angefordertVon !== 'gruppen-aktionsplanung'",
  'planZeitpunkt !== datensatz.zeitpunkt',
  'tatsaechlichesErgebnis'
]) {
  if (!korrelation.includes(pflicht)) throw new Error(`Entscheidungs-Aktions-Korrelation fehlt: ${pflicht}`);
}
for (const aktionsName of [
  'attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp',
  'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite',
  'buy', 'sell', 'send_item', 'upgrade', 'compound'
]) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(korrelation)) {
    throw new Error(`Entscheidungs-Aktions-Korrelation darf keine Adventure-Land-Aktion aufrufen: ${aktionsName}.`);
  }
}
if (/\.reicheAnfrageEin\s*\(|\.verarbeiteNaechsteAktion\s*\(/.test(korrelation)) {
  throw new Error('Entscheidungs-Aktions-Korrelation darf die zentrale AktionsSteuerung nicht selbst antreiben.');
}

const tests = await readFile(path.join(wurzel, dateien[5]), 'utf8');
for (const pflicht of [
  'Gruppenentscheidung ist versioniert erklaerbar und zunaechst aktionsfrei',
  'Zeitstempel und laufende Nummer veraendern fachliche Fingerabdruecke nicht',
  'Eingabereihenfolge veraendert fachliche Fingerabdruecke nicht',
  'fachliche Aenderung veraendert den Fingerabdruck',
  'Freshness-Klasse ist fachlich relevant aber exaktes Alter nicht',
  'ungueltige Metadaten werden fail-safe abgewiesen'
]) {
  if (!tests.includes(pflicht)) throw new Error(`EntscheidungsDatensatz-Test fehlt: ${pflicht}`);
}

const dokument = await readFile(path.join(wurzel, dateien[8]), 'utf8');
for (const pflicht of [
  '8.5.1 implementiert',
  '8.5.2',
  'keine AktionsAnfrage',
  'Date.now()',
  'Freshness-Klasse'
]) {
  if (!dokument.includes(pflicht)) throw new Error(`EntscheidungsDatensatz-Dokumentation fehlt: ${pflicht}`);
}

const korrelationsTests = await readFile(path.join(wurzel, dateien[6]), 'utf8');
for (const pflicht of [
  'EntscheidungsDatensatz wird read-only mit echter Gruppen-AktionsAnfrage verknuepft',
  'Korrelation startet oder reicht selbst keine Aktion ein',
  'zentrale AktionsSteuerung bleibt Autoritaet und Ergebnis wird danach beobachtet',
  'AktionsErgebnis desselben Ablaufs kann eindeutig korreliert werden',
  'fremdes AktionsErgebnis wird nicht als eigenes Ergebnis erfunden',
  'falscher Planzeitpunkt oder fremde Herkunft wird fail-safe abgewiesen',
  'Entscheidung ohne AktionsAnfrage wird explizit als keine Aktion ausgewertet'
]) {
  if (!korrelationsTests.includes(pflicht)) throw new Error(`Entscheidungs-Aktions-Korrelationstest fehlt: ${pflicht}`);
}

const korrelationsDokument = await readFile(path.join(wurzel, dateien[9]), 'utf8');
for (const pflicht of [
  '8.5.2 implementiert',
  'AktionsSteuerung bleibt Autoritaet',
  'AktionsLaufZustand',
  'AktionsErgebnis',
  'keine AktionsAnfrage ein'
]) {
  if (!korrelationsDokument.includes(pflicht)) throw new Error(`Entscheidungs-Aktions-Dokumentation fehlt: ${pflicht}`);
}

const gesundheitsVertrag = await readFile(path.join(wurzel, dateien[3]), 'utf8');
for (const pflicht of [
  'RECOVERY_STUFEN',
  "'normal'",
  "'beobachten'",
  "'sicher_pausiert'",
  "'neustart_empfohlen'",
  "'blockiert'",
  'hostNeustartEmpfohlen',
  'automatischerNeustart: false'
]) {
  if (!gesundheitsVertrag.includes(pflicht)) throw new Error(`RuntimeGesundheits-Vertrag fehlt: ${pflicht}`);
}

const gesundheit = await readFile(path.join(wurzel, dateien[4]), 'utf8');
for (const pflicht of [
  'bewerteRuntimeGesundheit',
  'erstelleRuntimeGesundheitsKonfiguration',
  'fachlicherFortschrittErwartet',
  'gruppenLiveness',
  "recoveryStufe === 'neustart_empfohlen'",
  'automatischerNeustart: false'
]) {
  if (!gesundheit.includes(pflicht)) throw new Error(`RuntimeGesundheits-Bewertung fehlt: ${pflicht}`);
}
for (const verboten of ['Date.now(', 'Math.random(', 'location.reload(', 'window.close(']) {
  if (gesundheit.includes(verboten)) throw new Error(`RuntimeGesundheit darf keine versteckte Laufzeit-/Neustartautoritaet verwenden: ${verboten}`);
}
for (const aktionsName of [
  'attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp',
  'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite',
  'buy', 'sell', 'send_item', 'upgrade', 'compound'
]) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(gesundheit)) {
    throw new Error(`RuntimeGesundheit darf keine Adventure-Land-Aktion aufrufen: ${aktionsName}.`);
  }
}

const gesundheitsTests = await readFile(path.join(wurzel, dateien[7]), 'utf8');
for (const pflicht of [
  'gesunde Runtime bleibt normal und besitzt keine Neustartautoritaet',
  'alter fachlicher Fortschritt fuehrt stufenweise zu beobachten und sicherer Pause',
  'lange Freshness-Luecke empfiehlt nur externen Neustart',
  'fehlender erwarteter Heartbeat wird ab Laufzeitstart gealtert',
  'nicht erwarteter fachlicher Fortschritt erzeugt keinen falschen Stillstand',
  'degradierte oder unbekannte Gruppen-Liveness empfiehlt sichere Pause',
  'unbekannte Safety oder kritischer Laufzeitfehler blockiert fail-safe',
  'zeitlich unplausible Freshness blockiert statt Alter zu raten'
]) {
  if (!gesundheitsTests.includes(pflicht)) throw new Error(`RuntimeGesundheits-Test fehlt: ${pflicht}`);
}

const gesundheitsDokument = await readFile(path.join(wurzel, dateien[10]), 'utf8');
for (const pflicht of [
  '8.5.3 implementiert',
  'keine automatische Recovery- oder Neustartautoritaet',
  'hostNeustartEmpfohlen',
  'automatischerNeustart: false',
  '8.5.4'
]) {
  if (!gesundheitsDokument.includes(pflicht)) throw new Error(`RuntimeGesundheits-Dokumentation fehlt: ${pflicht}`);
}

console.log('Block 8.5.1/8.5.2/8.5.3 geprueft: EntscheidungsDatensatz, read-only Aktionskorrelation, deterministische RuntimeGesundheit und keine neue Spiel-/Neustartautoritaet.');
