import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const pflichtDateien = [
  'laufzeit/quelle/ausfuehrung/adventure-land-gruppen-ziel-ausfuehrung.ts',
  'laufzeit/quelle/ausfuehrung/adventure-land-gruppen-ziel-ausfuehrungs-bruecke.ts',
  'laufzeit/tests/block8-gruppenziel-ausfuehrung.test.mjs',
  'laufzeit/tests/block8-gruppenziel-ausfuehrungs-bruecke.test.mjs',
  'laufzeit/tests/block8-gruppenziel-one-shot.test.mjs',
  'werkzeuge/block8-gruppenziel-one-shot.js',
  'dokumentation/BLOCK-8-GRUPPENZIEL-AUSFUEHRUNG.md'
];
for (const relativ of pflichtDateien) await access(path.join(wurzel, relativ));

const ausfuehrung = await readFile(path.join(wurzel, pflichtDateien[0]), 'utf8');
for (const pflichtText of [
  'aktivFreigegeben',
  'AdventureLandGruppenZielEinmalFreigabe',
  'GRUPPEN_ZIEL_EINMAL_FREIGABE_TEXT',
  'this.einmalFreigabe.verbrauche',
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

const bruecke = await readFile(path.join(wurzel, 'laufzeit/quelle/ausfuehrung/adventure-land-gruppen-ziel-ausfuehrungs-bruecke.ts'), 'utf8');
for (const pflichtText of [
  'AdventureLandGruppenZielAusfuehrungsBruecke',
  "GRUPPEN_ZIEL_AUSFUEHRUNGS_BRUECKEN_NAME = 'V4Block8GruppenZielAusfuehrungsBruecke'",
  "quelleBereich = 'ausfuehrung'",
  'aktivFreigegeben',
  'versuchVerbraucht',
  'this.versuchVerbraucht = true',
  'this.steuerung.holeAktionsZustand',
  "zustand.anfrage.angefordertVon !== 'gruppen-aktionsplanung'",
  'zustand.anfrage.gueltigBis',
  'sicherheit.zeitpunkt < auftrag.freigegebenAm',
  'AdventureLandGruppenZielEinmalFreigabe',
  'AdventureLandGruppenZielAusfuehrung',
  'fuehreFreigegebeneGruppenZielAktionAus',
  'this.steuerung.brecheAktionAb'
]) {
  if (!bruecke.includes(pflichtText)) throw new Error(`Block-8-Gruppenziel-Ausfuehrungsbruecke fehlt: ${pflichtText}`);
}
for (const unerlaubt of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite']) {
  if (new RegExp(`\\b${unerlaubt}\\s*\\(`).test(bruecke)) {
    throw new Error(`Die feste Gruppenziel-Bruecke darf Adventure Land nicht direkt aufrufen, sondern nur an den Produktionsadapter delegieren: ${unerlaubt}.`);
  }
}

const brueckenTests = await readFile(path.join(wurzel, 'laufzeit/tests/block8-gruppenziel-ausfuehrungs-bruecke.test.mjs'), 'utf8');
for (const pflichtText of [
  'ist standardmaessig gesperrt und besitzt den festen ausfuehrung-Vertrag',
  'delegiert genau einen passenden Auftrag an den Produktionsadapter',
  'erlaubt pro Instanz auch nach Erfolg keinen zweiten Versuch',
  'ignoriert Browser-Vorpruefungen als Autoritaet und blockiert mit aktueller Produktions-Safety',
  'verlangt Safety nach der expliziten One-shot-Freigabe',
  'blockiert falsche Anfrage, falsches Ziel, alten Auftrag und falschen Freigabetext',
  'blockiert abgelaufene zentrale Anfrage vor attack'
]) {
  if (!brueckenTests.includes(pflichtText)) throw new Error(`Block-8-Gruppenziel-Ausfuehrungsbrueckentest fehlt: ${pflichtText}`);
}

const tests = await readFile(path.join(wurzel, 'laufzeit/tests/block8-gruppenziel-ausfuehrung.test.mjs'), 'utf8');
for (const pflichtText of [
  'aktive Ausfuehrung ist standardmaessig gesperrt und bleibt Schatten',
  'aktiver Adapter ohne Einmal-Freigabe bricht zentral ab',
  'Einmal-Freigabe verlangt exakten Text und bindet sich an genau eine Anfrage',
  'exakt freigegebener gemeinsamer Angriff erreicht attack genau einmal und sperrt vorher wieder',
  'verbrauchte Einmal-Freigabe kann keine zweite Anfrage ausfuehren',
  'abgelaufene oder falsch gebundene Einmal-Freigabe wird verbraucht und blockiert',
  'verlorener Ressourcenbesitz blockiert vor attack und Einmal-Freigabe bleibt verbraucht',
  'Safety-Wechsel oder stale Safety blockiert vor attack und sperrt one-shot',
  'unbekannte Angriffsbereitschaft blockiert fail-safe',
  'unsichtbares, totes oder zu weit entferntes Ziel erreicht attack nicht',
  'andere GRUPPE-Aktionen besitzen keinen aktiven Pfad'
]) {
  if (!tests.includes(pflichtText)) throw new Error(`Block-8-Gruppenziel-Ausfuehrungstest fehlt: ${pflichtText}`);
}

const oneShot = await readFile(path.join(wurzel, 'werkzeuge/block8-gruppenziel-one-shot.js'), 'utf8');
for (const pflichtText of [
  'V4Block8GruppenZielOneShot',
  'BLOCK8-GRUPPENZIEL-EINMAL-FREIGEBEN',
  'V4Block8GruppenZielAusfuehrungsBruecke',
  "quelleBereich !== 'ausfuehrung'",
  "ERLAUBTE_AKTION = 'GRUPPE_GEMEINSAMES_ZIEL_BEARBEITEN'",
  "freigegebeneArten: [ERLAUBTE_ART]",
  "freigegebeneAktionen: [ERLAUBTE_AKTION]",
  'freigabe = null;',
  'bruecke.fuehreEinmalAus(auftrag)',
  'automatischWiederGesperrt: true',
  'echteSpielaktionenDurchWerkzeug: false'
]) {
  if (!oneShot.includes(pflichtText)) throw new Error(`Block-8-Gruppenziel-One-shot ist unvollstaendig: ${pflichtText}`);
}
for (const unerlaubt of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite']) {
  if (new RegExp(`\\b${unerlaubt}\\s*\\(`).test(oneShot)) {
    throw new Error(`Das One-shot-Werkzeug darf Adventure Land nicht direkt aufrufen: ${unerlaubt}.`);
  }
}

const oneShotTests = await readFile(path.join(wurzel, 'laufzeit/tests/block8-gruppenziel-one-shot.test.mjs'), 'utf8');
for (const pflichtText of [
  'startet gesperrt und Vorschau bleibt read-only im zentralen Schattenpfad',
  'verlangt exakten Freigabetext und frische Vorschau',
  'delegiert genau einmal und ist vor der Delegation wieder gesperrt',
  'sperrt auch bei Safety-Wechsel vor jeder Brueckendelegation',
  'sperrt auch wenn die ausfuehrung-Bruecke fehlt',
  'blockiert Cooldown, Zielverlust und Reichweitenverlust read-only',
  'besitzt selbst keinen Adventure-Land-Aktionsaufruf'
]) {
  if (!oneShotTests.includes(pflichtText)) throw new Error(`Block-8-Gruppenziel-One-shot-Test fehlt: ${pflichtText}`);
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

console.log('Block 8 Gruppenziel-Ausfuehrung geprueft: Default-Lock, gebundene Einmal-Freigabe, feste one-shot Ausfuehrungsbruecke, automatische Wiedersperrung, zentrale Autoritaet, frische Produktions-Safety, Ressourcenbesitz, Bereitschaft, Ziel/Reichweite und Browser-One-shot ohne eigenen Spielaufruf.');
