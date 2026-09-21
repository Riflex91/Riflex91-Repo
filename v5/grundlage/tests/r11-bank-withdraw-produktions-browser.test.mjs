import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  BANK_WITHDRAW_PREFLIGHT_BROWSER_READ_ONLY,
  BANK_WITHDRAW_PREFLIGHT_GAMEPLAY_WRITES,
  validiereBankWithdrawPreflightBeobachtung,
} from "../../werkzeuge/bank-withdraw-produktions-browser.mjs";

function observation(overrides = {}) {
  return {
    status: "OK",
    accountId: "account-1",
    charakterName: "Merchant",
    sessionId: "merchant-session",
    ctype: "merchant",
    map: "bank",
    serverRegion: "EU",
    serverKennung: "I",
    rip: false,
    bewegtSich: false,
    queueAktiv: false,
    alternativeRuntimeAktiv: false,
    bankGemountet: true,
    characterGold: 100,
    bankGold: 1000,
    ...overrides,
  };
}

test("Bank-Withdraw-Browserbeobachtung ist strikt read-only", () => {
  assert.equal(BANK_WITHDRAW_PREFLIGHT_BROWSER_READ_ONLY, true);
  assert.equal(BANK_WITHDRAW_PREFLIGHT_GAMEPLAY_WRITES, 0);
  const source = fs.readFileSync(
    "werkzeuge/bank-withdraw-produktions-browser.mjs",
    "utf8",
  );
  for (const muster of [
    /\bbank_deposit\s*\(/,
    /\bbank_withdraw\s*\(/,
    /\bbank_store\s*\(/,
    /\bbank_retrieve\s*\(/,
    /\.emit\s*\(/,
  ]) {
    assert.equal(muster.test(source), false);
  }
});

test("Bank-Withdraw-Preflight akzeptiert reale Gold-Baselines", () => {
  const value = validiereBankWithdrawPreflightBeobachtung(observation());
  assert.equal(value.characterGold, 100);
  assert.equal(value.bankGold, 1000);
  assert.equal(value.bankGemountet, true);
});

test("Bank-Withdraw-Preflight blockiert stale/ungeeignete Live-Zustaende", () => {
  for (const override of [
    { ctype: "mage" },
    { rip: true },
    { bewegtSich: true },
    { queueAktiv: true },
    { alternativeRuntimeAktiv: true },
    { bankGemountet: false },
    { characterGold: null },
    { bankGold: 0 },
    { bankGold: null },
    { sessionId: "" },
    { serverRegion: "" },
  ]) {
    assert.throws(
      () => validiereBankWithdrawPreflightBeobachtung(
        observation(override),
      ),
    );
  }
});
