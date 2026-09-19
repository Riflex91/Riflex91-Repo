import fs from 'node:fs';

const liesJson = (pfad) => JSON.parse(fs.readFileSync(pfad, 'utf8'));
const fehler = (text) => { throw new Error('[V5-R2] ' + text); };
const eindeutig = (werte, name) => {
  const menge = new Set(werte);
  if (menge.size !== werte.length) fehler('Doppelte Kennung in ' + name);
  return menge;
};
const existiert = (pfad) => {
  if (!fs.existsSync(pfad)) fehler('Pflichtartefakt fehlt: ' + pfad);
};
const enthaelt = (pfad, text) => {
  existiert(pfad);
  if (!fs.readFileSync(pfad, 'utf8').includes(text)) fehler(pfad + ': Pflichttext fehlt: ' + text);
};

const invarianten = liesJson('v5/invarianten/invarianten.json');
const migration = liesJson('v5/migration/v3-v4-zu-v5.json');
const v3Fehler = liesJson('v5/migration/v3-fehlerabdeckung.json');
const verfassung = liesJson('v5/architektur/verfassung.json');
const anforderungen = liesJson('v5/anforderungen/anforderungen.json');
const trace = liesJson('v5/anforderungen/nachverfolgbarkeit.json');
const gefahren = liesJson('v5/gefahren/gefahrenkatalog.json');
const zustaende = liesJson('v5/zustaende/zustandsautomaten.json');
const fitness = liesJson('v5/fitness/fitness-regeln.json');
const freigaben = liesJson('v5/entwicklungsregeln/quellenfreigaben.json');
const revalidierung = liesJson('v5/entwicklungsregeln/r2-quellenrevalidierung.json');
const wissensnutzung = liesJson('v5/entwicklungsregeln/wissensnutzung.json');
const quellenstatus = liesJson('v5/wissensbasis/datenbank/quellenstatus.json');
const bereitschaft = liesJson('v5/bereitschaft/laufzeit-bereitschaft.json');

const alt = invarianten.invarianten.filter(x => /^V5-ALT-\d{3}$/.test(x.kennung));
if (alt.length !== 55) fehler('Es muessen exakt 55 V4-Invarianten ratifiziert sein.');
const erlaubteEntscheidungen = new Set(['UEBERNEHMEN','VERSCHAERFEN','ERSETZEN']);
for (const x of alt) {
  if (x.ratifizierungsStatus !== 'R2_RATIFIZIERT') fehler(x.kennung + ': nicht R2-ratifiziert');
  if (!erlaubteEntscheidungen.has(x.v5Entscheidung)) fehler(x.kennung + ': ungueltige R2-Entscheidung');
  if (!x.begruendung) fehler(x.kennung + ': Begruendung fehlt');
}
if (invarianten.status !== 'R2_RATIFIZIERT') fehler('Invarianten-Gesamtstatus ist nicht R2_RATIFIZIERT.');
for (let i = 99; i <= 106; i++) {
  const id = 'V5-INV-' + String(i).padStart(3, '0');
  if (!invarianten.invarianten.some(x => x.kennung === id)) fehler('R2-Invariante fehlt: ' + id);
}
if (invarianten.zusammenfassung?.ausV4 !== 55
    || invarianten.zusammenfassung?.neuV5 !== 106
    || invarianten.zusammenfassung?.gesamt !== 161) {
  fehler('Invarianten-Zusammenfassung muss 55/106/161 entsprechen.');
}

if (migration.status !== 'R2_RATIFIZIERT' || migration.eintraege?.length !== 47) fehler('Migrationsmatrix muss 47 R2-ratifizierte Eintraege enthalten.');
const erlaubteMigration = new Set(['PORTIEREN','UMBAUEN','NEU_BAUEN','NUR_WISSENSQUELLE','VERWERFEN']);
eindeutig(migration.eintraege.map(x => x.kennung), 'Migrationsmatrix');
for (const x of migration.eintraege) {
  if (!erlaubteMigration.has(x.v5Entscheidung)) fehler(x.kennung + ': ungueltige Migrationsentscheidung');
  if (x.quellcodeWiederverwendung !== false) fehler(x.kennung + ': historische Runtime-Codewiederverwendung ist nicht erlaubt');
}
if (migration.zusammenfassung?.NEU_BAUEN !== 44
    || migration.zusammenfassung?.NUR_WISSENSQUELLE !== 1
    || migration.zusammenfassung?.VERWERFEN !== 2) {
  fehler('Migrationsmatrix-Zusammenfassung driftet von 44/1/2.');
}

if (v3Fehler.status !== 'R2_RATIFIZIERT' || v3Fehler.anzahl !== 30 || v3Fehler.fehler?.length !== 30) fehler('V3-Fehlerabdeckung muss exakt 30 Eintraege enthalten.');
const fehlerIds = eindeutig(v3Fehler.fehler.map(x => x.kennung), 'V3-Fehlerabdeckung');
for (let i = 1; i <= 30; i++) {
  const id = 'V3ERR-' + String(i).padStart(3, '0');
  if (!fehlerIds.has(id)) fehler('V3-Fehler fehlt: ' + id);
}
for (const x of v3Fehler.fehler) {
  if (x.status !== 'STRUKTURELL_ABGEDECKT_R2' || !x.gegenmassnahme || !x.invarianten?.length || !x.roadmapPhasen?.length) {
    fehler(x.kennung + ': strukturelle R2-Abdeckung unvollstaendig');
  }
}

if (verfassung.status !== 'R2_RATIFIZIERT' || verfassung.runtimeGate !== 'GESCHLOSSEN') fehler('R2-Verfassung oder Runtime-Gate ungueltig.');
if (verfassung.freigabe?.r2IstKeineRuntimeFreigabe !== true) fehler('R2 darf keine Runtime-Freigabe sein.');
if (verfassung.transaktionsmodell?.blindRetryNachMoeglichemSend !== false
    || verfassung.transaktionsmodell?.durableIntentVorWertmutation !== true) {
  fehler('Transaktionsverfassung verletzt UNKNOWN/Persist-before-action.');
}
if (verfassung.wissen?.runtimePort !== 'WissensZugriffPort'
    || verfassung.wissen?.snapshotPinning !== true
    || verfassung.wissen?.rohSnapshotGameplayAuthority !== false
    || verfassung.wissen?.kandidatGameplayAuthority !== false
    || verfassung.wissen?.liveWissenGameplayAuthority !== false) {
  fehler('Knowledge-Authority-Grenze der Verfassung ist unvollstaendig.');
}
if (verfassung.persistenz?.mindestFreieReserveProzent !== 15
    || verfassung.persistenz?.nichtkritischesIoHotPath !== false
    || verfassung.persistenz?.kritischeIntentsDurableVorMutation !== true
    || verfassung.persistenz?.stillerFallbackSystemlaufwerk !== false) {
  fehler('SSD-/Persistenz-Verfassung ist unvollstaendig.');
}
if (verfassung.mehrfachVerriegelung?.einzelnerFachfehlerDarfRawWriteAlleinErmoeglichen !== false) fehler('Mehrfach-Verriegelung ist nicht fail-closed.');

const layer = verfassung.layerGraph?.layer ?? [];
const layerIds = eindeutig(layer.map(x => x.id), 'Verfassungs-Layer');
const graph = new Map(layer.map(x => [x.id, x.darfAbhaengenVon ?? []]));
for (const [id, deps] of graph) for (const dep of deps) if (!layerIds.has(dep)) fehler(id + ': unbekannter Layer ' + dep);
const visiting = new Set(), visited = new Set();
function visit(id) {
  if (visiting.has(id)) fehler('Layer-Zyklus bei ' + id);
  if (visited.has(id)) return;
  visiting.add(id);
  for (const dep of graph.get(id) ?? []) visit(dep);
  visiting.delete(id);
  visited.add(id);
}
for (const id of layerIds) visit(id);

if (anforderungen.anzahl !== anforderungen.anforderungen?.length || anforderungen.anzahl < 99) fehler('Anforderungsanzahl ungueltig.');
if (anforderungen.ratifizierungsStatus !== 'R2_RATIFIZIERT') fehler('Anforderungen nicht R2-ratifiziert.');
for (const x of anforderungen.anforderungen) {
  if (x.ratifizierungsStatus !== 'R2_RATIFIZIERT') fehler(x.kennung + ': Anforderung nicht R2-ratifiziert');
  if (typeof x.status !== 'string' || x.status.length === 0) fehler(x.kennung + ': Anforderungsstatus fehlt');
}
if (trace.ratifizierungsStatus !== 'R2_RATIFIZIERT' || trace.eintraege?.length !== anforderungen.anzahl) fehler('Nachverfolgbarkeit nicht konsistent R2-ratifiziert.');
for (const x of trace.eintraege) {
  if (x.ratifizierungsStatus !== 'R2_RATIFIZIERT') fehler(x.anforderungKennung + ': Trace nicht ratifiziert');
  if (typeof x.vollstaendig !== 'boolean') fehler(x.anforderungKennung + ': Trace-Vollstaendigkeit muss boolean sein');
}

if (gefahren.anzahl !== gefahren.gefahren?.length || gefahren.anzahl !== 161) fehler('Gefahrenanzahl muss exakt zum 161er-Katalog passen.');
if (gefahren.ratifizierungsStatus !== 'R2_RATIFIZIERT' || !gefahren.restrisikoRegel) fehler('Gefahren-/Restrisiko-Ratifizierung fehlt.');
for (const x of gefahren.gefahren) {
  if (x.ratifizierungsStatus !== 'R2_RATIFIZIERT') fehler(x.kennung + ': Gefahr nicht R2-ratifiziert');
  if (typeof x.status !== 'string' || x.status.length === 0) fehler(x.kennung + ': Gefahrenstatus fehlt');
}

if (zustaende.status !== 'R2_RATIFIZIERT' || zustaende.automaten?.length !== 13) fehler('Zustandsautomaten nicht R2-ratifiziert.');
for (const a of zustaende.automaten) {
  if (a.ratifizierungsStatus !== 'R2_RATIFIZIERT' || a.unbekannterUebergang !== 'FAIL_CLOSED') fehler(a.kennung + ': R2-Zustandsregel fehlt');
  const states = eindeutig(a.zustaende, a.kennung + '/Zustaende');
  const edges = new Set();
  for (const e of a.uebergaenge) {
    if (!states.has(e.von) || !states.has(e.nach)) fehler(a.kennung + ': ungueltiger Uebergang');
    const key=e.von+'->'+e.nach;
    if(edges.has(key)) fehler(a.kennung + ': doppelter Uebergang ' + key);
    edges.add(key);
  }
}
const tx = zustaende.automaten.find(x => x.kennung === 'V5-ZUSTAND-TRANSAKTION');
if (!tx || tx.uebergaenge.some(x => x.von === 'ERGEBNIS_UNBEKANNT' && x.nach === 'GESENDET')) fehler('UNKNOWN darf keinen direkten Re-Send-Uebergang besitzen.');
if (!tx.verbote?.some(x => x.includes('durable') && x.includes('INTENT_GESPEICHERT'))) fehler('Durable Intent vor GESENDET fehlt im Transaktionsautomaten.');

if (fitness.status !== 'R2_RATIFIZIERT') fehler('Fitness-Regeln nicht R2-ratifiziert.');
for (let i = 39; i <= 47; i++) {
  const id='V5-FIT-'+String(i).padStart(3,'0');
  if (!fitness.regeln.some(x => x.kennung === id)) fehler('R2-Fitnessregel fehlt: ' + id);
}

if (freigaben.status !== 'R2_BASISLINES_RATIFIZIERT') fehler('Quellenfreigaben nicht R2-ratifiziert.');
const statusMap = new Map(quellenstatus.quellen.map(x => [x.kennung, x]));
const signalNur = new Set(wissensnutzung.quellengruppen?.signalNur ?? []);
for (const f of freigaben.quellenfreigaben) {
  const aktuell = statusMap.get(f.kennung);
  if (!aktuell) fehler('Quellenstatus fehlt fuer ' + f.kennung);
  if (aktuell.inhaltSha256 !== f.letzterBewerteterSha256) fehler('Unbewertete Hash-Drift bei ' + f.kennung);
  if (!signalNur.has(f.kennung) && f.fuerImplementierung !== true) fehler('Implementierungsfreigabe fehlt fuer ' + f.kennung);
}
if (revalidierung.status !== 'R2_REVALIDIERT' || (revalidierung.eintraege?.length ?? 0) < 4 || revalidierung.eintraege.some(x => x.widerspruch !== false)) {
  fehler('R2-Quellendrift-Revalidierung unvollstaendig.');
}

for (const pfad of [
  'v5/dokumentation/V5-VERFASSUNG-R2.md',
  'v5/dokumentation/V5-MIGRATIONSMATRIX.md',
  'v5/dokumentation/V5-V3-FEHLERABDECKUNG.md',
  'v5/dokumentation/V5-DEUTSCHE-DOMAENENMIGRATION.md',
  'v5/dokumentation/V5-R2-STRATEGIEN.md',
  'v5/dokumentation/DEUTSCHE_NAMEN_UND_NARRENSICHERHEIT.md',
  'v5/dokumentation/WISSENSWAECHTER-VERTRAG.md',
  'v5/dokumentation/ENTWICKLUNGS-WISSENSGATE.md',
  'v5/dokumentation/LOKALES-SSD-DATENFUNDAMENT.md',
  'v5/dokumentation/LIVE-WISSEN-SSD-VERTRAG.md',
  'v5/dokumentation/VOR-RUNTIME-SPEZIFIKATION.md'
]) existiert(pfad);

for (const pfad of [
  'v5/dokumentation/DEUTSCHE_NAMEN_UND_NARRENSICHERHEIT.md',
  'v5/dokumentation/WISSENSWAECHTER-VERTRAG.md',
  'v5/dokumentation/ENTWICKLUNGS-WISSENSGATE.md',
  'v5/dokumentation/LOKALES-SSD-DATENFUNDAMENT.md',
  'v5/dokumentation/LIVE-WISSEN-SSD-VERTRAG.md',
  'v5/dokumentation/VOR-RUNTIME-SPEZIFIKATION.md'
]) enthaelt(pfad, 'R2-Status:** RATIFIZIERT');

if (bereitschaft.status === 'FREIGEGEBEN') fehler('R2 darf das Gameplay-Runtime-Gesamtgate nicht FREIGEBEN.');

console.log('[V5-R2] OK');
console.log('[V5-R2] V4-Invarianten:', alt.length);
console.log('[V5-R2] V3/V4-Migration:', migration.eintraege.length);
console.log('[V5-R2] V3-Fehlerabdeckung:', v3Fehler.fehler.length);
console.log('[V5-R2] Anforderungen:', anforderungen.anforderungen.length);
console.log('[V5-R2] Gefahren:', gefahren.gefahren.length);
console.log('[V5-R2] Zustaende:', zustaende.automaten.length);
console.log('[V5-R2] Fitness:', fitness.regeln.length);
console.log('[V5-R2] Runtime-Gate:', verfassung.runtimeGate, '/', bereitschaft.status);
