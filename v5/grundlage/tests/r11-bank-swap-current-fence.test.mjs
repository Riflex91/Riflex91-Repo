import test from "node:test";
import assert from "node:assert/strict";

import { pruefeBankSwapVorAuthorityCurrentFence } from "../../erzeugt/index.js";

function basis(overrides = {}) {
  return {
    schemaVersion: 1,
    equipEinmalAuthorityOffen: false,
    bankDepositEinmalAuthorityOffen: false,
    bankWithdrawEinmalAuthorityOffen: false,
    bankSwapEinmalAuthorityOffen: false,
    offeneBankDepositTransaktionId: null,
    offeneBankWithdrawTransaktionId: null,
    offeneBankSwapTransaktionId: null,
    aktiveBankLease: false,
    ...overrides,
  };
}

test("Bank-Swap-Current-Fence ist nur ohne konkurrierende Authority, Tx oder Lease bereit", () => {
  assert.equal(pruefeBankSwapVorAuthorityCurrentFence(basis()).status, "BEREIT");
  for (const overrides of [
    { equipEinmalAuthorityOffen: true },
    { bankDepositEinmalAuthorityOffen: true },
    { bankWithdrawEinmalAuthorityOffen: true },
    { bankSwapEinmalAuthorityOffen: true },
    { offeneBankDepositTransaktionId: "D" },
    { offeneBankWithdrawTransaktionId: "W" },
    { offeneBankSwapTransaktionId: "S" },
    { aktiveBankLease: true },
  ]) {
    const r = pruefeBankSwapVorAuthorityCurrentFence(basis(overrides));
    assert.equal(r.status, "BLOCKIERT");
    assert.equal(r.gameplayAutoritaet, false);
    assert.equal(r.rawWriteAutoritaet, false);
    assert.equal(r.actionAuthority, false);
  }
});
