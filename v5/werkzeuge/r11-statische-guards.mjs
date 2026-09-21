import fs from "node:fs";
import { pruefeSafetyQuelltexte } from "./r11-safety-source-checks.mjs";

const fehler = [];
const liesText = pfad => fs.readFileSync(pfad, "utf8");

const quellen = {
  admission: liesText("grundlage/quelle/ausfuehrung/admission.ts"),
  recovery: liesText("grundlage/quelle/recovery/recovery-kernel.ts"),
  restart: liesText("grundlage/quelle/recovery/wiederanlauf.ts"),
  health: liesText("grundlage/quelle/operations/health.ts"),
  alerts: liesText("grundlage/quelle/operations/alerts.ts"),
};
fehler.push(...pruefeSafetyQuelltexte(quellen));

const runtimePlanen = liesText("grundlage/quelle/runtime/produktions-runtime.ts");
for (const marker of [
  "V5PlanenAktivierungsProtokollPort",
  "PLANEN_AKTIVIERUNG_VOR_WIRKUNG",
  "V5_PLANEN_AKTIVIERUNG_DURABLE_PROTOKOLL_FEHLT",
  "V5_PLANEN_AKTIVIERUNG_AUDIT_NICHT_DURABLE",
  "V5_PLANEN_AKTIVIERUNG_REVALIDIERUNG_FEHLGESCHLAGEN",
  "revalidierePlanenAuthority",
  "faehigkeit.anbieterVersion",
]) {
  if (!runtimePlanen.includes(marker)) {
    fehler.push("PLANEN_DURABLE_AUTHORITY_MARKER_FEHLT:" + marker);
  }
}

const planenAuditAdapter = liesText(
  "grundlage/adapter/persistenz/node-planen-aktivierungs-protokoll.mjs",
);
for (const marker of [
  "PLANEN_AKTIVIERUNG_VOR_WIRKUNG",
  "erstelleExklusivDurable",
  "PLANEN_AKTIVIERUNGS_AUDIT_ID_KOLLISION",
  "actionAuthority: false",
]) {
  if (!planenAuditAdapter.includes(marker)) {
    fehler.push("PLANEN_AUDIT_ADAPTER_MARKER_FEHLT:" + marker);
  }
}

const produktionsDateisystem = liesText(
  "grundlage/adapter/persistenz/node-produktions-dateisystem.mjs",
);
for (const marker of [
  "D:\\AdventureLand-V5",
  "PRODUKTIONS_DATEISYSTEM_WURZEL_UNGUELTIG",
  "erstelleExklusivDurable",
]) {
  if (!produktionsDateisystem.includes(marker)) {
    fehler.push("PRODUKTIONS_DATEISYSTEM_MARKER_FEHLT:" + marker);
  }
}

const produktionsHost = liesText(
  "grundlage/quelle/host/produktions-host-controller.ts",
);
for (const marker of [
  "V5ProduktionsHostController",
  "ProduktionsOperationsQuellePort",
  "revalidierePlanenAuthority",
  "aktivierePlanenFaehigkeit",
  "PRODUKTIONS_HOST_OPERATIONS_QUELLE_NICHT_BEREIT",
  "gameplayAutoritaet: false",
  "rawWriteAutoritaet: false",
  "actionAuthority: false",
]) {
  if (!produktionsHost.includes(marker)) {
    fehler.push("PRODUKTIONS_HOST_MARKER_FEHLT:" + marker);
  }
}

const operationsQuelle = liesText(
  "grundlage/adapter/persistenz/node-produktions-operations-quelle.mjs",
);
for (const marker of [
  "produktiver-speicher",
  "runtime/health/storage-probe.json",
  "schreibeAtomarDurable",
  "statfs",
  'zustand: "KRITISCH"',
  "backpressureAktiv: true",
]) {
  if (!operationsQuelle.includes(marker)) {
    fehler.push("PRODUKTIONS_OPERATIONS_QUELLE_MARKER_FEHLT:" + marker);
  }
}

const supervisorQuelle = liesText(
  "grundlage/quelle/operations/headless-supervisor.ts",
);
for (const marker of [
  "operationsAktuell",
  "maximalesOperationsAlterMs",
  "operations.metrik.zeitMs <= jetztMs",
]) {
  if (!supervisorQuelle.includes(marker)) {
    fehler.push("SUPERVISOR_OPERATIONS_FRESHNESS_FEHLT:" + marker);
  }
}

const bedienerDenyAdapter = liesText(
  "grundlage/adapter/persistenz/node-bediener-deny-protokoll.mjs",
);
for (const marker of [
  "runtime/operator/deny.jsonl",
  "MAXIMALE_EINTRAEGE = 4096",
  "MAXIMALE_BYTES = 5_000_000",
  "ladeWirksameDenyBefehle",
  "BEDIENER_PROTOKOLL_WIRKUNG_WIDERSPRUCH",
  "BEDIENER_PROTOKOLL_BEFEHL_ID_KOLLISION",
]) {
  if (!bedienerDenyAdapter.includes(marker)) {
    fehler.push("BEDIENER_DENY_RESTART_GRENZE_FEHLT:" + marker);
  }
}

const nodeHostKomposition = liesText(
  "werkzeuge/v5-produktions-host-komposition.mjs",
);
for (const marker of [
  "erstelleNodeV5ProduktionsHost",
  "NodeBedienerDenyProtokoll",
  "ladeWirksameDenyBefehle",
  "NodePlanenAktivierungsProtokoll",
  "NodeEquipEinmalAuthorityProtokoll",
  "NodeEquipTransaktionsJournal",
  "NodeBankDepositEinmalAuthorityProtokoll",
  "NodeBankDepositTransaktionsJournal",
  "pruefeBankDepositStartBereit",
  "fuehreEquipEinmalTransaktion",
  "fuehreBankDepositEinGoldTransaktion",
  "fuehreBankDepositRealShadow",
  "NodeProduktionsOperationsQuelle",
  "V5ProduktionsHostController",
  "wendeDenyAn",
]) {
  if (!nodeHostKomposition.includes(marker)) {
    fehler.push("NODE_PRODUKTIONS_HOST_KOMPOSITION_FEHLT:" + marker);
  }
}
for (const verboten of [
  "kernKomponenten(",
  "aktiviereNichtMutierend(",
  "aktiviereMutierend(",
  "erteileMutierenAuthority(",
  "erfasseOperationsMetrik(",
]) {
  if (nodeHostKomposition.includes(verboten)) {
    fehler.push("NODE_PRODUKTIONS_HOST_BYPASS_VERBOTEN:" + verboten);
  }
}

const bankCanaryBrowser = liesText(
  "werkzeuge/bank-planen-canary-browser.mjs",
);
for (const marker of [
  "BANK_CANARY_BROWSER_READ_ONLY = true",
  "BANK_CANARY_GAMEPLAY_WRITES = 0",
  "c.bank",
  "G.items",
  "BANK_CANARY_ALTERNATIVE_RUNTIME_AKTIV",
  "BANK_CANARY_BANK_KONTEXT_FEHLT",
]) {
  if (!bankCanaryBrowser.includes(marker)) {
    fehler.push("BANK_PLANEN_CANARY_BROWSER_MARKER_FEHLT:" + marker);
  }
}
for (const [kennung, muster] of [
  ["BANK_STORE", /\bbank_store\s*\(/],
  ["BANK_RETRIEVE", /\bbank_retrieve\s*\(/],
  ["OPEN_BANK_PACK", /\bopen_bank_pack\s*\(/],
  ["BUY", /\bbuy\s*\(/],
  ["SELL", /\bsell\s*\(/],
  ["EXCHANGE", /\bexchange\s*\(/],
  ["CRAFT", /\bcraft\s*\(/],
  ["UPGRADE", /\bupgrade\s*\(/],
  ["COMPOUND", /\bcompound\s*\(/],
  ["ATTACK", /\battack\s*\(/],
  ["MOVE", /\bmove\s*\(/],
  ["SMART_MOVE", /\bsmart_move\s*\(/],
  ["USE_SKILL", /\buse_skill\s*\(/],
  ["EQUIP", /\bequip\s*\(/],
  ["SEND_ITEM", /\bsend_item\s*\(/],
  ["SEND_GOLD", /\bsend_gold\s*\(/],
  ["RAW_EMIT", /\.emit\s*\(/],
]) {
  if (muster.test(bankCanaryBrowser)) {
    fehler.push("BANK_PLANEN_CANARY_RAW_WRITE_VERBOTEN:" + kennung);
  }
}

const bankCanaryRunner = liesText(
  "werkzeuge/bank-planen-observer-canary.mjs",
);
for (const marker of [
  'BANK_PLANEN_CANARY_CAPABILITY = "merchant.bank.planen"',
  'BANK_PLANEN_CANARY_POLICY = "BANK-PLANEN-OBSERVER-CANARY-V1"',
  "erweiterungErlaubt: false",
  "browserGameplayWrites: 0",
  "hostGameplayAutoritaet: false",
  "hostRawWriteAutoritaet: false",
  "hostActionAuthority: false",
  "ausfuehrungsAutoritaet: false",
  "breiteRuntimeFreigabe: false",
  "runtime/canary/bank-planen/latest.json",
]) {
  if (!bankCanaryRunner.includes(marker)) {
    fehler.push("BANK_PLANEN_CANARY_RUNNER_MARKER_FEHLT:" + marker);
  }
}

const bankDepositShadow = liesText(
  "grundlage/quelle/merchant/bank-deposit-shadow-admission.ts",
);
for (const marker of [
  "ProduktiveBankDepositShadowAdmission",
  "ErteilteAusfuehrungsFreigabe",
  "PersistVorMutationTor",
  "BANK_DEPOSIT_SOCKET_BUDGET_GEWICHT",
  'send_boundary_state: "NICHT_GESENDET"',
  "same_intent_retry: false",
  "gameplayWrites: 0",
  "adapterAufrufe: 0",
]) {
  if (!bankDepositShadow.includes(marker)) {
    fehler.push("BANK_DEPOSIT_SHADOW_MARKER_FEHLT:" + marker);
  }
}
for (const [kennung, muster] of [
  ["BANK_DEPOSIT", /\bbank_deposit\s*\(/],
  ["RAW_EMIT", /\.emit\s*\(/],
  ["EXECUTION_KERNEL", /\bAusfuehrungsKernel\b/],
  ["EXECUTION_ADAPTER", /\bAusfuehrungsAdapter\b/],
]) {
  if (muster.test(bankDepositShadow)) {
    fehler.push("BANK_DEPOSIT_SHADOW_WRITE_GRENZE_VERLETZT:" + kennung);
  }
}
const bankShadowRecovery = liesText(
  "werkzeuge/bank-deposit-real-shadow-recovery.mjs",
);
for (const marker of [
  "V5 BANK SHADOW RECOVERY MANUELL ABGLEICHEN",
  "BANK_SHADOW_RECOVERY_SOURCE_SHA_MISMATCH",
  "RECOVERY_PENDING_BESTAETIGT_BANK_MANUELL_BETRETEN",
  "schliesseBankLeaseRestartAbgleichAb",
  "browserGameplayWrites: 0",
  "gameplayWrites: 0",
  "adapterAufrufe: 0",
  "oneShotAuthorityAusgestellt: false",
  "bankDepositAusgefuehrt: false",
]) {
  if (!bankShadowRecovery.includes(marker)) {
    fehler.push("BANK_SHADOW_RECOVERY_MARKER_FEHLT:" + marker);
  }
}
for (const [kennung, muster] of [
  ["BANK_DEPOSIT", /\bbank_deposit\s*\(/],
  ["BANK_WITHDRAW", /\bbank_withdraw\s*\(/],
  ["BANK_STORE", /\bbank_store\s*\(/],
  ["BANK_RETRIEVE", /\bbank_retrieve\s*\(/],
  ["RAW_EMIT", /\.emit\s*\(/],
  ["AUTHORITY", /erteileBankDepositEinmalAuthority\s*\(/],
  ["EXECUTION_KERNEL", /\bAusfuehrungsKernel\b/],
  ["EXECUTION_ADAPTER", /\bAusfuehrungsAdapter\b/],
]) {
  if (muster.test(bankShadowRecovery)) {
    fehler.push("BANK_SHADOW_RECOVERY_WRITE_GRENZE_VERLETZT:" + kennung);
  }
}
const bankDepositRealShadow = liesText(
  "werkzeuge/bank-deposit-real-browser-shadow.mjs",
);
for (const marker of [
  "BANK_DEPOSIT_REAL_SHADOW_BESTAETIGUNG",
  "V5_BANK_DEPOSIT_REAL_BROWSER_SHADOW_NO_WRITE",
  "git",
  "rev-parse",
  "BANK_SHADOW_SOURCE_SHA_MISMATCH",
  "startAusserhalbBank: true",
  "manualMountTransition",
  "manualExitRequired",
  "browserGameplayWrites: 0",
  "gameplayWrites: 0",
  "adapterAufrufe: 0",
]) {
  if (!bankDepositRealShadow.includes(marker)) {
    fehler.push("BANK_DEPOSIT_REAL_SHADOW_MARKER_FEHLT:" + marker);
  }
}
for (const [kennung, muster] of [
  ["BANK_DEPOSIT", /\bbank_deposit\s*\(/],
  ["BANK_WITHDRAW", /\bbank_withdraw\s*\(/],
  ["BANK_STORE", /\bbank_store\s*\(/],
  ["BANK_RETRIEVE", /\bbank_retrieve\s*\(/],
  ["RAW_EMIT", /\.emit\s*\(/],
  ["EXECUTION_KERNEL", /\bAusfuehrungsKernel\b/],
  ["EXECUTION_ADAPTER", /\bAusfuehrungsAdapter\b/],
]) {
  if (muster.test(bankDepositRealShadow)) {
    fehler.push("BANK_DEPOSIT_REAL_SHADOW_WRITE_GRENZE_VERLETZT:" + kennung);
  }
}
const bankDepositPreflightBrowser = liesText(
  "werkzeuge/bank-deposit-produktions-browser.mjs",
);
for (const marker of [
  "BANK_DEPOSIT_PREFLIGHT_BROWSER_READ_ONLY = true",
  "BANK_DEPOSIT_PREFLIGHT_GAMEPLAY_WRITES = 0",
  "BANK_DEPOSIT_BANK_GOLD_NICHT_LESBAR",
  "BANK_DEPOSIT_ALTERNATIVE_RUNTIME_AKTIV",
]) {
  if (!bankDepositPreflightBrowser.includes(marker)) {
    fehler.push("BANK_DEPOSIT_PREFLIGHT_BROWSER_MARKER_FEHLT:" + marker);
  }
}
for (const [kennung, muster] of [
  ["BANK_DEPOSIT", /\bbank_deposit\s*\(/],
  ["BANK_WITHDRAW", /\bbank_withdraw\s*\(/],
  ["BANK_STORE", /\bbank_store\s*\(/],
  ["BANK_RETRIEVE", /\bbank_retrieve\s*\(/],
  ["RAW_EMIT", /\.emit\s*\(/],
]) {
  if (muster.test(bankDepositPreflightBrowser)) {
    fehler.push("BANK_DEPOSIT_PREFLIGHT_RAW_WRITE_VERBOTEN:" + kennung);
  }
}

const bankDepositWriteBrowser = liesText(
  "werkzeuge/bank-deposit-produktions-write-browser.mjs",
);
for (const marker of [
  'this.adapterId = "v5-production-cdp-bank-deposit-one-gold-once"',
  "BANK_DEPOSIT_WRITE_MEHR_ALS_EIN_ADAPTER_AUFRUF",
  "ACCOUNT_DRIFT",
  "SESSION_DRIFT",
  "SERVER_DRIFT",
  "CHARACTER_GOLD_DRIFT",
  "BANK_GOLD_DRIFT",
  "DISCONNECT_NACH_MOEGLICHEM_SEND",
]) {
  if (!bankDepositWriteBrowser.includes(marker)) {
    fehler.push("BANK_DEPOSIT_WRITE_BROWSER_MARKER_FEHLT:" + marker);
  }
}
const bankDepositWrites =
  bankDepositWriteBrowser.match(/root\.bank_deposit\(1\)/g) ?? [];
if (bankDepositWrites.length !== 1) {
  fehler.push("BANK_DEPOSIT_WRITE_BROWSER_EXAKT_EIN_DEPOSIT_1_ERFORDERLICH");
}
for (const [kennung, muster] of [
  ["RAW_EMIT", /\.emit\s*\(/],
  ["BANK_WITHDRAW", /\bbank_withdraw\s*\(/],
  ["BANK_STORE", /\bbank_store\s*\(/],
  ["BANK_RETRIEVE", /\bbank_retrieve\s*\(/],
  ["BANK_SWAP", /\bbank_swap\s*\(/],
  ["OPEN_BANK_PACK", /\bopen_bank_pack\s*\(/],
]) {
  if (muster.test(bankDepositWriteBrowser)) {
    fehler.push("BANK_DEPOSIT_WRITE_BROWSER_FREMDWRITE_VERBOTEN:" + kennung);
  }
}

const bankDepositProdCore = liesText(
  "grundlage/quelle/merchant/bank-deposit-produktions-transaktion.ts",
);
for (const marker of [
  "ProduktiveBankDepositTransaktionsOrchestrierung",
  "PersistVorMutationTor",
  "ErteilteAusfuehrungsFreigabe",
  "AusfuehrungsKernel",
  "RecoveryKernel",
  "character:",
  '":gold"',
  "same_intent_retry: false",
  "adapterAufrufeErwartetMaximal: 1",
]) {
  if (!bankDepositProdCore.includes(marker)) {
    fehler.push("BANK_DEPOSIT_PROD_CORE_MARKER_FEHLT:" + marker);
  }
}
if (/\bbank_deposit\s*\(/.test(bankDepositProdCore)
    || /\.emit\s*\(/.test(bankDepositProdCore)) {
  fehler.push("BANK_DEPOSIT_PROD_CORE_RAW_WRITE_VERBOTEN");
}

const bankDepositLiveRunner = liesText(
  "werkzeuge/bank-deposit-produktions-live.mjs",
);
for (const marker of [
  "V5_PRODUCTION_BANK_DEPOSIT_ONE_GOLD_ONE_SHOT_LIVE",
  "BANK_DEPOSIT_EINMAL_BESTAETIGUNG",
  "BANK_DEPOSIT_PROD_SOURCE_SHA_MISMATCH",
  "fuehreBankDepositEinGoldTransaktion",
  "bank-deposit-production/latest.json",
  "betragGold: 1",
  "sameIntentRetry: false",
]) {
  if (!bankDepositLiveRunner.includes(marker)) {
    fehler.push("BANK_DEPOSIT_LIVE_RUNNER_MARKER_FEHLT:" + marker);
  }
}
if (/\bbank_deposit\s*\(/.test(bankDepositLiveRunner)
    || /\.emit\s*\(/.test(bankDepositLiveRunner)) {
  fehler.push("BANK_DEPOSIT_LIVE_RUNNER_DIREKTWRITE_VERBOTEN");
}


const bankWithdrawSettlementCore = liesText(
  "grundlage/quelle/merchant/bank-withdraw-settlement.ts",
);
for (const marker of [
  "BANK_WITHDRAW_ERSTER_BETRAG",
  "pruefeBankWithdrawEinGoldBereitschaft",
  "pruefeBankWithdrawEinGoldSettlement",
  "BANK_WITHDRAW_EXAKTES_GOLD_DELTA",
  "sameIntentErneutSenden: false",
  "gameplayAutoritaet: false",
  "rawWriteAutoritaet: false",
]) {
  if (!bankWithdrawSettlementCore.includes(marker)) {
    fehler.push("BANK_WITHDRAW_SETTLEMENT_CORE_MARKER_FEHLT:" + marker);
  }
}
for (const [kennung, muster] of [
  ["BANK_WITHDRAW_WRITE", /\bbank_withdraw\s*\(/],
  ["RAW_EMIT", /\.emit\s*\(/],
  ["EXECUTION_KERNEL", /\bAusfuehrungsKernel\b/],
  ["EXECUTION_ADAPTER", /\bAusfuehrungsAdapter\b/],
  ["AUTHORITY", /erteile\w*Authority\s*\(/],
]) {
  if (muster.test(bankWithdrawSettlementCore)) {
    fehler.push("BANK_WITHDRAW_SETTLEMENT_CORE_NO_WRITE_VERLETZT:" + kennung);
  }
}
const bankWithdrawCandidate = liesText(
  "grundlage/vertraege/runtime/bank-withdraw-production-candidate.json",
);
for (const marker of [
  '"status": "SETTLEMENT_CORE_RATIFIZIERT_NO_WRITE"',
  '"publicFunction": "bank_withdraw"',
  '"characterGoldDelta": 1',
  '"bankGoldDelta": -1',
  '"sameIntentRetry": false',
  '"produktiveCapabilityInDiesemSchritt": false',
  '"authorityInDiesemSchritt": false',
  '"adapterInDiesemSchritt": false',
  '"liveRunnerInDiesemSchritt": false',
  '"gameplayWritesInDiesemSchritt": 0',
]) {
  if (!bankWithdrawCandidate.includes(marker)) {
    fehler.push("BANK_WITHDRAW_CANDIDATE_GRENZE_FEHLT:" + marker);
  }
}
for (const verboten of [
  '"produktiveCapabilityInDiesemSchritt": true',
  '"authorityInDiesemSchritt": true',
  '"adapterInDiesemSchritt": true',
  '"liveRunnerInDiesemSchritt": true',
]) {
  if (bankWithdrawCandidate.includes(verboten)) {
    fehler.push("BANK_WITHDRAW_CANDIDATE_NO_WRITE_VERLETZT:" + verboten);
  }
}

const equipProduktionsBrowser = liesText(
  "werkzeuge/equipment-equip-produktions-browser.mjs",
);
for (const marker of [
  'this.adapterId = "v5-production-cdp-equip-once"',
  "MERCHANT_ERFORDERLICH",
  "ALTERNATIVE_RUNTIME_AKTIV",
  "EQUIPMENT_SLOT_NICHT_LEER",
  "EQUIP_PROD_MEHR_ALS_EIN_ADAPTER_AUFRUF",
  "erstelleProduktiveEquipLiveVoraussetzungen",
  "erstelleProduktivenEquipRecoveryBeobachter",
]) {
  if (!equipProduktionsBrowser.includes(marker)) {
    fehler.push("EQUIP_PROD_BROWSER_MARKER_FEHLT:" + marker);
  }
}
const equipWrites = equipProduktionsBrowser.match(/root\.equip\s*\(/g) ?? [];
if (equipWrites.length !== 1) {
  fehler.push("EQUIP_PROD_BROWSER_EXAKT_EIN_EQUIP_WRITE_ERFORDERLICH");
}
for (const [kennung, muster] of [
  ["ATTACK", /\battack\s*\(/],
  ["MOVE", /\bmove\s*\(/],
  ["SMART_MOVE", /\bsmart_move\s*\(/],
  ["USE_SKILL", /\buse_skill\s*\(/],
  ["BANK_STORE", /\bbank_store\s*\(/],
  ["BANK_RETRIEVE", /\bbank_retrieve\s*\(/],
  ["BUY", /\bbuy\s*\(/],
  ["SELL", /\bsell\s*\(/],
  ["EXCHANGE", /\bexchange\s*\(/],
  ["CRAFT", /\bcraft\s*\(/],
  ["UPGRADE", /\bupgrade\s*\(/],
  ["COMPOUND", /\bcompound\s*\(/],
  ["SEND_ITEM", /\bsend_item\s*\(/],
  ["SEND_GOLD", /\bsend_gold\s*\(/],
  ["RAW_EMIT", /\.emit\s*\(/],
]) {
  if (muster.test(equipProduktionsBrowser)) {
    fehler.push("EQUIP_PROD_BROWSER_FREMDWRITE_VERBOTEN:" + kennung);
  }
}

const equipProduktionsRunner = liesText(
  "werkzeuge/equipment-equip-produktions-live.mjs",
);
for (const marker of [
  "equipment-equip-production/latest.json",
  "fuehreEquipEinmalTransaktion",
  "EQUIPMENT_EQUIP_EINMAL_BESTAETIGUNG",
  "EQUIP_PROD_KEIN_LEERER_SAFE_SLOT_KANDIDAT",
  "sameIntentRetry: false",
  "browserGameplayWrites: 0",
]) {
  if (!equipProduktionsRunner.includes(marker)) {
    fehler.push("EQUIP_PROD_RUNNER_MARKER_FEHLT:" + marker);
  }
}
for (const muster of [
  /root\.equip\s*\(/,
  /\battack\s*\(/,
  /\bsmart_move\s*\(/,
  /\.emit\s*\(/,
]) {
  if (muster.test(equipProduktionsRunner)) {
    fehler.push("EQUIP_PROD_RUNNER_DIREKTWRITE_VERBOTEN:" + muster);
  }
}

const telemetrie = liesText("grundlage/quelle/operations/telemetrie.ts");
for (const marker of [
  "ssdIoLatenzMs",
  "ioQueueTiefe",
  "backpressureAktiv",
  "freieBytes",
  "recorderDrops",
  "dashboardFehler",
  "verworfeneMetriken",
  "actionAuthority: false",
  "publiziereBestEffort",
]) {
  if (!telemetrie.includes(marker)) fehler.push("TELEMETRIE_MARKER_FEHLT:" + marker);
}

const authority = liesText("grundlage/quelle/operations/authority-status.ts");
for (const marker of [
  "ownerModulId",
  "evidenceIds",
  "ressourcenIds",
  "policyId",
  "erwarteteWirkung",
]) {
  if (!authority.includes(marker)) fehler.push("AUTHORITY_STATUS_MARKER_FEHLT:" + marker);
}

const supervisor = liesText("grundlage/quelle/operations/headless-supervisor.ts");
if (!supervisor.includes("actionAuthority: false")
    || !supervisor.includes('health.zustand === "GESUND"')) {
  fehler.push("HEADLESS_SUPERVISOR_FAIL_CLOSED_UNVOLLSTAENDIG");
}

const safeUpdater = liesText("grundlage/quelle/operations/safe-auto-updater.ts");
for (const marker of [
  "PersistenterSafeAutoUpdater",
  "SAFE_UPDATE_QUIESCE_NICHT_SICHER",
  "SAFE_UPDATE_HANDSHAKE_CANDIDATE_MISMATCH",
  "SAFE_UPDATE_RESTART_URSPRUNG_FEHLT",
  "durableIntentPersistiert: true",
  "sameCandidateErneutAnwenden: false",
  "automatischerRetry = false",
  "executionAuthority = false",
  "gameplayAutoritaet = false",
  "rawWriteAutoritaet = false",
]) {
  if (!safeUpdater.includes(marker)) {
    fehler.push("SAFE_UPDATE_MARKER_FEHLT:" + marker);
  }
}
for (const [muster, kennung] of [
  [/\bfetch\s*\(/, "FETCH"],
  [/\bload_code\s*\(/, "LOAD_CODE"],
  [/\bupload_code\s*\(/, "UPLOAD_CODE"],
  [/\bapi_call\s*\(/, "API_CALL"],
  [/node:child_process/, "CHILD_PROCESS"],
  [/windows-bridge/i, "WINDOWS_BRIDGE"],
]) {
  if (muster.test(safeUpdater)) {
    fehler.push("SAFE_UPDATE_RAW_HOST_ZUGRIFF_VERBOTEN:" + kennung);
  }
}

const remoteConfig = liesText("grundlage/quelle/control/remote-config.ts");
for (const marker of [
  "PersistenterRemoteConfigRegister",
  "REMOTE_CONFIG_POLICY_SCHLUESSEL_SICHERHEITSKRITISCH",
  "REMOTE_CONFIG_QUELLE_NICHT_VERTRAUT",
  "REMOTE_CONFIG_REVISION_REPLAY_ODER_STALE",
  "planningEvidence = true",
  "executionAuthority = false",
  "gameplayAutoritaet = false",
  "rawWriteAutoritaet = false",
]) {
  if (!remoteConfig.includes(marker)) {
    fehler.push("REMOTE_CONFIG_MARKER_FEHLT:" + marker);
  }
}

const requestBudget = liesText("grundlage/quelle/control/request-budget.ts");
for (const marker of [
  "PersistentesCloudRequestBudget",
  "REQUEST_BUDGET_SYSTEM_LIMIT_ERSCHOEPFT",
  "REQUEST_BUDGET_ZWECK_LIMIT_ERSCHOEPFT",
  "durableReserviert: true",
  "refundBeiUnbekanntemAusgang = false",
  "automatischerRetry = false",
  "executionAuthority = false",
  "gameplayAutoritaet = false",
  "rawWriteAutoritaet = false",
]) {
  if (!requestBudget.includes(marker)) {
    fehler.push("REQUEST_BUDGET_MARKER_FEHLT:" + marker);
  }
}

for (const [datei, quelltext] of [
  ["REMOTE_CONFIG", remoteConfig],
  ["REQUEST_BUDGET", requestBudget],
]) {
  for (const [muster, kennung] of [
    [/\bfetch\s*\(/, "FETCH"],
    [/\bload_code\s*\(/, "LOAD_CODE"],
    [/\bupload_code\s*\(/, "UPLOAD_CODE"],
    [/\bapi_call\s*\(/, "API_CALL"],
    [/node:child_process/, "CHILD_PROCESS"],
    [/windows-bridge/i, "WINDOWS_BRIDGE"],
  ]) {
    if (muster.test(quelltext)) {
      fehler.push(datei + "_RAW_REMOTE_ZUGRIFF_VERBOTEN:" + kennung);
    }
  }
}

const segmente = liesText("grundlage/quelle/operations/segment-pflege.ts");
for (const marker of ["maximaleSegmente","maximaleBytes","maximalesAlterMs","komprimiereAbAlterMs"]) {
  if (!segmente.includes(marker)) fehler.push("SEGMENT_PFLEGE_MARKER_FEHLT:" + marker);
}

const golden = liesText("grundlage/quelle/testlabor/golden-replay.ts");
const evidenceReplay = liesText("grundlage/quelle/testlabor/evidence-replay.ts");
if (!golden.includes("serialisiereReplaySnapshot")
    || !golden.includes("stimmtUeberein")) {
  fehler.push("GOLDEN_REPLAY_UNVOLLSTAENDIG");
}
if (!evidenceReplay.includes("verworfenWegenGrenze")
    || !evidenceReplay.includes("EVIDENCE_REPLAY_UNBOUNDED")) {
  fehler.push("EVIDENCE_REPLAY_BOUNDED_UNVOLLSTAENDIG");
}

if (fehler.length > 0) {
  throw new Error("[V5-R11-GUARD]\n" + [...new Set(fehler)].join("\n"));
}
console.log("[V5-R11-GUARD] OK");
