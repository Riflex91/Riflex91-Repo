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

test("PR20.7 account discovery pending evidence cannot count as pass", () => {
  assert.equal(evidence.testId, "pr20-7-gear-account-weapon-candidate-discovery-v2");
  assert.equal(evidence.status, "OFFEN");
  assert.equal(evidence.supersedesTestId, "pr20-7-gear-account-weapon-candidate-discovery");
  assert.equal(evidence.controllerVersion, "1.0.3");
  assert.match(evidence.sourceCommit, /^[0-9a-f]{40}$/);
  assert.match(evidence.packageSha256, /^[0-9a-f]{64}$/);
  assert.equal(evidence.observedAtMs, null);
  assert.equal(evidence.terminal, null);
  assert.equal(evidence.result, null);
  assert.equal(evidence.ratified, false);
  assert.equal(evidence.priorAttempts.length, 2);
  assert.equal(evidence.priorAttempts[0].controllerVersion, "1.0.1");
  assert.equal(evidence.priorAttempts[0].status, "BLOCKIERT");
  assert.deepEqual(evidence.priorAttempts[0].blocker,
    ["PR20_7_ACCOUNT_DISCOVERY_PERFORMANCE_TRICK_BLOCKED"]);
  assert.equal(evidence.priorAttempts[0].performanceTrick.called, true);
  assert.equal(evidence.priorAttempts[0].performanceTrick.audioFound, false);
  assert.equal(evidence.priorAttempts[0].safety.gameplayWrites, 0);
  assert.equal(evidence.priorAttempts[0].safety.rawWriteCalls, 0);
  assert.equal(evidence.priorAttempts[1].controllerVersion, "1.0.2");
  assert.equal(evidence.priorAttempts[1].status, "BLOCKIERT");
  assert.deepEqual(evidence.priorAttempts[1].blocker,
    ["PR20_7_ACCOUNT_DISCOVERY_ROSTER_OHNE_INVENTAR_SLOTS"]);
  assert.equal(evidence.priorAttempts[1].performanceTrick.active, true);
  assert.equal(evidence.priorAttempts[1].roster.source, "get_characters");
  assert.equal(evidence.priorAttempts[1].roster.exactFarmerRows, 3);
  assert.equal(evidence.priorAttempts[1].roster.rowsWithItemsAndSlots, 0);
  assert.equal(evidence.priorAttempts[1].safety.gameplayWrites, 0);
  assert.equal(evidence.priorAttempts[1].safety.rawWriteCalls, 0);
  assert.equal(plan.sourceSelection.preferMostCompleteExactFarmerRows, true);
  assert.equal(plan.sourceSelection.richRowRequiresItemsAndSlots, true);
  assert.equal(plan.sourceSelection.noLifecycleMutation, true);
  assert.equal(plan.sameTestUpgrade.windowsBridgeFailClosedGate, true);
  assert.equal(plan.sameTestUpgrade.requiresTerminal, true);
  assert.equal(plan.sameTestUpgrade.requiresGameplayWrites, 0);
  assert.equal(plan.sameTestUpgrade.requiresRawWriteCalls, 0);
  assert.equal(plan.sameTestUpgrade.requiresSameIntentRetry, false);
  assert.equal(plan.sameTestUpgrade.requiresDurableIntentCreated, false);
  assert.equal(plan.sameTestUpgrade.requiresNoIntents, true);
  assert.equal(evidence.sourceCommit, plan.deployment.sourceCommit);
  assert.equal(evidence.packageSha256, plan.deployment.packageSha256);
  assert.deepEqual(
    evidence.blocker,
    ["REAL_ACCOUNT_WEAPON_CANDIDATE_DISCOVERY_V2_CONTROLLER_1_0_3_NOCH_NICHT_TERMINAL"],
  );
});
