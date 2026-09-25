import test from "node:test";
import assert from "node:assert/strict";

import {
  GearAllokationsLedger,
  MerchantLogistikLedger,
  berechneSupplyBedarf,
} from "../../erzeugt/index.js";

const ziel = {
  schemaVersion: 1,
  accountId: "account-1",
  characterId: "warrior",
  sessionId: "session-1",
  serverRegion: "EU",
  serverIdentifier: "I",
  rosterEpoche: 12,
  rosterFingerprint: "roster-fp",
};

function logistikPlan(overrides = {}) {
  return {
    schemaVersion: 1,
    logistikId: "log-1",
    art: "SUPPLY_DELIVERY",
    ownerCharacterId: "merchant",
    quelleCharacterId: "merchant",
    empfaenger: ziel,
    posten: [{
      physischeKennung: "merchant:1:pot-fp",
      name: "hpot1",
      level: 0,
      menge: 100,
      baselineEmpfaengerMenge: 50,
    }],
    erstelltAmMs: 100,
    gueltigBisMs: 1000,
    maximalTransferDistanz: 380,
    zielFreshnessFingerprint: "target-fresh",
    baselineEmpfaengerInventoryFingerprint: "inventory-before",
    ...overrides,
  };
}

test("Supply Policy vermeidet Micro-Restock und respektiert Merchant-Reserve", () => {
  const policy = {
    niedrigSchwelle: 120,
    zielMenge: 500,
    mindestBatch: 50,
    maximalBatch: 500,
    merchantReserve: 300,
  };
  assert.deepEqual(berechneSupplyBedarf(200, 1000, policy), {
    benoetigt: false,
    menge: 0,
    grund: "AUSREICHEND",
  });
  assert.deepEqual(berechneSupplyBedarf(100, 800, policy), {
    benoetigt: true,
    menge: 400,
    grund: "UNTER_SCHWELLE",
  });
  assert.deepEqual(berechneSupplyBedarf(100, 320, policy), {
    benoetigt: false,
    menge: 0,
    grund: "BATCH_ZU_KLEIN",
  });
});

test("Rendezvous verlangt frische identische Session Server und Roster-Epoche", () => {
  const ledger = new MerchantLogistikLedger();
  ledger.plane(logistikPlan());
  ledger.beginneRendezvous("log-1");
  assert.equal(ledger.bestaetigeRendezvous("log-1", {
    schemaVersion: 1,
    characterId: "warrior",
    sessionId: "session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 12,
    beobachtetAmMs: 200,
    distanz: 200,
    freshnessFingerprint: "target-fresh",
  }).zustand, "RENDEZVOUS_BESTAETIGT");
});

test("Rendezvous blockiert stale Ziel oder zu grosse Distanz", () => {
  const ledger = new MerchantLogistikLedger();
  ledger.plane(logistikPlan());
  ledger.beginneRendezvous("log-1");
  assert.throws(() => ledger.bestaetigeRendezvous("log-1", {
    schemaVersion: 1,
    characterId: "warrior",
    sessionId: "session-2",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 12,
    beobachtetAmMs: 200,
    distanz: 200,
    freshnessFingerprint: "target-fresh",
  }), /LOGISTIK_RENDEZVOUS_ZIEL_DRIFT/);

  const ledger2 = new MerchantLogistikLedger();
  ledger2.plane(logistikPlan({ logistikId: "log-2" }));
  ledger2.beginneRendezvous("log-2");
  assert.throws(() => ledger2.bestaetigeRendezvous("log-2", {
    schemaVersion: 1,
    characterId: "warrior",
    sessionId: "session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 12,
    beobachtetAmMs: 200,
    distanz: 381,
    freshnessFingerprint: "target-fresh",
  }), /LOGISTIK_RENDEZVOUS_NICHT_FRISCH_ODER_ZU_WEIT/);
});

test("Supply Delivery wird erst durch Recipient-Inventardifferenz settled", () => {
  const ledger = new MerchantLogistikLedger();
  ledger.plane(logistikPlan());
  ledger.beginneRendezvous("log-1");
  ledger.bestaetigeRendezvous("log-1", {
    schemaVersion: 1,
    characterId: "warrior",
    sessionId: "session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 12,
    beobachtetAmMs: 200,
    distanz: 200,
    freshnessFingerprint: "target-fresh",
  });
  ledger.beginneTransfer("log-1");
  assert.throws(() => ledger.verifiziereSettlement("log-1", {
    schemaVersion: 1,
    characterId: "warrior",
    sessionId: "session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 12,
    beobachtetAmMs: 300,
    inventoryFingerprint: "inventory-after",
    baselineInventoryFingerprint: "wrong-baseline",
    mengen: [{ name: "hpot1", level: 0, menge: 150 }],
    settlementFingerprint: "settle-fp",
  }), /LOGISTIK_SETTLEMENT_BASELINE_DRIFT/);

  assert.equal(ledger.verifiziereSettlement("log-1", {
    schemaVersion: 1,
    characterId: "warrior",
    sessionId: "session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 12,
    beobachtetAmMs: 300,
    inventoryFingerprint: "inventory-after",
    baselineInventoryFingerprint: "inventory-before",
    mengen: [{ name: "hpot1", level: 0, menge: 150 }],
    settlementFingerprint: "settle-fp",
  }).zustand, "SETTLED");
});



test("Recipient-Settlement aggregiert mehrere physische Stacks desselben Items", () => {
  const ledger = new MerchantLogistikLedger();
  ledger.plane(logistikPlan({
    posten: [
      {
        physischeKennung: "merchant:1:pot-a",
        name: "hpot1",
        level: 0,
        menge: 40,
        baselineEmpfaengerMenge: 50,
      },
      {
        physischeKennung: "merchant:2:pot-b",
        name: "hpot1",
        level: 0,
        menge: 60,
        baselineEmpfaengerMenge: 50,
      },
    ],
  }));
  ledger.beginneRendezvous("log-1");
  ledger.bestaetigeRendezvous("log-1", {
    schemaVersion: 1,
    characterId: "warrior",
    sessionId: "session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 12,
    beobachtetAmMs: 200,
    distanz: 200,
    freshnessFingerprint: "target-fresh",
  });
  ledger.beginneTransfer("log-1");

  assert.throws(() => ledger.verifiziereSettlement("log-1", {
    schemaVersion: 1,
    characterId: "warrior",
    sessionId: "session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 12,
    beobachtetAmMs: 300,
    inventoryFingerprint: "inventory-partial",
    baselineInventoryFingerprint: "inventory-before",
    mengen: [{ name: "hpot1", level: 0, menge: 110 }],
    settlementFingerprint: "settle-partial-fp",
  }), /LOGISTIK_SETTLEMENT_MENGE_FEHLT:hpot1/);

  assert.equal(ledger.verifiziereSettlement("log-1", {
    schemaVersion: 1,
    characterId: "warrior",
    sessionId: "session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 12,
    beobachtetAmMs: 310,
    inventoryFingerprint: "inventory-complete",
    baselineInventoryFingerprint: "inventory-before",
    mengen: [{ name: "hpot1", level: 0, menge: 150 }],
    settlementFingerprint: "settle-complete-fp",
  }).zustand, "SETTLED");
});

test("Recipient-Settlement blockiert widerspruechliche Baselines fuer dasselbe Item", () => {
  const ledger = new MerchantLogistikLedger();
  ledger.plane(logistikPlan({
    posten: [
      {
        physischeKennung: "merchant:1:pot-a",
        name: "hpot1",
        level: 0,
        menge: 40,
        baselineEmpfaengerMenge: 50,
      },
      {
        physischeKennung: "merchant:2:pot-b",
        name: "hpot1",
        level: 0,
        menge: 60,
        baselineEmpfaengerMenge: 55,
      },
    ],
  }));
  ledger.beginneRendezvous("log-1");
  ledger.bestaetigeRendezvous("log-1", {
    schemaVersion: 1,
    characterId: "warrior",
    sessionId: "session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 12,
    beobachtetAmMs: 200,
    distanz: 200,
    freshnessFingerprint: "target-fresh",
  });
  ledger.beginneTransfer("log-1");

  assert.throws(() => ledger.verifiziereSettlement("log-1", {
    schemaVersion: 1,
    characterId: "warrior",
    sessionId: "session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 12,
    beobachtetAmMs: 300,
    inventoryFingerprint: "inventory-after",
    baselineInventoryFingerprint: "inventory-before",
    mengen: [{ name: "hpot1", level: 0, menge: 155 }],
    settlementFingerprint: "settle-fp",
  }), /LOGISTIK_SETTLEMENT_PLAN_BASELINE_DRIFT:hpot1/);
});

test("Logistik-Restart erlaubt keinen blinden Transfer-Retry", () => {
  const alt = new MerchantLogistikLedger();
  alt.plane(logistikPlan());
  alt.beginneRendezvous("log-1");
  const neu = new MerchantLogistikLedger();
  neu.importiereNachRestart(alt.snapshot());
  const sicht = neu.finde("log-1");
  assert.equal(sicht.zustand, "RECOVERY_PENDING");
  assert.equal(sicht.sameTransferErneutSenden, false);
});

function gearZiel(id, kandidatKennung, prioritaet = "FARMER", score = 120) {
  return {
    schemaVersion: 1,
    gearZielId: id,
    recipient: ziel,
    slot: id === "g2" ? "ring2" : "ring1",
    prioritaet,
    aktuellerScore: 100,
    minimaleVerbesserung: 5,
    kandidat: {
      physischeKennung: kandidatKennung,
      name: "ringofluck",
      level: 1,
      score,
      beobachtungsFingerprint: "gear-fp-" + id,
    },
    erstelltAmMs: 100,
    gueltigBisMs: 1000,
  };
}

test("Gear Allocation reserviert einen physischen Kandidaten hoechstens einmal", () => {
  const ledger = new GearAllokationsLedger();
  ledger.reserviere(gearZiel("g1", "merchant:5:item-a"));
  assert.throws(
    () => ledger.reserviere(gearZiel("g2", "merchant:5:item-a")),
    /GEAR_KANDIDAT_BEREITS_RESERVIERT/,
  );
});

test("Gear Allocation priorisiert Farmer vor Merchant-Self ohne ungueltige Kandidaten", () => {
  const ledger = new GearAllokationsLedger();
  ledger.reserviere(gearZiel("g1", "merchant:5:item-a", "MERCHANT_SELF", 200));
  ledger.reserviere(gearZiel("g2", "merchant:6:item-b", "FARMER", 120));
  assert.equal(ledger.priorisierteOffene(200)[0].ziel.gearZielId, "g2");
  assert.throws(
    () => ledger.reserviere(gearZiel("g3", "merchant:7:item-c", "FARMER", 103)),
    /GEAR_ZIEL_UNGUELTIG/,
  );
});
