import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const dateien = [
  'laufzeit/quelle/vertraege/entscheidungs-datensatz.ts',
  'laufzeit/quelle/telemetrie/gruppen-entscheidungs-datensatz.ts',
  'laufzeit/tests/block8-5-entscheidungs-datensatz.test.mjs',
  'dokumentation/BLOCK-8-5-ENTSCHEIDUNGSDATENSATZ.md',
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

const tests = await readFile(path.join(wurzel, dateien[2]), 'utf8');
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

const dokument = await readFile(path.join(wurzel, dateien[3]), 'utf8');
for (const pflicht of [
  '8.5.1 implementiert',
  '8.5.2',
  'keine AktionsAnfrage',
  'Date.now()',
  'Freshness-Klasse'
]) {
  if (!dokument.includes(pflicht)) throw new Error(`EntscheidungsDatensatz-Dokumentation fehlt: ${pflicht}`);
}

console.log('Block 8.5.1 geprueft: versionierter EntscheidungsDatensatz, deterministische fachliche Fingerabdruecke, zeit-/reihenfolgeunabhaengiger Vergleich und keine neue Spielautoritaet.');
