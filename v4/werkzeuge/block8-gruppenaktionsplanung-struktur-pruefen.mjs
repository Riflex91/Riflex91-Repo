import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const pflichtDateien = [
  'dokumentation/BLOCK-8-GRUPPENAKTIONSPLANUNG.md',
  'laufzeit/quelle/vertraege/gruppen-aktionsplanung.ts',
  'laufzeit/quelle/spiellogik/gruppen-aktionsplanung.ts',
  'laufzeit/tests/block8-gruppenaktionsplanung.test.mjs'
];
for (const relativ of pflichtDateien) await access(path.join(wurzel, relativ));

const vertrag = await readFile(path.join(wurzel, 'laufzeit/quelle/vertraege/gruppen-aktionsplanung.ts'), 'utf8');
for (const pflichtText of [
  'GRUPPEN_PLAN_AKTIONS_ARTEN',
  "'mitglied_heilen'",
  "'ziel_aggro_binden'",
  "'mitglied_schuetzen'",
  "'gruppe_unterstuetzen'",
  "'gemeinsames_ziel_bearbeiten'",
  'GruppenAktionsPlan',
  'GruppenPlanSchritt',
  'benoetigteRessourcen'
]) {
  if (!vertrag.includes(pflichtText)) throw new Error(`Block-8-Gruppenaktionsplan-Vertrag ist unvollstaendig: ${pflichtText}`);
}
if (vertrag.includes('AktionsAnfrage<') || vertrag.includes('readonly aktionsAnfrage')) {
  throw new Error('Der read-only Gruppenaktionsplan darf noch keine direkt ausfuehrbare AktionsAnfrage enthalten.');
}

const logik = await readFile(path.join(wurzel, 'laufzeit/quelle/spiellogik/gruppen-aktionsplanung.ts'), 'utf8');
for (const pflichtText of [
  'planeGruppenAktionen',
  'eigeneGruppenPlanSchritte',
  'waehleNiedrigstenLebensAnteil',
  "entscheidung.betriebsArt === 'blockiert'",
  "entscheidung.betriebsArt === 'normal'",
  "wichtigkeit: 'sicherheit'",
  "Object.freeze(['gruppe', 'kampfziel'])"
]) {
  if (!logik.includes(pflichtText)) throw new Error(`Block-8-Gruppenaktionsplanung ist unvollstaendig: ${pflichtText}`);
}
for (const muster of [/\bDate\.now\s*\(/, /\bMath\.random\s*\(/]) {
  if (muster.test(logik)) throw new Error('Gruppenaktionsplanung muss deterministisch ohne versteckte Uhrzeit oder Zufall bleiben.');
}
for (const unerlaubt of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite']) {
  if (new RegExp(`\\b${unerlaubt}\\s*\\(`).test(logik)) {
    throw new Error(`Gruppenaktionsplanung darf Adventure Land nicht direkt aufrufen: ${unerlaubt}.`);
  }
}

const tests = await readFile(path.join(wurzel, 'laufzeit/tests/block8-gruppenaktionsplanung.test.mjs'), 'utf8');
for (const pflichtText of [
  'Heilen, Aggro, Schutz, Unterstuetzung und gemeinsames Ziel werden konkret geplant',
  'Sicherheitsbetrieb unterdrueckt Aggro, Unterstuetzung und gemeinsames Ziel',
  'unbekannte Gruppensicherheit bleibt ohne Aktionsschritt blockiert',
  'veralteter Teilnehmer erhaelt keine Schritte und Reconnect stellt seine Aufgabe wieder her',
  'gleiche Eingaben in anderer Reihenfolge erzeugen denselben Plan',
  'inkonsistente Aufgabe auf nicht aktiven Teilnehmer blockiert fail-safe'
]) {
  if (!tests.includes(pflichtText)) throw new Error(`Block-8-Gruppenaktionsplanungstest fehlt: ${pflichtText}`);
}

console.log('Block 8 Gruppenaktionsplanung geprueft: deterministisch, read-only, Safety-vor-Leistung und Reconnect-faehig.');
