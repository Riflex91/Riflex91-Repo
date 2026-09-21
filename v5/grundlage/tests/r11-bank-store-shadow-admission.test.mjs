import test from "node:test";
import assert from "node:assert/strict";

import {
  BANK_STORE_ACTION_CONTRACT_ID,
  BANK_STORE_EINMAL_POLICY_ID,
  BANK_STORE_RECOVERY_CONTRACT_ID,
  BANK_STORE_VERIFIER_ID,
  BankLeaseKoordinator,
  CharacterSocketBudget,
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_CORE_MODUL_VERSION,
  MERCHANT_BANK_STORE_FAEHIGKEIT_ID,
  MutationsKanalKoordination,
  PersistenterBankLeaseController,
  ProduktiveBankStoreEinmalAuthority,
  ProduktiveBankStoreShadowAdmission,
  RessourcenVerwalter,
} from "../../erzeugt/index.js";

class JournalFake {
  constructor() { this.eintraege = []; }
  async haengeDurableAn(eintrag) {
    this.eintraege = [...this.eintraege, eintrag];
    return {
      durable: true,
      bestaetigungsId: "ACK:" + eintrag.journalId,
      journalId: eintrag.journalId,
      transaktionsId: eintrag.transaktionsId,
      sequenz: eintrag.sequenz,
    };
  }
  async liesTransaktion(tx) {
    return this.eintraege.filter(x => x.transaktionsId === tx);
  }
}
function authority() {
  return new ProduktiveBankStoreEinmalAuthority({
    schemaVersion: 1,
    aktivierungsId: "BANK-STORE-SHADOW-AUTH-1",
    transaktionsId: "BANK-STORE-SHADOW-TX-1",
    faehigkeitId: MERCHANT_BANK_STORE_FAEHIGKEIT_ID,
    anbieterModulId: MERCHANT_BANK_CORE_MODUL_ID,
    anbieterVersion: MERCHANT_BANK_CORE_MODUL_VERSION,
    actionContractId: BANK_STORE_ACTION_CONTRACT_ID,
    recoveryContractId: BANK_STORE_RECOVERY_CONTRACT_ID,
    verifierId: BANK_STORE_VERIFIER_ID,
    policyId: BANK_STORE_EINMAL_POLICY_ID,
    ausgestelltAmMs: 100,
    gueltigBisMs: 2_000,
    faehigkeitsGeneration: 7,
    evidenceIds: ["HEALTH-1"],
    maximaleVerwendungen: 1,
  });
}
function anfrage(overrides = {}) {
  return {
    schemaVersion: 1,
    freigabeId: "BANK-STORE-SHADOW-FREE-1",
    auftragId: "BANK-STORE-SHADOW-ORDER-1",
    ablaufId: "BANK-STORE-SHADOW-WF-1",
    transaktionsId: "BANK-STORE-SHADOW-TX-1",
    accountId: "account-1",
    characterId: "merchant",
    serverRegion: "EU",
    serverIdentifier: "I",
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
    snapshot: {
      schemaVersion: 1,
      accountId: "account-1",
      ownerCharacterId: "merchant",
      beobachtetAmMs: 100,
      fingerprint: "b".repeat(64),
      sourceSlot: 7,
      targetPack: "items0",
      targetSlot: 11,
      sourceItemFingerprint: "a".repeat(64),
      targetItemFingerprint: null,
    },
    authority: authority(),
    ...overrides,
  };
}
function umgebung(optionen = {}) {
  const ressourcen = new RessourcenVerwalter();
  const socketBudget = new CharacterSocketBudget();
  const leaseKoordinator = new BankLeaseKoordinator(ressourcen);
  let persistiert;
  const leaseController = new PersistenterBankLeaseController(
    leaseKoordinator,
    {
      async lies() { return persistiert; },
      async schreibeDurable(inhalt) { persistiert = inhalt; },
    },
  );
  const journal = new JournalFake();
  let jetzt = 101;
  return {
    leaseController,
    ressourcen,
    socketBudget,
    mutationsKanaele: new MutationsKanalKoordination(
      ressourcen,
      socketBudget,
    ),
    journal,
    operatorRichtlinie: {
      pruefe() {
        return { erlaubt: optionen.operatorErlaubt ?? true, generation: 8 };
      },
    },
    laufzeitGate: {
      pruefe() {
        return {
          freigegeben: true,
          generation: 9,
          nachweisId: "V5-GATE:BANK-STORE-SHADOW",
        };
      },
    },
    liveVoraussetzungen: {
      async pruefe(ids, zeitMs) {
        if (optionen.liveUnvollstaendig) return [];
        return ids.map(id => ({
          voraussetzungId: id,
          fingerprint: "live:" + id,
          beobachtetAmMs: zeitMs,
          gueltigBisMs: 1_000,
        }));
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
    jetztMs: () => jetzt++,
  };
}

test("Bank-Store-Shadow pinned Source/Target, Lease, Channel und Intent ohne Send", async () => {
  const env = umgebung();
  const ergebnis = await new ProduktiveBankStoreShadowAdmission()
    .pruefe(anfrage(), env);
  assert.equal(ergebnis.status, "ADMISSION_BESTANDEN_KEIN_SEND");
  assert.equal(ergebnis.gameplayWrites, 0);
  assert.equal(ergebnis.adapterAufrufe, 0);
  assert.equal(ergebnis.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(ergebnis.sameIntentErneutSenden, false);
  assert.match(ergebnis.actionKanalRessourcenId, /action_channel:bank/);
  assert.deepEqual(env.journal.eintraege.map(x => x.art), ["INTENT", "ABBRUCH"]);
  assert.equal(env.journal.eintraege[0].inhalt.source_slot, 7);
  assert.equal(env.journal.eintraege[0].inhalt.target_pack, "items0");
  assert.equal(env.journal.eintraege[0].inhalt.target_slot, 11);
  assert.equal(
    env.journal.eintraege[0].inhalt.source_item_fingerprint,
    "a".repeat(64),
  );
  assert.equal(env.journal.eintraege[0].inhalt.target_item_fingerprint_vorher, null);
  assert.equal(env.leaseController.sicht()[0].zustand, "RELEASED");
});

test("Bank-Store-Shadow blockiert unvollstaendige Item-Bindung vor Send", async () => {
  const env = umgebung();
  const a = anfrage({
    snapshot: {
      ...anfrage().snapshot,
      targetItemFingerprint: "c".repeat(64),
    },
  });
  await assert.rejects(
    () => new ProduktiveBankStoreShadowAdmission().pruefe(a, env),
    /BANK_STORE_SHADOW_ITEM_BINDUNG_UNGUELTIG/,
  );
  assert.equal(env.journal.eintraege.length, 0);
  assert.equal(a.authority.verbraucht(), false);
});

test("Bank-Store-Shadow blockiert unvollstaendige Live-Evidence terminal ohne Send", async () => {
  const env = umgebung({ liveUnvollstaendig: true });
  await assert.rejects(
    () => new ProduktiveBankStoreShadowAdmission().pruefe(anfrage(), env),
    /LIVE_VORAUSSETZUNGEN_UNVOLLSTAENDIG/,
  );
  assert.deepEqual(env.journal.eintraege.map(x => x.art), ["INTENT", "ABBRUCH"]);
  assert.equal(env.journal.eintraege[1].inhalt.gameplay_writes, 0);
});
