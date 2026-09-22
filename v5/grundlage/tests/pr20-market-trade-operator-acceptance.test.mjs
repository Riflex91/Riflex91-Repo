import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

const acceptance = lies("roadmap/pr20-3-trade-operator-acceptance.json");
const prep = lies("grundlage/vertraege/runtime/market-production-preparation.json");
const roadmap = lies("roadmap/post-r19-roadmap.json");
const actions = lies("wissensbasis/vertraege/action-contracts.json").contracts;
const recovery = lies("wissensbasis/vertraege/recovery-contracts.json").actions;
const verifiers = lies("grundlage/vertraege/r9/verifier-katalog.json").verifiers;

test("trade_buy und trade_sell sind fuer die PR20.3-Roadmap voll abgenommen", () => {
  assert.equal(
    acceptance.status,
    "VOLLSTAENDIG_ABGENOMMEN_DURCH_OPERATOR_OHNE_LIVE_EVIDENCE",
  );
  for (const key of ["trade_buy", "trade_sell"]) {
    const p = acceptance.paths[key];
    assert.equal(p.roadmapStatus, "VOLL_ABGENOMMEN_OPERATOR");
    assert.equal(p.countsAsPassedForRoadmap, true);
    assert.equal(p.countsAsPassedEvidence, false);
    assert.equal(p.liveTestPerformed, false);
    assert.equal(p.liveEvidence, "NICHT_VORHANDEN");
    assert.equal(p.productiveMutationAutomaticallyAllowed, false);
    assert.equal(p.localCapabilityGateRequired, true);
  }
  assert.equal(acceptance.transitionPolicy.blocksPr20_3Sequencing, false);
  assert.equal(acceptance.transitionPolicy.requiresDedicatedTradeLiveTestsForRoadmap, false);
  assert.equal(acceptance.transitionPolicy.grantsProductiveTradeAuthority, false);
  assert.equal(acceptance.transitionPolicy.grantsRawWriteAuthority, false);
  assert.equal(acceptance.transitionPolicy.rewritesHistoricalEvidence, false);
});

test("Trade-Safety bleibt trotz Operator-Abnahme unveraendert", () => {
  assert.equal(acceptance.safetyRetained.freshNonEmptyRidRequired, true);
  assert.equal(acceptance.safetyRetained.listingFingerprintRequired, true);
  assert.equal(acceptance.safetyRetained.ridIsIdempotencyKey, false);
  assert.equal(acceptance.safetyRetained.ridIsQuantityVersion, false);
  assert.equal(acceptance.safetyRetained.partialFillMayKeepRid, true);
  assert.equal(acceptance.safetyRetained.remoteListingCanDrift, true);
  assert.equal(acceptance.safetyRetained.tradeSellMustReproduceServerSelectedItem, true);
  assert.equal(acceptance.safetyRetained.physicalVariantAmbiguityBlocks, true);
  assert.equal(acceptance.safetyRetained.sameIntentRetry, false);
  assert.equal(
    acceptance.safetyRetained.unknownOutcome,
    "REOBSERVE_RECONCILE_NO_BLIND_RETRY",
  );
});

test("Action-, Recovery- und Verifier-Vertraege bleiben vorhanden und non-idempotent", () => {
  const matrix = [
    ["AL-ACTION-TRADE-BUY", "AL-RECOVERY-TRADE-BUY", "AL-VERIFIER-TRADE-BUY", "trade_buy"],
    ["AL-ACTION-TRADE-SELL", "AL-RECOVERY-TRADE-SELL", "AL-VERIFIER-TRADE-SELL", "trade_sell"],
  ];
  for (const [actionId, recoveryId, verifierId, fn] of matrix) {
    const action = actions.find(x => x.id === actionId);
    const rec = recovery.find(x => x.id === recoveryId);
    const verifier = verifiers.find(x => x.id === verifierId);
    assert.ok(action);
    assert.ok(rec);
    assert.ok(verifier);
    assert.equal(action.publicFunction, fn);
    assert.equal(action.idempotency, "NON_IDEMPOTENT");
    assert.equal(action.unknownOutcomePolicy, "RECONCILE_NO_BLIND_RETRY");
    assert.equal(rec.retryPolicy.sameIntentAfterPossibleSend, "NEVER");
    assert.equal(verifier.unknownOutcomePolicy, "RECONCILE_NO_BLIND_RETRY");
  }
});

test("Market-Vertrag und Roadmap spiegeln Operator-Abnahme ohne produktive Authority", () => {
  assert.equal(
    prep.playerMarketTradeOperatorAcceptance.status,
    "VOLLSTAENDIG_ABGENOMMEN_DURCH_OPERATOR_OHNE_LIVE_EVIDENCE",
  );
  assert.equal(prep.playerMarketTradeOperatorAcceptance.trade_buy.countsAsPassedForRoadmap, true);
  assert.equal(prep.playerMarketTradeOperatorAcceptance.trade_buy.countsAsPassedEvidence, false);
  assert.equal(prep.playerMarketTradeOperatorAcceptance.trade_sell.countsAsPassedForRoadmap, true);
  assert.equal(prep.playerMarketTradeOperatorAcceptance.trade_sell.countsAsPassedEvidence, false);
  assert.equal(prep.playerMarketTradeOperatorAcceptance.blocksPr20_3Sequencing, false);
  assert.equal(prep.playerMarketTradeOperatorAcceptance.grantsProductiveTradeAuthority, false);
  assert.equal(prep.playerMarketTradeOperatorAcceptance.sameIntentRetry, false);

  assert.equal(roadmap.pr20_3.tradeBuyStatus, "VOLL_ABGENOMMEN_OPERATOR_OHNE_LIVE_EVIDENCE");
  assert.equal(roadmap.pr20_3.tradeSellStatus, "VOLL_ABGENOMMEN_OPERATOR_OHNE_LIVE_EVIDENCE");
  assert.equal(roadmap.pr20_3.tradePathsBlockSequencing, false);
  assert.equal(roadmap.pr20_3.productiveTradeAuthority, false);
  assert.equal(roadmap.pr20_3.activeTest, "NPC_SELL_STEP_TEST");
});
