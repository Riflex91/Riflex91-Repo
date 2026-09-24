import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const plan = JSON.parse(fs.readFileSync(
  "roadmap/pr20-7-weapon-offhand-read-only-preflight-test-plan.json",
  "utf8",
));
const evidence = JSON.parse(fs.readFileSync(
  "roadmap/pr20-7-weapon-offhand-read-only-preflight-evidence.json",
  "utf8",
));
const source = fs.readFileSync(
  "werkzeuge/pr20-7-weapon-offhand-read-only-autonomous.js",
  "utf8",
);

test("PR20.7 weapon/offhand read-only plan is explicit, class-bound and workerless", () => {
  assert.equal(plan.gate, "PR20.7_GEAR");
  assert.equal(plan.testId, "pr20-7-gear-weapon-offhand-read-only-preflight");
  assert.equal(plan.status, "MANIFEST_CUTOVER_BEREIT_FUER_REALEN_NO_WRITE_PREFLIGHT");
  assert.equal(plan.deployment.coordinatorClass, "merchant");
  assert.equal(plan.deployment.workerPackageConfigured, false);
  assert.equal(plan.deployment.farmerWorkerDistribution, false);
  assert.equal(plan.deployment.packageCommitPinned, true);
  assert.match(plan.deployment.sourceCommit, /^[0-9a-f]{40}$/);
  assert.match(plan.deployment.packageSha256, /^[0-9a-f]{64}$/);
  assert.equal(plan.deployment.sourceCommit, evidence.sourceCommit);
  assert.equal(plan.deployment.packageSha256, evidence.packageSha256);
  assert.deepEqual(plan.recipient.explicitSlots, ["mainhand", "offhand"]);
  assert.equal(plan.recipient.genericWeaponAutoSlotAllowed, false);
  assert.equal(plan.recipient.oppositeHandPinned, true);
  assert.equal(plan.recipient.itemClassRestrictionChecked, true);
  assert.equal(plan.recipient.itemLevelChecked, true);
  assert.equal(plan.recipient.classMainhandWtypeChecked, true);
  assert.equal(plan.recipient.classOffhandCapabilityChecked, true);
  assert.equal(plan.recipient.doublehandRequiresEmptyOffhand, true);
  assert.equal(plan.recipient.automaticUnequipAllowed, false);
});

test("PR20.7 weapon/offhand preflight keeps every mutation boundary closed", () => {
  const boundary = plan.mutationBoundary;
  assert.equal(boundary.browserGameplayWrites, 0);
  assert.equal(boundary.publicFunctionCalls, 0);
  assert.equal(boundary.rawWriteCalls, 0);
  assert.equal(boundary.durableIntentCreated, false);
  assert.equal(boundary.authorityIssued, false);
  assert.equal(boundary.weaponOffhandWriteRatification, false);
  assert.equal(boundary.startCalls, 0);
  assert.equal(boundary.disconnectCalls, 0);
  assert.equal(boundary.farmerWorkersInstalled, 0);
  assert.equal(boundary.sameIntentRetry, false);
  assert.equal(boundary.normalRuntimeAllowed, false);
  for (const marker of [
    "equip(",
    "unequip(",
    "use_skill(",
    "send_item(",
    "start_character(",
    "command_character(",
    "/disconnect ",
    "api_call(",
    "socket.emit(",
    ".socket.emit(",
  ]) assert.equal(source.includes(marker), false, marker);
});

test("PR20.7 weapon/offhand real preflight ratifies a zero-write resource blocker, not a pass", () => {
  assert.equal(evidence.status, "BLOCKIERT_REAL_BROWSER_NO_SAFE_CANDIDATE_ZERO_WRITE");
  assert.match(evidence.sourceCommit, /^[0-9a-f]{40}$/);
  assert.match(evidence.packageSha256, /^[0-9a-f]{64}$/);
  assert.match(evidence.manifestMainCommit, /^[0-9a-f]{40}$/);
  assert.equal(evidence.observedAtMs, 1790226506589);
  assert.equal(evidence.terminal, true);
  assert.equal(evidence.ratified, true);
  assert.deepEqual(evidence.blocker, ["PR20_7_WEAPON_OFFHAND_KEIN_SICHERER_KANDIDAT"]);
  assert.equal(evidence.result.status, "BLOCKIERT");
  assert.equal(evidence.result.recipient.characterName, "My_Merchant");
  assert.equal(evidence.result.recipient.ctype, "merchant");
  assert.equal(evidence.result.weaponSlots[0].slot, "mainhand");
  assert.equal(evidence.result.weaponSlots[0].name, "staff");
  assert.equal(evidence.result.weaponSlots[1].slot, "offhand");
  assert.equal(evidence.result.weaponSlots[1].occupied, false);
  assert.equal(evidence.result.inventoryItemCount, 21);
  assert.equal(evidence.result.performanceTrick.active, true);
  assert.equal(evidence.result.performanceTrick.verification, "HOWLER_PLAYING_TRUE");
  for (const [key, expected] of Object.entries({
    browserGameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    durableIntentCreated: false,
    authorityIssued: false,
    weaponOffhandWriteRatification: false,
    startCalls: 0,
    disconnectCalls: 0,
    farmerWorkersInstalled: 0,
    sameIntentRetry: false,
    normalRuntimeAllowed: false,
  })) {
    assert.equal(evidence.observedSafetyBoundary[key], expected, key);
  }
});
