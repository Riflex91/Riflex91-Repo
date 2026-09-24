import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const prep=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-compound-productive-one-write-preparation.json",
  "utf8",
));
const evidence=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-compound-durable-shadow-evidence.json",
  "utf8",
));

test("PR20.8 Compound one-write preparation is pinned to ratified no-write shadow evidence",()=>{
  assert.equal(prep.status,"BEREIT_NO_LIVE_WRITE");
  assert.equal(prep.family,"COMPOUND");
  assert.equal(
    prep.prerequisiteEvidence.path,
    "v5/roadmap/pr20-8-compound-durable-shadow-evidence.json",
  );
  assert.equal(
    prep.prerequisiteEvidence.requiredStatus,
    "BESTANDEN_REAL_BROWSER_DURABLE_SHADOW_NO_WRITE",
  );
  assert.equal(prep.prerequisiteEvidence.observedAtMs,1790280262923);
  assert.equal(evidence.evidenceRatified,true);
  assert.equal(evidence.status,"BESTANDEN_REAL_BROWSER_DURABLE_SHADOW_NO_WRITE");
  assert.equal(evidence.conclusion.compoundWriteRatified,false);
});

test("PR20.8 future Compound write is exact hpamulet@0 x3 + cscroll0 and no offering",()=>{
  const s=prep.exactScope;
  assert.equal(s.characterName,"My_Merchant");
  assert.equal(s.characterClass,"merchant");
  assert.equal(s.serverRegion,"EU");
  assert.equal(s.serverIdentifier,"I");
  assert.deepEqual(s.candidate,{
    name:"hpamulet",
    level:0,
    baseGold:20000,
    physicalQuantity:3,
    quantityEach:1,
    distinctPhysicalItemsRequired:true,
  });
  assert.deepEqual(s.scroll,{
    name:"cscroll0",
    type:"cscroll",
    grade:0,
    consumeQuantity:1,
    baseGold:6400,
  });
  assert.equal(s.offering,null);
  assert.equal(s.publicFunction,"compound");
  assert.equal(
    s.publicFunctionSignature,
    "compound(item0,item1,item2,scroll_num,offering_num,only_calculate)",
  );
  assert.deepEqual(s.futureSendArguments.candidateIndexes,[
    "FRESHLY_RERESOLVED_AT_SEND",
    "FRESHLY_RERESOLVED_AT_SEND",
    "FRESHLY_RERESOLVED_AT_SEND",
  ]);
  assert.equal(s.futureSendArguments.scrollIndex,"FRESHLY_RERESOLVED_AT_SEND");
  assert.equal(s.futureSendArguments.offeringIndex,null);
  assert.equal(s.futureSendArguments.onlyCalculate,false);
});

test("PR20.8 Compound one-write preparation requires fresh three-input and durable fences",()=>{
  const p=prep.preWriteRequirements;
  assert.equal(p.exactSessionBinding,true);
  assert.equal(p.exactServerBinding,true);
  assert.equal(p.qMustBeEmpty,true);
  assert.equal(p.characterMustBeAlive,true);
  assert.equal(p.characterMustBeStationary,true);
  assert.equal(p.targetMustBeEmpty,true);
  assert.equal(p.hostileAggroMustBeZero,true);
  assert.equal(p.alternativeRuntimeMustBeInactive,true);
  assert.equal(p.performanceTrickMustBeActive,true);
  assert.equal(p.candidateDefinitionExact,true);
  assert.equal(p.scrollDefinitionExact,true);
  assert.equal(p.exactThreeCandidatePhysicalIdentities,true);
  assert.equal(p.scrollPhysicalIdentityExact,true);
  assert.equal(p.freshThreeCandidateIndexesReresolveImmediatelyBeforeSend,true);
  assert.equal(p.freshScrollIndexReresolveImmediatelyBeforeSend,true);
  assert.equal(p.stableDoubleObservationRequired,true);
  assert.equal(p.serviceReachabilityRequired,true);
  assert.equal(p.serviceReference,"G.maps.main.ref.c_mid");
  assert.equal(p.sourcePinnedSellDistance,400);
  assert.equal(p.conservativeLiveSafetyDistanceMax,300);
  assert.equal(p.offeringForbidden,true);
  assert.equal(p.specialCompoundPathsForbidden,true);
  assert.equal(p.massproductionConditionStateExact,true);
  assert.equal(p.massproductionppConditionStateExact,true);
  assert.equal(p.conditionStateFingerprintRequired,true);
  assert.equal(p.freshConditionStateReobserveImmediatelyBeforeSend,true);
  assert.equal(p.compoundEffectDomainFingerprintRequired,true);
  assert.deepEqual(p.compoundEffectDomain,[
    "character.s.massproduction",
    "character.s.massproductionpp",
    "character.p.ograce",
    "character.p.c_roll",
    "character.p.c_item",
    "character.p.c_itemx",
    "S.cgrace",
  ]);
  assert.equal(p.freshCompoundEffectDomainReobserveImmediatelyBeforeSend,true);

  const d=prep.durableTransaction;
  assert.equal(d.actionContractId,"AL-ACTION-COMPOUND");
  assert.equal(d.recoveryContractId,"AL-RECOVERY-COMPOUND");
  assert.equal(d.verifierId,"AL-VERIFIER-COMPOUND");
  assert.equal(d.durableIntentBeforePossibleSend,true);
  assert.equal(d.exactJournalReadbackRequired,true);
  assert.equal(d.currentFenceRequired,true);
  assert.deepEqual(d.resourceEpochs,["inventory","q","socketBudget","actionChannel","massproduction","massproductionpp"]);
  assert.equal(d.familySpecificOneShotAuthority,"Pr208CompoundOneShotAuthority");
  assert.equal(d.oneShotMaximumUses,1);
  assert.equal(d.oneShotMaximumTtlMs,1500);
  assert.equal(d.authorityMustBeConsumedImmediatelyBeforeSend,true);
  assert.equal(d.driftRevokes,true);
  assert.equal(d.sameIntentRetry,false);
});

test("PR20.8 Compound one-write preparation itself grants no live write",()=>{
  const b=prep.futureLiveWriteBoundary;
  assert.equal(b.enabled,false);
  assert.equal(b.liveRunnerPresent,false);
  assert.equal(b.gameplayAuthority,false);
  assert.equal(b.rawWriteAuthority,false);
  assert.equal(b.maximumGameplayWrites,1);
  assert.equal(b.maximumPublicFunctionCalls,1);
  assert.equal(b.maximumRawWriteCalls,0);
  assert.equal(b.directSocketEmitForbidden,true);
  assert.equal(b.sendBoundaryBeforeGate,"NICHT_GESENDET");
  assert.equal(b.normalRuntimeAllowed,false);
});

test("PR20.8 Compound reconciliation models accepted destructive in-flight state and forbids blind retry",()=>{
  const r=prep.reconciliation;
  assert.equal(r.qOrCompoundPlaceholderAcceptedInFlight,true);
  assert.equal(r.scrollConsumableDeltaAcceptedInFlight,true);
  assert.equal(r.firstCandidatePlaceholderAcceptedInFlight,true);
  assert.equal(r.secondaryCandidateConsumptionAcceptedInFlight,true);
  assert.equal(r.candidateMutationAcceptedInFlight,true);
  assert.match(r.expectedSuccess,/exactly one hpamulet@1/);
  assert.match(r.expectedFailure,/all three hpamulet@0 inputs consumed/);
  assert.equal(r.restartNonTerminalRequiresReconciliation,true);
  assert.equal(r.unknownNeverBlindRetry,true);
  assert.equal(r.conditionDeltaAcceptedInFlight,true);
  assert.equal(r.massproductionConditionConsumptionReconciled,true);
  assert.equal(r.massproductionppConditionConsumptionReconciled,true);
  assert.equal(r.compoundEffectDomainDeltaReconciled,true);
  assert.equal(r.notAppliedRequiresPositiveUnchangedEvidenceForAllThreeInputsScrollAndConditions,true);
  assert.equal(r.committedRequiresVerifiedThreeInputConsumableAndConditionOutcome,true);
  assert.equal(prep.nextGate,"PR20_8_COMPOUND_PRODUCTIVE_ONE_WRITE_RUNNER_PACKAGE");
});
