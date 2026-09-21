import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence = JSON.parse(
  fs.readFileSync(
    "roadmap/pr20-2-bank-withdraw-real-browser-shadow-evidence.json",
    "utf8",
  ),
);

test("PR20.2 Withdraw Real-Browser-Shadow ist source-exakt zero-write und released", () => {
  assert.equal(evidence.schemaVersion, 1);
  assert.equal(evidence.status, "BESTANDEN");
  assert.equal(
    evidence.evidenceArt,
    "V5_BANK_WITHDRAW_REAL_BROWSER_SHADOW_NO_WRITE",
  );
  assert.equal(
    evidence.testedSourceSha,
    "15620374566b83c9532e492d63e15c2fed6709e5",
  );
  assert.equal(evidence.source, "USER_PROVIDED_RUNNER_STDOUT");
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
  assert.deepEqual(evidence.leaseStatus, [
    { epoche: 4, zustand: "RELEASED" },
  ]);
  assert.equal(evidence.hostNachher.zustand, "LAEUFT");
  assert.equal(evidence.hostNachher.gameplayAutoritaet, false);
  assert.equal(evidence.hostNachher.rawWriteAutoritaet, false);
  assert.equal(evidence.hostNachher.actionAuthority, false);
  assert.equal(evidence.hostNachher.bankWithdrawEinmalAuthorityOffen, false);
  assert.equal(evidence.breiteRuntimeFreigabeDurchDiesenTest, false);
  assert.equal(evidence.rawWriteBypass, false);
});

test("Withdraw Shadow-Exit-Gate oeffnet nur die Vorbereitung des einzelnen bank_withdraw(1)-Write-Gates", () => {
  for (const [key, value] of Object.entries(evidence.exitGate)) {
    assert.equal(value, true, key);
  }
  assert.equal(
    evidence.nextGate,
    "PR20.2_BANK_WITHDRAW_1_WRITE_ADAPTER_UND_LIVE_RUNNER_VORBEREITEN",
  );
});
