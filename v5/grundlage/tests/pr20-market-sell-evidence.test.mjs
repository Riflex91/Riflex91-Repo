import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const evidence = JSON.parse(fs.readFileSync(
  "roadmap/pr20-3-market-sell-evidence.json",
  "utf8",
));

test("PR20.3 NPC-Sell reale Evidence ist transparent manuell rekonstruiert", () => {
  assert.equal(evidence.status, "BESTANDEN_REAL_INGAME_2_OF_2_PLUS_5M");
  assert.equal(
    evidence.source,
    "OPERATOR_ATTESTED_INGAME_RESULT_MANUALLY_RECONSTRUCTED",
  );
  assert.equal(evidence.reconstruction.rawGuiReportAvailable, false);
  assert.equal(evidence.reconstruction.onlyOperatorConfirmedFactsStored, true);
  assert.equal(evidence.reconstruction.inventedFieldsStored, false);
  assert.equal(evidence.privacy.accountIdStored, false);
  assert.equal(evidence.privacy.accountTokenStored, false);
  assert.equal(evidence.privacy.identifyingTokensStored, false);
});

test("NPC-Sell hat 7/7 und exakt zwei bestaetigte Live-Settlements", () => {
  assert.equal(evidence.aggregate.allSevenStepsPassed, true);
  assert.equal(Object.values(evidence.steps).every(x => x.status === "BESTANDEN"), true);
  assert.equal(evidence.liveTests.length, 2);
  for (const [index, live] of evidence.liveTests.entries()) {
    assert.equal(live.testNr, index + 1);
    assert.equal(live.status, "BESTANDEN");
    assert.equal(live.publicFunction, "sell");
    assert.equal(live.quantity, 1);
    assert.equal(live.publicFunctionCalls, 1);
    assert.equal(live.gameplayWrites, 1);
    assert.equal(live.functionalTestBudgetConsumed, true);
    assert.equal(live.promiseStatus, "RESOLVED");
    assert.equal(live.settlement.status, "BESTAETIGT");
    assert.equal(live.settlement.reason, "SELL_EXAKTES_ITEM_GOLD_DELTA");
    assert.equal(live.settlement.goldDelta, 12);
    assert.equal(live.settlement.itemQuantityDelta, -1);
    assert.equal(live.settlement.restInventoryUnveraendert, true);
    assert.equal(live.settlement.slotOk, true);
    assert.equal(live.settlement.merchantReachable, true);
    assert.equal(live.sameIntentRetry, false);
  }
  assert.equal(evidence.aggregate.totalGameplayWrites, 2);
  assert.equal(evidence.aggregate.totalMutatingPublicFunctionCalls, 2);
  assert.equal(evidence.aggregate.exactSettlements, 2);
  assert.equal(evidence.aggregate.unresolvedSettlements, 0);
});

test("Sell-Live-Budget ist 2/2 verbraucht und darf nicht erneut gesendet werden", () => {
  assert.equal(evidence.liveBudget.consumed, 2);
  assert.equal(evidence.liveBudget.max, 2);
  assert.equal(evidence.liveBudget.additionalTrueFunctionalTestAllowed, false);
  assert.equal(evidence.liveBudget.sameIntentRetry, false);
});

test("Sell 5m NO-WRITE ist bestanden und budgetneutral", () => {
  assert.equal(evidence.noWrite5m.status, "BESTANDEN");
  assert.equal(evidence.noWrite5m.durationMs, 300010);
  assert.equal(evidence.noWrite5m.samples, 21);
  assert.equal(evidence.noWrite5m.sampleGaps, 0);
  assert.equal(evidence.noWrite5m.blockerSamples, 0);
  assert.equal(evidence.noWrite5m.gameplayWrites, 0);
  assert.equal(evidence.noWrite5m.mutatingPublicFunctionCalls, 0);
  assert.equal(evidence.noWrite5m.functionalTestBudgetConsumed, false);
  assert.equal(evidence.noWrite5m.liveTestsConsumed, 2);
  assert.equal(evidence.noWrite5m.liveTestsMax, 2);
  assert.equal(evidence.noWrite5m.sameIntentRetry, false);
});

test("Die zwei verkauften Einheiten sind an die bestaetigte Buy-Gold-Evidence gebunden", () => {
  assert.equal(
    evidence.sourceBuyEvidence.evidence,
    "v5/roadmap/pr20-3-market-buy-gold-evidence.json",
  );
  assert.equal(evidence.sourceBuyEvidence.itemName, "hpot0");
  assert.equal(evidence.sourceBuyEvidence.confirmedTestUnitsConsumedBySell, 2);
  assert.equal(evidence.gateEffect.pr20_3ExitGateReadyForFormalEvaluation, true);
  assert.equal(evidence.gateEffect.productiveMarketAuthorityGranted, false);
});
