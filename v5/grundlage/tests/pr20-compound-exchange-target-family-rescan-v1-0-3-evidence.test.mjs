import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-compound-exchange-target-family-rescan-v1-0-3-evidence.json",
  "utf8",
));

test("PR20.8 v1.0.3 target-family rescan ratifies the no-candidate observation without write authority", () => {
  assert.equal(evidence.status,"BLOCKIERT_KEIN_TARGET_FAMILY_NORMALKANDIDAT_ZERO_WRITE");
  assert.equal(evidence.evidenceRatified,true);
  assert.equal(evidence.testId,"pr20-8-wertmutation-live-candidate-readonly");
  assert.equal(evidence.controllerVersion,"1.0.3");

  assert.equal(evidence.package.sourceCommit,"a0625dd9611b1006dc6f09ef7222ce5b67361ca6");
  assert.equal(evidence.package.path,"v5/werkzeuge/pr20-8-wertmutation-live-candidate-readonly-v1-0-3.js");
  assert.equal(evidence.package.sha256,"f633b5ed877120aa9c76c2c788b64b8efb20eef155a0d38612fb5fca7c20da25");
  assert.equal(evidence.package.bytes,21343);
  assert.equal(evidence.package.expectedGlobal,"V5PR208ValueMutationLiveCandidateReadonly");

  const live=evidence.liveEvidence;
  assert.equal(live.source,"public.aio_v5_test_status");
  assert.equal(live.observedAtMs,1790275611960);
  assert.equal(live.status,"BLOCKIERT");
  assert.equal(live.phase,"PR20_8_LIVE_CANDIDATE_SELECTION");
  assert.equal(live.terminal,true);
  assert.deepEqual(live.blocker,["PR20_8_CANDIDATE_KEIN_COMPOUND_ODER_EXCHANGE_NORMALKANDIDAT"]);
  assert.deepEqual(live.compound,{status:"KEIN_KANDIDAT",candidateCount:0,selected:null});
  assert.equal(live.exchange.status,"KEIN_KANDIDAT");
  assert.equal(live.exchange.candidateCount,0);
  assert.equal(live.exchange.selected,null);
  assert.deepEqual(live.exchange.rejected,[{name:"anniversarygift",index:4,reason:"UNSAFE_PHYSICAL_ITEM"}]);
  assert.equal(live.gameplayWrites,0);
  assert.equal(live.publicFunctionCalls,0);
  assert.equal(live.rawWriteCalls,0);
  assert.equal(live.sameIntentRetry,false);
  assert.equal(live.normalRuntimeAllowed,false);
});

test("PR20.8 no-candidate evidence keeps Compound/Exchange and acquisition authority closed", () => {
  assert.deepEqual(evidence.liveEvidence.upgradeInformationalCandidate,{
    name:"gloves",
    index:13,
    level:0,
    baseGold:3400,
    scroll:{name:"scroll0",observedQuantity:35},
  });

  assert.equal(evidence.authority.authorityIssued,false);
  assert.equal(evidence.authority.gameplayAuthority,false);
  assert.equal(evidence.authority.rawWriteAuthority,false);
  assert.equal(evidence.authority.upgradeAuthority,false);
  assert.equal(evidence.authority.compoundAuthority,false);
  assert.equal(evidence.authority.exchangeAuthority,false);
  assert.equal(evidence.authority.durableIntentCreated,false);

  assert.equal(evidence.conclusion.targetFamilyRescanValid,true);
  assert.equal(evidence.conclusion.compoundNormalCandidateObserved,false);
  assert.equal(evidence.conclusion.exchangeNormalCandidateObserved,false);
  assert.equal(evidence.conclusion.upgradeResultInformationalOnly,true);
  assert.equal(evidence.conclusion.mayAuthorizeCompoundWrite,false);
  assert.equal(evidence.conclusion.mayAuthorizeExchangeWrite,false);
  assert.equal(evidence.conclusion.mayAcquireOrMutateToCreateCandidate,false);
  assert.equal(evidence.conclusion.noCandidateDoesNotAuthorizeAcquisitionOrMutation,true);
  assert.equal(evidence.conclusion.compoundRatified,false);
  assert.equal(evidence.conclusion.exchangeRatified,false);
  assert.equal(evidence.nextGate,"PR20_8_NO_CANDIDATE_CLOSEOUT_REVIEW");
});
