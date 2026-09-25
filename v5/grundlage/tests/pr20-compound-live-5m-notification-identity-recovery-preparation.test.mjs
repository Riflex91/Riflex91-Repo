import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import {execFileSync} from "node:child_process";

const contract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-compound-live-5m-notification-identity-recovery-preparation.json",
  "utf8",
));
const source=fs.readFileSync(contract.package,"utf8");

test("PR20.8 Compound 5m v1.0.2 recovery is telemetry-identity-only",()=>{
  assert.equal(contract.status,"PACKAGE_READY_NOT_DEPLOYED");
  assert.equal(contract.testId,"pr20-8-compound-live-5m");
  assert.equal(contract.fromControllerVersion,"1.0.1");
  assert.equal(contract.toControllerVersion,"1.0.2");
  assert.equal(contract.package,"werkzeuge/pr20-8-compound-live-5m-v1-0-2.js");
  assert.equal(contract.test,"werkzeuge/tests/pr20-8-compound-live-5m-v1-0-2.test.mjs");
  assert.equal(contract.sourceCommit,"18568cbc9689bd7e27c5a26a4342901d470b72c0");
  assert.equal(contract.packageSha256,"4d9083bf163d98f15d842d64ecfc49ae4c9b8c3452b0b31a499d4b0b5687c849");
  assert.equal(contract.packageBytes,28166);
  assert.equal(contract.expectedGlobal,"V5PR208CompoundLive5m");
  assert.equal(contract.nextGate,"PR20_8_COMPOUND_LIVE_5M_NOTIFICATION_IDENTITY_RECOVERY_MANIFEST_CUTOVER");
});

test("observed v1.0.1 success proves the real 5m zero-write behavior",()=>{
  const e=contract.observedV1_0_1Success;
  assert.equal(e.debugTelemetryBatchId,8297);
  assert.equal(e.observedAtMs,1790310312453);
  assert.equal(e.status,"BESTANDEN");
  assert.equal(e.phase,"COMPLETE");
  assert.equal(e.terminal,true);
  assert.equal(e.samples,60);
  assert.equal(e.durationMs,300545);
  assert.equal(e.minimumSamples,60);
  assert.equal(e.minimumDurationMs,299000);
  assert.equal(e.sourceSendCount,1);
  assert.equal(e.additionalGameplayWrites,0);
  assert.equal(e.additionalPublicFunctionCalls,0);
  assert.equal(e.additionalRawWriteCalls,0);
  assert.equal(e.sameIntentRetry,false);
  assert.equal(e.normalRuntimeAllowed,false);
  assert.equal(e.postcondition.resultItem,"hpamulet@1@index1");
  assert.deepEqual(e.postcondition.consumedInputIndexes,[22,23]);
  assert.equal(e.postcondition.scroll,"cscroll0@index18:q19");
  assert.equal(e.postcondition.qClear,true);
  assert.equal(e.postcondition.compoundQueueClear,true);
  assert.equal(e.postcondition.placeholders,0);
  assert.equal(e.postcondition.compoundEffectsClear,true);
  assert.equal(e.postcondition.massproductionPresent,false);
  assert.equal(e.postcondition.massproductionppPresent,false);
  assert.equal(e.performanceTrickVerification,"HOWLER_PLAYING_TRUE");
  assert.equal(e.compoundLive5mTested,true);
  assert.equal(e.mayAdvanceToPr20_9,false);
});

test("notification persistence gap is explained by the exact unique identity collision",()=>{
  const g=contract.notificationPersistenceGap;
  assert.equal(g.table,"public.aio_v5_test_notifications");
  assert.equal(g.expectedCompletionVersion,"1.0.1");
  assert.equal(g.observedCompletionPresent,false);
  assert.equal(g.priorNotificationId,2221);
  assert.equal(g.priorVersion,"1.0.0");
  assert.equal(g.priorRunStartedAtMs,0);
  assert.equal(g.currentRunStartedAtMs,0);
  assert.equal(g.uniqueConstraint,"UNIQUE (bot_id, test_id, run_started_at_ms)");
  assert.equal(g.diagnosis,"TOP_LEVEL_STARTED_AT_MS_MISSING_CAUSES_RUN_IDENTITY_COLLISION");
  assert.equal(g.directDatabaseRepairAllowed,false);
});

test("v1.0.2 may migrate only exact terminal v1.0.1 success without resampling or resend",()=>{
  const r=contract.recoveryChange;
  assert.equal(r.scope,"TELEMETRY_RUN_IDENTITY_ONLY");
  assert.equal(r.topLevelStartedAtMsSource,"PERSISTED_PROGRESS_SOAK_STARTED_AT_MS");
  assert.equal(r.freshRunStartedAtMsSource,"DATE_NOW");
  assert.equal(r.exactPreviousTerminalVersion,"1.0.1");
  assert.equal(r.terminalSuccessMigrationOnly,true);
  assert.equal(r.incompletePreviousProgressAllowed,false);
  assert.equal(r.resampleExistingSuccess,false);
  assert.equal(r.resendAllowed,false);
});

test("v1.0.2 bridge admission is exact to terminal v1.0.1 zero-write success",()=>{
  const a=contract.bridgeAdmission;
  assert.equal(a.desiredTestId,"pr20-8-compound-live-5m");
  assert.equal(a.desiredVersion,"1.0.2");
  assert.equal(a.requiredCurrentTestId,"pr20-8-compound-live-5m");
  assert.equal(a.requiredCurrentVersion,"1.0.1");
  assert.equal(a.currentTerminalRequired,true);
  assert.equal(a.currentGameplayWritesRequired,0);
  assert.equal(a.currentRawWriteCallsRequired,0);
  assert.equal(a.currentSameIntentRetryRequired,false);
  assert.equal(a.currentIntentCountRequired,1);
  assert.equal(a.intentMeaning,"READ_ONLY_SOURCE_COMMITTED_INTENT");
  assert.equal(a.broaderSameTestUpgradeRelaxation,false);
});

test("v1.0.2 package stays mutation-authority closed",()=>{
  const b=contract.packageBoundary;
  assert.equal(b.publicCompoundCallSites,0);
  assert.equal(b.upgradeCallSites,0);
  assert.equal(b.exchangeCallSites,0);
  assert.equal(b.apiCallSites,0);
  assert.equal(b.rawSocketCallSites,0);
  assert.equal(b.maximumAdditionalGameplayWrites,0);
  assert.equal(b.maximumAdditionalPublicFunctionCalls,0);
  assert.equal(b.maximumAdditionalRawWriteCalls,0);
  assert.equal(b.sameIntentRetry,false);
  assert.equal(b.compoundWriteAuthority,false);
  assert.equal(b.gameplayAuthority,false);
  assert.equal(b.rawWriteAuthority,false);
  assert.equal(b.normalRuntimeAllowed,false);

  for(const forbidden of [
    "globalThis.compound(",
    "compound(",
    "upgrade(",
    "exchange(",
    ".socket.emit(",
    "api_call(",
    "sameIntentRetry: true",
    "normalRuntimeAllowed: true",
  ]) assert.equal(source.includes(forbidden),false,forbidden);
});

test("v1.0.2 bytes are immutable at source commit",()=>{
  const bytes=execFileSync(
    "git",
    ["show",contract.sourceCommit+":v5/"+contract.package],
    {encoding:null,maxBuffer:256*1024},
  );
  assert.equal(bytes.length,contract.packageBytes);
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    contract.packageSha256,
  );
  assert.equal(bytes.toString("utf8"),source);
});
