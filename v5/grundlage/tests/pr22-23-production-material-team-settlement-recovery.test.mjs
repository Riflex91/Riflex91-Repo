import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  MerchantLogistikLedger,
  PersistenterProduktionsMaterialTeamBatchController,
  planeProductionMaterialTeam,
  planeProductionMaterialTeamHandoff,
} from "../../erzeugt/index.js";

class MemorySpeicher {
  constructor() {
    this.map = new Map();
    this.writes = [];
  }
  async schreibe(anfrage) {
    this.map.set(anfrage.relativerPfad, anfrage.inhalt);
    this.writes.push({ ...anfrage });
  }
  async lies(pfad) {
    return this.map.get(pfad);
  }
}

const merchant = Object.freeze({
  schemaVersion: 1,
  accountId: "account-1",
  characterId: "merchant",
  sessionId: "merchant-session",
  serverRegion: "EU",
  serverIdentifier: "I",
  rosterEpoche: 7,
  rosterFingerprint: "roster-fp",
});

const ranger = Object.freeze({
  schemaVersion: 1,
  accountId: "account-1",
  characterId: "ranger",
  sessionId: "ranger-session",
  serverRegion: "EU",
  serverIdentifier: "I",
  rosterEpoche: 7,
  rosterFingerprint: "roster-fp",
});

const mage = Object.freeze({
  ...ranger,
  characterId: "mage",
  sessionId: "mage-session",
});

function ziel() {
  return {
    schemaVersion: 1,
    objectiveId: "prod-1:material:farm:1",
    produktionsId: "prod-1",
    ablaufId: "workflow-1",
    farmNodeId: "farm:1",
    farmer: ranger,
    sourceId: "farm-iron-bee",
    monsterTyp: "bee",
    mapName: "main",
    spawnFingerprint: "spawn-bee-main-fp",
    name: "iron",
    level: 0,
    menge: 10,
    gueltigBisMs: 2_000,
    farmStopBeiMaterialBereit: true,
    handoffNachMaterialBereit: true,
    pr22KoordinationErforderlich: true,
    pr23FarmerAktionenErforderlich: true,
    pr20_9CraftRatificationCredit: false,
    planningOnly: true,
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  };
}

function worker(farmer) {
  return {
    schemaVersion: 1,
    farmer,
    beobachtetAmMs: 100,
    gueltigBisMs: 1_500,
    freshnessFingerprint: "fresh-" + farmer.characterId,
    lifecycleAktiv: true,
    safetyBereit: true,
    movementVorbereitet: true,
    combatVorbereitet: true,
    lootVorbereitet: true,
    unterstuetzteSourceIds: ["farm-iron-bee"],
  };
}

function inventory(farmer, menge) {
  return {
    schemaVersion: 1,
    farmer,
    name: "iron",
    level: 0,
    menge,
    beobachtetAmMs: 100,
    gueltigBisMs: 1_500,
    inventoryFingerprint: "inventory-" + farmer.characterId + "-" + menge,
  };
}

function source(farmer, menge, observed = 210, overrides = {}) {
  return {
    schemaVersion: 1,
    quelle: farmer,
    beobachtetAmMs: observed,
    gueltigBisMs: 1_500,
    freshnessFingerprint: "source-fresh-" + farmer.characterId,
    inventoryFingerprint: "inventory-" + farmer.characterId + "-" + menge,
    posten: [{
      physischeKennung: "slot:7",
      name: "iron",
      level: 0,
      menge,
      itemFingerprint: "item-" + farmer.characterId + "-slot-7",
    }],
    ...overrides,
  };
}

function rendezvous(observed = 220) {
  return {
    schemaVersion: 1,
    characterId: "merchant",
    sessionId: "merchant-session",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 7,
    beobachtetAmMs: observed,
    distanz: 20,
    freshnessFingerprint: "merchant-rendezvous-" + observed,
  };
}

function batch() {
  const team = planeProductionMaterialTeam({
    schemaVersion: 1,
    ziel: ziel(),
    farmer: [worker(ranger), worker(mage)],
    inventar: [inventory(ranger, 4), inventory(mage, 6)],
    maximaleFarmer: 3,
    maximalesEvidenceAlterMs: 1_000,
  }, 200);
  assert.equal(team.status, "TEAM_MATERIAL_READY_FOR_HANDOFF_NO_WRITE");
  const result = planeProductionMaterialTeamHandoff({
    schemaVersion: 1,
    team,
    merchant,
    quellen: [source(ranger, 4), source(mage, 6)],
    maximalesEvidenceAlterMs: 1_000,
  }, 220);
  assert.equal(result.status, "MULTI_SOURCE_COLLECTION_BATCH_BEREIT_NO_WRITE");
  return result;
}

function settle(planung, baselineFp, beforeMenge, afterMenge, fp, observed) {
  const ledger = new MerchantLogistikLedger();
  ledger.plane(planung.logistik.plan);
  ledger.beginneRendezvous(planung.logistik.plan.logistikId);
  ledger.bestaetigeRendezvous(
    planung.logistik.plan.logistikId,
    rendezvous(planung.logistik.plan.erstelltAmMs),
  );
  ledger.beginneTransfer(planung.logistik.plan.logistikId);
  const evidence = {
    schemaVersion: 1,
    characterId: "merchant",
    sessionId: "merchant-session",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 7,
    beobachtetAmMs: observed,
    inventoryFingerprint: fp,
    baselineInventoryFingerprint: baselineFp,
    mengen: [{ name: "iron", level: 0, menge: afterMenge }],
    settlementFingerprint: "settlement-" + fp,
  };
  const sicht = ledger.verifiziereSettlement(
    planung.logistik.plan.logistikId,
    evidence,
  );
  assert.equal(afterMenge - beforeMenge, planung.transfer.gesamtMenge);
  return { sicht, evidence };
}

test("CAP-022 Batch settlet Multi-Source-COLLECTION strikt seriell mit frischer Baseline", async () => {
  const speicher = new MemorySpeicher();
  const controller = new PersistenterProduktionsMaterialTeamBatchController(
    speicher,
  );
  const b = batch();
  const start = await controller.beginne(b, "merchant-before", 0, 220);
  assert.equal(start.zustand, "BATCH_BEREIT");
  assert.equal(start.nextSequence, 1);
  assert.equal(start.finalCraftRescanAllowed, false);

  const first = await controller.planeNaechstenTransfer(
    b,
    source(ranger, 4, 225),
    rendezvous(225),
    230,
    1_000,
    100,
  );
  assert.equal(first.transfer.sequence, 1);
  assert.equal(first.logistik.plan.baselineEmpfaengerInventoryFingerprint, "merchant-before");
  assert.equal(first.logistik.plan.posten[0].baselineEmpfaengerMenge, 0);
  assert.equal(first.batch.zustand, "TRANSFER_AKTIV");
  assert.equal(first.previousTransferSettlementVerified, true);

  await assert.rejects(
    () => controller.planeNaechstenTransfer(
      b,
      source(mage, 6, 235),
      rendezvous(235),
      240,
      1_000,
      100,
    ),
    /CAP022_TEAM_BATCH_TRANSFER_ZUSTAND_UNGUELTIG/,
  );

  const firstSettled = settle(
    first,
    "merchant-before",
    0,
    4,
    "merchant-after-ranger",
    250,
  );
  const afterFirst = await controller.bestaetigeSettlement(
    b,
    firstSettled.sicht,
    firstSettled.evidence,
    250,
  );
  assert.equal(afterFirst.zustand, "BATCH_BEREIT");
  assert.equal(afterFirst.nextSequence, 2);
  assert.equal(afterFirst.merchantInventoryFingerprint, "merchant-after-ranger");
  assert.equal(afterFirst.merchantMenge, 4);
  assert.equal(afterFirst.finalCraftRescanAllowed, false);

  const second = await controller.planeNaechstenTransfer(
    b,
    source(mage, 6, 255),
    rendezvous(255),
    260,
    1_000,
    100,
  );
  assert.equal(second.transfer.sequence, 2);
  assert.equal(second.previousTransferSettlementVerified, true);
  assert.equal(
    second.logistik.plan.baselineEmpfaengerInventoryFingerprint,
    "merchant-after-ranger",
  );
  assert.ok(second.logistik.plan.posten.every(
    x => x.baselineEmpfaengerMenge === 4,
  ));

  const secondSettled = settle(
    second,
    "merchant-after-ranger",
    4,
    10,
    "merchant-after-all",
    280,
  );
  const done = await controller.bestaetigeSettlement(
    b,
    secondSettled.sicht,
    secondSettled.evidence,
    280,
  );
  assert.equal(done.zustand, "ALLE_SETTLED");
  assert.deepEqual(done.settledTransferIds, b.transfers.map(x => x.transferId));
  assert.equal(done.merchantInventoryFingerprint, "merchant-after-all");
  assert.equal(done.merchantMenge, 10);
  assert.equal(done.finalCraftRescanAllowed, true);
  assert.equal(done.sameTransferRetryAllowed, false);
  assert.equal(done.transferAuthority, false);
  assert.equal(done.gameplayAuthority, false);
  assert.equal(done.rawWriteAuthority, false);
  assert.equal(done.normalRuntimeAllowed, false);
  assert.ok(speicher.writes.every(x => x.kritisch === true));
});

test("CAP-022 Batch Restart bei BATCH_BEREIT verlangt exakte Baseline-Reconciliation", async () => {
  const speicher = new MemorySpeicher();
  const b = batch();
  const controller = new PersistenterProduktionsMaterialTeamBatchController(speicher);
  await controller.beginne(b, "merchant-before", 0, 220);

  const neu = new PersistenterProduktionsMaterialTeamBatchController(speicher);
  const loaded = await neu.lade(230);
  assert.equal(loaded.recoveryPending, true);
  assert.equal(neu.finde().zustand, "RECOVERY_PENDING");
  assert.equal(neu.finde().recoveryVorZustand, "BATCH_BEREIT");

  await assert.rejects(
    () => neu.reconciliereBereitenBatchNachRestart(
      b,
      "merchant-drift",
      0,
      240,
    ),
    /CAP022_TEAM_BATCH_RECOVERY_BASELINE_DRIFT/,
  );

  const reconciled = await neu.reconciliereBereitenBatchNachRestart(
    b,
    "merchant-before",
    0,
    240,
  );
  assert.equal(reconciled.zustand, "BATCH_BEREIT");
  assert.equal(reconciled.sameTransferRetryAllowed, false);
});

test("CAP-022 Batch Restart waehrend aktivem Transfer erlaubt keinen Blind-Retry, aber Settlement-Recovery", async () => {
  const speicher = new MemorySpeicher();
  const b = batch();
  const controller = new PersistenterProduktionsMaterialTeamBatchController(speicher);
  await controller.beginne(b, "merchant-before", 0, 220);
  const first = await controller.planeNaechstenTransfer(
    b,
    source(ranger, 4, 225),
    rendezvous(225),
    230,
    1_000,
    100,
  );

  const neu = new PersistenterProduktionsMaterialTeamBatchController(speicher);
  const loaded = await neu.lade(240);
  assert.equal(loaded.recoveryPending, true);
  assert.equal(neu.finde().recoveryVorZustand, "TRANSFER_AKTIV");
  assert.equal(neu.finde().sameTransferRetryAllowed, false);

  await assert.rejects(
    () => neu.planeNaechstenTransfer(
      b,
      source(ranger, 4, 245),
      rendezvous(245),
      250,
      1_000,
      100,
    ),
    /CAP022_TEAM_BATCH_TRANSFER_ZUSTAND_UNGUELTIG/,
  );

  const firstSettled = settle(
    first,
    "merchant-before",
    0,
    4,
    "merchant-after-recovery",
    255,
  );
  const recovered = await neu.bestaetigeSettlement(
    b,
    firstSettled.sicht,
    firstSettled.evidence,
    255,
  );
  assert.equal(recovered.zustand, "BATCH_BEREIT");
  assert.equal(recovered.nextSequence, 2);
  assert.equal(recovered.finalCraftRescanAllowed, false);
});

test("CAP-022 Batch blockiert Source-Pin-Drift vor Leg-Aktivierung", async () => {
  const speicher = new MemorySpeicher();
  const b = batch();
  const controller = new PersistenterProduktionsMaterialTeamBatchController(speicher);
  await controller.beginne(b, "merchant-before", 0, 220);

  await assert.rejects(
    () => controller.planeNaechstenTransfer(
      b,
      source(ranger, 4, 225, {
        inventoryFingerprint: "inventory-ranger-drift",
      }),
      rendezvous(225),
      230,
      1_000,
      100,
    ),
    /CAP022_TEAM_BATCH_SOURCE_DRIFT/,
  );
  assert.equal(controller.finde().zustand, "BATCH_BEREIT");
  assert.equal(controller.finde().transferAuthority, false);
});

test("CAP-022 Batch kann fail-closed terminal beendet werden", async () => {
  const speicher = new MemorySpeicher();
  const b = batch();
  const controller = new PersistenterProduktionsMaterialTeamBatchController(speicher);
  await controller.beginne(b, "merchant-before", 0, 220);
  const failed = await controller.scheitereSicher(b, 230);
  assert.equal(failed.zustand, "FAILED_SAFE");
  assert.equal(failed.finalCraftRescanAllowed, false);
  assert.equal(failed.transferAuthority, false);
});

test("CAP-022 Batch-Recovery besitzt keinen direkten Gameplay-Write-Bypass", () => {
  const sourceText = fs.readFileSync(
    "grundlage/quelle/koordination/production-material-team-settlement-recovery.ts",
    "utf8",
  );
  for (const marker of [
    "socket.emit(",
    ".socket.emit(",
    "send_item(",
    "send_cm(",
    "smart_move(",
    "attack(",
    "use_skill(",
    "loot(",
    "craft(",
    "exchange(",
    "upgrade(",
    "compound(",
  ]) {
    assert.equal(sourceText.includes(marker), false, marker);
  }
});
