import fs from "node:fs";

const fehler=[];
const lies=pfad=>fs.readFileSync(pfad,"utf8");
const pflicht=[
  "grundlage/quelle/zertifizierung/evidence-kette.ts",
  "grundlage/quelle/zertifizierung/ladder.ts",
  "grundlage/quelle/zertifizierung/shadow-bewertung.ts",
  "grundlage/quelle/zertifizierung/production-certification.ts",
  "grundlage/quelle/runtime/produktions-komposition.ts",
  "grundlage/quelle/runtime/produktions-runtime.ts",
  "grundlage/quelle/host/produktions-host-controller.ts",
  "grundlage/adapter/persistenz/node-produktions-dateisystem.mjs",
  "grundlage/adapter/persistenz/node-produktions-operations-quelle.mjs",
  "grundlage/adapter/persistenz/node-planen-aktivierungs-protokoll.mjs",
  "grundlage/adapter/persistenz/node-bediener-deny-protokoll.mjs",
  "grundlage/quelle/merchant/modul-vertrag.ts",
  "grundlage/quelle/merchant/faehigkeits-vertrag.ts",
  "grundlage/quelle/equipment/modul-vertrag.ts",
  "grundlage/quelle/equipment/faehigkeits-vertrag.ts",
  "grundlage/quelle/equipment/produktions-einmal-authority.ts",
  "grundlage/adapter/persistenz/node-equip-einmal-authority-protokoll.mjs",
  "grundlage/quelle/equipment/produktions-equip-admission-gate.ts",
  "grundlage/quelle/equipment/produktions-equip-transaktion.ts",
  "grundlage/adapter/persistenz/node-equip-transaktionsjournal.mjs",
  "grundlage/vertraege/runtime/equipment-equip-mutationsfaehigkeit.json",
  "grundlage/vertraege/runtime/equipment-equip-one-shot-authority.json",
  "grundlage/vertraege/runtime/equipment-equip-production-transaction.json",
  "grundlage/quelle/merchant/demand.ts",
  "grundlage/vertraege/runtime/merchant-core-a-planungsfaehigkeiten.json",
  "grundlage/vertraege/runtime/durable-planen-authority.json",
  "grundlage/vertraege/runtime/produktions-operations-feed.json",
  "grundlage/vertraege/runtime/node-produktions-host-komposition.json",
  "grundlage/vertraege/runtime/bank-planen-observer-canary.json",
  "roadmap/bank-planen-observer-live-evidence.json",
  "architektur/adr/ADR-026-MERCHANT-PLANUNGSFAEHIGKEITEN.md",
  "architektur/adr/ADR-027-KONTROLLIERTE-PLANEN-AKTIVIERUNG.md",
  "architektur/adr/ADR-028-DURABLE-PLANEN-AUTHORITY.md",
  "architektur/adr/ADR-029-PRODUKTIVER-OPERATIONS-FEED.md",
  "architektur/adr/ADR-030-KANONISCHE-NODE-HOST-KOMPOSITION.md",
  "architektur/adr/ADR-031-BANK-PLANEN-OBSERVER-CANARY.md",
  "architektur/adr/ADR-032-PRODUKTIVE-EQUIP-MUTATIONSFAEHIGKEIT.md",
  "architektur/adr/ADR-033-EQUIP-EINMAL-AUTHORITY.md",
  "architektur/adr/ADR-034-PRODUKTIVE-EQUIP-TRANSAKTION.md",
  "grundlage/tests/r11-produktions-kompositionskatalog.test.mjs",
  "grundlage/tests/r11-bank-planen-observer-canary.test.mjs",
  "werkzeuge/bank-planen-canary-browser.mjs",
  "werkzeuge/bank-planen-observer-canary.mjs",
  "grundlage/tests/r11-bediener-deny-persistenz.test.mjs",
  "grundlage/tests/r11-node-produktions-host-komposition.test.mjs",
  "werkzeuge/v5-produktions-host-komposition.mjs",
  "grundlage/tests/r11-produktions-host-controller.test.mjs",
  "grundlage/tests/r11-produktions-operations-quelle.test.mjs",
  "grundlage/tests/r11-planen-aktivierung.test.mjs",
  "grundlage/tests/r11-planen-aktivierungs-persistenz.test.mjs",
  "grundlage/tests/r11-equip-einmal-authority.test.mjs",
  "grundlage/tests/r11-equip-einmal-authority-persistenz.test.mjs",
  "grundlage/tests/r11-equip-produktions-transaktion.test.mjs",
  "grundlage/tests/r11-equip-produktions-journal.test.mjs",
  "grundlage/tests/r11-equip-produktions-browser.test.mjs",
  "werkzeuge/equipment-equip-produktions-browser.mjs",
  "werkzeuge/equipment-equip-produktions-live.mjs",
  "grundlage/tests/r19-evidence-ladder.test.mjs",
  "grundlage/tests/r19-production-certification.test.mjs",
  "grundlage/tests/r19-shadow-certification.test.mjs",
  "werkzeuge/r19-ui-release-gate.mjs",
  "werkzeuge/r19-controlled-live-test-gui.js",
  "werkzeuge/r19-controlled-live-test-paket.js",
  "werkzeuge/r19-test-gui-paket-bauen.mjs",
  "werkzeuge/tests/r19-test-gui.test.mjs",
  "werkzeuge/tests/r19-canary-test-gui.test.mjs",
  "werkzeuge/tests/r19-soak-5m-test-gui.test.mjs",
  "werkzeuge/r19-soak-5m-test-paket-bauen.mjs",
  "werkzeuge/r19-soak-5m-test-paket.js",
  "werkzeuge/r19-soak-5m-test-gui.js",
  "werkzeuge/tests/r19-soak-10m-test-gui.test.mjs",
  "werkzeuge/r19-soak-10m-test-paket-bauen.mjs",
  "werkzeuge/r19-soak-10m-test-paket.js",
  "werkzeuge/r19-soak-10m-test-gui.js",
  "werkzeuge/tests/r19-soak-15m-test-gui.test.mjs",
  "werkzeuge/r19-soak-15m-test-paket-bauen.mjs",
  "werkzeuge/r19-soak-15m-test-paket.js",
  "werkzeuge/r19-soak-15m-test-gui.js",
  "werkzeuge/r19-canary-test-paket-bauen.mjs",
  "werkzeuge/r19-canary-test-paket.js",
  "werkzeuge/r19-canary-test-gui.js",
  "werkzeuge/cap045-production-live-test-gui.js",
  "werkzeuge/cap045-production-live-test-paket-bauen.mjs",
  "werkzeuge/cap045-production-live-test-paket.js",
  "werkzeuge/cap045-production-live-static-guards.mjs",
  "werkzeuge/tests/cap045-production-live-test-gui.test.mjs",
  "werkzeuge/cap045-production-live-evidence-pruefen.mjs",
  "werkzeuge/tests/cap045-production-live-evidence-pruefen.test.mjs",
];
for(const p of pflicht) if(!fs.existsSync(p)) fehler.push("PFLICHTARTEFAKT_FEHLT:"+p);

const produktionsKomposition=lies("grundlage/quelle/runtime/produktions-komposition.ts");
for(const m of [
  "DEFAULT_DENY_PLANEN_UND_EQUIP_MUTIEREN_REGISTRIERT_INAKTIV",
  "merchantCoreABasisModulDefinition",
  "merchantCoreAPlanungsFaehigkeitDefinitionen",
  "equipmentCoreModulDefinition",
  "equipmentEquipMutationsFaehigkeitDefinition",
]){
  if(!produktionsKomposition.includes(m)) {
    fehler.push("PRODUKTIONS_KOMPOSITION_DEFAULT_DENY_FEHLT:"+m);
  }
}
const merchantModul=lies("grundlage/quelle/merchant/modul-vertrag.ts");
for(const m of [
  'MERCHANT_CORE_A_MODUL_ID = "merchant-core-a"',
  'MERCHANT_CORE_A_MODUL_VERSION = "1"',
  "MERCHANT_CORE_A_PLANUNGS_FAEHIGKEIT_IDS",
  '"merchant.task.planen"',
  '"merchant.bank.planen"',
  '"merchant.verkauf.planen"',
  '"merchant.markt.planen"',
  '"merchant.mluck.planen"',
  '"merchant.logistik.planen"',
  '"merchant.gear.planen"',
  '"merchant.itemmutation.planen"',
  "standardAktiv: false",
]){
  if(!merchantModul.includes(m)) fehler.push("MERCHANT_MODUL_VERTRAG_FEHLT:"+m);
}
const merchantFaehigkeit=lies("grundlage/quelle/merchant/faehigkeits-vertrag.ts");
for(const m of [
  'modus: "PLANEN"',
  'status: "VERFUEGBAR"',
  "standardAktiv: false",
  "MERCHANT_CORE_A_MODUL_ID",
  "MERCHANT_CORE_A_MODUL_VERSION",
]){
  if(!merchantFaehigkeit.includes(m)) fehler.push("MERCHANT_PLANEN_VERTRAG_FEHLT:"+m);
}
if(merchantFaehigkeit.includes('modus: "MUTIEREN"')) {
  fehler.push("MERCHANT_PLANEN_VERTRAG_MUTIEREN_VERBOTEN");
}

const equipmentModul=lies("grundlage/quelle/equipment/modul-vertrag.ts");
for(const m of [
  'EQUIPMENT_CORE_MODUL_ID = "equipment-core"',
  'EQUIPMENT_CORE_MODUL_VERSION = "1"',
  'EQUIPMENT_EQUIP_FAEHIGKEIT_ID = "equipment.equip"',
  "standardAktiv: false",
]){
  if(!equipmentModul.includes(m)) fehler.push("EQUIPMENT_MODUL_VERTRAG_FEHLT:"+m);
}
const equipmentFaehigkeit=lies("grundlage/quelle/equipment/faehigkeits-vertrag.ts");
for(const m of [
  'modus: "MUTIEREN"',
  'status: "VERFUEGBAR"',
  "standardAktiv: false",
  "EQUIPMENT_CORE_MODUL_ID",
  "EQUIPMENT_CORE_MODUL_VERSION",
  "EQUIPMENT_EQUIP_FAEHIGKEIT_ID",
]){
  if(!equipmentFaehigkeit.includes(m)) {
    fehler.push("EQUIPMENT_EQUIP_VERTRAG_FEHLT:"+m);
  }
}
const equipmentVertrag=JSON.parse(
  lies("grundlage/vertraege/runtime/equipment-equip-mutationsfaehigkeit.json"),
);
if(equipmentVertrag.modulId!=="equipment-core"
    || equipmentVertrag.modulVersion!=="1"
    || equipmentVertrag.faehigkeit?.faehigkeitId!=="equipment.equip"
    || equipmentVertrag.faehigkeit?.modus!=="MUTIEREN"
    || equipmentVertrag.faehigkeit?.standardAktiv!==false
    || equipmentVertrag.faehigkeit?.singleOwner!==true
    || equipmentVertrag.aktionsBindung?.actionContractId!=="AL-ACTION-EQUIP"
    || equipmentVertrag.aktionsBindung?.recoveryContractId!=="AL-RECOVERY-EQUIP"
    || equipmentVertrag.aktionsBindung?.verifierId!=="AL-VERIFIER-EQUIP"
    || equipmentVertrag.aktivierung?.durchDiesenVertragErlaubt!==false
    || equipmentVertrag.aktivierung?.automatisch!==false
    || equipmentVertrag.aktivierung?.produktiverAktivierungspfadVorhanden!==false
    || equipmentVertrag.authority?.gameplayAutoritaetDurchRegistrierung!==false
    || equipmentVertrag.authority?.rawWriteAutoritaetDurchRegistrierung!==false
    || equipmentVertrag.authority?.actionAuthorityDurchRegistrierung!==false) {
  fehler.push("EQUIPMENT_EQUIP_MUTATIONSVERTRAG_UNGUELTIG");
}

const equipEinmalAuthority=lies(
  "grundlage/quelle/equipment/produktions-einmal-authority.ts",
);
for(const m of [
  'EQUIPMENT_EQUIP_ACTION_CONTRACT_ID = "AL-ACTION-EQUIP"',
  'EQUIPMENT_EQUIP_RECOVERY_CONTRACT_ID = "AL-RECOVERY-EQUIP"',
  'EQUIPMENT_EQUIP_VERIFIER_ID = "AL-VERIFIER-EQUIP"',
  '"EQUIPMENT-EQUIP-PRODUKTION-EINMAL-V1"',
  '"V5 EQUIP EINMAL AUSFUEHREN"',
  "ProduktiveEquipEinmalAuthority",
  "maximaleVerwendungen: 1",
  "breiteRuntimeFreigabe: false",
  "rawWriteAutoritaet: false",
]){
  if(!equipEinmalAuthority.includes(m)) {
    fehler.push("EQUIP_EINMAL_AUTHORITY_QUELLE_FEHLT:"+m);
  }
}
const equipAuthorityAdapter=lies(
  "grundlage/adapter/persistenz/node-equip-einmal-authority-protokoll.mjs",
);
for(const m of [
  "runtime/authority/mutieren/equipment-equip/",
  "EQUIP_EINMAL_AUTHORITY_VOR_WIRKUNG",
  "erstelleExklusivDurable",
  "EQUIP_EINMAL_AUTHORITY_AUDIT_ID_KOLLISION",
  "gueltigBisMs - intent.zeitMs > 2_000",
]){
  if(!equipAuthorityAdapter.includes(m)) {
    fehler.push("EQUIP_EINMAL_AUTHORITY_ADAPTER_FEHLT:"+m);
  }
}
const equipAuthorityVertrag=JSON.parse(
  lies("grundlage/vertraege/runtime/equipment-equip-one-shot-authority.json"),
);
if(equipAuthorityVertrag.capability?.id!=="equipment.equip"
    || equipAuthorityVertrag.capability?.providerModulId!=="equipment-core"
    || equipAuthorityVertrag.capability?.providerVersion!=="1"
    || equipAuthorityVertrag.capability?.registryAktivierung!==false
    || equipAuthorityVertrag.capability?.maximaleVerwendungenProAuthority!==1
    || equipAuthorityVertrag.bindung?.actionContractId!=="AL-ACTION-EQUIP"
    || equipAuthorityVertrag.bindung?.recoveryContractId!=="AL-RECOVERY-EQUIP"
    || equipAuthorityVertrag.bindung?.verifierId!=="AL-VERIFIER-EQUIP"
    || equipAuthorityVertrag.bindung?.bestaetigungText!=="V5 EQUIP EINMAL AUSFUEHREN"
    || equipAuthorityVertrag.authority?.maximaleLebensdauerMs!==2000
    || equipAuthorityVertrag.authority?.durchAdmissionPruefungVerbraucht!==true
    || equipAuthorityVertrag.authority?.breiteRuntimeFreigabe!==false
    || equipAuthorityVertrag.authority?.rawWriteAutoritaet!==false
    || equipAuthorityVertrag.durability?.vorAuthorityAusstellung!==true
    || equipAuthorityVertrag.durability?.restartAktiviertAuthorityNichtWieder!==true
    || equipAuthorityVertrag.host?.generischeMutierenAktivierung!==false
    || equipAuthorityVertrag.wirkung?.gameplayWriteDurchAuthorityAusstellung!==0
    || equipAuthorityVertrag.wirkung?.adapterSendDurchAuthorityAusstellung!==0) {
  fehler.push("EQUIP_EINMAL_AUTHORITY_VERTRAG_UNGUELTIG");
}
const equipProdVertrag=JSON.parse(
  lies("grundlage/vertraege/runtime/equipment-equip-production-transaction.json"),
);
if(equipProdVertrag.kennung!=="V5_EQUIPMENT_EQUIP_PRODUCTION_ONE_SHOT_TRANSACTION"
    || equipProdVertrag.capability?.id!=="equipment.equip"
    || equipProdVertrag.capability?.providerModulId!=="equipment-core"
    || equipProdVertrag.capability?.providerVersion!=="1"
    || equipProdVertrag.capability?.registryAktivierung!==false
    || equipProdVertrag.operator?.bestaetigungText!=="V5 EQUIP EINMAL AUSFUEHREN"
    || equipProdVertrag.candidate?.characterType!=="merchant"
    || equipProdVertrag.candidate?.zielslotMussLeerSein!==true
    || equipProdVertrag.candidate?.waffenSlotsErlaubt!==false
    || equipProdVertrag.candidate?.itemMussUnlockedSein!==true
    || equipProdVertrag.admission?.gesamtfreigabeErforderlich!==true
    || equipProdVertrag.admission?.aktivePlanenCapabilitiesErlaubt!==false
    || equipProdVertrag.admission?.oneShotAuthorityErforderlich!==true
    || equipProdVertrag.admission?.operatorRecheckErforderlich!==true
    || equipProdVertrag.admission?.actionContractId!=="AL-ACTION-EQUIP"
    || equipProdVertrag.admission?.recoveryContractId!=="AL-RECOVERY-EQUIP"
    || equipProdVertrag.admission?.verifierId!=="AL-VERIFIER-EQUIP"
    || equipProdVertrag.admission?.socketBudgetGewicht!==3
    || equipProdVertrag.admission?.durableIntentVorSend!==true
    || equipProdVertrag.execution?.adapterId!=="v5-production-cdp-equip-once"
    || equipProdVertrag.execution?.maxAdapterAufrufe!==1
    || equipProdVertrag.execution?.maxGameplayWrites!==1
    || equipProdVertrag.execution?.sameIntentRetry!==false
    || equipProdVertrag.recovery?.sameIntentAfterPossibleSend!=="NEVER"
    || equipProdVertrag.recovery?.maxBeobachtungen!==4
    || equipProdVertrag.recovery?.commitNurBeiBestaetigt!==true
    || equipProdVertrag.journal?.globalerCurrentPointer!==true
    || equipProdVertrag.journal?.offeneTransaktionBlockiertNeue!==true
    || equipProdVertrag.journal?.maxEintraegeProTransaktion!==16
    || equipProdVertrag.browser?.cdpNurLoopback!==true
    || equipProdVertrag.browser?.alternativeRuntimeVerboten!==true
    || equipProdVertrag.preflight?.readOnly!==true
    || equipProdVertrag.preflight?.browserGameplayWrites!==0
    || equipProdVertrag.authority?.breiteRuntimeFreigabeDurchTransaktion!==false
    || equipProdVertrag.authority?.rawWriteBypass!==false
    || equipProdVertrag.authority?.generischeMutierenAktivierung!==false
    || equipProdVertrag.naechsterNachweis?.gameplayWritesErwartet!==1
    || equipProdVertrag.naechsterNachweis?.nachGruenerExactHeadCiErforderlich!==true) {
  fehler.push("EQUIP_PROD_TX_VERTRAG_UNGUELTIG");
}
const equipProdTx=lies(
  "grundlage/quelle/equipment/produktions-equip-transaktion.ts",
);
for(const m of [
  "ErteilteAusfuehrungsFreigabe",
  "PersistVorMutationTor",
  "RecoveryKernel",
  "PRODUKTIVE_EQUIP_INVARIANTEN",
  '"equipment_slot_empty"',
  'erstelleMutationsKanalPlan(a.characterId, "equip", 3)',
  "same_intent_retry: false",
  "vorherigesSlotItem !== null",
]) {
  if(!equipProdTx.includes(m)) fehler.push("EQUIP_PROD_TX_QUELLE_FEHLT:"+m);
}
const equipProdJournal=lies(
  "grundlage/adapter/persistenz/node-equip-transaktionsjournal.mjs",
);
for(const m of [
  'const BASIS = "runtime/transactions/equipment-equip"',
  'const CURRENT = BASIS + "/current.json"',
  "const MAX_EINTRAEGE = 16",
  "EQUIP_TX_OFFENE_TRANSAKTION_BLOCKIERT",
  "erstelleExklusivDurable",
  "schreibeAtomarDurable",
]) {
  if(!equipProdJournal.includes(m)) fehler.push("EQUIP_PROD_TX_JOURNAL_FEHLT:"+m);
}
const equipProdBrowser=lies("werkzeuge/equipment-equip-produktions-browser.mjs");
for(const m of [
  'this.adapterId = "v5-production-cdp-equip-once"',
  "MERCHANT_ERFORDERLICH",
  "ALTERNATIVE_RUNTIME_AKTIV",
  "EQUIPMENT_SLOT_NICHT_LEER",
  "EQUIP_PROD_MEHR_ALS_EIN_ADAPTER_AUFRUF",
]) {
  if(!equipProdBrowser.includes(m)) fehler.push("EQUIP_PROD_BROWSER_FEHLT:"+m);
}
const equipProdWrites=equipProdBrowser.match(/root\.equip\s*\(/g)??[];
if(equipProdWrites.length!==1) {
  fehler.push("EQUIP_PROD_BROWSER_EXAKT_EIN_WRITE_ERFORDERLICH");
}
for(const [kennung,muster] of [
  ["ATTACK",/\battack\s*\(/],
  ["MOVE",/\bmove\s*\(/],
  ["SMART_MOVE",/\bsmart_move\s*\(/],
  ["USE_SKILL",/\buse_skill\s*\(/],
  ["BANK_STORE",/\bbank_store\s*\(/],
  ["BANK_RETRIEVE",/\bbank_retrieve\s*\(/],
  ["BUY",/\bbuy\s*\(/],
  ["SELL",/\bsell\s*\(/],
  ["EXCHANGE",/\bexchange\s*\(/],
  ["CRAFT",/\bcraft\s*\(/],
  ["UPGRADE",/\bupgrade\s*\(/],
  ["COMPOUND",/\bcompound\s*\(/],
  ["SEND_ITEM",/\bsend_item\s*\(/],
  ["SEND_GOLD",/\bsend_gold\s*\(/],
  ["RAW_EMIT",/\.emit\s*\(/],
]) {
  if(muster.test(equipProdBrowser)) {
    fehler.push("EQUIP_PROD_BROWSER_FREMDWRITE_VERBOTEN:"+kennung);
  }
}
const equipProdRunner=lies("werkzeuge/equipment-equip-produktions-live.mjs");
for(const m of [
  "fuehreEquipEinmalTransaktion",
  "EQUIPMENT_EQUIP_EINMAL_BESTAETIGUNG",
  "EQUIP_PROD_SOURCE_SHA_ERFORDERLICH",
  "runtime/canary/equipment-equip-production/latest.json",
  "sameIntentRetry: false",
  "browserGameplayWrites: 0",
]) {
  if(!equipProdRunner.includes(m)) fehler.push("EQUIP_PROD_RUNNER_FEHLT:"+m);
}
if(/root\.equip\s*\(/.test(equipProdRunner)||/\.emit\s*\(/.test(equipProdRunner)) {
  fehler.push("EQUIP_PROD_RUNNER_DIREKTWRITE_VERBOTEN");
}

const runtimeKomposition=lies("grundlage/quelle/runtime/produktions-runtime.ts");
for(const m of [
  "PRODUKTIONS_KOMPOSITION_FAEHIGKEIT_PROVIDER_FEHLT",
  "PRODUKTIONS_KOMPOSITION_FAEHIGKEIT_NICHT_DEKLARIERT",
  "PRODUKTIONS_KOMPOSITION_MODUL_FAEHIGKEIT_OHNE_ANBIETER",
  "PRODUKTIONS_KOMPOSITION_BENOETIGTE_FAEHIGKEIT_FEHLT",
]){
  if(!runtimeKomposition.includes(m)) fehler.push("PRODUKTIONS_KOMPOSITION_CROSS_VALIDATION_FEHLT:"+m);
}

for(const m of [
  "V5PlanenAktivierungsProtokollPort",
  "PLANEN_AKTIVIERUNG_VOR_WIRKUNG",
  "V5_PLANEN_AKTIVIERUNG_DURABLE_PROTOKOLL_FEHLT",
  "V5_PLANEN_AKTIVIERUNG_AUDIT_NICHT_DURABLE",
  "V5_PLANEN_AKTIVIERUNG_REVALIDIERUNG_FEHLGESCHLAGEN",
  "revalidierePlanenAuthority",
  "faehigkeit.anbieterVersion",
]){
  if(!runtimeKomposition.includes(m)) {
    fehler.push("PLANEN_DURABLE_AUTHORITY_FEHLT:"+m);
  }
}
for(const m of [
  "erteileEquipEinmalAuthority",
  "revalidiereEquipEinmalAuthority",
  "EQUIP_EINMAL_AUTHORITY_VOR_WIRKUNG",
  "V5_EQUIP_EINMAL_DURABLE_PROTOKOLL_FEHLT",
  "V5_EQUIP_EINMAL_AUDIT_NICHT_DURABLE",
  "V5_EQUIP_EINMAL_REVALIDIERUNG_FEHLGESCHLAGEN",
  "EQUIPMENT_EQUIP_EINMAL_BESTAETIGUNG",
  "gueltigBisMs - anforderung.jetztMs > 2_000",
]){
  if(!runtimeKomposition.includes(m)) {
    fehler.push("EQUIP_EINMAL_RUNTIME_AUTHORITY_FEHLT:"+m);
  }
}
const planenAuthorityVertrag=JSON.parse(
  lies("grundlage/vertraege/runtime/durable-planen-authority.json"),
);
if(planenAuthorityVertrag.aktivierung?.erlaubterModus!=="PLANEN"
    || planenAuthorityVertrag.aktivierung?.durableVorLokalerWirkung!==true
    || planenAuthorityVertrag.aktivierung?.revalidierungNachDurableWrite!==true
    || planenAuthorityVertrag.aktivierung?.exakteProviderVersion!==true
    || planenAuthorityVertrag.authority?.gameplayAutoritaet!==false
    || planenAuthorityVertrag.authority?.rawWriteAutoritaet!==false
    || planenAuthorityVertrag.authority?.actionAuthority!==false
    || planenAuthorityVertrag.mutierendeCapabilitiesDurchDiesenVertrag!==0) {
  fehler.push("PLANEN_DURABLE_AUTHORITY_VERTRAG_UNGUELTIG");
}
const produktionsHost=lies("grundlage/quelle/host/produktions-host-controller.ts");
for(const m of [
  "V5ProduktionsHostController",
  "ProduktionsOperationsQuellePort",
  "revalidierePlanenAuthority",
  "erteileEquipEinmalAuthority",
  "revalidiereEquipEinmalAuthority",
  "PRODUKTIONS_HOST_EQUIP_EINMAL_PLANEN_NOCH_AKTIV",
  "PRODUKTIONS_HOST_OPERATIONS_QUELLE_NICHT_BEREIT",
  "gameplayAutoritaet: false",
  "rawWriteAutoritaet: false",
  "actionAuthority: false",
]){
  if(!produktionsHost.includes(m)) {
    fehler.push("PRODUKTIONS_HOST_GRENZE_FEHLT:"+m);
  }
}
const produktionsOperationsQuelle=lies(
  "grundlage/adapter/persistenz/node-produktions-operations-quelle.mjs",
);
for(const m of [
  "produktiver-speicher",
  "runtime/health/storage-probe.json",
  "schreibeAtomarDurable",
  "statfs",
  'zustand: "KRITISCH"',
]){
  if(!produktionsOperationsQuelle.includes(m)) {
    fehler.push("PRODUKTIONS_OPERATIONS_QUELLE_FEHLT:"+m);
  }
}
const operationsVertrag=JSON.parse(
  lies("grundlage/vertraege/runtime/produktions-operations-feed.json"),
);
if(operationsVertrag.health?.kanonischeHealthId!=="produktiver-speicher"
    || operationsVertrag.operations?.zukunftsMetrikVerboten!==true
    || operationsVertrag.host?.revalidierungBeiJedemTick!==true
    || operationsVertrag.host?.quellenausfallEntziehtPlanenAuthority!==true
    || operationsVertrag.authority?.gameplayAutoritaet!==false
    || operationsVertrag.authority?.rawWriteAutoritaet!==false
    || operationsVertrag.authority?.actionAuthority!==false
    || operationsVertrag.mutierendeCapabilitiesDurchDiesenVertrag!==0) {
  fehler.push("PRODUKTIONS_OPERATIONS_VERTRAG_UNGUELTIG");
}

const bedienerDenyAdapter=lies(
  "grundlage/adapter/persistenz/node-bediener-deny-protokoll.mjs",
);
for(const m of [
  "runtime/operator/deny.jsonl",
  "MAXIMALE_EINTRAEGE = 4096",
  "MAXIMALE_BYTES = 5_000_000",
  "ladeWirksameDenyBefehle",
  "BEDIENER_PROTOKOLL_WIRKUNG_WIDERSPRUCH",
  "BEDIENER_PROTOKOLL_BEFEHL_ID_KOLLISION",
]){
  if(!bedienerDenyAdapter.includes(m)) {
    fehler.push("BEDIENER_DENY_RESTART_GRENZE_FEHLT:"+m);
  }
}
const nodeHostKomposition=lies("werkzeuge/v5-produktions-host-komposition.mjs");
for(const m of [
  "erstelleNodeV5ProduktionsHost",
  "NodeBedienerDenyProtokoll",
  "ladeWirksameDenyBefehle",
  "NodePlanenAktivierungsProtokoll",
  "NodeEquipEinmalAuthorityProtokoll",
  "NodeEquipTransaktionsJournal",
  "erteileEquipEinmalAuthority",
  "fuehreEquipEinmalTransaktion",
  "ProduktivesEquipEinmalAdmissionGate",
  "NodeProduktionsOperationsQuelle",
  "V5ProduktionsHostController",
]){
  if(!nodeHostKomposition.includes(m)) {
    fehler.push("NODE_PRODUKTIONS_HOST_KOMPOSITION_FEHLT:"+m);
  }
}
for(const verboten of [
  "kernKomponenten(",
  "aktiviereNichtMutierend(",
  "aktiviereMutierend(",
  "erteileMutierenAuthority(",
  "erfasseOperationsMetrik(",
]){
  if(nodeHostKomposition.includes(verboten)) {
    fehler.push("NODE_PRODUKTIONS_HOST_BYPASS_VERBOTEN:"+verboten);
  }
}
const nodeHostVertrag=JSON.parse(
  lies("grundlage/vertraege/runtime/node-produktions-host-komposition.json"),
);
if(nodeHostVertrag.operatorDeny?.restartReplayErforderlich!==true
    || nodeHostVertrag.operatorDeny?.allowBefehlVorhanden!==false
    || nodeHostVertrag.komposition?.runtimeBypassExponiert!==false
    || nodeHostVertrag.komposition?.registerBypassExponiert!==false
    || nodeHostVertrag.komposition?.postStartRevalidierungsfehlerStopptRuntime!==true
    || nodeHostVertrag.komposition?.equipEinmalAuthorityPfadExponiert!==true
    || nodeHostVertrag.komposition?.generischeMutierenAktivierungExponiert!==false
    || nodeHostVertrag.komposition?.equipEinmalTransaktionExponiert!==true
    || nodeHostVertrag.komposition?.generischeMutierenAusfuehrungExponiert!==false
    || nodeHostVertrag.equipEinmalAuthority?.capabilityId!=="equipment.equip"
    || nodeHostVertrag.equipEinmalAuthority?.provider!=="equipment-core@1"
    || nodeHostVertrag.equipEinmalAuthority?.maximaleVerwendungen!==1
    || nodeHostVertrag.equipEinmalAuthority?.maximaleLebensdauerMs!==2000
    || nodeHostVertrag.equipEinmalAuthority?.durableVorAusstellung!==true
    || nodeHostVertrag.equipEinmalAuthority?.registryAktivierung!==false
    || nodeHostVertrag.equipEinmalAuthority?.gameplayWriteDurchAusstellung!==0
    || nodeHostVertrag.equipEinmalTransaktion?.capabilityId!=="equipment.equip"
    || nodeHostVertrag.equipEinmalTransaktion?.provider!=="equipment-core@1"
    || nodeHostVertrag.equipEinmalTransaktion?.preflightReadOnly!==true
    || nodeHostVertrag.equipEinmalTransaktion?.leererZielslotErforderlich!==true
    || nodeHostVertrag.equipEinmalTransaktion?.durableIntentVorSend!==true
    || nodeHostVertrag.equipEinmalTransaktion?.fencingEquipmentInventoryActionChannel!==true
    || nodeHostVertrag.equipEinmalTransaktion?.socketBudgetGewicht!==3
    || nodeHostVertrag.equipEinmalTransaktion?.maxAdapterAufrufe!==1
    || nodeHostVertrag.equipEinmalTransaktion?.maxGameplayWrites!==1
    || nodeHostVertrag.equipEinmalTransaktion?.sameIntentRetry!==false
    || nodeHostVertrag.equipEinmalTransaktion?.recoveryMaxBeobachtungen!==4
    || nodeHostVertrag.equipEinmalTransaktion?.offeneTransaktionBlockiertNeue!==true
    || nodeHostVertrag.authority?.breiteGameplayAutoritaet!==false
    || nodeHostVertrag.authority?.gameplayAutoritaet!==false
    || nodeHostVertrag.authority?.rawWriteAutoritaet!==false
    || nodeHostVertrag.authority?.actionAuthority!==false
    || nodeHostVertrag.mutierendeCapabilitiesDurchDiesenVertrag!==1) {
  fehler.push("NODE_PRODUKTIONS_HOST_VERTRAG_UNGUELTIG");
}

const bankCanaryBrowser=lies("werkzeuge/bank-planen-canary-browser.mjs");
for(const m of [
  "BANK_CANARY_BROWSER_READ_ONLY = true",
  "BANK_CANARY_GAMEPLAY_WRITES = 0",
  "c.bank",
  "G.items",
  "BANK_CANARY_ALTERNATIVE_RUNTIME_AKTIV",
]){
  if(!bankCanaryBrowser.includes(m)) {
    fehler.push("BANK_PLANEN_CANARY_BROWSER_FEHLT:"+m);
  }
}
for(const [kennung,muster] of [
  ["BANK_STORE",/\bbank_store\s*\(/],
  ["BANK_RETRIEVE",/\bbank_retrieve\s*\(/],
  ["OPEN_BANK_PACK",/\bopen_bank_pack\s*\(/],
  ["BUY",/\bbuy\s*\(/],
  ["SELL",/\bsell\s*\(/],
  ["EXCHANGE",/\bexchange\s*\(/],
  ["CRAFT",/\bcraft\s*\(/],
  ["UPGRADE",/\bupgrade\s*\(/],
  ["COMPOUND",/\bcompound\s*\(/],
  ["ATTACK",/\battack\s*\(/],
  ["MOVE",/\bmove\s*\(/],
  ["SMART_MOVE",/\bsmart_move\s*\(/],
  ["USE_SKILL",/\buse_skill\s*\(/],
  ["EQUIP",/\bequip\s*\(/],
  ["SEND_ITEM",/\bsend_item\s*\(/],
  ["SEND_GOLD",/\bsend_gold\s*\(/],
  ["RAW_EMIT",/\.emit\s*\(/],
]){
  if(muster.test(bankCanaryBrowser)) {
    fehler.push("BANK_PLANEN_CANARY_RAW_WRITE_VERBOTEN:"+kennung);
  }
}
const bankCanaryRunner=lies("werkzeuge/bank-planen-observer-canary.mjs");
for(const m of [
  'BANK_PLANEN_CANARY_CAPABILITY = "merchant.bank.planen"',
  "erweiterungErlaubt: false",
  "browserGameplayWrites: 0",
  "ausfuehrungsAutoritaet: false",
  "breiteRuntimeFreigabe: false",
  "runtime/canary/bank-planen/latest.json",
]){
  if(!bankCanaryRunner.includes(m)) {
    fehler.push("BANK_PLANEN_CANARY_RUNNER_FEHLT:"+m);
  }
}
const bankCanaryVertrag=JSON.parse(
  lies("grundlage/vertraege/runtime/bank-planen-observer-canary.json"),
);
if(bankCanaryVertrag.capability?.id!=="merchant.bank.planen"
    || bankCanaryVertrag.capability?.modus!=="PLANEN"
    || bankCanaryVertrag.capability?.erweiterungErlaubt!==false
    || bankCanaryVertrag.beobachtung?.browserAusdruckFest!==true
    || bankCanaryVertrag.evidence?.browserGameplayWrites!==0
    || bankCanaryVertrag.evidence?.breiteRuntimeFreigabe!==false
    || bankCanaryVertrag.authority?.ausfuehrungsAutoritaet!==false
    || bankCanaryVertrag.authority?.gameplayAutoritaet!==false
    || bankCanaryVertrag.authority?.rawWriteAutoritaet!==false
    || bankCanaryVertrag.authority?.actionAuthority!==false
    || bankCanaryVertrag.mutierendeCapabilitiesDurchDiesenVertrag!==0) {
  fehler.push("BANK_PLANEN_CANARY_VERTRAG_UNGUELTIG");
}

const bankCanaryLiveEvidence=JSON.parse(
  lies("roadmap/bank-planen-observer-live-evidence.json"),
);
if(bankCanaryLiveEvidence.status!=="BESTANDEN"
    || bankCanaryLiveEvidence.capabilityId!=="merchant.bank.planen"
    || bankCanaryLiveEvidence.providerModulId!=="merchant-core-a"
    || bankCanaryLiveEvidence.providerVersion!=="1"
    || bankCanaryLiveEvidence.entscheidung?.planungsNachweis!==true
    || bankCanaryLiveEvidence.sicherheitsnachweis?.browserGameplayWrites!==0
    || bankCanaryLiveEvidence.sicherheitsnachweis?.hostGameplayAutoritaet!==false
    || bankCanaryLiveEvidence.sicherheitsnachweis?.hostRawWriteAutoritaet!==false
    || bankCanaryLiveEvidence.sicherheitsnachweis?.hostActionAuthority!==false
    || bankCanaryLiveEvidence.sicherheitsnachweis?.ausfuehrungsAutoritaet!==false
    || bankCanaryLiveEvidence.sicherheitsnachweis?.breiteRuntimeFreigabe!==false
    || bankCanaryLiveEvidence.privacy?.roheAccountIdPersistiert!==false) {
  fehler.push("BANK_PLANEN_CANARY_LIVE_EVIDENCE_UNGUELTIG");
}

const merchantDemand=lies("grundlage/quelle/merchant/demand.ts");
if(!merchantDemand.includes("eigentuemerModulId: MERCHANT_CORE_A_MODUL_ID")) {
  fehler.push("MERCHANT_WORKFLOW_OWNER_NICHT_KANONISCH");
}
if(merchantDemand.includes('eigentuemerModulId: "merchant-core-a"')) {
  fehler.push("MERCHANT_WORKFLOW_OWNER_HARDCODIERT");
}

const evidence=lies("grundlage/quelle/zertifizierung/evidence-kette.ts");
for(const m of [
  "sampleGaps",
  "fingerprintFehler",
  "unveraenderlicheKette: true",
  "unexpectedGameWrites",
  "kritischePersistenzverluste",
  "hotPathNichtkritischeSsdBlockaden",
  "maximaleSsdAktiveBytes",
  "minimaleFreieBytes",
  "maximaleIoQueueTiefe",
]){
  if(!evidence.includes(m)) fehler.push("EVIDENCE_MARKER_FEHLT:"+m);
}

const ladder=lies("grundlage/quelle/zertifizierung/ladder.ts");
for(const m of [
  "SIMULATOR_REPLAY",
  "FAULT_SUITE",
  "SHADOW",
  "CONTROLLED_LIVE",
  "CANARY",
  "SOAK_5M",
  "SOAK_10M",
  "SOAK_15M",
  "ZERT_LADDER_STUFE_UEBERSPRUNGEN",
  "ZERT_LADDER_MANUELLE_BESTAETIGUNG_ERFORDERLICH",
  "breiteRuntimeFreigegeben: false",
]){
  if(!ladder.includes(m)) fehler.push("LADDER_MARKER_FEHLT:"+m);
}

for(const alt of ["SOAK_1H","SOAK_24H","SOAK_72H","SOAK_7D","SOAK_30D","SOAK_30M","SOAK_60M"]){
  if(ladder.includes(alt)) fehler.push("SOAK_30D_DARF_NICHT_MEHR_IN_LADDER_SEIN:"+alt);
}

const shadow=lies("grundlage/quelle/zertifizierung/shadow-bewertung.ts");
for(const m of [
  "unexpectedGameWrites: 0",
  "shadowHatGameplayAutoritaet: false",
  "shadowHatRawWriteAutoritaet: false",
]){
  if(!shadow.includes(m)) fehler.push("SHADOW_MARKER_FEHLT:"+m);
}

const productionCert=lies("grundlage/quelle/zertifizierung/production-certification.ts");
for(const m of [
  "auditiereProduktionsCoverage",
  "STRUCTURAL_GAP",
  "DEFERRED_EVENT_INAKTIV",
  "duplicateIrreversibleEffects",
  "recipientSettlementVerifiziert",
  "RECOVERY_PENDING",
  "synthetischeEvidenceZaehltAlsLive: false",
  "liveBeweisBestanden",
  "diagnosticOnly: true",
  "actionAuthority: false",
  "rawWriteAuthority: false",
  "breiteRuntimeFreigabe: false",
]){
  if(!productionCert.includes(m)) fehler.push("PRODUCTION_CERT_MARKER_FEHLT:"+m);
}

const testGui=lies("werkzeuge/v5-adventure-land-test-gui.js");
if(!testGui.includes("aktivierePerformanceTrick")||!testGui.includes("performanceTrickStatus")||!testGui.includes("performance_trick")||!testGui.includes("HOWLER_PLAYING_TRUE")||!testGui.includes("aktiv: verfuegbar && audioGefunden && playing")) fehler.push("R19_PERFORMANCE_TRICK_HELPER_FEHLT");
if(!testGui.includes("setzeRestzeit")||!testGui.includes("v5tg-timer")||!testGui.includes("Verbleibende Testdauer")) fehler.push("R19_TEST_GUI_COUNTDOWN_FEHLT");

const liveGui=lies("werkzeuge/r19-controlled-live-test-gui.js");
for(const m of [
  "R19-CONTROLLED-LIVE-EQUIP-ONCE",
  "zertifizierungsStufe: 'CONTROLLED_LIVE'",
  "manuelleBestaetigung: true",
  "sameIntentRetry: false",
  "breiteRuntimeFreigabe: false",
  "PERFORMANCE_TRICK_NICHT_AKTIV",
  "await guiApi().aktivierePerformanceTrick()",
]){
  if(!liveGui.includes(m)) fehler.push("CONTROLLED_LIVE_GUI_MARKER_FEHLT:"+m);
}
const equipAufrufe=liveGui.match(/\.equip\s*\(/g)??[];
if(equipAufrufe.length!==1) fehler.push("CONTROLLED_LIVE_GUI_EQUIP_ANZAHL:"+equipAufrufe.length);

const canaryGui=lies("werkzeuge/r19-canary-test-gui.js");
for(const m of [
  "R19-CANARY-EQUIP-ONCE",
  "zertifizierungsStufe: 'CANARY'",
  "r19-canary-bounded-test-ranker",
  "maximalerAbsoluterScoreDelta: MAX_DELTA",
  "gameplayAutoritaet: false",
  "authorityAenderungErlaubt: false",
  "safetyLockerungErlaubt: false",
  "deterministischerFallbackIndex",
  "hardErlaubteKandidaten",
  "sameIntentRetry: false",
  "breiteRuntimeFreigabe: false",
  "PERFORMANCE_TRICK_NICHT_AKTIV",
  "await guiApi().aktivierePerformanceTrick()",
]){
  if(!canaryGui.includes(m)) fehler.push("R19_CANARY_GUI_MARKER_FEHLT:"+m);
}
const canaryEquipAufrufe=canaryGui.match(/\.equip\s*\(/g)??[];
if(canaryEquipAufrufe.length!==1) fehler.push("R19_CANARY_GUI_EQUIP_ANZAHL:"+canaryEquipAufrufe.length);

const soakGui=lies("werkzeuge/r19-soak-5m-test-gui.js");
for(const m of [
  "R19-SOAK-5M-START",
  "const DAUER_MS = 5 * 60 * 1000",
  "const INTERVALL_MS = 15 * 1000",
  "const MAX_SAMPLE_GAP_MS = 45 * 1000",
  "gameplayWritesDurchHarness: 0",
  "unerwarteteGameWritesImHarness: 0",
  "breiteRuntimeFreigabe: false",
  "EVIDENCE_KETTE_UNGUELTIG",
  "HEAP_METRIK_FEHLT",
  "STORAGE_ESTIMATE_FEHLT",
  "PERFORMANCE_TRICK_NICHT_AKTIV",
  "PERFORMANCE_TRICK_AUSGEFALLEN",
  "await guiApi().aktivierePerformanceTrick()",
  "guiApi().performanceTrickStatus()",
  "performanceTrickFehler",
  "gui.setzeRestzeit",
  "setInterval(aktualisiereCountdown, 1000)",
  "restzeitMs",
]){
  if(!soakGui.includes(m)) fehler.push("R19_SOAK_5M_GUI_MARKER_FEHLT:"+m);
}
for(const verboten of [/\.equip\s*\(/,/\.attack\s*\(/,/\.move\s*\(/,/\.smart_move\s*\(/,/\.use_skill\s*\(/]){
  if(verboten.test(soakGui)) fehler.push("R19_SOAK_5M_RAW_GAME_WRITE_VERBOTEN:"+verboten);
}

const soak10Gui=lies("werkzeuge/r19-soak-10m-test-gui.js");
for(const m of [
  "R19-SOAK-10M-START",
  "const DAUER_MS = 10 * 60 * 1000",
  "const INTERVALL_MS = 30 * 1000",
  "const MAX_SAMPLE_GAP_MS = 90 * 1000",
  "gameplayWritesDurchHarness: 0",
  "unerwarteteGameWritesImHarness: 0",
  "breiteRuntimeFreigabe: false",
  "EVIDENCE_KETTE_UNGUELTIG",
  "PERFORMANCE_TRICK_NICHT_AKTIV",
  "PERFORMANCE_TRICK_AUSGEFALLEN",
  "gui.setzeRestzeit",
  "setInterval(aktualisiereCountdown, 1000)",
  "restzeitMs",
]){
  if(!soak10Gui.includes(m)) fehler.push("R19_SOAK_10M_GUI_MARKER_FEHLT:"+m);
}
for(const verboten of [/\.equip\s*\(/,/\.attack\s*\(/,/\.move\s*\(/,/\.smart_move\s*\(/,/\.use_skill\s*\(/]){
  if(verboten.test(soak10Gui)) fehler.push("R19_SOAK_10M_RAW_GAME_WRITE_VERBOTEN:"+verboten);
}

const soak15Gui=lies("werkzeuge/r19-soak-15m-test-gui.js");
for(const m of [
  "R19-SOAK-15M-START",
  "const DAUER_MS = 15 * 60 * 1000",
  "const INTERVALL_MS = 30 * 1000",
  "const MAX_SAMPLE_GAP_MS = 90 * 1000",
  "const MAX_SAMPLES = 40",
  "samples.length >= 30",
  "minimaleSamples: 30",
  "gameplayWritesDurchHarness: 0",
  "unerwarteteGameWritesImHarness: 0",
  "breiteRuntimeFreigabe: false",
  "EVIDENCE_KETTE_UNGUELTIG",
  "PERFORMANCE_TRICK_NICHT_AKTIV",
  "PERFORMANCE_TRICK_AUSGEFALLEN",
  "gui.setzeRestzeit",
  "setInterval(aktualisiereCountdown, 1000)",
]){
  if(!soak15Gui.includes(m)) fehler.push("R19_SOAK_15M_GUI_MARKER_FEHLT:"+m);
}
for(const verboten of [/\.equip\s*\(/,/\.attack\s*\(/,/\.move\s*\(/,/\.smart_move\s*\(/,/\.use_skill\s*\(/]){
  if(verboten.test(soak15Gui)) fehler.push("R19_SOAK_15M_RAW_GAME_WRITE_VERBOTEN:"+verboten);
}

const rawMuster=[
  /\battack\s*\(/,/\bsmart_move\s*\(/,/\bmove\s*\(/,/\bxmove\s*\(/,
  /\buse_skill\s*\(/,/\brespawn\s*\(/,/\bchange_server\s*\(/,
  /\bsend_cm\s*\(/,/\bsend_gold\s*\(/,/\bsend_item\s*\(/,/\.emit\s*\(/,
];
for(const p of pflicht.filter(x=>x.startsWith("grundlage/quelle/"))){
  const t=lies(p);
  if(rawMuster.some(r=>r.test(t))) fehler.push("R19_CORE_RAW_GAME_WRITE_VERBOTEN:"+p);
}

if(fehler.length){
  console.error("[V5-R19-GUARD] FEHLER\n"+fehler.join("\n"));
  process.exit(1);
}
console.log("[V5-R19-GUARD] OK / Zertifizierung bis Shadow no-write und manuelles Live-Gate unvermeidbar");
