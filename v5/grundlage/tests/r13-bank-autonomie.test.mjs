import test from "node:test";
import assert from "node:assert/strict";

import {
  MerchantWorkflowProvider,
  erzeugeBankAutonomieDemand,
  planeBankAutonomie,
} from "../../erzeugt/index.js";

const wissensSnapshot = {
  gitCommit: "a".repeat(40),
  quellenSha256: ["b".repeat(64)],
};

function snapshot(eintraege, overrides = {}) {
  return {
    schemaVersion: 1,
    accountId: "account-1",
    beobachtetAmMs: 100,
    gueltigBisMs: 1_000,
    mountEpoche: 2,
    leaseEpoche: 7,
    fingerprint: "f".repeat(64),
    eintraege,
    ...overrides,
  };
}

function basisAnfrage(overrides = {}) {
  return {
    snapshot: snapshot([]),
    packs: [
      {
        pack: "items0",
        gesamtSlots: 8,
        belegteSlots: 0,
      },
    ],
    stapellimits: [],
    erweiterungsOptionen: [],
    budgets: [],
    freieInventarSlots: 4,
    richtlinie: {
      richtlinienVersion: "bank-v1",
      minimaleFreieSlots: 2,
      zielFreieSlots: 4,
      konsolidierungsWorkspaceSlots: 1,
      maximaleKonsolidierungsGruppen: 8,
      erweiterungErlaubt: true,
    },
    ...overrides,
  };
}

test("Bank-Autonomie tut bei ausreichender Kapazitaet nichts", () => {
  const entscheidung = planeBankAutonomie(
    basisAnfrage(),
    200,
  );

  assert.equal(entscheidung.art, "KEINE_AKTION");
  assert.equal(entscheidung.freieSlotsVorher, 8);
  assert.equal(entscheidung.erwarteteFreieSlotsNachPlan, 8);
  assert.equal(entscheidung.planungsNachweis, true);
  assert.equal(entscheidung.ausfuehrungsAutoritaet, false);
  assert.equal(entscheidung.gameplayAutoritaet, false);
  assert.equal(entscheidung.rawWriteAutoritaet, false);
});

test("Bank-Autonomie konsolidiert exakt kompatible Stacks vor Erweiterung", () => {
  const eintraege = [
    {
      pack: "items0",
      slot: 0,
      name: "hpot1",
      level: 0,
      menge: 40,
      variantenFingerprint: "normal",
    },
    {
      pack: "items0",
      slot: 1,
      name: "hpot1",
      level: 0,
      menge: 30,
      variantenFingerprint: "normal",
    },
    {
      pack: "items0",
      slot: 2,
      name: "mpot1",
      level: 0,
      menge: 80,
      variantenFingerprint: "normal",
    },
    {
      pack: "items0",
      slot: 3,
      name: "mpot1",
      level: 0,
      menge: 20,
      variantenFingerprint: "normal",
    },
  ];
  const entscheidung = planeBankAutonomie(
    basisAnfrage({
      snapshot: snapshot(eintraege),
      packs: [{
        pack: "items0",
        gesamtSlots: 4,
        belegteSlots: 4,
      }],
      stapellimits: [
        {
          name: "hpot1",
          level: 0,
          variantenFingerprint: "normal",
          maximaleMenge: 100,
        },
        {
          name: "mpot1",
          level: 0,
          variantenFingerprint: "normal",
          maximaleMenge: 100,
        },
      ],
      erweiterungsOptionen: [{
        optionId: "items1-gold",
        pack: "items1",
        waehrung: "GOLD",
        kosten: 100_000,
        neueSlots: 42,
        prioritaetsRang: 10,
        actionContractId: "AL-ACTION-OPEN-BANK-PACK",
        recoveryContractId: "AL-RECOVERY-OPEN-BANK-PACK",
      }],
      budgets: [{
        waehrung: "GOLD",
        verfuegbarNachReservierungen: 1_000_000,
        sicherheitsReserveNachgewiesen: true,
      }],
    }),
    200,
  );

  assert.equal(entscheidung.art, "KONSOLIDIEREN");
  assert.equal(entscheidung.konsolidierungsGruppen.length, 2);
  assert.equal(
    entscheidung.konsolidierungsGruppen
      .reduce((summe, x) => summe + x.freiwerdendeSlots, 0),
    2,
  );
  assert.equal(entscheidung.erweiterung, null);
  assert.deepEqual(
    entscheidung.gruende,
    ["BANK_KONSOLIDIERUNG_VOR_ERWEITERUNG"],
  );
});

test("Bank-Autonomie erweitert nur mit explizitem Budgetnachweis und Recovery-Vertrag", () => {
  const eintraege = [
    {
      pack: "items0",
      slot: 0,
      name: "helmet",
      level: 7,
      menge: 1,
      variantenFingerprint: "locked",
    },
    {
      pack: "items0",
      slot: 1,
      name: "armor",
      level: 7,
      menge: 1,
      variantenFingerprint: "locked",
    },
  ];

  const entscheidung = planeBankAutonomie(
    basisAnfrage({
      snapshot: snapshot(eintraege),
      packs: [{
        pack: "items0",
        gesamtSlots: 2,
        belegteSlots: 2,
      }],
      erweiterungsOptionen: [{
        optionId: "items1-gold",
        pack: "items1",
        waehrung: "GOLD",
        kosten: 500_000,
        neueSlots: 42,
        prioritaetsRang: 20,
        actionContractId: "AL-ACTION-OPEN-BANK-PACK",
        recoveryContractId: "AL-RECOVERY-OPEN-BANK-PACK",
      }],
      budgets: [{
        waehrung: "GOLD",
        verfuegbarNachReservierungen: 500_000,
        sicherheitsReserveNachgewiesen: true,
      }],
    }),
    200,
  );

  assert.equal(entscheidung.art, "ERWEITERN");
  assert.equal(entscheidung.erweiterung?.optionId, "items1-gold");
  assert.equal(
    entscheidung.erweiterung?.actionContractId,
    "AL-ACTION-OPEN-BANK-PACK",
  );
  assert.equal(
    entscheidung.erweiterung?.recoveryContractId,
    "AL-RECOVERY-OPEN-BANK-PACK",
  );
});

test("Bank-Autonomie blockiert statt unsicher zu verkaufen", () => {
  const eintraege = [
    {
      pack: "items0",
      slot: 0,
      name: "rareitem",
      level: 0,
      menge: 1,
      variantenFingerprint: "rare",
    },
    {
      pack: "items0",
      slot: 1,
      name: "rareitem2",
      level: 0,
      menge: 1,
      variantenFingerprint: "rare",
    },
  ];
  const entscheidung = planeBankAutonomie(
    basisAnfrage({
      snapshot: snapshot(eintraege),
      packs: [{
        pack: "items0",
        gesamtSlots: 2,
        belegteSlots: 2,
      }],
      erweiterungsOptionen: [{
        optionId: "items1-gold",
        pack: "items1",
        waehrung: "GOLD",
        kosten: 500_000,
        neueSlots: 42,
        prioritaetsRang: 10,
        actionContractId: "AL-ACTION-OPEN-BANK-PACK",
        recoveryContractId: "AL-RECOVERY-OPEN-BANK-PACK",
      }],
      budgets: [{
        waehrung: "GOLD",
        verfuegbarNachReservierungen: 100_000,
        sicherheitsReserveNachgewiesen: true,
      }],
    }),
    200,
  );

  assert.equal(entscheidung.art, "GESPERRT");
  assert.ok(
    entscheidung.gruende.includes("BANK_KEINE_SICHERE_KAPAZITAETSAKTION"),
  );
  assert.equal(
    erzeugeBankAutonomieDemand(entscheidung, {
      demandId: "bank-blocked",
      characterId: "merchant",
      erstelltAmMs: 200,
      deadlineAmMs: 500,
      prioritaetsKlasse: "NORMALE_ARBEIT",
      prioritaetsRang: 100,
      ressourcenIds: ["character:merchant:inventory"],
      wissensSnapshot,
    }),
    null,
  );
});

test("Bank-Kapazitaetswiderspruch blockiert fail-closed", () => {
  const entscheidung = planeBankAutonomie(
    basisAnfrage({
      snapshot: snapshot([{
        pack: "items0",
        slot: 0,
        name: "hpot1",
        level: 0,
        menge: 10,
        variantenFingerprint: "normal",
      }]),
      packs: [{
        pack: "items0",
        gesamtSlots: 8,
        belegteSlots: 0,
      }],
    }),
    200,
  );

  assert.equal(entscheidung.art, "GESPERRT");
  assert.deepEqual(
    entscheidung.gruende,
    ["BANK_KAPAZITAET_WIDERSPRUCH"],
  );
});

test("Bank-Autonomie erzeugt typisierten Bank-Demand ohne Gameplay-Autoritaet", () => {
  const eintraege = [
    {
      pack: "items0",
      slot: 0,
      name: "helmet",
      level: 0,
      menge: 1,
      variantenFingerprint: "normal",
    },
    {
      pack: "items0",
      slot: 1,
      name: "armor",
      level: 0,
      menge: 1,
      variantenFingerprint: "normal",
    },
  ];
  const entscheidung = planeBankAutonomie(
    basisAnfrage({
      snapshot: snapshot(eintraege),
      packs: [{
        pack: "items0",
        gesamtSlots: 2,
        belegteSlots: 2,
      }],
      erweiterungsOptionen: [{
        optionId: "items1-shells",
        pack: "items1",
        waehrung: "SHELLS",
        kosten: 10,
        neueSlots: 42,
        prioritaetsRang: 1,
        actionContractId: "AL-ACTION-OPEN-BANK-PACK",
        recoveryContractId: "AL-RECOVERY-OPEN-BANK-PACK",
      }],
      budgets: [{
        waehrung: "SHELLS",
        verfuegbarNachReservierungen: 20,
        sicherheitsReserveNachgewiesen: true,
      }],
    }),
    200,
  );

  const demand = erzeugeBankAutonomieDemand(entscheidung, {
    demandId: "bank-expand-1",
    characterId: "merchant",
    erstelltAmMs: 200,
    deadlineAmMs: 900,
    prioritaetsKlasse: "OPTIMIERUNG",
    prioritaetsRang: 500,
    ressourcenIds: ["character:merchant:inventory"],
    wissensSnapshot,
  });
  assert.ok(demand);
  assert.equal(demand.art, "BANK_ERWEITERN");
  assert.equal(demand.accountId, "account-1");

  const plan = new MerchantWorkflowProvider().plane(demand);
  assert.ok(plan.ressourcenIds.includes("account:account-1:bank"));
  assert.equal(plan.gameplayAutoritaet, false);
  assert.equal(plan.rawWriteAutoritaet, false);
});

test("staler Bankkatalog kann keine autonome Kapazitaetsplanung autorisieren", () => {
  assert.throws(
    () => planeBankAutonomie(
      basisAnfrage({
        snapshot: snapshot([], {
          gueltigBisMs: 150,
        }),
      }),
      200,
    ),
    /BANK_KATALOG_NICHT_FRISCH/,
  );
});
