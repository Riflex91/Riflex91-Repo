import test from "node:test";
import assert from "node:assert/strict";

import {
  AusfuehrungsKernel,
  CharacterSocketBudget,
  ErteilteAusfuehrungsFreigabe,
  MutationsKanalKoordination,
  PersistVorMutationTor,
  RessourcenVerwalter,
  erstelleMutationsKanalPlan,
} from "../../erzeugt/index.js";

const ACTION = "AL-ACTION-BANK-DEPOSIT";
const RECOVERY = "AL-RECOVERY-BANK-DEPOSIT";
const VERIFIER = "AL-VERIFIER-BANK-DEPOSIT";
const INVARIANTEN = [
  "V5-INV-002",
  "V5-INV-004",
  "V5-INV-005",
  "V5-ALT-024",
];

class JournalFake {
  constructor({ fehler = null } = {}) {
    this.fehler = fehler;
    this.eintraege = [];
  }

  async haengeDurableAn(eintrag) {
    if (this.fehler) throw this.fehler;
    this.eintraege = [...this.eintraege, eintrag];
    return {
      durable: true,
      bestaetigungsId: "ACK-" + eintrag.journalId,
      journalId: eintrag.journalId,
      transaktionsId: eintrag.transaktionsId,
      sequenz: eintrag.sequenz,
    };
  }

  async liesTransaktion(transaktionsId) {
    return this.eintraege.filter(x => x.transaktionsId === transaktionsId);
  }
}

function intentEintrag(overrides = {}) {
  return {
    schemaVersion: 1,
    journalId: "J-1",
    transaktionsId: "T-1",
    sequenz: 1,
    art: "INTENT",
    zeitMs: 90,
    inhalt: {
      auftrag_id: "AUF-1",
      ablauf_id: "WF-1",
      faehigkeit_id: "bank.deposit",
      owner_id: "merchant-core",
      action_contract_id: ACTION,
      recovery_contract_id: RECOVERY,
      verifier_id: VERIFIER,
      ...(overrides.inhalt ?? {}),
    },
    ...overrides,
  };
}

async function szenario(optionen = {}) {
  const ressourcen = new RessourcenVerwalter();
  const socketBudget = new CharacterSocketBudget();
  const koordination = new MutationsKanalKoordination(ressourcen, socketBudget);

  const [bankToken] = ressourcen.beanspruche("WF-1", [{
    ressourcenId: "account:bank_lease",
    art: "LANGLEBIG",
    leaseDauerMs: optionen.leaseDauerMs ?? 1_000,
  }], 100);
  const kanalPlan = erstelleMutationsKanalPlan("merchant", "bank", 20);
  const mutationsKanal = koordination.reserviere("BUD-1", "WF-1", kanalPlan, 100);

  const intent = optionen.intent ?? intentEintrag();
  const journal = new JournalFake();
  const intentToken = await new PersistVorMutationTor(journal).persistiereIntent(intent);

  const abhaengigkeiten = {
    faehigkeitsAutoritaet: {
      pruefe() {
        return {
          erlaubt: optionen.capabilityErlaubt ?? true,
          mutierend: true,
          generation: 7,
        };
      },
    },
    operatorRichtlinie: {
      pruefe() {
        return {
          erlaubt: optionen.operatorErlaubt ?? true,
          generation: 8,
        };
      },
    },
    laufzeitGate: {
      pruefe() {
        return {
          freigegeben: optionen.runtimeOffen ?? true,
          generation: 9,
          nachweisId: "RUNTIME-GATE-TEST",
        };
      },
    },
    aktionsVertraege: {
      pruefe(actionContractId, recoveryContractId, verifierId) {
        return {
          actionContractId,
          recoveryContractId,
          verifierId,
          produktivErlaubt: optionen.vertragErlaubt ?? true,
          invariantenKennungen: INVARIANTEN,
        };
      },
    },
    liveVoraussetzungen: {
      async pruefe(ids, jetztMs) {
        return ids.map(id => ({
          voraussetzungId: id,
          fingerprint: "fp:" + id,
          beobachtetAmMs: jetztMs,
          gueltigBisMs: optionen.liveGueltigBisMs ?? 700,
        }));
      },
    },
    ressourcen,
    socketBudget,
  };

  const anfrage = {
    schemaVersion: 1,
    freigabeId: "F-1",
    auftragId: "AUF-1",
    ablaufId: "WF-1",
    transaktionsId: "T-1",
    faehigkeitId: "bank.deposit",
    eigentuemerModulId: "merchant-core",
    actionContractId: ACTION,
    recoveryContractId: RECOVERY,
    verifierId: VERIFIER,
    invariantenKennungen: INVARIANTEN,
    voraussetzungsIds: ["character", "bank", "inventory"],
    ausgestelltAmMs: optionen.ausgestelltAmMs ?? 100,
    gueltigBisMs: optionen.gueltigBisMs ?? 500,
    fencingTokens: [bankToken],
    mutationsKanal,
    intentToken,
    intentEintrag: intent,
  };

  return {
    abhaengigkeiten,
    anfrage,
    ressourcen,
    socketBudget,
    bankToken,
    mutationsKanal,
  };
}

test("globale Laufzeitsperre verhindert bereits Admission", async () => {
  const { anfrage, abhaengigkeiten } = await szenario({ runtimeOffen: false });

  await assert.rejects(
    () => ErteilteAusfuehrungsFreigabe.erteile(anfrage, abhaengigkeiten),
    /LAUFZEIT_GATE_GESPERRT/,
  );
});

test("vollstaendige Admission erzeugt nominal typisierte Freigabe und erlaubt nur passenden Adapter", async () => {
  const { anfrage, abhaengigkeiten } = await szenario();
  const freigabe = await ErteilteAusfuehrungsFreigabe.erteile(
    anfrage,
    abhaengigkeiten,
  );
  const aufrufe = [];
  const adapter = {
    adapterId: "bank-adapter",
    actionContractId: ACTION,
    recoveryContractId: RECOVERY,
    verifierId: VERIFIER,
    async sende(_freigabe, request) {
      aufrufe.push(request);
      return {
        art: "SERVER_ERGEBNIS",
        korrelationId: "K-1",
        ergebnis: { ok: true },
      };
    },
  };

  const ergebnis = await new AusfuehrungsKernel().fuehreAus(
    freigabe,
    { gold: 100 },
    adapter,
    101,
  );

  assert.equal(ergebnis.art, "SERVER_ERGEBNIS");
  assert.deepEqual(aufrufe, [{ gold: 100 }]);
  assert.equal(freigabe.daten().intent.durable, true);
  assert.equal(freigabe.daten().actionContractId, ACTION);
  assert.equal(freigabe.daten().recoveryContractId, RECOVERY);
  assert.equal(freigabe.daten().verifierId, VERIFIER);
});

test("loses Objekt ist keine Ausfuehrungsfreigabe", async () => {
  const adapter = {
    adapterId: "fake",
    actionContractId: ACTION,
    recoveryContractId: RECOVERY,
    verifierId: VERIFIER,
    async sende() {
      throw new Error("DARF_NICHT_AUFGERUFEN_WERDEN");
    },
  };

  await assert.rejects(
    () => new AusfuehrungsKernel().fuehreAus({}, {}, adapter, 100),
    /TYPISIERTE_AUSFUEHRUNGSFREIGABE_FEHLT/,
  );
});

test("abgelaufene Freigabe und falscher Adaptervertrag blockieren vor Send", async () => {
  const { anfrage, abhaengigkeiten } = await szenario();
  const freigabe = await ErteilteAusfuehrungsFreigabe.erteile(
    anfrage,
    abhaengigkeiten,
  );
  let gesendet = 0;
  const adapter = {
    adapterId: "bank-adapter",
    actionContractId: ACTION,
    recoveryContractId: RECOVERY,
    verifierId: VERIFIER,
    async sende() {
      gesendet += 1;
      return { art: "NICHT_GESENDET", grund: "TEST" };
    },
  };

  await assert.rejects(
    () => new AusfuehrungsKernel().fuehreAus(
      freigabe,
      {},
      adapter,
      501,
    ),
    /FREIGABE_ABGELAUFEN/,
  );
  await assert.rejects(
    () => new AusfuehrungsKernel().fuehreAus(
      freigabe,
      {},
      { ...adapter, verifierId: "AL-VERIFIER-FALSCH" },
      101,
    ),
    /ADAPTER_VERIFIER_STIMMT_NICHT/,
  );
  assert.equal(gesendet, 0);
});

test("stale Live-Precondition blockiert Admission", async () => {
  const { anfrage, abhaengigkeiten } = await szenario({
    liveGueltigBisMs: 99,
  });

  await assert.rejects(
    () => ErteilteAusfuehrungsFreigabe.erteile(anfrage, abhaengigkeiten),
    /LIVE_VORAUSSETZUNG_STALE_ODER_UNGUELTIG/,
  );
});

test("stale Fencing blockiert Admission", async () => {
  const {
    anfrage,
    abhaengigkeiten,
  } = await szenario({
    leaseDauerMs: 5,
    ausgestelltAmMs: 106,
    gueltigBisMs: 110,
    liveGueltigBisMs: 200,
  });

  await assert.rejects(
    () => ErteilteAusfuehrungsFreigabe.erteile(anfrage, abhaengigkeiten),
    /RESSOURCEN_FENCING_UNGUELTIG/,
  );
});

test("Operator-Deny und fehlende Capability-Authority sind unabhaengige Verriegelungen", async () => {
  const deny = await szenario({ operatorErlaubt: false });
  await assert.rejects(
    () => ErteilteAusfuehrungsFreigabe.erteile(
      deny.anfrage,
      deny.abhaengigkeiten,
    ),
    /OPERATOR_DENY/,
  );

  const capability = await szenario({ capabilityErlaubt: false });
  await assert.rejects(
    () => ErteilteAusfuehrungsFreigabe.erteile(
      capability.anfrage,
      capability.abhaengigkeiten,
    ),
    /FAEHIGKEITS_AUTORITAET_FEHLT/,
  );
});

test("durable Intent muss exakt an Auftrag Workflow Owner und Vertrage gebunden sein", async () => {
  const kaputt = await szenario({
    intent: intentEintrag({
      inhalt: { owner_id: "anderer-owner" },
    }),
  });

  await assert.rejects(
    () => ErteilteAusfuehrungsFreigabe.erteile(
      kaputt.anfrage,
      kaputt.abhaengigkeiten,
    ),
    /DURABLE_INTENT_BINDUNG_STIMMT_NICHT:owner_id/,
  );
});

test("ohne erfolgreiche Durable-Intent-Persistenz entsteht kein Admission-Token", async () => {
  const journal = new JournalFake({ fehler: new Error("SPEICHER_VOLL") });
  const tor = new PersistVorMutationTor(journal);

  await assert.rejects(
    () => tor.persistiereIntent(intentEintrag()),
    /SPEICHER_VOLL/,
  );
});

test("UNKNOWN vom Adapter bleibt typisiert und wird nicht als Erfolg umgedeutet", async () => {
  const { anfrage, abhaengigkeiten } = await szenario();
  const freigabe = await ErteilteAusfuehrungsFreigabe.erteile(
    anfrage,
    abhaengigkeiten,
  );
  const adapter = {
    adapterId: "bank-adapter",
    actionContractId: ACTION,
    recoveryContractId: RECOVERY,
    verifierId: VERIFIER,
    async sende() {
      return {
        art: "UNBEKANNT",
        grund: "TIMEOUT_NACH_MOEGLICHEM_SEND",
        korrelationId: null,
      };
    },
  };

  const ergebnis = await new AusfuehrungsKernel().fuehreAus(
    freigabe,
    {},
    adapter,
    101,
  );
  assert.deepEqual(ergebnis, {
    art: "UNBEKANNT",
    grund: "TIMEOUT_NACH_MOEGLICHEM_SEND",
    korrelationId: null,
  });
});
