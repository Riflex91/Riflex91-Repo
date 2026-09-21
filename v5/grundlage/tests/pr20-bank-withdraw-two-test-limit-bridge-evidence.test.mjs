import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence = JSON.parse(
  fs.readFileSync(
    "roadmap/pr20-2-bank-withdraw-two-test-limit-bridge-evidence.json",
    "utf8",
  ),
);

test("Withdraw-Closeout respektiert Zwei-Test-Limit und zertifiziert keinen dritten Live-Write", () => {
  assert.equal(
    evidence.status,
    "FUNKTIONS_TEST_LIMIT_ERREICHT_BRIDGE_READ_ONLY_BESTAETIGT",
  );
  assert.equal(evidence.function, "bank_withdraw");
  assert.equal(evidence.betragGold, 1);
  assert.equal(evidence.testPolicy.maxTrueFunctionalTestsPerFunction, 2);
  assert.equal(evidence.testPolicy.additionalTrueFunctionalTestAllowed, false);
  assert.equal(evidence.testPolicy.sameIntentRetry, false);
  assert.equal(evidence.functionalTests.length, 2);
  assert.equal(evidence.functionalTests[0].adapterAufrufe, 1);
  assert.equal(evidence.functionalTests[0].gameplayWrites, 1);
  assert.equal(evidence.functionalTests[0].moeglicherSend, true);
  assert.equal(evidence.functionalTests[1].adapterAufrufe, 1);
  assert.equal(evidence.functionalTests[1].gameplayWrites, 0);
  assert.equal(evidence.functionalTests[1].moeglicherSend, false);
  assert.equal(
    evidence.certification.realLiveWriteEvidence,
    "NICHT_BESTANDEN",
  );
  assert.equal(
    evidence.certification.correctedBridgePathReadOnlyEvidence,
    "BESTANDEN",
  );
  assert.equal(
    evidence.certification.productionWideActivationAllowed,
    false,
  );
});

test("CODE-Bridge-Probe beweist Runner-Capability mit null Gameplay-Writes", () => {
  const bridge = evidence.diagnostics.find(
    x => x.kind === "OFFICIAL_CODE_BRIDGE_BOOTSTRAP_NO_GAMEPLAY_WRITE",
  );
  assert.ok(bridge);
  assert.equal(bridge.status, "BEREIT");
  assert.equal(bridge.bootstrapAusgeloest, true);
  assert.equal(bridge.vorher.codeActive, false);
  assert.equal(bridge.vorher.maincodePresent, false);
  assert.equal(bridge.nachher.codeActive, true);
  assert.equal(bridge.nachher.codeRun, true);
  assert.equal(bridge.nachher.maincodePresent, true);
  assert.equal(bridge.nachher.bankWithdrawType, "function");
  assert.equal(bridge.nachher.bankDepositType, "function");
  assert.equal(bridge.gameplayWrites, 0);
  assert.equal(bridge.adapterAufrufe, 0);
  assert.equal(bridge.bankWithdrawAufrufe, 0);
});
