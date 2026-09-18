import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const pflichtDateien = [
  'laufzeit/quelle/ausfuehrung/adventure-land-gruppen-ziel-ausfuehrung.ts',
  'laufzeit/tests/block8-gruppenziel-ausfuehrung.test.mjs',
  'dokumentation/BLOCK-8-GRUPPENZIEL-AUSFUEHRUNG.md'
];
for (const relativ of pflichtDateien) await access(path.join(wurzel, relativ));

const ausfuehrung = await readFile(path.join(wurzel, pflichtDateien[0]), 'utf8');
for (const pflichtText of [
  'aktivFreigegeben',
  'GRUPPEN_AKTIONS_NAMEN.gemeinsamesZielBearbeiten',
  "anfrage.angefordertVon !== 'gruppen-aktionsplanung'",
  "ressourcen[0] !== 'gruppe'",
  "ressourcen[1] !== 'kampfziel'",
  'sicherheit.normalAktionenErlaubt !== true',
  "sicherheit.gefahrenBewertung.stufe !== 'sicher'",
  'AdventureLandKampfBereitschaftLesezugriff',
  'pruefeAktuelleAngriffsReichweite',
  "this.findeFunktion('attack')",
  'steuerung.brecheAktionAb'
]) {
  if (!ausfuehrung.includes(pflichtText)) throw new Error(`Block-8-Gruppenziel-Ausfuehrungsgrenze fehlt: ${pflichtText}`);
}
for (const unerlaubt of ['move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite']) {
  if (new RegExp(`\\b${unerlaubt}\\s*\\(`).test(ausfuehrung)) {
    throw new Error(`Der erste Gruppenadapter darf ${unerlaubt} nicht aufrufen.`);
  }
}

const tests = await readFile(path.join(wurzel, pflichtDateien[1]), 'utf8');
for (const pflichtText of [
  'aktive Ausfuehrung ist standardmaessig gesperrt und bleibt Schatten',
  'exakt freigegebener gemeinsamer Angriff erreicht attack genau einmal',
  'verlorener Ressourcenbesitz blockiert vor attack und bricht zentral ab',
  'Safety-Wechsel oder stale Safety blockiert vor attack',
  'unbekannte Angriffsbereitschaft blockiert fail-safe',
  'unsichtbares, totes oder zu weit entferntes Ziel erreicht attack nicht',
  'andere GRUPPE-Aktionen besitzen keinen aktiven Pfad'
]) {
  if (!tests.includes(pflichtText)) throw new Error(`Block-8-Gruppenziel-Ausfuehrungstest fehlt: ${pflichtText}`);
}

const spiellogikWurzel = path.join(wurzel, 'laufzeit/quelle/spiellogik');
for (const datei of await readdir(spiellogikWurzel)) {
  if (!datei.endsWith('.ts')) continue;
  const text = await readFile(path.join(spiellogikWurzel, datei), 'utf8');
  for (const aktionsName of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'use_hp_or_mp', 'loot']) {
    if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(text)) {
      throw new Error(`Direkter Adventure-Land-Aufruf ausserhalb ausfuehrung/: spiellogik/${datei} -> ${aktionsName}.`);
    }
  }
}

console.log('Block 8 Gruppenziel-Ausfuehrung geprueft: Default-Lock, zentrale Autoritaet, Ressourcenbesitz, frische Safety, Bereitschaft, Ziel/Reichweite und genau ein erlaubter attack-Pfad.');
