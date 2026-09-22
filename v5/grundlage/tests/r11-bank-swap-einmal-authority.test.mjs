import test from "node:test";
import assert from "node:assert/strict";

import {
  BANK_SWAP_ACTION_CONTRACT_ID,
  BANK_SWAP_EINMAL_BESTAETIGUNG,
  BANK_SWAP_EINMAL_POLICY_ID,
  BANK_SWAP_RECOVERY_CONTRACT_ID,
  BANK_SWAP_VERIFIER_ID,
  MERCHANT_BANK_CORE_MODUL_ID,
  MERCHANT_BANK_CORE_MODUL_VERSION,
  MERCHANT_BANK_SWAP_FAEHIGKEIT_ID,
  erteileProduktiveBankSwapEinmalAuthority,
} from "../../erzeugt/index.js";

function health() {
  return [{
    healthId: "produktiver-speicher",
    zustand: "GESUND",
    beobachtetAmMs: 90,
    gueltigBisMs: 500,
    evidenceId: "HEALTH-BANK-SWAP-1",
  }];
}

function req(overrides = {}) {
  return {
    schemaVersion: 1,
    aktivierungsId: "BANK-SWAP-AUTH-1",
    transaktionsId: "BANK-SWAP-TX-1",
    faehigkeitId: MERCHANT_BANK_SWAP_FAEHIGKEIT_ID,
    anbieterModulId: MERCHANT_BANK_CORE_MODUL_ID,
    anbieterVersion: MERCHANT_BANK_CORE_MODUL_VERSION,
    actionContractId: BANK_SWAP_ACTION_CONTRACT_ID,
    recoveryContractId: BANK_SWAP_RECOVERY_CONTRACT_ID,
    verifierId: BANK_SWAP_VERIFIER_ID,
    policyId: BANK_SWAP_EINMAL_POLICY_ID,
    bestaetigungText: BANK_SWAP_EINMAL_BESTAETIGUNG,
    healthEvidence: health(),
    jetztMs: 100,
    gueltigBisMs: 2100,
    faehigkeitsGeneration: 1,
    ...overrides,
  };
}

function protocol() {
  return {
    entries: [],
    async schreibeDurable(intent) {
      this.entries.push(intent);
      return {
        durable: true,
        bestaetigungsId: "BANK-SWAP-AUTH:" + intent.aktivierungsId,
        aktivierungsId: intent.aktivierungsId,
        transaktionsId: intent.transaktionsId,
      };
    },
  };
}

test("Bank-Swap-One-Shot-Authority wird vor Wirkung durable ausgestellt", async () => {
  const p = protocol();
  const r = await erteileProduktiveBankSwapEinmalAuthority(req(), p);
  assert.equal(r.erfolgreich, true);
  assert.equal(p.entries.length, 1);
  assert.equal(p.entries[0].art, "BANK_SWAP_EINMAL_AUTHORITY_VOR_WIRKUNG");
  assert.equal(p.entries[0].gameplayWriteNochNichtAusgefuehrt, true);
  assert.equal(r.gameplayWriteAusgefuehrt, false);
  assert.equal(r.breiteRuntimeFreigabe, false);
});

test("Bank-Swap-One-Shot-Authority ist exakt einmal verbrauchbar", async () => {
  const r = await erteileProduktiveBankSwapEinmalAuthority(req(), protocol());
  assert.ok(r.authority);
  assert.equal(r.authority.gueltigFuer(101), true);
  assert.equal(r.authority.pruefe(
    MERCHANT_BANK_SWAP_FAEHIGKEIT_ID,
    MERCHANT_BANK_CORE_MODUL_ID,
  ).erlaubt, true);
  assert.equal(r.authority.pruefe(
    MERCHANT_BANK_SWAP_FAEHIGKEIT_ID,
    MERCHANT_BANK_CORE_MODUL_ID,
  ).erlaubt, false);
});

test("Bank-Swap-Authority blockiert falsche Bindung, triviale Bestaetigung und stale Health", async () => {
  for (const overrides of [
    { actionContractId: "AL-ACTION-BANK-WITHDRAW" },
    { bestaetigungText: "mach weiter" },
    { healthEvidence: [{ ...health()[0], gueltigBisMs: 99 }] },
  ]) {
    const p = protocol();
    const r = await erteileProduktiveBankSwapEinmalAuthority(req(overrides), p);
    assert.equal(r.erfolgreich, false);
    assert.equal(p.entries.length, 0);
  }
});

test("Bank-Swap-Authority verlangt bestaetigte Durable-Persistenz", async () => {
  const noProtocol = await erteileProduktiveBankSwapEinmalAuthority(req(), null);
  assert.equal(noProtocol.grund, "V5_BANK_SWAP_EINMAL_DURABLE_PROTOKOLL_FEHLT");
  const bad = {
    async schreibeDurable(intent) {
      return { durable: true, bestaetigungsId: "x", aktivierungsId: intent.aktivierungsId, transaktionsId: "FALSCH" };
    },
  };
  const r = await erteileProduktiveBankSwapEinmalAuthority(req(), bad);
  assert.equal(r.grund, "V5_BANK_SWAP_EINMAL_DURABILITY_NICHT_BESTAETIGT");
});
