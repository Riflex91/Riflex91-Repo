import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence = JSON.parse(
  fs.readFileSync("roadmap/pr20-8-upgrade-productive-one-write-evidence.json", "utf8"),
);
const manifest = JSON.parse(
  fs.readFileSync("roadmap/v5-autonomous-test-manifest.json", "utf8"),
);
const roadmap = JSON.parse(
  fs.readFileSync("roadmap/post-r19-roadmap.json", "utf8"),
);

test("PR20.8 productive Upgrade one-write evidence ratifies exactly one committed public call", () => {
  assert.equal(evidence.status, "RATIFIED_COMMITTED_SUCCESS");
  assert.equal(evidence.immutableTelemetry.table, "public.aio_debug_telemetry_batches");
  assert.equal(evidence.immutableTelemetry.batchId, 8252);
  assert.equal(evidence.controller.testId, "pr20-8-upgrade-productive-one-write-live");
  assert.equal(evidence.controller.version, "1.0.3");
  assert.equal(evidence.controller.status, "BESTANDEN");
  assert.equal(evidence.controller.phase, "COMPLETE");
  assert.equal(evidence.controller.terminal, true);

  assert.equal(evidence.mutation.publicFunction, "upgrade");
  assert.equal(evidence.mutation.gameplayWrites, 1);
  assert.equal(evidence.mutation.publicFunctionCalls, 1);
  assert.equal(evidence.mutation.rawWriteCalls, 0);
  assert.equal(evidence.mutation.sendCount, 1);
  assert.equal(evidence.mutation.sameIntentRetry, false);
  assert.equal(evidence.mutation.journalStatus, "COMMITTED");
  assert.equal(evidence.mutation.reconciliationClassification, "COMMITTED_SUCCESS");

  assert.equal(evidence.candidate.name, "gloves");
  assert.equal(evidence.candidate.levelBefore, 0);
  assert.equal(evidence.candidate.levelAfter, 1);
  assert.equal(evidence.candidate.indexAtSend, 6);
  assert.equal(evidence.scroll.name, "scroll0");
  assert.equal(evidence.scroll.indexAtSend, 14);
  assert.equal(evidence.scroll.quantityBefore, 36);
  assert.equal(evidence.scroll.quantityAfter, 35);
  assert.equal(evidence.scroll.consumeQuantity, 1);

  assert.equal(evidence.durability.durableIntentCreated, true);
  assert.equal(evidence.durability.durableIntentReadback, true);
  assert.equal(evidence.durability.authorityIssued, true);
  assert.equal(evidence.durability.authorityConsumed, true);
  assert.equal(evidence.durability.oneShotAuthorityMaximumUses, 1);

  assert.equal(evidence.safetyBoundary.exactOneGameplayWriteObserved, true);
  assert.equal(evidence.safetyBoundary.exactOnePublicFunctionCallObserved, true);
  assert.equal(evidence.safetyBoundary.zeroRawWritesObserved, true);
  assert.equal(evidence.safetyBoundary.noSameIntentRetryObserved, true);
  assert.equal(evidence.safetyBoundary.noSecondSendAllowed, true);
  assert.equal(evidence.safetyBoundary.normalRuntimeAllowed, false);
  assert.equal(evidence.safetyBoundary.compoundRatification, false);
  assert.equal(evidence.safetyBoundary.exchangeRatification, false);
});

test("committed Upgrade evidence stays immutable while the global no-write manifest advances", () => {
  assert.equal(manifest.normalRuntimeAllowed, false);
  const restore=roadmap.pr20_9.craftDurableShadowRunner.restoreManifest;
  assert.equal(restore.testId,"pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(restore.controllerVersion,"1.0.6");
  assert.equal(
    restore.sourceCommit,
    "a5fd67cc9c587b2a20b163915936717c7b4e8321",
  );
  assert.equal(
    restore.package,
    "v5/werkzeuge/pr20-8-wertmutation-live-candidate-readonly-v1-0-6.js",
  );
  assert.equal(
    restore.packageSha256,
    "fb2395104beee0e611e5150c44183c95976eab188e451c23401271d1ae02e387",
  );
  assert.equal(restore.expectedGlobal,"V5PR208ValueMutationLiveCandidateReadonly");
  assert.ok([
    "pr20-9-craft-durable-shadow-no-write",
    restore.testId,
  ].includes(manifest.testId));
  assert.equal(
    evidence.nextGate,
    "PR20_8_UPDATER_PERSISTENCE_BOOTSTRAP_REAL_BROWSER_RUN",
  );
});
