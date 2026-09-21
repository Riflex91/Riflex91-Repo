import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence = JSON.parse(
  fs.readFileSync(
    "roadmap/pr20-2-bank-real-browser-shadow-evidence.json",
    "utf8",
  ),
);

test("PR20.2 Real-Browser-Shadow ist source-exakt, zero-write und released", () => {
  assert.equal(evidence.schemaVersion, 1);
  assert.equal(evidence.status, "BESTANDEN");
  assert.equal(
    evidence.evidenceArt,
    "V5_BANK_DEPOSIT_REAL_BROWSER_SHADOW_NO_WRITE",
  );
  assert.equal(
    evidence.testedSourceSha,
    "9ed665692e71ee8ae131e7399db2306ff9e4a627",
  );
  assert.equal(evidence.startAusserhalbBank, true);
  assert.equal(evidence.manualMountTransition, true);
  assert.equal(evidence.manualExitRequired, true);
  assert.equal(
    evidence.admissionStatus,
    "ADMISSION_BESTANDEN_KEIN_SEND",
  );
  assert.equal(evidence.journalTerminalArt, "ABBRUCH");
  assert.equal(evidence.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(evidence.sameIntentRetry, false);
  assert.equal(evidence.browserGameplayWrites, 0);
  assert.equal(evidence.hostGameplayWrites, 0);
  assert.equal(evidence.gameplayWrites, 0);
  assert.equal(evidence.adapterAufrufe, 0);
  assert.equal(evidence.bankStartNachherBereit, true);
  assert.deepEqual(evidence.leaseStatus, [{ epoche: 2, zustand: "RELEASED" }]);
  assert.equal(evidence.hostNachher.gameplayAutoritaet, false);
  assert.equal(evidence.hostNachher.rawWriteAutoritaet, false);
  assert.equal(evidence.hostNachher.actionAuthority, false);
  assert.equal(evidence.hostNachher.bankDepositEinmalAuthorityOffen, false);
  assert.equal(evidence.breiteRuntimeFreigabeDurchDiesenTest, false);
  assert.equal(evidence.rawWriteBypass, false);
});

test("PR20.2 Shadow-Exit-Gate oeffnet nur die Vorbereitung des einzelnen bank_deposit(1)-Write-Gates", () => {
  for (const [key, value] of Object.entries(evidence.exitGate)) {
    assert.equal(value, true, key);
  }
  assert.equal(
    evidence.nextGate,
    "PR20.2_BANK_DEPOSIT_1_WRITE_ADAPTER_UND_LIVE_RUNNER_VORBEREITEN",
  );
});
