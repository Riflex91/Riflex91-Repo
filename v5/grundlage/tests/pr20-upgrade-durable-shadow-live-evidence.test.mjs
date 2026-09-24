import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence = JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-upgrade-durable-shadow-live-evidence.json",
  "utf8",
));
const manifest = JSON.parse(fs.readFileSync(
  "roadmap/v5-autonomous-test-manifest.json",
  "utf8",
));
const packageSource = fs.readFileSync(
  "werkzeuge/pr20-8-upgrade-durable-shadow-no-write.js",
  "utf8",
);

test("PR20.8 Upgrade durable shadow real-browser evidence is terminal recovered and zero-write", () => {
  assert.equal(
    evidence.status,
    "BESTANDEN_REAL_BROWSER_DURABLE_SHADOW_NO_WRITE_RECOVERED",
  );
  assert.equal(evidence.ratified, true);
  assert.equal(evidence.testId, "pr20-8-upgrade-durable-shadow-no-write");
  assert.equal(evidence.controllerVersion, "1.0.1");
  assert.equal(
    evidence.manifestMainCommit,
    "1d6c729c2870784f8f4ec71717288607731e28d9",
  );
  assert.equal(
    evidence.sourceCommit,
    "6d611de7fadf7a5cb3945ec25f3bc761acb14e3c",
  );
  assert.equal(
    evidence.packageSha256,
    "7703cff2fa837c19c1febffc064c44084494effa142c3e0fb560feec1af5a9ff",
  );
  assert.equal(evidence.terminal, true);
  assert.equal(evidence.result.status, "BESTANDEN");
  assert.equal(evidence.result.phase, "COMPLETE");
  assert.deepEqual(evidence.result.blocker, []);

  const r = evidence.result;
  assert.equal(r.recipient.characterName, "My_Merchant");
  assert.equal(r.recipient.sessionId, "My_Merchant");
  assert.equal(r.recipient.ctype, "merchant");
  assert.equal(r.recipient.serverRegion, "EU");
  assert.equal(r.recipient.serverIdentifier, "I");

  assert.equal(r.candidate.name, "gloves");
  assert.equal(r.candidate.level, 0);
  assert.equal(r.candidate.inventoryIndex, 6);
  assert.equal(r.candidate.quantity, 1);
  assert.equal(r.candidate.baseGold, 3400);
  assert.equal(r.candidate.matchingCandidateCount, 2);

  assert.equal(r.scroll.name, "scroll0");
  assert.equal(r.scroll.inventoryIndex, 14);
  assert.equal(r.scroll.observedQuantity, 36);
  assert.equal(r.scroll.consumeQuantity, 1);
  assert.equal(r.offering, null);
  assert.equal(r.normalPathOnly, true);

  assert.equal(r.serviceReachability.reachable, true);
  assert.equal(r.serviceReachability.viaComputer, false);
  assert.equal(r.serviceReachability.serverLimit, 400);
  assert.equal(r.serviceReachability.safetyLimit, 300);
  assert.ok(r.serviceReachability.distance <= 300);

  assert.equal(r.stableDoubleObservation, true);
  assert.equal(r.stablePostIntentReobserve, true);
  assert.equal(r.durableTerminalIntentPresent, true);
  assert.equal(r.durableTerminalIntentRecovered, true);
  assert.equal(r.durableRecoveredVersion, "1.0.0");
  assert.equal(r.durableIntentCreatedShadowOnly, false);
  assert.equal(r.durableReadback, true);
  assert.equal(r.journalTerminalArt, "ABBRUCH");
  assert.equal(r.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(r.reconciliationClassification, "NOT_APPLIED");

  assert.equal(r.shadowIntent.createdThisRun, false);
  assert.equal(r.shadowIntent.recoveredExistingTerminal, true);
  assert.equal(r.shadowIntent.recoveredVersion, "1.0.0");
  assert.equal(r.shadowIntent.durableReadback, true);
  assert.equal(r.shadowIntent.sameIntentRetry, false);
  assert.equal(r.shadowIntent.oneShot.maximumUses, 1);
  assert.equal(r.shadowIntent.oneShot.upgradeAuthorityIssued, false);

  const boundary = evidence.observedSafetyBoundary;
  assert.equal(boundary.authorityIssued, false);
  assert.equal(boundary.upgradeAuthority, false);
  assert.equal(boundary.gameplayAuthority, false);
  assert.equal(boundary.rawWriteAuthority, false);
  assert.equal(boundary.normalUpgradeWriteRatification, false);
  assert.equal(boundary.gameplayWrites, 0);
  assert.equal(boundary.publicFunctionCalls, 0);
  assert.equal(boundary.rawWriteCalls, 0);
  assert.equal(boundary.sameIntentRetry, false);
  assert.equal(boundary.normalRuntimeAllowed, false);
});

test("PR20.8 recovered terminal intent is the exact prior NO-WRITE shadow and was not rewritten", () => {
  const prior = evidence.predecessorTerminalShadow;
  assert.equal(prior.controllerVersion, "1.0.0");
  assert.equal(prior.status, "BESTANDEN");
  assert.equal(prior.phase, "COMPLETE");
  assert.equal(prior.durableIntentCreatedShadowOnly, true);
  assert.equal(prior.sendBoundaryState, "NICHT_GESENDET");
  assert.equal(prior.journalTerminalArt, "ABBRUCH");
  assert.equal(prior.reconciliationClassification, "NOT_APPLIED");
  assert.equal(prior.gameplayWrites, 0);
  assert.equal(prior.publicFunctionCalls, 0);
  assert.equal(prior.rawWriteCalls, 0);
  assert.equal(prior.sameIntentRetry, false);
  assert.equal(
    prior.samePrestateFingerprintSha256,
    evidence.result.fingerprints.prestateFingerprintSha256,
  );
  assert.equal(
    prior.sameIntentKey,
    evidence.result.shadowIntent.key,
  );

  const proof = evidence.recoveryProof;
  assert.equal(proof.exactPersistedIntentRequired, true);
  assert.equal(proof.serviceReachabilityIncludedInExactBinding, true);
  assert.equal(proof.persistedIntentRewritten, false);
  assert.equal(proof.secondIntentCreated, false);
  assert.equal(proof.gameplayWriteCreated, false);
  assert.equal(proof.recoveredExistingTerminal, true);
  assert.equal(proof.recoveredControllerVersion, "1.0.0");
  assert.equal(proof.currentControllerVersion, "1.0.1");
});

test("PR20.8 shadow evidence source remains exact and manifest comparison is monotonic", () => {
  assert.equal(evidence.packagePath,
    "v5/werkzeuge/pr20-8-upgrade-durable-shadow-no-write.js");
  assert.ok(packageSource.includes("const VERSION = '1.0.1'"));
  assert.ok(packageSource.includes("recoveredExistingTerminal"));
  assert.ok(packageSource.includes(
    "canonical(decoded.serviceReachability)===canonical(record.serviceReachability)",
  ));
  assert.ok(packageSource.includes(
    "PR20_8_UPGRADE_SHADOW_TERMINAL_INTENT_DRIFT",
  ));

  if (manifest.testId === evidence.testId) {
    assert.equal(manifest.controllerVersion, evidence.controllerVersion);
    assert.equal(manifest.sourceCommit, evidence.sourceCommit);
    assert.equal(manifest.packagePath, evidence.packagePath);
    assert.equal(manifest.packageSha256, evidence.packageSha256);
  }
  assert.equal(manifest.normalRuntimeAllowed, false);

  for (const marker of [
    "upgrade(",
    "compound(",
    "exchange(",
    "buy(",
    "buy_with_gold(",
    "equip(",
    "unequip(",
    "sell(",
    "send_item(",
    "send_gold(",
    "use_skill(",
    "start_character(",
    "command_character(",
    "api_call(",
    "socket.emit(",
    ".socket.emit(",
  ]) assert.equal(packageSource.includes(marker), false, marker);
});

test("PR20.8 recovered shadow evidence advances only to productive one-write preparation", () => {
  assert.equal(
    evidence.nextGate,
    "PR20_8_UPGRADE_PRODUCTIVE_ONE_WRITE_PREPARATION",
  );
  assert.equal(evidence.observedSafetyBoundary.upgradeAuthority, false);
  assert.equal(
    evidence.observedSafetyBoundary.normalUpgradeWriteRatification,
    false,
  );
});
