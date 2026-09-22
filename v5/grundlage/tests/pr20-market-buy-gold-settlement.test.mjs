import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  MARKET_BUY_GOLD_ERSTE_MENGE,
  pruefeMarketBuyGoldBereitschaft,
  pruefeMarketBuyGoldSettlement,
} from "../../erzeugt/merchant/market-buy-gold-settlement.js";

const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

function bindung(override = {}) {
  return {
    schemaVersion: 1,
    characterId: "merchant-a",
    sessionId: "session-1",
    serverRegion: "EU",
    serverKennung: "I",
    beobachtetAmMs: 1000,
    vendorId: "fancypots",
    itemName: "hpot0",
    menge: 1,
    einzelpreisGold: 20,
    erwarteteKostenGold: 20,
    characterGold: 1000,
    itemGesamtmenge: 4,
    inventoryFingerprint: "a".repeat(64),
    itemDefinitionFingerprint: "b".repeat(64),
    vendorFingerprint: "c".repeat(64),
    ...override,
  };
}

test("PR20.3 erster Kandidat ist exakt buy_with_gold Menge 1 und strikt NO-WRITE", () => {
  const kandidat = lies(
    "grundlage/vertraege/runtime/market-buy-gold-production-candidate.json",
  );
  assert.equal(MARKET_BUY_GOLD_ERSTE_MENGE, 1);
  assert.equal(kandidat.status, "ERSTER_KANDIDAT_RATIFIZIERT_NO_WRITE");
  assert.equal(kandidat.publicFunction, "buy_with_gold");
  assert.equal(kandidat.menge, 1);
  assert.equal(kandidat.route, "GOLD_ONLY");
  assert.equal(kandidat.actionContractId, "AL-ACTION-BUY-WITH-GOLD");
  assert.equal(kandidat.recoveryContractId, "AL-RECOVERY-BUY-WITH-GOLD");
  assert.equal(kandidat.verifierId, "AL-VERIFIER-BUY-WITH-GOLD");
  assert.equal(kandidat.authorityGrenze.produktiveCapabilityInDiesemSchritt, false);
  assert.equal(kandidat.authorityGrenze.authorityInDiesemSchritt, false);
  assert.equal(kandidat.authorityGrenze.adapterInDiesemSchritt, false);
  assert.equal(kandidat.authorityGrenze.liveRunnerInDiesemSchritt, false);
  assert.equal(kandidat.authorityGrenze.gameplayWritesInDiesemSchritt, 0);
});

test("Kandidat stimmt mit Action/Recovery/Verifier-Vertraegen ueberein", () => {
  const kandidat = lies(
    "grundlage/vertraege/runtime/market-buy-gold-production-candidate.json",
  );
  const actions = lies("wissensbasis/vertraege/action-contracts.json").contracts;
  const recovery = lies("wissensbasis/vertraege/recovery-contracts.json").actions;
  const verifier = lies("grundlage/vertraege/r9/verifier-katalog.json").verifier;
  const action = actions.find(x => x.id === kandidat.actionContractId);
  const rec = recovery.find(x => x.id === kandidat.recoveryContractId);
  const ver = verifier.find(x => x.id === kandidat.verifierId);
  assert.ok(action);
  assert.ok(rec);
  assert.ok(ver);
  assert.equal(action.publicFunction, "buy_with_gold");
  assert.equal(action.client.transportEvent, "buy");
  assert.equal(action.client.correlationType, "FIFO_DEFERRED");
  assert.equal(action.client.correlationChannel, "buy");
  assert.equal(action.idempotency, "NON_IDEMPOTENT");
  assert.equal(action.unknownOutcomePolicy, "RECONCILE_NO_BLIND_RETRY");
  assert.equal(rec.retryPolicy.sameIntentAfterPossibleSend, "NEVER");
  assert.equal(ver.unknownOutcomePolicy, "RECONCILE_NO_BLIND_RETRY");
});

test("Readiness verlangt Merchant, Idle, Vendor, Capacity, Budget, Gold und frische Evidence", () => {
  const bereit = pruefeMarketBuyGoldBereitschaft({
    schemaVersion: 1,
    ctype: "merchant",
    lebt: true,
    idle: true,
    warteschlangeLeer: true,
    alternativeRuntimeAktiv: false,
    offeneKaufTransaktion: false,
    evidenceFrisch: true,
    vendorErreichbar: true,
    inventoryCapacityOk: true,
    goldBudgetFreigegeben: true,
    itemDefinitionGoldKaufbar: true,
    bindung: bindung(),
  });
  assert.equal(bereit.status, "BEREIT");
  assert.deepEqual(bereit.gruende, []);

  const blockiert = pruefeMarketBuyGoldBereitschaft({
    schemaVersion: 1,
    ctype: "mage",
    lebt: false,
    idle: false,
    warteschlangeLeer: false,
    alternativeRuntimeAktiv: true,
    offeneKaufTransaktion: true,
    evidenceFrisch: false,
    vendorErreichbar: false,
    inventoryCapacityOk: false,
    goldBudgetFreigegeben: false,
    itemDefinitionGoldKaufbar: false,
    bindung: bindung({ characterGold: 0 }),
  });
  assert.equal(blockiert.status, "BLOCKIERT");
  for (const grund of [
    "MARKET_BUY_GOLD_NUR_MERCHANT",
    "MARKET_BUY_GOLD_CHARACTER_NICHT_BEREIT",
    "MARKET_BUY_GOLD_CHARACTER_BUSY",
    "MARKET_BUY_GOLD_ALTERNATIVE_RUNTIME_AKTIV",
    "MARKET_BUY_GOLD_OFFENE_TRANSAKTION",
    "MARKET_BUY_GOLD_EVIDENCE_STALE",
    "MARKET_BUY_GOLD_VENDOR_NICHT_ERREICHBAR",
    "MARKET_BUY_GOLD_INVENTORY_CAPACITY",
    "MARKET_BUY_GOLD_BUDGET_BLOCKIERT",
    "MARKET_BUY_GOLD_ITEM_NICHT_GOLD_KAUFBAR",
    "MARKET_BUY_GOLD_GOLD_ZU_NIEDRIG",
  ]) assert.ok(blockiert.gruende.includes(grund), grund);
});

test("Settlement bestaetigt nur gemeinsames exaktes Gold- und +1-Item-Delta", () => {
  const out = pruefeMarketBuyGoldSettlement(
    bindung(),
    bindung({
      beobachtetAmMs: 1001,
      characterGold: 980,
      itemGesamtmenge: 5,
      inventoryFingerprint: "d".repeat(64),
    }),
  );
  assert.equal(out.status, "BESTAETIGT");
  assert.equal(out.goldDelta, -20);
  assert.equal(out.itemMengenDelta, 1);
  assert.equal(out.neuerInventoryFingerprint, true);
  assert.equal(out.sameIntentErneutSenden, false);
});

test("Nur Goldverlust oder nur Itemzuwachs ist DRIFT und niemals Commit", () => {
  const onlyGold = pruefeMarketBuyGoldSettlement(
    bindung(),
    bindung({
      beobachtetAmMs: 1001,
      characterGold: 980,
      inventoryFingerprint: "d".repeat(64),
    }),
  );
  assert.equal(onlyGold.status, "DRIFT");

  const onlyItem = pruefeMarketBuyGoldSettlement(
    bindung(),
    bindung({
      beobachtetAmMs: 1001,
      itemGesamtmenge: 5,
      inventoryFingerprint: "d".repeat(64),
    }),
  );
  assert.equal(onlyItem.status, "DRIFT");
});

test("Unveraenderter Prestate bleibt OFFEN; exaktes Delta ohne neuen Fingerprint ebenfalls", () => {
  const offen = pruefeMarketBuyGoldSettlement(
    bindung(),
    bindung({ beobachtetAmMs: 1001 }),
  );
  assert.equal(offen.status, "OFFEN");

  const fp = pruefeMarketBuyGoldSettlement(
    bindung(),
    bindung({
      beobachtetAmMs: 1001,
      characterGold: 980,
      itemGesamtmenge: 5,
    }),
  );
  assert.equal(fp.status, "OFFEN");
  assert.equal(fp.grund, "MARKET_BUY_GOLD_FINGERPRINT_NOCH_NICHT_NEU");
});

test("Session, Server, Vendor, Itemdefinition, Preis oder Zeitdrift blockiert Settlement", () => {
  for (const override of [
    { sessionId: "session-2" },
    { serverKennung: "II" },
    { vendorId: "vendor-2" },
    { itemDefinitionFingerprint: "e".repeat(64) },
    { vendorFingerprint: "f".repeat(64) },
    { einzelpreisGold: 21, erwarteteKostenGold: 21 },
  ]) {
    const out = pruefeMarketBuyGoldSettlement(
      bindung(),
      bindung({
        beobachtetAmMs: 1001,
        characterGold: 980,
        itemGesamtmenge: 5,
        inventoryFingerprint: "d".repeat(64),
        ...override,
      }),
    );
    assert.equal(out.status, "DRIFT");
    assert.equal(out.grund, "MARKET_BUY_GOLD_BINDUNG_DRIFT");
  }
  const stale = pruefeMarketBuyGoldSettlement(
    bindung(),
    bindung({
      characterGold: 980,
      itemGesamtmenge: 5,
      inventoryFingerprint: "d".repeat(64),
    }),
  );
  assert.equal(stale.status, "DRIFT");
});

test("Settlement-Core enthaelt keinen Gameplay-Send und Produktionskomposition keine Marketmutation", () => {
  const core = fs.readFileSync(
    "grundlage/quelle/merchant/market-buy-gold-settlement.ts",
    "utf8",
  );
  const composition = fs.readFileSync(
    "grundlage/quelle/runtime/produktions-komposition.ts",
    "utf8",
  );
  assert.equal(core.includes("buy_with_gold("), false);
  assert.equal(core.includes(".emit("), false);
  assert.equal(composition.includes("merchant.markt.npc_kauf_gold"), false);
  assert.equal(composition.includes("buy_with_gold("), false);
  assert.ok(core.includes("gameplayAutoritaet: false"));
  assert.ok(core.includes("rawWriteAutoritaet: false"));
});
