import test from "node:test";
import assert from "node:assert/strict";

import {
  PersistenterBankKatalog,
  PersistenterProduktionsController,
  planeProduktion,
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

const recipient = Object.freeze({
  schemaVersion: 1,
  accountId: "account-1",
  characterId: "warrior",
  sessionId: "session-1",
  serverRegion: "EU",
  serverIdentifier: "I",
  rosterEpoche: 7,
  rosterFingerprint: "roster-fp",
});

function policy(overrides = {}) {
  return {
    richtlinienVersion: "prod-policy-v1",
    quellenPrioritaet: [
      "LOKAL",
      "BANK",
      "BUY",
      "CRAFT",
      "EXCHANGE",
      "UPGRADE",
      "COMPOUND",
      "QUEST",
      "EVENT",
      "FARM",
    ],
    maximaleTiefe: 8,
    maximaleSchritte: 64,
    maximalesEvidenceAlterMs: 1_000,
    ...overrides,
  };
}

function bankSnapshot() {
  return {
    schemaVersion: 1,
    accountId: "account-1",
    beobachtetAmMs: 100,
    gueltigBisMs: 1_000,
    mountEpoche: 3,
    leaseEpoche: 8,
    fingerprint: "bank-fp",
    eintraege: [
      {
        pack: "items0",
        slot: 0,
        name: "iron",
        level: 0,
        menge: 2,
        variantenFingerprint: "iron-v1",
      },
    ],
  };
}

function basisAnfrage(overrides = {}) {
  return {
    schemaVersion: 1,
    planId: "plan-1",
    produktionsId: "prod-1",
    ablaufId: "workflow-prod-1",
    ownerCharacterId: "merchant",
    recipient,
    outputName: "sword",
    outputLevel: 0,
    outputMenge: 1,
    planFingerprint: "plan-fp",
    lokalerBestand: [],
    bankSnapshot: bankSnapshot(),
    quellen: [],
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
    richtlinie: policy(),
    ...overrides,
  };
}

test("CAP-035 plant deterministisch Bank -> Craft -> Delivery ohne ExecutionAuthority", () => {
  const plan = planeProduktion(basisAnfrage(), 200);

  assert.equal(plan.graphNachweis.erlaubt, true);
  assert.equal(plan.graphNachweis.status, "BEREIT");
  assert.deepEqual(
    plan.graph.schritte.map(x => x.art),
    ["BANK_RETRIEVE", "CRAFT", "DELIVERY"],
  );
  assert.deepEqual(
    plan.graphNachweis.reihenfolge.map(
      id => plan.graph.schritte.find(x => x.nodeId === id).art,
    ),
    ["BANK_RETRIEVE", "CRAFT", "DELIVERY"],
  );
  assert.equal(plan.bankKatalogPin.planningEvidence, true);
  assert.equal(plan.bankKatalogPin.executionAuthority, false);
  assert.equal(plan.ausfuehrungsAutoritaet, false);
  assert.equal(plan.gameplayAutoritaet, false);
  assert.equal(plan.rawWriteAutoritaet, false);

  const craft = plan.schrittBindungen.find(x => x.art === "CRAFT");
  assert.equal(craft.actionContractId, "AL-ACTION-CRAFT");
  assert.equal(craft.recoveryContractId, "AL-RECOVERY-CRAFT");
  assert.equal(craft.verifierId, "AL-VERIFIER-CRAFT");
  assert.equal(craft.planningOnly, true);
});

test("CAP-035 uebernimmt keine V3-Preisformel, sondern explizite Source-Prioritaet", () => {
  const plan = planeProduktion(basisAnfrage({
    bankSnapshot: null,
    quellen: [
      {
        schemaVersion: 1,
        sourceId: "vendor-sword",
        art: "BUY",
        name: "sword",
        level: 0,
        verfuegbareMenge: 1,
        beobachtetAmMs: 100,
        gueltigBisMs: 1_000,
        fingerprint: "vendor-fp",
        gateEvidence: null,
      },
    ],
    richtlinie: policy({
      quellenPrioritaet: ["BUY", "CRAFT", "LOKAL", "BANK"],
    }),
  }), 200);

  assert.deepEqual(plan.graph.schritte.map(x => x.art), ["BUY", "DELIVERY"]);
});

test("CAP-035 blockiert Recipe-Cycles und stale Evidence fail-closed", () => {
  const zyklus = basisAnfrage({
    bankSnapshot: null,
    outputName: "a",
    transformationen: [
      {
        schemaVersion: 1,
        transformationId: "craft-a",
        art: "CRAFT",
        outputName: "a",
        outputLevel: 0,
        outputMengeProVorgang: 1,
        inputs: [{ name: "b", level: 0, menge: 1 }],
        workspaceNachweisFingerprint: "ws-a",
        beobachtetAmMs: 100,
        gueltigBisMs: 1_000,
        fingerprint: "a-fp",
      },
      {
        schemaVersion: 1,
        transformationId: "craft-b",
        art: "CRAFT",
        outputName: "b",
        outputLevel: 0,
        outputMengeProVorgang: 1,
        inputs: [{ name: "a", level: 0, menge: 1 }],
        workspaceNachweisFingerprint: "ws-b",
        beobachtetAmMs: 100,
        gueltigBisMs: 1_000,
        fingerprint: "b-fp",
      },
    ],
    richtlinie: policy({ quellenPrioritaet: ["CRAFT"] }),
  });
  assert.throws(
    () => planeProduktion(zyklus, 200),
    /PRODUKTION_PLAN_RECIPE_CYCLE/,
  );

  const stale = basisAnfrage({
    bankSnapshot: null,
    transformationen: [],
    quellen: [
      {
        schemaVersion: 1,
        sourceId: "vendor-sword",
        art: "BUY",
        name: "sword",
        level: 0,
        verfuegbareMenge: 1,
        beobachtetAmMs: 100,
        gueltigBisMs: 150,
        fingerprint: "vendor-stale",
        gateEvidence: null,
      },
    ],
    richtlinie: policy({ quellenPrioritaet: ["BUY"] }),
  });
  assert.throws(
    () => planeProduktion(stale, 200),
    /PRODUKTION_PLAN_EVIDENCE_STALE/,
  );
});

test("CAP-037 persistiert Bankkatalog, Mutation invalidiert und Restart behaelt Block", async () => {
  const speicher = new MemorySpeicher();
  const katalog = new PersistenterBankKatalog(speicher);

  const pin = await katalog.beobachte(bankSnapshot(), 200);
  assert.equal(pin.planningEvidence, true);
  assert.equal(katalog.istVerwendbar(200), true);

  await katalog.invalidiere("BANK_RETRIEVE_GESENDET", 250);
  assert.equal(katalog.istVerwendbar(260), false);
  assert.throws(() => katalog.pinne(260), /BANK_KATALOG_INVALIDIERT/);

  const neu = new PersistenterBankKatalog(speicher);
  const status = await neu.lade(300);
  assert.equal(status.geladen, true);
  assert.equal(status.invalidiert, true);
  assert.equal(status.verwendbar, false);
  assert.throws(() => neu.pinne(300), /BANK_KATALOG_INVALIDIERT/);
});

test("CAP-037 stale persistierter Snapshot bleibt Planning Evidence ohne ExecutionAuthority", async () => {
  const speicher = new MemorySpeicher();
  const katalog = new PersistenterBankKatalog(speicher);
  await katalog.beobachte(bankSnapshot(), 200);

  const neu = new PersistenterBankKatalog(speicher);
  const status = await neu.lade(1_100);
  assert.equal(status.geladen, true);
  assert.equal(status.verwendbar, false);
  assert.equal(status.executionAuthority, false);
  assert.throws(() => neu.pinne(1_100), /BANK_KATALOG_NICHT_FRISCH/);
});

test("CAP-036 persistiert Intent und Restart wird RECOVERY_PENDING statt Blind-Resume", async () => {
  const speicher = new MemorySpeicher();
  const plan = planeProduktion(basisAnfrage({
    bankSnapshot: null,
    quellen: [
      {
        schemaVersion: 1,
        sourceId: "vendor-sword",
        art: "BUY",
        name: "sword",
        level: 0,
        verfuegbareMenge: 1,
        beobachtetAmMs: 100,
        gueltigBisMs: 1_000,
        fingerprint: "vendor-fp",
        gateEvidence: null,
      },
    ],
    transformationen: [],
    richtlinie: policy({ quellenPrioritaet: ["BUY"] }),
  }), 200);

  const controller = new PersistenterProduktionsController(speicher);
  assert.equal((await controller.uebernehmePlan(plan, 210)).zustand, "GEPLANT");
  assert.equal(
    (await controller.beginneHerstellung("prod-1", 220)).zustand,
    "HERSTELLUNG_IN_FLIGHT",
  );
  assert.equal(
    (await controller.markiereOutputBereit(
      "prod-1",
      "sword-output-fp",
      230,
    )).zustand,
    "OUTPUT_BEREIT",
  );
  assert.equal(
    (await controller.beginneLieferung(
      "prod-1",
      "settlement-1",
      recipient,
      0,
      "inventory-before",
      240,
      240,
    )).zustand,
    "LIEFERUNG_AUSSTEHEND",
  );

  const nachRestart = new PersistenterProduktionsController(speicher);
  const geladen = await nachRestart.lade(300);
  assert.equal(geladen.geladen, true);
  assert.equal(geladen.recoveryPending, 1);
  assert.equal(nachRestart.finde("prod-1").zustand, "RECOVERY_PENDING");
  assert.equal(
    nachRestart.finde("prod-1").sameIntentErneutSenden,
    false,
  );

  await assert.rejects(
    () => nachRestart.committe("prod-1", 310),
    /PRODUKTION_COMMIT_OHNE_RECIPIENT_SETTLEMENT/,
  );

  const settled = await nachRestart.verifiziereRecipientSettlement(
    "prod-1",
    {
      schemaVersion: 1,
      settlementId: "settlement-1",
      produktionsId: "prod-1",
      recipientCharacterId: "warrior",
      recipientSessionId: "session-1",
      serverRegion: "EU",
      serverIdentifier: "I",
      rosterEpoche: 7,
      outputName: "sword",
      outputLevel: 0,
      beobachteteMenge: 1,
      beobachtetAmMs: 320,
      inventoryFingerprint: "inventory-after",
      korrelationsFingerprint: "settlement-fp",
    },
    320,
  );
  assert.equal(settled.zustand, "RECIPIENT_SETTLED");
  assert.equal(
    (await nachRestart.committe("prod-1", 330)).zustand,
    "COMMITTED",
  );
});

test("CAP-036 uebernimmt keinen deferred oder blockierten Plan", async () => {
  const speicher = new MemorySpeicher();
  const eventPlan = planeProduktion(basisAnfrage({
    bankSnapshot: null,
    outputName: "eventmat",
    transformationen: [],
    quellen: [
      {
        schemaVersion: 1,
        sourceId: "event-source",
        art: "EVENT",
        name: "eventmat",
        level: 0,
        verfuegbareMenge: 1,
        beobachtetAmMs: 100,
        gueltigBisMs: 1_000,
        fingerprint: "event-source-fp",
        gateEvidence: {
          schemaVersion: 1,
          gateArt: "EVENT",
          gateId: "event-1",
          aktiv: false,
          beobachtetAmMs: 100,
          gueltigBisMs: 1_000,
          fingerprint: "event-gate-fp",
        },
      },
    ],
    richtlinie: policy({ quellenPrioritaet: ["EVENT"] }),
  }), 200);

  assert.equal(eventPlan.graphNachweis.erlaubt, false);
  assert.equal(
    eventPlan.graphNachweis.status,
    "DEFERRED_EVENT_INAKTIV",
  );

  const controller = new PersistenterProduktionsController(speicher);
  await assert.rejects(
    () => controller.uebernehmePlan(eventPlan, 210),
    /PRODUKTION_CONTROLLER_PLAN_NICHT_BEREIT/,
  );
});
