import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));
const gate = lies("roadmap/pr20-3-market-exit-gate-status.json");
const buy = lies("roadmap/pr20-3-market-buy-gold-evidence.json");
const sell = lies("roadmap/pr20-3-market-sell-evidence.json");
const trade = lies("roadmap/pr20-3-trade-operator-acceptance.json");
const roadmap = lies("roadmap/post-r19-roadmap.json");
const logistics = lies("grundlage/vertraege/runtime/logistics-transfer-production-preparation.json");

test("PR20.3 Exit-Gate schliesst die Roadmap mit transparenten Trade-Evidence-Ausnahmen", () => {
  assert.equal(gate.status, "ROADMAP_ABGESCHLOSSEN_MIT_TRADE_EVIDENCE_AUSNAHMEN");
  assert.equal(gate.transitionPolicy.pr20_3RoadmapMilestoneClosed, true);
  assert.equal(gate.transitionPolicy.pr20_4RepoAndNoWritePreparationAllowed, true);
  assert.equal(gate.transitionPolicy.pr20_4ProductiveMutationAutomaticallyAllowed, false);
  assert.equal(gate.tradeException.countsAsPassedForRoadmap, true);
  assert.equal(gate.tradeException.countsAsPassedEvidence, false);
  assert.equal(gate.tradeException.productiveTradeAuthorityGranted, false);
});

test("Buy und Sell besitzen jeweils 7/7, 2/2 Settlement und 5m NO-WRITE", () => {
  for (const evidence of [buy, sell]) {
    assert.equal(evidence.status, "BESTANDEN_REAL_INGAME_2_OF_2_PLUS_5M");
    assert.equal(evidence.aggregate.allSevenStepsPassed, true);
    assert.equal(evidence.aggregate.exactSettlements, 2);
    assert.equal(evidence.liveBudget.consumed, 2);
    assert.equal(evidence.liveBudget.max, 2);
    assert.equal(evidence.liveBudget.additionalTrueFunctionalTestAllowed, false);
    assert.equal(evidence.noWrite5m.status, "BESTANDEN");
    assert.equal(evidence.noWrite5m.samples, 21);
    assert.equal(evidence.noWrite5m.sampleGaps, 0);
    assert.equal(evidence.noWrite5m.blockerSamples, 0);
    assert.equal(evidence.noWrite5m.gameplayWrites, 0);
    assert.equal(evidence.aggregate.sameIntentRetry, false);
  }
});

test("Trade-Abnahme bleibt Roadmap-Abnahme ohne erfundene Live-Evidence", () => {
  for (const key of ["trade_buy", "trade_sell"]) {
    assert.equal(trade.paths[key].countsAsPassedForRoadmap, true);
    assert.equal(trade.paths[key].countsAsPassedEvidence, false);
    assert.equal(trade.paths[key].liveTestPerformed, false);
    assert.equal(trade.paths[key].productiveMutationAutomaticallyAllowed, false);
  }
  assert.equal(trade.transitionPolicy.requiresDedicatedTradeLiveTestsForRoadmap, false);
  assert.equal(trade.transitionPolicy.grantsProductiveTradeAuthority, false);
});

test("Roadmap wechselt ausschliesslich auf PR20.4 NO-WRITE-Vorbereitung", () => {
  assert.equal(roadmap.currentGate, "PR20.4_LOGISTIK_TRANSFER_PRODUKTIVIERUNG");
  assert.equal(roadmap.pr20_3.status, "ROADMAP_ABGESCHLOSSEN_MIT_TRADE_EVIDENCE_AUSNAHMEN");
  assert.equal(roadmap.pr20_4.status, "VORBEREITUNG_FREIGEGEBEN_NO_WRITE");
  assert.equal(roadmap.pr20_4.productiveMutationAllowed, false);
  assert.equal(logistics.status, "BEREIT_FUER_INGAME_GESAMTSTUFENTEST");
  assert.equal(logistics.authorityGrenze.gameplayAutoritaet, false);
});
