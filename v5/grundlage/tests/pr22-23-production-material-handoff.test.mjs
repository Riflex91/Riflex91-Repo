import test from "node:test";
import assert from "node:assert/strict";

import {
  bewerteProductionMaterialFortschritt,
  planeProductionMaterialAkquise,
  planeProductionMaterialHandoff,
  planeProduktion,
} from "../../erzeugt/index.js";

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

const farmer = Object.freeze({
  schemaVersion: 1,
  accountId: "account-1",
  characterId: "ranger",
  sessionId: "ranger-session",
  serverRegion: "EU",
  serverIdentifier: "I",
  rosterEpoche: 7,
  rosterFingerprint: "roster-fp",
});

function productionPlan() {
  return planeProduktion({
    schemaVersion: 1,
    planId: "plan-handoff",
    produktionsId: "prod-handoff",
    ablaufId: "workflow-handoff",
    ownerCharacterId: "merchant",
    recipient: merchant,
    outputName: "sword",
    outputLevel: 0,
    outputMenge: 1,
    planFingerprint: "plan-handoff-fp",
    lokalerBestand: [],
    bankSnapshot: null,
    quellen: [{
      schemaVersion: 1,
      sourceId: "farm-iron-bee",
      art: "FARM",
      name: "iron",
      level: 0,
      verfuegbareMenge: 2,
      beobachtetAmMs: 100,
      gueltigBisMs: 1_000,
      fingerprint: "farm-iron-fp",
      gateEvidence: null,
    }],
    transformationen: [{
      schemaVersion: 1,
      transformationId: "craft-sword",
      art: "CRAFT",
      outputName: "sword",
      outputLevel: 0,
      outputMengeProVorgang: 1,
      inputs: [{ name: "iron", level: 0, menge: 2 }],
      workspaceNachweisFingerprint: "workspace-fp",
      beobachtetAmMs: 100,
      gueltigBisMs: 1_000,
      fingerprint: "craft-sword-fp",
    }],
    richtlinie: {
      richtlinienVersion: "handoff-v1",
      quellenPrioritaet: ["FARM", "CRAFT"],
      maximaleTiefe: 8,
      maximaleSchritte: 64,
      maximalesEvidenceAlterMs: 1_000,
    },
  }, 200);
}

function materialZiel() {
  const plan = planeProductionMaterialAkquise({
    schemaVersion: 1,
    plan: productionPlan(),
    farmQuellen: [{
      schemaVersion: 1,
      sourceId: "farm-iron-bee",
      name: "iron",
      level: 0,
      verfuegbareMenge: 2,
      monsterTyp: "bee",
      mapName: "main",
      spawnFingerprint: "spawn-bee-main-fp",
      beobachtetAmMs: 100,
      gueltigBisMs: 1_000,
    }],
    farmer: [{
      schemaVersion: 1,
      farmer,
      beobachtetAmMs: 100,
      gueltigBisMs: 1_000,
      freshnessFingerprint: "farmer-fp",
      lifecycleAktiv: true,
      safetyBereit: true,
      movementVorbereitet: true,
      combatVorbereitet: true,
      lootVorbereitet: true,
      unterstuetzteSourceIds: ["farm-iron-bee"],
    }],
    maximalesEvidenceAlterMs: 1_000,
  }, 200);
  assert.equal(plan.status, "BEREIT_NO_WRITE");
  return plan.ziele[0];
}

function materialReady(ziel, overrides = {}) {
  return bewerteProductionMaterialFortschritt(ziel, {
    schemaVersion: 1,
    farmer,
    name: "iron",
    level: 0,
    menge: 2,
    beobachtetAmMs: 300,
    gueltigBisMs: 1_000,
    inventoryFingerprint: "farmer-inventory-iron-2",
    ...overrides,
  }, 300);
}

function quelleEvidence(posten = [{
  physischeKennung: "slot:7",
  name: "iron",
  level: 0,
  menge: 2,
  itemFingerprint: "iron-slot-7-fp",
}]) {
  return {
    schemaVersion: 1,
    quelle: farmer,
    beobachtetAmMs: 300,
    gueltigBisMs: 1_000,
    freshnessFingerprint: "farmer-inventory-fresh-fp",
    inventoryFingerprint: "farmer-inventory-fp",
    posten,
  };
}

function rendezvous() {
  return {
    schemaVersion: 1,
    characterId: "merchant",
    sessionId: "merchant-session",
    serverRegion: "EU",
    serverIdentifier: "I",
    rosterEpoche: 7,
    beobachtetAmMs: 400,
    distanz: 20,
    freshnessFingerprint: "merchant-rendezvous-fp",
  };
}

function handoffRequest(overrides = {}) {
  const ziel = overrides.ziel ?? materialZiel();
  const fortschritt = overrides.fortschritt ?? materialReady(ziel);
  return {
    schemaVersion: 1,
    ziel,
    fortschritt,
    merchant,
    quelleEvidence: quelleEvidence(),
    merchantRendezvousEvidence: rendezvous(),
    baselineMerchantInventoryFingerprint: "merchant-before-fp",
    baselineMerchantMenge: 0,
    erstelltAmMs: 400,
    gueltigBisMs: 900,
    maximalTransferDistanz: 100,
    maximalesEvidenceAlterMs: 1_000,
    ...overrides,
  };
}

test("CAP-022 plant MATERIAL_READY_FOR_HANDOFF als exakt gepinnte COLLECTION ohne Authority", () => {
  const ziel = materialZiel();
  const fortschritt = materialReady(ziel);
  assert.equal(fortschritt.status, "MATERIAL_READY_FOR_HANDOFF");
  assert.equal(fortschritt.beobachtetAmMs, 300);
  assert.equal(fortschritt.gueltigBisMs, 1_000);

  const plan = planeProductionMaterialHandoff(
    handoffRequest({ ziel, fortschritt }),
    400,
  );

  assert.equal(plan.status, "COLLECTION_PLAN_BEREIT_NO_WRITE");
  assert.equal(plan.objectiveId, ziel.objectiveId);
  assert.equal(plan.farmStopVerified, true);
  assert.equal(plan.materialReadyVerified, true);
  assert.equal(plan.singlePhysicalStackPinned, true);
  assert.equal(plan.pr22CoordinationRequired, true);
  assert.equal(plan.pr23FarmStopEvidenceRequired, true);
  assert.equal(plan.productiveTransferAuthorityRequired, true);
  assert.equal(plan.settledFutureHandoffRequiresFreshCraftRescan, true);
  assert.equal(plan.handoffPlanCountsAsNaturalCurrentInventoryCandidate, false);
  assert.equal(plan.foundationCountsAsCraftRatification, false);
  assert.equal(plan.ausfuehrungsAutoritaet, false);
  assert.equal(plan.gameplayAutoritaet, false);
  assert.equal(plan.rawWriteAutoritaet, false);
  assert.equal(plan.normalRuntimeAllowed, false);

  assert.equal(plan.logistik.plan.art, "COLLECTION");
  assert.equal(plan.logistik.plan.quelleCharacterId, "ranger");
  assert.equal(plan.logistik.plan.empfaenger.characterId, "merchant");
  assert.equal(plan.logistik.plan.posten.length, 1);
  assert.deepEqual(plan.logistik.plan.posten[0], {
    physischeKennung: "slot:7",
    name: "iron",
    level: 0,
    menge: 2,
    baselineEmpfaengerMenge: 0,
  });
  assert.equal(plan.logistik.quellenPin.posten[0].itemFingerprint, "iron-slot-7-fp");
  assert.equal(plan.logistik.transferBindung.actionContractId, "AL-ACTION-SEND-ITEM");
  assert.equal(plan.logistik.transferBindung.recoveryContractId, "AL-RECOVERY-SEND-ITEM");
  assert.equal(plan.logistik.transferBindung.verifierId, "AL-VERIFIER-SEND-ITEM");
  assert.equal(plan.logistik.transferBindung.planningOnly, true);
  assert.equal(plan.logistik.ausfuehrungsAutoritaet, false);
});

test("CAP-022 startet Handoff nicht solange Farmbedarf offen ist", () => {
  const ziel = materialZiel();
  const offen = bewerteProductionMaterialFortschritt(ziel, {
    schemaVersion: 1,
    farmer,
    name: "iron",
    level: 0,
    menge: 1,
    beobachtetAmMs: 300,
    gueltigBisMs: 1_000,
    inventoryFingerprint: "farmer-inventory-iron-1",
  }, 300);
  assert.equal(offen.status, "FARM_REQUIRED");

  assert.throws(
    () => planeProductionMaterialHandoff(
      handoffRequest({ ziel, fortschritt: offen }),
      400,
    ),
    /CAP022_HANDOFF_MATERIAL_NOCH_NICHT_BEREIT/,
  );
});

test("CAP-022 lehnt stale Material-Evidence vor Collection ab", () => {
  const ziel = materialZiel();
  const bereit = materialReady(ziel);
  const stale = {
    ...bereit,
    gueltigBisMs: 350,
  };
  assert.throws(
    () => planeProductionMaterialHandoff(
      handoffRequest({ ziel, fortschritt: stale }),
      400,
    ),
    /CAP022_HANDOFF_MATERIAL_EVIDENCE_STALE/,
  );
});

test("CAP-022 verlangt fuer Handoff einen einzelnen exakt gepinnten physischen Stack", () => {
  const ziel = materialZiel();
  const request = handoffRequest({
    ziel,
    fortschritt: materialReady(ziel),
    quelleEvidence: quelleEvidence([
      {
        physischeKennung: "slot:7",
        name: "iron",
        level: 0,
        menge: 1,
        itemFingerprint: "iron-slot-7-fp",
      },
      {
        physischeKennung: "slot:8",
        name: "iron",
        level: 0,
        menge: 1,
        itemFingerprint: "iron-slot-8-fp",
      },
    ]),
  });
  assert.throws(
    () => planeProductionMaterialHandoff(request, 400),
    /CAP022_HANDOFF_PHYSISCHER_SINGLE_STACK_FEHLT/,
  );
});

test("CAP-022 bindet Farmer und Merchant exakt an denselben Account/Server", () => {
  const ziel = materialZiel();
  const andererMerchant = {
    ...merchant,
    serverIdentifier: "II",
  };
  assert.throws(
    () => planeProductionMaterialHandoff(
      handoffRequest({
        ziel,
        fortschritt: materialReady(ziel),
        merchant: andererMerchant,
      }),
      400,
    ),
    /CAP022_HANDOFF_MERCHANT_BINDUNG_DRIFT/,
  );

  const falscheQuelle = {
    ...quelleEvidence(),
    quelle: {
      ...farmer,
      sessionId: "other-session",
    },
  };
  assert.throws(
    () => planeProductionMaterialHandoff(
      handoffRequest({
        ziel,
        fortschritt: materialReady(ziel),
        quelleEvidence: falscheQuelle,
      }),
      400,
    ),
    /CAP022_HANDOFF_QUELLE_FARMER_DRIFT/,
  );
});
