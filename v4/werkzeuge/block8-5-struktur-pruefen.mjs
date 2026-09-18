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
  'dokumentation/BLOCK-8-5-PLAN.md',
  'laufzeit/quelle/vertraege/recovery-checkpoint.ts',
  'laufzeit/quelle/telemetrie/recovery-checkpoint.ts',
  'laufzeit/tests/block8-5-recovery-checkpoint.test.mjs',
  'dokumentation/BLOCK-8-5-RECOVERY-CHECKPOINT.md',
  'laufzeit/quelle/vertraege/status-schnittstelle.ts',
  'laufzeit/quelle/telemetrie/status-schnittstelle.ts',
  'laufzeit/tests/block8-5-status-schnittstelle.test.mjs',
  'dokumentation/BLOCK-8-5-STATUSSCHNITTSTELLE.md',
  'werkzeuge/block8-5-ingame-hud.js',
  'laufzeit/tests/block8-5-ingame-hud.test.mjs',
  'dokumentation/BLOCK-8-5-INGAME-HUD.md',
  'laufzeit/quelle/vertraege/laufzeit-steuerung.ts',
  'laufzeit/quelle/kern/laufzeit-steuerung.ts',
  'laufzeit/quelle/kern/sichere-basis-bedienung.ts',
  'laufzeit/tests/block8-5-basisbedienung-kern.test.mjs',
  'dokumentation/BLOCK-8-5-BASISBEDIENUNG-KERN.md',
  'laufzeit/quelle/kern/aktions-steuerung.ts',
  'laufzeit/quelle/ausfuehrung/adventure-land-produktions-bootstrap.ts',
  'laufzeit/quelle/ausfuehrung/adventure-land-produktions-einstieg.ts',
  'laufzeit/tests/block8-produktions-bootstrap.test.mjs',
  'laufzeit/tests/block8-produktions-einstieg.test.mjs',
  'dokumentation/BLOCK-8-5-BASISBEDIENUNG-RUNTIME.md'
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

const checkpointVertrag = await readFile(path.join(wurzel, dateien[13]), 'utf8');
for (const pflicht of [
  'RECOVERY_CHECKPOINT_SCHEMA_VERSION',
  'RecoveryCheckpointInhalt',
  'wiederaufnahmeErlaubt: false',
  'abgleichErforderlich: true',
  'aktionsAutoritaet: false',
  'offeneAktionsAnfrageKennungen'
]) {
  if (!checkpointVertrag.includes(pflicht)) throw new Error(`Recovery-Checkpoint-Vertrag fehlt: ${pflicht}`);
}

const checkpoint = await readFile(path.join(wurzel, dateien[14]), 'utf8');
for (const pflicht of [
  'RecoveryCheckpointSpeicher',
  'berechneSha256',
  'kanonisiereJson',
  'RECOVERY_CHECKPOINT_SLOTS',
  "'zu_gross'",
  "'speicher_fehler'",
  "'beschaedigt'",
  'wiederaufnahmeErlaubt: false',
  'abgleichErforderlich: true',
  'aktionsAutoritaet: false'
]) {
  if (!checkpoint.includes(pflicht)) throw new Error(`Recovery-Checkpoint-Implementierung fehlt: ${pflicht}`);
}
for (const verboten of [
  'Date.now(',
  'Math.random(',
  'location.reload(',
  'window.close(',
  '.reicheAnfrageEin(',
  '.verarbeiteNaechsteAktion('
]) {
  if (checkpoint.includes(verboten)) {
    throw new Error(`Recovery-Checkpoint darf keine versteckte Laufzeit-/Aktionsautoritaet verwenden: ${verboten}`);
  }
}
for (const aktionsName of [
  'attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp',
  'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite',
  'buy', 'sell', 'send_item', 'upgrade', 'compound'
]) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(checkpoint)) {
    throw new Error(`Recovery-Checkpoint darf keine Adventure-Land-Aktion aufrufen: ${aktionsName}.`);
  }
}
for (const unerlaubtesFeld of [
  'benoetigteRessourcen',
  'gueltigBis',
  'angefordertVon'
]) {
  if (checkpointVertrag.includes(unerlaubtesFeld)) {
    throw new Error(`RecoveryCheckpointInhalt darf keine fluechtige Aktionsautoritaet speichern: ${unerlaubtesFeld}.`);
  }
}

const checkpointTests = await readFile(path.join(wurzel, dateien[15]), 'utf8');
for (const pflicht of [
  'Checkpoint wird versioniert mit SHA-256 gespeichert und bleibt ohne Aktionsautoritaet',
  'A/B-Slots wechseln und Sequenz steigt monoton',
  'beschaedigter aktueller Slot faellt auf letzten gueltigen Checkpoint zurueck',
  'zwei beschaedigte Slots werden blockierend als beschaedigt gemeldet',
  'manipulierte Nutzlast besteht die SHA-256-Pruefung nicht',
  'unvollstaendige Nutzlast mit neu berechnetem Fremd-Hash wird trotzdem abgewiesen',
  'zu grosser Checkpoint wird vor dem Schreiben abgewiesen und alter Checkpoint bleibt erhalten',
  'Zeiger-Schreibfehler meldet Speicherfehler und alter bestaetigter Checkpoint bleibt aktiv',
  'offene Arbeit wird nur als Kennung gespeichert und nie automatisch fortgesetzt',
  'ohne gespeicherte Daten wird nicht_vorhanden statt erfundener Zustand gemeldet'
]) {
  if (!checkpointTests.includes(pflicht)) throw new Error(`Recovery-Checkpoint-Test fehlt: ${pflicht}`);
}

const checkpointDokument = await readFile(path.join(wurzel, dateien[16]), 'utf8');
for (const pflicht of [
  '8.5.4 implementiert',
  'wiederaufnahmeErlaubt: false',
  'abgleichErforderlich: true',
  'aktionsAutoritaet: false',
  'A/B-Slots',
  'SHA-256',
  '8.5.5'
]) {
  if (!checkpointDokument.includes(pflicht)) throw new Error(`Recovery-Checkpoint-Dokumentation fehlt: ${pflicht}`);
}

const statusVertrag = await readFile(path.join(wurzel, dateien[17]), 'utf8');
for (const pflicht of [
  'StatusSchnittstelle',
  'GemeinsameStatusSicht',
  'nurLesen: true',
  'spielAutoritaet: false',
  'bedienAutoritaet: false',
  'neustartAutoritaet: false',
  'StatusWert',
  'StatusCheckpointSicht'
]) {
  if (!statusVertrag.includes(pflicht)) throw new Error(`StatusSchnittstellen-Vertrag fehlt: ${pflicht}`);
}

const statusSchnittstelle = await readFile(path.join(wurzel, dateien[18]), 'utf8');
for (const pflicht of [
  'NurLeseStatusSchnittstelle',
  'erstelleGemeinsameStatusSicht',
  'kopiereStatusWert',
  'baueCharakterSicht',
  'baueRuntimeSicht',
  'baueGruppenSicht',
  'baueEntscheidungsSicht',
  'baueAktionsSichten',
  'baueCheckpointSicht',
  'baueMeldungsSicht',
  'nurLesen: true',
  'spielAutoritaet: false',
  'bedienAutoritaet: false',
  'neustartAutoritaet: false'
]) {
  if (!statusSchnittstelle.includes(pflicht)) throw new Error(`StatusSchnittstellen-Implementierung fehlt: ${pflicht}`);
}
for (const verboten of [
  'Date.now(',
  'Math.random(',
  'location.reload(',
  'window.close(',
  '.reicheAnfrageEin(',
  '.verarbeiteNaechsteAktion(',
  '.brecheAktionAb(',
  '.schliesseAktionAb('
]) {
  if (statusSchnittstelle.includes(verboten)) {
    throw new Error(`StatusSchnittstelle darf keine versteckte Laufzeit-/Aktionsautoritaet verwenden: ${verboten}`);
  }
}
for (const aktionsName of [
  'attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp',
  'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite',
  'buy', 'sell', 'send_item', 'upgrade', 'compound'
]) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(statusSchnittstelle)) {
    throw new Error(`StatusSchnittstelle darf keine Adventure-Land-Aktion aufrufen: ${aktionsName}.`);
  }
}
for (const nichtSpiegeln of [
  'technischeDetails: eingabe.technischeDetails',
  'details: zustand.anfrage.details'
]) {
  if (statusSchnittstelle.includes(nichtSpiegeln)) {
    throw new Error(`StatusSchnittstelle darf interne Detailnutzlast nicht ungeprueft spiegeln: ${nichtSpiegeln}`);
  }
}

const statusTests = await readFile(path.join(wurzel, dateien[19]), 'utf8');
for (const pflicht of [
  'gemeinsame StatusSchnittstelle fasst Kernzustand read-only zusammen',
  'bekannt fehlend und unbekannt bleiben unterscheidbar',
  'fehlender Gesamtcharakter wird nicht mit erfundenen Nullwerten als bekannt dargestellt',
  'Listen werden deterministisch sortiert ohne die Quellen umzuschreiben',
  'Aktionsdetails und technische Meldungsdetails werden nicht in Oberflaechenstatus gespiegelt',
  'fehlende optionale Kernzustaende bleiben explizit leer',
  'StatusSchnittstelle besitzt nur Leseverhalten und veraendert Aktionszustand nicht',
  'ungueltige Status-Metadaten werden fail-safe abgewiesen'
]) {
  if (!statusTests.includes(pflicht)) throw new Error(`StatusSchnittstellen-Test fehlt: ${pflicht}`);
}

const statusDokument = await readFile(path.join(wurzel, dateien[20]), 'utf8');
for (const pflicht of [
  '8.5.5 implementiert',
  'nurLesen: true',
  'spielAutoritaet: false',
  'bedienAutoritaet: false',
  'neustartAutoritaet: false',
  'bekannt',
  'fehlend',
  'unbekannt',
  '8.5.6'
]) {
  if (!statusDokument.includes(pflicht)) throw new Error(`StatusSchnittstellen-Dokumentation fehlt: ${pflicht}`);
}

const hud = await readFile(path.join(wurzel, dateien[21]), 'utf8');
for (const pflicht of [
  'V4IngameHud',
  'pruefeStatusSicht',
  'erstelleAnzeigeModell',
  'erstelleHud',
  'nurLesen',
  'spielAutoritaet',
  'bedienAutoritaet',
  'neustartAutoritaet',
  'statusLieferant',
  'clearInterval',
  'HUD minimieren',
  'HUD schliessen'
]) {
  if (!hud.includes(pflicht)) throw new Error(`Ingame-HUD fehlt: ${pflicht}`);
}
for (const verboten of [
  'Date.now(',
  'Math.random(',
  'location.reload(',
  'window.close(',
  '.reicheAnfrageEin(',
  '.verarbeiteNaechsteAktion(',
  '.brecheAktionAb(',
  '.schliesseAktionAb(',
  'BedienSicherung',
  'registriereAktion'
]) {
  if (hud.includes(verboten)) {
    throw new Error(`Ingame-HUD darf keine versteckte Fach-/Aktions-/Neustartautoritaet verwenden: ${verboten}`);
  }
}
for (const aktionsName of [
  'attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp',
  'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite',
  'buy', 'sell', 'send_item', 'upgrade', 'compound'
]) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(hud)) {
    throw new Error(`Ingame-HUD darf keine Adventure-Land-Aktion aufrufen: ${aktionsName}.`);
  }
}
if (/createElement\(['"]input['"]\)/.test(hud)) {
  throw new Error('Ingame-HUD 8.5.6 darf noch keine veraendernde Eingabe anbieten.');
}

const hudTests = await readFile(path.join(wurzel, dateien[22]), 'utf8');
for (const pflicht of [
  'HUD-API ist vorhanden und bietet nur Anzeige-Helfer',
  'HUD akzeptiert nur die explizit read-only StatusSicht ohne Autoritaet',
  'AnzeigeModell zeigt Charakter Runtime Gruppe Entscheidung Aktion Checkpoint und Meldung',
  'bekanntes null fehlend und unbekannt bleiben in der Anzeige unterscheidbar',
  'fehlende optionale Statusbereiche erzeugen nur Anzeigehinweise und keine Ersatzlogik',
  'AnzeigeModell veraendert die gelieferte StatusSicht nicht',
  'HUD verweigert unvollstaendigen Runtime- oder Charakterstatus fail-safe',
  'ohne Dokument kann kein HUD erzeugt werden aber die Bot-Statuslogik bleibt nutzbar'
]) {
  if (!hudTests.includes(pflicht)) throw new Error(`Ingame-HUD-Test fehlt: ${pflicht}`);
}

const hudDokument = await readFile(path.join(wurzel, dateien[23]), 'utf8');
for (const pflicht of [
  '8.5.6 implementiert',
  'V4IngameHud',
  'nurLesen: true',
  'spielAutoritaet: false',
  'bedienAutoritaet: false',
  'neustartAutoritaet: false',
  'Minimieren',
  'Schliessen',
  '8.5.7'
]) {
  if (!hudDokument.includes(pflicht)) throw new Error(`Ingame-HUD-Dokumentation fehlt: ${pflicht}`);
}

const laufzeitVertrag = await readFile(path.join(wurzel, dateien[24]), 'utf8');
for (const pflicht of [
  'LAUFZEIT_BETRIEBS_ZUSTAENDE',
  "'laeuft'",
  "'pausiert'",
  'automatischeFortsetzung: false',
  'BASIS_BEDIEN_AKTIONEN',
  "'diagnose_aktualisieren'",
  "'laufzeit_pausieren'",
  "'laufzeit_fortsetzen'",
  'erwarteteLaufzeitGeneration',
  'BasisBedienAnfrage'
]) {
  if (!laufzeitVertrag.includes(pflicht)) throw new Error(`Laufzeitsteuerungs-Vertrag fehlt: ${pflicht}`);
}

const laufzeitSteuerung = await readFile(path.join(wurzel, dateien[25]), 'utf8');
for (const pflicht of [
  'class LaufzeitSteuerung',
  'pausiere(',
  'setzeFort(',
  'pruefeAktionsAnfrage(',
  'istPauseGeschuetzteWichtigkeit',
  'automatischeFortsetzung: false',
  'vor der letzten Zustandsaenderung'
]) {
  if (!laufzeitSteuerung.includes(pflicht)) throw new Error(`LaufzeitSteuerung fehlt: ${pflicht}`);
}
for (const verboten of [
  'Date.now(',
  'Math.random(',
  'setInterval(',
  'setTimeout(',
  'location.reload(',
  'window.close(',
  'pausiereLebensnachweisAutomatik(',
  'setzeLebensnachweisAutomatikFort('
]) {
  if (laufzeitSteuerung.includes(verboten)) {
    throw new Error(`LaufzeitSteuerung darf keine versteckte Timer-/Heartbeat-/Neustartautoritaet verwenden: ${verboten}`);
  }
}

const basisBedienung = await readFile(path.join(wurzel, dateien[26]), 'utf8');
for (const pflicht of [
  'class SichereBasisBedienung',
  'BedienSicherung',
  'erstelleBasisBedienAnfrage',
  'laufzeit-generation-aktuell',
  'ausdruecklichBestaetigt',
  'brecheNormaleArbeitFuerPauseAb',
  "status: 'wiederholt'",
  'maxBehandelteVorgaenge',
  'dieselbe LaufzeitSteuerung'
]) {
  if (!basisBedienung.includes(pflicht)) throw new Error(`Sichere Basisbedienung fehlt: ${pflicht}`);
}
for (const verboten of [
  'Date.now(',
  'Math.random(',
  'setInterval(',
  'setTimeout(',
  'location.reload(',
  'window.close(',
  'pausiereLebensnachweisAutomatik(',
  'setzeLebensnachweisAutomatikFort(',
  'sendeLebensnachweis('
]) {
  if (basisBedienung.includes(verboten)) {
    throw new Error(`Basisbedienung darf keine versteckte Timer-/Heartbeat-/Neustartautoritaet verwenden: ${verboten}`);
  }
}
for (const aktionsName of [
  'attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp',
  'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite',
  'buy', 'sell', 'send_item', 'upgrade', 'compound'
]) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(basisBedienung) ||
      new RegExp(`\\b${aktionsName}\\s*\\(`).test(laufzeitSteuerung)) {
    throw new Error(`Basisbedienungs-Kern darf keine Adventure-Land-Aktion aufrufen: ${aktionsName}.`);
  }
}

const basisTests = await readFile(path.join(wurzel, dateien[27]), 'utf8');
for (const pflicht of [
  'LaufzeitSteuerung startet freigegeben und setzt keine automatische Fortsetzung',
  'Pause sperrt normale und Hintergrundarbeit aber nicht Notfall oder Sicherheit',
  'AktionsSteuerung verwirft neue normale Arbeit waehrend Pause statt sie fuer spaeter zu sammeln',
  'sichere Pause laeuft durch BedienSicherung und beendet bestehende normale Arbeit',
  'Pause laesst laufende Sicherheitsarbeit unberuehrt',
  'Fortsetzen ist vorsichtig und ohne ausdrueckliche Bestaetigung blockiert',
  'Fortsetzen belebt vor der Pause abgebrochene Arbeit nicht wieder',
  'Diagnose aktualisieren bleibt read-only',
  'gleiche Vorgangskennung wird nicht doppelt ausgefuehrt',
  'behandelte Vorgangskennungen bleiben hart begrenzt',
  'Bedienung und AktionsSteuerung muessen dieselbe LaufzeitSteuerung teilen',
  'veraltete Laufzeit-Generation blockiert eine spaeter ausgefuehrte Bedienanfrage',
  'manipuliertes Risiko umgeht die kanonische BedienSicherung nicht',
  'rueckwaertiger Zustandszeitpunkt wird fail-safe abgewiesen'
]) {
  if (!basisTests.includes(pflicht)) throw new Error(`Basisbedienungs-Kerntest fehlt: ${pflicht}`);
}

const basisDokument = await readFile(path.join(wurzel, dateien[28]), 'utf8');
for (const pflicht of [
  '8.5.7 in Arbeit',
  'BedienAnfrage -> BedienSicherung -> LaufzeitSteuerung / AktionsSteuerung',
  'automatischeFortsetzung: false',
  'erwarteteLaufzeitGeneration',
  'Doppelklick- und Wiederholungsschutz',
  'Noch offen in 8.5.7'
]) {
  if (!basisDokument.includes(pflicht)) throw new Error(`Basisbedienungs-Kerndokumentation fehlt: ${pflicht}`);
}

const aktionsSteuerungMitPause = await readFile(path.join(wurzel, dateien[29]), 'utf8');
for (const pflicht of [
  'laufzeitSteuerung?: LaufzeitSteuerung',
  'pruefeAktionsAnfrage',
  'brecheNormaleArbeitFuerPauseAb',
  'istMitLaufzeitSteuerungVerbunden'
]) {
  if (!aktionsSteuerungMitPause.includes(pflicht)) {
    throw new Error(`AktionsSteuerung-Laufzeitkopplung fehlt: ${pflicht}`);
  }
}

const produktionsBootstrap = await readFile(path.join(wurzel, dateien[30]), 'utf8');
for (const pflicht of [
  "PRODUKTIONS_BOOTSTRAP_VERSION = '1.1.5'",
  'new LaufzeitSteuerung()',
  'new AktionsSteuerung({ laufzeitSteuerung: this.laufzeitSteuerung })',
  'laufzeitSteuerung: this.laufzeitSteuerung.status()',
  'holeLaufzeitSteuerung()',
  'holeZentraleAktionsSteuerung()'
]) {
  if (!produktionsBootstrap.includes(pflicht)) {
    throw new Error(`8.5.7 Produktions-Bootstrap fehlt: ${pflicht}`);
  }
}

const produktionsEinstieg = await readFile(path.join(wurzel, dateien[31]), 'utf8');
for (const pflicht of [
  "PRODUKTIONS_LAUFZEIT_VERSION = '1.1.5'",
  'SichereBasisBedienung',
  'basisBedienStatus',
  'erstelleBasisBedienAnfrage',
  'fuehreBasisBedienAnfrage',
  'pruefeBasisBedienMutation',
  'bootstrap.holeLaufzeitSteuerung()',
  'bootstrap.holeZentraleAktionsSteuerung()',
  'erwarteteLaufzeitGeneration',
  'ausdruecklichBestaetigt',
  'angefordertAm: Date.now()'
]) {
  if (!produktionsEinstieg.includes(pflicht)) {
    throw new Error(`8.5.7 Produktions-Laufzeiteinstieg fehlt: ${pflicht}`);
  }
}
for (const verboten of [
  'readonly pausiere: ()',
  'readonly setzeFort: ()',
  'laufzeitSteuerung.pausiere(',
  'laufzeitSteuerung.setzeFort(',
  '.brecheNormaleArbeitFuerPauseAb('
]) {
  if (produktionsEinstieg.includes(verboten)) {
    throw new Error(`Produktionsruntime darf den sicheren Basisbedienungs-Kern nicht direkt umgehen: ${verboten}`);
  }
}
for (const aktionsName of [
  'attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp',
  'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite',
  'buy', 'sell', 'send_item', 'upgrade', 'compound'
]) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(produktionsEinstieg)) {
    throw new Error(`Produktions-Basisbedienungsgrenze darf Adventure Land nicht direkt aufrufen: ${aktionsName}.`);
  }
}

const produktionsBootstrapTests = await readFile(path.join(wurzel, dateien[32]), 'utf8');
if (!produktionsBootstrapTests.includes('teilt exakt eine LaufzeitSteuerung mit der zentralen AktionsSteuerung')) {
  throw new Error('Produktions-Bootstrap-Test fuer gemeinsame LaufzeitSteuerung fehlt.');
}

const produktionsEinstiegTests = await readFile(path.join(wurzel, dateien[33]), 'utf8');
for (const pflicht of [
  'bietet nur den gesicherten Basisbedienungs-Kanal',
  'Bot-Pause laeuft durch BedienSicherung und laesst Produktionsheartbeat aktiv',
  'blockiert stale Basisbedienung an der aktuellen Generation',
  'gesperrte oder gestoppte Produktionsruntime erlaubt nur read-only Diagnose'
]) {
  if (!produktionsEinstiegTests.includes(pflicht)) {
    throw new Error(`Produktions-Basisbedienungstest fehlt: ${pflicht}`);
  }
}

const runtimeBedienDokument = await readFile(path.join(wurzel, dateien[34]), 'utf8');
for (const pflicht of [
  'Produktionsruntime-Grenze implementiert',
  '1.1.5',
  'Block-8-Abschluss bleibt historisch unveraendert',
  'Runtime **1.1.4**',
  'basisBedienStatus()',
  'erstelleBasisBedienAnfrage',
  'fuehreBasisBedienAnfrage',
  'Bot-Pause ist keine Heartbeat-Pause',
  'Noch offen in 8.5.7'
]) {
  if (!runtimeBedienDokument.includes(pflicht)) {
    throw new Error(`Produktions-Basisbedienungsdokumentation fehlt: ${pflicht}`);
  }
}

console.log('Block 8.5.1 bis 8.5.7 Runtime-Grenze geprueft: zentraler Bedienkern und Produktionsruntime nutzen dieselbe Laufzeit-/AktionsSteuerung; mutierende Bedienung bleibt hinter BedienSicherung und Produktionsfreigabe, Bot-Pause bleibt vom Heartbeat getrennt.');
