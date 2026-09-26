import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  planePr21_28MilestoneRunner,
  wertePr21_28MilestoneSamplesAus,
  bewertePr21_28LiveEvidence,
  bauePr21_28ResultPackage,
  bereitePr21_28RatificationVor,
  bereitePr21MerchantRatificationBoundaryVor,
  erzeugePr21MerchantRatificationRecord,
} from "../../erzeugt/index.js";

const MAIN="f4de007e11f04376231b5a1322676e76a5bf3e68";
const CHECKPOINT="PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT";

function sample(sequenz,t){
  return {
    schemaVersion:1,sequenz,beobachtetAmMs:t,segmentId:"pr21-merchant-integration",
    healthZustand:"GESUND",operationsAktuell:true,recorderDrops:0,
    unerwarteteGameplayWrites:0,duplicateIrreversibleEffects:0,safetyViolations:0,
    sameIntentRetries:0,unresolvedTransactions:0,authorityLeaks:0,
    restartRecoveryFailures:0,staleEvidenceActions:0,thrashEvents:0,
    pingpongEvents:0,starvationCriticalCount:0,
  };
}

function readyObservability(){
  return {
    schemaVersion:1,status:"BEOBACHTUNG_BEREIT",blocker:[],
    activeAuthorityIds:["runtime:merchant"],missingRequiredAuthorityIds:[],
    unexpectedActiveAuthorityIds:[],authorityLeakCount:0,
    dashboardFehlerDiagnosticOnly:0,recorderDrops:0,
    operationsBackpressureAktiv:false,resourceMetricsComplete:true,
    dashboardFailureBlocksGameplay:false,observerActionAuthority:false,
    gameplayAuthority:false,rawWriteAuthority:false,normalRuntimeAllowed:false,
  };
}

function readyHandoff(){
  const plan=planePr21_28MilestoneRunner(CHECKPOINT);
  const samples=[];
  for(let t=0,seq=1;t<=900000;t+=5000,seq+=1) samples.push(sample(seq,t));
  const runner=wertePr21_28MilestoneSamplesAus(
    plan,samples,{schemaVersion:1,cap022FullChainReady:true},
  );
  const evidence=runner.evidenceRows.map(row=>bewertePr21_28LiveEvidence(row));
  const resultPackage=bauePr21_28ResultPackage({
    schemaVersion:1,packageId:"pkg-pr21-record-boundary",sourceMainCommit:MAIN,
    createdAtMs:1000000,checkpointId:CHECKPOINT,runner,
    observability:readyObservability(),evidence,
  });
  const ratificationDraft=bereitePr21_28RatificationVor(resultPackage);
  return {
    schemaVersion:1,status:"READY_FOR_EXPLICIT_MANUAL_RATIFICATION",blocker:[],
    checkpointId:CHECKPOINT,sourceMainCommit:MAIN,packageId:resultPackage.packageId,
    runner,evidence,resultPackage,ratificationDraft,
    sampleSeriesFrozen:true,samplesImmutableAtHandoff:true,
    automaticRatification:false,gateMutationPerformed:false,authorityIssued:false,
    broadRuntimeGrant:false,gameplayAuthority:false,rawWriteAuthority:false,
    normalRuntimeAllowed:false,
  };
}

test("PR21 ratification boundary exposes exact confirmation without auto-ratifying",()=>{
  const handoff=readyHandoff();
  const boundary=bereitePr21MerchantRatificationBoundaryVor(handoff);
  assert.equal(boundary.status,"AWAITING_EXPLICIT_RATIFICATION");
  assert.equal(boundary.checkpointId,CHECKPOINT);
  assert.equal(boundary.packageId,handoff.resultPackage.packageId);
  assert.equal(boundary.packageFingerprint,handoff.resultPackage.packageFingerprint);
  assert.equal(boundary.requiredConfirmationText,handoff.ratificationDraft.requiredConfirmationText);
  assert.equal(boundary.resultPackageStillImmutable,true);
  assert.equal(boundary.automaticRatification,false);
  assert.equal(boundary.gateAdvanced,false);
  assert.equal(boundary.authorityIssued,false);
  assert.equal(boundary.broadRuntimeGrant,false);
  assert.equal(boundary.gameplayAuthority,false);
  assert.equal(boundary.rawWriteAuthority,false);
  assert.equal(boundary.normalRuntimeAllowed,false);
});

test("wrong confirmation is rejected before record creation",()=>{
  const handoff=readyHandoff();
  assert.throws(
    ()=>erzeugePr21MerchantRatificationRecord(handoff,"WRONG","operator",1000001),
    /PR21_MERCHANT_RATIFICATION_BESTAETIGUNG_UNGUELTIG/,
  );
});

test("exact confirmation creates immutable record only without gate or authority",()=>{
  const handoff=readyHandoff();
  const record=erzeugePr21MerchantRatificationRecord(
    handoff,handoff.ratificationDraft.requiredConfirmationText,
    "operator-manual",1000001,
  );
  assert.equal(record.status,"RATIFIED_RECORD_ONLY");
  assert.equal(record.ratified,true);
  assert.equal(record.checkpointId,CHECKPOINT);
  assert.equal(record.packageId,handoff.resultPackage.packageId);
  assert.equal(record.packageFingerprint,handoff.resultPackage.packageFingerprint);
  assert.equal(record.sourceMainCommit,MAIN);
  assert.equal(record.gateAdvanced,false);
  assert.equal(record.authorityIssued,false);
  assert.equal(record.broadRuntimeGrant,false);
  assert.equal(record.gesamtfreigabeRequiredSeparately,true);
  assert.equal(record.resultPackageStillImmutable,true);
  assert.match(record.ratificationFingerprint,/^[0-9a-f]{16}$/);
});

test("drifted or blocked handoff cannot reach PR21 record boundary",()=>{
  const handoff=readyHandoff();
  assert.throws(
    ()=>bereitePr21MerchantRatificationBoundaryVor({
      ...handoff,status:"BLOCKIERT",blocker:["x"],
    }),
    /PR21_MERCHANT_RATIFICATION_BOUNDARY_HANDOFF_NICHT_BEREIT/,
  );
  assert.throws(
    ()=>bereitePr21MerchantRatificationBoundaryVor({
      ...handoff,checkpointId:"POST_PR28_MULTI_HOUR_FULL_INTEGRATION_RUN",
    }),
    /PR21_MERCHANT_RATIFICATION_BOUNDARY_HANDOFF_NICHT_BEREIT/,
  );
});

test("ratification boundary contract remains explicit-confirmation and record-only",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-ratification-record-boundary.json","utf8",
  ));
  assert.equal(contract.status,"PREPARED_EXPLICIT_CONFIRMATION_ONLY");
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(contract.input.exactConfirmationRequired,true);
  assert.equal(contract.input.immutablePackageBindingRequired,true);
  assert.equal(contract.output.recordStatus,"RATIFIED_RECORD_ONLY");
  assert.equal(contract.output.gateAdvanced,false);
  assert.equal(contract.output.authorityIssued,false);
  assert.equal(contract.output.broadRuntimeGrant,false);
  assert.equal(contract.safety.automaticRatification,false);
  assert.equal(contract.safety.automaticConfirmation,false);
  assert.equal(contract.safety.recordCreationDoesNotAdvanceGate,true);
  assert.equal(contract.safety.recordCreationDoesNotIssueAuthority,true);
});

test("PR21 boundary source contains no gameplay mutation or gate-apply operation",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/merchant/pr21-merchant-ratification-record-boundary.ts","utf8",
  );
  for(const marker of [
    "socket.emit(",".socket.emit(","send_cm(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","craft(","exchange(",
    "upgrade(","compound(","applyGate","gateApply",
  ]) assert.equal(source.includes(marker),false,marker);
});
