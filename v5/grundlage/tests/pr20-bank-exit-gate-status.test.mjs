import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const gate = JSON.parse(fs.readFileSync(
  "roadmap/pr20-2-bank-exit-gate-status.json",
  "utf8",
));
const acceptance = JSON.parse(fs.readFileSync(
  "roadmap/pr20-2-bank-operator-transition-acceptance.json",
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

test("PR20.2 ist breit freigegeben, obwohl historische Evidence-Ausnahmen erhalten bleiben", () => {
  assert.equal(
    gate.status,
    "VOLL_FREIGEGEBEN_MIT_DOKUMENTIERTEN_EVIDENCE_AUSNAHMEN",
  );
  assert.deepEqual(gate.blocker, []);
  assert.deepEqual(gate.evidenceExceptions, [
    "BANK_WITHDRAW_LIVE_EVIDENCE_UNVOLLSTAENDIG_TESTLIMIT_2_OF_2",
    "OPEN_BANK_PACK_RESOURCE_BLOCKED_NO_LIVE",
  ]);
  assert.equal(gate.firstMutationSet.complete, false);
  assert.equal(gate.firstMutationSet.bank_deposit, "BESTANDEN");
  assert.equal(gate.firstMutationSet.bank_retrieve, "BESTANDEN_2_OF_2");
  assert.equal(gate.firstMutationSet.bank_store, "BESTANDEN_2_OF_2");
  assert.equal(gate.firstMutationSet.bank_swap, "BESTANDEN_2_OF_2");
  assert.equal(
    gate.firstMutationSet.bank_withdraw,
    "NICHT_BESTANDEN_TESTLIMIT_ERREICHT",
  );
});

test("Operator-Ratifikation erteilt breite Bankfreigabe mit lokalen Capability-Gates", () => {
  assert.equal(
    acceptance.status,
    "VOLL_FREIGEGEBEN_MIT_DOKUMENTIERTEN_EVIDENCE_AUSNAHMEN",
  );
  assert.equal(acceptance.transitionPolicy.pr20_2RoadmapMilestoneClosed, true);
  assert.equal(acceptance.transitionPolicy.pr20_2MilestoneRelease, "VOLL_FREIGEGEBEN");
  assert.equal(acceptance.transitionPolicy.broadBankActivationAllowed, true);
  assert.equal(
    acceptance.transitionPolicy.broadBankReleaseScope,
    "BANK_MODULE_WITH_LOCAL_CAPABILITY_GATES",
  );
  assert.equal(acceptance.transitionPolicy.withdrawActivationAllowed, false);
  assert.equal(acceptance.transitionPolicy.openBankPackActivationAllowed, false);
  assert.equal(acceptance.transitionPolicy.pr20_3TestWorkAllowed, true);
  assert.equal(
    acceptance.transitionPolicy.pr20_3ProductiveMutationAutomaticallyAllowed,
    false,
  );
  assert.equal(acceptance.transitionPolicy.sameIntentRetry, false);
  assert.equal(acceptance.acceptedExceptions.length, 2);
  for (const x of acceptance.acceptedExceptions) {
    assert.equal(x.acceptedForBroadBankRelease, true);
    assert.equal(x.countsAsPassedEvidence, false);
    assert.equal(x.capabilityRemainsLocallyGated, true);
  }
});

test("Breite Bankfreigabe oeffnet weder dritten Withdraw-Test noch Open-Pack-Live ohne Admission", () => {
  assert.equal(gate.policy.breiteBankAktivierungErlaubt, true);
  assert.equal(gate.policy.pr20_3MarktStartErlaubt, true);
  assert.equal(gate.policy.withdrawFunctionalTestsConsumed, 2);
  assert.equal(gate.policy.withdrawAdditionalFunctionalTestAllowed, false);
  assert.equal(gate.policy.openPackLiveMutationFreigegeben, false);
  assert.equal(gate.policy.sameIntentRetry, false);
  assert.equal(openAdmission.admissionResult.liveMutationFreigegeben, false);
  assert.equal(openAdmission.admissionResult.durableIntentErzeugt, false);
  assert.equal(openAdmission.admissionResult.authorityAusgestellt, false);
});

test("Historische direkte Ingame-Evidence wird durch Operator-Freigabe nicht umgeschrieben", () => {
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

test("Bestandener 5m NO-WRITE-Lauf bleibt Teil der Freigabeevidence", () => {
  assert.equal(
    gate.noWriteIntegration.bank5mStatus,
    "BESTANDEN_REAL_INGAME_READ_ONLY",
  );
  assert.equal(gate.noWriteIntegration.durationMs, 300017);
  assert.equal(gate.noWriteIntegration.samples, 21);
  assert.equal(gate.noWriteIntegration.sampleGaps, 0);
  assert.equal(gate.noWriteIntegration.driftSamples, 0);
  assert.equal(gate.noWriteIntegration.performanceTrickErrors, 0);
  assert.equal(gate.noWriteIntegration.gameplayWrites, 0);
  assert.equal(gate.noWriteIntegration.mutatingPublicFunctionCalls, 0);
  assert.equal(gate.noWriteIntegration.functionalTestBudgetConsumed, false);
});

test("Roadmap steht nach PR20.2 auf PR20.3 und Bank-Ausnahmen bleiben lokal gegatet", () => {
  assert.equal(roadmap.currentGate, "PR20.3_MARKT_PRODUKTIVIERUNG");
  assert.equal(
    roadmap.parallelPreparation.pr20_2ExitGate.status,
    "VOLL_FREIGEGEBEN_MIT_DOKUMENTIERTEN_EVIDENCE_AUSNAHMEN",
  );
  assert.equal(
    roadmap.parallelPreparation.pr20_2ExitGate.breiteBankAktivierungErlaubt,
    true,
  );
  assert.equal(
    roadmap.parallelPreparation.pr20_2ExitGate.withdrawLokalGegatet,
    true,
  );
  assert.equal(
    roadmap.parallelPreparation.pr20_2ExitGate.openBankPackLokalGegatet,
    true,
  );
  assert.equal(
    roadmap.parallelPreparation.pr20_2ExitGate.pr20_3MarktStartErlaubt,
    true,
  );
  assert.equal(roadmap.pr20_2.broadBankActivationAllowed, true);
  assert.equal(roadmap.pr20_2.withdrawActivationAllowed, false);
  assert.equal(roadmap.pr20_2.openBankPackActivationAllowed, false);
  assert.equal(roadmap.pr20_3.status, "STUFENTEST_VORBEREITET_EIN_MERGE");
  assert.equal(roadmap.pr20_3.firstLiveCandidateSelected, true);
  assert.equal(roadmap.pr20_3.firstLiveCandidate, "buy_with_gold(item, 1)");
  assert.equal(
    roadmap.pr20_3.testHarness,
    "v5/werkzeuge/pr20-3-market-buy-gold-step-test-paket.js",
  );
  assert.equal(roadmap.pr20_3.mergeZwischenTestschrittenErforderlich, false);
  assert.equal(roadmap.pr20_3.maxTrueTests, 2);
  assert.equal(roadmap.pr20_3.gameplayAuthority, false);
  assert.equal(roadmap.pr20_3.sameIntentRetry, false);
});
