import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  PersistenterProduktionsMaterialLifecycle,
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

function ziel() {
  return {
    schemaVersion: 1,
    objectiveId: "prod-1:material:farm:1",
    produktionsId: "prod-1",
    ablaufId: "workflow-1",
    farmNodeId: "farm:1",
    farmer: {
      schemaVersion: 1,
      accountId: "account-1",
      characterId: "ranger",
      sessionId: "ranger-session",
      serverRegion: "EU",
      serverIdentifier: "I",
      rosterEpoche: 7,
      rosterFingerprint: "roster-fp",
    },
    sourceId: "farm-iron-bee",
    monsterTyp: "bee",
    mapName: "main",
    spawnFingerprint: "spawn-bee-main-fp",
    name: "iron",
    level: 0,
    menge: 2,
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

function fortschritt() {
  return {
    schemaVersion: 1,
    objectiveId: "prod-1:material:farm:1",
    status: "MATERIAL_READY_FOR_HANDOFF",
    beobachteteMenge: 2,
    restMenge: 0,
    beobachtetAmMs: 200,
    gueltigBisMs: 2_000,
    inventoryFingerprint: "farmer-inventory-ready-fp",
    farmStopErforderlich: true,
    handoffErforderlich: true,
    pr22KoordinationErforderlich: true,
    pr23FarmerAktionenErforderlich: true,
    pr20_9CraftRatificationCredit: false,
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
  };
}

function handoff() {
  return {
    schemaVersion: 1,
    status: "COLLECTION_PLAN_BEREIT_NO_WRITE",
    objectiveId: "prod-1:material:farm:1",
    logistik: {
      plan: {
        logistikId: "prod-1:material:farm:1:collection",
      },
      quellenPin: {
        inventoryFingerprint: "farmer-inventory-handoff-fp",
      },
    },
    farmStopVerified: true,
    materialReadyVerified: true,
    singlePhysicalStackPinned: true,
    pr22CoordinationRequired: true,
    pr23FarmStopEvidenceRequired: true,
    productiveTransferAuthorityRequired: true,
    settledFutureHandoffRequiresFreshCraftRescan: true,
    handoffPlanCountsAsNaturalCurrentInventoryCandidate: false,
    foundationCountsAsCraftRatification: false,
    planningOnly: true,
    ausfuehrungsAutoritaet: false,
    gameplayAutoritaet: false,
    rawWriteAutoritaet: false,
    normalRuntimeAllowed: false,
  };
}

function rescan(status = "CRAFT_RESCAN_KANDIDAT_BEREIT_NO_WRITE") {
  return {
    schemaVersion: 1,
    status,
    blocker: status === "CRAFT_RESCAN_BLOCKIERT"
      ? ["PR20_9_CRAFT_INPUT_FEHLT_ODER_SPLIT_STACK_ERFORDERLICH:iron@0"]
      : [],
    objectiveId: "prod-1:material:farm:1",
    logistikId: "prod-1:material:farm:1:collection",
    settlementFingerprint: "collection-settlement-fp",
    merchantInventoryFingerprint: "merchant-after-fp",
    settledHandoffVerified: true,
    postSettlementInventoryVerified: true,
    handedMaterialMatchesRecipeInput: true,
    preflight: {},
    candidateObserved: status === "CRAFT_RESCAN_KANDIDAT_BEREIT_NO_WRITE",
    rescanTriggerEligible: true,
    currentPr20_9RatificationCredit: false,
    foundationCountsAsCraftRatification: false,
    productiveCraftAuthorityOpened: false,
    broadGraphExecutionAuthority: false,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    craftAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  };
}

test("CAP-022 Lifecycle persistiert Farm -> Ready -> Handoff -> Rescan ohne Authority", async () => {
  const speicher = new MemorySpeicher();
  const lifecycle = new PersistenterProduktionsMaterialLifecycle(speicher);

  const farm = await lifecycle.beginne(ziel(), 100);
  assert.equal(farm.zustand, "FARM_REQUIRED");
  assert.equal(farm.sameFarmObjectiveErneutSenden, false);
  assert.equal(farm.sameHandoffErneutSenden, false);
  assert.equal(farm.sameCraftRescanErneutSenden, false);

  const ready = await lifecycle.markiereMaterialBereit(
    farm.objectiveId,
    fortschritt(),
    200,
  );
  assert.equal(ready.zustand, "MATERIAL_READY_FOR_HANDOFF");
  assert.equal(ready.letzteEvidenceFingerprint, "farmer-inventory-ready-fp");

  const collection = await lifecycle.markiereHandoffGeplant(
    farm.objectiveId,
    handoff(),
    300,
  );
  assert.equal(collection.zustand, "COLLECTION_PLAN_BEREIT");
  assert.equal(
    collection.handoffLogistikId,
    "prod-1:material:farm:1:collection",
  );
  assert.equal(
    collection.letzteEvidenceFingerprint,
    "farmer-inventory-handoff-fp",
  );

  const done = await lifecycle.markiereCraftRescan(
    farm.objectiveId,
    rescan(),
    400,
  );
  assert.equal(done.zustand, "CRAFT_RESCAN_BEREIT");
  assert.equal(done.letzteEvidenceFingerprint, "collection-settlement-fp");
  assert.equal(done.executionAuthority, false);
  assert.equal(done.gameplayAuthority, false);
  assert.equal(done.rawWriteAuthority, false);
  assert.equal(done.normalRuntimeAllowed, false);

  assert.ok(speicher.writes.length >= 4);
  assert.ok(speicher.writes.every(x => x.kritisch === true));
});

test("CAP-022 Restart setzt nichtterminale Phase auf RECOVERY_PENDING und verhindert Blind-Resume", async () => {
  const speicher = new MemorySpeicher();
  const lifecycle = new PersistenterProduktionsMaterialLifecycle(speicher);
  await lifecycle.beginne(ziel(), 100);
  await lifecycle.markiereMaterialBereit(
    "prod-1:material:farm:1",
    fortschritt(),
    200,
  );
  await lifecycle.markiereHandoffGeplant(
    "prod-1:material:farm:1",
    handoff(),
    300,
  );

  const neu = new PersistenterProduktionsMaterialLifecycle(speicher);
  const geladen = await neu.lade(400);
  assert.equal(geladen.geladen, true);
  assert.equal(geladen.recoveryPending, 1);
  assert.equal(geladen.terminal, 0);

  const pending = neu.finde("prod-1:material:farm:1");
  assert.equal(pending.zustand, "RECOVERY_PENDING");
  assert.equal(pending.recoveryVorZustand, "COLLECTION_PLAN_BEREIT");
  assert.equal(pending.sameFarmObjectiveErneutSenden, false);
  assert.equal(pending.sameHandoffErneutSenden, false);
  assert.equal(pending.sameCraftRescanErneutSenden, false);

  await assert.rejects(
    () => neu.markiereCraftRescan(
      "prod-1:material:farm:1",
      rescan(),
      410,
    ),
    /CAP022_LIFECYCLE_RESCAN_ZUSTAND_UNGUELTIG/,
  );

  await assert.rejects(
    () => neu.reconciliereNachRestart(
      "prod-1:material:farm:1",
      "MATERIAL_READY_FOR_HANDOFF",
      "wrong-recovery-fp",
      420,
    ),
    /CAP022_LIFECYCLE_RECOVERY_DRIFT/,
  );

  const reconciled = await neu.reconciliereNachRestart(
    "prod-1:material:farm:1",
    "COLLECTION_PLAN_BEREIT",
    "fresh-collection-recovery-fp",
    430,
  );
  assert.equal(reconciled.zustand, "COLLECTION_PLAN_BEREIT");
  assert.equal(reconciled.recoveryVorZustand, null);

  const done = await neu.markiereCraftRescan(
    "prod-1:material:farm:1",
    rescan(),
    440,
  );
  assert.equal(done.zustand, "CRAFT_RESCAN_BEREIT");
});

test("CAP-022 terminaler Rescan bleibt nach Restart terminal und wird nicht erneut gesendet", async () => {
  const speicher = new MemorySpeicher();
  const lifecycle = new PersistenterProduktionsMaterialLifecycle(speicher);
  await lifecycle.beginne(ziel(), 100);
  await lifecycle.markiereMaterialBereit(
    "prod-1:material:farm:1",
    fortschritt(),
    200,
  );
  await lifecycle.markiereHandoffGeplant(
    "prod-1:material:farm:1",
    handoff(),
    300,
  );
  await lifecycle.markiereCraftRescan(
    "prod-1:material:farm:1",
    rescan("CRAFT_RESCAN_BLOCKIERT"),
    400,
  );

  const neu = new PersistenterProduktionsMaterialLifecycle(speicher);
  const geladen = await neu.lade(500);
  assert.equal(geladen.recoveryPending, 0);
  assert.equal(geladen.terminal, 1);

  const terminal = neu.finde("prod-1:material:farm:1");
  assert.equal(terminal.zustand, "CRAFT_RESCAN_BLOCKIERT");
  assert.equal(terminal.recoveryVorZustand, null);
  assert.equal(terminal.sameFarmObjectiveErneutSenden, false);
  assert.equal(terminal.sameHandoffErneutSenden, false);
  assert.equal(terminal.sameCraftRescanErneutSenden, false);

  await assert.rejects(
    () => neu.markiereCraftRescan(
      "prod-1:material:farm:1",
      rescan(),
      510,
    ),
    /CAP022_LIFECYCLE_RESCAN_ZUSTAND_UNGUELTIG/,
  );
});

test("CAP-022 Lifecycle kann Recovery explizit FAILED_SAFE beenden", async () => {
  const speicher = new MemorySpeicher();
  const lifecycle = new PersistenterProduktionsMaterialLifecycle(speicher);
  await lifecycle.beginne(ziel(), 100);

  const neu = new PersistenterProduktionsMaterialLifecycle(speicher);
  await neu.lade(200);
  const failed = await neu.scheitereSicher(
    "prod-1:material:farm:1",
    "recovery-failed-safe-fp",
    210,
  );
  assert.equal(failed.zustand, "FAILED_SAFE");
  assert.equal(failed.executionAuthority, false);
  assert.equal(failed.gameplayAuthority, false);
  assert.equal(failed.rawWriteAuthority, false);
});

test("CAP-022 Lifecycle lehnt Persistenz aus der Zukunft fail-closed ab", async () => {
  const speicher = new MemorySpeicher();
  speicher.map.set(
    "koordination/production-material-lifecycle-v1.json",
    JSON.stringify({
      schemaVersion: 1,
      gespeichertAmMs: 1_000,
      eintraege: [],
    }),
  );
  const lifecycle = new PersistenterProduktionsMaterialLifecycle(speicher);
  await assert.rejects(
    () => lifecycle.lade(999),
    /CAP022_LIFECYCLE_PERSISTENZ_AUS_ZUKUNFT/,
  );
});

test("CAP-022 Lifecycle besitzt keinen direkten Gameplay-Write-Bypass", () => {
  const source = fs.readFileSync(
    "grundlage/quelle/koordination/production-material-lifecycle.ts",
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
    assert.equal(source.includes(marker), false, marker);
  }
});


test("CAP-022 Lifecycle-Vertrag und Roadmap halten PR20.9 trotz Recovery-Foundation geschlossen", () => {
  const contract = JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr22-23-production-material-lifecycle-foundation.json",
    "utf8",
  ));
  assert.equal(contract.status, "PREPARED_NO_WRITE");
  assert.equal(contract.restartBoundary.nonterminalBecomesRecoveryPending, true);
  assert.equal(contract.restartBoundary.blindResumeAllowed, false);
  assert.equal(contract.restartBoundary.exactPriorPhaseReconciliationRequired, true);
  assert.equal(contract.restartBoundary.sameFarmObjectiveRetryAllowed, false);
  assert.equal(contract.restartBoundary.sameHandoffRetryAllowed, false);
  assert.equal(contract.restartBoundary.sameCraftRescanRetryAllowed, false);
  assert.equal(contract.safetyBoundary.executionAuthority, false);
  assert.equal(contract.safetyBoundary.gameplayAuthority, false);
  assert.equal(contract.safetyBoundary.rawWriteAuthority, false);
  assert.equal(contract.safetyBoundary.normalRuntimeAllowed, false);
  assert.equal(contract.currentGateBoundary.candidateAcquisitionOrMutationAllowedNow, false);
  assert.equal(contract.currentGateBoundary.pr22ProductiveCoordinationRequired, true);
  assert.equal(contract.currentGateBoundary.pr23ProductiveFarmerRequired, true);

  const roadmap = JSON.parse(fs.readFileSync(
    "roadmap/post-r19-roadmap.json",
    "utf8",
  ));
  assert.equal(
    roadmap.pr20_9.status,
    "CRAFT_DURABLE_SHADOW_BLOCKED_NO_NORMAL_CANDIDATE",
  );
  assert.equal(
    roadmap.pr20_9.craftDurableShadowRunner.candidateAcquisitionOrMutationAllowed,
    false,
  );
  const lifecycle =
    roadmap.pr20_9.deferredAutomaticMaterialRecheck.persistentLifecycle;
  assert.equal(lifecycle.status, "PREPARED_NO_WRITE");
  assert.equal(lifecycle.nonterminalRestartBecomesRecoveryPending, true);
  assert.equal(lifecycle.blindResumeAllowed, false);
  assert.equal(lifecycle.sameFarmObjectiveRetryAllowed, false);
  assert.equal(lifecycle.sameHandoffRetryAllowed, false);
  assert.equal(lifecycle.sameCraftRescanRetryAllowed, false);
  assert.equal(lifecycle.productiveExecutionAllowed, false);
  assert.equal(lifecycle.gameplayAuthority, false);
  assert.equal(lifecycle.normalRuntimeAllowed, false);
});
