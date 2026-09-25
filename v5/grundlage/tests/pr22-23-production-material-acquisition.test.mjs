import test from "node:test";
import assert from "node:assert/strict";

import {
  bewerteProductionMaterialFortschritt,
  planeProductionMaterialAkquise,
  planeProduktion,
} from "../../erzeugt/index.js";

const recipient = Object.freeze({
  schemaVersion: 1,
  accountId: "account-1",
  characterId: "merchant",
  sessionId: "merchant-session-1",
  serverRegion: "EU",
  serverIdentifier: "I",
  rosterEpoche: 7,
  rosterFingerprint: "roster-fp",
});

const farmerBinding = Object.freeze({
  schemaVersion: 1,
  accountId: "account-1",
  characterId: "ranger",
  sessionId: "ranger-session-1",
  serverRegion: "EU",
  serverIdentifier: "I",
  rosterEpoche: 7,
  rosterFingerprint: "roster-fp",
});

function productionPlan() {
  return planeProduktion({
    schemaVersion: 1,
    planId: "plan-material-1",
    produktionsId: "prod-material-1",
    ablaufId: "workflow-material-1",
    ownerCharacterId: "merchant",
    recipient,
    outputName: "sword",
    outputLevel: 0,
    outputMenge: 1,
    planFingerprint: "plan-material-fp",
    lokalerBestand: [],
    bankSnapshot: null,
    quellen: [
      {
        schemaVersion: 1,
        sourceId: "farm-iron-bee",
        art: "FARM",
        name: "iron",
        level: 0,
        verfuegbareMenge: 2,
        beobachtetAmMs: 100,
        gueltigBisMs: 1_000,
        fingerprint: "farm-iron-evidence-fp",
        gateEvidence: null,
      },
    ],
    transformationen: [
      {
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
      },
    ],
    richtlinie: {
      richtlinienVersion: "prod-material-v1",
      quellenPrioritaet: ["LOKAL", "FARM", "CRAFT"],
      maximaleTiefe: 8,
      maximaleSchritte: 64,
      maximalesEvidenceAlterMs: 1_000,
    },
  }, 200);
}

function farmSource(overrides = {}) {
  return {
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
    ...overrides,
  };
}

function farmer(overrides = {}) {
  return {
    schemaVersion: 1,
    farmer: farmerBinding,
    beobachtetAmMs: 100,
    gueltigBisMs: 1_000,
    freshnessFingerprint: "farmer-ranger-fp",
    lifecycleAktiv: true,
    safetyBereit: true,
    movementVorbereitet: true,
    combatVorbereitet: true,
    lootVorbereitet: true,
    unterstuetzteSourceIds: ["farm-iron-bee"],
    ...overrides,
  };
}

test("CAP-022 plant FARM -> CRAFT -> DELIVERY als no-write Materialziel", () => {
  const plan = productionPlan();
  assert.deepEqual(
    plan.graph.schritte.map(x => x.art),
    ["FARM", "CRAFT", "DELIVERY"],
  );

  const akquise = planeProductionMaterialAkquise({
    schemaVersion: 1,
    plan,
    farmQuellen: [farmSource()],
    farmer: [farmer()],
    maximalesEvidenceAlterMs: 1_000,
  }, 200);

  assert.equal(akquise.status, "BEREIT_NO_WRITE");
  assert.equal(akquise.ziele.length, 1);
  const ziel = akquise.ziele[0];
  assert.ok(ziel);
  assert.equal(ziel.name, "iron");
  assert.equal(ziel.menge, 2);
  assert.equal(ziel.farmer.characterId, "ranger");
  assert.equal(ziel.sourceId, "farm-iron-bee");
  assert.equal(ziel.monsterTyp, "bee");
  assert.equal(ziel.mapName, "main");
  assert.equal(ziel.farmStopBeiMaterialBereit, true);
  assert.equal(ziel.handoffNachMaterialBereit, true);
  assert.equal(ziel.pr22KoordinationErforderlich, true);
  assert.equal(ziel.pr23FarmerAktionenErforderlich, true);
  assert.equal(ziel.pr20_9CraftRatificationCredit, false);
  assert.equal(ziel.ausfuehrungsAutoritaet, false);
  assert.equal(ziel.gameplayAutoritaet, false);
  assert.equal(ziel.rawWriteAutoritaet, false);

  assert.equal(akquise.pr22ProduktivGateErforderlich, true);
  assert.equal(akquise.pr23ProduktivGateErforderlich, true);
  assert.equal(akquise.currentPr20_9CandidateAcquisitionAllowed, false);
  assert.equal(akquise.ausfuehrungsAutoritaet, false);
  assert.equal(akquise.gameplayAutoritaet, false);
  assert.equal(akquise.rawWriteAutoritaet, false);
  assert.equal(akquise.normalRuntimeAllowed, false);
});

test("CAP-022 stoppt Farming logisch sobald Materialmenge fuer Handoff erreicht ist", () => {
  const plan = planeProductionMaterialAkquise({
    schemaVersion: 1,
    plan: productionPlan(),
    farmQuellen: [farmSource()],
    farmer: [farmer()],
    maximalesEvidenceAlterMs: 1_000,
  }, 200);
  const ziel = plan.ziele[0];
  assert.ok(ziel);

  const offen = bewerteProductionMaterialFortschritt(ziel, {
    schemaVersion: 1,
    farmer: farmerBinding,
    name: "iron",
    level: 0,
    menge: 1,
    beobachtetAmMs: 300,
    gueltigBisMs: 1_000,
    inventoryFingerprint: "inventory-iron-1",
  }, 300);

  assert.equal(offen.status, "FARM_REQUIRED");
  assert.equal(offen.restMenge, 1);
  assert.equal(offen.farmStopErforderlich, false);
  assert.equal(offen.handoffErforderlich, false);

  const bereit = bewerteProductionMaterialFortschritt(ziel, {
    schemaVersion: 1,
    farmer: farmerBinding,
    name: "iron",
    level: 0,
    menge: 2,
    beobachtetAmMs: 400,
    gueltigBisMs: 1_000,
    inventoryFingerprint: "inventory-iron-2",
  }, 400);

  assert.equal(bereit.status, "MATERIAL_READY_FOR_HANDOFF");
  assert.equal(bereit.restMenge, 0);
  assert.equal(bereit.farmStopErforderlich, true);
  assert.equal(bereit.handoffErforderlich, true);
  assert.equal(bereit.pr20_9CraftRatificationCredit, false);
  assert.equal(bereit.gameplayAutoritaet, false);
});

test("CAP-022 blockiert stale Farmquelle und stale oder serverfalschen Farmer", () => {
  const staleSource = planeProductionMaterialAkquise({
    schemaVersion: 1,
    plan: productionPlan(),
    farmQuellen: [farmSource({ gueltigBisMs: 150 })],
    farmer: [farmer()],
    maximalesEvidenceAlterMs: 1_000,
  }, 200);
  assert.equal(staleSource.status, "BLOCKIERT");
  assert.ok(staleSource.blocker.some(x =>
    x.startsWith("CAP022_FARM_QUELLE_FEHLT_ODER_STALE:")));

  const staleFarmer = planeProductionMaterialAkquise({
    schemaVersion: 1,
    plan: productionPlan(),
    farmQuellen: [farmSource()],
    farmer: [farmer({ gueltigBisMs: 150 })],
    maximalesEvidenceAlterMs: 1_000,
  }, 200);
  assert.equal(staleFarmer.status, "BLOCKIERT");
  assert.ok(staleFarmer.blocker.some(x =>
    x.startsWith("CAP022_FARMER_FEHLT_ODER_STALE:")));

  const andererServer = {
    ...farmerBinding,
    serverIdentifier: "II",
  };
  const wrongServer = planeProductionMaterialAkquise({
    schemaVersion: 1,
    plan: productionPlan(),
    farmQuellen: [farmSource()],
    farmer: [farmer({ farmer: andererServer })],
    maximalesEvidenceAlterMs: 1_000,
  }, 200);
  assert.equal(wrongServer.status, "BLOCKIERT");
  assert.ok(wrongServer.blocker.some(x =>
    x.startsWith("CAP022_FARMER_FEHLT_ODER_STALE:")));
});

test("CAP-022 bleibt ohne FARM-Node authority-frei und erzeugt kein Ziel", () => {
  const ohneFarm = planeProduktion({
    schemaVersion: 1,
    planId: "plan-buy-1",
    produktionsId: "prod-buy-1",
    ablaufId: "workflow-buy-1",
    ownerCharacterId: "merchant",
    recipient,
    outputName: "hpot0",
    outputLevel: 0,
    outputMenge: 1,
    planFingerprint: "plan-buy-fp",
    lokalerBestand: [],
    bankSnapshot: null,
    quellen: [{
      schemaVersion: 1,
      sourceId: "npc-hpot0",
      art: "BUY",
      name: "hpot0",
      level: 0,
      verfuegbareMenge: 1,
      beobachtetAmMs: 100,
      gueltigBisMs: 1_000,
      fingerprint: "npc-hpot0-fp",
      gateEvidence: null,
    }],
    transformationen: [],
    richtlinie: {
      richtlinienVersion: "buy-v1",
      quellenPrioritaet: ["BUY"],
      maximaleTiefe: 4,
      maximaleSchritte: 8,
      maximalesEvidenceAlterMs: 1_000,
    },
  }, 200);

  const akquise = planeProductionMaterialAkquise({
    schemaVersion: 1,
    plan: ohneFarm,
    farmQuellen: [],
    farmer: [],
    maximalesEvidenceAlterMs: 1_000,
  }, 200);

  assert.equal(akquise.status, "KEIN_FARM_BEDARF");
  assert.deepEqual(akquise.ziele, []);
  assert.equal(akquise.currentPr20_9CandidateAcquisitionAllowed, false);
  assert.equal(akquise.gameplayAutoritaet, false);
});
