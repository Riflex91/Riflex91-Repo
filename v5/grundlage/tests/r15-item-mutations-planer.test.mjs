import test from "node:test";
import assert from "node:assert/strict";

import {
  GearAllokationsLedger,
  GegenstandsDispositionsLedger,
  WerttransaktionsLedger,
  planeItemMutation,
} from "../../erzeugt/index.js";

function item(
  index,
  name,
  level = 0,
  menge = 1,
  overrides = {},
) {
  return {
    schemaVersion: 1,
    characterId: "merchant",
    inventarIndex: index,
    name,
    level,
    menge,
    beobachtungsFingerprint: "item-fp-" + String(index),
    beobachtetAmMs: 100,
    ...overrides,
  };
}

function richtlinie(overrides = {}) {
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

function pfad(art, overrides = {}) {
  return {
    schemaVersion: 1,
    art,
    pfad: art === "UPGRADE"
      ? "NORMAL_LEVEL_UPGRADE"
      : "NORMAL_COMPOUND",
    previewNurPlanungsEvidence: true,
    zielVerlustBeiUpgradeFehler: art === "UPGRADE",
    alleDreiInputsVerlustBeiCompoundFehler: art === "COMPOUND",
    beobachtetAmMs: 100,
    gueltigBisMs: 1_000,
    evidenceFingerprint: "path-fp-" + art.toLowerCase(),
    ...overrides,
  };
}

function upgradeKandidat(overrides = {}) {
  return {
    schemaVersion: 1,
    transaktionsId: "tx-upgrade-1",
    ablaufId: "flow-upgrade-1",
    characterId: "merchant",
    art: "UPGRADE",
    ziele: [item(1, "sword", 2)],
    scroll: item(2, "scroll0", 0, 10),
    scrollMenge: 1,
    offering: null,
    offeringMenge: 0,
    inputGesamtwert: 10_000,
    contentVerifiziert: true,
    serviceErreichbar: true,
    qFrei: true,
    workspace: {
      freieInventarSlots: 2,
      temporaereWorkspaceSlots: 1,
      bestehendeStacks: [],
      outputs: [],
    },
    pfadEvidence: pfad("UPGRADE"),
    beobachtetAmMs: 100,
    gueltigBisMs: 1_000,
    prestateFingerprint: "pre-upgrade-1",
    ...overrides,
  };
}

function compoundKandidat(overrides = {}) {
  return {
    schemaVersion: 1,
    transaktionsId: "tx-compound-1",
    ablaufId: "flow-compound-1",
    characterId: "merchant",
    art: "COMPOUND",
    ziele: [
      item(10, "ring", 1),
      item(11, "ring", 1),
      item(12, "ring", 1),
    ],
    scroll: item(13, "cscroll0", 0, 10),
    scrollMenge: 1,
    offering: null,
    offeringMenge: 0,
    inputGesamtwert: 30_000,
    contentVerifiziert: true,
    serviceErreichbar: true,
    qFrei: true,
    workspace: {
      freieInventarSlots: 1,
      temporaereWorkspaceSlots: 1,
      bestehendeStacks: [],
      outputs: [],
    },
    pfadEvidence: pfad("COMPOUND"),
    beobachtetAmMs: 100,
    gueltigBisMs: 1_000,
    prestateFingerprint: "pre-compound-1",
    ...overrides,
  };
}

function dispositionenFuer(kandidat) {
  const ledger = new GegenstandsDispositionsLedger();
  for (const ziel of kandidat.ziele) {
    ledger.setze({
      identitaet: ziel,
      disposition: kandidat.art,
      begruendung: "mutation target",
      policyVersion: "mutation-v1",
    });
  }
  ledger.setze({
    identitaet: kandidat.scroll,
    disposition: "VERBRAUCH",
    begruendung: "mutation scroll",
    policyVersion: "mutation-v1",
  });
  if (kandidat.offering !== null) {
    ledger.setze({
      identitaet: kandidat.offering,
      disposition: "VERBRAUCH",
      begruendung: "mutation offering",
      policyVersion: "mutation-v1",
    });
  }
  return ledger;
}

function abhaengigkeiten(kandidat, overrides = {}) {
  return {
    dispositionen: dispositionenFuer(kandidat),
    gearAllokation: new GearAllokationsLedger(),
    werttransaktionen: new WerttransaktionsLedger(),
    ...overrides,
  };
}

test("normaler Upgrade-Pfad wird nur als gebundener Werttransaktions-Intent geplant", () => {
  const kandidat = upgradeKandidat();
  const deps = abhaengigkeiten(kandidat);

  const plan = planeItemMutation(
    kandidat,
    richtlinie(),
    deps,
    200,
  );

  assert.equal(plan.art, "GEPLANT");
  assert.equal(plan.grund, "OK");
  assert.equal(plan.actionContractId, "AL-ACTION-UPGRADE");
  assert.equal(plan.recoveryContractId, "AL-RECOVERY-UPGRADE");
  assert.equal(plan.verifierId, "AL-VERIFIER-UPGRADE");
  assert.equal(plan.werttransaktion?.zustand, "GEPLANT");
  assert.equal(plan.werttransaktion?.sameIntentErneutSenden, false);
  assert.equal(plan.reservierungen.length, 2);
  assert.ok(plan.ressourcenIds.length >= 5);
  assert.equal(plan.previewIstKeineExecutionAuthority, true);
  assert.equal(plan.unknownOutcomeKeinBlindRetry, true);
  assert.equal(plan.ausfuehrungsAutoritaet, false);
  assert.equal(plan.gameplayAutoritaet, false);
  assert.equal(plan.rawWriteAutoritaet, false);
});

test("normaler Compound-Pfad verlangt drei gleiche physische Inputs", () => {
  const kandidat = compoundKandidat();
  const deps = abhaengigkeiten(kandidat);

  const plan = planeItemMutation(
    kandidat,
    richtlinie(),
    deps,
    200,
  );

  assert.equal(plan.art, "GEPLANT");
  assert.equal(plan.actionContractId, "AL-ACTION-COMPOUND");
  assert.equal(plan.recoveryContractId, "AL-RECOVERY-COMPOUND");
  assert.equal(plan.verifierId, "AL-VERIFIER-COMPOUND");
  assert.equal(plan.reservierungen.length, 4);
  assert.equal(
    plan.reservierungen.filter(x => x.rolle === "ZIEL").length,
    3,
  );

  assert.throws(
    () => planeItemMutation(
      compoundKandidat({
        transaktionsId: "tx-compound-bad",
        ziele: [
          item(20, "ring", 1),
          item(21, "ring", 2),
          item(22, "ring", 1),
        ],
      }),
      richtlinie(),
      abhaengigkeiten(compoundKandidat()),
      200,
    ),
    /ITEM_MUTATION_COMPOUND_INPUTS_NICHT_GLEICH/,
  );
});

test("Verlust-Risiko muss explizit durch Richtlinie erlaubt sein", () => {
  const upgrade = upgradeKandidat();
  const upgradePlan = planeItemMutation(
    upgrade,
    richtlinie({ upgradeItemverlustErlaubt: false }),
    abhaengigkeiten(upgrade),
    200,
  );
  assert.equal(upgradePlan.art, "GESPERRT");
  assert.equal(upgradePlan.grund, "RISIKO_POLICY_BLOCK");

  const compound = compoundKandidat();
  const compoundPlan = planeItemMutation(
    compound,
    richtlinie({ compoundDreifachverlustErlaubt: false }),
    abhaengigkeiten(compound),
    200,
  );
  assert.equal(compoundPlan.art, "GESPERRT");
  assert.equal(compoundPlan.grund, "RISIKO_POLICY_BLOCK");
});

test("Sonderpfade werden nicht still als normaler Upgrade- oder Compound-Pfad behandelt", () => {
  const kandidat = upgradeKandidat({
    pfadEvidence: pfad("UPGRADE", {
      pfad: "NORMAL_COMPOUND",
    }),
  });
  const plan = planeItemMutation(
    kandidat,
    richtlinie(),
    abhaengigkeiten(kandidat),
    200,
  );
  assert.equal(plan.art, "GESPERRT");
  assert.equal(plan.grund, "PFAD_NICHT_FREIGEGEBEN");

  const preserve = upgradeKandidat({
    transaktionsId: "tx-upgrade-preserve",
    pfadEvidence: pfad("UPGRADE", {
      zielVerlustBeiUpgradeFehler: false,
    }),
  });
  const preservePlan = planeItemMutation(
    preserve,
    richtlinie(),
    abhaengigkeiten(preserve),
    200,
  );
  assert.equal(preservePlan.art, "GESPERRT");
  assert.equal(preservePlan.grund, "PFAD_NICHT_FREIGEGEBEN");
});

test("Disposition bleibt zentrale Wahrheit fuer Targets und Verbrauchsmittel", () => {
  const kandidat = upgradeKandidat();
  const dispositionen = dispositionenFuer(kandidat);
  dispositionen.setze({
    identitaet: kandidat.ziele[0],
    disposition: "BEHALTEN",
    begruendung: "protected",
    policyVersion: "mutation-v1",
  });

  const plan = planeItemMutation(
    kandidat,
    richtlinie(),
    abhaengigkeiten(kandidat, { dispositionen }),
    200,
  );
  assert.equal(plan.art, "GESPERRT");
  assert.equal(plan.grund, "DISPOSITION_BLOCK");
});

test("aktive Item-Reservierung blockiert konkurrierende Mutation", () => {
  const kandidat = upgradeKandidat();
  const dispositionen = dispositionenFuer(kandidat);
  dispositionen.reserviere(
    "existing-reservation",
    "other-flow",
    kandidat.ziele[0],
    "UPGRADE",
    1,
  );

  const plan = planeItemMutation(
    kandidat,
    richtlinie(),
    abhaengigkeiten(kandidat, { dispositionen }),
    200,
  );
  assert.equal(plan.art, "GESPERRT");
  assert.equal(plan.grund, "AKTIVE_ITEM_RESERVIERUNG");
});

test("aktives CAP-033 Gear-Ziel schuetzt physischen Kandidaten vor Mutation", () => {
  const kandidat = upgradeKandidat();
  const gear = new GearAllokationsLedger();
  gear.reserviere({
    schemaVersion: 1,
    gearZielId: "gear-1",
    recipient: {
      schemaVersion: 1,
      accountId: "account-1",
      characterId: "warrior",
      sessionId: "warrior-session",
      serverRegion: "EU",
      serverIdentifier: "I",
      rosterEpoche: 1,
      rosterFingerprint: "roster-fp",
    },
    slot: "mainhand",
    prioritaet: "FARMER",
    aktuellerScore: 100,
    minimaleVerbesserung: 5,
    kandidat: {
      physischeKennung: [
        kandidat.ziele[0].characterId,
        String(kandidat.ziele[0].inventarIndex),
        kandidat.ziele[0].beobachtungsFingerprint,
      ].join(":"),
      name: kandidat.ziele[0].name,
      level: kandidat.ziele[0].level,
      score: 120,
      beobachtungsFingerprint:
        kandidat.ziele[0].beobachtungsFingerprint,
    },
    erstelltAmMs: 100,
    gueltigBisMs: 1_000,
  });

  const plan = planeItemMutation(
    kandidat,
    richtlinie(),
    abhaengigkeiten(kandidat, { gearAllokation: gear }),
    200,
  );
  assert.equal(plan.art, "GESPERRT");
  assert.equal(plan.grund, "GEAR_KANDIDAT_RESERVIERT");
});

test("Workspace, q und Service-Reachability blockieren fail-closed", () => {
  const workspace = upgradeKandidat({
    workspace: {
      freieInventarSlots: 0,
      temporaereWorkspaceSlots: 1,
      bestehendeStacks: [],
      outputs: [],
    },
  });
  assert.equal(
    planeItemMutation(
      workspace,
      richtlinie(),
      abhaengigkeiten(workspace),
      200,
    ).grund,
    "WORKSPACE_FEHLT",
  );

  const q = upgradeKandidat({
    transaktionsId: "tx-q-busy",
    qFrei: false,
  });
  assert.equal(
    planeItemMutation(
      q,
      richtlinie(),
      abhaengigkeiten(q),
      200,
    ).grund,
    "Q_NICHT_FREI",
  );

  const service = upgradeKandidat({
    transaktionsId: "tx-service-away",
    serviceErreichbar: false,
  });
  assert.equal(
    planeItemMutation(
      service,
      richtlinie(),
      abhaengigkeiten(service),
      200,
    ).grund,
    "SERVICE_NICHT_ERREICHBAR",
  );
});

test("stale Evidence und stale physische Identitaet autorisieren keine Mutation", () => {
  const staleEvidence = upgradeKandidat({
    beobachtetAmMs: 0,
    gueltigBisMs: 500,
  });
  assert.equal(
    planeItemMutation(
      staleEvidence,
      richtlinie({ maximalesEvidenceAlterMs: 100 }),
      abhaengigkeiten(staleEvidence),
      200,
    ).grund,
    "EVIDENCE_STALE",
  );

  const staleItem = upgradeKandidat({
    transaktionsId: "tx-stale-item",
    ziele: [item(1, "sword", 2, 1, {
      beobachtetAmMs: 0,
    })],
  });
  assert.equal(
    planeItemMutation(
      staleItem,
      richtlinie({ maximalesIdentitaetsAlterMs: 100 }),
      abhaengigkeiten(staleItem),
      200,
    ).grund,
    "IDENTITAET_STALE",
  );
});

test("Value-Budget, Ziellevel und Offering-Policy werden explizit begrenzt", () => {
  const wert = upgradeKandidat({
    inputGesamtwert: 100_001,
  });
  assert.equal(
    planeItemMutation(
      wert,
      richtlinie({ maximalerInputGesamtwert: 100_000 }),
      abhaengigkeiten(wert),
      200,
    ).grund,
    "INPUT_WERT_BUDGET_UEBERSCHRITTEN",
  );

  const level = upgradeKandidat({
    transaktionsId: "tx-level-high",
    ziele: [item(1, "sword", 6)],
  });
  assert.equal(
    planeItemMutation(
      level,
      richtlinie({ maximalerZielLevelVorMutation: 5 }),
      abhaengigkeiten(level),
      200,
    ).grund,
    "ZIEL_LEVEL_UEBER_GRENZE",
  );

  const offering = item(3, "offering", 0, 1);
  const withOffering = upgradeKandidat({
    transaktionsId: "tx-offering",
    offering,
    offeringMenge: 1,
  });
  assert.equal(
    planeItemMutation(
      withOffering,
      richtlinie({ offeringErlaubt: false }),
      abhaengigkeiten(withOffering),
      200,
    ).grund,
    "RISIKO_POLICY_BLOCK",
  );
});

test("q oder Placeholder beweist accepted in-flight und erlaubt keinen Blind-Retry", () => {
  const kandidat = upgradeKandidat();
  const werttransaktionen = new WerttransaktionsLedger();
  const plan = planeItemMutation(
    kandidat,
    richtlinie(),
    abhaengigkeiten(kandidat, { werttransaktionen }),
    200,
  );
  assert.equal(plan.art, "GEPLANT");

  werttransaktionen.markiereSendMoeglich(kandidat.transaktionsId);
  const inflight = werttransaktionen.beobachteInFlight(
    kandidat.transaktionsId,
    {
      schemaVersion: 1,
      beobachtetAmMs: 210,
      evidenceFingerprint: "inflight-fp",
      qAktiv: true,
      placeholderAnzahl: 1,
      consumableDeltaBeobachtet: true,
    },
  );
  assert.equal(inflight.zustand, "AKZEPTIERT_IN_FLIGHT");
  assert.equal(inflight.sameIntentErneutSenden, false);

  const nachRestart = new WerttransaktionsLedger();
  nachRestart.importiereNachRestart(werttransaktionen.snapshot());
  const recovered = nachRestart.finde(kandidat.transaktionsId);
  assert.equal(recovered.zustand, "ABGLEICH_ERFORDERLICH");
  assert.equal(recovered.sameIntentErneutSenden, false);
});

test("doppelte TransaktionsId wird als Planungsdrift blockiert", () => {
  const kandidat = upgradeKandidat();
  const werttransaktionen = new WerttransaktionsLedger();
  const deps = abhaengigkeiten(kandidat, { werttransaktionen });
  const first = planeItemMutation(
    kandidat,
    richtlinie(),
    deps,
    200,
  );
  assert.equal(first.art, "GEPLANT");

  const second = planeItemMutation(
    kandidat,
    richtlinie(),
    deps,
    201,
  );
  assert.equal(second.art, "GESPERRT");
  assert.equal(second.grund, "TRANSAKTION_BEREITS_VORHANDEN");
});
