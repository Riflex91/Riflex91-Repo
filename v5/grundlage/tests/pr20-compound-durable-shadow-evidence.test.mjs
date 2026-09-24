import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-compound-durable-shadow-evidence.json",
  "utf8",
));

test("PR20.8 Compound durable shadow live evidence is terminal BESTANDEN and no-write",()=>{
  assert.equal(evidence.status,"BESTANDEN_REAL_BROWSER_DURABLE_SHADOW_NO_WRITE");
  assert.equal(evidence.evidenceRatified,true);
  assert.equal(evidence.testId,"pr20-8-compound-durable-shadow-no-write");
  assert.equal(evidence.controllerVersion,"1.0.0");
  assert.equal(evidence.liveEvidence.status,"BESTANDEN");
  assert.equal(evidence.liveEvidence.phase,"COMPLETE");
  assert.equal(evidence.liveEvidence.terminal,true);
  assert.deepEqual(evidence.liveEvidence.blocker,[]);
  assert.equal(evidence.liveEvidence.gameplayWrites,0);
  assert.equal(evidence.liveEvidence.publicFunctionCalls,0);
  assert.equal(evidence.liveEvidence.rawWriteCalls,0);
  assert.equal(evidence.liveEvidence.normalRuntimeAllowed,false);

  const c=evidence.liveEvidence.candidate;
  assert.equal(c.name,"hpamulet");
  assert.equal(c.level,0);
  assert.equal(c.baseGold,20000);
  assert.equal(c.quantity,3);
  assert.equal(c.quantityEach,1);
  assert.deepEqual(c.inventoryIndexes,[1,22,23]);
  assert.equal(c.matchingCandidateCount,3);

  const s=evidence.liveEvidence.scroll;
  assert.equal(s.name,"cscroll0");
  assert.equal(s.inventoryIndex,18);
  assert.equal(s.observedQuantity,20);
  assert.equal(s.consumeQuantity,1);
  assert.equal(evidence.liveEvidence.offering,null);
  assert.equal(evidence.liveEvidence.normalPathOnly,true);
  assert.equal(evidence.liveEvidence.publicFunction,"compound");
  assert.equal(evidence.liveEvidence.publicFunctionAvailable,true);
});

test("PR20.8 Compound durable shadow proves durable NOT_APPLIED without opening authority",()=>{
  const d=evidence.liveEvidence.durable;
  assert.equal(d.storage,"LOCAL_STORAGE_SHADOW_ONLY");
  assert.equal(d.createdThisRun,true);
  assert.equal(d.durableReadback,true);
  assert.equal(d.durableTerminalIntentPresent,true);
  assert.equal(d.journalTerminalArt,"ABBRUCH");
  assert.equal(d.sendBoundaryState,"NICHT_GESENDET");
  assert.equal(d.reconciliationClassification,"NOT_APPLIED");
  assert.equal(d.sameIntentRetry,false);
  assert.equal(d.oneShotMaximumUses,1);
  assert.equal(d.exactPhysicalCandidateIndexesPinned,true);
  assert.equal(d.exactPhysicalScrollIndexPinned,true);
  assert.equal(d.freshReresolutionRequiredBeforeFutureSend,true);

  assert.equal(
    evidence.liveEvidence.fingerprints.prestateFingerprintSha256,
    evidence.liveEvidence.fingerprints.postIntentPrestateFingerprintSha256,
  );
  assert.equal(evidence.liveEvidence.performanceTrick.active,true);
  assert.equal(evidence.liveEvidence.serviceReachability.reachable,true);
  assert.equal(evidence.liveEvidence.serviceReachability.distance < 300,true);

  for(const key of [
    "authorityIssued","compoundAuthority","gameplayAuthority","rawWriteAuthority",
    "normalCompoundWriteRatification",
  ]) assert.equal(evidence.liveEvidence[key],false,key);

  assert.equal(evidence.conclusion.shadowRatified,true);
  assert.equal(evidence.conclusion.durableReadbackConfirmed,true);
  assert.equal(evidence.conclusion.noGameplayMutationObserved,true);
  assert.equal(evidence.conclusion.compoundWriteRatified,false);
  assert.equal(evidence.conclusion.compoundLive5mRatified,false);
  assert.equal(evidence.conclusion.mayAuthorizeCompoundWrite,false);
  assert.equal(evidence.conclusion.exchangeRatified,false);
  assert.equal(evidence.conclusion.pr20_8ExitGateSatisfied,false);
  assert.equal(evidence.nextGate,"PR20_8_COMPOUND_PRODUCTIVE_ONE_WRITE_PREPARATION");
});
