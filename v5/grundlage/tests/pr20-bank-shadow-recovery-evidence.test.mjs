import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const lies = pfad => JSON.parse(fs.readFileSync(pfad, "utf8"));
const evidence = lies("roadmap/pr20-2-bank-shadow-recovery-evidence.json");

test("PR20.2 F5-Recovery-Evidence ist real, zero-write und terminal released", () => {
  assert.equal(evidence.schemaVersion, 1);
  assert.equal(evidence.status, "BESTANDEN");
  assert.equal(
    evidence.evidenceArt,
    "V5_BANK_SHADOW_RECOVERY_MANUAL_RECONCILIATION_NO_WRITE",
  );
  assert.equal(
    evidence.testedSourceSha,
    "bff4d02ab5b5ca5ab83c16dd435bc314d8074f87",
  );
  assert.equal(evidence.ausloeser.art, "BROWSER_F5_RELOAD_WAEHREND_REAL_SHADOW");
  assert.equal(evidence.ausloeser.currentExists, false);
  assert.equal(evidence.ausloeser.realShadowReportExists, false);
  assert.equal(evidence.ausloeser.leaseVorRecovery.epoche, 1);
  assert.equal(
    evidence.ausloeser.leaseVorRecovery.zustand,
    "RECOVERY_PENDING",
  );
  assert.equal(evidence.ausloeser.gameplayWrites, 0);
  assert.equal(evidence.ausloeser.adapterAufrufe, 0);
  assert.equal(evidence.ausloeser.sameIntentRetry, false);

  const r = evidence.recoveryReport;
  assert.equal(r.status, "BESTANDEN");
  assert.equal(r.sourceSha, r.actualHeadSha);
  assert.equal(r.lease.epoche, 1);
  assert.equal(r.lease.vorher, "RECOVERY_PENDING");
  assert.equal(r.lease.nachher, "RELEASED");
  assert.equal(r.manualMountObserved, true);
  assert.equal(r.manualExitObserved, true);
  assert.equal(r.offeneTransaktionVorher, null);
  assert.equal(r.offeneTransaktionNachher, null);
  assert.equal(r.browserGameplayWrites, 0);
  assert.equal(r.gameplayWrites, 0);
  assert.equal(r.adapterAufrufe, 0);
  assert.equal(r.oneShotAuthorityAusgestellt, false);
  assert.equal(r.bankDepositAusgefuehrt, false);
  assert.equal(r.sameIntentRetry, false);
  assert.equal(r.breiteRuntimeFreigabeDurchDiesenTest, false);
  assert.equal(r.rawWriteBypass, false);
});

test("Recovery-Evidence oeffnet nicht irrtuemlich das normale Shadow- oder Write-Gate", () => {
  assert.equal(evidence.bewertung.echteRestartRecoveryNachgewiesen, true);
  assert.equal(evidence.bewertung.offeneTransaktionNachRecovery, false);
  assert.equal(evidence.bewertung.leaseReleased, true);
  assert.equal(evidence.bewertung.gameplayWriteDurchRecovery, false);
  assert.equal(evidence.bewertung.authorityDurchRecovery, false);
  assert.equal(evidence.bewertung.blindRetry, false);
  assert.equal(evidence.bewertung.normalerRealBrowserShadowBestanden, false);
  assert.equal(
    evidence.nextGate,
    "PR20.2_REAL_BROWSER_SHADOW_NO_WRITE_ERNEUT_AUSFUEHREN",
  );
});
