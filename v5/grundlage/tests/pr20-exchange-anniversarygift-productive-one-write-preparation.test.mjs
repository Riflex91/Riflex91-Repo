import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const reward=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-exchange-anniversarygift-reward-domain-evidence.json","utf8"
));
const contract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-anniversarygift-productive-one-write-preparation.json","utf8"
));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));
const manifest=JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json","utf8"));
const shadow=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-anniversarygift-durable-shadow-preparation.json","utf8"
));

test("anniversarygift reward graph is scoped, bounded and exact",()=>{
  assert.equal(reward.status,"RATIFIED_SCOPED_CURRENT_SOURCE_REVALIDATION");
  assert.equal(reward.scope,"ANNIVERSARYGIFT_EXCHANGE_ONLY");
  assert.equal(reward.historicalGlobalV5SourceSnapshotPreserved,true);
  assert.equal(reward.historicalGlobalV5SourceSnapshotCommit,
    "ddcf7222c3264f1404382e1ff5dea8e73f6cb4b4");
  assert.equal(reward.officialSource.repository,"kaansoral/adventureland_mongodb");
  assert.equal(reward.officialSource.commit,
    "90052162eb3ebda36c893e1eb4af643913c8f984");
  assert.deepEqual(reward.officialSource.files,{
    drops:{path:"design/drops.js",blobSha:"cb9af901090eed78dd7ff5ae915874a9557409c4"},
    server:{path:"node/server.js",blobSha:"40d0aeda16b9a4320441e833020fe1b4db496e2c"},
    runner:{path:"js/runner_functions.js",blobSha:"8b40ac9931a48995cd179fa4cb6b3057df677b02"},
    items:{path:"design/items.js",blobSha:"ca41b524c8bd795db40836525f7efd9626982c70"},
    serverFunctions:{path:"node/server_functions.js",blobSha:"650797b87de128e85b2d01d574d5321a7144bef7"},
    maps:{path:"design/maps.js",blobSha:"78350dac1a18c4eb0e7c6f545ebf08bb3d6729e4"},
  });
  assert.equal(reward.graph.canonicalSha256,
    "2fad9b50ac0bb87a8e53a0cff8f6e34ded949b3531f8843f86d3f1fb8e828342");
  assert.equal(reward.graph.bounded,true);
  assert.equal(reward.graph.recursiveBranchesBounded,true);
  assert.equal(reward.graph.recursiveCycle,false);
  assert.equal(reward.graph.specialSixcakeMultiOutputApplies,false);
  assert.equal(reward.graph.conservativeInventoryOutputsComplete,true);
  assert.equal(reward.graph.outputspaceClass,"PROBABILISTIC_BOUNDED_OUTPUT");
  assert.deepEqual(reward.graph.rewardDomains,["gold","inventory","empty"]);
  assert.equal(reward.graph.maximumPhysicalOutputsPerExchange,1);
  assert.deepEqual(reward.graph.cxjarAllowedData,["makeawish","ikissyou"]);
  assert.deepEqual(reward.graph.goldOutputs,[5000,20000]);
  assert.ok(reward.graph.physicalOutputNames.includes("cake"));
  assert.ok(reward.graph.physicalOutputNames.includes("keepsakependant"));
  assert.ok(reward.graph.physicalOutputNames.includes("cxjar"));
});

test("source proof establishes exactly one pre-send empty slot for the live stack",()=>{
  assert.equal(reward.workspaceConclusion.observedLiveInputQuantity,106);
  assert.equal(reward.workspaceConclusion.exchangeQuantity,1);
  assert.equal(reward.workspaceConclusion.stackRemainsAfterConsume,true);
  assert.equal(reward.workspaceConclusion.minimumEmptyInventorySlotsBeforeSend,1);
  assert.equal(reward.workspaceConclusion.maximumPhysicalRewardSlotsNeededAfterPlaceholderClear,1);
  assert.equal(reward.workspaceConclusion.conservativePreSendEmptySlotsRequired,1);
  assert.equal(reward.serverSemantics.stackedInputRequiresPreexistingEmptySlot,true);
  assert.equal(reward.serverSemantics.consumesDefinitionExchangeQuantityBeforePlaceholder,true);
  assert.equal(reward.serverSemantics.placeholderCreatedAfterConsume,true);
  assert.equal(reward.serverSemantics.placeholderClearedBeforeRewardGeneration,true);
  assert.equal(reward.serverSemantics.rewardGeneratedOnlyAfterPlaceholderClear,true);
  assert.deepEqual(reward.serverSemantics.exchangeServicePoint,{map:"main",x:-25,y:-478});
});

test("one-write preparation consumes the live shadow proof but remains not deployed",()=>{
  assert.equal(contract.status,"RUNNER_PREPARED_NOT_DEPLOYED");
  assert.equal(contract.prerequisites.shadowLiveNotificationId,2752);
  assert.equal(contract.prerequisites.shadowLiveStatus,"BESTANDEN");
  assert.equal(contract.prerequisites.shadowLivePhase,"COMPLETE");
  assert.equal(contract.prerequisites.shadowRecoveredExistingTerminal,true);
  assert.equal(contract.prerequisites.shadowSendBoundaryState,"NICHT_GESENDET");
  assert.equal(contract.prerequisites.shadowGameplayWrites,0);
  assert.equal(contract.prerequisites.shadowPublicFunctionCalls,0);
  assert.equal(contract.prerequisites.shadowRawWriteCalls,0);
  assert.equal(contract.scopedSourcePin.commit,
    "90052162eb3ebda36c893e1eb4af643913c8f984");
  assert.equal(contract.scopedSourcePin.dropGraphSha256,
    "2fad9b50ac0bb87a8e53a0cff8f6e34ded949b3531f8843f86d3f1fb8e828342");
  assert.equal(contract.scopedSourcePin.doesNotReplaceHistoricalGlobalSnapshot,true);
  assert.equal(contract.exactInput.name,"anniversarygift");
  assert.equal(contract.exactInput.definitionExchangeQuantity,1);
  assert.equal(contract.exactInput.observedShadowQuantity,106);
  assert.equal(contract.exactInput.observedShadowInventoryIndex,4);
  assert.equal(contract.exactInput.observedIndexCarriesSendAuthority,false);
  assert.equal(contract.preSendAdmission.minimumEmptyInventorySlots,1);
  assert.equal(contract.preSendAdmission.currentEsizeMustBeAtLeast,1);
  assert.equal(contract.preSendAdmission.exactPhysicalInputReresolutionRequired,true);
  assert.equal(contract.preSendAdmission.stableDoubleObservationRequired,true);
  assert.equal(contract.preSendAdmission.massExchangeConditionForbidden,true);
  assert.equal(contract.preSendAdmission.massExchangePpConditionForbidden,true);
});

test("one-write authority is bounded to one public exchange call and no raw write",()=>{
  assert.equal(contract.durableIntentAndAuthority.authorityClass,
    "Pr208AnniversaryGiftExchangeOneShotAuthority");
  assert.equal(contract.durableIntentAndAuthority.maximumUses,1);
  assert.equal(contract.durableIntentAndAuthority.maximumPublicFunctionCalls,1);
  assert.equal(contract.durableIntentAndAuthority.maximumGameplayWrites,1);
  assert.equal(contract.durableIntentAndAuthority.maximumRawWriteCalls,0);
  assert.equal(contract.durableIntentAndAuthority.sameIntentRetry,false);
  assert.equal(contract.sendBoundary.publicFunction,"exchange");
  assert.equal(contract.sendBoundary.publicFunctionCallsExactlyOneIfSent,true);
  assert.equal(contract.sendBoundary.rawSocketEmitForbidden,true);
  assert.equal(contract.sendBoundary.rawApiCallForbidden,true);
  assert.equal(contract.sendBoundary.exactFreshInventoryIndexOnly,true);
  assert.equal(contract.reconciliation.promiseRewardSupportingOnly,true);
  assert.equal(contract.reconciliation.fullRewardDomainReconciliationRequired,true);
  assert.equal(contract.reconciliation.inputQuantityMustDecreaseExactlyBy,1);
  assert.equal(contract.reconciliation.maximumPhysicalOutputCount,1);
  assert.equal(contract.reconciliation.unknownOutcomeBlindRetryForbidden,true);
  assert.equal(contract.authorityBoundary.exchangeAuthority,false);
  assert.equal(contract.authorityBoundary.gameplayAuthority,false);
  assert.equal(contract.authorityBoundary.rawWriteAuthority,false);
  assert.equal(contract.authorityBoundary.normalExchangeWriteRatification,false);
  assert.equal(contract.authorityBoundary.deploymentChanged,false);
  assert.equal(contract.authorityBoundary.autonomousManifestChanged,false);
});

test("runner bytes and source commit are exact",()=>{
  assert.equal(contract.runner.testId,
    "pr20-8-exchange-anniversarygift-productive-one-write-live");
  assert.equal(contract.runner.controllerVersion,"1.0.0");
  assert.equal(contract.runner.sourceCommit,
    "5c43c182e2cd2b9ef4361ce1699af00748ad0d95");
  assert.equal(contract.runner.sha256,
    "eb7cc9760966ddf7026cdc200e373c8716c80126ce6b2651aba8fd4e0420ef74");
  assert.equal(contract.runner.bytes,50047);
  assert.equal(contract.runner.expectedGlobal,
    "V5PR208ExchangeAnniversarygiftProductiveOneWriteLive");
  assert.equal(contract.runner.maximumGameplayWrites,1);
  assert.equal(contract.runner.maximumPublicFunctionCalls,1);
  assert.equal(contract.runner.maximumRawWriteCalls,0);
  assert.equal(contract.runner.sameIntentRetry,false);
  assert.equal(contract.runner.autonomousManifestChanged,false);
  assert.equal(contract.runner.deployed,false);

  const localPath=contract.runner.path.replace(/^v5\//,"");
  const bytes=fs.readFileSync(localPath);
  assert.equal(bytes.length,contract.runner.bytes);
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    contract.runner.sha256,
  );
  const pinned=execFileSync("git",[
    "show",contract.runner.sourceCommit+":"+contract.runner.path,
  ],{encoding:null,maxBuffer:256*1024});
  assert.deepEqual(pinned,bytes);
});

test("roadmap advances only to manifest-cutover preparation",()=>{
  const a=roadmap.pr20_8.exchangeCandidateAcquisition;
  const live=a.anniversaryGiftProductiveOneWrite;
  assert.equal(roadmap.pr20_8.status,
    "EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_ROUTE_SHADOW_PACKAGE_PREPARED_NO_WRITE");
  assert.equal(roadmap.pr20_8.nextAction,
    "PREPARE_ANNIVERSARYGIFT_EXCHANGE_AUTONOMY_ROUTE_SHADOW_MANIFEST_CUTOVER");
  assert.equal(a.status,"ANNIVERSARYGIFT_AUTONOMY_ROUTE_SHADOW_PACKAGE_PREPARED_NO_WRITE");
  assert.equal(a.anniversaryGiftExchangeShadow.status,
    "RATIFIED_LIVE_DURABLE_SHADOW_NO_SEND");
  assert.equal(a.anniversaryGiftExchangeShadow.deployed,true);
  assert.equal(a.anniversaryGiftExchangeShadow.liveEvidenceObserved,true);
  assert.equal(a.anniversaryGiftExchangeShadow.latestNotificationId,2752);
  assert.equal(a.anniversaryGiftRewardDomain.status,
    "RATIFIED_SCOPED_CURRENT_SOURCE_REVALIDATION");
  assert.equal(live.status,"RATIFIED_COMMITTED_EXCHANGE_ONE_WRITE");
  assert.equal(live.manifestCutoverPrepared,true);
  assert.equal(live.deployed,true);
  assert.equal(live.liveEvidenceObserved,true);
  assert.equal(live.exchangeAuthority,false);
  assert.equal(live.gameplayAuthority,false);
  assert.equal(live.rawWriteAuthority,false);
  assert.equal(live.normalRuntimeAllowed,false);
});

test("active autonomous manifest is advanced to the Exchange 5m observer",()=>{
  assert.equal(manifest.testId,
    "pr20-8-exchange-anniversarygift-live-5m");
  assert.equal(manifest.controllerVersion,"1.0.0");
  assert.equal(manifest.sourceCommit,
    "859c5be1067fbd5360c17ccfe0d912a98537bfc9");
  assert.equal(manifest.packageSha256,
    "455593d7691dc5436af27a5b89afb5fc208f2ebca4253aa87d0726821abcda94");
  assert.equal(manifest.expectedGlobal,
    "V5PR208ExchangeAnniversarygiftLive5m");
  assert.equal(manifest.normalRuntimeAllowed,false);
  assert.equal(shadow.status,"PREPARED_NO_WRITE");
});
