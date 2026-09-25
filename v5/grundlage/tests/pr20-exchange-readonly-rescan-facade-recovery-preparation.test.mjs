import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import {execFileSync} from "node:child_process";

const contract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-readonly-rescan-facade-recovery-preparation.json",
  "utf8",
));
const source=fs.readFileSync(contract.package,"utf8");

test("PR20.8 Exchange read-only rescan facade recovery is exact and not deployed",()=>{
  assert.equal(contract.status,"RECOVERY_PACKAGE_READY_NOT_DEPLOYED");
  assert.equal(contract.testId,"pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(contract.fromControllerVersion,"1.0.4");
  assert.equal(contract.toControllerVersion,"1.0.5");
  assert.equal(contract.package,"werkzeuge/pr20-8-wertmutation-live-candidate-readonly-v1-0-5.js");
  assert.equal(contract.test,"werkzeuge/tests/pr20-8-wertmutation-live-candidate-readonly-v1-0-5.test.mjs");
  assert.equal(contract.sourceCommit,"36bece2cc75854e7d02c6c8dc6ddaf75a74579cb");
  assert.equal(contract.packageSha256,"e87996be9ee56b31f7737923b5bf8999a0a8af82393dea9419f5f4fd3d4b494e");
  assert.equal(contract.packageBytes,21688);
  assert.equal(contract.expectedGlobal,"V5PR208ValueMutationLiveCandidateReadonly");
  assert.equal(contract.manifestCutoverPrepared,false);
  assert.equal(contract.deployed,false);
  assert.equal(contract.evidenceObserved,false);
  assert.equal(contract.acquisitionOrMutationToCreateCandidateAllowed,false);
  assert.equal(contract.nextGate,"PR20_8_EXCHANGE_READONLY_RESCAN_FACADE_RECOVERY_MANIFEST_CUTOVER");
});

test("observed deployment failure is terminal Compound status plus handshake mismatch only",()=>{
  const f=contract.observedDeploymentFailure;
  assert.equal(f.manifestMainCommit,"25206b24d43a5780eec4d84f6ed4fbe1fb9c5494");
  assert.equal(f.desiredControllerVersion,"1.0.4");
  assert.equal(f.bridgeState,"ERROR");
  assert.equal(f.bridgeError,"InvalidOperationException: V5_TEST_DEPLOYMENT_HANDSHAKE_FAILED");
  assert.equal(f.observedAtMs,1790314474502);
  assert.equal(f.currentTestId,"pr20-8-compound-live-5m");
  assert.equal(f.currentControllerVersion,"1.0.2");
  assert.equal(f.currentStatus,"BESTANDEN");
  assert.equal(f.currentPhase,"COMPLETE");
  assert.equal(f.currentTerminal,true);
  assert.equal(f.currentGameplayWrites,0);
  assert.equal(f.currentRawWriteCalls,0);
  assert.equal(f.currentSameIntentRetry,false);
  assert.equal(f.currentIntentCount,1);
  assert.equal(f.currentHasOwnAuthority,false);
});

test("root cause is stale copied scanner marker, not Bridge admission",()=>{
  const r=contract.rootCause;
  assert.equal(r.component,"SCANNER_TELEMETRY_FACADE_IDEMPOTENCY_GUARD");
  assert.equal(r.staleMarker,"__v5Pr208CandidateFacadeVersion");
  assert.equal(r.staleMarkerValue,"1.0.4");
  assert.equal(r.compoundFacadePreservesExistingOperationProperties,true);
  assert.equal(r.scannerV1_0_4MarkerOnlyGuard,true);
  assert.equal(r.consequence,"SCANNER_REINSTALL_SKIPS_STATUS_FACADE_REPLACEMENT_AND_BRIDGE_PROBE_REMAINS_COMPOUND");
  assert.equal(r.bridgeAdmissionDefect,false);
});

test("v1.0.5 changes only facade idempotency and rejects foreign status despite copied marker",()=>{
  const r=contract.recoveryChange;
  assert.equal(r.scope,"TELEMETRY_FACADE_IDEMPOTENCY_ONLY");
  assert.equal(r.markerStillRequired,true);
  assert.equal(r.markerAloneSufficient,false);
  assert.equal(r.existingStatusMustMatchTestId,true);
  assert.equal(r.existingStatusMustMatchVersion,true);
  assert.equal(r.staleForeignStatusForcesFacadeReplacement,true);
  assert.equal(r.gameplaySelectionLogicChanged,false);
  assert.equal(r.candidatePolicyChanged,false);
  assert.equal(r.bridgeAdmissionChanged,false);

  for(const marker of [
    "const VERSION = '1.0.5'",
    "existingFacadeIsCurrent",
    "current.testId === TEST_ID",
    "current.version === VERSION",
    "__v5Pr208CandidateFacadeVersion: VERSION",
  ]) assert.ok(source.includes(marker),marker);
});

test("v1.0.5 remains fully mutation-authority closed",()=>{
  const b=contract.packageBoundary;
  assert.equal(b.maximumGameplayWrites,0);
  assert.equal(b.maximumPublicFunctionCalls,0);
  assert.equal(b.maximumRawWriteCalls,0);
  assert.equal(b.publicUpgradeCallSites,0);
  assert.equal(b.publicCompoundCallSites,0);
  assert.equal(b.publicExchangeCallSites,0);
  assert.equal(b.apiCallSites,0);
  assert.equal(b.rawSocketCallSites,0);
  assert.equal(b.sameIntentRetry,false);
  assert.equal(b.authorityIssued,false);
  assert.equal(b.durableIntentCreated,false);
  assert.equal(b.upgradeAuthority,false);
  assert.equal(b.compoundAuthority,false);
  assert.equal(b.exchangeAuthority,false);
  assert.equal(b.gameplayAuthority,false);
  assert.equal(b.rawWriteAuthority,false);
  assert.equal(b.normalRuntimeAllowed,false);

  for(const forbidden of [
    "upgrade(", "compound(", "exchange(", "buy(", "buy_with_gold(",
    "equip(", "unequip(", "sell(", "bank_retrieve(", "bank_store(",
    "send_item(", "send_gold(", "use_skill(", "start_character(",
    "command_character(", "api_call(", "socket.emit(", ".socket.emit("
  ]) assert.equal(source.includes(forbidden),false,forbidden);
});

test("v1.0.5 package bytes are immutable at source commit",()=>{
  const bytes=execFileSync(
    "git",
    ["show",contract.sourceCommit+":v5/"+contract.package],
    {encoding:null,maxBuffer:256*1024},
  );
  assert.equal(bytes.length,contract.packageBytes);
  assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"),contract.packageSha256);
  assert.equal(bytes.toString("utf8"),source);
});
