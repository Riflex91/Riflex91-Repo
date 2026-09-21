import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  BANK_STORE_REAL_SHADOW_BROWSER_READ_ONLY,
  BANK_STORE_REAL_SHADOW_GAMEPLAY_WRITES,
  erstelleBankStoreShadowReleaseBeobachter,
  validiereBankStoreShadowAusgangsBeobachtung,
  warteAufManuellenBankStoreMountReadOnly,
} from "../../werkzeuge/bank-store-produktions-browser.mjs";

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
    inventoryMaterial: JSON.stringify([JSON.stringify({ name: "hpot0" })]),
    bankMaterial: "{}",
    sourceSlot: 0,
    sourceItemMaterial: JSON.stringify({ name: "hpot0" }),
    targetPack: null,
    targetSlot: null,
    targetItemMaterial: null,
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

test("Bank-Store-Real-Shadow bleibt in Browser und Runner strikt no-write", () => {
  assert.equal(BANK_STORE_REAL_SHADOW_BROWSER_READ_ONLY, true);
  assert.equal(BANK_STORE_REAL_SHADOW_GAMEPLAY_WRITES, 0);
  const start = validiereBankStoreShadowAusgangsBeobachtung(observation());
  assert.equal(start.bankGemountet, false);

  for (const datei of [
    "werkzeuge/bank-store-produktions-browser.mjs",
    "werkzeuge/bank-store-real-browser-shadow.mjs",
  ]) {
    const source = fs.readFileSync(datei, "utf8");
    for (const muster of [
      /\bbank_store\s*\(/,
      /\bbank_retrieve\s*\(/,
      /\bbank_swap\s*\(/,
      /\bbank_deposit\s*\(/,
      /\bbank_withdraw\s*\(/,
      /\.emit\s*\(/,
      /AusfuehrungsAdapter/,
      /AusfuehrungsKernel/,
    ]) {
      assert.equal(muster.test(source), false, datei + " " + muster);
    }
  }
});

test("Store-Mount pinnt expliziten Source-Slot und leeren Target-Slot stabil", async () => {
  const ausgang = validiereBankStoreShadowAusgangsBeobachtung(observation());
  const mounted = observation({
    map: "bank",
    bankGemountet: true,
    bankMaterial: JSON.stringify({
      items0: [null, JSON.stringify({ name: "helmet" })],
    }),
    targetPack: "items0",
    targetSlot: 0,
  });
  const phases = [];
  const result = await warteAufManuellenBankStoreMountReadOnly(
    fakeSession([mounted, mounted]),
    7,
    ausgang,
    { timeoutMs: 2_000, pollMs: 100, onPhase: x => phases.push(x) },
  );
  assert.equal(result.sourceSlot, 0);
  assert.equal(result.targetPack, "items0");
  assert.equal(result.targetSlot, 0);
  assert.match(result.sourceItemFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(result.targetItemFingerprint, null);
  assert.match(result.fingerprint, /^[a-f0-9]{64}$/);
  assert.deepEqual(phases, [
    "LEASE_ERWORBEN_BANK_MANUELL_BETRETEN",
    "BANK_STORE_KANDIDAT_STABIL_BEOBACHTET",
  ]);
});

test("Store-Release gibt Lease erst nach manuellem Bank-Exit frei", async () => {
  const mounted = {
    ...observation({
      map: "bank",
      bankGemountet: true,
      targetPack: "items0",
      targetSlot: 0,
      bankMaterial: JSON.stringify({ items0: [null] }),
    }),
    beobachtetAmMs: 100,
    fingerprint: "f".repeat(64),
    inventorySha256: "i".repeat(64),
    bankSha256: "b".repeat(64),
    sourceItemFingerprint: "a".repeat(64),
    targetItemFingerprint: null,
  };
  const phases = [];
  const observer = erstelleBankStoreShadowReleaseBeobachter(
    fakeSession([
      observation({ map: "bank", bankGemountet: true }),
      observation({ map: "main", bankGemountet: false }),
    ]),
    7,
    mounted,
    { timeoutMs: 2_000, pollMs: 100, onPhase: x => phases.push(x) },
  );
  const evidence = await observer.beobachte({}, Date.now());
  assert.equal(evidence.erwarteterExitBeobachtet, true);
  assert.deepEqual(phases, [
    "ADMISSION_BESTANDEN_BANK_MANUELL_VERLASSEN",
    "BANK_EXIT_STABIL_BEOBACHTET",
  ]);
});
