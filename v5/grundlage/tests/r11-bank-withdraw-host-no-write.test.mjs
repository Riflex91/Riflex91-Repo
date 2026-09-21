import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  BANK_DEPOSIT_ACTION_CONTRACT_ID,
  BANK_DEPOSIT_EINMAL_BESTAETIGUNG,
  BANK_DEPOSIT_EINMAL_POLICY_ID,
  BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
  BANK_DEPOSIT_VERIFIER_ID,
  BANK_WITHDRAW_ACTION_CONTRACT_ID,
  BANK_WITHDRAW_EINMAL_BESTAETIGUNG,
  BANK_WITHDRAW_EINMAL_POLICY_ID,
  BANK_WITHDRAW_RECOVERY_CONTRACT_ID,
  BANK_WITHDRAW_VERIFIER_ID,
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_CORE_MODUL_VERSION,
  MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
  MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID,
} from "../../erzeugt/index.js";
import {
  erstelleNodeV5ProduktionsHost,
} from "../../werkzeuge/v5-produktions-host-komposition.mjs";

function hostOptionen(root) {
  return {
    dateisystemOptionen: { wurzel: root, testmodus: true },
    operationsOptionen: {
      minimaleFreieBytes: 1,
      maximaleIoLatenzMs: 60_000,
      gueltigkeitMs: 5_000,
    },
  };
}

function withdrawAuthority(id = "NODE-BANK-WITHDRAW-AUTH-1", jetztMs = 101) {
  return {
    schemaVersion: 1,
    aktivierungsId: id,
    transaktionsId: "NODE-BANK-WITHDRAW-TX-1",
    faehigkeitId: MERCHANT_BANK_WITHDRAW_FAEHIGKEIT_ID,
    anbieterModulId: MERCHANT_BANK_CORE_MODUL_ID,
    anbieterVersion: MERCHANT_BANK_CORE_MODUL_VERSION,
    actionContractId: BANK_WITHDRAW_ACTION_CONTRACT_ID,
    recoveryContractId: BANK_WITHDRAW_RECOVERY_CONTRACT_ID,
    verifierId: BANK_WITHDRAW_VERIFIER_ID,
    policyId: BANK_WITHDRAW_EINMAL_POLICY_ID,
    bestaetigungText: BANK_WITHDRAW_EINMAL_BESTAETIGUNG,
    gueltigBisMs: jetztMs + 2_000,
  };
}

function depositAuthority(id = "NODE-BANK-DEPOSIT-CONFLICT", jetztMs = 102) {
  return {
    schemaVersion: 1,
    aktivierungsId: id,
    transaktionsId: "NODE-BANK-DEPOSIT-CONFLICT-TX",
    faehigkeitId: MERCHANT_BANK_DEPOSIT_FAEHIGKEIT_ID,
    anbieterModulId: MERCHANT_BANK_CORE_MODUL_ID,
    anbieterVersion: MERCHANT_BANK_CORE_MODUL_VERSION,
    actionContractId: BANK_DEPOSIT_ACTION_CONTRACT_ID,
    recoveryContractId: BANK_DEPOSIT_RECOVERY_CONTRACT_ID,
    verifierId: BANK_DEPOSIT_VERIFIER_ID,
    policyId: BANK_DEPOSIT_EINMAL_POLICY_ID,
    bestaetigungText: BANK_DEPOSIT_EINMAL_BESTAETIGUNG,
    gueltigBisMs: jetztMs + 2_000,
  };
}

test("Node-Host stellt Withdraw-One-Shot durable und ohne Gameplay-Write aus", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-node-bank-withdraw-auth-"));
  try {
    const host = await erstelleNodeV5ProduktionsHost(hostOptionen(root));
    assert.equal((await host.starte(100)).zustand, "LAEUFT");

    const ergebnis = await host.erteileBankWithdrawEinmalAuthority(
      withdrawAuthority(),
      101,
    );

    assert.equal(ergebnis.erfolgreich, true);
    assert.ok(ergebnis.authority);
    assert.equal(ergebnis.authority.gueltigFuer(101), true);
    assert.equal(host.status().bankWithdrawEinmalAuthorityOffen, true);
    assert.equal(host.status().bankDepositEinmalAuthorityOffen, false);
    assert.equal(host.status().equipEinmalAuthorityOffen, false);
    assert.equal(host.status().gameplayAutoritaet, false);
    assert.equal(host.status().rawWriteAutoritaet, false);
    assert.equal(host.status().actionAuthority, false);

    const audit = JSON.parse(await fs.readFile(
      path.join(
        root,
        "runtime",
        "authority",
        "mutieren",
        "bank-withdraw",
        "NODE-BANK-WITHDRAW-AUTH-1.json",
      ),
      "utf8",
    ));
    assert.equal(audit.transaktionsId, "NODE-BANK-WITHDRAW-TX-1");
    assert.equal(audit.maximaleVerwendungen, 1);
    assert.equal(audit.gameplayWriteNochNichtAusgefuehrt, true);

    await assert.rejects(
      () => host.erteileBankDepositEinmalAuthority(
        depositAuthority(),
        102,
      ),
      /WITHDRAW_AUTHORITY_OFFEN/,
    );

    await host.stoppe("TEST_ENDE");
    assert.equal(ergebnis.authority.gueltigFuer(103), false);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("Withdraw-Startbereitschaft teilt Bank-Lease-Grenze, aber besitzt eigenen Current-Fence", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "v5-node-bank-withdraw-ready-"));
  try {
    const host = await erstelleNodeV5ProduktionsHost(hostOptionen(root));
    const bereit = await host.pruefeBankWithdrawStartBereit();
    assert.equal(bereit.bereit, true);
    assert.equal(bereit.offeneTransaktionsId, null);
    assert.equal(bereit.offeneBankLease, null);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
