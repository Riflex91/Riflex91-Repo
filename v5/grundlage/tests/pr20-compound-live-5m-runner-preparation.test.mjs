import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import {execFileSync} from "node:child_process";

const contract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-compound-live-5m-runner-preparation.json",
  "utf8",
));
const source=fs.readFileSync(contract.package,"utf8");

test("PR20.8 Compound 5m runner package remains observer-only and not deployed",()=>{
  assert.equal(contract.status,"PACKAGE_BEREIT_NOT_DEPLOYED");
  assert.equal(contract.testId,"pr20-8-compound-live-5m");
  assert.equal(contract.controllerVersion,"1.0.0");
  assert.equal(contract.expectedGlobal,"V5PR208CompoundLive5m");
  assert.equal(contract.package,"werkzeuge/pr20-8-compound-live-5m.js");
  assert.equal(contract.test,"werkzeuge/tests/pr20-8-compound-live-5m.test.mjs");
  assert.equal(contract.sourceCommit,"61db398373d1909bc11eb883af5902ac339a123c");
  assert.equal(contract.packageSha256,"2c68619ffb7359373a6a817ac939c34278a66f5c69e7d3efba59a5ff5c00e221");
  assert.equal(contract.packageBytes,25081);
  assert.equal(contract.manifestBoundary.manifestCutoverPrepared,false);
  assert.equal(contract.manifestBoundary.deployed,false);
  assert.equal(contract.manifestBoundary.liveWriteEnabled,false);
  assert.equal(contract.manifestBoundary.bridgeMayDeployPinnedRunner,false);
  assert.equal(
    contract.manifestBoundary.currentManifestMustRemainTerminalZeroWriteBridgeProbe,
    true,
  );
  assert.equal(contract.nextGate,"PR20_8_COMPOUND_LIVE_5M_MANIFEST_CUTOVER");
});

test("PR20.8 Compound 5m runner pins exact committed source transaction and postcondition",()=>{
  const p=contract.prerequisite;
  assert.equal(p.evidence,"roadmap/pr20-8-compound-productive-one-write-evidence.json");
  assert.equal(p.evidenceStatus,"RATIFIED_COMMITTED_SUCCESS");
  assert.equal(p.sourceTestId,"pr20-8-compound-productive-one-write-live");
  assert.equal(
    p.transactionId,
    "pr20-8-compound-productive-one-write-live:ff08418e6003250471c98f5893dec8dd",
  );
  assert.equal(p.sourceIntentStatus,"COMMITTED");
  assert.equal(p.sourceIntentTerminal,true);
  assert.equal(p.sourceReconciliation,"COMMITTED_SUCCESS");
  assert.equal(p.sourceSendCount,1);
  assert.equal(p.sourceAuthorityClass,"Pr208CompoundOneShotAuthority");
  assert.equal(p.sourceAuthorityConsumed,true);
  assert.equal(p.sourceAuthorityUses,1);
  assert.equal(p.sourceAuthorityMaximumUses,1);
  assert.equal(p.activeSourceFencesRequired,0);

  const post=contract.exactCommittedPostcondition;
  assert.deepEqual(post.resultItem,{name:"hpamulet",level:1,inventoryIndex:1});
  assert.deepEqual(post.consumedInputIndexes,[22,23]);
  assert.equal(post.consumedInputSlotsMustRemainEmpty,true);
  assert.deepEqual(post.scroll,{name:"cscroll0",inventoryIndex:18,quantity:19});
  assert.equal(post.qMustBeEmpty,true);
  assert.equal(post.compoundQueueMustBeClear,true);
  assert.equal(post.placeholderCount,0);
  assert.equal(post.massproductionPresent,false);
  assert.equal(post.massproductionppPresent,false);
  assert.equal(post.compoundEffectsMustBeClear,true);
});

test("PR20.8 Compound 5m runner requires a full restart-safe 60 sample soak",()=>{
  const s=contract.soak;
  assert.equal(s.minimumSamples,60);
  assert.equal(s.intervalMs,5000);
  assert.equal(s.minimumDurationMs,299000);
  assert.equal(s.maxContinuationGapMs,15000);
  assert.equal(s.stalePartialSoakResetsSampling,true);
  assert.equal(s.terminalProgressMayRecoverWithoutResampling,true);
  assert.equal(s.durableProgressReadbackRequired,true);
  assert.equal(s.exactSourceGuardEverySample,true);
  assert.equal(s.exactPostconditionEverySample,true);
});

test("PR20.8 Compound 5m runner package has zero gameplay send surface",()=>{
  const b=contract.packageBoundary;
  assert.equal(b.observerOnly,true);
  assert.equal(b.publicCompoundCallSites,0);
  assert.equal(b.upgradeCallSites,0);
  assert.equal(b.exchangeCallSites,0);
  assert.equal(b.apiCallSites,0);
  assert.equal(b.rawSocketCallSites,0);
  assert.equal(b.maximumAdditionalGameplayWrites,0);
  assert.equal(b.maximumAdditionalPublicFunctionCalls,0);
  assert.equal(b.maximumAdditionalRawWriteCalls,0);
  assert.equal(b.compoundWriteAuthority,false);
  assert.equal(b.gameplayAuthority,false);
  assert.equal(b.rawWriteAuthority,false);
  assert.equal(b.restartMayNeverResend,true);
  assert.equal(b.sameIntentRetry,false);
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

test("PR20.8 Compound 5m package bytes are immutable at the pinned source commit",()=>{
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

test("PR20.8 Compound 5m pass alone cannot open Exchange or PR20.9",()=>{
  const e=contract.exitSemantics;
  assert.equal(e.successfulRealFiveMinuteRunMaySetCompoundLive5mTested,true);
  assert.equal(e.exchangeRatified,false);
  assert.equal(e.exchangeAutonomyProductiveProven,false);
  assert.equal(e.pr20_8ExitGateSatisfied,false);
  assert.equal(e.mayAdvanceToPr20_9,false);
});
