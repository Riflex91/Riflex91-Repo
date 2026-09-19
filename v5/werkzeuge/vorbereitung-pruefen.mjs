import fs from 'node:fs';

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

console.log('[V5-VORBEREITUNG] OK');
console.log('[V5-VORBEREITUNG] Anforderungen:', anforderungsKennungen.size);
console.log('[V5-VORBEREITUNG] Gefahren:', gefahrenKennungen.size);
console.log('[V5-VORBEREITUNG] Invarianten:', invariantenKennungen.size);
console.log('[V5-VORBEREITUNG] Zustandsautomaten:', zustaende.automaten.length);
console.log('[V5-VORBEREITUNG] Fitness-Regeln:', fitness.regeln.length);
console.log('[V5-VORBEREITUNG] Laufzeit-Bereitschaft:', bereitschaft.status);
