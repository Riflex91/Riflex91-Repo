import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  BANK_DEPOSIT_ERSTER_BETRAG,
  pruefeBankDepositEinGoldBereitschaft,
  pruefeBankDepositEinGoldSettlement,
} from "../erzeugt/merchant/bank-deposit-settlement.js";

const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));

function bindung(override = {}) {
  return {
    schemaVersion: 1,
    characterId: "merchant-a",
    sessionId: "session-1",
    serverRegion: "EU",
    serverKennung: "I",
    leaseEpoche: 7,
    mountEpoche: 11,
    beobachtetAmMs: 1000,
    characterGold: 100,
    bankGold: 500,
    fingerprint: "a".repeat(64),
    ...override,
  };
}

test("erster Bank-Live-Kandidat ist exakt ein Gold Deposit und bleibt no-write", () => {
  const kandidat = lies(
    "grundlage/vertraege/runtime/bank-deposit-production-candidate.json",
  );
  assert.equal(BANK_DEPOSIT_ERSTER_BETRAG, 1);
  assert.equal(kandidat.status, "RATIFIZIERT_NO_WRITE");
  assert.equal(kandidat.actionContractId, "AL-ACTION-BANK-DEPOSIT");
  assert.equal(kandidat.publicFunction, "bank_deposit");
  assert.equal(kandidat.ersterLiveBetragGold, 1);
  assert.equal(kandidat.authorityGrenze.gameplayAutoritaet, false);
  assert.equal(kandidat.authorityGrenze.rawWriteAutoritaet, false);
  assert.equal(kandidat.authorityGrenze.produktiveCapabilityInDiesemSchritt, false);
  assert.equal(kandidat.authorityGrenze.authorityInDiesemSchritt, false);
  assert.equal(kandidat.authorityGrenze.adapterInDiesemSchritt, false);
  assert.equal(kandidat.authorityGrenze.liveRunnerInDiesemSchritt, false);
  assert.equal(kandidat.authorityGrenze.gameplayWritesInDiesemSchritt, 0);
});

test("Bereitschaft verlangt Merchant, Mount, Frische, keine Alt-Runtime und Gold", () => {
  const bereit = pruefeBankDepositEinGoldBereitschaft({
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

  const blockiert = pruefeBankDepositEinGoldBereitschaft({
    schemaVersion: 1,
    ctype: "mage",
    lebt: false,
    bankGemountet: false,
    alternativeRuntimeAktiv: true,
    offeneBankTransaktion: true,
    evidenceFrisch: false,
    bindung: bindung({ characterGold: 0 }),
  });
  assert.equal(blockiert.status, "BLOCKIERT");
  assert.ok(blockiert.gruende.includes("BANK_DEPOSIT_NUR_MERCHANT"));
  assert.ok(blockiert.gruende.includes("BANK_DEPOSIT_BANK_NICHT_GEMOUNTET"));
  assert.ok(blockiert.gruende.includes("BANK_DEPOSIT_ALTERNATIVE_RUNTIME_AKTIV"));
  assert.ok(blockiert.gruende.includes("BANK_DEPOSIT_OFFENE_TRANSAKTION"));
  assert.ok(blockiert.gruende.includes("BANK_DEPOSIT_EVIDENCE_STALE"));
  assert.ok(blockiert.gruende.includes("BANK_DEPOSIT_CHARACTER_GOLD_ZU_NIEDRIG"));
});

test("Settlement bestaetigt nur gemeinsames exaktes -1/+1 Delta", () => {
  const vorher = bindung();
  const nachher = bindung({
    beobachtetAmMs: 1001,
    characterGold: 99,
    bankGold: 501,
    fingerprint: "b".repeat(64),
  });
  const ergebnis = pruefeBankDepositEinGoldSettlement(vorher, nachher);
  assert.equal(ergebnis.status, "BESTAETIGT");
  assert.equal(ergebnis.characterGoldDelta, -1);
  assert.equal(ergebnis.bankGoldDelta, 1);
  assert.equal(ergebnis.sameIntentErneutSenden, false);
});

test("Senderverlust allein reicht nie fuer Deposit-Commit", () => {
  const ergebnis = pruefeBankDepositEinGoldSettlement(
    bindung(),
    bindung({
      beobachtetAmMs: 1001,
      characterGold: 99,
      bankGold: 500,
      fingerprint: "b".repeat(64),
    }),
  );
  assert.equal(ergebnis.status, "DRIFT");
  assert.equal(ergebnis.grund, "BANK_DEPOSIT_GOLD_DELTA_WIDERSPRUCH");
});

test("Bankzuwachs allein reicht nie fuer Deposit-Commit", () => {
  const ergebnis = pruefeBankDepositEinGoldSettlement(
    bindung(),
    bindung({
      beobachtetAmMs: 1001,
      characterGold: 100,
      bankGold: 501,
      fingerprint: "b".repeat(64),
    }),
  );
  assert.equal(ergebnis.status, "DRIFT");
});

test("Session Server Lease oder Mount Drift blockiert Settlement", () => {
  for (const override of [
    { sessionId: "session-2" },
    { serverKennung: "II" },
    { leaseEpoche: 8 },
    { mountEpoche: 12 },
  ]) {
    const ergebnis = pruefeBankDepositEinGoldSettlement(
      bindung(),
      bindung({
        beobachtetAmMs: 1001,
        characterGold: 99,
        bankGold: 501,
        fingerprint: "b".repeat(64),
        ...override,
      }),
    );
    assert.equal(ergebnis.status, "DRIFT");
    assert.equal(ergebnis.grund, "BANK_DEPOSIT_BINDUNG_DRIFT");
  }
});

test("stale Beobachtung oder fehlender neuer Fingerprint bestaetigt nicht", () => {
  const stale = pruefeBankDepositEinGoldSettlement(
    bindung(),
    bindung({
      beobachtetAmMs: 1000,
      characterGold: 99,
      bankGold: 501,
      fingerprint: "b".repeat(64),
    }),
  );
  assert.equal(stale.status, "DRIFT");

  const fingerprint = pruefeBankDepositEinGoldSettlement(
    bindung(),
    bindung({
      beobachtetAmMs: 1001,
      characterGold: 99,
      bankGold: 501,
    }),
  );
  assert.equal(fingerprint.status, "OFFEN");
});

test("Produktionskomposition enthaelt in PR20.2a weiterhin keinen Bank-Write", () => {
  const komposition = fs.readFileSync(
    "grundlage/quelle/runtime/produktions-komposition.ts",
    "utf8",
  );
  const core = fs.readFileSync(
    "grundlage/quelle/merchant/bank-deposit-settlement.ts",
    "utf8",
  );
  assert.equal(komposition.includes("merchant.bank.gold_einlagern"), false);
  assert.equal(komposition.includes("bank_deposit("), false);
  assert.equal(core.includes("bank_deposit("), false);
  assert.ok(core.includes("gameplayAutoritaet: false"));
  assert.ok(core.includes("rawWriteAutoritaet: false"));
});
