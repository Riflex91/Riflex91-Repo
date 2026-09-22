import fs from "node:fs";

function load(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

const deposit = load("roadmap/pr20-2-bank-deposit-production-evidence.json");
const direct = load("roadmap/pr20-2-bank-direct-ingame-function-evidence.json");
const withdraw = load("roadmap/pr20-2-bank-withdraw-two-test-limit-bridge-evidence.json");
const openShadow = load("roadmap/pr20-2-bank-open-pack-shadow-evidence.json");
const openAdmission = load("roadmap/pr20-2-bank-open-pack-admission-evidence.json");
const gate = load("roadmap/pr20-2-bank-exit-gate-status.json");
const roadmap = load("roadmap/post-r19-roadmap.json");

const fail = (message) => {
  process.stderr.write("PR20_2_BANK_EXIT_GATE_FEHLER: " + message + "\n");
  process.exitCode = 1;
};

const allTrue = (obj) => Object.values(obj ?? {}).every((x) => x === true);

if (deposit.status !== "BESTANDEN" || !allTrue(deposit.exitGate)) {
  fail("DEPOSIT_EVIDENCE_NICHT_VOLLSTAENDIG_BESTANDEN");
}

for (const fn of ["bank_retrieve", "bank_store", "bank_swap"]) {
  const x = direct.firstMutationSet?.[fn];
  if (x?.status !== "BESTANDEN" || x.functionalTestsConsumed !== 2
      || x.additionalFunctionalTestAllowed !== false
      || !Array.isArray(x.live) || x.live.length !== 2
      || x.live.some((t) => t.journalStatus !== "COMMITTED"
        || t.gameplayWrites !== 1
        || t.publicFunctionAufrufe !== 1
        || t.sameIntentErneutSenden !== false)) {
    fail(fn.toUpperCase() + "_DIRECT_INGAME_EVIDENCE_UNGUELTIG");
  }
}

const w = direct.firstMutationSet?.bank_withdraw;
if (w?.status !== "NICHT_BESTANDEN_TESTLIMIT_ERREICHT"
    || w.functionalTestsConsumed !== 2
    || w.additionalFunctionalTestAllowed !== false
    || withdraw.testPolicy?.additionalTrueFunctionalTestAllowed !== false
    || withdraw.certification?.realLiveWriteEvidence !== "NICHT_BESTANDEN"
    || withdraw.certification?.productionWideActivationAllowed !== false) {
  fail("WITHDRAW_MUSS_NACH_2_OF_2_FAIL_CLOSED_BLEIBEN");
}

if (openShadow.status !== "BESTANDEN"
    || openShadow.gameplayWrites !== 0
    || openShadow.mutatingPublicFunctionCalls !== 0
    || openShadow.liveMutationFreigegeben !== false) {
  fail("OPEN_PACK_SHADOW_EVIDENCE_UNGUELTIG");
}

const a = openAdmission.admissionResult;
if (openAdmission.status !== "BESTANDEN"
    || openAdmission.sicherheitspruefung !== "BESTANDEN"
    || openAdmission.fachstatus !== "RESOURCE_BLOCKED_NO_LIVE"
    || a?.status !== "BLOCKIERT"
    || a?.pfade?.gold?.verfuegbar !== 15993820
    || a?.pfade?.gold?.kosten !== 75000000
    || a?.pfade?.shells?.verfuegbar !== 0
    || a?.pfade?.shells?.kosten !== 600
    || a?.gameplayWrites !== 0
    || a?.mutatingPublicFunctionCalls !== 0
    || a?.durableIntentErzeugt !== false
    || a?.authorityAusgestellt !== false
    || a?.liveMutationFreigegeben !== false) {
  fail("OPEN_PACK_ADMISSION_MUSS_RESOURCE_BLOCKED_NO_WRITE_BLEIBEN");
}

if (gate.status !== "BLOCKIERT_FAIL_CLOSED"
    || gate.firstMutationSet?.complete !== false
    || gate.policy?.withdrawAdditionalFunctionalTestAllowed !== false
    || gate.policy?.openPackLiveMutationFreigegeben !== false
    || gate.policy?.breiteBankAktivierungErlaubt !== false
    || gate.policy?.pr20_3MarktStartErlaubt !== false
    || gate.policy?.sameIntentRetry !== false
    || gate.policy?.evaluationGameplayWrites !== 0
    || gate.policy?.evaluationMutatingPublicFunctionCalls !== 0) {
  fail("AGGREGATE_GATE_NICHT_FAIL_CLOSED");
}

const expectedBlockers = new Set([
  "BANK_WITHDRAW_LIVE_EVIDENCE_UNVOLLSTAENDIG_TESTLIMIT_2_OF_2",
  "OPEN_BANK_PACK_RESOURCE_BLOCKED_NO_LIVE",
]);
if (gate.blocker?.length !== expectedBlockers.size
    || gate.blocker.some((x) => !expectedBlockers.has(x))) {
  fail("AGGREGATE_GATE_BLOCKER_DRIFT");
}

const noWrite5m = gate.noWriteIntegration;
if (noWrite5m?.bank5mStatus !== "BEREIT_FUER_INGAME_READ_ONLY"
    || noWrite5m?.gameplayWrites !== 0
    || noWrite5m?.mutatingPublicFunctionCalls !== 0
    || noWrite5m?.functionalTestBudgetConsumed !== false
    || noWrite5m?.schliesstBlockerNicht !== true
    || gate.nextAction !== "PR20_2_BANK_NO_WRITE_5M_INGAME_AUSFUEHREN") {
  fail("NO_WRITE_5M_VORBEREITUNG_DARF_EXIT_GATE_NICHT_OEFFNEN");
}

if (roadmap.currentGate !== "PR20.2_BANK_PRODUKTIVIERUNG"
    || roadmap.parallelPreparation?.pr20_2ExitGate?.status !== "BLOCKIERT_FAIL_CLOSED"
    || roadmap.parallelPreparation?.pr20_2ExitGate?.noWrite5mStatus !== "BEREIT_FUER_INGAME_READ_ONLY"
    || roadmap.parallelPreparation?.pr20_2ExitGate?.pr20_3MarktStartErlaubt !== false) {
  fail("ROADMAP_DARF_PR20_2_NICHT_UEBERSPRINGEN");
}

if (process.exitCode !== 1) {
  process.stdout.write(JSON.stringify({
    status: gate.status,
    blocker: gate.blocker,
    currentGate: roadmap.currentGate,
    pr20_3MarktStartErlaubt: false,
    gameplayWrites: 0,
    mutatingPublicFunctionCalls: 0
  }, null, 2) + "\n");
}
