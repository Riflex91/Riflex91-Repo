import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  BANK_WITHDRAW_ERSTER_BETRAG,
  pruefeBankWithdrawEinGoldBereitschaft,
  pruefeBankWithdrawEinGoldSettlement,
} from "../../erzeugt/merchant/bank-withdraw-settlement.js";

const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

function bindung(override = {}) {
  return {
    schemaVersion: 1,
    characterId: "merchant-a",
    sessionId: "session-1",
    serverRegion: "EU",
    serverKennung: "I",
    leaseEpoche: 8,
    mountEpoche: 12,
    beobachtetAmMs: 1000,
    characterGold: 100,
    bankGold: 500,
    fingerprint: "a".repeat(64),
    ...override,
  };
}

test("naechster Bank-Live-Kandidat ist exakt ein Gold Withdraw und bleibt no-write", () => {
  const kandidat = lies(
    "grundlage/vertraege/runtime/bank-withdraw-production-candidate.json",
  );
  assert.equal(BANK_WITHDRAW_ERSTER_BETRAG, 1);
  assert.equal(kandidat.status, "SETTLEMENT_CORE_RATIFIZIERT_NO_WRITE");
  assert.equal(kandidat.actionContractId, "AL-ACTION-BANK-WITHDRAW");
  assert.equal(kandidat.recoveryContractId, "AL-RECOVERY-BANK-WITHDRAW");
  assert.equal(kandidat.verifierId, "AL-VERIFIER-BANK-WITHDRAW");
  assert.equal(kandidat.publicFunction, "bank_withdraw");
  assert.equal(kandidat.ersterLiveBetragGold, 1);
  assert.equal(kandidat.authorityGrenze.gameplayAutoritaet, false);
  assert.equal(kandidat.authorityGrenze.rawWriteAutoritaet, false);
  assert.equal(kandidat.authorityGrenze.produktiveCapabilityInDiesemSchritt, false);
  assert.equal(kandidat.authorityGrenze.authorityInDiesemSchritt, false);
  assert.equal(kandidat.authorityGrenze.adapterInDiesemSchritt, false);
  assert.equal(kandidat.authorityGrenze.liveRunnerInDiesemSchritt, false);
  assert.equal(kandidat.authorityGrenze.gameplayWritesInDiesemSchritt, 0);
});

test("Withdraw-Bereitschaft verlangt Merchant, Mount, Frische und Bankgold", () => {
  const bereit = pruefeBankWithdrawEinGoldBereitschaft({
    schemaVersion: 1,
    ctype: "merchant",
    lebt: true,
    bankGemountet: true,
    alternativeRuntimeAktiv: false,
    offeneBankTransaktion: false,
    evidenceFrisch: true,
    bindung: bindung(),
  });
  assert.equal(bereit.status, "BEREIT");
  assert.deepEqual(bereit.gruende, []);
  assert.equal(bereit.gameplayAutoritaet, false);

  const blockiert = pruefeBankWithdrawEinGoldBereitschaft({
    schemaVersion: 1,
    ctype: "mage",
    lebt: false,
    bankGemountet: false,
    alternativeRuntimeAktiv: true,
    offeneBankTransaktion: true,
    evidenceFrisch: false,
    bindung: bindung({ bankGold: 0 }),
  });
  assert.equal(blockiert.status, "BLOCKIERT");
  assert.ok(blockiert.gruende.includes("BANK_WITHDRAW_NUR_MERCHANT"));
  assert.ok(blockiert.gruende.includes("BANK_WITHDRAW_BANK_NICHT_GEMOUNTET"));
  assert.ok(blockiert.gruende.includes("BANK_WITHDRAW_ALTERNATIVE_RUNTIME_AKTIV"));
  assert.ok(blockiert.gruende.includes("BANK_WITHDRAW_OFFENE_TRANSAKTION"));
  assert.ok(blockiert.gruende.includes("BANK_WITHDRAW_EVIDENCE_STALE"));
  assert.ok(blockiert.gruende.includes("BANK_WITHDRAW_BANK_GOLD_ZU_NIEDRIG"));
});

test("Settlement bestaetigt nur gemeinsames exaktes +1/-1 Delta", () => {
  const ergebnis = pruefeBankWithdrawEinGoldSettlement(
    bindung(),
    bindung({
      beobachtetAmMs: 1001,
      characterGold: 101,
      bankGold: 499,
      fingerprint: "b".repeat(64),
    }),
  );
  assert.equal(ergebnis.status, "BESTAETIGT");
  assert.equal(ergebnis.characterGoldDelta, 1);
  assert.equal(ergebnis.bankGoldDelta, -1);
  assert.equal(ergebnis.sameIntentErneutSenden, false);
});

test("einseitiges Gold-Delta reicht nie fuer Withdraw-Commit", () => {
  for (const override of [
    { characterGold: 101, bankGold: 500 },
    { characterGold: 100, bankGold: 499 },
  ]) {
    const ergebnis = pruefeBankWithdrawEinGoldSettlement(
      bindung(),
      bindung({
        beobachtetAmMs: 1001,
        fingerprint: "b".repeat(64),
        ...override,
      }),
    );
    assert.equal(ergebnis.status, "DRIFT");
    assert.equal(ergebnis.grund, "BANK_WITHDRAW_GOLD_DELTA_WIDERSPRUCH");
  }
});

test("Session Server Lease oder Mount Drift blockiert Withdraw-Settlement", () => {
  for (const override of [
    { sessionId: "session-2" },
    { serverKennung: "II" },
    { leaseEpoche: 9 },
    { mountEpoche: 13 },
  ]) {
    const ergebnis = pruefeBankWithdrawEinGoldSettlement(
      bindung(),
      bindung({
        beobachtetAmMs: 1001,
        characterGold: 101,
        bankGold: 499,
        fingerprint: "b".repeat(64),
        ...override,
      }),
    );
    assert.equal(ergebnis.status, "DRIFT");
    assert.equal(ergebnis.grund, "BANK_WITHDRAW_BINDUNG_DRIFT");
  }
});

test("stale Beobachtung oder fehlender neuer Fingerprint bestaetigt nicht", () => {
  const stale = pruefeBankWithdrawEinGoldSettlement(
    bindung(),
    bindung({
      beobachtetAmMs: 1000,
      characterGold: 101,
      bankGold: 499,
      fingerprint: "b".repeat(64),
    }),
  );
  assert.equal(stale.status, "DRIFT");

  const fingerprint = pruefeBankWithdrawEinGoldSettlement(
    bindung(),
    bindung({
      beobachtetAmMs: 1001,
      characterGold: 101,
      bankGold: 499,
    }),
  );
  assert.equal(fingerprint.status, "OFFEN");
});

test("Withdraw-Settlement-Core und Produktionskomposition enthalten keinen Write-Pfad", () => {
  const komposition = fs.readFileSync(
    "grundlage/quelle/runtime/produktions-komposition.ts",
    "utf8",
  );
  const core = fs.readFileSync(
    "grundlage/quelle/merchant/bank-withdraw-settlement.ts",
    "utf8",
  );
  assert.equal(komposition.includes("merchant.bank.gold_auslagern"), false);
  assert.equal(komposition.includes("bank_withdraw("), false);
  assert.equal(core.includes("bank_withdraw("), false);
  assert.ok(core.includes("gameplayAutoritaet: false"));
  assert.ok(core.includes("rawWriteAutoritaet: false"));
});
