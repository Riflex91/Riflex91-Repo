import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { bereitePr21MerchantCheckpointVor } from "../../erzeugt/index.js";

const MAIN="99b336dbd57715eae4ddabd2cb3490ac5013d315";

function preflight(overrides={}) {
  return {
    schemaVersion:1,
    status:"PRECHECK_BEREIT_NO_START_AUTHORITY",
    blocker:[],
    currentMainVerified:true,
    merchantReadinessSatisfied:true,
    checkpointBindingSatisfied:true,
    allPr20StagesRatified:true,
    ratifiedPr20Stages:[
      "PR20.1","PR20.2","PR20.3","PR20.4","PR20.5",
      "PR20.6","PR20.7","PR20.8","PR20.9",
    ],
    missingPr20Stages:[],
    targetCheckpoint:"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT",
    targetDurationSeconds:900,
    separateExternalAuthorizationRequired:true,
    externalRuntimeStartAuthorized:false,
    runnerOwnsGameplayAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    normalRuntimeAllowed:false,
    ...overrides,
  };
}

function request(overrides={}) {
  return {
    schemaVersion:1,
    sourceMainCommit:MAIN,
    preflight:preflight(),
    pr20_9RatificationBasis:"MANUAL_DEVELOPMENT_OVERRIDE",
    manualOverrideEvidence:"v5/roadmap/pr20-9-craft-manual-development-override.json",
    liveCraftEvidenceSatisfied:false,
    ...overrides,
  };
}

test("PR21 Merchant checkpoint admission prepares exact 15m observer checkpoint",()=>{
  const result=bereitePr21MerchantCheckpointVor(request());
  assert.equal(result.status,"CHECKPOINT_PREPARED_NO_START_AUTHORITY");
  assert.deepEqual(result.blocker,[]);
  assert.equal(result.sourceMainCommit,MAIN);
  assert.equal(result.checkpointId,"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT");
  assert.equal(result.runnerPlan.segmente.length,1);
  assert.equal(result.runnerPlan.segmente[0].stage,"PR21");
  assert.equal(result.runnerPlan.segmente[0].art,"MERCHANT_INTEGRATION_15M");
  assert.equal(result.runnerPlan.segmente[0].minimumDauerSekunden,900);
  assert.equal(result.runnerPlan.segmente[0].zielDauerSekunden,900);
  assert.equal(result.runnerPlan.segmente[0].sampleIntervallMs,5000);
  assert.equal(result.runbook.minimumDurationSeconds,900);
  assert.equal(result.runbook.targetDurationSeconds,900);
  assert.equal(result.runbook.manualRatificationRequired,true);
  assert.equal(result.observerOnly,true);
  assert.equal(result.externalRuntimeStartAuthorized,false);
  assert.equal(result.separateExternalAuthorizationRequired,true);
  assert.equal(result.runnerGameplayWrites,0);
  assert.equal(result.runnerPublicFunctionCalls,0);
  assert.equal(result.runnerRawWriteCalls,0);
  assert.equal(result.gameplayAuthority,false);
  assert.equal(result.rawWriteAuthority,false);
  assert.equal(result.normalRuntimeAllowed,false);
});

test("manual PR20.9 basis remains explicitly distinct from live Craft evidence",()=>{
  const ready=bereitePr21MerchantCheckpointVor(request());
  assert.equal(ready.pr20_9RatificationBasis,"MANUAL_DEVELOPMENT_OVERRIDE");
  assert.equal(
    ready.manualOverrideEvidence,
    "v5/roadmap/pr20-9-craft-manual-development-override.json",
  );
  assert.equal(ready.liveCraftEvidenceSatisfied,false);
  assert.equal(ready.manualOverrideExplicitlyDistinguishedFromLiveEvidence,true);

  const missing=bereitePr21MerchantCheckpointVor(request({
    manualOverrideEvidence:null,
  }));
  assert.equal(missing.status,"BLOCKIERT");
  assert.ok(missing.blocker.includes(
    "PR21_MERCHANT_CHECKPOINT_MANUAL_OVERRIDE_EVIDENCE_FEHLT",
  ));

  const drift=bereitePr21MerchantCheckpointVor(request({
    liveCraftEvidenceSatisfied:true,
  }));
  assert.equal(drift.status,"BLOCKIERT");
  assert.ok(drift.blocker.includes(
    "PR21_MERCHANT_CHECKPOINT_MANUAL_OVERRIDE_LIVE_EVIDENCE_DRIFT",
  ));
});

test("real Craft basis requires real Craft evidence and no manual override evidence",()=>{
  const ready=bereitePr21MerchantCheckpointVor(request({
    pr20_9RatificationBasis:"LIVE_EVIDENCE",
    manualOverrideEvidence:null,
    liveCraftEvidenceSatisfied:true,
  }));
  assert.equal(ready.status,"CHECKPOINT_PREPARED_NO_START_AUTHORITY");

  const missing=bereitePr21MerchantCheckpointVor(request({
    pr20_9RatificationBasis:"LIVE_EVIDENCE",
    manualOverrideEvidence:null,
    liveCraftEvidenceSatisfied:false,
  }));
  assert.equal(missing.status,"BLOCKIERT");
  assert.ok(missing.blocker.includes(
    "PR21_MERCHANT_CHECKPOINT_LIVE_CRAFT_EVIDENCE_FEHLT",
  ));
});

test("blocked or authority-drifted preflight cannot prepare checkpoint",()=>{
  const blocked=bereitePr21MerchantCheckpointVor(request({
    preflight:preflight({
      status:"BLOCKIERT",
      blocker:["PR21_LIVE_PREFLIGHT_MAIN_DRIFT"],
      currentMainVerified:false,
    }),
  }));
  assert.equal(blocked.status,"BLOCKIERT");
  assert.ok(blocked.blocker.includes(
    "PR21_MERCHANT_CHECKPOINT_PREFLIGHT_NICHT_BEREIT",
  ));

  const authorityDrift=bereitePr21MerchantCheckpointVor(request({
    preflight:preflight({externalRuntimeStartAuthorized:true}),
  }));
  assert.equal(authorityDrift.status,"BLOCKIERT");
  assert.ok(authorityDrift.blocker.includes(
    "PR21_MERCHANT_CHECKPOINT_PREFLIGHT_AUTHORITY_DRIFT",
  ));
});

test("contract preserves no-start boundary and current manual override basis",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr21-merchant-checkpoint-admission.json",
    "utf8",
  ));
  assert.equal(contract.status,"PREPARED_NO_WRITE_MANUAL_PR20_9_OVERRIDE");
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(contract.checkpointId,"PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT");
  assert.equal(contract.milestone.minimumSeconds,900);
  assert.equal(contract.milestone.targetSeconds,900);
  assert.equal(contract.milestone.sampleIntervalMs,5000);
  assert.equal(contract.preflight.manualPr20_9OverrideAccepted,true);
  assert.equal(contract.preflight.liveCraftEvidenceSatisfied,false);
  assert.equal(contract.safety.externalRuntimeStartAuthorized,false);
  assert.equal(contract.safety.runnerGameplayWrites,0);
  assert.equal(contract.safety.runnerPublicFunctionCalls,0);
  assert.equal(contract.safety.runnerRawWriteCalls,0);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("checkpoint admission source contains no gameplay or runtime-start operation",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/merchant/pr21-merchant-checkpoint-admission.ts",
    "utf8",
  );
  for(const marker of [
    "socket.emit(",".socket.emit(","send_cm(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","craft(","exchange(",
    "upgrade(","compound(","START_EXTERNALLY_AUTHORIZED_RUNTIME_ONLY",
  ]) assert.equal(source.includes(marker),false,marker);
});
