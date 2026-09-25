import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const evidence=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-exchange-anniversarygift-rescan-v1-0-7-evidence.json","utf8"
));
const contract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-anniversarygift-durable-shadow-preparation.json","utf8"
));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));
const manifest=JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json","utf8"));
const prior=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-exchange-readonly-rescan-v1-0-6-evidence.json","utf8"
));

test("v1.0.7 real-browser anniversarygift candidate evidence is exact and zero-write",()=>{
  assert.equal(evidence.status,"RATIFIED_ANNIVERSARYGIFT_EXCHANGE_CANDIDATE_ZERO_WRITE");
  assert.equal(evidence.evidenceArt,
    "V5_PR20_8_EXCHANGE_ANNIVERSARYGIFT_EXCEPTION_RESCAN_REAL_BROWSER");
  assert.equal(evidence.manifestMainCommit,
    "4e04bc6e114f0f3959c562f6ff9e0571b983b371");
  assert.equal(evidence.package.controllerVersion,"1.0.7");
  assert.equal(evidence.package.sourceCommit,
    "5ae7e2699ca38381df4e90ea385732241cfbcd55");
  assert.equal(evidence.package.sha256,
    "00e2f5ed379f27a489af1c1a87f142cd7efe7fb7617d1e814d3033563137dbf9");
  assert.equal(evidence.liveTelemetry.notificationId,2726);
  assert.equal(evidence.liveTelemetry.runStartedAtMs,1790339936235);
  assert.equal(evidence.liveTelemetry.observedAtMs,1790339936626);
  assert.equal(evidence.liveTelemetry.status,"BESTANDEN");
  assert.equal(evidence.liveTelemetry.phase,"COMPLETE");
  assert.equal(evidence.liveTelemetry.exchangeStatus,"KANDIDAT_GEFUNDEN");
  assert.equal(evidence.liveTelemetry.exchangeCandidateCount,1);
  assert.equal(evidence.liveTelemetry.selected.name,"anniversarygift");
  assert.equal(evidence.liveTelemetry.selected.observedInventoryIndex,4);
  assert.equal(evidence.liveTelemetry.selected.observedIndexCarriesAuthority,false);
  assert.equal(evidence.liveTelemetry.selected.observedQuantity,106);
  assert.equal(evidence.liveTelemetry.selected.exchangeQuantity,1);
  assert.equal(evidence.liveTelemetry.selected.baseGold,100);
  assert.deepEqual(evidence.liveTelemetry.selected.definitionFlags,{
    cash:false,event:false,quest:false,exclusive:true,
  });
  assert.equal(evidence.liveTelemetry.selected.exclusiveTestException,true);
  assert.equal(evidence.liveTelemetry.selected.normalPathOnly,true);
  assert.equal(evidence.liveTelemetry.selected.massExchangeAllowed,false);
  assert.equal(evidence.liveTelemetry.selected.recursiveDropAuthority,false);
  assert.equal(evidence.liveTelemetry.selected.specialMultiOutputAuthority,false);
  assert.equal(evidence.liveTelemetry.gameplayWrites,0);
  assert.equal(evidence.liveTelemetry.publicFunctionCalls,0);
  assert.equal(evidence.liveTelemetry.rawWriteCalls,0);
  assert.equal(evidence.liveTelemetry.sameIntentRetry,false);
  assert.equal(evidence.safetyBoundary.exchangeRatification,false);
  assert.equal(evidence.safetyBoundary.exchangeWriteAuthority,false);
  assert.equal(evidence.safetyBoundary.normalRuntimeAllowed,false);
});

test("anniversarygift shadow preparation is exact no-send and authority closed",()=>{
  assert.equal(contract.status,"PREPARED_NO_WRITE");
  assert.equal(contract.prerequisite.notificationId,2726);
  assert.equal(contract.prerequisite.exactItem,"anniversarygift");
  assert.equal(contract.prerequisite.observedQuantity,106);
  assert.equal(contract.prerequisite.requiredExchangeQuantity,1);
  assert.equal(contract.prerequisite.observedInventoryIndexCarriesAuthority,false);
  assert.deepEqual(contract.exactDefinition,{
    name:"anniversarygift",
    type:"gem",
    skin:"anniversarygift",
    displayName:"Anniversary Gift",
    explanation:"Ten years, tied with a ribbon.",
    stackLimit:9999,
    baseGold:100,
    exchangeQuantity:1,
    exclusive:true,
    cash:false,
    event:false,
    quest:false,
    accent:"#3DB5A5",
  });
  assert.equal(contract.admission.qFreeRequired,true);
  assert.equal(contract.admission.stableDoubleObservationRequired,true);
  assert.equal(contract.admission.exactPhysicalCandidateReresolutionRequired,true);
  assert.equal(contract.durableShadow.storage,"LOCAL_STORAGE_SHADOW_ONLY");
  assert.equal(contract.durableShadow.journalTerminalArt,"ABBRUCH");
  assert.equal(contract.durableShadow.sendBoundaryState,"NICHT_GESENDET");
  assert.equal(contract.durableShadow.recoveryRewritesIntent,false);
  assert.equal(contract.durableShadow.sameIntentRetry,false);
  assert.equal(contract.durableShadow.observedIndexCarriesFutureSendAuthority,false);
  assert.equal(contract.durableShadow.freshReresolutionRequiredBeforeFutureSend,true);
  assert.equal(contract.durableShadow.fullRewardDomainProofRequiredBeforeFutureSend,true);
  assert.equal(contract.oneShotPreparation.bindingPrepared,true);
  assert.equal(contract.oneShotPreparation.maximumUses,1);
  assert.equal(contract.oneShotPreparation.exchangeAuthorityIssued,false);
  assert.equal(contract.authorityBoundary.authorityIssued,false);
  assert.equal(contract.authorityBoundary.exchangeAuthority,false);
  assert.equal(contract.authorityBoundary.gameplayAuthority,false);
  assert.equal(contract.authorityBoundary.rawWriteAuthority,false);
  assert.equal(contract.authorityBoundary.gameplayWrites,0);
  assert.equal(contract.authorityBoundary.publicFunctionCalls,0);
  assert.equal(contract.authorityBoundary.rawWriteCalls,0);
  assert.equal(contract.authorityBoundary.normalRuntimeAllowed,false);
  assert.equal(contract.deployment.autonomousManifestChanged,false);
  assert.equal(contract.deployment.manifestCutoverPrepared,false);
  assert.equal(contract.deployment.deployed,false);
  assert.equal(contract.evidenceSeparation.productiveOneWriteStillRequired,true);
  assert.equal(contract.evidenceSeparation.fiveMinuteObservationStillRequired,true);
  assert.equal(contract.evidenceSeparation.autonomyProofStillRequired,true);
});

test("shadow package bytes are exact at the pinned source commit",()=>{
  const path=contract.package.path.replace(/^v5\//,"");
  const checkedIn=fs.readFileSync(path);
  assert.equal(checkedIn.length,contract.package.bytes);
  assert.equal(
    crypto.createHash("sha256").update(checkedIn).digest("hex"),
    contract.package.sha256,
  );
  const pinned=execFileSync("git",[
    "show",contract.package.sourceCommit+":"+contract.package.path,
  ],{encoding:null,maxBuffer:256*1024});
  assert.deepEqual(pinned,checkedIn);
});

test("roadmap ratifies scanner evidence but only prepares the no-write shadow",()=>{
  const a=roadmap.pr20_8.exchangeCandidateAcquisition;
  assert.equal(roadmap.pr20_8.status,
    "EXCHANGE_ANNIVERSARYGIFT_SERVICE_REPOSITION_MANIFEST_CUTOVER_PREPARED");
  assert.equal(roadmap.pr20_8.nextAction,
    "DEPLOY_AND_OBSERVE_EXCHANGE_SERVICE_REPOSITION");
  assert.equal(a.anniversaryGiftExceptionRescan.status,
    "RATIFIED_ANNIVERSARYGIFT_EXCHANGE_CANDIDATE_ZERO_WRITE");
  assert.equal(a.anniversaryGiftExceptionRescan.deployed,true);
  assert.equal(a.anniversaryGiftExceptionRescan.evidenceObserved,true);
  assert.equal(a.anniversaryGiftExceptionRescan.notificationId,2726);
  assert.equal(a.anniversaryGiftExchangeShadow.status,"RATIFIED_LIVE_DURABLE_SHADOW_NO_SEND");
  assert.equal(a.anniversaryGiftExchangeShadow.manifestCutoverPrepared,true);
  assert.equal(a.anniversaryGiftExchangeShadow.deployed,true);
  assert.equal(a.anniversaryGiftExchangeShadow.liveEvidenceObserved,true);
  assert.equal(a.anniversaryGiftExchangeShadow.exchangeAuthority,false);
  assert.equal(a.anniversaryGiftExchangeShadow.normalRuntimeAllowed,false);
  assert.equal(a.seashellFarmShadow.activePath,false);
});

test("active manifest has advanced to the anniversarygift service reposition runner",()=>{
  assert.equal(manifest.testId,
    "pr20-8-exchange-anniversarygift-service-reposition");
  assert.equal(manifest.controllerVersion,"1.0.0");
  assert.equal(manifest.sourceCommit,
    "d7f48070228e1bb620beb39717655287defc4e6f");
  assert.equal(manifest.packagePath,
    "v5/werkzeuge/pr20-8-exchange-anniversarygift-service-reposition-v1-0-0.js");
  assert.equal(manifest.packageSha256,
    "21121e5a8465848732b415dc05451935a7679dd33d23a7c42996c2f4456f54f7");
  assert.equal(manifest.expectedGlobal,
    "V5PR208ExchangeAnniversarygiftServiceReposition");
  assert.equal(manifest.normalRuntimeAllowed,false);
});

test("historical v1.0.6 no-candidate evidence remains unchanged",()=>{
  assert.equal(prior.status,"RATIFIED_FRESH_NO_CANDIDATE_ZERO_WRITE");
  assert.equal(prior.package.controllerVersion,"1.0.6");
  assert.equal(prior.package.sourceCommit,
    "a5fd67cc9c587b2a20b163915936717c7b4e8321");
  assert.deepEqual(prior.observations.exchange.rejected,[
    {name:"anniversarygift",index:4,reason:"UNSAFE_PHYSICAL_ITEM"},
  ]);
});
