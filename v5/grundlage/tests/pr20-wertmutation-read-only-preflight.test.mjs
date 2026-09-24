import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  GearAllokationsLedger,
  GegenstandsDispositionsLedger,
  WerttransaktionsLedger,
  pruefePr208CompoundReadOnlyPreflight,
  pruefePr208ExchangeReadOnlyPreflight,
  pruefePr208UpgradeReadOnlyPreflight,
} from "../../erzeugt/index.js";

function session(overrides = {}) {
  return {
    schemaVersion: 1,
    characterId: "My_Merchant",
    sessionId: "My_Merchant",
    serverRegion: "EU",
    serverIdentifier: "I",
    characterClass: "merchant",
    expectedCharacterId: "My_Merchant",
    expectedSessionId: "My_Merchant",
    expectedServerRegion: "EU",
    expectedServerIdentifier: "I",
    ...overrides,
  };
}

function item(index, name, level = 0, menge = 1, overrides = {}) {
  return {
    schemaVersion: 1,
    characterId: "My_Merchant",
    inventarIndex: index,
    name,
    level,
    menge,
    beobachtungsFingerprint: "fp-" + index + "-" + name,
    beobachtetAmMs: 100,
    ...overrides,
  };
}

function mutationPolicy(overrides = {}) {
  return {
    richtlinienVersion: "mutation-v1",
    maximalesEvidenceAlterMs: 1_000,
    maximalesIdentitaetsAlterMs: 1_000,
    maximalerInputGesamtwert: 1_000_000,
    maximalerZielLevelVorMutation: 5,
    upgradeItemverlustErlaubt: true,
    compoundDreifachverlustErlaubt: true,
    offeringErlaubt: false,
    ...overrides,
  };
}

function pathEvidence(art) {
  return {
    schemaVersion: 1,
    art,
    pfad: art === "UPGRADE" ? "NORMAL_LEVEL_UPGRADE" : "NORMAL_COMPOUND",
    previewNurPlanungsEvidence: true,
    zielVerlustBeiUpgradeFehler: art === "UPGRADE",
    alleDreiInputsVerlustBeiCompoundFehler: art === "COMPOUND",
    beobachtetAmMs: 100,
    gueltigBisMs: 1_000,
    evidenceFingerprint: "path-" + art,
  };
}

function upgrade(overrides = {}) {
  return {
    schemaVersion: 1,
    transaktionsId: "tx-upgrade-ro",
    ablaufId: "flow-upgrade-ro",
    characterId: "My_Merchant",
    art: "UPGRADE",
    ziele: [item(1, "sword", 1)],
    scroll: item(2, "scroll0", 0, 5),
    scrollMenge: 1,
    offering: null,
    offeringMenge: 0,
    inputGesamtwert: 5000,
    contentVerifiziert: true,
    serviceErreichbar: true,
    qFrei: true,
    workspace: {
      freieInventarSlots: 2,
      temporaereWorkspaceSlots: 1,
      bestehendeStacks: [],
      outputs: [],
    },
    pfadEvidence: pathEvidence("UPGRADE"),
    beobachtetAmMs: 100,
    gueltigBisMs: 1_000,
    prestateFingerprint: "pre-upgrade",
    ...overrides,
  };
}

function compound(overrides = {}) {
  return {
    schemaVersion: 1,
    transaktionsId: "tx-compound-ro",
    ablaufId: "flow-compound-ro",
    characterId: "My_Merchant",
    art: "COMPOUND",
    ziele: [
      item(10, "ring", 0),
      item(11, "ring", 0),
      item(12, "ring", 0),
    ],
    scroll: item(13, "cscroll0", 0, 5),
    scrollMenge: 1,
    offering: null,
    offeringMenge: 0,
    inputGesamtwert: 6000,
    contentVerifiziert: true,
    serviceErreichbar: true,
    qFrei: true,
    workspace: {
      freieInventarSlots: 2,
      temporaereWorkspaceSlots: 1,
      bestehendeStacks: [],
      outputs: [],
    },
    pfadEvidence: pathEvidence("COMPOUND"),
    beobachtetAmMs: 100,
    gueltigBisMs: 1_000,
    prestateFingerprint: "pre-compound",
    ...overrides,
  };
}

function mutationDeps(k) {
  const dispositionen = new GegenstandsDispositionsLedger();
  for (const ziel of k.ziele) {
    dispositionen.setze({
      identitaet: ziel,
      disposition: k.art,
      begruendung: "read-only target",
      policyVersion: "mutation-v1",
    });
  }
  dispositionen.setze({
    identitaet: k.scroll,
    disposition: "VERBRAUCH",
    begruendung: "read-only scroll",
    policyVersion: "mutation-v1",
  });
  return {
    dispositionen,
    gearAllokation: new GearAllokationsLedger(),
    werttransaktionen: new WerttransaktionsLedger(),
  };
}

function exchange(overrides = {}) {
  return {
    schemaVersion: 1,
    transaktionsId: "tx-exchange-ro",
    ablaufId: "flow-exchange-ro",
    characterId: "My_Merchant",
    input: item(20, "gem0", 0, 5),
    exchangeMenge: 1,
    definitionExchangeMenge: 1,
    inputGesamtwert: 1000,
    contentVerifiziert: true,
    serviceErreichbar: true,
    qFrei: true,
    massExchangeConditionActive: false,
    specialMultiOutputCase: false,
    workspace: {
      freieInventarSlots: 2,
      temporaereWorkspaceSlots: 1,
      bestehendeStacks: [],
      outputs: [{
        name: "reward",
        level: 0,
        menge: 1,
        maximaleMenge: 1,
        variantenFingerprint: null,
      }],
    },
    dropGraphEvidence: {
      schemaVersion: 1,
      sourceSnapshotCommit: "ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4",
      dropGraphFingerprint: "drop-graph-ro",
      bounded: true,
      recursiveBranchesBounded: true,
      specialMultiOutputBounded: true,
      conservativeInventoryOutputsComplete: true,
      rewardDomains: ["inventory", "gold", "empty"],
      outputspaceKlasse: "PROBABILISTIC_BOUNDED_OUTPUT",
      beobachtetAmMs: 100,
      gueltigBisMs: 1_000,
      evidenceFingerprint: "drop-evidence-ro",
    },
    beobachtetAmMs: 100,
    gueltigBisMs: 1_000,
    prestateFingerprint: "pre-exchange",
    ...overrides,
  };
}

function exchangePolicy(overrides = {}) {
  return {
    richtlinienVersion: "exchange-v1",
    maximalesEvidenceAlterMs: 1_000,
    maximalesIdentitaetsAlterMs: 1_000,
    maximalerInputGesamtwert: 10_000,
    erlaubteRewardDomains: [
      "inventory",
      "gold",
      "shells",
      "account_cosmetics",
      "empty",
      "recursive_drop",
    ],
    recursiveDropErlaubt: false,
    specialMultiOutputErlaubt: false,
    massExchangeErlaubt: false,
    ...overrides,
  };
}

function exchangeDeps(k) {
  const dispositionen = new GegenstandsDispositionsLedger();
  dispositionen.setze({
    identitaet: k.input,
    disposition: "VERBRAUCH",
    begruendung: "read-only exchange input",
    policyVersion: "exchange-v1",
  });
  return {
    dispositionen,
    gearAllokation: new GearAllokationsLedger(),
    werttransaktionen: new WerttransaktionsLedger(),
  };
}

function assertNoWrite(result, family) {
  assert.equal(result.family, family);
  assert.equal(result.status, "BEREIT_NO_WRITE");
  assert.equal(result.sessionBound, true);
  assert.equal(result.plannerStatus, "GEPLANT");
  assert.equal(result.authorityIssued, false);
  assert.equal(result.durableIntentWritten, false);
  assert.equal(result.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(result.sameIntentRetry, false);
  assert.equal(result.gameplayWrites, 0);
  assert.equal(result.publicFunctionCalls, 0);
  assert.equal(result.rawWriteCalls, 0);
  assert.equal(result.liveAdapterPresent, false);
  assert.equal(result.liveRunnerPresent, false);
  assert.equal(result.normalRuntimeAllowed, false);
}

test("PR20.8 Upgrade read-only preflight bindet Session und plant keinen Write", () => {
  const k = upgrade();
  const result = pruefePr208UpgradeReadOnlyPreflight(
    session(), k, mutationPolicy(), mutationDeps(k), 200,
  );
  assertNoWrite(result, "UPGRADE");
  assert.equal(result.actionContractId, "AL-ACTION-UPGRADE");
  assert.equal(result.recoveryContractId, "AL-RECOVERY-UPGRADE");
  assert.equal(result.verifierId, "AL-VERIFIER-UPGRADE");
  assert.equal(result.publicFunction, "upgrade");
});

test("PR20.8 Compound read-only preflight bindet Session und plant keinen Write", () => {
  const k = compound();
  const result = pruefePr208CompoundReadOnlyPreflight(
    session(), k, mutationPolicy(), mutationDeps(k), 200,
  );
  assertNoWrite(result, "COMPOUND");
  assert.equal(result.actionContractId, "AL-ACTION-COMPOUND");
  assert.equal(result.recoveryContractId, "AL-RECOVERY-COMPOUND");
  assert.equal(result.verifierId, "AL-VERIFIER-COMPOUND");
  assert.equal(result.publicFunction, "compound");
});

test("PR20.8 Exchange read-only preflight bindet Multi-Domain-Plan ohne Write", () => {
  const k = exchange();
  const result = pruefePr208ExchangeReadOnlyPreflight(
    session(), k, exchangePolicy(), exchangeDeps(k), 200,
  );
  assertNoWrite(result, "EXCHANGE");
  assert.equal(result.actionContractId, "AL-ACTION-EXCHANGE");
  assert.equal(result.recoveryContractId, "AL-RECOVERY-EXCHANGE");
  assert.equal(result.verifierId, "AL-VERIFIER-EXCHANGE");
  assert.equal(result.publicFunction, "exchange");
  assert.equal(result.plannerPlan.fullRewardDomainReconciliationRequired, true);
  assert.equal(result.plannerPlan.promiseRewardIstNurSupportingEvidence, true);
});

test("PR20.8 read-only preflights blockieren Character Session Server und Class Drift vor Planner", () => {
  const drifts = [
    [{ characterId: "Other" }, "PR20_8_READ_ONLY_CHARACTER_DRIFT"],
    [{ sessionId: "Other" }, "PR20_8_READ_ONLY_SESSION_DRIFT"],
    [{ serverRegion: "US" }, "PR20_8_READ_ONLY_SERVER_DRIFT"],
    [{ serverIdentifier: "II" }, "PR20_8_READ_ONLY_SERVER_DRIFT"],
    [{ characterClass: "mage" }, "PR20_8_READ_ONLY_CHARACTER_CLASS_DRIFT"],
  ];
  for (const [patch, expected] of drifts) {
    const k = upgrade();
    const result = pruefePr208UpgradeReadOnlyPreflight(
      session(patch), k, mutationPolicy(), mutationDeps(k), 200,
    );
    assert.equal(result.status, "BLOCKIERT");
    assert.equal(result.grund, expected);
    assert.equal(result.plannerPlan, null);
    assert.equal(result.gameplayWrites, 0);
    assert.equal(result.rawWriteCalls, 0);
  }
});

test("PR20.8 read-only preflight propagiert Planner-Blocker fail-closed", () => {
  {
    const k = upgrade({ qFrei: false });
    const result = pruefePr208UpgradeReadOnlyPreflight(
      session(), k, mutationPolicy(), mutationDeps(k), 200,
    );
    assert.equal(result.status, "BLOCKIERT");
    assert.equal(result.grund, "Q_NICHT_FREI");
  }
  {
    const k = compound({ serviceErreichbar: false });
    const result = pruefePr208CompoundReadOnlyPreflight(
      session(), k, mutationPolicy(), mutationDeps(k), 200,
    );
    assert.equal(result.status, "BLOCKIERT");
    assert.equal(result.grund, "SERVICE_NICHT_ERREICHBAR");
  }
  {
    const k = exchange({
      dropGraphEvidence: {
        ...exchange().dropGraphEvidence,
        bounded: false,
      },
    });
    const result = pruefePr208ExchangeReadOnlyPreflight(
      session(), k, exchangePolicy(), exchangeDeps(k), 200,
    );
    assert.equal(result.status, "BLOCKIERT");
    assert.equal(result.grund, "DROP_GRAPH_UNBEGRENZT");
  }
});

test("PR20.8 read-only Foundation enthaelt keinen mutierenden API-Aufruf", () => {
  const source = fs.readFileSync(
    "grundlage/quelle/merchant/pr20-8-wertmutation-read-only-preflight.ts",
    "utf8",
  );
  for (const marker of [
    "upgrade(",
    "compound(",
    "exchange(",
    "socket.emit(",
    ".socket.emit(",
    "api_call(",
    "send_item(",
    "send_gold(",
  ]) assert.equal(source.includes(marker), false, marker);
  for (const marker of [
    "authorityIssued: false",
    "durableIntentWritten: false",
    'sendBoundaryState: "NICHT_GESENDET"',
    "sameIntentRetry: false",
    "gameplayWrites: 0",
    "publicFunctionCalls: 0",
    "rawWriteCalls: 0",
    "liveAdapterPresent: false",
    "liveRunnerPresent: false",
    "normalRuntimeAllowed: false",
  ]) assert.ok(source.includes(marker), marker);
});
