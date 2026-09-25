import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const evidence=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-upgrade-durable-shadow-evidence.json","utf8"
));
const manifest=JSON.parse(fs.readFileSync(
  "roadmap/v5-autonomous-test-manifest.json","utf8"
));

test("PR20.8 real browser Upgrade durable shadow is terminal BESTANDEN and no-write", () => {
  assert.equal(evidence.status,"BESTANDEN_REAL_BROWSER_DURABLE_SHADOW_NO_WRITE");
  assert.equal(evidence.ratified,true);
  assert.equal(evidence.telemetryBatchId,8244);
  assert.equal(evidence.supportingTelemetryBatchId,8243);
  assert.equal(evidence.testId,"pr20-8-upgrade-durable-shadow-no-write");
  assert.equal(evidence.observedControllerVersion,"1.0.0");
  assert.equal(evidence.observedPackageSourceCommit,
    "72a0a2c65fff19327d3137356c9e079bf5117203");
  assert.equal(evidence.observedPackageSha256,
    "5490c8b17a956f469b71e2e99c18897f3ffb1f67e00e36c64eb41a30d46498b9");
  assert.equal(evidence.result.status,"BESTANDEN");
  assert.equal(evidence.result.phase,"COMPLETE");
  assert.equal(evidence.result.terminal,true);
  assert.deepEqual(evidence.result.blocker,[]);
  assert.equal(evidence.result.gameplayWrites,0);
  assert.equal(evidence.result.publicFunctionCalls,0);
  assert.equal(evidence.result.rawWriteCalls,0);
  assert.equal(evidence.result.authorityIssued,false);
  assert.equal(evidence.result.upgradeAuthority,false);
  assert.equal(evidence.result.gameplayAuthority,false);
  assert.equal(evidence.result.rawWriteAuthority,false);
  assert.equal(evidence.result.sameIntentRetry,false);
  assert.equal(evidence.result.normalRuntimeAllowed,false);
});

test("PR20.8 Upgrade shadow evidence binds exact fresh candidate, scroll and service", () => {
  assert.deepEqual(evidence.result.recipient,{
    characterName:"My_Merchant",
    sessionId:"My_Merchant",
    ctype:"merchant",
    level:58,
    map:"main",
    serverRegion:"EU",
    serverIdentifier:"I",
  });
  assert.equal(evidence.result.candidate.name,"gloves");
  assert.equal(evidence.result.candidate.level,0);
  assert.equal(evidence.result.candidate.inventoryIndex,6);
  assert.equal(evidence.result.candidate.baseGold,3400);
  assert.equal(evidence.result.candidate.matchingCandidateCount,2);
  assert.equal(evidence.result.scroll.name,"scroll0");
  assert.equal(evidence.result.scroll.inventoryIndex,14);
  assert.equal(evidence.result.scroll.observedQuantity,36);
  assert.equal(evidence.result.scroll.consumeQuantity,1);
  assert.equal(evidence.result.offering,null);
  assert.equal(evidence.result.normalPathOnly,true);
  assert.equal(evidence.result.serviceReachability.reachable,true);
  assert.ok(evidence.result.serviceReachability.distance < 300);
  assert.equal(evidence.result.serviceReachability.safetyLimit,300);
  assert.equal(evidence.result.serviceReachability.serverLimit,400);
  assert.equal(evidence.result.serviceReachability.viaComputer,false);
  assert.equal(evidence.result.publicFunctionAvailable,true);
});

test("PR20.8 Upgrade shadow evidence proves durable no-send reconciliation", () => {
  assert.equal(evidence.result.stableDoubleObservation,true);
  assert.equal(evidence.result.stablePostIntentReobserve,true);
  assert.equal(evidence.result.durableIntentCreatedShadowOnly,true);
  assert.equal(evidence.result.durableReadback,true);
  assert.equal(evidence.result.journalTerminalArt,"ABBRUCH");
  assert.equal(evidence.result.sendBoundaryState,"NICHT_GESENDET");
  assert.equal(evidence.result.reconciliationClassification,"NOT_APPLIED");
  assert.equal(evidence.result.oneShotMaximumUses,1);
  assert.equal(evidence.result.oneShotUpgradeAuthorityIssued,false);
  assert.equal(evidence.result.freshReresolutionRequiredBeforeFutureSend,true);
  assert.equal(
    evidence.fingerprints.prestateFingerprintSha256,
    evidence.fingerprints.postIntentPrestateFingerprintSha256,
  );
  assert.equal(evidence.result.performanceTrick.active,true);
  assert.equal(evidence.result.performanceTrick.verification,"HOWLER_PLAYING_TRUE");
});

test("current recovery hardening evidence stays immutable while the manifest advances to Exchange bank mount", () => {
  assert.equal(evidence.currentRecoveryControllerVersion,"1.0.1");
  assert.equal(evidence.currentRecoverySourceCommit,
    "6d611de7fadf7a5cb3945ec25f3bc761acb14e3c");
  assert.equal(evidence.currentRecoveryPackageSha256,
    "7703cff2fa837c19c1febffc064c44084494effa142c3e0fb560feec1af5a9ff");
  assert.equal(evidence.safetyBoundary.currentRecoveryPackageMayOnlyRecoverExactTerminalNoWriteIntent,true);
  assert.equal(evidence.safetyBoundary.recoveryMayNotRewriteIntent,true);
  assert.equal(evidence.safetyBoundary.recoveryMayNotCreateGameplayWrite,true);
  assert.equal(manifest.testId,"pr20-8-exchange-market-discovery");
  assert.equal(manifest.controllerVersion,"1.0.0");
  assert.equal(manifest.sourceCommit,"d977684f56ebe24f021cd46ae7efc502c406ecc6");
  assert.equal(manifest.packagePath,"v5/werkzeuge/pr20-8-exchange-market-discovery-v1-0-0.js");
  assert.equal(manifest.packageSha256,"175adb93980af0e7cefe19835101255473031ac51bcc70369e5a4b7d521609cd");
  assert.equal(manifest.expectedGlobal,"V5PR208ExchangeMarketDiscovery");
  assert.notEqual(manifest.testId,evidence.testId);
  assert.equal(manifest.normalRuntimeAllowed,false);
});

test("PR20.8 Upgrade shadow evidence advances only to one-write preparation", () => {
  assert.equal(evidence.safetyBoundary.noGameplayMutationObserved,true);
  assert.equal(evidence.safetyBoundary.observedPhysicalIndexesCarryFutureWriteAuthority,false);
  assert.equal(evidence.safetyBoundary.freshReresolutionBeforeAnyFutureSendRequired,true);
  assert.equal(evidence.nextGate,"PR20_8_UPGRADE_PRODUCTIVE_ONE_WRITE_PREPARATION");
});
