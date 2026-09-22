import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  BANK_SWAP_PREFLIGHT_BROWSER_READ_ONLY,
  BANK_SWAP_PREFLIGHT_GAMEPLAY_WRITES,
  BANK_SWAP_PREFLIGHT_MUTATING_PUBLIC_FUNCTION_CALLS,
  validiereBankSwapPreflightBeobachtung,
} from "../../werkzeuge/bank-swap-produktions-browser.mjs";

function obs(overrides = {}) {
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
    bridgeFunctionAvailable: true,
    codeActive: false,
    characterGold: 100,
    bankGold: 0,
    inventory: [null, { name: "hpot0", q: 5 }],
    packs: [{
      pack: "items0",
      packMap: "bank",
      slots: [
        { name: "helmet", level: 0 },
        { name: "shoes", level: 1 },
        { name: "shoes", level: 2 },
      ],
    }],
    ...overrides,
  };
}

test("Bank-Swap-Browserobserver ist strikt read-only", () => {
  assert.equal(BANK_SWAP_PREFLIGHT_BROWSER_READ_ONLY, true);
  assert.equal(BANK_SWAP_PREFLIGHT_GAMEPLAY_WRITES, 0);
  assert.equal(BANK_SWAP_PREFLIGHT_MUTATING_PUBLIC_FUNCTION_CALLS, 0);
  const source = fs.readFileSync(
    "werkzeuge/bank-swap-produktions-browser.mjs",
    "utf8",
  );
  for (const muster of [
    /\bbank_swap\s*\(/,
    /\bbank_store\s*\(/,
    /\bbank_retrieve\s*\(/,
    /\bbank_deposit\s*\(/,
    /\bbank_withdraw\s*\(/,
    /call_code_function_f\s*\(/,
    /\.emit\s*\(/,
  ]) assert.equal(muster.test(source), false);
});

test("Bank-Swap-Preflight waehlt zwei verschieden benannte Slots im aktuellen Pack", () => {
  const r = validiereBankSwapPreflightBeobachtung(obs(), 123);
  assert.equal(r.kandidat.pack, "items0");
  assert.equal(r.kandidat.a, 0);
  assert.equal(r.kandidat.b, 1);
  assert.equal(r.kandidat.itemA.name, "helmet");
  assert.equal(r.kandidat.itemB.name, "shoes");
  assert.equal(r.bankGold, 0);
  assert.equal(r.bridgeFunctionAvailable, true);
  assert.equal(r.codeActive, false);
  assert.match(r.kandidat.packRestFingerprint, /^[a-f0-9]{64}$/);
});

test("Bank-Swap-Preflight ignoriert Packs eines anderen Bank-Mounts", () => {
  const value = obs({
    map: "bank",
    packs: [
      { pack: "items8", packMap: "bank_b", slots: [
        { name: "helmet" }, { name: "shoes" },
      ] },
      { pack: "items0", packMap: "bank", slots: [
        { name: "gloves" }, { name: "pants" },
      ] },
    ],
  });
  const r = validiereBankSwapPreflightBeobachtung(value, 123);
  assert.equal(r.kandidat.pack, "items0");
  assert.deepEqual(r.beobachtetePacks, ["items0"]);
});

test("Bank-Swap-Preflight blockiert Stack-Risiko und ungeeignete Live-Zustaende", () => {
  const sameNames = obs({
    packs: [{
      pack: "items0",
      packMap: "bank",
      slots: [{ name: "hpot0", q: 10 }, { name: "hpot0", q: 20 }],
    }],
  });
  assert.throws(
    () => validiereBankSwapPreflightBeobachtung(sameNames, 123),
    /KEIN_SICHERER_ZWEI_SLOT_KANDIDAT/,
  );
  for (const override of [
    { ctype: "mage" },
    { rip: true },
    { bewegtSich: true },
    { queueAktiv: true },
    { alternativeRuntimeAktiv: true },
    { bankGemountet: false },
    { bridgeFunctionAvailable: false },
    { characterGold: null },
    { bankGold: null },
  ]) {
    assert.throws(
      () => validiereBankSwapPreflightBeobachtung(obs(override), 123),
    );
  }
});
