import test from "node:test";
import assert from "node:assert/strict";

import {
  PersistenterMerchantLogistikController,
  planeMerchantLogistik,
} from "../../erzeugt/index.js";

class MemorySpeicher {
  constructor() {
    this.map = new Map();
  }

  async schreibe(anfrage) {
    this.map.set(anfrage.relativerPfad, anfrage.inhalt);
  }

  async lies(pfad) {
    return this.map.get(pfad);
  }
}

const quelle = Object.freeze({
  schemaVersion: 1,
  accountId: "account-1",
  characterId: "farmer",
  sessionId: "farmer-session-1",
  serverRegion: "EU",
  serverIdentifier: "I",
  rosterEpoche: 11,
  rosterFingerprint: "roster-fp-11",
});

const ziel = Object.freeze({
  schemaVersion: 1,
  accountId: "account-1",
  characterId: "merchant",
  sessionId: "merchant-session-1",
  serverRegion: "EU",
  serverIdentifier: "I",
  rosterEpoche: 11,
  rosterFingerprint: "roster-fp-11",
});

function quellEvidence(overrides = {}) {
  return {
    schemaVersion: 1,
    quelle,
    beobachtetAmMs: 100,
    gueltigBisMs: 1_000,
    freshnessFingerprint: "source-fresh-1",
    inventoryFingerprint: "source-inventory-1",
    posten: [
      {
        physischeKennung: "farmer:7:iron-fp",
        name: "iron",
        level: 0,
        menge: 3,
        itemFingerprint: "iron-item-fp",
      },
    ],
    ...overrides,
  };
}

function zielEvidence(overrides = {}) {
  return {
    schemaVersion: 1,
    characterId: "merchant",
    sessionId: "merchant-session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 11,
    beobachtetAmMs: 100,
    distanz: 200,
    freshnessFingerprint: "target-fresh-1",
    ...overrides,
  };
}

function planAnfrage(overrides = {}) {
  return {
    schemaVersion: 1,
    logistikId: "log-38-1",
    art: "COLLECTION",
    ownerCharacterId: "merchant",
    quelle,
    empfaenger: ziel,
    quelleEvidence: quellEvidence(),
    zielEvidence: zielEvidence(),
    posten: [
      {
        physischeKennung: "farmer:7:iron-fp",
        name: "iron",
        level: 0,
        menge: 2,
        baselineEmpfaengerMenge: 1,
        itemFingerprint: "iron-item-fp",
      },
    ],
    baselineEmpfaengerInventoryFingerprint: "merchant-inventory-before",
    erstelltAmMs: 100,
    gueltigBisMs: 1_000,
    maximalTransferDistanz: 380,
    maximalesEvidenceAlterMs: 500,
    ...overrides,
  };
}

function frischesRendezvous(overrides = {}) {
  return zielEvidence({
    beobachtetAmMs: 200,
    distanz: 180,
    ...overrides,
  });
}

function settlement(overrides = {}) {
  return {
    schemaVersion: 1,
    characterId: "merchant",
    sessionId: "merchant-session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 11,
    beobachtetAmMs: 260,
    inventoryFingerprint: "merchant-inventory-after",
    baselineInventoryFingerprint: "merchant-inventory-before",
    mengen: [{ name: "iron", level: 0, menge: 3 }],
    settlementFingerprint: "settlement-fp",
    ...overrides,
  };
}

test("CAP-038 plant source-gepinnt und bindet Transfer nur als Planning Evidence", () => {
  const ergebnis = planeMerchantLogistik(planAnfrage(), 150);

  assert.equal(ergebnis.plan.quelleCharacterId, "farmer");
  assert.equal(ergebnis.plan.empfaenger.characterId, "merchant");
  assert.equal(ergebnis.quellenPin.inventoryFingerprint, "source-inventory-1");
  assert.equal(ergebnis.quellenPin.posten[0].physischeKennung, "farmer:7:iron-fp");
  assert.equal(ergebnis.transferBindung.actionContractId, "AL-ACTION-SEND-ITEM");
  assert.equal(ergebnis.transferBindung.recoveryContractId, "AL-RECOVERY-SEND-ITEM");
  assert.equal(ergebnis.transferBindung.verifierId, "AL-VERIFIER-SEND-ITEM");
  assert.equal(ergebnis.quellenPin.planningEvidence, true);
  assert.equal(ergebnis.quellenPin.executionAuthority, false);
  assert.equal(ergebnis.ausfuehrungsAutoritaet, false);
  assert.equal(ergebnis.gameplayAutoritaet, false);
  assert.equal(ergebnis.rawWriteAutoritaet, false);
});

test("CAP-038 blockiert stale Source und physischen Source-Mismatch", () => {
  assert.throws(
    () => planeMerchantLogistik(planAnfrage({
      quelleEvidence: quellEvidence({
        beobachtetAmMs: 0,
        gueltigBisMs: 100,
      }),
    }), 150),
    /LOGISTIK_PLAN_QUELLE_NICHT_FRISCH/,
  );

  assert.throws(
    () => planeMerchantLogistik(planAnfrage({
      posten: [
        {
          physischeKennung: "farmer:7:iron-fp",
          name: "iron",
          level: 0,
          menge: 2,
          baselineEmpfaengerMenge: 1,
          itemFingerprint: "anderer-item-fp",
        },
      ],
    }), 150),
    /LOGISTIK_PLAN_QUELLE_POSTEN_MISMATCH/,
  );
});

test("CAP-038 prueft Source unmittelbar vor durable Transfer-Intent erneut", async () => {
  const speicher = new MemorySpeicher();
  const controller = new PersistenterMerchantLogistikController(speicher);
  const plan = planeMerchantLogistik(planAnfrage(), 150);

  await controller.uebernehmePlan(plan, 150);
  await controller.beginneRendezvous("log-38-1", 180);
  await controller.bestaetigeRendezvous(
    "log-38-1",
    frischesRendezvous(),
    200,
  );

  await assert.rejects(
    () => controller.bereiteTransferVor(
      "log-38-1",
      quellEvidence({
        inventoryFingerprint: "source-inventory-drift",
      }),
      210,
    ),
    /LOGISTIK_QUELLEN_PIN_DRIFT/,
  );

  const vorbereitet = await controller.bereiteTransferVor(
    "log-38-1",
    quellEvidence({ beobachtetAmMs: 205 }),
    210,
  );
  assert.equal(vorbereitet.sicht.zustand, "TRANSFER_AUSSTEHEND");
  assert.equal(vorbereitet.durableIntentPersistiert, true);
  assert.equal(vorbereitet.sameTransferErneutSenden, false);
  assert.equal(vorbereitet.gameplayAutoritaet, false);
  assert.equal(vorbereitet.rawWriteAutoritaet, false);
});

test("CAP-038 Restart nach moeglichem Transfer erlaubt keinen Blind-Retry", async () => {
  const speicher = new MemorySpeicher();
  const controller = new PersistenterMerchantLogistikController(speicher);
  const plan = planeMerchantLogistik(planAnfrage(), 150);

  await controller.uebernehmePlan(plan, 150);
  await controller.beginneRendezvous("log-38-1", 180);
  await controller.bestaetigeRendezvous(
    "log-38-1",
    frischesRendezvous(),
    200,
  );
  await controller.bereiteTransferVor(
    "log-38-1",
    quellEvidence({ beobachtetAmMs: 205 }),
    210,
  );

  const neu = new PersistenterMerchantLogistikController(speicher);
  const geladen = await neu.lade(240);
  assert.equal(geladen.geladen, true);
  assert.equal(geladen.recoveryPending, 1);

  const recovery = neu.finde("log-38-1");
  assert.equal(recovery.zustand, "RECOVERY_PENDING");
  assert.equal(recovery.recoveryVorZustand, "TRANSFER_AUSSTEHEND");
  assert.equal(recovery.sameTransferErneutSenden, false);

  await assert.rejects(
    () => neu.bestaetigeRendezvous(
      "log-38-1",
      frischesRendezvous({ beobachtetAmMs: 245 }),
      245,
    ),
    /LOGISTIK_RENDEZVOUS_EVIDENCE_ZUSTAND_UNGUELTIG/,
  );

  await assert.rejects(
    () => neu.bereiteTransferVor(
      "log-38-1",
      quellEvidence({ beobachtetAmMs: 245 }),
      245,
    ),
    /LOGISTIK_TRANSFER_ZUSTAND_UNGUELTIG/,
  );

  const settled = await neu.verifiziereSettlement(
    "log-38-1",
    settlement(),
    260,
  );
  assert.equal(settled.zustand, "SETTLED");
  assert.equal(settled.recoveryVorZustand, null);
});

test("CAP-038 Restart vor Transfer darf nur den sicheren Vor-Send-Pfad fortsetzen", async () => {
  const speicher = new MemorySpeicher();
  const controller = new PersistenterMerchantLogistikController(speicher);
  const plan = planeMerchantLogistik(planAnfrage(), 150);

  await controller.uebernehmePlan(plan, 150);
  await controller.beginneRendezvous("log-38-1", 180);

  const neu = new PersistenterMerchantLogistikController(speicher);
  await neu.lade(190);
  assert.equal(neu.finde("log-38-1").recoveryVorZustand, "RENDEZVOUS_AUSSTEHEND");

  const bestaetigt = await neu.bestaetigeRendezvous(
    "log-38-1",
    frischesRendezvous(),
    200,
  );
  assert.equal(bestaetigt.zustand, "RENDEZVOUS_BESTAETIGT");

  const vorbereitet = await neu.bereiteTransferVor(
    "log-38-1",
    quellEvidence({ beobachtetAmMs: 205 }),
    210,
  );
  assert.equal(vorbereitet.sicht.zustand, "TRANSFER_AUSSTEHEND");
});

test("CAP-038 FAILED_SAFE ist persistent und terminal", async () => {
  const speicher = new MemorySpeicher();
  const controller = new PersistenterMerchantLogistikController(speicher);
  const plan = planeMerchantLogistik(planAnfrage(), 150);

  await controller.uebernehmePlan(plan, 150);
  assert.equal(
    (await controller.scheitereSicher("log-38-1", 160)).zustand,
    "FAILED_SAFE",
  );

  const neu = new PersistenterMerchantLogistikController(speicher);
  const geladen = await neu.lade(200);
  assert.equal(geladen.failedSafe, 1);
  assert.equal(neu.finde("log-38-1").zustand, "FAILED_SAFE");

  await assert.rejects(
    () => neu.scheitereSicher("log-38-1", 210),
    /LOGISTIK_FAILED_SAFE_ZUSTAND_UNGUELTIG/,
  );
});


test("CAP-038 Settlement aggregiert mehrere physische Stacks desselben Items", async () => {
  const speicher = new MemorySpeicher();
  const controller = new PersistenterMerchantLogistikController(speicher);
  const quelleMulti = quellEvidence({
    inventoryFingerprint: "source-inventory-multi",
    posten: [
      {
        physischeKennung: "farmer:7:iron-a",
        name: "iron",
        level: 0,
        menge: 4,
        itemFingerprint: "iron-item-a",
      },
      {
        physischeKennung: "farmer:8:iron-b",
        name: "iron",
        level: 0,
        menge: 6,
        itemFingerprint: "iron-item-b",
      },
    ],
  });
  const plan = planeMerchantLogistik(planAnfrage({
    logistikId: "log-38-multi",
    quelleEvidence: quelleMulti,
    posten: [
      {
        physischeKennung: "farmer:7:iron-a",
        name: "iron",
        level: 0,
        menge: 4,
        baselineEmpfaengerMenge: 1,
        itemFingerprint: "iron-item-a",
      },
      {
        physischeKennung: "farmer:8:iron-b",
        name: "iron",
        level: 0,
        menge: 6,
        baselineEmpfaengerMenge: 1,
        itemFingerprint: "iron-item-b",
      },
    ],
  }), 150);

  await controller.uebernehmePlan(plan, 150);
  await controller.beginneRendezvous("log-38-multi", 180);
  await controller.bestaetigeRendezvous(
    "log-38-multi",
    frischesRendezvous(),
    200,
  );
  await controller.bereiteTransferVor(
    "log-38-multi",
    {
      ...quelleMulti,
      beobachtetAmMs: 205,
    },
    210,
  );

  await assert.rejects(
    () => controller.verifiziereSettlement(
      "log-38-multi",
      settlement({
        beobachtetAmMs: 260,
        inventoryFingerprint: "merchant-inventory-partial",
        mengen: [{ name: "iron", level: 0, menge: 7 }],
        settlementFingerprint: "settlement-partial",
      }),
      260,
    ),
    /LOGISTIK_SETTLEMENT_MENGE_FEHLT:iron/,
  );

  const settled = await controller.verifiziereSettlement(
    "log-38-multi",
    settlement({
      beobachtetAmMs: 270,
      inventoryFingerprint: "merchant-inventory-complete",
      mengen: [{ name: "iron", level: 0, menge: 11 }],
      settlementFingerprint: "settlement-complete",
    }),
    270,
  );
  assert.equal(settled.zustand, "SETTLED");
});
