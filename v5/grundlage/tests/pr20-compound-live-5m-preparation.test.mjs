import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const prep=JSON.parse(fs.readFileSync(
  "grundlage/vertraege/runtime/pr20-8-compound-live-5m-preparation.json",
  "utf8",
));

test("PR20.8 Compound 5m preparation binds the exact ratified committed transaction",()=>{
  assert.equal(prep.status,"BEREIT_NO_LIVE_WRITE");
  assert.equal(
    prep.purpose,
    "CONTINUE_EXACT_RATIFIED_COMPOUND_TRANSACTION_WITH_FIVE_MINUTE_POSTCOMMIT_STABILITY_SOAK",
  );
  const p=prep.prerequisiteOneWriteEvidence;
  assert.equal(p.evidence,"roadmap/pr20-8-compound-productive-one-write-evidence.json");
  assert.equal(p.status,"RATIFIED_COMMITTED_SUCCESS");
  assert.equal(p.testId,"pr20-8-compound-productive-one-write-live");
  assert.equal(p.controllerVersion,"1.0.0");
  assert.equal(
    p.transactionId,
    "pr20-8-compound-productive-one-write-live:ff08418e6003250471c98f5893dec8dd",
  );
  assert.equal(p.reconciliationClassification,"COMMITTED_SUCCESS");
  assert.equal(p.sendCount,1);
  assert.equal(p.gameplayWrites,1);
  assert.equal(p.publicFunctionCalls,1);
  assert.equal(p.rawWriteCalls,0);
  assert.equal(p.sameIntentRetry,false);
  assert.equal(p.noDuplicateValueChangingEffectObserved,true);
});

test("PR20.8 Compound 5m preparation pins the committed hpamulet and scroll postcondition",()=>{
  const p=prep.exactCommittedPostcondition;
  assert.deepEqual(p.recipient,{
    characterName:"My_Merchant",
    ctype:"merchant",
    serverRegion:"EU",
    serverIdentifier:"I",
  });
  assert.deepEqual(p.resultItem,{name:"hpamulet",level:1,inventoryIndex:1});
  assert.deepEqual(p.consumedInputIndexes,[22,23]);
  assert.equal(p.consumedInputSlotsMustRemainEmpty,true);
  assert.deepEqual(p.scroll,{
    name:"cscroll0",
    inventoryIndex:18,
    quantityBefore:20,
    quantityAfter:19,
    consumeQuantity:1,
  });
  assert.equal(p.compoundQueueMustBeClear,true);
  assert.equal(p.placeholderCount,0);
  assert.equal(p.massproductionPresent,false);
  assert.equal(p.massproductionppPresent,false);
});

test("PR20.8 Compound 5m preparation is a 60 sample no-resend postcommit soak",()=>{
  const s=prep.soak;
  assert.equal(s.minimumSamples,60);
  assert.equal(s.intervalMs,5000);
  assert.equal(s.minimumDurationMs,299000);
  assert.equal(s.exactTransactionMustRemainCommitted,true);
  assert.equal(s.sendCountMustRemainExactlyOne,true);
  assert.equal(s.postconditionMustRemainStable,true);
  assert.equal(s.qAndPlaceholderMustRemainClear,true);
  assert.equal(s.noNewCompoundEffectAccepted,true);
  assert.equal(s.noNewAuthorityMayOpen,true);
  assert.equal(s.restartMayOnlyResumeObservationOfSameCommittedTransaction,true);
  assert.equal(s.restartMayNeverResend,true);
  assert.equal(s.unknownOrDrift,"BLOCK_FAIL_CLOSED");
});

test("PR20.8 Compound 5m preparation itself grants zero additional write authority",()=>{
  const b=prep.packageBoundary;
  assert.equal(b.preparationOnly,true);
  assert.equal(b.liveRunnerPresent,false);
  assert.equal(b.publicCompoundCallSites,0);
  assert.equal(b.maximumAdditionalGameplayWrites,0);
  assert.equal(b.maximumAdditionalPublicFunctionCalls,0);
  assert.equal(b.maximumAdditionalRawWriteCalls,0);
  assert.equal(b.compoundWriteAuthority,false);
  assert.equal(b.gameplayAuthority,false);
  assert.equal(b.rawWriteAuthority,false);
  assert.equal(b.directSocketWriteForbidden,true);
  assert.equal(b.sameIntentRetry,false);
  assert.equal(b.normalRuntimeAllowed,false);
  assert.equal(b.manifestCutoverPrepared,false);
  assert.equal(b.deployed,false);
  assert.equal(b.liveWriteEnabled,false);
  assert.equal(prep.nextGate,"PR20_8_COMPOUND_LIVE_5M_RUNNER_PACKAGE");
});

test("PR20.8 Compound 5m pass cannot open Exchange or PR20.9",()=>{
  const e=prep.exitSemantics;
  assert.equal(e.passMaySetCompoundLive5mTested,true);
  assert.equal(e.passDoesNotRelaxExchangeRatification,true);
  assert.equal(e.passDoesNotProveExchangeAutonomy,true);
  assert.equal(e.passDoesNotSatisfyPr20_8ExitGateByItself,true);
  assert.equal(e.mayAdvanceToPr20_9,false);
});
