import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';

const wurzel = process.cwd();
const pflichtDateien = [
  'laufzeit/quelle/vertraege/gruppen-aktionsanfrage.ts',
  'laufzeit/quelle/spiellogik/gruppen-aktionsanfragen.ts',
  'laufzeit/tests/gruppen-aktionsanfragen.test.mjs',
  'laufzeit/tests/block8-gruppenaktionsanfragen-schatten.test.mjs',
  'werkzeuge/block8-gruppenaktionsanfragen-kern.js',
  'werkzeuge/block8-gruppenaktionsanfragen-schatten.js',
  'dokumentation/BLOCK-8-GRUPPENAKTIONSANFRAGEN.md'
];
for (const relativ of pflichtDateien) await access(path.join(wurzel, relativ));

const produktivPfad = path.join(wurzel, 'laufzeit/quelle/spiellogik/gruppen-aktionsanfragen.ts');
const produktivBlobSha = execFileSync('git', ['hash-object', produktivPfad], { encoding: 'utf8' }).trim();
const browserKern = await readFile(path.join(wurzel, 'werkzeuge/block8-gruppenaktionsanfragen-kern.js'), 'utf8');
if (!browserKern.includes(`QUELL_BLOB_SHA = '${produktivBlobSha}'`)) {
  throw new Error(`Block-8-Gruppenaktionsanfragen-Browserkern ist nicht an den Produktionskern gebunden: erwartet ${produktivBlobSha}.`);
}
for (const pflichtText of [
  'V4Block8GruppenAktionsAnfragenKern',
  'erstelleGruppenAktionsAnfrageKonfiguration',
  'uebersetzeEigeneGruppenPlanSchritte',
  "angefordertVon: 'gruppen-aktionsplanung'",
  "standardmaessig gesperrt",
  "quellDatei: 'v4/laufzeit/quelle/spiellogik/gruppen-aktionsanfragen.ts'"
]) {
  if (!browserKern.includes(pflichtText)) throw new Error(`Gruppenaktionsanfragen-Browserkern ist unvollstaendig: ${pflichtText}`);
}
for (const muster of [/\bDate\.now\s*\(/, /\bMath\.random\s*\(/]) {
  if (muster.test(browserKern)) throw new Error('Gruppenaktionsanfragen-Browserkern muss ohne versteckte Uhrzeit oder Zufall bleiben.');
}

const produktiv = await readFile(produktivPfad, 'utf8');
for (const pflichtText of [
  'const aktiviert = aenderungen.aktiviert ?? false',
  "angefordertVon: 'gruppen-aktionsplanung'",
  'gueltigBis: plan.zeitpunkt + gueltigkeitMillisekunden',
  'schritt.ausfuehrenderTeilnehmerKennung === eigenerTeilnehmerKennung',
  'freigegebeneArten',
  'benoetigteRessourcen: Object.freeze([...schritt.benoetigteRessourcen])'
]) {
  if (!produktiv.includes(pflichtText)) throw new Error(`Produktive Gruppenaktionsanfragen-Uebersetzung verletzt die Sicherheitsgrenze: ${pflichtText}`);
}

const schatten = await readFile(path.join(wurzel, 'werkzeuge/block8-gruppenaktionsanfragen-schatten.js'), 'utf8');
for (const pflichtText of [
  'V4Block8GruppenAktionsAnfragen',
  'V4Block8GruppenAktionsplanung',
  'V4Block8GruppenAktionsAnfragenKern',
  'aktiviert: optionen.aktiviert ?? false',
  'anAktionsSteuerungEingereicht: false',
  'aktionsSteuerungVerarbeitet: false',
  'echteSpielaktionenAusgefuehrt: false'
]) {
  if (!schatten.includes(pflichtText)) throw new Error(`Gruppenaktionsanfragen-Schatten ist unvollstaendig: ${pflichtText}`);
}
if (/\breicheAnfrageEin\s*\(/.test(schatten)) {
  throw new Error('Der Live-Schatten darf noch keine AktionsAnfrage an die AktionsSteuerung einreichen.');
}
for (const text of [browserKern, schatten]) {
  for (const unerlaubt of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot', 'command_character', 'send_party_invite']) {
    if (new RegExp(`\\b${unerlaubt}\\s*\\(`).test(text)) {
      throw new Error(`Gruppenaktionsanfragen-Schatten darf Adventure Land nicht direkt aufrufen: ${unerlaubt}.`);
    }
  }
}

const tests = await readFile(path.join(wurzel, 'laufzeit/tests/gruppen-aktionsanfragen.test.mjs'), 'utf8');
for (const pflichtText of [
  'Uebersetzung ist standardmaessig gesperrt',
  'fremde Teilnehmer-Schritte werden nie lokal uebersetzt',
  'echte AktionsSteuerung akzeptiert Anfrage nur im Schattenbetrieb',
  'kurze Gueltigkeit verhindert spaete Schattenausfuehrung'
]) {
  if (!tests.includes(pflichtText)) throw new Error(`Gruppenaktionsanfragen-Test fehlt: ${pflichtText}`);
}

console.log('Block 8 Gruppenaktionsanfragen geprueft: default-locked, Whitelist, nur lokal, source-locked und ohne Live-Einreichung.');
