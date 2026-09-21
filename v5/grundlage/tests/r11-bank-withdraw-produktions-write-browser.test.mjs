import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  ProduktionsCdpBankWithdrawEinGoldAdapter,
  erstelleBankWithdrawEinGoldVorherBindung,
  erstelleProduktivenBankWithdrawBeobachter,
} from "../../werkzeuge/bank-withdraw-produktions-write-browser.mjs";

function raw(overrides = {}) {
  return {
    status: "OK",
    accountId: "account-1",
    charakterName: "merchant",
    sessionId: "session-1",
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
    bankGold: 500,
    inventoryMaterial: "0:hpot0:0:10:",
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    betrag: 1,
    accountId: "account-1",
    characterId: "merchant",
    sessionId: "session-1",
    serverRegion: "EU",
    serverIdentifier: "I",
    erwartetesCharacterGold: 100,
    erwartetesBankGold: 500,
    erwarteterFingerprint: "f".repeat(64),
    ...overrides,
  };
}

test("Bank-Withdraw-Write-Adapter enthaelt exakt einen erlaubten Public-Function-Write und keinen Raw-Socket-Bypass", () => {
  const source = fs.readFileSync(
    "werkzeuge/bank-withdraw-produktions-write-browser.mjs",
    "utf8",
  );
  assert.equal((source.match(/root\.bank_withdraw\(1\)/g) ?? []).length, 1);
  for (const muster of [
    /\.emit\s*\(/,
    /\bbank_deposit\s*\(/,
    /\bbank_store\s*\(/,
    /\bbank_retrieve\s*\(/,
    /\bbank_swap\s*\(/,
    /\bopen_bank_pack\s*\(/,
  ]) {
    assert.equal(muster.test(source), false, String(muster));
  }
});

test("Bank-Withdraw-Adapter sendet bei exakter Bindung genau einmal", async () => {
  let calls = 0;
  let expression = "";
  const session = {
    async evaluate(expr, contextId, options) {
      calls += 1;
      expression = expr;
      assert.equal(contextId, 7);
      assert.equal(options.userGesture, true);
      return { sent: true, result: { response: "bank_store" } };
    },
  };
  const adapter = new ProduktionsCdpBankWithdrawEinGoldAdapter(session, 7);
  assert.equal(adapter.actionContractId, "AL-ACTION-BANK-WITHDRAW");
  assert.equal(adapter.recoveryContractId, "AL-RECOVERY-BANK-WITHDRAW");
  assert.equal(adapter.verifierId, "AL-VERIFIER-BANK-WITHDRAW");
  const result = await adapter.sende({}, request());

  assert.equal(result.art, "SERVER_ERGEBNIS");
  assert.equal(calls, 1);
  assert.equal(adapter.adapterAufrufe, 1);
  assert.equal(adapter.gameWrites, 1);
  assert.equal(adapter.moeglicherSend, true);
  assert.ok(expression.includes("root.bank_withdraw(1)"));

  await assert.rejects(
    () => adapter.sende({}, request()),
    /MEHR_ALS_EIN_ADAPTER_AUFRUF/,
  );
});

test("Bank-Withdraw-Adapter blockiert ungueltige Anfrage vor Browseraufruf", async () => {
  let calls = 0;
  const adapter = new ProduktionsCdpBankWithdrawEinGoldAdapter({
    async evaluate() {
      calls += 1;
      return { sent: true };
    },
  }, 1);
  const result = await adapter.sende({}, request({ betrag: 2 }));
  assert.equal(result.art, "NICHT_GESENDET");
  assert.equal(calls, 0);
  assert.equal(adapter.adapterAufrufe, 1);
  assert.equal(adapter.gameWrites, 0);
  assert.equal(adapter.moeglicherSend, false);
});

test("CDP-Abbruch nach moeglichem Send wird UNBEKANNT und nie erneut gesendet", async () => {
  const adapter = new ProduktionsCdpBankWithdrawEinGoldAdapter({
    async evaluate() {
      throw new Error("CDP_DISCONNECT");
    },
  }, 1);
  const result = await adapter.sende({}, request());
  assert.equal(result.art, "UNBEKANNT");
  assert.equal(result.grund, "DISCONNECT_NACH_MOEGLICHEM_SEND");
  assert.equal(adapter.adapterAufrufe, 1);
  assert.equal(adapter.gameWrites, 0);
  assert.equal(adapter.moeglicherSend, true);
  await assert.rejects(
    () => adapter.sende({}, request()),
    /MEHR_ALS_EIN_ADAPTER_AUFRUF/,
  );
});

test("produktiver Bank-Beobachter bindet frischen Mount an Lease- und Mount-Epoche", async () => {
  const session = {
    async evaluate() {
      return raw();
    },
  };
  const beobachter = erstelleProduktivenBankWithdrawBeobachter(
    session,
    3,
    raw({ bankGemountet: false, bankGold: null }),
  );
  const bindung = await beobachter.beobachte(4, 1234);
  assert.equal(bindung.characterId, "merchant");
  assert.equal(bindung.sessionId, "session-1");
  assert.equal(bindung.serverRegion, "EU");
  assert.equal(bindung.serverKennung, "I");
  assert.equal(bindung.leaseEpoche, 4);
  assert.equal(bindung.mountEpoche, 1234);
  assert.equal(bindung.characterGold, 100);
  assert.equal(bindung.bankGold, 500);
  assert.match(bindung.fingerprint, /^[a-f0-9]{64}$/);

  const vorher = erstelleBankWithdrawEinGoldVorherBindung(
    {
      ...raw(),
      beobachtetAmMs: 1200,
      fingerprint: bindung.fingerprint,
    },
    4,
  );
  assert.equal(vorher.leaseEpoche, 4);
  assert.equal(vorher.mountEpoche, 1200);
  assert.equal(vorher.characterGold, 100);
  assert.equal(vorher.bankGold, 500);
});
