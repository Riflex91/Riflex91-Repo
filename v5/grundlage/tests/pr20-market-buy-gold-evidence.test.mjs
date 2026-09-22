import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

const evidence = lies("roadmap/pr20-3-market-buy-gold-evidence.json");
const plan = lies("roadmap/pr20-3-market-buy-gold-step-test-plan.json");
const prep = lies("grundlage/vertraege/runtime/market-production-preparation.json");
const sell = lies("grundlage/vertraege/runtime/market-sell-production-candidate.json");
const sellPlan = lies("roadmap/pr20-3-market-sell-step-test-plan.json");
const roadmap = lies("roadmap/post-r19-roadmap.json");

test("PR20.3 Buy-Gold reale Evidence ist 7/7 mit 2/2 exakten Live-Settlements bestanden", () => {
  assert.equal(evidence.status, "BESTANDEN_REAL_INGAME_2_OF_2_PLUS_5M");
  assert.equal(evidence.source, "USER_PROVIDED_INGAME_GUI_RESULT");
  assert.equal(evidence.testedSourceSha, "ceeeb9f1fa5eb8c1e70e38de85d007987fcdacb0");
  assert.equal(evidence.controllerVersion, "1.0.0");
  assert.equal(evidence.privacy.accountIdStored, false);
  assert.equal(evidence.privacy.accountTokenStored, false);
  assert.equal(evidence.aggregate.allSevenStepsPassed, true);
  assert.equal(Object.values(evidence.steps).every(x => x.status === "BESTANDEN"), true);
  assert.equal(evidence.liveTests.length, 2);
  for (const live of evidence.liveTests) {
    assert.equal(live.status, "BESTANDEN");
    assert.equal(live.publicFunction, "buy_with_gold");
    assert.equal(live.quantity, 1);
    assert.equal(live.publicFunctionCalls, 1);
    assert.equal(live.gameplayWrites, 1);
    assert.equal(live.functionalTestBudgetConsumed, true);
    assert.equal(live.promiseStatus, "RESOLVED");
    assert.equal(live.promiseSuccess, true);
    assert.equal(live.settlement.status, "BESTAETIGT");
    assert.equal(live.settlement.goldDelta, -20);
    assert.equal(live.settlement.itemQuantityDelta, 1);
    assert.equal(live.settlement.newInventoryFingerprint, true);
    assert.equal(live.sameIntentRetry, false);
  }
  assert.equal(evidence.aggregate.totalGameplayWrites, 2);
  assert.equal(evidence.aggregate.totalMutatingPublicFunctionCalls, 2);
  assert.equal(evidence.aggregate.exactSettlements, 2);
  assert.equal(evidence.aggregate.unresolvedSettlements, 0);
  assert.equal(evidence.aggregate.driftSettlements, 0);
  assert.equal(evidence.aggregate.sameIntentRetry, false);
});

test("Fruehe Kandidatenblockaden waren read-only und verbrauchten kein Live-Budget", () => {
  assert.equal(evidence.preCandidateBlockedAttempts.count, 5);
  assert.equal(evidence.preCandidateBlockedAttempts.gameplayWrites, 0);
  assert.equal(evidence.preCandidateBlockedAttempts.mutatingPublicFunctionCalls, 0);
  assert.equal(
    evidence.preCandidateBlockedAttempts.classification,
    "EXPECTED_ENVIRONMENTAL_PREFLIGHT_BLOCKS_NO_BUDGET",
  );
});

test("Buy-Gold 5m Stabilitaet ist driftfrei und budgetneutral", () => {
  assert.equal(evidence.noWrite5m.status, "BESTANDEN");
  assert.equal(evidence.noWrite5m.durationMs, 300002);
  assert.equal(evidence.noWrite5m.samples, 21);
  assert.equal(evidence.noWrite5m.sampleGaps, 0);
  assert.equal(evidence.noWrite5m.blockerSamples, 0);
  assert.equal(evidence.noWrite5m.gameplayWrites, 0);
  assert.equal(evidence.noWrite5m.mutatingPublicFunctionCalls, 0);
  assert.equal(evidence.noWrite5m.functionalTestBudgetConsumed, false);
  assert.equal(evidence.noWrite5m.sameIntentRetry, false);
});

test("Buy-Gold Live-Budget ist 2/2 verbraucht und weitere echte Tests bleiben gesperrt", () => {
  assert.equal(evidence.liveBudget.consumed, 2);
  assert.equal(evidence.liveBudget.max, 2);
  assert.equal(evidence.liveBudget.additionalTrueFunctionalTestAllowed, false);
  assert.equal(plan.status, "BESTANDEN_REAL_INGAME_2_OF_2_PLUS_5M");
  assert.equal(plan.liveBudget.additionalTrueFunctionalTestAllowed, false);
  assert.equal(plan.resultEvidence, "v5/roadmap/pr20-3-market-buy-gold-evidence.json");
});

test("Nach zusaetzlicher Sell-Evidence ist PR20.3 zur formalen Exit-Gate-Pruefung bereit", () => {
  assert.equal(prep.status, "BUY_GOLD_UND_SELL_BESTANDEN_EXIT_GATE_BEREIT");
  assert.equal(prep.ersterLiveKandidat.status, "BESTANDEN_REAL_INGAME_2_OF_2_PLUS_5M");
  assert.equal(prep.ersterLiveKandidat.liveTestsConsumed, 2);
  assert.equal(prep.ersterLiveKandidat.additionalTrueFunctionalTestAllowed, false);
  assert.equal(
    prep.naechsterVorbereiteterKandidat.status,
    "BESTANDEN_REAL_INGAME_2_OF_2_PLUS_5M",
  );
  assert.equal(
    sell.status,
    "BEREIT_FUER_INGAME_NPC_SELL_STUFENTEST",
  );
  assert.equal(sell.sourceRequirementSatisfiedByRepoEvidence, true);
  assert.equal(sellPlan.status, "BESTANDEN_REAL_INGAME_2_OF_2_PLUS_5M");
  assert.equal(sellPlan.sourceRequirementSatisfiedByRepoEvidence, true);
  assert.equal(roadmap.pr20_3.buyGoldStatus, "BESTANDEN_REAL_INGAME_2_OF_2_PLUS_5M");
  assert.equal(roadmap.pr20_3.buyGoldAdditionalLiveTestAllowed, false);
  assert.equal(roadmap.pr20_3.activeTest, "PR20_3_EXIT_GATE_FORMAL_PRUEFUNG");
  assert.equal(roadmap.pr20_3.productiveMutationAllowed, false);
  assert.equal(roadmap.pr20_3.gameplayAuthority, false);
  assert.equal(roadmap.pr20_3.sameIntentRetry, false);
});
