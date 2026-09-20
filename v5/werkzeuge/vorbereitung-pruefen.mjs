import fs from 'node:fs';
import { pruefeR0R3Reconciliation } from './r0-r3-reconciliation-pruefen.mjs';

const liesJson = (pfad) => JSON.parse(fs.readFileSync(pfad, 'utf8'));
const fehler = (text) => { throw new Error('[V5-VORBEREITUNG] ' + text); };
const eindeutig = (werte, name) => {
  const menge = new Set(werte);
  if (menge.size !== werte.length) fehler('Doppelte Kennung in ' + name);
  return menge;
};

const anforderungen = liesJson('v5/anforderungen/anforderungen.json');
const nachverfolgung = liesJson('v5/anforderungen/nachverfolgbarkeit.json');
const gefahren = liesJson('v5/gefahren/gefahrenkatalog.json');
const invarianten = liesJson('v5/invarianten/invarianten.json');
const zustaende = liesJson('v5/zustaende/zustandsautomaten.json');
const fitness = liesJson('v5/fitness/fitness-regeln.json');
const bereitschaft = liesJson('v5/bereitschaft/laufzeit-bereitschaft.json');
const anzeige = liesJson('v5/anzeigetexte/regelwerk.json');
const entwicklungsWissen = liesJson('v5/entwicklungsregeln/wissensnutzung.json');
const quellenfreigaben = liesJson('v5/entwicklungsregeln/quellenfreigaben.json');
const wissensManifest = liesJson('v5/wissensbasis/manifest.json');
const liveWissenRegel = entwicklungsWissen.liveWissen;

const anforderungsKennungen = eindeutig(anforderungen.anforderungen.map(x => x.kennung), 'Anforderungen');
const gefahrenKennungen = eindeutig(gefahren.gefahren.map(x => x.kennung), 'Gefahren');
const invariantenKennungen = eindeutig(invarianten.invarianten.map(x => x.kennung), 'Invarianten');
eindeutig(fitness.regeln.map(x => x.kennung), 'Fitness-Regeln');
eindeutig(zustaende.automaten.map(x => x.kennung), 'Zustandsautomaten');

if (invarianten.invarianten.filter(x => x.herkunft?.startsWith('V4-INV-')).length !== 55) {
  fehler('Es muessen exakt 55 V4-Invarianten als Ratifizierungsbasis vorhanden sein.');
}
if (!invariantenKennungen.has('V5-INV-031') || !invariantenKennungen.has('V5-INV-034')) {
  fehler('Deutsche Sichttext-Invarianten fehlen.');
}
if (!anforderungsKennungen.has('V5-ANF-UI-009')) {
  fehler('Monster-Anzeigeregel fehlt.');
}
if (anzeige.kategorien.monster.deutschPflicht !== 'WENN_OFFIZIELLE_DEUTSCHE_SPIELBEZEICHNUNG_EXISTIERT') {
  fehler('Monster-Ausnahme ist nicht korrekt festgelegt.');
}
if (anzeige.kategorien.monster.englischerRohFallbackErlaubt !== true) {
  fehler('Originaler Monstername muss bei fehlender offizieller deutscher Bezeichnung erlaubt sein.');
}
if (entwicklungsWissen.manifestPfad !== 'v5/wissensbasis/manifest.json') {
  fehler('Entwicklungs-Wissensgate zeigt nicht auf den kanonischen Manifest.');
}
if (entwicklungsWissen.frische?.blockiereImplementierungNachMinuten !== 180) {
  fehler('Wissensgate-Blockierfenster muss aktuell 180 Minuten betragen.');
}
eindeutig(quellenfreigaben.quellenfreigaben.map(x => x.kennung), 'Quellenfreigaben');
if (!quellenfreigaben.quellenfreigaben.length) fehler('Quellenfreigaben fehlen.');
if (!liveWissenRegel
    || liveWissenRegel.lokalerStandardpfad !== 'D:\\AdventureLand-V5\\wissensdatenbank'
    || liveWissenRegel.githubSnapshot !== 'v5/wissensbasis/live/snapshot'
    || liveWissenRegel.bridgeRolle !== 'READ_ONLY_VALIDIEREN_UND_SPIEGELN'
    || liveWissenRegel.botRolle !== 'ALLEINIGER_FACHLICHER_WRITER'
    || liveWissenRegel.executionAuthority !== false) {
  fehler('Live-Wissensnutzungsregel unvollstaendig oder unsicher.');
}
if (!wissensManifest.liveWissen
    || wissensManifest.liveWissen.lokalerStandardpfad !== 'D:\\AdventureLand-V5\\wissensdatenbank'
    || wissensManifest.liveWissen.snapshotPfad !== 'live/snapshot') {
  fehler('Wissensmanifest enthaelt keinen gueltigen Live-Wissensbereich.');
}
if (!anforderungsKennungen.has('V5-ANF-WISSEN-029')
    || !invariantenKennungen.has('V5-INV-050')) {
  fehler('Live-Wissensanforderungen/Invarianten fehlen.');
}

for (const [kategorie, regel] of Object.entries(anzeige.kategorien)) {
  if (kategorie !== 'monster' && regel.englischerRohFallbackErlaubt !== false) {
    fehler('Unerlaubter englischer Rohfallback in Kategorie ' + kategorie);
  }
}

for (const anforderung of anforderungen.anforderungen) {
  for (const kennung of anforderung.risikoKennungen ?? []) {
    if (!gefahrenKennungen.has(kennung)) fehler(anforderung.kennung + ': unbekannte Gefahr ' + kennung);
  }
  for (const kennung of anforderung.invariantenKennungen ?? []) {
    if (!invariantenKennungen.has(kennung)) fehler(anforderung.kennung + ': unbekannte Invariante ' + kennung);
  }
}

const traceKennungen = eindeutig(nachverfolgung.eintraege.map(x => x.anforderungKennung), 'Nachverfolgbarkeit');
if (traceKennungen.size !== anforderungsKennungen.size) {
  fehler('Nachverfolgbarkeit und Anforderungen haben unterschiedliche Anzahl.');
}
for (const kennung of anforderungsKennungen) {
  if (!traceKennungen.has(kennung)) fehler('Anforderung fehlt in Nachverfolgbarkeit: ' + kennung);
}

for (const automat of zustaende.automaten) {
  const menge = eindeutig(automat.zustaende, automat.kennung + '/Zustaende');
  if (!menge.has(automat.start)) fehler(automat.kennung + ': Startzustand fehlt.');
  for (const ende of automat.terminal ?? []) if (!menge.has(ende)) fehler(automat.kennung + ': Terminalzustand fehlt: ' + ende);
  const kanten = new Set();
  for (const uebergang of automat.uebergaenge) {
    if (!menge.has(uebergang.von) || !menge.has(uebergang.nach)) fehler(automat.kennung + ': ungueltiger Uebergang');
    const schluessel = uebergang.von + '->' + uebergang.nach;
    if (kanten.has(schluessel)) fehler(automat.kennung + ': doppelter Uebergang ' + schluessel);
    kanten.add(schluessel);
  }
}

const pflicht = [
  'WISSEN_BEREIT','P0_RESEARCH_BEREIT','ANFORDERUNGEN_BEREIT','INVARIANTEN_BEREIT',
  'ZUSTANDSMASCHINEN_BEREIT','FEHLERMODELL_BEREIT','PERSISTENZMODELL_BEREIT',
  'TESTSTRATEGIE_BEREIT','SECURITY_BEREIT','BETRIEBSMODELL_BEREIT'
];
const bereitschaftKennungen = eindeutig(bereitschaft.bereiche.map(x => x.kennung), 'Bereitschaft');
if (bereitschaftKennungen.size !== pflicht.length) fehler('Bereitschaft braucht exakt zehn Pflichtbereiche.');
for (const kennung of pflicht) if (!bereitschaftKennungen.has(kennung)) fehler('Bereitschaft fehlt: ' + kennung);
const allesErfuellt = bereitschaft.bereiche.every(x => x.erfuellt === true);
if (bereitschaft.status === 'FREIGEGEBEN' && !allesErfuellt) fehler('FREIGEGEBEN trotz offener Pflichtbereiche.');
if (bereitschaft.status !== 'FREIGEGEBEN' && allesErfuellt) fehler('Alle Pflichtbereiche erfuellt, Status aber nicht FREIGEGEBEN.');
const bereich = kennung => bereitschaft.bereiche.find(x => x.kennung === kennung);
const offeneAnforderungen = anforderungen.anforderungen.filter(x => x.status === 'OFFEN');
const unvollstaendigeTrace = nachverfolgung.eintraege.filter(x => x.vollstaendig !== true);
const wissen012 = anforderungen.anforderungen.find(x => x.kennung === 'V5-ANF-WISSEN-012');

const invariantBereit = bereich('INVARIANTEN_BEREIT');
if (invariantBereit?.erfuellt !== true
    || invariantBereit.invariantenRatifiziert !== 161
    || invariantBereit.invariantenGesamt !== 161) {
  fehler('INVARIANTEN_BEREIT muss nach R19 mit 161/161 ratifizierten Invarianten technisch geschlossen sein.');
}

const fehlermodellBereit = bereich('FEHLERMODELL_BEREIT');
if (fehlermodellBereit?.erfuellt !== true
    || fehlermodellBereit.gefahrenModelliert !== 161
    || fehlermodellBereit.gefahrenGesamt !== 161
    || fehlermodellBereit.roadmapPhasenDone !== 20) {
  fehler('FEHLERMODELL_BEREIT muss 161/161 modellierte Gefahren und R0-R19 DONE nachweisen.');
}

if (wissen012?.status === 'OFFEN') {
  if (offeneAnforderungen.length !== 1 || offeneAnforderungen[0].kennung !== 'V5-ANF-WISSEN-012') {
    fehler('Vor externem Autorisierungsnachweis darf nur V5-ANF-WISSEN-012 offen sein.');
  }
  if (unvollstaendigeTrace.length !== 1
      || unvollstaendigeTrace[0].anforderungKennung !== 'V5-ANF-WISSEN-012') {
    fehler('Vor externem Autorisierungsnachweis darf nur die Traceability von V5-ANF-WISSEN-012 unvollstaendig sein.');
  }

  const anforderungenBereit = bereich('ANFORDERUNGEN_BEREIT');
  const securityBereit = bereich('SECURITY_BEREIT');
  const betriebBereit = bereich('BETRIEBSMODELL_BEREIT');
  if (anforderungenBereit?.erfuellt !== false
      || anforderungenBereit.anforderungenNachgewiesen !== 118
      || anforderungenBereit.anforderungenGesamt !== 119
      || anforderungenBereit.traceabilityVollstaendig !== 118
      || anforderungenBereit.traceabilityGesamt !== 119
      || anforderungenBereit.externerBlocker !== 'V5-ANF-WISSEN-012') {
    fehler('ANFORDERUNGEN_BEREIT muss vor WISSEN-012-Nachweis bei 118/119 fail-closed bleiben.');
  }
  if (securityBereit?.erfuellt !== false
      || securityBereit.externerBlocker !== 'V5-ANF-WISSEN-012') {
    fehler('SECURITY_BEREIT muss bis zum Least-Privilege-Nachweis gesperrt bleiben.');
  }
  if (betriebBereit?.erfuellt !== false
      || betriebBereit.lokalerBridgeNachweisErforderlich !== true) {
    fehler('BETRIEBSMODELL_BEREIT muss bis zum lokalen Bridge-Nachweis gesperrt bleiben.');
  }

  const falscheBereiche = bereitschaft.bereiche
    .filter(x => x.erfuellt !== true)
    .map(x => x.kennung)
    .sort();
  const erwartetFalsch = ['ANFORDERUNGEN_BEREIT','BETRIEBSMODELL_BEREIT','SECURITY_BEREIT'].sort();
  if (JSON.stringify(falscheBereiche) !== JSON.stringify(erwartetFalsch)) {
    fehler('Vor lokalem Bridge-/Autorisierungsnachweis muessen exakt drei Pflichtbereiche offen bleiben.');
  }
  if (bereitschaft.status !== 'GESPERRT') {
    fehler('Mit offenem WISSEN-012 muss die globale Runtime GESPERRT bleiben.');
  }
}

for (const pfad of [
  'v5/dokumentation/WISSENSWAECHTER-VERTRAG.md',
  'v5/dokumentation/VOR-RUNTIME-SPEZIFIKATION.md',
  'v5/dokumentation/DEUTSCHE_NAMEN_UND_NARRENSICHERHEIT.md',
  'v5/dokumentation/ENTWICKLUNGS-WISSENSGATE.md',
  'v5/dokumentation/LIVE-WISSEN-SSD-VERTRAG.md',
  'v5/wissensbasis/live/README.md',
  'v5/entwicklungsregeln/wissensnutzung.json',
  'v5/entwicklungsregeln/quellenfreigaben.json',
  'v5/werkzeuge/entwicklungs-wissensgate.mjs'
]) {
  if (!fs.existsSync(pfad)) fehler('Pflichtdokument fehlt: ' + pfad);
}

pruefeR0R3Reconciliation();

console.log('[V5-VORBEREITUNG] OK');
console.log('[V5-VORBEREITUNG] Anforderungen:', anforderungsKennungen.size);
console.log('[V5-VORBEREITUNG] Gefahren:', gefahrenKennungen.size);
console.log('[V5-VORBEREITUNG] Invarianten:', invariantenKennungen.size);
console.log('[V5-VORBEREITUNG] Zustandsautomaten:', zustaende.automaten.length);
console.log('[V5-VORBEREITUNG] Fitness-Regeln:', fitness.regeln.length);
console.log('[V5-VORBEREITUNG] Laufzeit-Bereitschaft:', bereitschaft.status);
