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
  'dokumentation/BLOCK-8-5-BASISBEDIENUNG-RUNTIME.md',
  'werkzeuge/block8-5-ingame-hud-bedienung.js',
  'laufzeit/tests/block8-5-ingame-hud-bedienung.test.mjs',
  'dokumentation/BLOCK-8-5-BASISBEDIENUNG-HUD.md',
  'laufzeit/tests/block8-5-recovery-abnahme.test.mjs',
  'dokumentation/BLOCK-8-5-RECOVERY-ABNAHME.md',
  'laufzeit/quelle/vertraege/freigabestufen.ts',
  'laufzeit/quelle/telemetrie/freigabestufen.ts',
  'laufzeit/tests/block8-5-freigabestufen.test.mjs',
  'dokumentation/BLOCK-8-5-FREIGABESTUFEN.md',
  'dokumentation/FAHRPLAN.md',
  'werkzeuge/block8-5-freigabestufen-live-test.js',
  'laufzeit/tests/block8-5-freigabestufen-live-test.test.mjs',
  'dokumentation/BLOCK-8-5-FREIGABE-LIVE-TEST.md',
  'dokumentation/BLOCK-8-5-RUNTIME-1-1-5-RELEASE-CANDIDATE.json',
  'werkzeuge/block8-5-runtime-1-1-5-release-kandidat-pruefen.mjs',
  'dokumentation/BLOCK-8-5-RUNTIME-1-1-5-RELEASE-CANDIDATE.md',
  '../.github/workflows/release-v4-runtime.yml',
  'werkzeuge/block8-5-v4-runtime-release-workflow-pruefen.mjs',
  'dokumentation/BLOCK-8-5-V4-RUNTIME-RELEASE-WORKFLOW.md',
  'dokumentation/BLOCK-8-5-CANDIDATE-DEPLOYMENT-NACHWEIS.md',
  'dokumentation/BLOCK-8-5-OFFLINE-FREIGABE-NACHWEIS.json',
  'laufzeit/tests/block8-5-offline-freigabe-nachweis.test.mjs',
  'dokumentation/BLOCK-8-5-OFFLINE-FREIGABE-NACHWEIS.md'
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
  'vollstaendige Schritt 8.5.7 ist inzwischen inklusive Produktionsruntime-Grenze und HUD-Bedienadapter abgeschlossen',
  'BedienAnfrage -> BedienSicherung -> LaufzeitSteuerung / AktionsSteuerung',
  'automatischeFortsetzung: false',
  'erwarteteLaufzeitGeneration',
  'Doppelklick- und Wiederholungsschutz',
  '8.5.8 Recovery-Abnahme'
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
  'sichtbare HUD-Bedienadapter ist inzwischen ebenfalls vorhanden',
  'Schritt 8.5.7 ist vollstaendig implementiert',
  '8.5.8 Recovery-Abnahme'
]) {
  if (!runtimeBedienDokument.includes(pflicht)) {
    throw new Error(`Produktions-Basisbedienungsdokumentation fehlt: ${pflicht}`);
  }
}

const hudBedienung = await readFile(path.join(wurzel, dateien[35]), 'utf8');
for (const pflicht of [
  'V4IngameHudBedienung',
  'basisBedienStatus',
  'erstelleBasisBedienAnfrage',
  'fuehreBasisBedienAnfrage',
  'pauseAnfordern',
  'fortsetzenAnfordern',
  'fortsetzenBestaetigen',
  'erwarteteLaufzeitGeneration',
  'ausdruecklichBestaetigt',
  'v4-ingame-hud',
  'v4hud-inhalt',
  '  let vorgangsNummer = 0;',
  'vorgangsNummer += 1'
]) {
  if (!hudBedienung.includes(pflicht)) throw new Error(`HUD-Bedienadapter fehlt: ${pflicht}`);
}
if (hudBedienung.includes('    let vorgangsNummer = 0;')) {
  throw new Error('HUD-Bedienadapter darf die Vorgangsnummer nicht pro Controller zuruecksetzen.');
}
for (const verboten of [
  '.pausiereLebensnachweisAutomatik(',
  '.setzeLebensnachweisAutomatikFort(',
  '.reicheAnfrageEin(',
  '.verarbeiteNaechsteAktion(',
  '.brecheAktionAb(',
  '.schliesseAktionAb(',
  '.stoppe(',
  'Date.now(',
  'Math.random(',
  'location.reload(',
  'window.close('
]) {
  if (hudBedienung.includes(verboten)) {
    throw new Error(`HUD-Bedienadapter darf keinen direkten Heartbeat-/Aktions-/Neustartpfad verwenden: ${verboten}`);
  }
}
for (const aktionsName of [
  'attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp',
  'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite',
  'buy', 'sell', 'send_item', 'upgrade', 'compound'
]) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(hudBedienung)) {
    throw new Error(`HUD-Bedienadapter darf keine Adventure-Land-Aktion aufrufen: ${aktionsName}.`);
  }
}

const hudBedienTests = await readFile(path.join(wurzel, dateien[36]), 'utf8');
for (const pflicht of [
  'exportiert nur sichere Controller- und Montagehelfer',
  'akzeptiert nur Runtime mit den drei sicheren Basisbedienungs-Methoden',
  'Diagnose nutzt ausschliesslich sicheren Anfragepfad',
  'Pause verwendet die zuletzt beobachtete Generation',
  'stale HUD-Generation bleibt sichtbar blockiert',
  'Fortsetzen benoetigt erst lokale Folgenanzeige',
  'Fortsetzen ohne vorherige Bestaetigungsphase ruft Runtime nicht auf',
  'wiederholter Pause-Klick wird lokal blockiert',
  'Vorgangskennungen sind lokal monoton',
  'Remount erzeugt ueber neue Controller hinweg keine identische Vorgangskennung',
  'besitzt keinen direkten Spiel-, Heartbeat-, Aktions- oder Neustartpfad'
]) {
  if (!hudBedienTests.includes(pflicht)) throw new Error(`HUD-Bedienadapter-Test fehlt: ${pflicht}`);
}

const hudBedienDokument = await readFile(path.join(wurzel, dateien[37]), 'utf8');
for (const pflicht of [
  '8.5.7 implementiert',
  'V4IngameHudBedienung',
  'basisBedienStatus()',
  'erstelleBasisBedienAnfrage',
  'fuehreBasisBedienAnfrage',
  'Fortsetzen ist absichtlich zweistufig',
  'Stale-Schutz',
  'Modulebene',
  'Remounts',
  '8.5.8 – Recovery-Abnahme'
]) {
  if (!hudBedienDokument.includes(pflicht)) throw new Error(`HUD-Bedienadapter-Dokumentation fehlt: ${pflicht}`);
}

const recoveryAbnahmeTests = await readFile(path.join(wurzel, dateien[38]), 'utf8');
for (const pflicht of [
  'Reconnect bleibt durch reale Stale-Recovery-Regressionen ohne neue Spielaktion abgesichert',
  'stale Daten eskalieren fail-safe ohne automatische Host-Neustartautoritaet',
  'Browser-Hintergrundbetrieb bleibt an performance_trick und Produktionsheartbeat gebunden',
  'Runtime-Neustart laedt Checkpoint nur zum Abgleich und nie als Fortsetzungsautoritaet',
  'HUD-Schliessen oder HUD-Fehler besitzt keinen Runtime-Aktionspfad',
  'unterbrochene normale Aktion wird nach Fortsetzen nicht wiederbelebt',
  'offener Checkpoint transportiert nur Kennungen und keine Aktionsautoritaet',
  'doppelte Bedienanfrage wird nicht erneut ausgefuehrt',
  'ungueltiger oder veralteter Status wird fail-safe blockiert',
  'Telemetrie- oder Speicherfehler behaelt letzten bestaetigten Zustand und blockiert kritisch'
]) {
  if (!recoveryAbnahmeTests.includes(pflicht)) {
    throw new Error(`Recovery-Abnahmetest fehlt: ${pflicht}`);
  }
}
for (const pflicht of [
  "wiederaufnahmeErlaubt, false",
  "abgleichErforderlich, true",
  "aktionsAutoritaet, false",
  "automatischerNeustart, false",
  "status, 'wiederholt'",
  "kennung === 'laufzeit-generation-aktuell'"
]) {
  if (!recoveryAbnahmeTests.includes(pflicht)) {
    throw new Error(`Recovery-Abnahmesicherung fehlt: ${pflicht}`);
  }
}

const recoveryAbnahmeDokument = await readFile(path.join(wurzel, dateien[39]), 'utf8');
for (const pflicht of [
  '8.5.8 implementiert',
  'keine automatische Host-Neustartautoritaet',
  'keine alte Arbeit automatisch wiederbeleben',
  'kein direkter Spielaktionspfad aus Recovery, GUI oder Telemetrie',
  'Reconnect',
  'Stale Daten',
  'Browser-Hintergrundbetrieb',
  'Runtime-Neustart',
  'HUD-Schliessen oder HUD-Fehler',
  'Unterbrochene Aktion',
  'Offener Checkpoint',
  'Doppelte Bedienanfrage',
  'Ungueltiger oder veralteter Status',
  'Telemetrie-/Speicherfehler',
  'wiederaufnahmeErlaubt: false',
  'abgleichErforderlich: true',
  'aktionsAutoritaet: false',
  'automatischerNeustart: false',
  '8.5.9 – Freigabestufen'
]) {
  if (!recoveryAbnahmeDokument.includes(pflicht)) {
    throw new Error(`Recovery-Abnahme-Dokumentation fehlt: ${pflicht}`);
  }
}

const block85Plan = await readFile(path.join(wurzel, dateien[12]), 'utf8');
for (const pflicht of [
  '8.5.8 – Recovery-Abnahme — **IMPLEMENTIERT**',
  'Checkpoints bleiben nach Runtime-Neustart reine Abgleichsdaten',
  'Unterbrochene normale Arbeit wird nach Fortsetzen nicht wiederbelebt',
  'automatischerNeustart: false',
  '8.5.9 – Freigabestufen'
]) {
  if (!block85Plan.includes(pflicht)) {
    throw new Error(`Block-8.5-Plan fehlt auf Recovery-Abschlussstand: ${pflicht}`);
  }
}

const freigabeVertrag = await readFile(path.join(wurzel, dateien[40]), 'utf8');
for (const pflicht of [
  'FREIGABE_STUFEN',
  "'offline'",
  "'schatten'",
  "'kontrolliert_live'",
  "'soak'",
  'FreigabeNachweis',
  'laufzeitPfadKennung',
  'aenderungsKennung',
  'block9Freigegeben',
  'spielAutoritaet: false',
  'neustartAutoritaet: false'
]) {
  if (!freigabeVertrag.includes(pflicht)) {
    throw new Error(`Freigabestufen-Vertrag fehlt: ${pflicht}`);
  }
}

const freigabeAuswertung = await readFile(path.join(wurzel, dateien[41]), 'utf8');
for (const pflicht of [
  'werteFreigabestufenAus',
  'anderen Laufzeitpfad',
  'anderen Aenderungsstand',
  'mehr als einen Nachweis',
  'Offline-Freigabe braucht einen deterministischen Test- oder Wiederholungsnachweis',
  'Schattenbetrieb darf keine echte Spielaktion ausfuehren',
  'Kontrollierter Live-Test muss explizit begrenzt sein',
  'Soak-Test braucht einen Telemetrie-Nachweis',
  'Soak-Test braucht einen Recovery-Nachweis',
  'Soak-Test braucht eine bestandene Gesamtauswertung',
  'vor der zuvor bestandenen Freigabestufe',
  'block9Freigegeben: freigabeVollstaendig',
  'spielAutoritaet: false',
  'neustartAutoritaet: false'
]) {
  if (!freigabeAuswertung.includes(pflicht)) {
    throw new Error(`Freigabestufen-Auswertung fehlt: ${pflicht}`);
  }
}
for (const verboten of [
  'Date.now(',
  'Math.random(',
  'setInterval(',
  'setTimeout(',
  'location.reload(',
  'window.close(',
  '.reicheAnfrageEin(',
  '.verarbeiteNaechsteAktion(',
  '.brecheAktionAb(',
  '.schliesseAktionAb('
]) {
  if (freigabeAuswertung.includes(verboten)) {
    throw new Error(`Freigabestufen-Auswertung darf keine versteckte Laufzeit-/Aktions-/Neustartautoritaet verwenden: ${verboten}`);
  }
}
for (const aktionsName of [
  'attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp',
  'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite',
  'buy', 'sell', 'send_item', 'upgrade', 'compound'
]) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(freigabeAuswertung)) {
    throw new Error(`Freigabestufen-Auswertung darf keine Adventure-Land-Aktion aufrufen: ${aktionsName}.`);
  }
}

const freigabeTests = await readFile(path.join(wurzel, dateien[42]), 'utf8');
for (const pflicht of [
  'alle vier sequenziellen Nachweise geben Block 9 fuer exakt denselben Aenderungsstand frei',
  'bestandener Offline-Test allein laesst Block 9 gesperrt und fordert Schattenbetrieb',
  'Nachweis eines anderen Aenderungsstands kann nicht wiederverwendet werden',
  'Schattenbetrieb mit echter Spielaktion wird fail-safe nicht anerkannt',
  'kontrollierter Live-Test muss explizit begrenzt sein',
  'Soak-Test braucht Telemetrie Recovery-Nachweis und bestandene Gesamtauswertung',
  'spaetere Nachweise duerfen eine offene vorherige Stufe nicht ueberspringen',
  'fehlgeschlagene Stufe blockiert alle spaeteren Nachweise',
  'zeitlich rueckwaertiger Nachweis kann die Reihenfolge nicht umgehen',
  'doppelte Nachweise derselben Stufe werden als mehrdeutig abgewiesen',
  'leere Pfad- oder Aenderungskennung wird fail-safe abgewiesen'
]) {
  if (!freigabeTests.includes(pflicht)) {
    throw new Error(`Freigabestufen-Test fehlt: ${pflicht}`);
  }
}

const freigabeDokument = await readFile(path.join(wurzel, dateien[43]), 'utf8');
for (const pflicht of [
  '8.5.9 Freigabe-Gate implementiert',
  'Offline-Stufe fuer den exakten Candidate bestanden',
  'Offline-Test oder Wiederholung',
  'Schattenbetrieb ohne echte Spielaktion',
  'begrenzter kontrollierter Live-Test',
  'Soak-Test mit Telemetrie',
  'laufzeitPfadKennung',
  'aenderungsKennung',
  'spielAutoritaet: false',
  'neustartAutoritaet: false',
  'block9Freigegeben: true',
  'block9Freigegeben: false',
  'historische Block-8-Nachweise',
  'Block 9'
]) {
  if (!freigabeDokument.includes(pflicht)) {
    throw new Error(`Freigabestufen-Dokumentation fehlt: ${pflicht}`);
  }
}

const fahrplan = await readFile(path.join(wurzel, dateien[44]), 'utf8');
for (const pflicht of [
  '8.5.9-Freigabe-Gate implementiert',
  'Block 9 bleibt bis dahin gesperrt',
  'BLOCK-8-5-FREIGABESTUFEN.md',
  'Offline, Schattenbetrieb, begrenzter kontrollierter Live-Test und Soak fuer denselben finalen Aenderungsstand'
]) {
  if (!fahrplan.includes(pflicht)) {
    throw new Error(`Fahrplan fehlt auf 8.5.9-Freigabestand: ${pflicht}`);
  }
}

const block85PlanFreigabe = await readFile(path.join(wurzel, dateien[12]), 'utf8');
for (const pflicht of [
  '8.5.9 – Freigabestufen — **GATE IMPLEMENTIERT, OPERATIVE FREIGABE OFFEN**',
  'werteFreigabestufenAus(...)',
  'aenderungsKennung',
  'block9Freigegeben: true',
  'Block 9 gesperrt'
]) {
  if (!block85PlanFreigabe.includes(pflicht)) {
    throw new Error(`Block-8.5-Plan fehlt auf Freigabestufenstand: ${pflicht}`);
  }
}

const freigabeLiveRunner = await readFile(path.join(wurzel, dateien[45]), 'utf8');
for (const pflicht of [
  'V4Block85FreigabeLiveTest',
  "VERSION = '1.1.0'",
  "ERWARTETE_RUNTIME_VERSION = '1.1.5'",
  "ERWARTETE_AENDERUNGS_KENNUNG = 'git:88185523c81687dc16f9647ca5e7568c5e2c228c'",
  "ERWARTETE_RUNTIME_SHA256 = '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f'",
  'releases/88185523c81687dc16f9647ca5e7568c5e2c228c/aio-v4-runtime.js',
  'AIO_V4_BLOCK85_FREIGABE_CONFIG',
  "MODI = Object.freeze(['schatten', 'live'])",
  'schattenUebergabe',
  "betriebsart: 'gesperrt_nicht_gestartet'",
  'V4Bootstrap',
  'basisBedienStatus',
  'erstelleBasisBedienAnfrage',
  'fuehreBasisBedienAnfrage',
  "'diagnose_aktualisieren'",
  "'laufzeit_pausieren'",
  "'laufzeit_fortsetzen'",
  'ausdruecklichBestaetigt: true',
  'SOAK_MIN_MILLIS = 10 * 60 * 1000',
  'SOAK_SAMPLE_MILLIS = 5_000',
  'Schattenbetrieb verlangt eine gesperrte Runtime mit aktivFreigegeben=false',
  'lebensnachweisSendeVersuche',
  'spielAktionAusgefuehrt: false',
  'spielAktionAusgefuehrt: true',
  'telemetrieNachweis',
  'recoveryNachweis',
  'gesamtauswertungBestanden',
  'Kontrollierter Live-Test verlangt zuerst einen bestandenen Schattennachweis',
  'Soak-Test verlangt zuerst einen bestandenen kontrollierten Live-Test'
]) {
  if (!freigabeLiveRunner.includes(pflicht)) {
    throw new Error(`Freigabe-Live-Runner fehlt: ${pflicht}`);
  }
}
for (const verboten of [
  '.pausiereLebensnachweisAutomatik(',
  '.setzeLebensnachweisAutomatikFort(',
  '.bereiteGruppenZielVor(',
  '.installiereGruppenZielLiveSmoke(',
  '.stoppe(',
  'location.reload(',
  'window.close('
]) {
  if (freigabeLiveRunner.includes(verboten)) {
    throw new Error(`Freigabe-Live-Runner darf den sicheren 8.5.9-Pfad nicht umgehen: ${verboten}`);
  }
}
for (const aktionsName of [
  'attack', 'move', 'smart_move', 'use_skill', 'use_hp', 'use_mp',
  'use_hp_or_mp', 'loot', 'send_cm', 'command_character', 'send_party_invite',
  'buy', 'sell', 'send_item', 'upgrade', 'compound'
]) {
  if (new RegExp(`\\b${aktionsName}\\s*\\(`).test(freigabeLiveRunner)) {
    throw new Error(`Freigabe-Live-Runner darf keine Adventure-Land-Spielaktion direkt aufrufen: ${aktionsName}.`);
  }
}

const freigabeLiveTests = await readFile(path.join(wurzel, dateien[46]), 'utf8');
for (const pflicht of [
  'Live-Runner akzeptiert nur Runtime 1.1.5',
  'Schattennachweis verlangt gesperrte nicht gestartete Runtime mit null Heartbeat-Versuchen',
  'Schattennachweis verweigert aktive oder bereits gestartete Runtime',
  'Schattennachweis verweigert jeden vorherigen Heartbeat-Sendeversuch',
  'Schattennachweis ist an exakte immutable Runtime-URL und SHA-256 gebunden',
  'Live-Modus verlangt eine gueltige Schattenuebergabe aus separater Sitzung',
  'kontrollierter Live-Nachweis fuehrt genau Pause und bestaetigtes Fortsetzen aus',
  'Live-Fehler nach Pause setzt die Runtime nicht automatisch fort',
  'Soak erzeugt Telemetrie- und Recovery-Nachweis erst nach Mindestdauer',
  'Soak schlaegt bei unerwarteter Laufzeit-Generation fehl',
  'Live-Runner erzwingt mindestens zehn Minuten Soak',
  'Live-Runner besitzt keinen direkten Adventure-Land-Spielaktionsaufruf'
]) {
  if (!freigabeLiveTests.includes(pflicht)) {
    throw new Error(`Freigabe-Live-Runner-Test fehlt: ${pflicht}`);
  }
}

const freigabeLiveDokument = await readFile(path.join(wurzel, dateien[47]), 'utf8');
for (const pflicht of [
  'Runner implementiert und offline testbar',
  'Runtime 1.1.5',
  '1.1.0',
  'AIO_V4_BLOCK85_FREIGABE_CONFIG',
  "modus: 'schatten'",
  "modus: 'live'",
  'schattenUebergabe',
  'AIO_V4_RUNTIME_CONFIG.aktivFreigegeben: false',
  'lebensnachweisSendeVersuche = 0',
  'separaten aktiven Sitzung',
  'Schattennachweis',
  'Kontrolliert live',
  'Fail-safe bei Fehler nach Pause',
  'Soak',
  '600000 ms = 10 Minuten',
  'spielAktionAusgefuehrt: false',
  'spielAktionAusgefuehrt: true',
  'telemetrieNachweis: true',
  'recoveryNachweis: true',
  'gesamtauswertungBestanden: true',
  'keinen direkten Adventure-Land-Spielaktionsaufruf',
  'Block 9 bleibt'
]) {
  if (!freigabeLiveDokument.includes(pflicht)) {
    throw new Error(`Freigabe-Live-Test-Dokumentation fehlt: ${pflicht}`);
  }
}

if (!freigabeDokument.includes('BLOCK-8-5-FREIGABE-LIVE-TEST.md')) {
  throw new Error('Freigabestufen-Dokumentation verweist noch nicht auf den sicheren Live-Nachweisrunner.');
}
if (!block85PlanFreigabe.includes('Adventure-Land-Nachweisrunner vorbereitet')) {
  throw new Error('Block-8.5-Plan dokumentiert den vorbereiteten Live-Nachweisrunner noch nicht.');
}

const runtimeReleaseKandidatRoh = await readFile(path.join(wurzel, dateien[48]), 'utf8');
const runtimeReleaseKandidat = JSON.parse(runtimeReleaseKandidatRoh);
for (const [feld, erwartet] of Object.entries({
  schemaVersion: 1,
  status: 'release_candidate',
  releaseSha: '88185523c81687dc16f9647ca5e7568c5e2c228c',
  runtimeVersion: '1.1.5',
  laufzeitPfadKennung: 'block8.5-basisbedienung-runtime',
  aenderungsKennung: 'git:88185523c81687dc16f9647ca5e7568c5e2c228c',
  bundleVersion: '4.0.0-alpha.0',
  moduleCount: 31,
  bytes: 228607,
  sha256: '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f',
  deploymentPerformed: true,
  publicHttpsVerified: true,
  adventureLandShadowVerified: false,
  adventureLandControlledLiveVerified: false,
  adventureLandSoakVerified: false,
  block9Freigegeben: false
})) {
  if (runtimeReleaseKandidat[feld] !== erwartet) {
    throw new Error(`Runtime-1.1.5-Release-Candidate besitzt unerwarteten Wert fuer ${feld}.`);
  }
}

const runtimeReleaseKandidatPruefer = await readFile(path.join(wurzel, dateien[49]), 'utf8');
for (const pflicht of [
  'baueProduktionsRuntime',
  'BLOCK-8-5-RUNTIME-1-1-5-RELEASE-CANDIDATE.json',
  "manifest.runtimeVersion !== '1.1.5'",
  'manifest.releaseSha',
  'manifest.laufzeitPfadKennung',
  'manifest.aenderungsKennung',
  'git:<releaseSha>',
  'manifest.moduleCount',
  'manifest.bytes',
  'manifest.sha256',
  'deploymentPerformed',
  'publicHttpsVerified',
  'deploymentEvidence',
  '35402650432',
  '105785689083',
  'publicRuntimeUrl',
  'publicSha256Url',
  'adventureLandShadowVerified',
  'adventureLandControlledLiveVerified',
  'adventureLandSoakVerified',
  'block9Freigegeben',
  'name: release-v4-runtime-immutable',
  'workflow_dispatch:',
  'confirmation:',
  'PUBLISH-V4-IMMUTABLE:$RELEASE_SHA',
  'BLOCK-8-5-RUNTIME-1-1-5-RELEASE-CANDIDATE.json',
  '--experimental-auto-create=false',
  '--experimental-provision=false',
  'Verify immutable V4 objects from R2',
  'Verify immutable V4 release over existing public HTTPS worker',
  'x-aio-v4-release-sha',
  'build.sha256 !== manifest.sha256'
]) {
  if (!runtimeReleaseKandidatPruefer.includes(pflicht)) {
    throw new Error(`Runtime-Release-Candidate-Pruefer fehlt: ${pflicht}`);
  }
}

const runtimeReleaseKandidatDokument = await readFile(path.join(wurzel, dateien[50]), 'utf8');
for (const pflicht of [
  'Release-Candidate reproduzierbar gebunden',
  'Deployment und oeffentliche HTTPS-Verifikation',
  '88185523c81687dc16f9647ca5e7568c5e2c228c',
  'Runtime-API-Version: **1.1.5**',
  'laufzeitPfadKennung: block8.5-basisbedienung-runtime',
  'aenderungsKennung: git:88185523c81687dc16f9647ca5e7568c5e2c228c',
  'Module: **31**',
  'Groesse: **228607 Bytes**',
  '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f',
  'deploymentPerformed: true',
  'publicHttpsVerified: true',
  'adventureLandShadowVerified: false',
  'adventureLandControlledLiveVerified: false',
  'adventureLandSoakVerified: false',
  'block9Freigegeben: false',
  'Block 9 gesperrt'
]) {
  if (!runtimeReleaseKandidatDokument.includes(pflicht)) {
    throw new Error(`Runtime-Release-Candidate-Dokumentation fehlt: ${pflicht}`);
  }
}

const v4OnlyReleaseWorkflow = await readFile(path.join(wurzel, dateien[51]), 'utf8');
for (const pflicht of [
  'name: release-v4-runtime-immutable',
  'workflow_dispatch:',
  'release_sha:',
  'confirmation:',
  'PUBLISH-V4-IMMUTABLE:$RELEASE_SHA',
  'ref: ${{ github.sha }}',
  'ref: ${{ inputs.release_sha }}',
  'BLOCK-8-5-RUNTIME-1-1-5-RELEASE-CANDIDATE.json',
  'npm run produktions-runtime:bauen',
  '--experimental-auto-create=false',
  '--experimental-provision=false',
  'releases/v4/$RELEASE_SHA/aio-v4-runtime.js',
  'releases/v4/$RELEASE_SHA/aio-v4-runtime.sha256',
  'Verify immutable V4 objects from R2',
  'Verify immutable V4 release over existing public HTTPS worker',
  'x-aio-v4-release-sha'
]) {
  if (!v4OnlyReleaseWorkflow.includes(pflicht)) {
    throw new Error(`V4-only Runtime-Release-Workflow fehlt: ${pflicht}`);
  }
}
for (const verboten of [
  'wrangler deploy',
  'wrangler d1',
  'bucket lifecycle',
  'releases/v3/',
  'working-directory: v3',
  'aio-v3-runtime.js',
  'aio-v3.js',
  'release-version.js'
]) {
  if (v4OnlyReleaseWorkflow.includes(verboten)) {
    throw new Error(`V4-only Runtime-Release-Workflow darf V3/Worker/D1/Lifecycle nicht veraendern: ${verboten}`);
  }
}

const v4OnlyReleaseWorkflowPruefer = await readFile(path.join(wurzel, dateien[52]), 'utf8');
for (const pflicht of [
  'V4-only Runtime-Release-Workflow darf keinen push-Trigger besitzen',
  'V4-only Runtime-Release-Workflow darf keinen pull_request-Trigger besitzen',
  'automatische Provisionierung an allen vier Wrangler-R2-Aufrufen deaktivieren',
  'genau einen zentralen R2-put-Aufruf',
  'cmp "$file" "$temp"',
  'releases\\/v4\\/\\$RELEASE_SHA',
  'kein V3/Worker/D1/Lifecycle-Pfad'
]) {
  if (!v4OnlyReleaseWorkflowPruefer.includes(pflicht)) {
    throw new Error(`V4-only Runtime-Release-Workflow-Pruefer fehlt: ${pflicht}`);
  }
}

const v4OnlyReleaseDokument = await readFile(path.join(wurzel, dateien[53]), 'utf8');
for (const pflicht of [
  'isolierter manueller Release-Pfad implementiert',
  'noch nicht ausgefuehrt',
  'release-v4-runtime.yml',
  'workflow_dispatch',
  'PUBLISH-V4-IMMUTABLE:<release_sha>',
  'Zwei getrennte Checkouts',
  'Keine V3- oder Worker-Aenderung',
  'Immutable ohne blindes Ueberschreiben',
  'HTTP 200',
  'HTTP 404',
  'R2-Rueckverifikation',
  'Oeffentliche HTTPS-Rueckverifikation',
  'deploymentPerformed: true',
  'publicHttpsVerified: true',
  'block9Freigegeben: false',
  'Block 9 bleibt'
]) {
  if (!v4OnlyReleaseDokument.includes(pflicht)) {
    throw new Error(`V4-only Runtime-Release-Dokumentation fehlt: ${pflicht}`);
  }
}

const candidateDeploymentNachweis = await readFile(path.join(wurzel, dateien[54]), 'utf8');
for (const pflicht of [
  'Deployment und oeffentliche HTTPS-Verifikation fuer den exakten Candidate bestaetigt',
  '88185523c81687dc16f9647ca5e7568c5e2c228c',
  '35402650432',
  '105785689083',
  'Build and verify V4 production runtime artifacts',
  'Publish immutable V4 runtime release to R2',
  'Verify immutable V4 runtime release in R2',
  'Verify immutable V4 runtime release over public HTTPS',
  '95fa67957873cc229e4dc5c0fea93d84affa1be4b0bc66c87034751b49635a0f',
  'deploymentPerformed: true',
  'publicHttpsVerified: true',
  'adventureLandShadowVerified: false',
  'adventureLandControlledLiveVerified: false',
  'adventureLandSoakVerified: false',
  'block9Freigegeben: false',
  'Block 9 bleibt'
]) {
  if (!candidateDeploymentNachweis.includes(pflicht)) {
    throw new Error(`Candidate-Deploymentnachweis fehlt: ${pflicht}`);
  }
}

if (!runtimeReleaseKandidatDokument.includes('.github/workflows/release-v4-runtime.yml')) {
  throw new Error('Runtime-Release-Candidate verweist noch nicht auf den isolierten V4-only Release-Workflow.');
}
if (runtimeReleaseKandidatDokument.includes('fuer diesen Block-8.5-Runtime-Nachweis nicht mehr der vorgesehene Release-Pfad') !== true) {
  throw new Error('Runtime-Release-Candidate grenzt den breiten historischen Deployment-Workflow noch nicht ab.');
}

const offlineFreigabeRoh = await readFile(path.join(wurzel, dateien[55]), 'utf8');
const offlineFreigabe = JSON.parse(offlineFreigabeRoh);
for (const [feld, erwartet] of Object.entries({
  schemaVersion: 1,
  laufzeitPfadKennung: 'block8.5-basisbedienung-runtime',
  aenderungsKennung: 'git:88185523c81687dc16f9647ca5e7568c5e2c228c'
})) {
  if (offlineFreigabe[feld] !== erwartet) {
    throw new Error(`Offline-Freigabenachweis besitzt unerwarteten Wert fuer ${feld}.`);
  }
}
for (const [feld, erwartet] of Object.entries({
  schemaVersion: 1,
  laufzeitPfadKennung: 'block8.5-basisbedienung-runtime',
  aenderungsKennung: 'git:88185523c81687dc16f9647ca5e7568c5e2c228c',
  stufe: 'offline',
  nachweisKennung: 'offline-ci:88185523c81687dc16f9647ca5e7568c5e2c228c',
  ergebnis: 'bestanden',
  durchgefuehrtAm: 1789771311000,
  deterministisch: true,
  spielAktionAusgefuehrt: false,
  begrenzt: false,
  telemetrieNachweis: false,
  recoveryNachweis: false,
  gesamtauswertungBestanden: false
})) {
  if (offlineFreigabe.nachweis?.[feld] !== erwartet) {
    throw new Error(`Offline-Freigabenachweis.nachweis besitzt unerwarteten Wert fuer ${feld}.`);
  }
}
if (!Array.isArray(offlineFreigabe.ciEvidence) || offlineFreigabe.ciEvidence.length !== 2) {
  throw new Error('Offline-Freigabenachweis muss exakt zwei erforderliche Candidate-CI-Eintraege besitzen.');
}
for (const [index, erwartet] of [
  [0, {
    workflow: 'v4-ci',
    runId: 35402650442,
    jobId: 105785689353,
    runNumber: 287,
    headSha: '88185523c81687dc16f9647ca5e7568c5e2c228c',
    conclusion: 'success',
    completedAt: '2026-09-18T22:41:51Z'
  }],
  [1, {
    workflow: 'v4-grundlage-pruefen',
    runId: 35402650416,
    jobId: 105785688933,
    runNumber: 1150,
    headSha: '88185523c81687dc16f9647ca5e7568c5e2c228c',
    conclusion: 'success',
    completedAt: '2026-09-18T22:41:45Z'
  }]
]) {
  for (const [feld, wert] of Object.entries(erwartet)) {
    if (offlineFreigabe.ciEvidence[index]?.[feld] !== wert) {
      throw new Error(`Offline-CI-Evidenz ${index} besitzt unerwarteten Wert fuer ${feld}.`);
    }
  }
  if (offlineFreigabe.ciEvidence[index].requiredStep !== 'Typen, Tests, Namen und Struktur pruefen') {
    throw new Error(`Offline-CI-Evidenz ${index} ist nicht an den erforderlichen Pruefschritt gebunden.`);
  }
}
for (const [feld, erwartet] of Object.entries({
  offline: 'bestanden',
  naechsteStufe: 'schatten',
  freigabeVollstaendig: false,
  block9Freigegeben: false
})) {
  if (offlineFreigabe.auswertungErwartet?.[feld] !== erwartet) {
    throw new Error(`Offline-Freigabeauswertung besitzt unerwarteten Wert fuer ${feld}.`);
  }
}

const offlineFreigabeTests = await readFile(path.join(wurzel, dateien[56]), 'utf8');
for (const pflicht of [
  'Offline-Nachweis ist an exakten Candidate und zwei erfolgreiche Pflicht-CI-Laeufe gebunden',
  'Offline-Nachweis gibt nur Offline frei und fordert als naechstes Schattenbetrieb',
  'Offline-Nachweis enthaelt keine spaetere Freigabebehauptung',
  'werteFreigabestufenAus',
  '35402650442',
  '105785689353',
  '35402650416',
  '105785688933',
  "assert.equal(status.naechsteStufe, 'schatten')",
  'assert.equal(status.block9Freigegeben, false)'
]) {
  if (!offlineFreigabeTests.includes(pflicht)) {
    throw new Error(`Offline-Freigabenachweis-Test fehlt: ${pflicht}`);
  }
}

const offlineFreigabeDokument = await readFile(path.join(wurzel, dateien[57]), 'utf8');
for (const pflicht of [
  'Stufe 1 Offline fuer den exakten Runtime-1.1.5-Candidate bestanden',
  'BLOCK-8-5-OFFLINE-FREIGABE-NACHWEIS.json',
  '35402650442',
  '105785689353',
  '35402650416',
  '105785688933',
  '1789771311000',
  'offline -> bestanden',
  'schatten -> offen',
  'naechsteStufe: schatten',
  'block9Freigegeben: false',
  'Schattenbetrieb',
  'Block 9 bleibt gesperrt'
]) {
  if (!offlineFreigabeDokument.includes(pflicht)) {
    throw new Error(`Offline-Freigabenachweis-Dokumentation fehlt: ${pflicht}`);
  }
}

if (!freigabeDokument.includes('BLOCK-8-5-OFFLINE-FREIGABE-NACHWEIS.json')) {
  throw new Error('Freigabestufen-Dokumentation verweist noch nicht auf den kanonischen Offline-Nachweis.');
}
if (!block85PlanFreigabe.includes('Die Freigabestufe **Offline** ist jetzt ebenfalls')) {
  throw new Error('Block-8.5-Plan markiert Offline noch nicht als bestanden.');
}

console.log('Block 8.5.1 bis 8.5.9 geprueft: Candidate-Deployment/HTTPS und Offline-Freigabestufe sind fuer git:88185523 eindeutig bestanden; der naechste Schattenlauf ist strikt gesperrt/nicht gestartet und muss 0 Heartbeat-/CM-Sendeversuche beweisen; Live/Soak bleiben getrennt und Block 9 gesperrt.');
