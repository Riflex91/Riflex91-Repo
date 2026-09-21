import test from "node:test";
import assert from "node:assert/strict";

import {
  BANK_WITHDRAW_ACTION_CONTRACT_ID,
  BANK_WITHDRAW_EINMAL_POLICY_ID,
  BANK_WITHDRAW_RECOVERY_CONTRACT_ID,
  BANK_WITHDRAW_VERIFIER_ID,
  BankLeaseKoordinator,
  CharacterSocketBudget,
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_CORE_MODUL_VERSION,
  MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID,
  MutationsKanalKoordination,
  PersistenterBankLeaseController,
  ProduktiveBankWithdrawEinmalAuthority,
  ProduktiveBankWithdrawShadowAdmission,
  RessourcenVerwalter,
} from "../../erzeugt/index.js";

class JournalFake {
  constructor() {
    this.eintraege = [];
  }

  async haengeDurableAn(eintrag) {
    const alt = this.eintraege.find(x =>
      x.transaktionsId === eintrag.transaktionsId
      && x.sequenz === eintrag.sequenz);
    if (alt) {
      if (JSON.stringify(alt) !== JSON.stringify(eintrag)) {
        throw new Error("JOURNAL_KOLLISION");
      }
    } else {
      this.eintraege = [...this.eintraege, eintrag];
    }
    return {
      durable: true,
      bestaetigungsId: "ACK:" + eintrag.journalId,
      journalId: eintrag.journalId,
      transaktionsId: eintrag.transaktionsId,
      sequenz: eintrag.sequenz,
    };
  }

  async liesTransaktion(transaktionsId) {
    return this.eintraege
      .filter(x => x.transaktionsId === transaktionsId)
      .sort((a, b) => a.sequenz - b.sequenz);
  }
}

function authority() {
  return new ProduktiveBankWithdrawEinmalAuthority({
    schemaVersion: 1,
    aktivierungsId: "BANK-SHADOW-AUTH-1",
    transaktionsId: "BANK-SHADOW-TX-1",
    faehigkeitId: MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID,
    anbieterModulId: MERCHANT_BANK_CORE_MODUL_ID,
    anbieterVersion: MERCHANT_BANK_CORE_MODUL_VERSION,
    actionContractId: BANK_WITHDRAW_ACTION_CONTRACT_ID,
    recoveryContractId: BANK_WITHDRAW_RECOVERY_CONTRACT_ID,
    verifierId: BANK_WITHDRAW_VERIFIER_ID,
    policyId: BANK_WITHDRAW_EINMAL_POLICY_ID,
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
    freigabeId: "BANK-SHADOW-FREIGABE-1",
    auftragId: "BANK-SHADOW-AUFTRAG-1",
    ablaufId: "BANK-SHADOW-WF-1",
    transaktionsId: "BANK-SHADOW-TX-1",
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
      fingerprint: "bank-snapshot-fp",
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
      async lies() {
        return persistiert;
      },
      async schreibeDurable(inhalt) {
        if (optionen.persistenzFehler) throw new Error("DISK_DOWN");
        persistiert = inhalt;
      },
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
          nachweisId: "V5-GATE:BANK-SHADOW",
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

test("Bank-Withdraw-Shadow durchlaeuft Lease, Channel, Budget, Intent und R9-Admission ohne Send", async () => {
  const env = umgebung();
  const ergebnis = await new ProduktiveBankWithdrawShadowAdmission().pruefe(
    anfrage(),
    env,
  );

  assert.equal(ergebnis.status, "ADMISSION_BESTANDEN_KEIN_SEND");
  assert.equal(ergebnis.gameplayWrites, 0);
  assert.equal(ergebnis.adapterAufrufe, 0);
  assert.equal(ergebnis.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(ergebnis.sameIntentErneutSenden, false);
  assert.match(
    ergebnis.actionKanalRessourcenId,
    /character:merchant:action_channel:bank/,
  );
  assert.equal(env.journal.eintraege.length, 2);
  assert.equal(env.journal.eintraege[0].art, "INTENT");
  assert.equal(env.journal.eintraege[1].art, "ABBRUCH");
  assert.equal(
    env.journal.eintraege[0].inhalt.send_boundary_state,
    "NICHT_GESENDET",
  );
  assert.equal(
    env.journal.eintraege[1].inhalt.gameplay_writes,
    0,
  );
  assert.equal(env.leaseController.sicht()[0].zustand, "RELEASED");
});

test("External-Fence-Drift blockiert vor Intent und vor Authority-Verbrauch", async () => {
  const env = umgebung();
  const a = anfrage({
    externalFence: {
      serverRegion: "EU",
      serverIdentifier: "I",
      mountedCharacterId: "warrior",
      konflikt: true,
    },
  });
  await assert.rejects(
    () => new ProduktiveBankWithdrawShadowAdmission().pruefe(a, env),
    /BANK_WITHDRAW_SHADOW_EXTERNAL_FENCE_UNGUELTIG/,
  );
  assert.equal(env.journal.eintraege.length, 0);
  assert.equal(a.authority.verbraucht(), false);
});

test("Operator-Deny blockiert Admission, schreibt terminalen Kein-Send-Abbruch und sendet nie", async () => {
  const env = umgebung({ operatorErlaubt: false });
  const a = anfrage();
  await assert.rejects(
    () => new ProduktiveBankWithdrawShadowAdmission().pruefe(a, env),
    /OPERATOR_DENY/,
  );
  assert.equal(a.authority.verbraucht(), true);
  assert.deepEqual(
    env.journal.eintraege.map(x => x.art),
    ["INTENT", "ABBRUCH"],
  );
  assert.equal(
    env.journal.eintraege[1].inhalt.send_boundary_state,
    "NICHT_GESENDET",
  );
  assert.equal(env.leaseController.sicht()[0].zustand, "RELEASED");
});

test("stale oder unvollstaendige Live-Evidence blockiert nach durable Intent aber vor Send", async () => {
  const env = umgebung({ liveUnvollstaendig: true });
  await assert.rejects(
    () => new ProduktiveBankWithdrawShadowAdmission().pruefe(
      anfrage(),
      env,
    ),
    /LIVE_VORAUSSETZUNGEN_UNVOLLSTAENDIG/,
  );
  assert.deepEqual(
    env.journal.eintraege.map(x => x.art),
    ["INTENT", "ABBRUCH"],
  );
  assert.equal(env.journal.eintraege[1].inhalt.gameplay_writes, 0);
});

test("Lease-Persistenzfehler blockiert Shadow vor Journal und vor Authority", async () => {
  const env = umgebung({ persistenzFehler: true });
  const a = anfrage();
  await assert.rejects(
    () => new ProduktiveBankWithdrawShadowAdmission().pruefe(a, env),
    /DISK_DOWN/,
  );
  assert.equal(env.journal.eintraege.length, 0);
  assert.equal(a.authority.verbraucht(), false);
  assert.equal(
    env.leaseController.validiereMutation(
      {
        schemaVersion: 1,
        accountId: "account-1",
        ownerCharacterId: "merchant",
        ablaufId: "BANK-SHADOW-WF-1",
        epoche: 1,
        ressourcenToken: {
          ressourcenId: "invalid",
          epoche: 1,
          ablaufId: "BANK-SHADOW-WF-1",
          art: "LANGLEBIG",
          ausgestelltAmMs: 100,
          gueltigBisMs: 200,
        },
      },
      {
        ressourcenId: "invalid",
        epoche: 1,
        ablaufId: "BANK-SHADOW-WF-1",
        art: "ACTION_KANAL",
        ausgestelltAmMs: 100,
        gueltigBisMs: null,
      },
      anfrage().externalFence,
      101,
    ),
    false,
  );
});

test("Shadow-Quelle besitzt keine Adapter- oder Public-Function-Send-Grenze", async () => {
  const fs = await import("node:fs");
  const source = fs.readFileSync(
    "grundlage/quelle/merchant/bank-withdraw-shadow-admission.ts",
    "utf8",
  );
  assert.equal(/\bbank_deposit\s*\(/.test(source), false);
  assert.equal(/\.emit\s*\(/.test(source), false);
  assert.equal(/AusfuehrungsKernel/.test(source), false);
  assert.equal(/AusfuehrungsAdapter/.test(source), false);
});
