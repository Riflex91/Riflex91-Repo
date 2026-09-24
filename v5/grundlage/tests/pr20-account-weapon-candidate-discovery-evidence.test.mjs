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
  assert.equal(plan.status, "BLOCKIERT_REAL_NO_EXISTING_CANDIDATE_ZERO_WRITE_RATIFIED");
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

test("PR20.7 account discovery ratifies the safe no-existing-candidate outcome", () => {
  assert.equal(evidence.testId, "pr20-7-gear-account-weapon-candidate-discovery-v2");
  assert.equal(evidence.status, "BLOCKIERT_REAL_ACCOUNT_ROSTER_NO_INVENTORY_ZERO_WRITE");
  assert.equal(evidence.supersedesTestId, "pr20-7-gear-account-weapon-candidate-discovery");
  assert.equal(evidence.controllerVersion, "1.0.3");
  assert.match(evidence.sourceCommit, /^[0-9a-f]{40}$/);
  assert.match(evidence.packageSha256, /^[0-9a-f]{64}$/);
  assert.equal(evidence.manifestMainCommit, "8a3b988014ccbd3c0d071825d740071b9c97794b");
  assert.equal(evidence.observedAtMs, 1790232916356);
  assert.equal(evidence.terminal, true);
  assert.equal(evidence.result, "BLOCKIERT");
  assert.equal(evidence.ratified, true);
  assert.deepEqual(evidence.blocker, ["PR20_7_ACCOUNT_DISCOVERY_ROSTER_OHNE_INVENTAR_SLOTS"]);

  assert.equal(evidence.actual.controllerVersion, "1.0.3");
  assert.equal(evidence.actual.phase, "ACCOUNT_WEAPON_CANDIDATE_DISCOVERY");
  assert.equal(evidence.actual.rosterSource, "X.characters");
  assert.equal(evidence.actual.exactFarmerRows, 3);
  assert.equal(evidence.actual.rowsWithItemsAndSlots, 0);
  assert.equal(evidence.actual.selectedCandidate, null);
  assert.deepEqual(evidence.actual.rosterSourceCandidates, [
    { source: "X.characters", score: 38, exactFarmerRows: 3, richFarmerRows: 0 },
    { source: "get_characters", score: 38, exactFarmerRows: 3, richFarmerRows: 0 },
  ]);
  assert.equal(evidence.actual.performanceTrick.active, true);
  assert.equal(evidence.actual.performanceTrick.verification, "HOWLER_PLAYING_TRUE");
  for (const [key, expected] of Object.entries({
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    startCalls: 0,
    disconnectCalls: 0,
    farmerWorkersInstalled: 0,
    sameIntentRetry: false,
    durableIntentCreated: false,
    authorityIssued: false,
    weaponOffhandWriteRatification: false,
    farmerGearAllocationRatification: false,
    normalRuntimeAllowed: false,
  })) assert.equal(evidence.actual.safety[key], expected, key);

  assert.equal(evidence.bridgeLiveFarmerContexts.observedAt, 1790232986700);
  assert.equal(evidence.bridgeLiveFarmerContexts.source, "WINDOWS_BRIDGE_EXISTING_SAME_ORIGIN_CONTEXTS_READ_ONLY");
  assert.deepEqual(evidence.bridgeLiveFarmerContexts.server, { region: "EU", identifier: "I" });
  assert.equal(evidence.bridgeLiveFarmerContexts.exactContexts, 3);
  assert.equal(evidence.bridgeLiveFarmerContexts.compatibleCandidateCount, 0);
  assert.deepEqual(
    evidence.bridgeLiveFarmerContexts.characters.map(row => [row.name, row.inventoryItemCount, row.candidateCount, row.performanceTrickActive]),
    [
      ["My_Ranger1", 13, 0, true],
      ["My_Priest", 4, 0, true],
      ["My_Mage", 2, 0, true],
    ],
  );
  assert.equal(evidence.bridgeLiveFarmerContexts.safety.gameplayWrites, 0);
  assert.equal(evidence.bridgeLiveFarmerContexts.safety.rawWriteCalls, 0);
  assert.equal(evidence.bridgeLiveFarmerContexts.safety.startCalls, 0);
  assert.equal(evidence.bridgeLiveFarmerContexts.safety.disconnectCalls, 0);
  assert.equal(evidence.bridgeLiveFarmerContexts.deploymentDiagnostic.state, "ALREADY_PRESENT");
  assert.equal(evidence.bridgeLiveFarmerContexts.deploymentDiagnostic.changed, false);
  assert.equal(evidence.bridgeLiveFarmerContexts.deploymentDiagnostic.error, null);

  assert.equal(evidence.conclusion.existingCompatibleCandidateFound, false);
  assert.equal(evidence.conclusion.accountMetadataRouteExhausted, true);
  assert.equal(evidence.conclusion.liveExistingFarmerContextsChecked, true);
  assert.equal(evidence.conclusion.lifecycleMutationRequiredForDiscovery, false);
  assert.equal(evidence.conclusion.farmerGearAllocationRatified, false);
  assert.equal(evidence.conclusion.weaponOffhandWriteRatified, false);
  assert.equal(evidence.conclusion.nextAction, "PR20_7_WEAPON_OFFHAND_MERCHANT_ACQUISITION_PREPARE");

  assert.equal(plan.nextAfterSafeBlock, "PR20_7_WEAPON_OFFHAND_MERCHANT_ACQUISITION_PREPARE");
  assert.equal(plan.actualOutcome.controllerVersion, "1.0.3");
  assert.equal(plan.actualOutcome.terminal, true);
  assert.equal(plan.actualOutcome.result, "BLOCKIERT");
  assert.equal(plan.actualOutcome.bridgeLiveFarmerContexts.exactContexts, 3);
  assert.equal(plan.actualOutcome.bridgeLiveFarmerContexts.compatibleCandidateCount, 0);
  assert.equal(plan.actualOutcome.bridgeLiveFarmerContexts.allPerformanceTrickActive, true);
  assert.equal(plan.actualOutcome.bridgeLiveFarmerContexts.gameplayWrites, 0);
  assert.equal(plan.actualOutcome.bridgeLiveFarmerContexts.rawWriteCalls, 0);

  assert.equal(evidence.priorAttempts.length, 2);
  assert.equal(evidence.priorAttempts[0].controllerVersion, "1.0.1");
  assert.deepEqual(evidence.priorAttempts[0].blocker, ["PR20_7_ACCOUNT_DISCOVERY_PERFORMANCE_TRICK_BLOCKED"]);
  assert.equal(evidence.priorAttempts[1].controllerVersion, "1.0.2");
  assert.deepEqual(evidence.priorAttempts[1].blocker, ["PR20_7_ACCOUNT_DISCOVERY_ROSTER_OHNE_INVENTAR_SLOTS"]);

  assert.equal(evidence.sourceCommit, plan.deployment.sourceCommit);
  assert.equal(evidence.packageSha256, plan.deployment.packageSha256);
});
