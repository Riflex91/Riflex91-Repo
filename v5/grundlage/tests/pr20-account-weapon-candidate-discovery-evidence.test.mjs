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
  assert.equal(evidence.status, "OFFEN");
  assert.equal(evidence.sourceCommit, null);
  assert.equal(evidence.packageSha256, null);
  assert.equal(evidence.observedAtMs, null);
  assert.equal(evidence.terminal, null);
  assert.equal(evidence.result, null);
  assert.equal(evidence.ratified, false);
  assert.deepEqual(
    evidence.blocker,
    ["ACCOUNT_WEAPON_CANDIDATE_DISCOVERY_NOCH_NICHT_AUSGEFUEHRT"],
  );
});
