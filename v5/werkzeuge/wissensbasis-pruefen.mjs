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
const recoveryDocs = (manifest.recoveryContracts ?? []).map(readJson);
const bankConcurrency = manifest.bankConcurrency ? readJson(manifest.bankConcurrency) : null;
const tradeLifecycle = manifest.tradeLifecycle ? readJson(manifest.tradeLifecycle) : null;
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
const validContractStatus = new Set(['VERIFIED_SOURCE_SNAPSHOT','VERIFIED_LIVE_DEPLOYED_CONTRACT','EXPLICITLY_DISABLED_PENDING_EXACT_CONTRACT','LIVE_DOC_ONLY_NEEDS_EXACT_CONTRACT','PARTIAL_RESEARCH']);
const contractStatusZaehler = contractList.reduce((acc, contract) => {
  acc[contract.status] = (acc[contract.status] ?? 0) + 1;
  return acc;
}, {});

if (manifest.counts?.actionContracts !== contractList.length) {
  fail(`Manifest actionContracts passt nicht zur Contract-Matrix: ${manifest.counts?.actionContracts} != ${contractList.length}`);
}
if (manifest.counts?.sourceVerifiedActionContracts !== (contractStatusZaehler.VERIFIED_SOURCE_SNAPSHOT ?? 0)) {
  fail('Manifest sourceVerifiedActionContracts passt nicht zur Contract-Matrix.');
}
if (manifest.counts?.liveDeployedVerifiedActionContracts !== (contractStatusZaehler.VERIFIED_LIVE_DEPLOYED_CONTRACT ?? 0)) {
  fail('Manifest liveDeployedVerifiedActionContracts passt nicht zur Contract-Matrix.');
}
if (manifest.counts?.explicitlyDisabledActionContracts !== (contractStatusZaehler.EXPLICITLY_DISABLED_PENDING_EXACT_CONTRACT ?? 0)) {
  fail('Manifest explicitlyDisabledActionContracts passt nicht zur Contract-Matrix.');
}
if (manifest.counts?.liveDocOnlyActionContracts !== (contractStatusZaehler.LIVE_DOC_ONLY_NEEDS_EXACT_CONTRACT ?? 0)) {
  fail('Manifest liveDocOnlyActionContracts passt nicht zur Contract-Matrix.');
}

for (const contract of contractList) {
  if (!contract.id || contractIds.has(contract.id)) fail(`Ungueltige/doppelte Contract-ID: ${contract.id}`);
  if (!contract.publicFunction || contractFunctions.has(contract.publicFunction)) fail(`Ungueltige/doppelte Public Function: ${contract.publicFunction}`);
  if (!validContractStatus.has(contract.status)) fail(`${contract.id}: ungueltiger Contract-Status ${contract.status}`);
  if (!Array.isArray(contract.sourceRefs) || contract.sourceRefs.length === 0) fail(`${contract.id}: keine SourceRefs`);
  for (const ref of contract.sourceRefs) if (!sources.has(ref.sourceId)) fail(`${contract.id}: unbekannte Source ${ref.sourceId}`);
  if ((contract.status === 'LIVE_DOC_ONLY_NEEDS_EXACT_CONTRACT' || contract.status === 'EXPLICITLY_DISABLED_PENDING_EXACT_CONTRACT')
      && contract.unknownOutcomePolicy !== 'DO_NOT_AUTOMATE_UNTIL_CONTRACT_VERIFIED') {
    fail(`${contract.id}: ungeklaerter/deaktivierter Contract darf nicht zur Automation freigegeben sein`);
  }
  if (contract.status === 'VERIFIED_LIVE_DEPLOYED_CONTRACT' && contract.client?.requestId === 'UNKNOWN') {
    fail(`${contract.id}: live-verifizierter Contract darf keine unbekannte Request-ID-Semantik behalten`);
  }
  if (contract.client?.requestId !== true && contract.client?.requestId !== false && contract.client?.requestId !== 'UNKNOWN') {
    fail(`${contract.id}: requestId muss true, false oder UNKNOWN sein`);
  }
  contractIds.add(contract.id);
  contractFunctions.add(contract.publicFunction);
}

const recoveryList = recoveryDocs.flatMap((d) => d.actions ?? []);
const recoveryIds = new Set();
const recoveryActionIds = new Set();
const validRecoveryStatus = new Set(['VERIFIED_RECOVERY_POLICY','DISABLED_WITH_ACTION_CONTRACT']);
const validRecoveryClass = new Set([
  'STATE_REOBSERVE',
  'DUAL_VALUE_SETTLEMENT',
  'ACCOUNT_SHARED_STATE',
  'PARTIAL_BATCH_REPLAN',
  'MULTI_PHASE_Q_RECONCILE',
  'ASYNC_BACKEND_RECONCILE',
  'CLAIM_BACKEND_RECONCILE',
  'LISTING_STATE_RECONCILE',
  'RID_TRADE_RECONCILE',
  'REQUEST_RESPONSE_GAME_RECONCILE',
  'DEFERRED_SETTLEMENT_RECONCILE',
  'ROUTER_DELEGATE',
  'MIXED_PATH_RECONCILE',
  'DISABLED'
]);

for (const recovery of recoveryList) {
  if (!recovery.id || recoveryIds.has(recovery.id)) fail(`Ungueltige/doppelte Recovery-ID: ${recovery.id}`);
  if (!contractIds.has(recovery.actionContractId)) fail(`${recovery.id}: unbekannter ActionContract ${recovery.actionContractId}`);
  if (recoveryActionIds.has(recovery.actionContractId)) fail(`${recovery.actionContractId}: mehr als ein Recovery Contract`);
  const action = contractList.find((x) => x.id === recovery.actionContractId);
  if (!action || action.publicFunction !== recovery.publicFunction) fail(`${recovery.id}: Public Function passt nicht zum ActionContract`);
  if (!validRecoveryStatus.has(recovery.status)) fail(`${recovery.id}: ungueltiger Recovery-Status ${recovery.status}`);
  if (!validRecoveryClass.has(recovery.recoveryClass)) fail(`${recovery.id}: ungueltige Recovery-Klasse ${recovery.recoveryClass}`);
  if (!Array.isArray(recovery.unknownEntryTriggers) || recovery.unknownEntryTriggers.length === 0) fail(`${recovery.id}: keine UNKNOWN-Trigger`);
  if (!Array.isArray(recovery.reobserveSources) || recovery.reobserveSources.length === 0) fail(`${recovery.id}: keine Reobserve-Quellen`);
  if (!Array.isArray(recovery.journalRequirements) || recovery.journalRequirements.length === 0) fail(`${recovery.id}: keine Journal-Anforderungen`);
  if (recovery.retryPolicy?.sameIntentAfterPossibleSend !== 'NEVER') fail(`${recovery.id}: Same-Intent-Retry nach moeglichem Send ist nicht verboten`);
  if (recovery.retryPolicy?.afterNotApplied !== 'NEW_INTENT_AFTER_FRESH_ADMISSION_ONLY') fail(`${recovery.id}: NOT_APPLIED darf nur neuen Intent nach frischer Admission erlauben`);
  if (recovery.retryPolicy?.afterPartial !== 'REPLAN_REMAINDER_AS_NEW_INTENT') fail(`${recovery.id}: PARTIAL muss Remainder-Replan erzwingen`);
  if (recovery.retryPolicy?.afterStillPending !== 'WAIT_AND_REOBSERVE_NO_SEND') fail(`${recovery.id}: STILL_PENDING darf keinen Send erlauben`);
  if (recovery.retryPolicy?.afterUnresolved !== 'QUARANTINE_OR_OPERATOR_NO_SEND') fail(`${recovery.id}: UNRESOLVED muss Send sperren`);
  for (const key of ['committed','notApplied','partial','stillPending','unresolved']) {
    if (!Array.isArray(recovery.settlementRules?.[key]) || recovery.settlementRules[key].length === 0) {
      fail(`${recovery.id}: Settlement-Regel ${key} fehlt`);
    }
  }

  const actionDisabled = action.status === 'EXPLICITLY_DISABLED_PENDING_EXACT_CONTRACT' || action.unknownOutcomePolicy === 'DO_NOT_AUTOMATE_UNTIL_CONTRACT_VERIFIED';
  if (actionDisabled && (recovery.status !== 'DISABLED_WITH_ACTION_CONTRACT' || recovery.recoveryClass !== 'DISABLED')) {
    fail(`${recovery.id}: deaktivierter ActionContract muss auch Recovery-seitig deaktiviert bleiben`);
  }
  if (!actionDisabled && recovery.status !== 'VERIFIED_RECOVERY_POLICY') {
    fail(`${recovery.id}: verifizierter ActionContract braucht VERIFIED_RECOVERY_POLICY`);
  }

  recoveryIds.add(recovery.id);
  recoveryActionIds.add(recovery.actionContractId);
}

for (const contract of contractList) {
  if (!recoveryActionIds.has(contract.id)) fail(`${contract.id}: Recovery Contract fehlt`);
}
if (recoveryList.length !== contractList.length) fail('Recovery-Matrix deckt nicht exakt alle Action Contracts ab.');
if (manifest.counts?.recoveryContracts !== recoveryList.length) fail('Manifest recoveryContracts passt nicht zur Recovery-Matrix.');
if (manifest.counts?.verifiedRecoveryContracts !== recoveryList.filter((x) => x.status === 'VERIFIED_RECOVERY_POLICY').length) {
  fail('Manifest verifiedRecoveryContracts passt nicht zur Recovery-Matrix.');
}
if (manifest.counts?.disabledRecoveryContracts !== recoveryList.filter((x) => x.status === 'DISABLED_WITH_ACTION_CONTRACT').length) {
  fail('Manifest disabledRecoveryContracts passt nicht zur Recovery-Matrix.');
}

if (!bankConcurrency
    || bankConcurrency.schemaVersion !== 1
    || bankConcurrency.researchId !== 'V5-P0-03'
    || bankConcurrency.status !== 'DONE') {
  fail('P0-03 Bank-Concurrency-Vertrag fehlt oder ist ungueltig.');
}
if (bankConcurrency.serverModel?.concurrencyScope !== 'ACCOUNT_GLOBAL_SINGLE_BANK_MOUNT') {
  fail('P0-03 muss accountweiten Single-Bank-Mount modellieren.');
}
if (bankConcurrency.v5Policy?.authorityOwner !== 'ACCOUNT_COORDINATOR'
    || bankConcurrency.v5Policy?.resource !== 'account:bank'
    || bankConcurrency.v5Policy?.leaseScope !== 'ENTIRE_BANK_SESSION') {
  fail('P0-03 V5-Bankauthority/Lease-Scope ist ungueltig.');
}
for (const state of ['ACQUIRING','ACTIVE','RECOVERY_PENDING','RELEASING','RELEASED','QUARANTINED']) {
  if (!bankConcurrency.v5Policy?.leaseStates?.includes(state)) fail(`P0-03 Lease-State fehlt: ${state}`);
}
if (!Array.isArray(bankConcurrency.invariants) || bankConcurrency.invariants.length < 10) {
  fail('P0-03 Bank-Concurrency-Invarianten unvollstaendig.');
}
for (const fn of ['bank_deposit','bank_withdraw','bank_store','bank_retrieve','bank_swap','open_bank_pack']) {
  const action = contractList.find((x) => x.publicFunction === fn);
  if (!action) fail(`P0-03 Bank-Action fehlt in Action Contracts: ${fn}`);
  if (!action.resourceDomains?.includes('account:bank_lease')) fail(`P0-03 ${fn}: account:bank_lease fehlt`);
}
for (const fn of ['bank_deposit','bank_withdraw','bank_store','bank_retrieve','bank_swap']) {
  const recovery = recoveryList.find((x) => x.publicFunction === fn);
  if (recovery?.recoveryClass !== 'ACCOUNT_SHARED_STATE') fail(`P0-03 ${fn}: falsche Recovery-Klasse`);
}
if (recoveryList.find((x) => x.publicFunction === 'open_bank_pack')?.recoveryClass !== 'MIXED_PATH_RECONCILE') {
  fail('P0-03 open_bank_pack braucht MIXED_PATH_RECONCILE.');
}

if (!tradeLifecycle
    || tradeLifecycle.schemaVersion !== 1
    || tradeLifecycle.researchId !== 'V5-P0-04'
    || tradeLifecycle.status !== 'DONE') {
  fail('P0-04 Trade-Lifecycle-Vertrag fehlt oder ist ungueltig.');
}
if (tradeLifecycle.ridSemantics?.rotatesOnPartialFill !== false
    || tradeLifecycle.ridSemantics?.v5RequiresRidField !== true
    || tradeLifecycle.ridSemantics?.serverRequiresRidField !== false) {
  fail('P0-04 RID-Semantik ist ungueltig.');
}
if (tradeLifecycle.partialFillSemantics?.requestIsAllOrFailForRequestedQuantity !== true
    || tradeLifecycle.partialFillSemantics?.noAutomaticServerDownsize !== true
    || tradeLifecycle.partialFillSemantics?.ridAfterPartialFill !== 'UNCHANGED') {
  fail('P0-04 Partial-Fill-Semantik ist ungueltig.');
}
if (tradeLifecycle.tradeSell?.serverItemSelection?.clientSpecifiesInventoryIndex !== false
    || tradeLifecycle.tradeSell?.serverItemSelection?.scanDirection !== 'inventory index 0 upward'
    || tradeLifecycle.tradeSell?.serverItemSelection?.v5Rule?.length < 20) {
  fail('P0-04 trade_sell Server-Itemauswahl ist unvollstaendig.');
}
const tradeBuyAction = contractList.find((x) => x.publicFunction === 'trade_buy');
const tradeSellAction = contractList.find((x) => x.publicFunction === 'trade_sell');
if (!tradeBuyAction?.dangerFlags?.includes('RID_NOT_QUANTITY_VERSION')
    || !tradeBuyAction?.dangerFlags?.includes('RAW_SERVER_RID_CHECK_IS_CONDITIONAL')) {
  fail('P0-04 trade_buy ActionContract bildet RID-Risiken nicht ab.');
}
if (!tradeSellAction?.dangerFlags?.includes('SERVER_SELECTS_FIRST_MATCHING_ITEM')
    || !tradeSellAction?.dangerFlags?.includes('PHYSICAL_ITEM_VARIANT_AMBIGUITY')
    || !tradeSellAction?.dangerFlags?.includes('RID_NOT_QUANTITY_VERSION')) {
  fail('P0-04 trade_sell ActionContract bildet physische Itemauswahl/RID nicht ab.');
}
for (const fn of ['trade_buy','trade_sell']) {
  const recovery = recoveryList.find((x) => x.publicFunction === fn);
  if (recovery?.recoveryClass !== 'RID_TRADE_RECONCILE') fail(`P0-04 ${fn}: falsche Recovery-Klasse`);
  if (!recovery?.settlementRules?.committed?.some((x) => x.includes('Remote') || x.includes('remote'))) {
    fail(`P0-04 ${fn}: Recovery muss Remote-Listing nur als sekundaere Evidence behandeln`);
  }
}
if (!Array.isArray(tradeLifecycle.invariants) || tradeLifecycle.invariants.length < 10) {
  fail('P0-04 Trade-Invarianten unvollstaendig.');
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

const live = manifest.liveWissen;
if (!live || live.githubBereich !== 'live' || live.snapshotPfad !== 'live/snapshot') {
  fail('Live-Wissensbereich im Manifest fehlt oder ist ungueltig.');
}
if (!fs.existsSync(path.join(kb, 'live', 'README.md'))) {
  fail('Live-Wissensvertrag README fehlt.');
}

const geheimnisFragmente = ['password','passwort','token','secret','credential','applicationkey','accesskey','authorization','cookie','session','localpath','lokalerpfad','filesystempath','dateipfad'];
const pruefeKeineGeheimnisse = (wert, pfad = 'ROOT') => {
  if (Array.isArray(wert)) {
    wert.forEach((x, i) => pruefeKeineGeheimnisse(x, `${pfad}[${i}]`));
    return;
  }
  if (!wert || typeof wert !== 'object') return;
  for (const [name, inhalt] of Object.entries(wert)) {
    const normalisiert = name.replace(/[_-]/g, '').toLowerCase();
    if (geheimnisFragmente.some(fragment => normalisiert.includes(fragment))) {
      fail(`Live-Wissen enthaelt verbotenes Geheimnisfeld ${pfad}.${name}`);
    }
    pruefeKeineGeheimnisse(inhalt, `${pfad}.${name}`);
  }
};

let liveDateien = 0;
const liveSnapshot = path.join(kb, live.snapshotPfad);
if (fs.existsSync(liveSnapshot)) {
  const liveManifestPfad = path.join(liveSnapshot, 'manifest.json');
  const liveStatusPfad = path.join(liveSnapshot, 'status.json');
  const liveImportPfad = path.join(liveSnapshot, 'import.json');
  for (const pfad of [liveManifestPfad, liveStatusPfad, liveImportPfad]) {
    if (!fs.existsSync(pfad)) fail(`Live-Snapshot Pflichtdatei fehlt: ${path.relative(kb, pfad)}`);
  }

  const liveManifestBytes = fs.readFileSync(liveManifestPfad);
  const liveStatusBytes = fs.readFileSync(liveStatusPfad);
  const liveManifest = JSON.parse(liveManifestBytes.toString('utf8'));
  const liveStatus = JSON.parse(liveStatusBytes.toString('utf8'));
  const liveImport = JSON.parse(fs.readFileSync(liveImportPfad, 'utf8'));

  if (liveManifest.schemaVersion !== 1
      || liveManifest.format !== 'ADVENTURE_LAND_V5_LIVE_WISSEN'
      || liveManifest.spiel !== 'Adventure Land - The Code MMORPG'
      || liveManifest.aktuellVerzeichnis !== 'aktuell') {
    fail('Live-Snapshot Manifest ungueltig.');
  }
  if (liveStatus.schemaVersion !== 1
      || liveStatus.spiel !== 'Adventure Land - The Code MMORPG'
      || liveStatus.zustand !== 'BEREIT'
      || !Number.isInteger(liveStatus.generation)
      || liveStatus.generation < 0) {
    fail('Live-Snapshot Status ungueltig.');
  }
  if (liveImport.schemaVersion !== 1
      || liveImport.spiel !== 'Adventure Land - The Code MMORPG'
      || liveImport.quelle !== 'LOKALE_LIVE_WISSENSDATENBANK'
      || liveImport.generation !== liveStatus.generation) {
    fail('Live-Snapshot Importmetadaten ungueltig.');
  }

  pruefeKeineGeheimnisse(liveManifest);
  pruefeKeineGeheimnisse(liveStatus);

  const liveAktuell = path.join(liveSnapshot, 'aktuell');
  if (!fs.existsSync(liveAktuell)) fail('Live-Snapshot aktuell-Verzeichnis fehlt.');

  const sammleJson = (ordner) => fs.readdirSync(ordner, { withFileTypes: true }).flatMap(eintrag => {
    const voll = path.join(ordner, eintrag.name);
    if (eintrag.isSymbolicLink()) fail(`Live-Snapshot enthaelt Symlink: ${path.relative(liveSnapshot, voll)}`);
    if (eintrag.isDirectory()) return sammleJson(voll);
    if (!eintrag.isFile()) fail(`Live-Snapshot enthaelt unbekannten Dateityp: ${path.relative(liveSnapshot, voll)}`);
    if (!eintrag.name.toLowerCase().endsWith('.json')) {
      fail(`Live-Snapshot aktuell enthaelt Nicht-JSON-Datei: ${path.relative(liveSnapshot, voll)}`);
    }
    return [voll];
  });

  for (const eintrag of fs.readdirSync(liveSnapshot, { withFileTypes: true })) {
    const erlaubt = new Set(['manifest.json','status.json','import.json','aktuell']);
    if (!erlaubt.has(eintrag.name)) {
      fail(`Live-Snapshot enthaelt unerwarteten Root-Eintrag: ${eintrag.name}`);
    }
    if (eintrag.isSymbolicLink()) fail(`Live-Snapshot enthaelt Root-Symlink: ${eintrag.name}`);
  }

  const dateien = sammleJson(liveAktuell).sort((a, b) => {
    const ar = path.relative(liveAktuell, a).replace(/\\/g, '/');
    const br = path.relative(liveAktuell, b).replace(/\\/g, '/');
    return ar < br ? -1 : ar > br ? 1 : 0;
  });

  const snapshotHash = crypto.createHash('sha256');
  snapshotHash.update(liveManifestBytes);
  snapshotHash.update(liveStatusBytes);
  let gesamtBytes = liveManifestBytes.byteLength + liveStatusBytes.byteLength;

  for (const datei of dateien) {
    const rel = path.relative(liveAktuell, datei).replace(/\\/g, '/');
    const bytes = fs.readFileSync(datei);
    const fakt = JSON.parse(bytes.toString('utf8'));

    if (fakt.schemaVersion !== 1
        || fakt.spiel !== 'Adventure Land - The Code MMORPG'
        || fakt.status !== 'LIVE_VERIFIZIERT'
        || typeof fakt.kennung !== 'string'
        || !fakt.kennung
        || typeof fakt.domaene !== 'string'
        || typeof fakt.beobachtetAm !== 'string'
        || typeof fakt.verifiziertAm !== 'string'
        || !fakt.quelle
        || fakt.quelle.art !== 'LIVE_SPIEL'
        || typeof fakt.quelle.methode !== 'string'
        || !Object.prototype.hasOwnProperty.call(fakt, 'wert')) {
      fail(`Live-Fakt ungueltig: ${rel}`);
    }
    if (Date.parse(fakt.verifiziertAm) < Date.parse(fakt.beobachtetAm)) {
      fail(`Live-Fakt Verifikation liegt vor Beobachtung: ${rel}`);
    }
    pruefeKeineGeheimnisse(fakt, rel);

    const dateiHash = crypto.createHash('sha256').update(bytes).digest('hex');
    snapshotHash.update(Buffer.from(rel, 'utf8'));
    snapshotHash.update(Buffer.from(dateiHash, 'utf8'));
    gesamtBytes += bytes.byteLength;
    liveDateien++;
  }

  const berechnet = snapshotHash.digest('hex');
  if (liveImport.snapshotSha256 !== berechnet) fail('Live-Snapshot SHA256 stimmt nicht.');
  if (liveImport.dateien !== liveDateien) fail('Live-Snapshot Dateianzahl stimmt nicht.');
  if (liveImport.bytes !== gesamtBytes) fail('Live-Snapshot Bytezahl stimmt nicht.');
}

console.log(`[V5-WISSEN] OK: ${facts.size} Facts, ${contractIds.size} Action Contracts, ${recoveryIds.size} Recovery Contracts, ${questionIds.size} offene Fragen, ${sources.size} Quellen.`);
console.log(`[V5-WISSEN] Bank-Concurrency: ${bankConcurrency.serverModel.concurrencyScope} -> ${bankConcurrency.v5Policy.authorityOwner}.`);
console.log(`[V5-WISSEN] Trade-Lifecycle: RID partial=${tradeLifecycle.ridSemantics.rotatesOnPartialFill ? 'ROTATES' : 'STABLE'}, raw RID=${tradeLifecycle.ridSemantics.v5RequiresRidField ? 'REQUIRED' : 'OPTIONAL'}.`);
console.log(`[V5-WISSEN] Waechter: ${quellenstatus.quellen.length} Quellen, ${kandidaten.kandidaten.length} Kandidaten, ${protokollZeilen.length} Aenderungseintraege.`);
console.log(`[V5-WISSEN] Live-Wissen: ${fs.existsSync(liveSnapshot) ? liveDateien + ' validierte Dateien' : 'vorbereitet, noch kein Bot-Snapshot'}.`);
console.log(`[V5-WISSEN] Raw Research SHA256: ${hash}`);
