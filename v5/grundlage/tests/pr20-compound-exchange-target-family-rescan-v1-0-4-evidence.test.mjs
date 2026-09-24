import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-compound-exchange-target-family-rescan-v1-0-4-evidence.json",
  "utf8",
));

test("PR20.8 v1.0.4 ratifies the Compound candidate observation without write authority", () => {
  assert.equal(evidence.status,"BESTANDEN_COMPOUND_CANDIDATE_EXCHANGE_NO_CANDIDATE_ZERO_WRITE");
  assert.equal(evidence.evidenceRatified,true);
  assert.equal(evidence.controllerVersion,"1.0.4");
  assert.equal(evidence.liveEvidence.status,"BESTANDEN");
  assert.equal(evidence.liveEvidence.phase,"COMPLETE");
  assert.equal(evidence.liveEvidence.terminal,true);
  assert.deepEqual(evidence.liveEvidence.blocker,[]);
  assert.equal(evidence.liveEvidence.gameplayWrites,0);
  assert.equal(evidence.liveEvidence.publicFunctionCalls,0);
  assert.equal(evidence.liveEvidence.rawWriteCalls,0);
  assert.equal(evidence.liveEvidence.sameIntentRetry,false);
  assert.equal(evidence.liveEvidence.normalRuntimeAllowed,false);

  const c=evidence.liveEvidence.compound;
  assert.equal(c.status,"KANDIDAT_GEFUNDEN");
  assert.equal(c.candidateCount,1);
  assert.equal(c.selected.name,"hpamulet");
  assert.equal(c.selected.level,0);
  assert.equal(c.selected.baseGold,20000);
  assert.deepEqual(c.selected.physicalIndexes,[1,22,23]);
  assert.deepEqual(c.selected.scroll,{name:"cscroll0",observedQuantity:20});
  assert.equal(c.selected.offering,null);
  assert.equal(c.selected.normalPathOnly,true);
  assert.equal(c.selected.liveAuthority,false);
  assert.equal(c.selected.exactPhysicalIndexesMustBeReresolvedBeforeSend,true);
});

test("PR20.8 v1.0.4 keeps Exchange and all mutation authorities closed", () => {
  const x=evidence.liveEvidence.exchange;
  assert.equal(x.status,"KEIN_KANDIDAT");
  assert.equal(x.candidateCount,0);
  assert.equal(x.selected,null);
  assert.deepEqual(x.rejected,[{name:"anniversarygift",index:4,reason:"UNSAFE_PHYSICAL_ITEM"}]);

  for (const key of [
    "authorityIssued","gameplayAuthority","rawWriteAuthority","upgradeAuthority",
    "compoundAuthority","exchangeAuthority","durableIntentCreated",
  ]) assert.equal(evidence.authority[key],false,key);

  assert.equal(evidence.conclusion.compoundNormalCandidateObserved,true);
  assert.equal(evidence.conclusion.compoundCandidateObservationRatified,true);
  assert.equal(evidence.conclusion.compoundWriteRatified,false);
  assert.equal(evidence.conclusion.compoundLive5mRatified,false);
  assert.equal(evidence.conclusion.exchangeNormalCandidateObserved,false);
  assert.equal(evidence.conclusion.exchangeCandidateObservationRatified,false);
  assert.equal(evidence.conclusion.exchangeWriteRatified,false);
  assert.equal(evidence.conclusion.exchangeLive5mRatified,false);
  assert.equal(evidence.conclusion.mayAuthorizeCompoundWrite,false);
  assert.equal(evidence.conclusion.mayAuthorizeExchangeWrite,false);
  assert.equal(evidence.conclusion.pr20_8ExitGateSatisfied,false);
  assert.equal(evidence.nextGate,"PR20_8_COMPOUND_DURABLE_SHADOW_PREPARATION");
});
