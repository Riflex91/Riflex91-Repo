import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';

const wurzel = process.cwd();
const pflichtDateien = [
  'laufzeit/quelle/vertraege/gruppen-aktionssteuerung.ts',
  'laufzeit/quelle/spiellogik/gruppen-aktionssteuerung.ts',
  'laufzeit/tests/gruppen-aktionssteuerung.test.mjs',
  'laufzeit/tests/block8-aktionssteuerung-browser.test.mjs',
  'laufzeit/tests/block8-gruppenaktionssteuerung-schatten.test.mjs',
  'laufzeit/tests/gruppen-aktionsanfragen-diagnose.test.mjs',
  'werkzeuge/aktions-steuerung-schatten-kern.js',
  'werkzeuge/block8-gruppenaktionssteuerung-kern.js',
  'werkzeuge/block8-gruppenaktionssteuerung-schatten.js',
  'dokumentation/BLOCK-8-GRUPPENAKTIONSSTEUERUNG.md'
];
for (const relativ of pflichtDateien) await access(path.join(wurzel, relativ));

function blob(relativ) {
  return execFileSync('git', ['hash-object', path.join(wurzel, relativ)], { encoding: 'utf8' }).trim();
}

const integrationPfad = 'laufzeit/quelle/spiellogik/gruppen-aktionssteuerung.ts';
const integrationSha = blob(integrationPfad);
const integrationBrowser = await readFile(path.join(wurzel, 'werkzeuge/block8-gruppenaktionssteuerung-kern.js'), 'utf8');
if (!integrationBrowser.includes(`QUELL_BLOB_SHA = '${integrationSha}'`)) {
  throw new Error(`Gruppen-AktionsSteuerung-Browserkern ist nicht source-locked: erwartet ${integrationSha}.`);
}

const zentralBrowser = await readFile(path.join(wurzel, 'werkzeuge/aktions-steuerung-schatten-kern.js'), 'utf8');
const zentraleQuellen = {
  aktionsSteuerung: 'laufzeit/quelle/kern/aktions-steuerung.ts',
  laufzeitSteuerung: 'laufzeit/quelle/kern/laufzeit-steuerung.ts',
  laufzeitVertrag: 'laufzeit/quelle/vertraege/laufzeit-steuerung.ts',
  aktionsAuswahl: 'laufzeit/quelle/kern/aktions-auswahl.ts',
  ressourcenVergabe: 'laufzeit/quelle/kern/ressourcen-vergabe.ts',
  schattenAusfuehrung: 'laufzeit/quelle/kern/schatten-ausfuehrung.ts',
  ressourcenVertrag: 'laufzeit/quelle/vertraege/ressourcen-sperre.ts'
};
for (const [name, relativ] of Object.entries(zentraleQuellen)) {
  const sha = blob(relativ);
  if (!zentralBrowser.includes(`${name}: '${sha}'`)) {
    throw new Error(`Zentraler Browser-Steuerungskern ist fuer ${name} nicht source-locked: erwartet ${sha}.`);
  }
}

const produktiv = await readFile(path.join(wurzel, integrationPfad), 'utf8');
for (const pflichtText of [
  'const aktiviert = aenderungen.aktiviert ?? false',
  'const roheAktionen = aenderungen.freigegebeneAktionen ?? []',
  'const verarbeiten = aenderungen.verarbeiten ?? false',
  'anfrage.gueltigBis <= jetzt',
  'steuerung.reicheAnfrageEin(anfrage)',
  'steuerung.verarbeiteNaechsteAktion(jetzt)',
  'brecheVeralteteGruppenArbeitAb',
  'steuerung.brecheAktionAb(zustand.anfrage.kennung, jetzt, grund)'
]) {
  if (!produktiv.includes(pflichtText)) throw new Error(`Produktive Gruppen-AktionsSteuerung verletzt Sicherheitsgrenze: ${pflichtText}`);
}

const gruppenAnfragen = await readFile(path.join(wurzel, 'laufzeit/quelle/spiellogik/gruppen-aktionsanfragen.ts'), 'utf8');
if (!gruppenAnfragen.includes('nichtFreigegebeneSchrittKennungen: friereStrings(eigeneSchrittKennungen)')) {
  throw new Error('Default-Lock muss fuer Diagnose ein getrenntes Kennungsarray erzeugen.');
}

const schatten = await readFile(path.join(wurzel, 'werkzeuge/block8-gruppenaktionssteuerung-schatten.js'), 'utf8');
for (const pflichtText of [
  'aktiviert: optionen.uebersetzungAktiviert ?? false',
  'aktiviert: optionen.einreichungAktiviert ?? false',
  'freigegebeneAktionen: optionen.freigegebeneAktionen ?? []',
  'verarbeiten: optionen.verarbeiten ?? false',
  'echteSpielaktionenAusgefuehrt: false'
]) {
  if (!schatten.includes(pflichtText)) throw new Error(`Gruppen-AktionsSteuerung-Live-Schatten ist unvollstaendig: ${pflichtText}`);
}
if (/\breicheAnfrageEin\s*\(/.test(schatten)) {
  throw new Error('Der Live-Schatten darf die zentrale Steuerung nicht direkt umgehen; Einreichung muss ueber den source-locked Integrationskern laufen.');
}

for (const text of [zentralBrowser, integrationBrowser, schatten]) {
  for (const muster of [/\bDate\.now\s*\(/, /\bMath\.random\s*\(/]) {
    if (muster.test(text)) throw new Error('Block-8-Steuerungsschatten muss ohne versteckte Uhrzeit oder Zufall bleiben.');
  }
  for (const unerlaubt of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot', 'command_character', 'send_party_invite']) {
    if (new RegExp(`\\b${unerlaubt}\\s*\\(`).test(text)) {
      throw new Error(`Block-8-Steuerungsschatten darf Adventure Land nicht direkt aufrufen: ${unerlaubt}.`);
    }
  }
}

const browserTests = await readFile(path.join(wurzel, 'laufzeit/tests/block8-aktionssteuerung-browser.test.mjs'), 'utf8');
if (!browserTests.includes('Laufzeit-Pause bleibt semantisch identisch zur Produktion')) {
  throw new Error('Browser-AktionsSteuerung-Test fuer die zentrale Laufzeit-Pause fehlt.');
}

const tests = await readFile(path.join(wurzel, 'laufzeit/tests/gruppen-aktionssteuerung.test.mjs'), 'utf8');
for (const pflichtText of [
  'Uebergabe ist standardmaessig gesperrt',
  'zweite Aktionsnamen-Whitelist ist erforderlich',
  'explizite Verarbeitung startet ausschliesslich SchattenAusfuehrung',
  'abgelaufene Anfrage wird vor Einreichung verworfen'
]) {
  if (!tests.includes(pflichtText)) throw new Error(`Gruppen-AktionsSteuerung-Test fehlt: ${pflichtText}`);
}

console.log('Block 8 Gruppen-AktionsSteuerung geprueft: doppelt gesperrt, source-locked, Ablauf vor Einreichung und nur zentrale SchattenAusfuehrung.');
