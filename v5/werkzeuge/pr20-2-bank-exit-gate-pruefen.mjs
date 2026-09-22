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
const acceptance = load("roadmap/pr20-2-bank-operator-transition-acceptance.json");
const market = load("grundlage/vertraege/runtime/market-production-preparation.json");
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
  if (x?.status !== "BESTANDEN"
      || x.functionalTestsConsumed !== 2
      || x.additionalFunctionalTestAllowed !== false
      || !Array.isArray(x.live)
      || x.live.length !== 2
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
  fail("WITHDRAW_HISTORISCHE_EVIDENCE_MUSS_UNVERAENDERT_BLEIBEN");
}

const a = openAdmission.admissionResult;
if (openShadow.status !== "BESTANDEN"
    || openShadow.gameplayWrites !== 0
    || openShadow.mutatingPublicFunctionCalls !== 0
    || openShadow.liveMutationFreigegeben !== false
    || openAdmission.status !== "BESTANDEN"
    || openAdmission.sicherheitspruefung !== "BESTANDEN"
    || openAdmission.fachstatus !== "RESOURCE_BLOCKED_NO_LIVE"
    || a?.status !== "BLOCKIERT"
    || a?.gameplayWrites !== 0
    || a?.mutatingPublicFunctionCalls !== 0
    || a?.durableIntentErzeugt !== false
    || a?.authorityAusgestellt !== false
    || a?.liveMutationFreigegeben !== false) {
  fail("OPEN_PACK_EVIDENCE_MUSS_RESOURCE_BLOCKED_NO_WRITE_BLEIBEN");
}

const expectedExceptions = new Set([
  "BANK_WITHDRAW_LIVE_EVIDENCE_UNVOLLSTAENDIG_TESTLIMIT_2_OF_2",
  "OPEN_BANK_PACK_RESOURCE_BLOCKED_NO_LIVE",
]);

if (acceptance.status !== "VOLL_FREIGEGEBEN_MIT_DOKUMENTIERTEN_EVIDENCE_AUSNAHMEN"
    || acceptance.transitionPolicy?.pr20_2RoadmapMilestoneClosed !== true
    || acceptance.transitionPolicy?.pr20_2MilestoneRelease !== "VOLL_FREIGEGEBEN"
    || acceptance.transitionPolicy?.pr20_3TestWorkAllowed !== true
    || acceptance.transitionPolicy?.pr20_3ProductiveMutationAutomaticallyAllowed !== false
    || acceptance.transitionPolicy?.broadBankActivationAllowed !== true
    || acceptance.transitionPolicy?.broadBankReleaseScope !== "BANK_MODULE_WITH_LOCAL_CAPABILITY_GATES"
    || acceptance.transitionPolicy?.withdrawActivationAllowed !== false
    || acceptance.transitionPolicy?.openBankPackActivationAllowed !== false
    || acceptance.transitionPolicy?.sameIntentRetry !== false
    || acceptance.acceptedExceptions?.length !== 2
    || acceptance.acceptedExceptions.some((x) =>
      !expectedExceptions.has(x.id)
      || x.acceptedForBroadBankRelease !== true
      || x.countsAsPassedEvidence !== false
      || x.capabilityRemainsLocallyGated !== true)) {
  fail("OPERATOR_BANKFREIGABE_UNGUELTIG");
}

if (gate.status !== "VOLL_FREIGEGEBEN_MIT_DOKUMENTIERTEN_EVIDENCE_AUSNAHMEN"
    || gate.firstMutationSet?.complete !== false
    || gate.blocker?.length !== 0
    || gate.evidenceExceptions?.length !== expectedExceptions.size
    || gate.evidenceExceptions.some((x) => !expectedExceptions.has(x))
    || gate.policy?.withdrawAdditionalFunctionalTestAllowed !== false
    || gate.policy?.openPackLiveMutationFreigegeben !== false
    || gate.policy?.breiteBankAktivierungErlaubt !== true
    || gate.policy?.pr20_3MarktStartErlaubt !== true
    || gate.policy?.sameIntentRetry !== false
    || gate.milestoneTransition?.roadmapMilestoneClosed !== true
    || gate.milestoneTransition?.milestoneRelease !== "VOLL_FREIGEGEBEN"
    || gate.milestoneTransition?.evidenceComplete !== false
    || gate.milestoneTransition?.operatorAcceptedExceptions !== true
    || gate.milestoneTransition?.broadBankActivationAllowed !== true
    || gate.milestoneTransition?.broadBankReleaseScope !== "BANK_MODULE_WITH_LOCAL_CAPABILITY_GATES"
    || gate.milestoneTransition?.pr20_3TestWorkAllowed !== true
    || gate.milestoneTransition?.pr20_3ProductiveMutationAutomaticallyAllowed !== false
    || gate.nextAction !== "PR20_3_MARKT_TESTKETTE_STARTEN") {
  fail("AGGREGATE_BANKFREIGABE_UNGUELTIG");
}

const noWrite5m = gate.noWriteIntegration;
if (noWrite5m?.bank5mStatus !== "BESTANDEN_REAL_INGAME_READ_ONLY"
    || noWrite5m?.durationMs !== 300017
    || noWrite5m?.samples !== 21
    || noWrite5m?.sampleGaps !== 0
    || noWrite5m?.driftSamples !== 0
    || noWrite5m?.performanceTrickErrors !== 0
    || noWrite5m?.gameplayWrites !== 0
    || noWrite5m?.mutatingPublicFunctionCalls !== 0
    || noWrite5m?.functionalTestBudgetConsumed !== false) {
  fail("NO_WRITE_5M_EVIDENCE_UNGUELTIG");
}

if (roadmap.currentGate !== "PR20.3_MARKT_PRODUKTIVIERUNG"
    || roadmap.parallelPreparation?.pr20_2ExitGate?.status !== "VOLL_FREIGEGEBEN_MIT_DOKUMENTIERTEN_EVIDENCE_AUSNAHMEN"
    || roadmap.parallelPreparation?.pr20_2ExitGate?.breiteBankAktivierungErlaubt !== true
    || roadmap.parallelPreparation?.pr20_2ExitGate?.withdrawLokalGegatet !== true
    || roadmap.parallelPreparation?.pr20_2ExitGate?.openBankPackLokalGegatet !== true
    || roadmap.parallelPreparation?.pr20_2ExitGate?.pr20_3MarktStartErlaubt !== true
    || roadmap.pr20_2?.broadBankActivationAllowed !== true
    || roadmap.pr20_2?.withdrawActivationAllowed !== false
    || roadmap.pr20_2?.openBankPackActivationAllowed !== false
    || roadmap.pr20_3?.status !== "TESTKETTE_START_FREIGEGEBEN_NO_WRITE") {
  fail("ROADMAP_TRANSITION_ZU_PR20_3_UNGUELTIG");
}

if (market.status !== "TESTKETTE_START_FREIGEGEBEN_NO_WRITE"
    || market.pr20_2Transition?.status !== "VOLL_FREIGEGEBEN_MIT_DOKUMENTIERTEN_EVIDENCE_AUSNAHMEN"
    || market.pr20_2Transition?.broadBankActivationAllowed !== true
    || market.pr20_2Transition?.bankExceptionsRemainLocallyGated !== true
    || market.authorityGrenze?.produktiveRegistrierungErlaubt !== false
    || market.authorityGrenze?.gameplayAutoritaet !== false
    || market.authorityGrenze?.rawWriteAutoritaet !== false) {
  fail("PR20_3_TESTKETTE_GRENZE_UNGUELTIG");
}

if (process.exitCode !== 1) {
  process.stdout.write(JSON.stringify({
    status: gate.status,
    evidenceComplete: false,
    evidenceExceptions: gate.evidenceExceptions,
    broadBankActivationAllowed: true,
    broadBankReleaseScope: "BANK_MODULE_WITH_LOCAL_CAPABILITY_GATES",
    currentGate: roadmap.currentGate,
    pr20_3MarktStartErlaubt: true,
    withdrawLokalGegatet: true,
    openBankPackLokalGegatet: true,
    sameIntentRetry: false
  }, null, 2) + "\n");
}
