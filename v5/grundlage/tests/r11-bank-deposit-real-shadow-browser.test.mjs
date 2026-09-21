import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  BANK_DEPOSIT_REAL_SHADOW_BROWSER_READ_ONLY,
  BANK_DEPOSIT_REAL_SHADOW_GAMEPLAY_WRITES,
  erstelleBankDepositShadowReleaseBeobachter,
  validiereBankDepositShadowAusgangsBeobachtung,
  warteAufManuellenBankMountReadOnly,
} from "../../werkzeuge/bank-deposit-produktions-browser.mjs";

function observation(overrides = {}) {
  return {
    status: "OK",
    accountId: "account-1",
    charakterName: "Merchant",
    sessionId: "merchant-session",
    ctype: "merchant",
    map: "main",
    serverRegion: "EU",
    serverKennung: "I",
    rip: false,
    bewegtSich: false,
    queueAktiv: false,
    alternativeRuntimeAktiv: false,
    bankGemountet: false,
    characterGold: 100,
    bankGold: null,
    inventoryMaterial: "0:hpot0:0:10:",
    ...overrides,
  };
}

function fakeSession(values) {
  let index = 0;
  return {
    async evaluate() {
      const value = values[Math.min(index, values.length - 1)];
      index += 1;
      return value;
    },
  };
}

test("Real-Browser-Shadow startet nur ausserhalb der Bank und bleibt read-only", () => {
  assert.equal(BANK_DEPOSIT_REAL_SHADOW_BROWSER_READ_ONLY, true);
  assert.equal(BANK_DEPOSIT_REAL_SHADOW_GAMEPLAY_WRITES, 0);
  const start = validiereBankDepositShadowAusgangsBeobachtung(observation());
  assert.equal(start.bankGemountet, false);
  assert.throws(
    () => validiereBankDepositShadowAusgangsBeobachtung(
      observation({ bankGemountet: true, bankGold: 500 }),
    ),
    /START_MUSS_AUSSERHALB_BANK/,
  );

  for (const datei of [
    "werkzeuge/bank-deposit-produktions-browser.mjs",
    "werkzeuge/bank-deposit-real-browser-shadow.mjs",
  ]) {
    const source = fs.readFileSync(datei, "utf8");
    for (const muster of [
      /\bbank_deposit\s*\(/,
      /\bbank_withdraw\s*\(/,
      /\bbank_store\s*\(/,
      /\bbank_retrieve\s*\(/,
      /\.emit\s*\(/,
      /AusfuehrungsAdapter/,
      /AusfuehrungsKernel/,
    ]) {
      assert.equal(muster.test(source), false, datei + " " + muster);
    }
  }
});

test("manueller Mount muss nach Lease als stabiler false-zu-true-Uebergang beobachtet werden", async () => {
  const ausgang = validiereBankDepositShadowAusgangsBeobachtung(
    observation(),
  );
  const mounted = observation({
    map: "bank",
    bankGemountet: true,
    bankGold: 500,
  });
  const phases = [];
  const result = await warteAufManuellenBankMountReadOnly(
    fakeSession([
      observation(),
      mounted,
      mounted,
    ]),
    7,
    ausgang,
    {
      timeoutMs: 2_000,
      pollMs: 100,
      onPhase: x => phases.push(x),
    },
  );
  assert.equal(result.bankGemountet, true);
  assert.equal(result.bankGold, 500);
  assert.match(result.fingerprint, /^[a-f0-9]{64}$/);
  assert.match(result.inventorySha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(phases, [
    "LEASE_ERWORBEN_BANK_MANUELL_BETRETEN",
    "BANK_MOUNT_STABIL_BEOBACHTET",
  ]);
});

test("Session- oder Serverdrift waehrend manuellem Mount blockiert fail-closed", async () => {
  const ausgang = validiereBankDepositShadowAusgangsBeobachtung(
    observation(),
  );
  await assert.rejects(
    () => warteAufManuellenBankMountReadOnly(
      fakeSession([
        observation({ sessionId: "andere-session" }),
      ]),
      7,
      ausgang,
      { timeoutMs: 500, pollMs: 100 },
    ),
    /BINDUNG_DRIFT/,
  );
});

test("Release-Beobachter gibt Lease erst nach stabilem manuellen Bank-Exit frei", async () => {
  const mounted = {
    ...observation({
      map: "bank",
      bankGemountet: true,
      bankGold: 500,
    }),
    beobachtetAmMs: 100,
    fingerprint: "f".repeat(64),
    inventorySha256: "i".repeat(64),
  };
  const phases = [];
  const observer = erstelleBankDepositShadowReleaseBeobachter(
    fakeSession([
      observation({
        map: "bank",
        bankGemountet: true,
        bankGold: 500,
      }),
      observation({
        map: "main",
        bankGemountet: false,
        bankGold: null,
      }),
    ]),
    7,
    mounted,
    {
      timeoutMs: 2_000,
      pollMs: 100,
      onPhase: x => phases.push(x),
    },
  );
  const evidence = await observer.beobachte({}, Date.now());
  assert.deepEqual(evidence, {
    offeneTransaktionen: 0,
    backendInProgress: false,
    bankActionInFlight: false,
    characterBankAktiv: false,
    erwarteterExitBeobachtet: true,
  });
  assert.deepEqual(phases, [
    "ADMISSION_BESTANDEN_BANK_MANUELL_VERLASSEN",
    "BANK_EXIT_STABIL_BEOBACHTET",
  ]);
});
