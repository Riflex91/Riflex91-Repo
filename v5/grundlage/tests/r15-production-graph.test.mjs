import test from "node:test";
import assert from "node:assert/strict";

import {
  pinneBankKatalog,
  pruefeProduktionsGraph,
} from "../../erzeugt/index.js";

const recipient = {
  schemaVersion: 1,
  accountId: "account-1",
  characterId: "warrior",
  sessionId: "session-1",
  serverRegion: "EU",
  serverIdentifier: "I",
  rosterEpoche: 20,
  rosterFingerprint: "roster-fp",
};

function bankPin(gueltigBisMs = 1000) {
  return pinneBankKatalog({
    schemaVersion: 1,
    accountId: "account-1",
    beobachtetAmMs: 100,
    gueltigBisMs,
    mountEpoche: 4,
    leaseEpoche: 9,
    fingerprint: "bank-fp",
    eintraege: [{
      pack: "items0",
      slot: 0,
      name: "iron",
      level: 0,
      menge: 5,
      variantenFingerprint: "iron-v1",
    }],
  }, 200);
}

function graph(overrides = {}) {
  return {
    schemaVersion: 1,
    planId: "plan-1",
    recipient,
    rootNodeId: "deliver",
    planFingerprint: "plan-fp",
    bankKatalog: bankPin(),
    schritte: [
      {
        nodeId: "bank",
        art: "BANK_RETRIEVE",
        abhaengigkeiten: [],
        outputName: "iron",
        outputLevel: 0,
        outputMenge: 2,
        operationSchluessel: "op-bank",
        workspaceNachweisFingerprint: null,
        gateEvidence: null,
      },
      {
        nodeId: "craft",
        art: "CRAFT",
        abhaengigkeiten: ["bank"],
        outputName: "sword",
        outputLevel: 0,
        outputMenge: 1,
        operationSchluessel: "op-craft",
        workspaceNachweisFingerprint: "workspace-fp",
        gateEvidence: null,
      },
      {
        nodeId: "deliver",
        art: "DELIVERY",
        abhaengigkeiten: ["craft"],
        outputName: "sword",
        outputLevel: 0,
        outputMenge: 1,
        operationSchluessel: "op-delivery",
        workspaceNachweisFingerprint: null,
        gateEvidence: null,
      },
    ],
    ...overrides,
  };
}

test("Production Graph ist bounded, topologisch und actionless", () => {
  const nachweis = pruefeProduktionsGraph(graph(), 300);
  assert.equal(nachweis.erlaubt, true);
  assert.equal(nachweis.status, "BEREIT");
  assert.deepEqual(nachweis.reihenfolge, ["bank", "craft", "deliver"]);
  assert.equal(nachweis.actionAuthority, false);
  assert.equal(nachweis.rawWriteAuthority, false);
});

test("Persistenter Bankkatalog ist nur frische Planning Evidence, keine ExecutionAuthority", () => {
  const pin = bankPin();
  assert.equal(pin.planningEvidence, true);
  assert.equal(pin.executionAuthority, false);
  assert.throws(
    () => pruefeProduktionsGraph(graph({ bankKatalog: { ...pin, gueltigBisMs: 250 } }), 300),
    /PRODUKTION_BANK_KATALOG_STALE_ODER_FEHLT/,
  );
});

test("Production Graph blockiert Recipe Cycle und verwaiste Schritte", () => {
  const zyklus = graph({
    schritte: [
      {
        nodeId: "a",
        art: "CRAFT",
        abhaengigkeiten: ["b"],
        outputName: "a",
        outputLevel: 0,
        outputMenge: 1,
        operationSchluessel: "op-a",
        workspaceNachweisFingerprint: "ws-a",
        gateEvidence: null,
      },
      {
        nodeId: "b",
        art: "DELIVERY",
        abhaengigkeiten: ["a"],
        outputName: "a",
        outputLevel: 0,
        outputMenge: 1,
        operationSchluessel: "op-b",
        workspaceNachweisFingerprint: null,
        gateEvidence: null,
      },
    ],
    rootNodeId: "b",
    bankKatalog: null,
  });
  assert.throws(() => pruefeProduktionsGraph(zyklus, 300), /PRODUKTION_GRAPH_RECIPE_CYCLE/);

  const mitWaise = graph({
    schritte: [
      ...graph().schritte,
      {
        nodeId: "orphan",
        art: "FARM",
        abhaengigkeiten: [],
        outputName: "wood",
        outputLevel: 0,
        outputMenge: 1,
        operationSchluessel: null,
        workspaceNachweisFingerprint: null,
        gateEvidence: null,
      },
    ],
  });
  assert.throws(
    () => pruefeProduktionsGraph(mitWaise, 300),
    /PRODUKTION_GRAPH_VERWAISTER_SCHRITT/,
  );
});

test("Irreversible Schritte brauchen eindeutigen Operation-Schluessel und Mutation Workspace", () => {
  const doppelt = graph({
    schritte: graph().schritte.map(x =>
      x.nodeId === "deliver" ? { ...x, operationSchluessel: "op-craft" } : x),
  });
  assert.throws(
    () => pruefeProduktionsGraph(doppelt, 300),
    /PRODUKTION_OPERATIONSSCHLUESSEL_DOPPELT/,
  );

  const ohneWorkspace = graph({
    schritte: graph().schritte.map(x =>
      x.nodeId === "craft" ? { ...x, workspaceNachweisFingerprint: null } : x),
  });
  assert.throws(
    () => pruefeProduktionsGraph(ohneWorkspace, 300),
    /PRODUKTION_MUTATION_OHNE_WORKSPACE_NACHWEIS/,
  );
});

test("Inactive Event wird deferred, stale Event Evidence fail-closed blockiert", () => {
  const eventGraph = {
    schemaVersion: 1,
    planId: "event-plan",
    recipient,
    rootNodeId: "deliver",
    planFingerprint: "event-plan-fp",
    bankKatalog: null,
    schritte: [
      {
        nodeId: "event",
        art: "EVENT",
        abhaengigkeiten: [],
        outputName: "eventmat",
        outputLevel: 0,
        outputMenge: 1,
        operationSchluessel: null,
        workspaceNachweisFingerprint: null,
        gateEvidence: {
          schemaVersion: 1,
          gateArt: "EVENT",
          gateId: "holiday-event",
          aktiv: false,
          beobachtetAmMs: 200,
          gueltigBisMs: 400,
          fingerprint: "event-fp",
        },
      },
      {
        nodeId: "deliver",
        art: "DELIVERY",
        abhaengigkeiten: ["event"],
        outputName: "eventmat",
        outputLevel: 0,
        outputMenge: 1,
        operationSchluessel: "op-event-delivery",
        workspaceNachweisFingerprint: null,
        gateEvidence: null,
      },
    ],
  };
  const deferred = pruefeProduktionsGraph(eventGraph, 300);
  assert.equal(deferred.erlaubt, false);
  assert.equal(deferred.status, "DEFERRED_EVENT_INAKTIV");

  const stale = {
    ...eventGraph,
    schritte: eventGraph.schritte.map(x =>
      x.nodeId === "event"
        ? { ...x, gateEvidence: { ...x.gateEvidence, aktiv: true, gueltigBisMs: 250 } }
        : x),
  };
  assert.throws(() => pruefeProduktionsGraph(stale, 300), /PRODUKTION_GATE_STALE/);
});
