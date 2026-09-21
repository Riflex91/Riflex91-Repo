import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(
  "werkzeuge/bank-deposit-real-shadow-recovery.mjs",
  "utf8",
);

test("Bank-Shadow-Recovery ist source-locked und zero-write", () => {
  for (const marker of [
    "V5 BANK SHADOW RECOVERY MANUELL ABGLEICHEN",
    "BANK_SHADOW_RECOVERY_SOURCE_SHA_MISMATCH",
    "RECOVERY_PENDING_BESTAETIGT_BANK_MANUELL_BETRETEN",
    "schliesseBankLeaseRestartAbgleichAb",
    'vorher: "RECOVERY_PENDING"',
    'nachher: "RELEASED"',
    "browserGameplayWrites: 0",
    "gameplayWrites: 0",
    "adapterAufrufe: 0",
    "oneShotAuthorityAusgestellt: false",
    "bankDepositAusgefuehrt: false",
    "sameIntentRetry: false",
  ]) {
    assert.ok(source.includes(marker), marker);
  }

  for (const muster of [
    /\bbank_deposit\s*\(/,
    /\bbank_withdraw\s*\(/,
    /\bbank_store\s*\(/,
    /\bbank_retrieve\s*\(/,
    /\.emit\s*\(/,
    /erteileBankDepositEinmalAuthority\s*\(/,
    /AusfuehrungsAdapter/,
    /AusfuehrungsKernel/,
  ]) {
    assert.equal(muster.test(source), false, String(muster));
  }
});

test("Recovery verlangt exakt eine RECOVERY_PENDING Lease und keine offene Transaktion", () => {
  assert.ok(source.includes("leases.length !== 1"));
  assert.ok(source.includes('lease.zustand !== "RECOVERY_PENDING"'));
  assert.ok(source.includes("start.offeneTransaktionsId !== null"));
  assert.ok(source.includes("BANK_SHADOW_RECOVERY_BINDUNG_DRIFT"));
  assert.ok(source.includes("BANK_SHADOW_RECOVERY_EXIT_EVIDENCE_UNGUELTIG"));
});

test("Recovery-Report wird separat vom normalen Shadow geschrieben", () => {
  assert.ok(source.includes("bank-deposit-real-shadow-recovery"));
  assert.ok(source.includes(
    "V5_BANK_SHADOW_RECOVERY_MANUAL_RECONCILIATION_NO_WRITE",
  ));
});
