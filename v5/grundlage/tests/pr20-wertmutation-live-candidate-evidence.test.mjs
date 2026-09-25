import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence = JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-live-candidate-readonly-evidence.json",
  "utf8",
));
const manifest = JSON.parse(fs.readFileSync(
  "roadmap/v5-autonomous-test-manifest.json",
  "utf8",
));
const packageSource = fs.readFileSync(
  "werkzeuge/pr20-8-wertmutation-live-candidate-readonly.js",
  "utf8",
);

test("PR20.8 real-browser candidate discovery evidence is terminal and zero-write", () => {
  assert.equal(evidence.status, "BESTANDEN_REAL_BROWSER_LIVE_READ_ONLY");
  assert.equal(evidence.ratified, true);
  assert.equal(evidence.manifestMainCommit,
    "4ca28e7593e7757a05e0be4ea4f87902d8e089a9");
  assert.equal(evidence.sourceCommit,
    "7307573841b86b1fb22fd5abfb73a3d461bf0049");
  assert.equal(evidence.packageSha256,
    "863ed58adb421ba618d5deace65942397db09fed676f3ef8eec9f9b17871d7d5");
  assert.equal(evidence.testId,
    "pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(evidence.controllerVersion, "1.0.0");
  assert.equal(evidence.result.terminal, true);
  assert.equal(evidence.result.status, "BESTANDEN");
  assert.equal(evidence.result.phase, "COMPLETE");
  assert.deepEqual(evidence.result.blocker, []);
  assert.equal(evidence.result.recipient.characterName, "My_Merchant");
  assert.equal(evidence.result.recipient.ctype, "merchant");
  assert.equal(evidence.result.recipient.serverRegion, "EU");
  assert.equal(evidence.result.recipient.serverIdentifier, "I");
  assert.equal(evidence.result.qFingerprintMaterial, "{}");
  assert.equal(evidence.result.freshInventoryMaterialCaptured, true);
  assert.equal(evidence.result.freshQMaterialCaptured, true);
  assert.equal(evidence.result.performanceTrick.active, true);
  assert.equal(evidence.result.performanceTrick.playing, true);
  assert.equal(
    evidence.result.performanceTrick.verification,
    "HOWLER_PLAYING_TRUE",
  );

  const boundary = evidence.observedSafetyBoundary;
  assert.equal(boundary.authorityIssued, false);
  assert.equal(boundary.durableIntentCreated, false);
  assert.equal(boundary.upgradeAuthority, false);
  assert.equal(boundary.compoundAuthority, false);
  assert.equal(boundary.exchangeAuthority, false);
  assert.equal(boundary.gameplayAuthority, false);
  assert.equal(boundary.rawWriteAuthority, false);
  assert.equal(boundary.gameplayWrites, 0);
  assert.equal(boundary.publicFunctionCalls, 0);
  assert.equal(boundary.rawWriteCalls, 0);
  assert.equal(boundary.sameIntentRetry, false);
  assert.equal(boundary.normalRuntimeAllowed, false);
});

test("PR20.8 real-browser evidence selected only the simple low-value Upgrade path", () => {
  const families = evidence.result.families;
  assert.equal(families.UPGRADE.status, "KANDIDAT_GEFUNDEN");
  assert.equal(families.UPGRADE.candidateCount, 3);
  const selected = families.UPGRADE.selected;
  assert.equal(selected.name, "gloves");
  assert.equal(selected.level, 0);
  assert.equal(selected.inventoryIndex, 6);
  assert.equal(selected.quantity, 1);
  assert.equal(selected.baseGold, 3400);
  assert.equal(selected.scrollName, "scroll0");
  assert.equal(selected.observedScrollQuantity, 36);
  assert.equal(selected.offering, null);
  assert.equal(selected.normalPathOnly, true);
  assert.equal(selected.locked, false);
  assert.equal(selected.blocked, false);
  assert.equal(selected.specialProperty, false);
  assert.equal(selected.gift, false);
  assert.equal(selected.liveAuthority, false);
  assert.equal(selected.exactPhysicalIndexMustBeReresolvedBeforeSend, true);

  assert.equal(families.COMPOUND.status, "KEIN_KANDIDAT");
  assert.equal(families.COMPOUND.candidateCount, 0);
  assert.equal(families.COMPOUND.selected, null);
  assert.equal(families.EXCHANGE.status, "KEIN_KANDIDAT");
  assert.equal(families.EXCHANGE.candidateCount, 0);
  assert.equal(families.EXCHANGE.selected, null);
  assert.deepEqual(families.EXCHANGE.observedRejected, [{
    name: "anniversarygift",
    inventoryIndex: 4,
    reason: "UNSAFE_PHYSICAL_ITEM",
  }]);
});

test("PR20.8 evidence does not turn observed index into write authority", () => {
  assert.equal(evidence.interpretation.liveCandidateSelectionPassed, true);
  assert.equal(evidence.interpretation.upgradeNormalCandidateObserved, true);
  assert.equal(evidence.interpretation.compoundNormalCandidateObserved, false);
  assert.equal(evidence.interpretation.exchangeNormalCandidateObserved, false);
  assert.equal(
    evidence.interpretation.noCandidateDoesNotAuthorizeAcquisitionOrMutation,
    true,
  );
  assert.equal(
    evidence.interpretation.observedInventoryIndexDoesNotCarryWriteAuthority,
    true,
  );
  assert.equal(
    evidence.interpretation.freshReresolutionRequiredBeforeAnyFutureSend,
    true,
  );
  assert.deepEqual(evidence.interpretation.specialPathsStillExcluded, [
    "OFFERING",
    "SCROLL4",
    "MASS_EXCHANGE",
    "RECURSIVE_DROP",
    "SPECIAL_MULTI_OUTPUT",
  ]);
  assert.equal(evidence.nextGate, "PR20_8_UPGRADE_DURABLE_SHADOW_NO_WRITE");
});

test("ratified read-only evidence stays immutable when live manifest advances", () => {
  assert.equal(manifest.gate, "PR20.9_PRODUCTION");
  if (manifest.testId === evidence.testId && manifest.controllerVersion === evidence.controllerVersion) {
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
    "send_item(",
    "send_gold(",
    "use_skill(",
    "api_call(",
    "socket.emit(",
    ".socket.emit(",
  ]) assert.equal(packageSource.includes(marker), false, marker);
});
