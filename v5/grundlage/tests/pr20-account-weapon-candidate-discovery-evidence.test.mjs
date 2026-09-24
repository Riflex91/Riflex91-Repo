import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const plan = JSON.parse(fs.readFileSync(
  "roadmap/pr20-7-account-weapon-candidate-discovery-test-plan.json",
  "utf8",
));
const evidence = JSON.parse(fs.readFileSync(
  "roadmap/pr20-7-account-weapon-candidate-discovery-evidence.json",
  "utf8",
));
const source = fs.readFileSync(
  "werkzeuge/pr20-7-account-weapon-candidate-discovery.js",
  "utf8",
);

test("PR20.7 account discovery remains a read-only selector, not farmer gear authority", () => {
  assert.equal(plan.gate, "PR20.7_GEAR");
  assert.equal(plan.controllerVersion, "1.0.3");
  assert.equal(plan.bridgeContract.statusEnvelope, "status.v5AutonomousTest");
  assert.equal(plan.bridgeContract.peekTelemetryArray, true);
  assert.equal(plan.bridgeContract.preservesExistingOperations, true);
  assert.deepEqual(plan.performanceTrick.roots, ["globalThis", "parent"]);
  assert.equal(plan.performanceTrick.activationDelayMs, 350);
  assert.equal(plan.performanceTrick.retryDelayMs, 150);
  assert.equal(plan.performanceTrick.failClosed, true);
  assert.equal(plan.testId, "pr20-7-gear-account-weapon-candidate-discovery-v2");
  assert.equal(plan.status, "SAME_TEST_ZERO_WRITE_UPGRADE_BEREIT_FUER_REALEN_NO_WRITE_DISCOVERY");
  assert.equal(plan.supersedesTestId, "pr20-7-gear-account-weapon-candidate-discovery");
  assert.equal(plan.sameTestVersionUpgradeBypassed, false);
  assert.equal(plan.deployment.packageCommitPinned, true);
  assert.match(plan.deployment.sourceCommit, /^[0-9a-f]{40}$/);
  assert.match(plan.deployment.packageSha256, /^[0-9a-f]{64}$/);
  assert.equal(plan.deployment.coordinatorClass, "merchant");
  assert.equal(plan.deployment.workerPackageConfigured, false);
  assert.equal(plan.deployment.farmerWorkerDistribution, false);
  assert.deepEqual(plan.scope.exactFarmerRows, [
    "My_Ranger1:ranger",
    "My_Priest:priest",
    "My_Mage:mage",
  ]);
  assert.equal(plan.scope.liveSessionPreflightStillRequiredAfterDiscovery, true);
  assert.equal(plan.scope.discoveryDoesNotRatifyFarmerGearAllocation, true);
  assert.equal(plan.scope.noSecretsStored, true);
  assert.deepEqual(plan.candidateRules.explicitSlots, ["mainhand", "offhand"]);
  assert.equal(plan.candidateRules.classRulesFromG, true);
  assert.equal(plan.candidateRules.doublehandRequiresEmptyOffhand, true);
  assert.equal(plan.candidateRules.deterministicSelection, true);
});

test("PR20.7 account discovery package has closed mutation boundary", () => {
  for (const [key, expected] of Object.entries({
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    startCalls: 0,
    disconnectCalls: 0,
    farmerWorkersInstalled: 0,
    durableIntentCreated: false,
    authorityIssued: false,
    weaponOffhandWriteRatification: false,
    farmerGearAllocationRatification: false,
    sameIntentRetry: false,
    normalRuntimeAllowed: false,
  })) assert.equal(plan.mutationBoundary[key], expected, key);
  for (const marker of [
    "equip(", "unequip(", "buy(", "buy_with_gold(", "bank_retrieve(",
    "bank_store(", "send_item(", "send_cm(", "use_skill(",
    "start_character(", "command_character(", "/disconnect ", "api_call(",
    "socket.emit(", ".socket.emit(",
  ]) assert.equal(source.includes(marker), false, marker);
});

test("PR20.7 account discovery real blocker is ratified without becoming a pass", () => {
  assert.equal(evidence.testId, "pr20-7-gear-account-weapon-candidate-discovery-v2");
  assert.equal(
    evidence.status,
    "BLOCKIERT_REAL_BROWSER_NO_COMPATIBLE_ACCOUNT_CANDIDATE_ZERO_WRITE",
  );
  assert.equal(evidence.supersedesTestId, "pr20-7-gear-account-weapon-candidate-discovery");
  assert.equal(evidence.controllerVersion, "1.0.3");
  assert.match(evidence.sourceCommit, /^[0-9a-f]{40}$/);
  assert.match(evidence.packageSha256, /^[0-9a-f]{64}$/);
  assert.equal(evidence.observedAtMs, 1790232916356);
  assert.equal(evidence.terminal, true);
  assert.equal(evidence.result, "BLOCKIERT");
  assert.equal(evidence.ratified, true);
  assert.deepEqual(evidence.blocker,
    ["PR20_7_ACCOUNT_DISCOVERY_ROSTER_OHNE_INVENTAR_SLOTS"]);
  assert.equal(evidence.realTerminal.controllerVersion, "1.0.3");
  assert.equal(evidence.realTerminal.rosterSource, "X.characters");
  assert.equal(evidence.realTerminal.rosterSourceCandidates.length, 2);
  assert.equal(evidence.realTerminal.performanceTrick.active, true);
  assert.equal(evidence.realTerminal.safety.gameplayWrites, 0);
  assert.equal(evidence.realTerminal.safety.publicFunctionCalls, 0);
  assert.equal(evidence.realTerminal.safety.rawWriteCalls, 0);
  assert.equal(evidence.realTerminal.safety.startCalls, 0);
  assert.equal(evidence.realTerminal.safety.disconnectCalls, 0);
  assert.equal(evidence.realTerminal.safety.sameIntentRetry, false);

  assert.equal(evidence.bridgeLiveContextEvidence.source,
    "WINDOWS_BRIDGE_SAME_ORIGIN_EXISTING_CONTEXTS_READ_ONLY");
  assert.equal(evidence.bridgeLiveContextEvidence.contexts.length, 3);
  assert.deepEqual(
    evidence.bridgeLiveContextEvidence.contexts.map(x => [x.name, x.inventoryItemCount, x.compatibleCandidates]),
    [
      ["My_Ranger1", 13, 0],
      ["My_Priest", 4, 0],
      ["My_Mage", 2, 0],
    ],
  );
  assert.equal(
    evidence.bridgeLiveContextEvidence.conclusion,
    "NO_COMPATIBLE_EXISTING_ACCOUNT_WEAPON_OFFHAND_CANDIDATE",
  );
  assert.equal(evidence.bridgeLiveContextEvidence.safety.gameplayWrites, 0);
  assert.equal(evidence.bridgeLiveContextEvidence.safety.rawWriteCalls, 0);
  assert.equal(evidence.bridgeLiveContextEvidence.safety.startCalls, 0);
  assert.equal(evidence.bridgeLiveContextEvidence.safety.disconnectCalls, 0);
  assert.equal(evidence.resolution.existingCandidateSearchExhausted, true);
  assert.equal(evidence.resolution.procurementRequired, true);
  assert.equal(
    evidence.resolution.nextGate,
    "PR20_7_WEAPON_OFFHAND_ACQUISITION_READ_ONLY_PREFLIGHT",
  );
  assert.equal(evidence.resolution.farmerGearAllocationStillSeparate, true);

  assert.equal(evidence.priorAttempts.length, 2);
  assert.equal(evidence.priorAttempts[0].controllerVersion, "1.0.1");
  assert.equal(evidence.priorAttempts[0].status, "BLOCKIERT");
  assert.equal(evidence.priorAttempts[1].controllerVersion, "1.0.2");
  assert.equal(evidence.priorAttempts[1].status, "BLOCKIERT");
  assert.equal(plan.sourceSelection.preferMostCompleteExactFarmerRows, true);
  assert.equal(plan.sameTestUpgrade.windowsBridgeFailClosedGate, true);
  assert.equal(evidence.sourceCommit, plan.deployment.sourceCommit);
  assert.equal(evidence.packageSha256, plan.deployment.packageSha256);
});
