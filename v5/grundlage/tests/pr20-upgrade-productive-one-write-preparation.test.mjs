import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const prep=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-upgrade-productive-one-write-preparation.json",
  "utf8",
));
const evidence=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-upgrade-durable-shadow-evidence.json",
  "utf8",
));

test("PR20.8 Upgrade one-write preparation is pinned to ratified shadow evidence", () => {
  assert.equal(prep.status,"BEREIT_NO_LIVE_WRITE");
  assert.equal(prep.family,"UPGRADE");
  assert.equal(
    prep.prerequisiteEvidence.path,
    "v5/roadmap/pr20-8-upgrade-durable-shadow-evidence.json",
  );
  assert.equal(
    prep.prerequisiteEvidence.requiredStatus,
    "BESTANDEN_REAL_BROWSER_DURABLE_SHADOW_NO_WRITE",
  );
  assert.equal(prep.prerequisiteEvidence.telemetryBatchId,8244);
  assert.equal(evidence.ratified,true);
});

test("PR20.8 future Upgrade write is exact gloves@0 + scroll0 and no offering", () => {
  assert.equal(prep.exactScope.characterName,"My_Merchant");
  assert.equal(prep.exactScope.characterClass,"merchant");
  assert.equal(prep.exactScope.serverRegion,"EU");
  assert.equal(prep.exactScope.serverIdentifier,"I");
  assert.deepEqual(prep.exactScope.candidate,{
    name:"gloves",level:0,baseGold:3400,quantity:1,
  });
  assert.deepEqual(prep.exactScope.scroll,{
    name:"scroll0",type:"uscroll",grade:0,consumeQuantity:1,baseGold:1000,
  });
  assert.equal(prep.exactScope.offering,null);
  assert.equal(prep.exactScope.publicFunction,"upgrade");
  assert.equal(
    prep.exactScope.publicFunctionSignature,
    "upgrade(item_num, scroll_num, offering_num, only_calculate)",
  );
  assert.equal(
    prep.exactScope.futureSendArguments.candidateIndex,
    "FRESHLY_RERESOLVED_AT_SEND",
  );
  assert.equal(
    prep.exactScope.futureSendArguments.scrollIndex,
    "FRESHLY_RERESOLVED_AT_SEND",
  );
  assert.equal(prep.exactScope.futureSendArguments.offeringIndex,null);
  assert.equal(prep.exactScope.futureSendArguments.onlyCalculate,false);
});

test("PR20.8 one-write preparation requires fresh physical and durable fences", () => {
  const p=prep.preWriteRequirements;
  assert.equal(p.exactSessionBinding,true);
  assert.equal(p.exactServerBinding,true);
  assert.equal(p.qMustBeEmpty,true);
  assert.equal(p.hostileAggroMustBeZero,true);
  assert.equal(p.alternativeRuntimeMustBeInactive,true);
  assert.equal(p.performanceTrickMustBeActive,true);
  assert.equal(p.candidateDefinitionExact,true);
  assert.equal(p.scrollDefinitionExact,true);
  assert.equal(p.freshCandidateIndexReresolveImmediatelyBeforeSend,true);
  assert.equal(p.freshScrollIndexReresolveImmediatelyBeforeSend,true);
  assert.equal(p.stableDoubleObservationRequired,true);
  assert.equal(p.serviceReachabilityRequired,true);
  assert.equal(p.sourcePinnedSellDistance,400);
  assert.equal(p.conservativeLiveSafetyDistanceMax,300);
  assert.equal(p.offeringForbidden,true);

  const d=prep.durableTransaction;
  assert.equal(d.actionContractId,"AL-ACTION-UPGRADE");
  assert.equal(d.recoveryContractId,"AL-RECOVERY-UPGRADE");
  assert.equal(d.verifierId,"AL-VERIFIER-UPGRADE");
  assert.equal(d.durableIntentBeforePossibleSend,true);
  assert.equal(d.exactJournalReadbackRequired,true);
  assert.equal(d.currentFenceRequired,true);
  assert.equal(d.familySpecificOneShotAuthority,"Pr208UpgradeOneShotAuthority");
  assert.equal(d.oneShotMaximumUses,1);
  assert.equal(d.oneShotMaximumTtlMs,1500);
  assert.equal(d.authorityMustBeConsumedImmediatelyBeforeSend,true);
  assert.equal(d.driftRevokes,true);
  assert.equal(d.sameIntentRetry,false);
});

test("PR20.8 one-write preparation itself grants no live write", () => {
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

test("PR20.8 one-write reconciliation forbids blind retry", () => {
  const r=prep.reconciliation;
  assert.equal(r.qOrUpgradePlaceholderAcceptedInFlight,true);
  assert.equal(r.scrollConsumableDeltaAcceptedInFlight,true);
  assert.equal(r.candidateMutationAcceptedInFlight,true);
  assert.equal(r.restartNonTerminalRequiresReconciliation,true);
  assert.equal(r.unknownNeverBlindRetry,true);
  assert.equal(r.notAppliedRequiresPositiveUnchangedEvidence,true);
  assert.equal(r.committedRequiresVerifiedCandidateOrConsumableOutcome,true);
  assert.equal(
    prep.nextGate,
    "PR20_8_UPGRADE_PRODUCTIVE_ONE_WRITE_RUNNER_PACKAGE",
  );
});
