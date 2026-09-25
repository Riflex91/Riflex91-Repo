import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

const contract=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-anniversarygift-autonomy-route-shadow-preparation.json",
  "utf8",
));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));
const packagePath="werkzeuge/pr20-8-exchange-anniversarygift-autonomy-route-shadow-no-write-v1-0-0.js";
const packageBytes=fs.readFileSync(packagePath);
const packageSource=packageBytes.toString("utf8");

test("PR20.8 anniversarygift autonomy shadow package is exact pinned zero-write",()=>{
  assert.equal(contract.status,"MANIFEST_CUTOVER_PREPARED_NO_WRITE");
  assert.equal(
    contract.purpose,
    "PROVE_FRESH_AUTONOMOUS_ANNIVERSARYGIFT_EXCHANGE_ROUTE_ADMISSION_WITHOUT_AUTHORITY_OR_SEND",
  );
  const b=contract.packageBoundary;
  assert.equal(b.testId,"pr20-8-exchange-anniversarygift-autonomy-route-shadow-no-write");
  assert.equal(b.controllerVersion,"1.0.0");
  assert.equal(b.expectedGlobal,"V5PR208ExchangeAnniversarygiftAutonomyRouteShadowNoWrite");
  assert.equal(b.sourceCommit,"578b18dfa96fd7c4809d55aae4664eae5f37eb43");
  assert.equal(
    b.packageSha256,
    "39084a646825c6bca6231b0968e41cebfbbf3548e8a93bba155dcb64b2fbf2be",
  );
  assert.equal(b.packageBytes,32638);
  assert.equal(packageBytes.length,b.packageBytes);
  assert.equal(
    crypto.createHash("sha256").update(packageBytes).digest("hex"),
    b.packageSha256,
  );
  assert.equal(b.exchangeCallSites,0);
  assert.equal(b.maximumGameplayWrites,0);
  assert.equal(b.maximumPublicFunctionCalls,0);
  assert.equal(b.maximumRawWriteCalls,0);
  assert.equal(b.exchangeAuthority,false);
  assert.equal(b.gameplayAuthority,false);
  assert.equal(b.rawWriteAuthority,false);
  assert.equal(b.movementAuthority,false);
  assert.equal(b.normalRuntimeAllowed,false);
  assert.equal(b.manifestCutoverPrepared,true);
  assert.equal(b.deployed,false);
});

test("autonomy route requires fresh current selection and no manual pinned index",()=>{
  const a=contract.routeAdmission;
  assert.equal(a.selectionMode,"AUTONOMOUS_FRESH_CURRENT_INVENTORY_SCAN");
  assert.equal(a.manualPinnedInventoryIndexForbidden,true);
  assert.equal(a.historicalObservedIndexCarriesAuthority,false);
  assert.equal(a.exactItem,"anniversarygift");
  assert.equal(a.exchangeQuantity,1);
  assert.equal(a.exclusiveExceptionOnlyForExactItem,true);
  assert.equal(a.genericExclusivePolicyRelaxationForbidden,true);
  assert.equal(a.exactSingleEligibleCandidateRequired,true);
  assert.equal(a.stableDoubleObservationRequired,true);
  assert.equal(a.minimumEmptyInventorySlots,1);
  assert.equal(a.conservativeServiceDistanceMax,300);
  assert.equal(a.massExchangeForbidden,true);
  assert.equal(a.massExchangePpForbidden,true);
  assert.equal(contract.prerequisites.live5mNotificationId,2986);
  assert.equal(contract.prerequisites.priorTransactionMayNotGrantNewAuthority,true);
});

test("durable autonomy decision remains terminal no-send shadow only",()=>{
  const d=contract.durableDecision;
  assert.equal(d.required,true);
  assert.equal(d.storage,"LOCAL_STORAGE_SHADOW_ONLY");
  assert.equal(d.exactReadbackRequired,true);
  assert.equal(d.terminal,true);
  assert.equal(d.terminalArt,"ABBRUCH");
  assert.equal(d.sendBoundaryState,"NICHT_GESENDET");
  assert.equal(d.sameIntentRetry,false);
  assert.equal(d.candidateIndexObservedOnly,true);
  assert.equal(d.candidateIndexCarriesAuthority,false);
  assert.equal(d.freshReresolutionRequiredBeforeFutureProductiveSend,true);
  assert.equal(d.recoveryOfExactExistingTerminalDecisionAllowed,true);
  assert.equal(d.recoveryRewritesDecision,false);
});

test("runner source exposes no mutation surface",()=>{
  assert.ok(packageSource.includes(
    "selectionMode:'AUTONOMOUS_FRESH_CURRENT_INVENTORY_SCAN'",
  ));
  assert.ok(packageSource.includes("manualPinnedInventoryIndex:false"));
  assert.ok(packageSource.includes("exchangeAuthority:false"));
  for(const marker of [
    "globalThis.exchange(",
    "parent.exchange(",
    ".exchange(",
    "socket.emit(",
    ".socket.emit(",
    "api_call(",
    "smart_move(",
    "move(",
    "upgrade(",
    "compound(",
    "buy(",
    "trade_buy(",
    "bank_retrieve(",
    "bank_store(",
    "send_item(",
    "send_gold(",
  ]) assert.equal(packageSource.includes(marker),false,marker);
});

test("roadmap advances only to shadow manifest cutover and leaves productive autonomy blocked",()=>{
  const p=roadmap.pr20_8;
  assert.equal(
    p.status,
    "EXCHANGE_ANNIVERSARYGIFT_AUTONOMY_ROUTE_SHADOW_START_RECOVERY_MANIFEST_CUTOVER_PREPARED_NO_WRITE",
  );
  assert.equal(
    p.nextAction,
    "DEPLOY_AND_OBSERVE_ANNIVERSARYGIFT_EXCHANGE_AUTONOMY_ROUTE_SHADOW_START_RECOVERY_V1_0_1",
  );
  assert.equal(
    p.remainingGates.normalExchange,
    "PRODUCTIVE_ONE_WRITE_COMMITTED_SUCCESS_RATIFIED_LIVE_5M_RATIFIED_AUTONOMY_PENDING",
  );
  const s=p.exchangeCandidateAcquisition.anniversaryGiftExchangeAutonomyRouteShadow;
  assert.equal(s.status,"MANIFEST_CUTOVER_PREPARED_NO_WRITE");
  assert.equal(s.testId,"pr20-8-exchange-anniversarygift-autonomy-route-shadow-no-write");
  assert.equal(s.selectionMode,"AUTONOMOUS_FRESH_CURRENT_INVENTORY_SCAN");
  assert.equal(s.manualPinnedInventoryIndex,false);
  assert.equal(s.maximumGameplayWrites,0);
  assert.equal(s.maximumPublicFunctionCalls,0);
  assert.equal(s.maximumRawWriteCalls,0);
  assert.equal(s.exchangeAuthority,false);
  assert.equal(s.manifestCutoverPrepared,true);
  assert.equal(s.deployed,false);
  assert.equal(s.liveEvidenceObserved,false);
  assert.equal(s.productiveAutonomyProven,false);
  assert.equal(p.exitGateReview.exchangeAutonomyProductiveProven,false);
  assert.equal(p.exitGateReview.currentExitGateSatisfied,false);
  assert.equal(p.exitGateReview.mayAdvanceToPr20_9,false);
});
