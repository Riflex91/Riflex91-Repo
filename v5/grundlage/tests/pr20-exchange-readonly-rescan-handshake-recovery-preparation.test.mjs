import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import {execFileSync} from "node:child_process";

const contract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-readonly-rescan-handshake-recovery-preparation.json",
  "utf8",
));
const source=fs.readFileSync(contract.package,"utf8");

test("PR20.8 Exchange read-only rescan handshake recovery v1.0.5 is exact",()=>{
  assert.equal(contract.status,"PACKAGE_READY_NOT_DEPLOYED");
  assert.equal(contract.testId,"pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(contract.fromControllerVersion,"1.0.4");
  assert.equal(contract.toControllerVersion,"1.0.5");
  assert.equal(contract.package,"werkzeuge/pr20-8-wertmutation-live-candidate-readonly-v1-0-5.js");
  assert.equal(contract.test,"werkzeuge/tests/pr20-8-wertmutation-live-candidate-readonly-v1-0-5.test.mjs");
  assert.equal(contract.sourceCommit,"d4269f0e7998e265be4a3d1c1dffdd9b0e138c90");
  assert.equal(contract.packageSha256,"27d16d91fcba345b9e87ce2b8724a0e65bf202c1b74f73ab6187d488e4c55a92");
  assert.equal(contract.packageBytes,21792);
  assert.equal(contract.expectedGlobal,"V5PR208ValueMutationLiveCandidateReadonly");
  assert.equal(contract.nextGate,"PR20_8_EXCHANGE_READONLY_RESCAN_HANDSHAKE_RECOVERY_MANIFEST_CUTOVER");
});

test("observed v1.0.4 deployment failure is a zero-write handshake failure",()=>{
  const f=contract.observedV1_0_4DeploymentFailure;
  assert.equal(f.bridgeState,"ERROR");
  assert.equal(f.bridgeError,"InvalidOperationException: V5_TEST_DEPLOYMENT_HANDSHAKE_FAILED");
  assert.equal(f.desiredTestId,"pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(f.desiredVersion,"1.0.4");
  assert.equal(f.currentTestId,"pr20-8-compound-live-5m");
  assert.equal(f.currentVersion,"1.0.2");
  assert.equal(f.currentStatus,"BESTANDEN");
  assert.equal(f.currentPhase,"COMPLETE");
  assert.equal(f.currentTerminal,true);
  assert.equal(f.currentGameplayWrites,0);
  assert.equal(f.currentPublicFunctionCalls,0);
  assert.equal(f.currentRawWriteCalls,0);
  assert.equal(f.freshScannerCompletionObserved,false);
});

test("handshake root cause is stale inherited facade metadata, not scanner selection semantics",()=>{
  const r=contract.rootCause;
  assert.equal(r.staleFacadeMarker,"__v5Pr208CandidateFacadeVersion");
  assert.equal(r.inheritedMarkerVersion,"1.0.4");
  assert.equal(r.laterWrapperPreservesUnknownProperties,true);
  assert.equal(r.priorScannerTrustedMarkerWithoutVerifyingLiveStatus,true);
  assert.equal(r.failureMode,"SCANNER_API_INSTALLED_BUT_AIO_V3_OPERATIONS_STATUS_REMAINS_COMPOUND");
  assert.equal(r.bridgeHandshakeRequiresBothStatusAndCoordinatorGlobal,true);
});

test("v1.0.5 changes only synchronous observability facade validation",()=>{
  const r=contract.recoveryChange;
  assert.equal(r.scope,"OBSERVABILITY_FACADE_HANDSHAKE_ONLY");
  assert.equal(r.markerMayShortCircuitOnlyWhenLiveStatusMatchesExactTestIdAndVersion,true);
  assert.equal(r.staleInheritedMarkerMustBeReplaced,true);
  assert.equal(r.synchronousPublishBeforeAsyncScan,true);
  assert.equal(r.scannerSemanticsChanged,false);
  assert.equal(r.inventorySelectionSemanticsChanged,false);
  assert.equal(r.gameplayBehaviorChanged,false);
  assert.ok(source.includes("text(current.testId,192) === TEST_ID"));
  assert.ok(source.includes("text(current.version,32) === VERSION"));
  assert.ok(source.indexOf("publish();") < source.indexOf("Promise.resolve().then(run)"));
});

test("v1.0.5 stays fully read-only and authority closed",()=>{
  const a=contract.authority;
  assert.equal(a.maximumGameplayWrites,0);
  assert.equal(a.maximumPublicFunctionCalls,0);
  assert.equal(a.maximumRawWriteCalls,0);
  assert.equal(a.authorityIssued,false);
  assert.equal(a.compoundAuthority,false);
  assert.equal(a.exchangeAuthority,false);
  assert.equal(a.gameplayAuthority,false);
  assert.equal(a.rawWriteAuthority,false);
  assert.equal(a.durableIntentCreated,false);
  assert.equal(a.sameIntentRetry,false);
  assert.equal(a.normalRuntimeAllowed,false);
  assert.equal(a.acquisitionOrMutationToCreateCandidateAllowed,false);
  for(const forbidden of [
    "upgrade(",
    "compound(",
    "exchange(",
    "buy(",
    "buy_with_gold(",
    "equip(",
    "unequip(",
    "sell(",
    "bank_retrieve(",
    "bank_store(",
    "send_item(",
    "send_gold(",
    "use_skill(",
    "start_character(",
    "command_character(",
    "api_call(",
    "socket.emit(",
    ".socket.emit(",
    "normalRuntimeAllowed: true",
  ]) assert.equal(source.includes(forbidden),false,forbidden);
});

test("v1.0.5 package bytes remain immutable at source commit",()=>{
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
