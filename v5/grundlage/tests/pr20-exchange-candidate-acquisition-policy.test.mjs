import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const policy=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-exchange-candidate-acquisition.json","utf8"
));
const roadmap=JSON.parse(fs.readFileSync("roadmap/post-r19-roadmap.json","utf8"));
const historical=JSON.parse(fs.readFileSync(
  "roadmap/pr20-8-exchange-no-candidate-closeout-review.json","utf8"
));

test("controlled acquisition supersedes waiting policy without rewriting historical evidence",()=>{
  assert.equal(policy.status,"DISCOVERY_PREPARED_BANK_ACQUISITION_CONDITIONALLY_ALLOWED");
  assert.equal(policy.supersedesDecisionOnly,"REMAIN_BLOCKED_WAIT_FOR_FUTURE_READONLY_RESCAN");
  assert.equal(policy.preservesHistoricalNoCandidateEvidence,true);

  assert.equal(
    historical.safeDecision.acquisitionOrMutationToCreateCandidateAllowed,
    false,
  );
  assert.equal(historical.safeDecision.bankMutationToCreateCandidateAllowed,false);
  assert.equal(historical.nextAction,"REMAIN_BLOCKED_WAIT_FOR_FUTURE_READONLY_RESCAN");

  assert.equal(
    roadmap.pr20_8.status,
    "EXCHANGE_ACQUISITION_DISCOVERY_MANIFEST_CUTOVER_PREPARED",
  );
  assert.equal(
    roadmap.pr20_8.nextAction,
    "DEPLOY_EXCHANGE_ACQUISITION_DISCOVERY_READ_ONLY",
  );
});

test("bank is the only acquisition mutation class enabled by the new policy",()=>{
  assert.equal(policy.bank.controlledMutationMayCreateCandidate,true);
  assert.equal(policy.bank.oneShotBankRetrieveRequired,true);
  assert.equal(policy.bank.durableIntentBeforePossibleSendRequired,true);
  assert.equal(policy.bank.currentFenceRequired,true);
  assert.equal(policy.bank.bankLeaseRequired,true);
  assert.equal(policy.bank.finalFreshCandidateReresolutionRequired,true);
  assert.equal(policy.bank.maximumGameplayWrites,1);
  assert.equal(policy.bank.maximumPublicFunctionCalls,1);
  assert.equal(policy.bank.maximumRawWriteCalls,0);
  assert.equal(policy.bank.sameIntentRetry,false);
  assert.equal(policy.buy.allowedNow,false);
  assert.equal(policy.farm.allowedNow,false);

  const r=roadmap.pr20_8.exchangeCandidateAcquisition;
  assert.equal(r.controlledBankMutationToCreateCandidateAllowed,true);
  assert.equal(r.buyToCreateCandidateAllowed,false);
  assert.equal(r.farmToCreateCandidateAllowed,false);
});

test("acquisition remains strictly separate from Exchange ratification",()=>{
  assert.equal(policy.separation.acquisitionDoesNotCountAsExchangeRatification,true);
  assert.equal(policy.separation.acquisitionDoesNotCountAsExchange5mEvidence,true);
  assert.equal(policy.separation.acquisitionDoesNotCountAsExchangeAutonomyProof,true);
  assert.equal(policy.separation.existingExchangeScannerMustRunFreshAfterAcquisition,true);
  assert.equal(policy.separation.exchangeWriteAuthorityRemainsFalse,true);
  assert.equal(policy.separation.normalRuntimeAllowed,false);

  const r=roadmap.pr20_8.exchangeCandidateAcquisition;
  assert.equal(r.acquisitionCountsAsExchangeRatification,false);
  assert.equal(r.freshExistingScannerRequiredAfterAcquisition,true);
  assert.equal(r.exchangeWriteAuthority,false);
  assert.equal(r.normalRuntimeAllowed,false);
  assert.equal(r.manifestCutoverPrepared,true);
  assert.equal(r.sourceCommit,"3182b137957416b253dde303bbba54dd800f8b14");
  assert.equal(r.packageSha256,"1acc8253cef6b02b33a6a5de289ce5a7095066d36bc727f9cffa77647e8778ec");
  assert.equal(r.packageBytes,12605);
  assert.equal(r.deployed,false);
  assert.equal(r.evidenceObserved,false);
});

test("read-only discovery package is pinned as zero-write preparation",()=>{
  const r=roadmap.pr20_8.exchangeCandidateAcquisition;
  assert.equal(r.testId,"pr20-8-exchange-candidate-acquisition-readonly");
  assert.equal(r.controllerVersion,"1.0.1");
  assert.equal(r.expectedGlobal,"V5PR208ExchangeCandidateAcquisitionReadonly");
  assert.equal(r.maximumDiscoveryGameplayWrites,0);
  assert.equal(r.maximumDiscoveryPublicFunctionCalls,0);
  assert.equal(r.maximumDiscoveryRawWriteCalls,0);
  assert.equal(r.inventoryCandidateAction,"RUN_EXISTING_EXCHANGE_SCANNER");
  assert.equal(r.bankCandidateAction,"PREPARE_EXACT_BANK_RETRIEVE_ONE_SHOT");
  assert.equal(r.missingBankSnapshotAction,"ACQUIRE_FRESH_BANK_SNAPSHOT_READ_ONLY");
  assert.equal(r.noInventoryOrBankCandidateAction,"PREPARE_BUY_OR_FARM_ACQUISITION_STAGE");
});

test("parallel roadmap row points at controlled discovery but carries no Exchange authority",()=>{
  const row=roadmap.parallelPreparations.find(x=>x.id==="PR20.8_WERTMUTATIONEN");
  assert.ok(row);
  assert.equal(row.status,"EXCHANGE_ACQUISITION_DISCOVERY_MANIFEST_CUTOVER_PREPARED");
  assert.equal(row.nextAction,"DEPLOY_EXCHANGE_ACQUISITION_DISCOVERY_READ_ONLY");
  assert.equal(row.gameplayAuthority,false);
  assert.equal(row.rawWriteAuthority,false);
  assert.equal(row.normalRuntimeAllowed,false);
  assert.ok(row.artifacts.includes(
    "v5/grundlage/vertraege/runtime/pr20-8-exchange-candidate-acquisition.json"
  ));
});
