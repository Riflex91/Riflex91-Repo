import test from "node:test";
import assert from "node:assert/strict";

import {
  BANK_DEPOSIT_ACTION_CONTRACT_ID,
  BANK_DEPOSIT_EINMAL_BESTAETIGUNG,
  BANK_DEPOSIT_EINMAL_POLICY_ID,
  BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
  BANK_DEPOSIT_VERIFIER_ID,
  BedienerRichtlinienDienst,
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_CORE_MODUL_VERSION,
  MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
  V5ProduktionsRuntime,
  V5_PRODUKTIONS_STORAGE_HEALTH_ID,
  erstelleKanonischeProduktionsKomposition,
} from "../../erzeugt/index.js";

function policy() {
  return new BedienerRichtlinienDienst({ async schreibeDurable() {} });
}

function protocol({ fehler = false, falsch = false } = {}) {
  return {
    eintraege: [],
    async schreibeDurable(intent) {
      if (fehler) throw new Error("DISK_DOWN");
      this.eintraege = [...this.eintraege, intent];
      return {
        durable: true,
        bestaetigungsId: "BANK-DEPOSIT-AUTH:" + intent.aktivierungsId,
        aktivierungsId: intent.aktivierungsId,
        transaktionsId: falsch ? "FALSCH" : intent.transaktionsId,
      };
    },
  };
}

function health() {
  return [{
    healthId: V5_PRODUKTIONS_STORAGE_HEALTH_ID,
    zustand: "GESUND",
    beobachtetAmMs: 90,
    gueltigBisMs: 2_000,
    evidenceId: "HEALTH-BANK-DEPOSIT-1",
  }];
}

function metrik(zeitMs = 100) {
  return {
    schemaVersion: 1,
    zeitMs,
    ssdIoLatenzMs: 2,
    ioQueueTiefe: 0,
    backpressureAktiv: false,
    freieBytes: 50_000_000,
    recorderDrops: 0,
  };
}

function anforderung(overrides = {}) {
  return {
    schemaVersion: 1,
    aktivierungsId: "BANK-DEPOSIT-AUTH-1",
    transaktionsId: "BANK-DEPOSIT-TX-1",
    faehigkeitId: MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
    anbieterModulId: MERCHANT_BANK_CORE_MODUL_ID,
    anbieterVersion: MERCHANT_BANK_CORE_MODUL_VERSION,
    actionContractId: BANK_DEPOSIT_ACTION_CONTRACT_ID,
    recoveryContractId: BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
    verifierId: BANK_DEPOSIT_VERIFIER_ID,
    policyId: BANK_DEPOSIT_EINMAL_POLICY_ID,
    bestaetigungText: BANK_DEPOSIT_EINMAL_BESTAETIGUNG,
    healthEvidence: health(),
    jetztMs: 100,
    gueltigBisMs: 2_100,
    ...overrides,
  };
}

async function system(optionen = {}) {
  const bediener = policy();
  const durable = optionen.protokoll ?? protocol();
  const runtime = new V5ProduktionsRuntime(
    erstelleKanonischeProduktionsKomposition(),
    bediener,
    null,
    null,
    optionen.ohneProtokoll ? null : durable,
  );
  assert.equal((await runtime.starte()).erfolgreich, true);
  runtime.erfasseOperationsMetrik(metrik());
  return { runtime, bediener, durable };
}

test("Bank-Deposit-Authority wird durable und default-off ausgestellt", async () => {
  const { runtime, durable } = await system();
  const ergebnis = await runtime.erteileBankDepositEinmalAuthority(
    anforderung(),
  );
  assert.equal(ergebnis.erfolgreich, true);
  assert.equal(ergebnis.grund, "V5_BANK_DEPOSIT_EINMAL_AUTHORITY_ERTEILT");
  assert.ok(ergebnis.authority);
  assert.equal(durable.eintraege.length, 1);
  assert.equal(
    durable.eintraege[0].art,
    "BANK_DEPOSIT_EINMAL_AUTHORITY_VOR_WIRKUNG",
  );
  const status = runtime.status();
  assert.equal(status.aktiveMutierendeFaehigkeiten, 0);
  assert.equal(status.offeneBankDepositEinmalAuthority, true);
  assert.equal(status.gameplayAutoritaet, false);
  assert.equal(status.rawWriteAutoritaet, false);
});

test("Bank-Deposit-Authority ist exakt einmal nutzbar", async () => {
  const { runtime } = await system();
  const ergebnis = await runtime.erteileBankDepositEinmalAuthority(
    anforderung(),
  );
  const authority = ergebnis.authority;
  assert.ok(authority);
  assert.equal(authority.gueltigFuer(101), true);
  assert.equal(
    authority.pruefe(
      MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
      MERCHANT_BANK_CORE_MODUL_ID,
    ).erlaubt,
    true,
  );
  assert.equal(
    authority.pruefe(
      MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
      MERCHANT_BANK_CORE_MODUL_ID,
    ).erlaubt,
    false,
  );
  const reval = runtime.revalidiereBankDepositEinmalAuthority(health(), 101);
  assert.equal(reval.bereit, true);
  assert.equal(reval.authorityOffen, false);
  assert.equal(runtime.status().offeneBankDepositEinmalAuthority, false);
});

test("falsche Bindung und triviale Bestaetigung blockieren vor Durable-Write", async () => {
  const { runtime, durable } = await system();
  assert.equal(
    (await runtime.erteileBankDepositEinmalAuthority(
      anforderung({ actionContractId: "AL-ACTION-BANK-WITHDRAW" }),
    )).erfolgreich,
    false,
  );
  assert.equal(
    (await runtime.erteileBankDepositEinmalAuthority(
      anforderung({ bestaetigungText: "mach weiter" }),
    )).erfolgreich,
    false,
  );
  assert.equal(durable.eintraege.length, 0);
});

test("Bank-Deposit-Authority verlangt bestaetigtes Durable-Protokoll", async () => {
  const ohne = await system({ ohneProtokoll: true });
  assert.equal(
    (await ohne.runtime.erteileBankDepositEinmalAuthority(
      anforderung(),
    )).grund,
    "V5_BANK_DEPOSIT_EINMAL_DURABLE_PROTOKOLL_FEHLT",
  );
  const disk = await system({ protokoll: protocol({ fehler: true }) });
  assert.equal(
    (await disk.runtime.erteileBankDepositEinmalAuthority(
      anforderung(),
    )).grund,
    "V5_BANK_DEPOSIT_EINMAL_AUDIT_NICHT_DURABLE",
  );
  const falsch = await system({ protokoll: protocol({ falsch: true }) });
  assert.equal(
    (await falsch.runtime.erteileBankDepositEinmalAuthority(
      anforderung(),
    )).grund,
    "V5_BANK_DEPOSIT_EINMAL_DURABILITY_NICHT_BESTAETIGT",
  );
});

test("Deny widerruft offene Bank-Deposit-Authority", async () => {
  const { runtime, bediener } = await system();
  const ergebnis = await runtime.erteileBankDepositEinmalAuthority(
    anforderung(),
  );
  assert.ok(ergebnis.authority);
  await bediener.wendeDenyAn({
    schemaVersion: 1,
    befehlId: "DENY-BANK-DEPOSIT-1",
    bedienerId: "operator",
    zeitMs: 101,
    art: "FAEHIGKEIT_SPERREN",
    faehigkeitId: MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
  });
  const reval = runtime.revalidiereBankDepositEinmalAuthority(health(), 101);
  assert.equal(reval.bereit, false);
  assert.equal(reval.authorityWiderrufen, true);
  assert.equal(ergebnis.authority.gueltigFuer(101), false);
});
