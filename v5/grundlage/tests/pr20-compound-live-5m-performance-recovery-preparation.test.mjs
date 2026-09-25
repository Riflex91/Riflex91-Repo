import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import {execFileSync} from "node:child_process";

const contract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-compound-live-5m-performance-recovery-preparation.json",
  "utf8",
));
const source=fs.readFileSync(contract.package,"utf8");

test("PR20.8 Compound 5m v1.0.1 recovery is exact and zero-write",()=>{
  assert.equal(contract.status,"RECOVERY_PACKAGE_READY_FOR_EXACT_ZERO_WRITE_REDEPLOY");
  assert.equal(contract.testId,"pr20-8-compound-live-5m");
  assert.equal(contract.fromControllerVersion,"1.0.0");
  assert.equal(contract.toControllerVersion,"1.0.1");
  assert.equal(contract.package,"werkzeuge/pr20-8-compound-live-5m-v1-0-1.js");
  assert.equal(contract.test,"werkzeuge/tests/pr20-8-compound-live-5m-v1-0-1.test.mjs");
  assert.equal(contract.sourceCommit,"51b1fc8038740f828cacffe866c6db799a447348");
  assert.equal(contract.packageSha256,"23af77b23467e99fddfa437b9dc54873d0e3f25d783c940c819b447e44863a2b");
  assert.equal(contract.packageBytes,26060);
  assert.equal(contract.expectedGlobal,"V5PR208CompoundLive5m");
  assert.equal(contract.nextGate,"PR20_8_COMPOUND_LIVE_5M_RECOVERY_MANIFEST_CUTOVER");
});

test("PR20.8 Compound 5m v1.0.0 failure was terminal and mutation-free",()=>{
  const f=contract.observedFailure;
  assert.equal(f.notificationId,2221);
  assert.equal(f.status,"BLOCKIERT");
  assert.equal(f.phase,"ERROR");
  assert.equal(f.blocker,"PR20_8_COMPOUND_5M_PERFORMANCE_TRICK_NICHT_AKTIV");
  assert.equal(f.samples,0);
  assert.equal(f.gameplayWrites,0);
  assert.equal(f.publicFunctionCalls,0);
  assert.equal(f.rawWriteCalls,0);
  assert.equal(f.additionalGameplayWrites,0);
  assert.equal(f.additionalPublicFunctionCalls,0);
  assert.equal(f.additionalRawWriteCalls,0);
  assert.equal(f.sameIntentRetry,false);
  assert.equal(f.sourceSendCount,1);
  assert.equal(f.normalRuntimeAllowed,false);
});

test("PR20.8 Compound 5m recovery changes only performance activation timing",()=>{
  const r=contract.recoveryChange;
  assert.equal(r.scope,"PERFORMANCE_TRICK_ACTIVATION_TIMING_ONLY");
  assert.equal(r.initialWaitMs,350);
  assert.equal(r.retryCount,1);
  assert.equal(r.retryWaitMs,150);
  assert.equal(r.verification,"HOWLER_PLAYING_TRUE");
  assert.equal(r.otherwise,"BLOCK_FAIL_CLOSED");
});

test("PR20.8 Compound 5m recovery bridge admission is exact and narrow",()=>{
  const a=contract.bridgeAdmission;
  assert.equal(a.desiredTestId,"pr20-8-compound-live-5m");
  assert.equal(a.desiredVersion,"1.0.1");
  assert.equal(a.requiredCurrentTestId,"pr20-8-compound-live-5m");
  assert.equal(a.requiredCurrentVersion,"1.0.0");
  assert.equal(a.currentTerminalRequired,true);
  assert.equal(a.currentGameplayWritesRequired,0);
  assert.equal(a.currentRawWriteCallsRequired,0);
  assert.equal(a.currentSameIntentRetryRequired,false);
  assert.equal(a.currentIntentCountRequired,0);
  assert.equal(a.durableIntentProbeMayBeUnknown,true);
  assert.equal(a.broaderSameTestUpgradeRelaxation,false);
});

test("PR20.8 Compound 5m v1.0.1 retains zero-send package surface",()=>{
  const b=contract.packageBoundary;
  assert.equal(b.publicCompoundCallSites,0);
  assert.equal(b.upgradeCallSites,0);
  assert.equal(b.exchangeCallSites,0);
  assert.equal(b.apiCallSites,0);
  assert.equal(b.rawSocketCallSites,0);
  assert.equal(b.maximumAdditionalGameplayWrites,0);
  assert.equal(b.maximumAdditionalPublicFunctionCalls,0);
  assert.equal(b.maximumAdditionalRawWriteCalls,0);
  assert.equal(b.restartMayNeverResend,true);
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

test("PR20.8 Compound 5m v1.0.1 bytes are immutable at source commit",()=>{
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

test("PR20.8 Compound 5m recovery remains bound to original committed transaction",()=>{
  assert.deepEqual(contract.sourceTransaction,{
    transactionId:"pr20-8-compound-productive-one-write-live:ff08418e6003250471c98f5893dec8dd",
    requiredStatus:"COMMITTED",
    requiredSendCount:1,
    requiredReconciliation:"COMMITTED_SUCCESS",
  });
});
