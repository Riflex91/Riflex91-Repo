import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  erstellePr207AcquisitionPurchaseOneShotPreparation,
  pruefePr207AcquisitionPurchaseSettlement,
  pruefePr207AcquisitionPurchaseVorbereitung,
} from "../../erzeugt/index.js";

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const HASH_C = "c".repeat(64);
const HASH_D = "d".repeat(64);
const HASH_E = "e".repeat(64);

function observation(overrides = {}) {
  return {
    schemaVersion: 1,
    evidenceId: "pr20-7-acquisition-shadow-live-v1-0-1",
    characterId: "My_Merchant",
    sessionId: "My_Merchant",
    serverRegion: "EU",
    serverIdentifier: "I",
    ctype: "merchant",
    beobachtetAmMs: 10_000,
    gueltigBisMs: 11_000,
    shadowEvidenceRatified: true,
    itemName: "wshield",
    targetSlot: "offhand",
    quantity: 1,
    unitPrice: 4800,
    observedGold: 14_493_644,
    freeInventorySlots: 21,
    existingQuantity: 0,
    currentOffhandEmpty: true,
    currentMainhandDoublehand: false,
    classCompatible: true,
    buyWithGoldAvailable: true,
    vendorReachable: true,
    nearestVendorDistance: 88.59875647515783,
    sellDistance: 400,
    inventoryFingerprint: HASH_A,
    goldFingerprint: HASH_B,
    itemDefinitionFingerprint: HASH_C,
    vendorFingerprint: HASH_D,
    prestateFingerprint: HASH_E,
    ...overrides,
  };
}

function plan(overrides = {}) {
  const result = pruefePr207AcquisitionPurchaseVorbereitung(
    observation(overrides),
    10_100,
  );
  assert.equal(result.status, "BEREIT_NO_WRITE");
  assert.ok(result.plan);
  return result.plan;
}

function settlementBinding(overrides = {}) {
  return {
    schemaVersion: 1,
    characterId: "My_Merchant",
    sessionId: "My_Merchant",
    serverRegion: "EU",
    serverKennung: "I",
    beobachtetAmMs: 10_100,
    vendorId: "basics",
    itemName: "wshield",
    menge: 1,
    einzelpreisGold: 4800,
    erwarteteKostenGold: 4800,
    characterGold: 14_493_644,
    itemGesamtmenge: 0,
    inventoryFingerprint: HASH_A,
    itemDefinitionFingerprint: HASH_C,
    vendorFingerprint: HASH_D,
    ...overrides,
  };
}

test("PR20.7 productive purchase preparation pins exact wshield no-write contract", () => {
  const result = pruefePr207AcquisitionPurchaseVorbereitung(
    observation(),
    10_100,
  );
  assert.equal(result.status, "BEREIT_NO_WRITE");
  assert.deepEqual(result.gruende, []);
  assert.equal(result.purchaseAuthorityIssued, false);
  assert.equal(result.gameplayAuthority, false);
  assert.equal(result.rawWriteAuthority, false);

  const p = result.plan;
  assert.ok(p);
  assert.equal(p.characterId, "My_Merchant");
  assert.equal(p.sessionId, "My_Merchant");
  assert.equal(p.serverRegion, "EU");
  assert.equal(p.serverIdentifier, "I");
  assert.equal(p.itemName, "wshield");
  assert.equal(p.targetSlot, "offhand");
  assert.equal(p.quantity, 1);
  assert.equal(p.exactCost, 4800);
  assert.equal(p.minimumGoldSafetyReserve, 1000);
  assert.equal(p.goldBudgetReservationRequired, true);
  assert.equal(p.goldBudgetReservationAmount, 4800);
  assert.equal(p.actionContractId, "AL-ACTION-BUY-WITH-GOLD");
  assert.equal(p.recoveryContractId, "AL-RECOVERY-BUY-WITH-GOLD");
  assert.equal(p.verifierId, "AL-VERIFIER-BUY-WITH-GOLD");
  assert.equal(p.actionChannel, "buy");
  assert.deepEqual(p.resourceIds, [
    "character:My_Merchant:gold",
    "character:My_Merchant:inventory",
    "character:My_Merchant:action_channel:buy",
  ]);
  assert.equal(
    p.socketBudgetResource,
    "character:My_Merchant:socket_call_budget",
  );
  assert.equal(p.socketPlanBudgetReserved, 100);
  assert.equal(p.socketServerReserveUntouched, 100);
  assert.equal(p.durableIntentRequired, true);
  assert.equal(p.durableReadbackRequired, true);
  assert.equal(p.sendBoundaryInitial, "NICHT_GESENDET");
  assert.equal(p.sameIntentRetry, false);
  assert.equal(p.oneShotMaximumUses, 1);
  assert.equal(p.purchaseAuthorityIssued, false);
  assert.equal(p.normalRuntimeAllowed, false);
});

test("PR20.7 purchase preparation fails closed on binding, item, vendor, reserve or freshness drift", () => {
  const cases = [
    [{ sessionId: "other-session" }, "PR20_7_ACQUISITION_PURCHASE_RECIPIENT_DRIFT"],
    [{ serverIdentifier: "II" }, "PR20_7_ACQUISITION_PURCHASE_SERVER_DRIFT"],
    [{ shadowEvidenceRatified: false }, "PR20_7_ACQUISITION_PURCHASE_SHADOW_EVIDENCE_FEHLT"],
    [{ unitPrice: 4801 }, "PR20_7_ACQUISITION_PURCHASE_KANDIDAT_DRIFT"],
    [{ currentOffhandEmpty: false }, "PR20_7_ACQUISITION_PURCHASE_OFFHAND_BELEGT"],
    [{ currentMainhandDoublehand: true }, "PR20_7_ACQUISITION_PURCHASE_DOUBLEHAND_BLOCK"],
    [{ classCompatible: false }, "PR20_7_ACQUISITION_PURCHASE_CLASS_BLOCK"],
    [{ buyWithGoldAvailable: false }, "PR20_7_ACQUISITION_PURCHASE_API_FEHLT"],
    [{ vendorReachable: false }, "PR20_7_ACQUISITION_PURCHASE_VENDOR_NICHT_ERREICHBAR"],
    [{ sellDistance: 399 }, "PR20_7_ACQUISITION_PURCHASE_SELL_DISTANCE_DRIFT"],
    [{ freeInventorySlots: 0 }, "PR20_7_ACQUISITION_PURCHASE_INVENTAR_VOLL"],
    [{ existingQuantity: 1 }, "PR20_7_ACQUISITION_PURCHASE_WSHIELD_BEREITS_VORHANDEN"],
    [{ observedGold: 5799 }, "PR20_7_ACQUISITION_PURCHASE_GOLD_BUDGET_BLOCK"],
    [{ gueltigBisMs: 12_000 }, "PR20_7_ACQUISITION_PURCHASE_EVIDENCE_STALE"],
  ];

  for (const [override, blocker] of cases) {
    const result = pruefePr207AcquisitionPurchaseVorbereitung(
      observation(override),
      10_100,
    );
    assert.equal(result.status, "BLOCKIERT", blocker);
    assert.ok(result.gruende.includes(blocker), blocker);
    assert.equal(result.plan, null);
    assert.equal(result.purchaseAuthorityIssued, false);
  }
});

test("PR20.7 one-shot preparation binds all purchase fences and consumes exactly once", () => {
  const p = plan();
  const oneShot = erstellePr207AcquisitionPurchaseOneShotPreparation(
    p,
    "pr20-7-acq-buy-prep-auth-1",
    "pr20-7-acq-buy-prep-tx-1",
    10_100,
    11_000,
    31,
    32,
    33,
    "pr20-7-acq-buy-socket-1",
  );
  const data = oneShot.data();
  assert.equal(data.maximaleVerwendungen, 1);
  assert.equal(data.purchaseAuthorityIssued, false);
  assert.deepEqual(
    data.resourceClaims.map(x => [x.ressourcenId, x.epoche]),
    [
      ["character:My_Merchant:gold", 31],
      ["character:My_Merchant:inventory", 32],
      ["character:My_Merchant:action_channel:buy", 33],
    ],
  );

  const first = oneShot.pruefeExakteBindung(
    p,
    10_200,
    31,
    32,
    33,
    "pr20-7-acq-buy-socket-1",
  );
  assert.equal(first.bereit, true);
  assert.equal(first.verbraucht, true);
  assert.equal(first.purchaseAuthorityIssued, false);
  assert.equal(oneShot.verbraucht(), true);

  const second = oneShot.pruefeExakteBindung(
    p,
    10_201,
    31,
    32,
    33,
    "pr20-7-acq-buy-socket-1",
  );
  assert.equal(second.bereit, false);
});

test("PR20.7 one-shot preparation revokes on fence or prestate drift", () => {
  const p = plan();
  for (const variant of [
    { gold: 99, inventory: 32, buy: 33, socket: "pr20-7-acq-buy-socket-1", plan: p },
    { gold: 31, inventory: 99, buy: 33, socket: "pr20-7-acq-buy-socket-1", plan: p },
    { gold: 31, inventory: 32, buy: 99, socket: "pr20-7-acq-buy-socket-1", plan: p },
    { gold: 31, inventory: 32, buy: 33, socket: "other-socket", plan: p },
    {
      gold: 31,
      inventory: 32,
      buy: 33,
      socket: "pr20-7-acq-buy-socket-1",
      plan: { ...p, prestateFingerprint: "f".repeat(64) },
    },
  ]) {
    const oneShot = erstellePr207AcquisitionPurchaseOneShotPreparation(
      p,
      "pr20-7-acq-buy-prep-auth-1",
      "pr20-7-acq-buy-prep-tx-1",
      10_100,
      11_000,
      31,
      32,
      33,
      "pr20-7-acq-buy-socket-1",
    );
    const result = oneShot.pruefeExakteBindung(
      variant.plan,
      10_200,
      variant.gold,
      variant.inventory,
      variant.buy,
      variant.socket,
    );
    assert.equal(result.bereit, false);
    assert.equal(
      result.grund,
      "PR20_7_ACQUISITION_PURCHASE_ONE_SHOT_BINDUNG_ODER_FENCE_DRIFT",
    );
    assert.equal(oneShot.gueltigFuer(10_201), false);
  }
});

test("PR20.7 purchase settlement accepts only exact -4800 gold and +1 wshield", () => {
  const before = settlementBinding();
  const committed = pruefePr207AcquisitionPurchaseSettlement(
    before,
    settlementBinding({
      beobachtetAmMs: 10_200,
      characterGold: 14_488_844,
      itemGesamtmenge: 1,
      inventoryFingerprint: "f".repeat(64),
    }),
  );
  assert.equal(committed.status, "BESTAETIGT");
  assert.equal(committed.sameIntentRetry, false);
  assert.equal(committed.purchaseAuthorityIssued, false);

  const onlyGold = pruefePr207AcquisitionPurchaseSettlement(
    before,
    settlementBinding({
      beobachtetAmMs: 10_200,
      characterGold: 14_488_844,
      inventoryFingerprint: "f".repeat(64),
    }),
  );
  assert.equal(onlyGold.status, "DRIFT");
  assert.equal(onlyGold.sameIntentRetry, false);
});

test("PR20.7 productive purchase preparation foundation has no gameplay mutation path", () => {
  const source = fs.readFileSync(
    "grundlage/quelle/equipment/pr20-7-weapon-offhand-acquisition-purchase-preparation.ts",
    "utf8",
  );
  for (const forbidden of [
    "buy_with_gold(",
    "buy(",
    "equip(",
    "unequip(",
    "sell(",
    "send_item(",
    "send_gold(",
    "start_character(",
    "command_character(",
    "use_skill(",
    "api_call(",
    "socket.emit(",
    ".socket.emit(",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.ok(source.includes("AL-ACTION-BUY-WITH-GOLD"));
  assert.ok(source.includes("AL-RECOVERY-BUY-WITH-GOLD"));
  assert.ok(source.includes("AL-VERIFIER-BUY-WITH-GOLD"));
  assert.ok(source.includes("goldBudgetReservationRequired: true"));
  assert.ok(source.includes("purchaseAuthorityIssued: false"));
  assert.ok(source.includes("sameIntentRetry: false"));
  assert.ok(source.includes("normalRuntimeAllowed: false"));
});
