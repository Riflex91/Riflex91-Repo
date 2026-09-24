import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  GegenstandsDispositionsLedger,
  WerttransaktionsLedger,
  planeExchangeProduktion,
  PR20_8_EXCHANGE_SOURCE_SNAPSHOT_COMMIT,
} from "../../erzeugt/index.js";

function item(overrides = {}) {
  return {
    schemaVersion: 1,
    characterId: "merchant",
    inventarIndex: 5,
    name: "gem0",
    level: 0,
    menge: 5,
    beobachtungsFingerprint: "exchange-item-fp",
    beobachtetAmMs: 100,
    ...overrides,
  };
}

function dropGraph(overrides = {}) {
  return {
    schemaVersion: 1,
    sourceSnapshotCommit: PR20_8_EXCHANGE_SOURCE_SNAPSHOT_COMMIT,
    dropGraphFingerprint: "drop-graph-fp",
    bounded: true,
    recursiveBranchesBounded: true,
    specialMultiOutputBounded: true,
    conservativeInventoryOutputsComplete: true,
    rewardDomains: ["inventory", "gold", "empty"],
    outputspaceKlasse: "PROBABILISTIC_BOUNDED_OUTPUT",
    beobachtetAmMs: 100,
    gueltigBisMs: 1_000,
    evidenceFingerprint: "drop-evidence-fp",
    ...overrides,
  };
}

function kandidat(overrides = {}) {
  return {
    schemaVersion: 1,
    transaktionsId: "tx-exchange-1",
    ablaufId: "flow-exchange-1",
    characterId: "merchant",
    input: item(),
    exchangeMenge: 1,
    definitionExchangeMenge: 1,
    inputGesamtwert: 1_000,
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
    dropGraphEvidence: dropGraph(),
    beobachtetAmMs: 100,
    gueltigBisMs: 1_000,
    prestateFingerprint: "exchange-prestate-fp",
    ...overrides,
  };
}

function richtlinie(overrides = {}) {
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

function dispositionenFuer(k) {
  const ledger = new GegenstandsDispositionsLedger();
  ledger.setze({
    identitaet: k.input,
    disposition: "VERBRAUCH",
    begruendung: "exchange input",
    policyVersion: "exchange-v1",
  });
  return ledger;
}

function deps(k, overrides = {}) {
  return {
    dispositionen: dispositionenFuer(k),
    gearAllokation: { snapshot: () => [] },
    werttransaktionen: new WerttransaktionsLedger(),
    ...overrides,
  };
}

test("PR20.8 Exchange plant nur einen gebundenen NO-WRITE Werttransaktions-Intent", () => {
  const k = kandidat();
  const d = deps(k);
  const plan = planeExchangeProduktion(k, richtlinie(), d, 200);

  assert.equal(plan.art, "GEPLANT");
  assert.equal(plan.grund, "OK");
  assert.equal(plan.actionContractId, "AL-ACTION-EXCHANGE");
  assert.equal(plan.recoveryContractId, "AL-RECOVERY-EXCHANGE");
  assert.equal(plan.verifierId, "AL-VERIFIER-EXCHANGE");
  assert.equal(plan.publicFunction, "exchange");
  assert.equal(plan.sourceSnapshotCommit,
    "ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4");
  assert.equal(plan.werttransaktion?.art, "EXCHANGE");
  assert.equal(plan.werttransaktion?.zustand, "GEPLANT");
  assert.equal(plan.werttransaktion?.sameIntentErneutSenden, false);
  assert.equal(plan.inputReservierung.disposition, "VERBRAUCH");
  assert.equal(plan.inputReservierung.menge, 1);
  assert.deepEqual(plan.rewardDomains, ["empty", "gold", "inventory"]);
  assert.ok(plan.ressourcenIds.length >= 7);
  assert.equal(plan.promiseRewardIstNurSupportingEvidence, true);
  assert.equal(plan.fullRewardDomainReconciliationRequired, true);
  assert.equal(plan.placeholderUndQAcceptedInFlight, true);
  assert.equal(plan.exactPhysicalIndexMustBeReresolvedBeforeSend, true);
  assert.equal(plan.previewIstKeineExecutionAuthority, true);
  assert.equal(plan.unknownOutcomeKeinBlindRetry, true);
  assert.equal(plan.sameIntentRetry, false);
  assert.equal(plan.ausfuehrungsAutoritaet, false);
  assert.equal(plan.gameplayAutoritaet, false);
  assert.equal(plan.rawWriteAutoritaet, false);
});

test("PR20.8 Exchange blockiert q-, Mengen-, Source- und Drop-Graph-Drift fail-closed", () => {
  for (const [expected, patch] of [
    ["Q_NICHT_FREI", { qFrei: false }],
    ["EXCHANGE_MENGE_DRIFT", { exchangeMenge: 2 }],
    ["INPUT_MENGE_UNZUREICHEND", {
      exchangeMenge: 6,
      definitionExchangeMenge: 6,
    }],
    ["SOURCE_SNAPSHOT_DRIFT", {
      dropGraphEvidence: dropGraph({ sourceSnapshotCommit: "drift" }),
    }],
    ["DROP_GRAPH_UNBEGRENZT", {
      dropGraphEvidence: dropGraph({ bounded: false }),
    }],
  ]) {
    const k = kandidat({
      transaktionsId: "tx-" + expected.toLowerCase(),
      ...patch,
    });
    const plan = planeExchangeProduktion(k, richtlinie(), deps(k), 200);
    assert.equal(plan.art, "GESPERRT", expected);
    assert.equal(plan.grund, expected, expected);
    assert.equal(plan.werttransaktion, null, expected);
  }
});

test("PR20.8 Exchange blockiert unvollstaendigen Outputspace und Spezialpfade ohne Policy", () => {
  const cases = [
    ["OUTPUTSPACE_EVIDENCE_UNVOLLSTAENDIG", kandidat({
      transaktionsId: "tx-output",
      dropGraphEvidence: dropGraph({
        conservativeInventoryOutputsComplete: false,
      }),
    }), richtlinie()],
    ["WORKSPACE_PLACEHOLDER_FEHLT", kandidat({
      transaktionsId: "tx-placeholder",
      workspace: {
        freieInventarSlots: 2,
        temporaereWorkspaceSlots: 0,
        bestehendeStacks: [],
        outputs: [{
          name: "reward",
          level: 0,
          menge: 1,
          maximaleMenge: 1,
          variantenFingerprint: null,
        }],
      },
    }), richtlinie()],
    ["SPECIAL_MULTI_OUTPUT_POLICY_BLOCK", kandidat({
      transaktionsId: "tx-special",
      specialMultiOutputCase: true,
    }), richtlinie()],
    ["MASS_EXCHANGE_POLICY_BLOCK", kandidat({
      transaktionsId: "tx-mass",
      massExchangeConditionActive: true,
    }), richtlinie()],
    ["RECURSIVE_DROP_POLICY_BLOCK", kandidat({
      transaktionsId: "tx-recursive",
      dropGraphEvidence: dropGraph({
        rewardDomains: ["inventory", "recursive_drop"],
        outputspaceKlasse: "RECURSIVE_DROP_OUTPUT",
      }),
    }), richtlinie()],
  ];
  for (const [expected, k, policy] of cases) {
    const plan = planeExchangeProduktion(k, policy, deps(k), 200);
    assert.equal(plan.art, "GESPERRT", expected);
    assert.equal(plan.grund, expected, expected);
  }
});

test("PR20.8 Exchange erlaubt rekursiven Pfad nur bounded, gepinnt und explizit", () => {
  const k = kandidat({
    transaktionsId: "tx-recursive-ok",
    dropGraphEvidence: dropGraph({
      rewardDomains: ["inventory", "gold", "recursive_drop"],
      outputspaceKlasse: "RECURSIVE_DROP_OUTPUT",
      recursiveBranchesBounded: true,
    }),
  });
  const plan = planeExchangeProduktion(
    k,
    richtlinie({ recursiveDropErlaubt: true }),
    deps(k),
    200,
  );
  assert.equal(plan.art, "GEPLANT");
  assert.equal(plan.grund, "OK");
  assert.deepEqual(plan.rewardDomains, ["gold", "inventory", "recursive_drop"]);
});

test("PR20.8 Exchange blockiert Disposition, aktive Reservierung, Gear-Konflikt und doppelte Transaktion", () => {
  {
    const k = kandidat({ transaktionsId: "tx-disposition" });
    const dispositionen = new GegenstandsDispositionsLedger();
    dispositionen.setze({
      identitaet: k.input,
      disposition: "BEHALTEN",
      begruendung: "protected",
      policyVersion: "exchange-v1",
    });
    const plan = planeExchangeProduktion(
      k,
      richtlinie(),
      deps(k, { dispositionen }),
      200,
    );
    assert.equal(plan.grund, "DISPOSITION_BLOCK");
  }
  {
    const k = kandidat({ transaktionsId: "tx-reserved" });
    const dispositionen = dispositionenFuer(k);
    dispositionen.reserviere(
      "reservation-1",
      "flow-other",
      k.input,
      "VERBRAUCH",
      1,
    );
    const plan = planeExchangeProduktion(
      k,
      richtlinie(),
      deps(k, { dispositionen }),
      200,
    );
    assert.equal(plan.grund, "AKTIVE_ITEM_RESERVIERUNG");
  }
  {
    const k = kandidat({ transaktionsId: "tx-gear" });
    const physischeKennung =
      [k.input.characterId, k.input.inventarIndex, k.input.beobachtungsFingerprint]
        .join(":");
    const gearAllokation = {
      snapshot: () => [{
        status: "RESERVIERT",
        ziel: { kandidat: { physischeKennung } },
      }],
    };
    const plan = planeExchangeProduktion(
      k,
      richtlinie(),
      deps(k, { gearAllokation }),
      200,
    );
    assert.equal(plan.grund, "GEAR_KANDIDAT_RESERVIERT");
  }
  {
    const k = kandidat({ transaktionsId: "tx-duplicate" });
    const werttransaktionen = new WerttransaktionsLedger();
    werttransaktionen.plane({
      schemaVersion: 1,
      transaktionsId: k.transaktionsId,
      ablaufId: "existing-flow",
      characterId: k.characterId,
      art: "EXCHANGE",
      actionContractId: "AL-ACTION-EXCHANGE",
      recoveryContractId: "AL-RECOVERY-EXCHANGE",
      physischeInputKennungen: ["existing-input"],
      prestateFingerprint: "existing-prestate",
    });
    const plan = planeExchangeProduktion(
      k,
      richtlinie(),
      deps(k, { werttransaktionen }),
      200,
    );
    assert.equal(plan.grund, "TRANSAKTION_BEREITS_VORHANDEN");
  }
});

test("PR20.8 Exchange q/Placeholder bedeutet accepted-in-flight und Restart nie Resend", () => {
  const k = kandidat({ transaktionsId: "tx-inflight" });
  const werttransaktionen = new WerttransaktionsLedger();
  const plan = planeExchangeProduktion(
    k,
    richtlinie(),
    deps(k, { werttransaktionen }),
    200,
  );
  assert.equal(plan.art, "GEPLANT");

  werttransaktionen.markiereSendMoeglich(k.transaktionsId);
  const inflight = werttransaktionen.beobachteInFlight(
    k.transaktionsId,
    {
      schemaVersion: 1,
      beobachtetAmMs: 210,
      evidenceFingerprint: "exchange-q-placeholder",
      qAktiv: true,
      placeholderAnzahl: 1,
      consumableDeltaBeobachtet: true,
    },
  );
  assert.equal(inflight.zustand, "AKZEPTIERT_IN_FLIGHT");
  assert.equal(inflight.sameIntentErneutSenden, false);

  const recoveredLedger = new WerttransaktionsLedger();
  recoveredLedger.importiereNachRestart(werttransaktionen.snapshot());
  const recovered = recoveredLedger.finde(k.transaktionsId);
  assert.equal(recovered.zustand, "ABGLEICH_ERFORDERLICH");
  assert.equal(recovered.sameIntentErneutSenden, false);
});

test("PR20.8 Exchange Foundation enthaelt keinen Gameplay-Write- oder Raw-Bypass", () => {
  const source = fs.readFileSync(
    "grundlage/quelle/merchant/exchange-produktions-planer.ts",
    "utf8",
  );
  for (const marker of [
    "exchange(",
    "socket.emit(",
    ".socket.emit(",
    "api_call(",
    "buy(",
    "sell(",
    "upgrade(",
    "compound(",
    "send_item(",
    "send_gold(",
  ]) assert.equal(source.includes(marker), false, marker);
  for (const marker of [
    "previewIstKeineExecutionAuthority: true",
    "unknownOutcomeKeinBlindRetry: true",
    "sameIntentRetry: false",
    "ausfuehrungsAutoritaet: false",
    "gameplayAutoritaet: false",
    "rawWriteAutoritaet: false",
    "fullRewardDomainReconciliationRequired: true",
  ]) assert.ok(source.includes(marker), marker);
});
