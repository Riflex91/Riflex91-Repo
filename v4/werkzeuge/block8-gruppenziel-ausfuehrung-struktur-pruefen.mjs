import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const wurzel = process.cwd();
const pflichtDateien = [
  'laufzeit/quelle/ausfuehrung/adventure-land-gruppen-ziel-ausfuehrung.ts',
  'laufzeit/quelle/ausfuehrung/adventure-land-gruppen-ziel-ausfuehrungs-bruecke.ts',
  'laufzeit/quelle/ausfuehrung/adventure-land-gruppen-ziel-live-bindung.ts',
  'laufzeit/quelle/ausfuehrung/adventure-land-gruppen-ziel-live-smoke.ts',
  'laufzeit/tests/block8-gruppenziel-ausfuehrung.test.mjs',
  'laufzeit/tests/block8-gruppenziel-ausfuehrungs-bruecke.test.mjs',
  'laufzeit/tests/block8-gruppenziel-live-bindung.test.mjs',
  'laufzeit/tests/block8-gruppenziel-live-smoke.test.mjs',
  'laufzeit/tests/block8-gruppenziel-live-smoke-runner.test.mjs',
  'laufzeit/tests/block8-gruppenziel-one-shot.test.mjs',
  'werkzeuge/block8-gruppenziel-one-shot.js',
  'werkzeuge/block8-gruppenziel-live-smoke.js',
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

const liveBindung = await readFile(path.join(wurzel, 'laufzeit/quelle/ausfuehrung/adventure-land-gruppen-ziel-live-bindung.ts'), 'utf8');
for (const pflichtText of [
  'AdventureLandGruppenZielLiveBindung',
  "GRUPPEN_ZIEL_LIVE_BINDUNG_FREIGABE_TEXT = 'BLOCK8-GRUPPENZIEL-LIVE-BINDUNG-EINMAL'",
  'aktivFreigegeben',
  'bestehende Laufzeitautoritaet wird nicht ueberschrieben',
  'Reflect.defineProperty',
  'Object.freeze',
  'this.versuchVerbraucht = true',
  'this.entferneEigeneFassade(true)',
  'this.liesAktuelleSicherheit()',
  'AdventureLandGruppenZielAusfuehrungsBruecke',
  'this.steuerung.brecheAktionAb'
]) {
  if (!liveBindung.includes(pflichtText)) throw new Error(`Block-8-Gruppenziel-Live-Bindung fehlt: ${pflichtText}`);
}
for (const unerlaubt of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite']) {
  if (new RegExp(`\\b${unerlaubt}\\s*\\(`).test(liveBindung)) {
    throw new Error(`Die Gruppenziel-Live-Bindung darf Adventure Land nicht direkt aufrufen: ${unerlaubt}.`);
  }
}
for (const unerlaubteBrowserAutoritaet of ['V4Block7KampfsicherheitsQuelle', 'V4Block8GruppenAktionsSteuerung', 'V4AktionsSteuerungSchattenKern']) {
  if (liveBindung.includes(unerlaubteBrowserAutoritaet)) {
    throw new Error(`Die Produktions-Live-Bindung darf keine Browser-/Schattenautoritaet direkt verwenden: ${unerlaubteBrowserAutoritaet}.`);
  }
}

const liveBindungsTests = await readFile(path.join(wurzel, 'laufzeit/tests/block8-gruppenziel-live-bindung.test.mjs'), 'utf8');
for (const pflichtText of [
  'ist standardmaessig gesperrt und exponiert nichts',
  'verlangt exakten eigenen Freigabetext und ueberschreibt keine bestehende Autoritaet',
  'exponiert nur die feste eingefrorene ausfuehrung-Fassade und liest Safety noch nicht',
  'entfernt die globale Fassade vor Delegation und nutzt frische Produktions-Safety',
  'bleibt nach fehlgeschlagener Produktions-Safety entfernt und bricht zentral ab',
  'kann ueber eine behaltene Fassade niemals zweimal delegieren',
  'blockiert bei ersetzter globaler Fassade vor Adventure-Land-Aktion und gibt zentrale Ressourcen frei',
  'kann vor einem Versuch manuell wieder gesperrt werden'
]) {
  if (!liveBindungsTests.includes(pflichtText)) throw new Error(`Block-8-Gruppenziel-Live-Bindungstest fehlt: ${pflichtText}`);
}

const liveSmoke = await readFile(path.join(wurzel, 'laufzeit/quelle/ausfuehrung/adventure-land-gruppen-ziel-live-smoke.ts'), 'utf8');
for (const pflichtText of [
  'AdventureLandGruppenZielLiveSmoke',
  "GRUPPEN_ZIEL_LIVE_SMOKE_FREIGABE_TEXT = 'BLOCK8-GRUPPENZIEL-LIVE-SMOKE-EINMAL'",
  'charakterName',
  'serverRegion',
  'serverKennung',
  'karte',
  'instanz',
  'zielKennung',
  'monsterArt',
  'genau eine laufende zentrale Gruppenzielanfrage',
  'besitzt die Ressource',
  'AdventureLandKampfBereitschaftLesezugriff',
  'Produktions-Safety',
  'new AdventureLandGruppenZielLiveBindung',
  'this.versuchVerbraucht = true',
  "eigenschaft === 'attack'",
  'audit.attack += 1',
  'Unerwartete Adventure-Land-Aktion im Gruppenziel-Live-Smoke blockiert',
  'ausfuehrungsBrueckeEntfernt',
  "phase !== 'abgeschlossen'",
  'verbleibendeRessourcen',
  'bestehende Autoritaet wird nicht uebernommen oder entfernt'
]) {
  if (!liveSmoke.includes(pflichtText)) throw new Error(`Block-8-Gruppenziel-Live-Smoke fehlt: ${pflichtText}`);
}
for (const unerlaubteBrowserAutoritaet of ['V4Block7KampfsicherheitsQuelle', 'V4Block8GruppenAktionsSteuerung', 'V4AktionsSteuerungSchattenKern']) {
  if (liveSmoke.includes(unerlaubteBrowserAutoritaet)) {
    throw new Error(`Der Produktions-Live-Smoke darf keine Browser-/Schattenautoritaet direkt verwenden: ${unerlaubteBrowserAutoritaet}.`);
  }
}

const liveSmokeTests = await readFile(path.join(wurzel, 'laufzeit/tests/block8-gruppenziel-live-smoke.test.mjs'), 'utf8');
for (const pflichtText of [
  'startet standardmaessig gesperrt und Vorschau ist read-only auf realer Zentralsteuerung',
  'bindet Charakter, Server, Karte, Instanz, Ziel und Monsterart exakt',
  'verlangt genau eine laufende reale Gruppenanfrage und zentralen Ressourcenbesitz',
  'blockiert unsichere oder alte Produktions-Safety und unbekannte Angriffsbereitschaft',
  'verlangt frische Vorschau und exakten Freigabetext',
  'fuehrt exakt einen attack aus, entfernt Bruecke und gibt Ressourcen frei',
  'protokolliert attack-Versuch auch wenn Adventure Land attack fehlschlaegt',
  'Live-Smoke-Fassade ist eingefroren und ueberschreibt keine bestehende Smoke-Autoritaet'
]) {
  if (!liveSmokeTests.includes(pflichtText)) throw new Error(`Block-8-Gruppenziel-Live-Smoke-Test fehlt: ${pflichtText}`);
}

const liveSmokeRunner = await readFile(path.join(wurzel, 'werkzeuge/block8-gruppenziel-live-smoke.js'), 'utf8');
for (const pflichtText of [
  'V4Block8GruppenZielLiveSmokeRunner',
  'V4Block8GruppenZielLiveSmoke',
  'BLOCK8-GRUPPENZIEL-LIVE-SMOKE-STARTEN',
  "api.quelleBereich !== 'ausfuehrung'",
  "api.modus !== 'one-shot-live-smoke'",
  'api.vorschau()',
  'api.freigeben(produktionsFreigabeText)',
  'api.starte()',
  'echteSpielaktionenDurchRunner: false'
]) {
  if (!liveSmokeRunner.includes(pflichtText)) throw new Error(`Block-8-Gruppenziel-Live-Smoke-Runner fehlt: ${pflichtText}`);
}
for (const unerlaubt of ['attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp', 'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite']) {
  if (new RegExp(`\\b${unerlaubt}\\s*\\(`).test(liveSmokeRunner)) {
    throw new Error(`Der Live-Smoke-Runner darf Adventure Land nicht direkt aufrufen: ${unerlaubt}.`);
  }
}

const liveSmokeRunnerTests = await readFile(path.join(wurzel, 'laufzeit/tests/block8-gruppenziel-live-smoke-runner.test.mjs'), 'utf8');
for (const pflichtText of [
  'bleibt ohne Produktions-Smoke blockiert',
  'zeigt zuerst Produktionsvorschau und fuehrt dabei nichts aus',
  'verlangt exakten Starttext und frische angezeigte Vorschau',
  'delegiert nach Starttext genau einmal an den Produktions-Smoke',
  'kann nach Vorschau wieder sperren ohne Start',
  'besitzt selbst keinen Adventure-Land-Aktionsaufruf'
]) {
  if (!liveSmokeRunnerTests.includes(pflichtText)) throw new Error(`Block-8-Live-Smoke-Runner-Test fehlt: ${pflichtText}`);
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

console.log('Block 8 Gruppenziel-Ausfuehrung geprueft: Default-Lock, gebundene Einmal-Freigabe, feste one-shot Ausfuehrungsbruecke, Live-Bindung, produktionsgebundene Live-Smoke-Huelle mit Aktionsaudit und Browser-Runner ohne eigenen Spielaufruf.');
