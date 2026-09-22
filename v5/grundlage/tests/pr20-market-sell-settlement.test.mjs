import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  pruefeMarketSellSettlement,
} from "../../erzeugt/merchant/market-sell-settlement.js";

const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

function bindung(override = {}) {
  return {
    schemaVersion: 1,
    characterId: "merchant-a",
    sessionId: "session-1",
    serverRegion: "EU",
    serverKennung: "I",
    map: "main",
    beobachtetAmMs: 1000,
    inventarIndex: 0,
    itemName: "hpot0",
    itemLevel: 0,
    slotMenge: 12,
    itemGesamtmenge: 12,
    erwarteterGoldZuwachs: 12,
    characterGold: 1000,
    itemFingerprint: "a".repeat(16),
    inventoryRestFingerprint: "b".repeat(16),
    merchantFingerprint: "c".repeat(16),
    ...override,
  };
}

test("PR20.3 Sell-Kandidat ist auf bestaetigte Buy-Gold-Testeinheiten begrenzt", () => {
  const kandidat = lies(
    "grundlage/vertraege/runtime/market-sell-production-candidate.json",
  );
  assert.equal(kandidat.status, "VORBEREITET_WARTET_AUF_BUY_GOLD_7_OF_7");
  assert.equal(kandidat.publicFunction, "sell");
  assert.equal(kandidat.menge, 1);
  assert.equal(kandidat.actionContractId, "AL-ACTION-SELL");
  assert.equal(kandidat.recoveryContractId, "AL-RECOVERY-SELL");
  assert.equal(kandidat.verifierId, "AL-VERIFIER-SELL");
  assert.equal(kandidat.sourceBuyStateKey, "AIO_V5_PR20_3_BUY_GOLD_STEP_TEST_V1");
  assert.equal(kandidat.sourceRequirement.step7, "BESTANDEN");
  assert.equal(kandidat.sourceRequirement.liveAttempts, 2);
  assert.equal(kandidat.sourceRequirement.eachStatus, "COMMITTED");
  assert.equal(kandidat.sourceRequirement.eachSettlement, "BESTAETIGT");
  assert.equal(kandidat.testHarness.steps, 7);
  assert.equal(kandidat.testHarness.maxTrueTests, 2);
  assert.equal(kandidat.testHarness.mergeBetweenStepsRequired, false);
  assert.equal(kandidat.productionAuthority.registered, false);
});

test("Sell Action/Recovery/Verifier sind non-idempotent und no-blind-retry", () => {
  const actions = lies("wissensbasis/vertraege/action-contracts.json").contracts;
  const recovery = lies("wissensbasis/vertraege/recovery-contracts.json").actions;
  const verifier = lies("grundlage/vertraege/r9/verifier-katalog.json").verifiers;
  const action = actions.find(x => x.id === "AL-ACTION-SELL");
  const rec = recovery.find(x => x.id === "AL-RECOVERY-SELL");
  const ver = verifier.find(x => x.id === "AL-VERIFIER-SELL");
  assert.ok(action);
  assert.ok(rec);
  assert.ok(ver);
  assert.equal(action.publicFunction, "sell");
  assert.equal(action.idempotency, "NON_IDEMPOTENT");
  assert.equal(action.client.correlationType, "FIFO_DEFERRED");
  assert.equal(action.client.correlationChannel, "sell");
  assert.equal(action.unknownOutcomePolicy, "RECONCILE_NO_BLIND_RETRY");
  assert.equal(rec.retryPolicy.sameIntentAfterPossibleSend, "NEVER");
  assert.equal(ver.unknownOutcomePolicy, "RECONCILE_NO_BLIND_RETRY");
});

test("Settlement bestaetigt nur exakten Goldzuwachs, -1 Item und unveraendertes Restinventar", () => {
  const out = pruefeMarketSellSettlement(
    bindung(),
    bindung({
      beobachtetAmMs: 1001,
      slotMenge: 11,
      itemGesamtmenge: 11,
      characterGold: 1012,
      itemFingerprint: "d".repeat(16),
    }),
  );
  assert.equal(out.status, "BESTAETIGT");
  assert.equal(out.goldDelta, 12);
  assert.equal(out.itemMengenDelta, -1);
  assert.equal(out.restInventoryUnveraendert, true);
  assert.equal(out.sameIntentErneutSenden, false);
});

test("Nur Goldzuwachs, nur Itemverlust oder Restinventory-Drift ist DRIFT", () => {
  const onlyGold = pruefeMarketSellSettlement(
    bindung(),
    bindung({
      beobachtetAmMs: 1001,
      characterGold: 1012,
    }),
  );
  assert.equal(onlyGold.status, "DRIFT");

  const onlyItem = pruefeMarketSellSettlement(
    bindung(),
    bindung({
      beobachtetAmMs: 1001,
      slotMenge: 11,
      itemGesamtmenge: 11,
      itemFingerprint: "d".repeat(16),
    }),
  );
  assert.equal(onlyItem.status, "DRIFT");

  const unrelated = pruefeMarketSellSettlement(
    bindung(),
    bindung({
      beobachtetAmMs: 1001,
      slotMenge: 11,
      itemGesamtmenge: 11,
      characterGold: 1012,
      itemFingerprint: "d".repeat(16),
      inventoryRestFingerprint: "e".repeat(16),
    }),
  );
  assert.equal(unrelated.status, "DRIFT");
});

test("Unveraenderter Zustand bleibt OFFEN", () => {
  const out = pruefeMarketSellSettlement(
    bindung(),
    bindung({ beobachtetAmMs: 1001 }),
  );
  assert.equal(out.status, "OFFEN");
  assert.equal(out.sameIntentErneutSenden, false);
});

test("Session, Server, Map, Slot, Item, Preis oder Merchant-Drift blockiert Settlement", () => {
  for (const override of [
    { sessionId: "session-2" },
    { serverKennung: "II" },
    { map: "bank" },
    { inventarIndex: 1 },
    { itemName: "mpot0" },
    { itemLevel: 1 },
    { erwarteterGoldZuwachs: 13 },
    { merchantFingerprint: "f".repeat(16) },
  ]) {
    const out = pruefeMarketSellSettlement(
      bindung(),
      bindung({
        beobachtetAmMs: 1001,
        slotMenge: 11,
        itemGesamtmenge: 11,
        characterGold: 1012,
        itemFingerprint: "d".repeat(16),
        ...override,
      }),
    );
    assert.equal(out.status, "DRIFT");
  }
});

test("Settlement-Core enthaelt keinen Gameplay-Send", () => {
  const core = fs.readFileSync(
    "grundlage/quelle/merchant/market-sell-settlement.ts",
    "utf8",
  );
  assert.equal(core.includes("sell("), false);
  assert.equal(core.includes(".emit("), false);
  assert.ok(core.includes("sameIntentErneutSenden: false"));
  assert.ok(core.includes("gameplayAutoritaet: false"));
});
