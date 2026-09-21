import test from "node:test";
import assert from "node:assert/strict";

import {
  AusfuehrungsKernel,
  CharacterSocketBudget,
  MutationsKanalKoordination,
  ProduktiveEquipEinmalAuthority,
  ProduktiveEquipTransaktionsOrchestrierung,
  RessourcenVerwalter,
} from "../../erzeugt/index.js";

const HASH = "a".repeat(64);
const SHA = "b".repeat(40);

class MemoryJournal {
  constructor() {
    this.entries = [];
  }
  async haengeDurableAn(e) {
    this.entries.push(e);
    return {
      durable: true,
      bestaetigungsId: "MEM:" + e.journalId,
      journalId: e.journalId,
      transaktionsId: e.transaktionsId,
      sequenz: e.sequenz,
    };
  }
  async liesTransaktion(tx) {
    return this.entries.filter(x => x.transaktionsId === tx);
  }
}

function authority(tx = "TX-1") {
  return new ProduktiveEquipEinmalAuthority({
    schemaVersion: 1,
    aktivierungsId: "AUTH-1",
    transaktionsId: tx,
    faehigkeitId: "equipment.equip",
    anbieterModulId: "equipment-core",
    anbieterVersion: "1",
    actionContractId: "AL-ACTION-EQUIP",
    recoveryContractId: "AL-RECOVERY-EQUIP",
    verifierId: "AL-VERIFIER-EQUIP",
    policyId: "EQUIPMENT-EQUIP-PRODUKTION-EINMAL-V1",
    ausgestelltAmMs: 100,
    gueltigBisMs: 2_100,
    faehigkeitsGeneration: 7,
    evidenceIds: ["HEALTH-1"],
    maximaleVerwendungen: 1,
  });
}

function request(auth = authority(), overrides = {}) {
  return {
    schemaVersion: 1,
    freigabeId: "FREE-1",
    auftragId: "ORDER-1",
    ablaufId: "FLOW-1",
    transaktionsId: auth.daten().transaktionsId,
    characterId: "Merchant",
    kandidat: {
      index: 3,
      itemName: "testhat",
      itemLevel: 0,
      slot: "helmet",
      vorherigesSlotItem: null,
    },
    ausgestelltAmMs: 100,
    gueltigBisMs: 1_600,
    authority: auth,
    wissensSnapshot: {
      gitCommit: SHA,
      quellenSha256: [HASH],
    },
    configFingerprint: HASH,
    prestateFingerprint: HASH,
    ...overrides,
  };
}

function baseDeps({
  journal = new MemoryJournal(),
  operator = true,
  adapterMode = "SERVER",
  recoveryClass = "BESTAETIGT",
} = {}) {
  const resources = new RessourcenVerwalter();
  const budget = new CharacterSocketBudget();
  let adapterCalls = 0;
  const adapter = {
    adapterId: "synthetic-production-equip",
    actionContractId: "AL-ACTION-EQUIP",
    recoveryContractId: "AL-RECOVERY-EQUIP",
    verifierId: "AL-VERIFIER-EQUIP",
    async sende() {
      adapterCalls += 1;
      if (adapterMode === "THROW") throw new Error("TRANSPORT_BOOM");
      if (adapterMode === "NOT_SENT") {
        return { art: "NICHT_GESENDET", grund: "PRECONDITION_DRIFT" };
      }
      return {
        art: "SERVER_ERGEBNIS",
        korrelationId: "K-1",
        ergebnis: { ok: true },
      };
    },
  };
  const deps = {
    operatorRichtlinie: {
      pruefe() {
        return { erlaubt: operator, generation: 2 };
      },
    },
    laufzeitGate: {
      pruefe() {
        return { freigegeben: true, generation: 3, nachweisId: "GATE-1" };
      },
    },
    liveVoraussetzungen: {
      async pruefe(ids, now) {
        return ids.map(id => ({
          voraussetzungId: id,
          fingerprint: HASH + ":" + id,
          beobachtetAmMs: now,
          gueltigBisMs: now + 1_500,
        }));
      },
    },
    journal,
    ressourcen: resources,
    socketBudget: budget,
    mutationsKanaele: new MutationsKanalKoordination(resources, budget),
    ausfuehrung: new AusfuehrungsKernel(),
    adapter,
    recoveryBeobachter: {
      async beobachte(_tx, snapshot) {
        const applied = recoveryClass === "BESTAETIGT"
          ? ["equipment", "inventory"]
          : [];
        const open = recoveryClass === "BESTAETIGT"
          ? []
          : ["equipment", "inventory"];
        return {
          schemaVersion: 1,
          klassifikation: recoveryClass,
          beobachtetAmMs: 110,
          snapshot,
          differenz: {
            schemaVersion: 1,
            erwarteteDomaenen: ["equipment", "inventory"],
            angewendeteDomaenen: applied,
            offeneDomaenen: open,
            widerspruechlicheDomaenen:
              recoveryClass === "UNGEKLAERT"
                ? ["equipment", "inventory"]
                : [],
          },
          evidenceFingerprints: [HASH],
        };
      },
    },
    jetztMs: () => 110,
  };
  return { deps, journal, resources, budget, adapterCalls: () => adapterCalls };
}

test("produktive Equip-Transaktion committed ueber Admission Execution Recovery und durable Journal", async () => {
  const env = baseDeps();
  const auth = authority();

  const result = await new ProduktiveEquipTransaktionsOrchestrierung()
    .fuehreEinmalAus(request(auth), env.deps);

  assert.equal(result.status, "COMMITTED");
  assert.equal(result.transportArt, "SERVER_ERGEBNIS");
  assert.equal(result.journalTerminalArt, "COMMIT");
  assert.equal(result.sameIntentErneutSenden, false);
  assert.equal(env.adapterCalls(), 1);
  assert.equal(auth.verbraucht(), true);
  assert.deepEqual(
    env.journal.entries.map(x => x.art),
    ["INTENT", "SERVER_ERGEBNIS", "POSTCONDITION", "COMMIT"],
  );
  assert.equal(
    env.journal.entries[0].inhalt.send_boundary_state,
    "NICHT_GESENDET",
  );
  assert.equal(
    env.resources.sicht().every(x => x.status === "FREI"),
    true,
  );
  assert.equal(env.budget.sicht("Merchant", 110).belegt, 0);
});

test("Admission-Deny terminalisiert vor Send als ABBRUCH", async () => {
  const env = baseDeps({ operator: false });
  const auth = authority();

  await assert.rejects(
    () => new ProduktiveEquipTransaktionsOrchestrierung()
      .fuehreEinmalAus(request(auth), env.deps),
    /OPERATOR_DENY/,
  );

  assert.equal(env.adapterCalls(), 0);
  assert.deepEqual(
    env.journal.entries.map(x => x.art),
    ["INTENT", "ABBRUCH"],
  );
  assert.equal(
    env.journal.entries[1].inhalt.send_boundary_state,
    "NICHT_GESENDET",
  );
  assert.equal(env.journal.entries[1].inhalt.same_intent_retry, false);
});

test("unerwartete Adapter-Ausnahme wird UNKNOWN und niemals Same-Intent-Retry", async () => {
  const env = baseDeps({ adapterMode: "THROW" });

  const result = await new ProduktiveEquipTransaktionsOrchestrierung()
    .fuehreEinmalAus(request(authority()), env.deps);

  assert.equal(result.status, "COMMITTED");
  assert.equal(result.transportArt, "UNBEKANNT");
  assert.equal(result.sameIntentErneutSenden, false);
  assert.equal(env.adapterCalls(), 1);
  assert.deepEqual(
    env.journal.entries.map(x => x.art),
    ["INTENT", "UNBEKANNT", "POSTCONDITION", "COMMIT"],
  );
});

test("unklare Postcondition endet fail-safe und erzeugt keinen zweiten Send", async () => {
  const env = baseDeps({ recoveryClass: "UNGEKLAERT" });

  const result = await new ProduktiveEquipTransaktionsOrchestrierung()
    .fuehreEinmalAus(request(authority()), env.deps);

  assert.equal(result.status, "OPERATOR_REQUIRED");
  assert.equal(result.journalTerminalArt, "SICHER_FEHLGESCHLAGEN");
  assert.equal(result.sameIntentErneutSenden, false);
  assert.equal(env.adapterCalls(), 1);
  assert.deepEqual(
    env.journal.entries.map(x => x.art),
    ["INTENT", "SERVER_ERGEBNIS", "POSTCONDITION", "SICHER_FEHLGESCHLAGEN"],
  );
});

test("NICHT_GESENDET endet ohne Recovery-Send als ABBRUCH", async () => {
  const env = baseDeps({ adapterMode: "NOT_SENT" });

  const result = await new ProduktiveEquipTransaktionsOrchestrierung()
    .fuehreEinmalAus(request(authority()), env.deps);

  assert.equal(result.status, "ABORTED");
  assert.equal(result.transportArt, "NICHT_GESENDET");
  assert.equal(env.adapterCalls(), 1);
  assert.deepEqual(
    env.journal.entries.map(x => x.art),
    ["INTENT", "ABBRUCH"],
  );
});

test("produktive Equip-Transaktion akzeptiert keinen belegten Zielslot", async () => {
  const env = baseDeps();
  const auth = authority();

  await assert.rejects(
    () => new ProduktiveEquipTransaktionsOrchestrierung()
      .fuehreEinmalAus(request(auth, {
        kandidat: {
          index: 3,
          itemName: "testhat",
          itemLevel: 0,
          slot: "helmet",
          vorherigesSlotItem: { name: "oldhat", level: 0 },
        },
      }), env.deps),
    /EQUIP_PROD_TX_KANDIDAT_UNGUELTIG/,
  );

  assert.equal(env.adapterCalls(), 0);
  assert.equal(env.journal.entries.length, 0);
});
