import test from "node:test";
import assert from "node:assert/strict";

import {
  AusfuehrungsKernel,
  BANK_DEPOSIT_ACTION_CONTRACT_ID,
  BANK_DEPOSIT_EINMAL_POLICY_ID,
  BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
  BANK_DEPOSIT_VERIFIER_ID,
  BankLeaseKoordinator,
  CharacterSocketBudget,
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_CORE_MODUL_VERSION,
  MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
  MutationsKanalKoordination,
  PersistenterBankLeaseController,
  ProduktiveBankDepositEinmalAuthority,
  ProduktiveBankDepositTransaktionsOrchestrierung,
  RessourcenVerwalter,
} from "../../erzeugt/index.js";

const SHA = "a".repeat(40);
const HASH = "b".repeat(64);
const PRE_FP = "c".repeat(64);
const POST_FP = "d".repeat(64);

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

function authority(tx = "BANK-TX-1") {
  return new ProduktiveBankDepositEinmalAuthority({
    schemaVersion: 1,
    aktivierungsId: "BANK-AUTH-1",
    transaktionsId: tx,
    faehigkeitId: MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
    anbieterModulId: MERCHANT_BANK_CORE_MODUL_ID,
    anbieterVersion: MERCHANT_BANK_CORE_MODUL_VERSION,
    actionContractId: BANK_DEPOSIT_ACTION_CONTRACT_ID,
    recoveryContractId: BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
    verifierId: BANK_DEPOSIT_VERIFIER_ID,
    policyId: BANK_DEPOSIT_EINMAL_POLICY_ID,
    ausgestelltAmMs: 100,
    gueltigBisMs: 2_000,
    faehigkeitsGeneration: 7,
    evidenceIds: ["HEALTH-1"],
    maximaleVerwendungen: 1,
  });
}

function request(auth, leaseEpoche, overrides = {}) {
  return {
    schemaVersion: 1,
    freigabeId: "BANK-FREE-1",
    auftragId: "BANK-ORDER-1",
    ablaufId: "BANK-FLOW-1",
    transaktionsId: auth.daten().transaktionsId,
    accountId: "account-1",
    characterId: "merchant",
    sessionId: "session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    betrag: 1,
    ausgestelltAmMs: 100,
    gueltigBisMs: 500,
    leaseDauerMs: 10_000,
    maximaleSnapshotAlterMs: 1_000,
    externalFence: {
      serverRegion: "EU",
      serverIdentifier: "I",
      mountedCharacterId: "merchant",
      konflikt: false,
    },
    externalFenceBeobachtetAmMs: 100,
    vorher: {
      schemaVersion: 1,
      characterId: "merchant",
      sessionId: "session-1",
      serverRegion: "EU",
      serverKennung: "I",
      leaseEpoche,
      mountEpoche: 77,
      beobachtetAmMs: 100,
      characterGold: 100,
      bankGold: 500,
      fingerprint: PRE_FP,
    },
    authority: auth,
    wissensSnapshot: {
      gitCommit: SHA,
      quellenSha256: [HASH],
    },
    configFingerprint: HASH,
    prestateFingerprint: PRE_FP,
    ...overrides,
  };
}

async function env({
  adapterMode = "SERVER",
  mutateAfterSend = true,
  operator = true,
} = {}) {
  const ressourcen = new RessourcenVerwalter();
  const socketBudget = new CharacterSocketBudget();
  const leaseKoordinator = new BankLeaseKoordinator(ressourcen);
  let persisted;
  const leaseController = new PersistenterBankLeaseController(
    leaseKoordinator,
    {
      async lies() {
        return persisted;
      },
      async schreibeDurable(inhalt) {
        persisted = inhalt;
      },
    },
  );
  const leaseToken = await leaseController.beanspruche(
    "account-1",
    "merchant",
    "BANK-FLOW-1",
    "bank_deposit_one_shot_live",
    "EU",
    "I",
    100,
    10_000,
  );

  const journal = new MemoryJournal();
  let state = {
    characterGold: 100,
    bankGold: 500,
    fingerprint: PRE_FP,
    beobachtetAmMs: 100,
  };
  let adapterCalls = 0;
  let firstAdapterSawDurableIntent = false;
  const adapter = {
    adapterId: "synthetic-bank-deposit-one-gold",
    actionContractId: BANK_DEPOSIT_ACTION_CONTRACT_ID,
    recoveryContractId: BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
    verifierId: BANK_DEPOSIT_VERIFIER_ID,
    async sende(_freigabe, anfrage) {
      adapterCalls += 1;
      firstAdapterSawDurableIntent =
        journal.entries.length >= 1
        && journal.entries[0].art === "INTENT";
      assert.equal(anfrage.betrag, 1);
      assert.equal(anfrage.erwartetesCharacterGold, 100);
      assert.equal(anfrage.erwartetesBankGold, 500);

      if (mutateAfterSend) {
        state = {
          characterGold: 99,
          bankGold: 501,
          fingerprint: POST_FP,
          beobachtetAmMs: 110,
        };
      }
      if (adapterMode === "UNKNOWN") {
        return {
          art: "UNBEKANNT",
          grund: "DISCONNECT_NACH_MOEGLICHEM_SEND",
          korrelationId: null,
        };
      }
      if (adapterMode === "NOT_SENT") {
        state = {
          characterGold: 100,
          bankGold: 500,
          fingerprint: PRE_FP,
          beobachtetAmMs: 100,
        };
        return {
          art: "NICHT_GESENDET",
          grund: "PRESTATE_DRIFT",
        };
      }
      return {
        art: "SERVER_ERGEBNIS",
        korrelationId: "BANK-K-1",
        ergebnis: { response: "bank_store" },
      };
    },
  };

  return {
    requestAuth: authority(),
    leaseToken,
    journal,
    adapter,
    adapterCalls: () => adapterCalls,
    firstAdapterSawDurableIntent: () => firstAdapterSawDurableIntent,
    deps: {
      leaseController,
      operatorRichtlinie: {
        pruefe() {
          return { erlaubt: operator, generation: 2 };
        },
      },
      laufzeitGate: {
        pruefe() {
          return {
            freigegeben: true,
            generation: 3,
            nachweisId: "BANK-GATE-1",
          };
        },
      },
      journal,
      ressourcen,
      socketBudget,
      mutationsKanaele: new MutationsKanalKoordination(
        ressourcen,
        socketBudget,
      ),
      ausfuehrung: new AusfuehrungsKernel(),
      adapter,
      bankBeobachter: {
        async beobachte(leaseEpoche, mountEpoche) {
          return {
            schemaVersion: 1,
            characterId: "merchant",
            sessionId: "session-1",
            serverRegion: "EU",
            serverKennung: "I",
            leaseEpoche,
            mountEpoche,
            beobachtetAmMs: state.beobachtetAmMs,
            characterGold: state.characterGold,
            bankGold: state.bankGold,
            fingerprint: state.fingerprint,
          };
        },
      },
      releaseBeobachter: {
        async beobachte() {
          return {
            offeneTransaktionen: 0,
            backendInProgress: false,
            bankActionInFlight: false,
            characterBankAktiv: false,
            erwarteterExitBeobachtet: true,
          };
        },
      },
      vorabLeaseToken: leaseToken,
      jetztMs: () => 110,
    },
  };
}

test("bank_deposit(1) committed nur ueber durable Intent, Admission, Execution und exaktes Gold-Settlement", async () => {
  const e = await env();
  const auth = e.requestAuth;
  const result = await new ProduktiveBankDepositTransaktionsOrchestrierung()
    .fuehreEinmalAus(request(auth, e.leaseToken.epoche), e.deps);

  assert.equal(result.status, "COMMITTED");
  assert.equal(result.transportArt, "SERVER_ERGEBNIS");
  assert.equal(result.journalTerminalArt, "COMMIT");
  assert.equal(result.betrag, 1);
  assert.equal(result.sameIntentErneutSenden, false);
  assert.equal(e.adapterCalls(), 1);
  assert.equal(e.firstAdapterSawDurableIntent(), true);
  assert.equal(auth.verbraucht(), true);
  assert.deepEqual(
    e.journal.entries.map(x => x.art),
    ["INTENT", "SERVER_ERGEBNIS", "POSTCONDITION", "COMMIT"],
  );
  assert.equal(e.journal.entries[0].inhalt.betrag_gold, 1);
  assert.equal(
    e.journal.entries[0].inhalt.send_boundary_state,
    "NICHT_GESENDET",
  );
  assert.equal(e.deps.leaseController.sicht()[0].zustand, "RELEASED");
  assert.equal(
    e.deps.ressourcen.sicht().every(x => x.status === "FREI"),
    true,
  );
});

test("UNKNOWN nach moeglichem Send wird durch exaktes Gold-Delta COMMITTED ohne zweiten Send", async () => {
  const e = await env({ adapterMode: "UNKNOWN" });
  const result = await new ProduktiveBankDepositTransaktionsOrchestrierung()
    .fuehreEinmalAus(
      request(e.requestAuth, e.leaseToken.epoche),
      e.deps,
    );

  assert.equal(result.status, "COMMITTED");
  assert.equal(result.transportArt, "UNBEKANNT");
  assert.equal(result.recovery.art, "COMMITTED");
  assert.equal(result.sameIntentErneutSenden, false);
  assert.equal(e.adapterCalls(), 1);
  assert.deepEqual(
    e.journal.entries.map(x => x.art),
    ["INTENT", "UNBEKANNT", "POSTCONDITION", "COMMIT"],
  );
});

test("UNKNOWN ohne nachweisbares Delta endet OPERATOR_REQUIRED und sendet nie erneut", async () => {
  const e = await env({
    adapterMode: "UNKNOWN",
    mutateAfterSend: false,
  });
  const result = await new ProduktiveBankDepositTransaktionsOrchestrierung()
    .fuehreEinmalAus(
      request(e.requestAuth, e.leaseToken.epoche),
      e.deps,
    );

  assert.equal(result.status, "OPERATOR_REQUIRED");
  assert.equal(result.transportArt, "UNBEKANNT");
  assert.equal(result.journalTerminalArt, "SICHER_FEHLGESCHLAGEN");
  assert.equal(result.sameIntentErneutSenden, false);
  assert.equal(e.adapterCalls(), 1);
  assert.deepEqual(
    e.journal.entries.map(x => x.art),
    ["INTENT", "UNBEKANNT", "POSTCONDITION", "SICHER_FEHLGESCHLAGEN"],
  );
});

test("NICHT_GESENDET endet terminal ABBRUCH und ohne zweiten Adapteraufruf", async () => {
  const e = await env({
    adapterMode: "NOT_SENT",
    mutateAfterSend: false,
  });
  const result = await new ProduktiveBankDepositTransaktionsOrchestrierung()
    .fuehreEinmalAus(
      request(e.requestAuth, e.leaseToken.epoche),
      e.deps,
    );

  assert.equal(result.status, "ABORTED");
  assert.equal(result.transportArt, "NICHT_GESENDET");
  assert.equal(result.journalTerminalArt, "ABBRUCH");
  assert.equal(e.adapterCalls(), 1);
  assert.deepEqual(
    e.journal.entries.map(x => x.art),
    ["INTENT", "ABBRUCH"],
  );
});

test("Operator-Deny blockiert nach durable Intent vor Adapter-Send", async () => {
  const e = await env({ operator: false });
  await assert.rejects(
    () => new ProduktiveBankDepositTransaktionsOrchestrierung()
      .fuehreEinmalAus(
        request(e.requestAuth, e.leaseToken.epoche),
        e.deps,
      ),
    /OPERATOR_DENY/,
  );
  assert.equal(e.adapterCalls(), 0);
  assert.deepEqual(
    e.journal.entries.map(x => x.art),
    ["INTENT", "ABBRUCH"],
  );
  assert.equal(e.deps.leaseController.sicht()[0].zustand, "RELEASED");
});

test("Betrag ungleich eins wird vor Lease-Aktivierung, Intent und Send verworfen", async () => {
  const e = await env();
  await assert.rejects(
    () => new ProduktiveBankDepositTransaktionsOrchestrierung()
      .fuehreEinmalAus(
        request(e.requestAuth, e.leaseToken.epoche, { betrag: 2 }),
        e.deps,
      ),
    /BETRAG_NICHT_EXAKT_EINS/,
  );
  assert.equal(e.adapterCalls(), 0);
  assert.equal(e.journal.entries.length, 0);
  assert.equal(e.deps.leaseController.sicht()[0].zustand, "ACQUIRING");
});
