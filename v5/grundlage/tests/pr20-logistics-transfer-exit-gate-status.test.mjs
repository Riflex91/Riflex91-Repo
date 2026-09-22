import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { roadmapIstMindestens } from "../../werkzeuge/roadmap-gate-rang.mjs";

const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

const evidence = lies("roadmap/pr20-4-logistics-transfer-evidence.json");
const gate = lies("roadmap/pr20-4-logistics-transfer-exit-gate-status.json");
const roadmap = lies("roadmap/post-r19-roadmap.json");
const prep = lies("grundlage/vertraege/runtime/logistics-transfer-production-preparation.json");
const policy = lies("grundlage/vertraege/runtime/ingame-test-execution-policy.json");

test("PR20.4 reale Ingame-Evidence ist 16/16 mit harten 2/2-Budgets", () => {
  assert.equal(evidence.status, "BESTANDEN_REAL_INGAME_16_OF_16_ITEM_GOLD_2_OF_2_PLUS_5M");
  assert.equal(evidence.controllerVersion, "1.2.0");
  assert.equal(evidence.executionMode, "AUTO_ON_LOAD");
  assert.equal(evidence.aggregate.allSixteenStepsPassed, true);
  assert.equal(evidence.aggregate.stepsPassed, 16);
  assert.equal(evidence.aggregate.stepsTotal, 16);
  assert.equal(evidence.aggregate.gameplayWritesTotal, 4);
  assert.equal(evidence.aggregate.sameIntentRetry, false);
  assert.equal(evidence.aggregate.duplicateTransferObserved, false);
  assert.equal(evidence.itemTransfer.liveBudget.consumed, 2);
  assert.equal(evidence.itemTransfer.liveBudget.max, 2);
  assert.equal(evidence.itemTransfer.liveBudget.additionalTrueFunctionalTestAllowed, false);
  assert.equal(evidence.goldTransfer.liveBudget.consumed, 2);
  assert.equal(evidence.goldTransfer.liveBudget.max, 2);
  assert.equal(evidence.goldTransfer.liveBudget.additionalTrueFunctionalTestAllowed, false);
});

test("Item und Gold besitzen Settlement, Roundtrip und 5m NO-WRITE", () => {
  assert.equal(evidence.itemTransfer.allCommitted, true);
  assert.equal(evidence.itemTransfer.exactRecipientSettlements, 2);
  assert.equal(evidence.itemTransfer.roundtripRestored, true);
  assert.equal(evidence.goldTransfer.allCommitted, true);
  assert.equal(evidence.goldTransfer.exactRecipientSettlements, 2);
  assert.equal(evidence.goldTransfer.roundtripRestored, true);

  for (const soak of [evidence.itemTransfer.noWrite5m, evidence.goldTransfer.noWrite5m]) {
    assert.equal(soak.status, "BESTANDEN");
    assert.ok(soak.durationMs >= 300000);
    assert.equal(soak.samples, 21);
    assert.equal(soak.sampleGaps, 0);
    assert.equal(soak.blockerSamples, 0);
    assert.equal(soak.performanceTrickErrors, 0);
    assert.equal(soak.gameplayWrites, 0);
    assert.equal(soak.mutatingPublicFunctionCalls, 0);
  }
});

test("Evidence speichert keine Account-/Session-IDs und erfindet keinen Source-SHA", () => {
  assert.equal(evidence.evidenceSource.accountIdStored, false);
  assert.equal(evidence.evidenceSource.sessionIdStored, false);
  assert.equal(evidence.evidenceSource.identifyingTokensStored, false);
  assert.equal(evidence.exactSourceShaClaimed, false);
  assert.equal(typeof evidence.sourceShaLimitation, "string");
  assert.ok(evidence.sourceShaLimitation.length > 0);
});

test("PR20.4 Exit-Gate schliesst Roadmap, nicht automatisch produktive Authority", () => {
  assert.equal(gate.status, "ROADMAP_ABGESCHLOSSEN_REAL_INGAME");
  assert.equal(gate.transitionPolicy.pr20_4RoadmapMilestoneClosed, true);
  assert.equal(gate.transitionPolicy.pr20_5MerchantStabilityAllowed, true);
  assert.equal(gate.transitionPolicy.pr20_4ProductiveMutationAutomaticallyAllowed, false);
  assert.equal(gate.transitionPolicy.transferProductiveAuthorityAutomaticallyGranted, false);
  assert.equal(gate.safetyRetained.productiveTransferAuthorityGranted, false);
  assert.equal(gate.safetyRetained.rawWriteAuthorityGranted, false);
  assert.equal(gate.safetyRetained.sameIntentRetry, false);
});

test("Roadmap ist mindestens bei PR20.5 und PR20.4 bleibt authority-frei", () => {
  assert.equal(roadmapIstMindestens(roadmap.currentGate, "PR20.5_MERCHANT_STABILITAET"), true);
  assert.equal(roadmap.pr20_4.status, "ROADMAP_ABGESCHLOSSEN_REAL_INGAME");
  assert.equal(roadmap.pr20_4.productiveMutationAllowed, false);
  assert.equal(roadmap.pr20_4.gameplayAuthority, false);
  assert.equal(roadmap.pr20_4.rawWriteAuthority, false);
  assert.ok([
    "FREIGEGEBEN_FUER_PRODUKTIVIERUNG",
    "ROADMAP_ABGESCHLOSSEN_REAL_INGAME",
  ].includes(roadmap.pr20_5.status));
  assert.equal(roadmap.pr20_5.gameplayAuthority, false);
  if (roadmap.pr20_5.status === "ROADMAP_ABGESCHLOSSEN_REAL_INGAME") {
    assert.equal(roadmap.pr20_5.integration15mRequired, false);
    assert.equal(
      roadmap.pr20_5.evidence,
      "v5/roadmap/pr20-5-merchant-stability-evidence.json",
    );
  } else {
    assert.equal(roadmap.pr20_5.integration15mRequired, true);
  }
  assert.equal(prep.status, "ROADMAP_ABGESCHLOSSEN_REAL_INGAME");
  assert.equal(prep.testHarness.productiveTransferAuthority, false);
  assert.equal(policy.executionMode, "AUTO_ON_LOAD");
});
