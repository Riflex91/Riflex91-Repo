import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const contract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-compound-productive-one-write-runner-preparation.json",
  "utf8",
));

test("PR20.8 Compound productive one-write runner contract remains exact and not deployed",()=>{
  assert.equal(contract.status,"PACKAGE_BEREIT_NOT_DEPLOYED");
  assert.equal(contract.testId,"pr20-8-compound-productive-one-write-live");
  assert.equal(contract.controllerVersion,"1.0.0");
  assert.equal(contract.package,"werkzeuge/pr20-8-compound-productive-one-write-live.js");
  assert.equal(contract.test,"werkzeuge/tests/pr20-8-compound-productive-one-write-live.test.mjs");
  assert.equal(contract.expectedGlobal,"V5PR208CompoundProductiveOneWriteLive");
  assert.equal(contract.sourceCommit,"41ce5ea0a12ff1d346a6febb620e025b7dcf1005");
  assert.equal(contract.packageSha256,"84c4350888ad0ee128b0683b25d8408271582e6beca1be637b457e09d780e9ba");
  assert.equal(contract.packageBytes,49755);
  assert.equal(contract.prerequisiteShadowObservedAtMs,1790280262923);
  assert.equal(contract.exactScope.candidate,"hpamulet@0 x3");
  assert.equal(contract.exactScope.scroll,"cscroll0");
  assert.equal(contract.exactScope.offering,null);
  assert.equal(contract.exactScope.publicFunction,"compound");

  const b=contract.packageBoundary;
  assert.equal(b.manifestCutoverPrepared,false);
  assert.equal(b.deployed,false);
  assert.equal(b.liveWriteEnabled,false);
  assert.equal(b.packageContainsExactlyOnePublicCompoundCallSite,true);
  assert.equal(b.maximumGameplayWritesPerIntent,1);
  assert.equal(b.maximumPublicFunctionCallsPerIntent,1);
  assert.equal(b.maximumRawWriteCalls,0);
  assert.equal(b.directSocketWriteForbidden,true);
  assert.equal(b.normalRuntimeAllowed,false);
  assert.equal(b.concurrentDuplicateRunnerMustNotSend,true);
  assert.equal(contract.nextGate,"PR20_8_COMPOUND_PRODUCTIVE_ONE_WRITE_MANIFEST_CUTOVER");
});

test("PR20.8 Compound runner package is immutable at source commit and has one bounded public callsite",()=>{
  const path="v5/werkzeuge/pr20-8-compound-productive-one-write-live.js";
  const bytes=execFileSync(
    "git",
    ["show",contract.sourceCommit+":"+path],
    {encoding:null,maxBuffer:256*1024},
  );
  assert.equal(bytes.length,contract.packageBytes);
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    contract.packageSha256,
  );
  const source=bytes.toString("utf8");
  assert.equal((source.match(/globalThis\.compound\(/g)||[]).length,1);
  assert.equal(source.includes("globalThis.upgrade("),false);
  assert.equal(source.includes("globalThis.exchange("),false);
  assert.equal(source.includes(".socket.emit("),false);
  assert.equal(source.includes("api_call("),false);
  assert.equal(source.includes("sameIntentRetry: true"),false);
  assert.equal(source.includes("normalRuntimeAllowed: true"),false);
  for(const marker of [
    '"Pr208CompoundOneShotAuthority"',
    '"character:My_Merchant:condition:massproduction"',
    '"character:My_Merchant:condition:massproductionpp"',
    "compoundEffectsFingerprintSha256",
    '"FINAL_SEND_DRIFT"',
    '"COMMITTED_EXPECTED_FAILURE"',
    '"FAILED_SAFE_NOT_APPLIED"',
  ]) assert.ok(source.includes(marker),marker);
});

test("PR20.8 Compound runner binds condition/effect state through final-send revalidation",()=>{
  const r=contract.liveRevalidation;
  assert.equal(r.finalEffectDomainReobserveAfterAuthorityConsume,true);
  assert.deepEqual(r.compoundEffectDomainBound,[
    "character.s.massproduction",
    "character.s.massproductionpp",
    "character.p.ograce",
    "character.p.c_roll",
    "character.p.c_item",
    "character.p.c_itemx",
    "S.cgrace",
  ]);
  assert.deepEqual(r.resourceFences,[
    "inventory",
    "q",
    "socketBudget",
    "actionChannel:compound",
    "condition:massproduction",
    "condition:massproductionpp",
  ]);
  assert.equal(contract.settlement.restartNeverResends,true);
  assert.equal(contract.settlement.promiseResultSupportingEvidenceOnly,true);
  assert.equal(contract.settlement.publicFunctionPromiseTimeoutMs,2000);
  assert.equal(contract.oneShotAuthority.maximumUses,1);
  assert.equal(contract.oneShotAuthority.maximumTtlMs,1500);
});
