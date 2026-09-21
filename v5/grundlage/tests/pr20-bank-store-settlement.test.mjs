import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  BANK_STORE_ERSTER_BETRAG_ITEMS,
  pruefeBankStoreBereitschaft,
  pruefeBankStoreSettlement,
} from "../../erzeugt/merchant/bank-store-settlement.js";

const kandidat = JSON.parse(
  fs.readFileSync(
    "grundlage/vertraege/runtime/bank-store-production-candidate.json",
    "utf8",
  ),
);

function bindung(overrides = {}) {
  return {
    schemaVersion: 1,
    characterId: "merchant-a",
    sessionId: "session-1",
    serverRegion: "EU",
    serverKennung: "I",
    leaseEpoche: 5,
    mountEpoche: 10,
    beobachtetAmMs: 1000,
    sourceSlot: 7,
    targetPack: "items0",
    targetSlot: 11,
    sourceItemFingerprint: "a".repeat(64),
    targetItemFingerprint: null,
    fingerprint: "b".repeat(64),
    ...overrides,
  };
}

test("Bank Store Kandidat ist exakt ein Item in explizit leeren Zielslot", () => {
  assert.equal(BANK_STORE_ERSTER_BETRAG_ITEMS, 1);
  assert.equal(kandidat.publicFunction, "bank_store");
  assert.equal(kandidat.capabilityId, "merchant.bank.item_einlagern");
  assert.equal(kandidat.autoPlacement, false);
  assert.equal(kandidat.stackMerge, false);
  assert.equal(kandidat.targetMussLeerSein, true);
  assert.equal(kandidat.authorityGrenze.gameplayAutoritaet, false);
  assert.equal(kandidat.authorityGrenze.rawWriteAutoritaet, false);
  assert.equal(kandidat.authorityGrenze.gameplayWritesInDiesemSchritt, 0);
  assert.equal(kandidat.writeGate.realLiveWritePerformed, false);
  assert.equal(kandidat.writeGate.sameIntentRetry, false);
});

test("Bank Store Bereitschaft verlangt Source-Item und leeren Target-Slot", () => {
  const ok = pruefeBankStoreBereitschaft({
    schemaVersion: 1,
    ctype: "merchant",
    lebt: true,
    bankGemountet: true,
    alternativeRuntimeAktiv: false,
    offeneBankTransaktion: false,
    evidenceFrisch: true,
    bindung: bindung(),
  });
  assert.equal(ok.status, "BEREIT");
  assert.deepEqual(ok.gruende, []);

  const block = pruefeBankStoreBereitschaft({
    schemaVersion: 1,
    ctype: "merchant",
    lebt: true,
    bankGemountet: true,
    alternativeRuntimeAktiv: false,
    offeneBankTransaktion: false,
    evidenceFrisch: true,
    bindung: bindung({
      sourceItemFingerprint: null,
      targetItemFingerprint: "c".repeat(64),
    }),
  });
  assert.equal(block.status, "BLOCKIERT");
  assert.ok(block.gruende.includes("BANK_STORE_SOURCE_ITEM_FEHLT"));
  assert.ok(block.gruende.includes("BANK_STORE_TARGET_SLOT_NICHT_LEER"));
});

test("Bank Store Settlement bestaetigt nur exakten Source->Target Transfer", () => {
  const result = pruefeBankStoreSettlement(
    bindung(),
    bindung({
      beobachtetAmMs: 1001,
      sourceItemFingerprint: null,
      targetItemFingerprint: "a".repeat(64),
      fingerprint: "c".repeat(64),
    }),
  );
  assert.equal(result.status, "BESTAETIGT");
  assert.equal(result.sourceSlotLeer, true);
  assert.equal(result.targetEntsprichtQuelle, true);
  assert.equal(result.sameIntentErneutSenden, false);
});

test("Bank Store Settlement bleibt offen ohne Delta und driftet bei falschem Zielitem", () => {
  const offen = pruefeBankStoreSettlement(
    bindung(),
    bindung({ beobachtetAmMs: 1001, fingerprint: "c".repeat(64) }),
  );
  assert.equal(offen.status, "OFFEN");

  const drift = pruefeBankStoreSettlement(
    bindung(),
    bindung({
      beobachtetAmMs: 1001,
      sourceItemFingerprint: null,
      targetItemFingerprint: "d".repeat(64),
      fingerprint: "c".repeat(64),
    }),
  );
  assert.equal(drift.status, "DRIFT");
});

test("Bank Store Settlement-Core enthaelt keinen Write-Pfad", () => {
  const source = fs.readFileSync(
    "grundlage/quelle/merchant/bank-store-settlement.ts",
    "utf8",
  );
  assert.equal(/\bbank_store\s*\(/.test(source), false);
  assert.equal(/\.emit\s*\(/.test(source), false);
  assert.ok(source.includes("sameIntentErneutSenden: false"));
});
