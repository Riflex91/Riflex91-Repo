import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const kb = path.join(root, 'v5', 'wissensbasis');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(kb, rel), 'utf8'));
const fail = (message) => { throw new Error(`[V5-WISSEN] ${message}`); };

const manifest = readJson('manifest.json');
const sourcesDoc = readJson(manifest.sources.registry);
const factsDocs = manifest.facts.map(readJson);
const questionDocs = manifest.questions.map(readJson);
const contractDocs = (manifest.contracts ?? []).map(readJson);
const revalidation = readJson(manifest.revalidation);

const sources = new Map(sourcesDoc.sources.map((s) => [s.id, s]));
if (sources.size !== sourcesDoc.sources.length) fail('Doppelte Source-ID.');

const factList = factsDocs.flatMap((d) => d.facts);
const facts = new Map();
const validStatus = new Set(['ACTIVE','NEEDS_REVALIDATION','SUPERSEDED','CONTRADICTED','RETIRED']);
const validVolatility = new Set(['LOW','MEDIUM','HIGH','UNKNOWN']);

for (const fact of factList) {
  if (!fact.id || facts.has(fact.id)) fail(`Ungueltige/doppelte Fact-ID: ${fact.id}`);
  if (!validStatus.has(fact.status)) fail(`${fact.id}: ungueltiger Status ${fact.status}`);
  if (!validVolatility.has(fact.volatility)) fail(`${fact.id}: ungueltige Volatility ${fact.volatility}`);
  if (!(fact.confidence >= 0 && fact.confidence <= 1)) fail(`${fact.id}: Confidence ausserhalb 0..1`);
  if (!Array.isArray(fact.sourceRefs) || fact.sourceRefs.length === 0) fail(`${fact.id}: keine SourceRefs`);
  for (const ref of fact.sourceRefs) if (!sources.has(ref.sourceId)) fail(`${fact.id}: unbekannte Source ${ref.sourceId}`);
  facts.set(fact.id, fact);
}

const contractList = contractDocs.flatMap((d) => d.contracts ?? []);
const contractIds = new Set();
const contractFunctions = new Set();
const validContractStatus = new Set(['VERIFIED_SOURCE_SNAPSHOT','LIVE_DOC_ONLY_NEEDS_EXACT_CONTRACT','PARTIAL_RESEARCH']);
for (const contract of contractList) {
  if (!contract.id || contractIds.has(contract.id)) fail(`Ungueltige/doppelte Contract-ID: ${contract.id}`);
  if (!contract.publicFunction || contractFunctions.has(contract.publicFunction)) fail(`Ungueltige/doppelte Public Function: ${contract.publicFunction}`);
  if (!validContractStatus.has(contract.status)) fail(`${contract.id}: ungueltiger Contract-Status ${contract.status}`);
  if (!Array.isArray(contract.sourceRefs) || contract.sourceRefs.length === 0) fail(`${contract.id}: keine SourceRefs`);
  for (const ref of contract.sourceRefs) if (!sources.has(ref.sourceId)) fail(`${contract.id}: unbekannte Source ${ref.sourceId}`);
  if (contract.status === 'LIVE_DOC_ONLY_NEEDS_EXACT_CONTRACT' && contract.unknownOutcomePolicy !== 'DO_NOT_AUTOMATE_UNTIL_CONTRACT_VERIFIED') {
    fail(`${contract.id}: Live-only Contract darf nicht zur Automation freigegeben sein`);
  }
  contractIds.add(contract.id);
  contractFunctions.add(contract.publicFunction);
}

for (const fact of factList) {
  for (const id of [...fact.supersedes, ...fact.supersededBy]) {
    if (!facts.has(id)) fail(`${fact.id}: Supersede-Referenz auf unbekannten Fact ${id}`);
  }
  if (fact.status === 'SUPERSEDED' && fact.supersededBy.length === 0) fail(`${fact.id}: SUPERSEDED ohne supersededBy`);
}

const questionList = questionDocs.flatMap((d) => d.questions);
const questionIds = new Set();
for (const q of questionList) {
  if (!q.id || questionIds.has(q.id)) fail(`Ungueltige/doppelte Question-ID: ${q.id}`);
  questionIds.add(q.id);
  for (const ref of q.sourceRefs ?? []) if (!sources.has(ref.sourceId)) fail(`${q.id}: unbekannte Source ${ref.sourceId}`);
  for (const factId of q.answerFactIds ?? []) if (!facts.has(factId)) fail(`${q.id}: unbekannter Answer-Fact ${factId}`);
}

for (const rel of manifest.sources.rawSnapshots) {
  const rawPath = path.join(kb, rel);
  if (!fs.existsSync(rawPath)) fail(`Fehlender Raw Snapshot: ${rel}`);
}
for (const rel of manifest.schemas ?? []) {
  if (!fs.existsSync(path.join(kb, rel))) fail(`Fehlendes Schema: ${rel}`);
}

const ext = manifest.externalResearchSnapshot;
const extPath = path.join(kb, manifest.sources.rawSnapshots[0]);
const bytes = fs.readFileSync(extPath);
const hash = crypto.createHash('sha256').update(bytes).digest('hex');
if (hash !== ext.sourceSha256) fail(`External Research SHA256 drift: ${hash} != ${ext.sourceSha256}`);
if (bytes.byteLength !== ext.bytes) fail(`External Research Bytecount drift: ${bytes.byteLength} != ${ext.bytes}`);

if (!Array.isArray(revalidation.p0Research) || revalidation.p0Research.some((x) => !x.id || !x.title || !x.status)) {
  fail('Revalidierungsqueue P0 unvollstaendig.');
}

const laufend = manifest.laufendeDatenbank;
if (!laufend) fail('Manifest enthaelt keine laufendeDatenbank.');
for (const feld of ['letzterLauf','quellenstatus','aenderungsprotokoll','kandidaten','aktuelleSnapshotsVerzeichnis']) {
  if (!laufend[feld]) fail(`Manifest laufendeDatenbank.${feld} fehlt.`);
}
if (laufend.aenderungsprotokollFormat !== 'JSONL_EIN_OBJEKT_PRO_ZEILE') {
  fail('Aenderungsprotokollformat im Manifest ist nicht eindeutig.');
}

const letzterLauf = readJson(laufend.letzterLauf);
const quellenstatus = readJson(laufend.quellenstatus);
const kandidaten = readJson(laufend.kandidaten);

if (letzterLauf.schemaVersion !== 1) fail('letzter-lauf schemaVersion ungueltig.');
if (quellenstatus.schemaVersion !== 1 || !Array.isArray(quellenstatus.quellen)) fail('quellenstatus ungueltig.');
if (kandidaten.schemaVersion !== 2 || !Array.isArray(kandidaten.kandidaten)) fail('kandidaten ungueltig oder nicht auf Schema 2.');

const ueberwachteQuellen = sourcesDoc.sources.filter((s) => s.url && s.type !== 'RESEARCH_SNAPSHOT');
const erwarteteKennungen = new Set(ueberwachteQuellen.map((s) => s.id));
const statusKennungen = new Set();
for (const q of quellenstatus.quellen) {
  if (!q.kennung || statusKennungen.has(q.kennung)) fail(`Doppelte/ungueltige Quellenstatus-Kennung: ${q.kennung}`);
  statusKennungen.add(q.kennung);
  if (!erwarteteKennungen.has(q.kennung)) fail(`Quellenstatus enthaelt nicht registrierte Quelle: ${q.kennung}`);
  const registriert = sources.get(q.kennung);
  const offiziell = registriert?.trust === 'OFFICIAL';
  const gesund = q.httpStatus === 200 && !q.fehler && !q.gekuerzt && !!q.inhaltSha256;

  if (!gesund && offiziell) {
    fail(`${q.kennung}: offizielle Quelle ist nicht gesund (HTTP=${q.httpStatus}, Fehler=${q.fehler ?? 'keiner'}, gekuerzt=${q.gekuerzt})`);
  }
  if (!gesund && !offiziell) {
    console.warn(`[V5-WISSEN][WARNUNG] ${q.kennung}: Community-Quelle aktuell nicht gesund; keine Entwicklungsautoritaet.`);
    continue;
  }

  const snapshot = path.join(kb, laufend.aktuelleSnapshotsVerzeichnis, `${q.kennung}.txt`);
  if (!fs.existsSync(snapshot)) fail(`${q.kennung}: aktueller Snapshot fehlt`);
  const snapshotBytes = fs.readFileSync(snapshot);
  const snapshotHash = crypto.createHash('sha256').update(snapshotBytes).digest('hex');
  if (snapshotHash !== q.inhaltSha256) fail(`${q.kennung}: Snapshot-Hash passt nicht zum Quellenstatus`);
}
for (const id of erwarteteKennungen) {
  if (!statusKennungen.has(id)) fail(`Ueberwachte Quelle fehlt im Quellenstatus: ${id}`);
}
if (letzterLauf.gepruefteQuellen !== quellenstatus.quellen.length) fail('letzter-lauf gepruefteQuellen passt nicht zum Quellenstatus.');
if (letzterLauf.registrierteQuellen !== quellenstatus.quellen.length) fail('letzter-lauf registrierteQuellen passt nicht zum Quellenstatus.');

for (const kandidat of kandidaten.kandidaten) {
  if (kandidat.status !== 'KANDIDAT') {
    fail(`Kandidat besitzt unerlaubten Status: ${kandidat.adresse ?? 'unbekannt'}`);
  }
  if (!kandidat.relevanznachweis?.startsWith('ADVENTURE_LAND_')) {
    fail(`Kandidat besitzt keinen bestaetigten Adventure-Land-Relevanznachweis: ${kandidat.adresse ?? 'unbekannt'}`);
  }
}

const protokollPfad = path.join(kb, laufend.aenderungsprotokoll);
const protokollZeilen = fs.readFileSync(protokollPfad, 'utf8').split(/\r?\n/).filter(Boolean);
for (let i = 0; i < protokollZeilen.length; i++) {
  let eintrag;
  try { eintrag = JSON.parse(protokollZeilen[i]); }
  catch { fail(`Aenderungsprotokoll ist kein valides JSONL in Zeile ${i + 1}`); }
  for (const feld of ['kennung','titel','adresse','vertrauen','neuerInhaltSha256','erkanntAm','art']) {
    if (eintrag[feld] === undefined || eintrag[feld] === null || eintrag[feld] === '') {
      fail(`Aenderungsprotokoll Zeile ${i + 1}: Pflichtfeld ${feld} fehlt`);
    }
  }
}

console.log(`[V5-WISSEN] OK: ${facts.size} Facts, ${contractIds.size} Action Contracts, ${questionIds.size} offene Fragen, ${sources.size} Quellen.`);
console.log(`[V5-WISSEN] Waechter: ${quellenstatus.quellen.length} Quellen, ${kandidaten.kandidaten.length} Kandidaten, ${protokollZeilen.length} Aenderungseintraege.`);
console.log(`[V5-WISSEN] Raw Research SHA256: ${hash}`);
