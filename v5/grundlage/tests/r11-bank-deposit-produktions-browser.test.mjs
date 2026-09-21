import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  BANK_DEPOSIT_PREFLIGHT_BROWSER_READ_ONLY,
  BANK_DEPOSIT_PREFLIGHT_GAMEPLAY_WRITES,
  validiereBankDepositPreflightBeobachtung,
} from "../../werkzeuge/bank-deposit-produktions-browser.mjs";

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

test("Bank-Deposit-Browserbeobachtung ist strikt read-only", () => {
  assert.equal(BANK_DEPOSIT_PREFLIGHT_BROWSER_READ_ONLY, true);
  assert.equal(BANK_DEPOSIT_PREFLIGHT_GAMEPLAY_WRITES, 0);
  const source = fs.readFileSync(
    "werkzeuge/bank-deposit-produktions-browser.mjs",
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

test("Bank-Deposit-Preflight akzeptiert reale Gold-Baselines", () => {
  const value = validiereBankDepositPreflightBeobachtung(observation());
  assert.equal(value.characterGold, 100);
  assert.equal(value.bankGold, 1000);
  assert.equal(value.bankGemountet, true);
});

test("Bank-Deposit-Preflight blockiert stale/ungeeignete Live-Zustaende", () => {
  for (const override of [
    { ctype: "mage" },
    { rip: true },
    { bewegtSich: true },
    { queueAktiv: true },
    { alternativeRuntimeAktiv: true },
    { bankGemountet: false },
    { characterGold: 0 },
    { bankGold: null },
    { sessionId: "" },
    { serverRegion: "" },
  ]) {
    assert.throws(
      () => validiereBankDepositPreflightBeobachtung(
        observation(override),
      ),
    );
  }
});
