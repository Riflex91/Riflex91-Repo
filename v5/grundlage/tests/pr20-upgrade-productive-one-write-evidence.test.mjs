import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence = JSON.parse(
  fs.readFileSync("roadmap/pr20-8-upgrade-productive-one-write-evidence.json", "utf8"),
);
const manifest = JSON.parse(
  fs.readFileSync("roadmap/v5-autonomous-test-manifest.json", "utf8"),
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

test("committed Upgrade evidence stays immutable while the active manifest advances to the anniversarygift Exchange service mount", () => {
  assert.equal(manifest.testId,"pr20-8-exchange-anniversarygift-autonomy-route-shadow-no-write");
  assert.equal(manifest.controllerVersion,"1.0.1");
  assert.equal(manifest.gate, "PR20.8_WERTMUTATIONEN");
  assert.equal(manifest.sourceCommit,"9e1066800aaf92cccaaf088c846df1057e4a8eaa");
  assert.equal(manifest.packagePath,"v5/werkzeuge/pr20-8-exchange-anniversarygift-autonomy-route-shadow-no-write-v1-0-1.js");
  assert.equal(manifest.packageSha256,"9a459d62653f0420c89343196ce2469611e01d110ebab2d2717cb54bb7596604");
  assert.equal(manifest.expectedGlobal,"V5PR208ExchangeAnniversarygiftAutonomyRouteShadowNoWrite");
  assert.equal(manifest.normalRuntimeAllowed, false);
  assert.equal(
    evidence.nextGate,
    "PR20_8_UPDATER_PERSISTENCE_BOOTSTRAP_REAL_BROWSER_RUN",
  );
});
