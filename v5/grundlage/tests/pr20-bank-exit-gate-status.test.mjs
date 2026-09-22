import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const gate = JSON.parse(fs.readFileSync(
  "roadmap/pr20-2-bank-exit-gate-status.json",
  "utf8",
));
const roadmap = JSON.parse(fs.readFileSync(
  "roadmap/post-r19-roadmap.json",
  "utf8",
));
const direct = JSON.parse(fs.readFileSync(
  "roadmap/pr20-2-bank-direct-ingame-function-evidence.json",
  "utf8",
));
const openAdmission = JSON.parse(fs.readFileSync(
  "roadmap/pr20-2-bank-open-pack-admission-evidence.json",
  "utf8",
));

test("PR20.2 Aggregate Exit-Gate ist ehrlich blockiert und fail-closed", () => {
  assert.equal(gate.status, "BLOCKIERT_FAIL_CLOSED");
  assert.deepEqual(gate.blocker, [
    "BANK_WITHDRAW_LIVE_EVIDENCE_UNVOLLSTAENDIG_TESTLIMIT_2_OF_2",
    "OPEN_BANK_PACK_RESOURCE_BLOCKED_NO_LIVE",
  ]);
  assert.equal(gate.firstMutationSet.complete, false);
  assert.equal(gate.firstMutationSet.bank_deposit, "BESTANDEN");
  assert.equal(gate.firstMutationSet.bank_retrieve, "BESTANDEN_2_OF_2");
  assert.equal(gate.firstMutationSet.bank_store, "BESTANDEN_2_OF_2");
  assert.equal(gate.firstMutationSet.bank_swap, "BESTANDEN_2_OF_2");
  assert.equal(gate.firstMutationSet.bank_withdraw, "NICHT_BESTANDEN_TESTLIMIT_ERREICHT");
});

test("Exit-Gate verbietet dritten Withdraw-Test, breite Bankfreigabe und PR20.3", () => {
  assert.equal(gate.policy.withdrawFunctionalTestsConsumed, 2);
  assert.equal(gate.policy.withdrawAdditionalFunctionalTestAllowed, false);
  assert.equal(gate.policy.openPackLiveMutationFreigegeben, false);
  assert.equal(gate.policy.sameIntentRetry, false);
  assert.equal(gate.policy.breiteBankAktivierungErlaubt, false);
  assert.equal(gate.policy.pr20_3MarktStartErlaubt, false);
  assert.equal(gate.policy.evaluationGameplayWrites, 0);
  assert.equal(gate.policy.evaluationMutatingPublicFunctionCalls, 0);
  assert.equal(roadmap.currentGate, "PR20.2_BANK_PRODUKTIVIERUNG");
  assert.equal(roadmap.parallelPreparation.pr20_2ExitGate.status, "BLOCKIERT_FAIL_CLOSED");
  assert.equal(roadmap.parallelPreparation.pr20_2ExitGate.pr20_3MarktStartErlaubt, false);
});

test("Open-Pack bleibt nach bestandener read-only Admission fachlich resource-blocked", () => {
  assert.equal(gate.openBankPack.shadowSafetyCheck, "BESTANDEN");
  assert.equal(gate.openBankPack.admissionReadOnlySafetyCheck, "BESTANDEN");
  assert.equal(gate.openBankPack.functionalResult, "RESOURCE_BLOCKED_NO_LIVE");
  assert.equal(gate.openBankPack.characterGold, 15993820);
  assert.equal(gate.openBankPack.goldKosten, 75000000);
  assert.equal(gate.openBankPack.characterShells, 0);
  assert.equal(gate.openBankPack.shellKosten, 600);
  assert.equal(openAdmission.admissionResult.liveMutationFreigegeben, false);
  assert.equal(openAdmission.admissionResult.durableIntentErzeugt, false);
  assert.equal(openAdmission.admissionResult.authorityAusgestellt, false);
});

test("Direkte Ingame-Evidence bleibt 4/5 und Open-Pack ist separat read-only geschlossen", () => {
  assert.equal(direct.exitGate.depositBestanden, true);
  assert.equal(direct.exitGate.retrieveBestanden, true);
  assert.equal(direct.exitGate.storeBestanden, true);
  assert.equal(direct.exitGate.swapBestanden, true);
  assert.equal(direct.exitGate.withdrawBestanden, false);
  assert.equal(direct.exitGate.pr20_2Complete, false);
  assert.equal(direct.exitGate.productionWideActivationAllowed, false);
  assert.equal(
    direct.deferred.open_bank_pack.status,
    "SHADOW_AND_ADMISSION_READ_ONLY_BESTANDEN_RESOURCE_BLOCKED_NO_LIVE",
  );
});


test("Vorbereiteter 5m NO-WRITE-Lauf oeffnet keinen PR20.2-Blocker", () => {
  assert.equal(
    gate.noWriteIntegration.bank5mStatus,
    "SERVER_BINDING_FIX_CI_AUSSTEHEND_DANN_INGAME_READ_ONLY_ERNEUT",
  );
  assert.equal(gate.noWriteIntegration.controllerVersion, "1.0.1");
  assert.equal(
    gate.noWriteIntegration.previousBlockedPreflightEvidence,
    "v5/roadmap/pr20-2-bank-no-write-5m-preflight-blocked-evidence.json",
  );
  assert.equal(
    gate.noWriteIntegration.testPlan,
    "v5/roadmap/pr20-2-bank-no-write-5m-test-plan.json",
  );
  assert.equal(
    gate.noWriteIntegration.package,
    "v5/werkzeuge/pr20-2-bank-no-write-5m-paket.js",
  );
  assert.equal(gate.noWriteIntegration.gameplayWrites, 0);
  assert.equal(gate.noWriteIntegration.mutatingPublicFunctionCalls, 0);
  assert.equal(gate.noWriteIntegration.functionalTestBudgetConsumed, false);
  assert.equal(gate.noWriteIntegration.schliesstBlockerNicht, true);
  assert.equal(
    gate.nextAction,
    "PR20_2_BANK_NO_WRITE_5M_PREFLIGHT_NACH_SERVER_BINDING_FIX_ERNEUT_AUSFUEHREN",
  );
  assert.equal(roadmap.parallelPreparation.pr20_2ExitGate.status, "BLOCKIERT_FAIL_CLOSED");
  assert.equal(
    roadmap.parallelPreparation.pr20_2ExitGate.noWrite5mStatus,
    "SERVER_BINDING_FIX_CI_AUSSTEHEND_DANN_INGAME_READ_ONLY_ERNEUT",
  );
  assert.equal(roadmap.parallelPreparation.pr20_2ExitGate.pr20_3MarktStartErlaubt, false);
});
