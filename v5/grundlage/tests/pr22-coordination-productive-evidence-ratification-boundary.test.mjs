import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evidenceFingerprint,
  pr22CoordinationProductiveEvidenceRatificationConfirmationText,
  bereitePr22CoordinationProductiveEvidenceRatificationVor,
  ratifizierePr22CoordinationProductiveEvidence,
} from "../../erzeugt/index.js";

const MAIN="9f4eab3d7c707e281f534f1f80decd67bc6f6e3d";
const REQUIRED_FOUNDATIONS=[
  "MATERIAL_ACQUISITION",
  "MATERIAL_HANDOFF",
  "POST_SETTLEMENT_CRAFT_RESCAN",
  "PERSISTENT_LIFECYCLE",
  "TEAM_MATERIAL_OBJECTIVE",
  "TEAM_COLLECTION_HANDOFF",
  "TEAM_BATCH_SETTLEMENT_RECOVERY",
  "TEAM_ALL_SETTLED_CRAFT_RESCAN",
  "TEAM_RESCAN_DURABLE_ADMISSION",
];

function evidenceRecord(patch={}) {
  const basis={
    schemaVersion:1,
    status:"READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_RECORD_ONLY",
    stage:"PR22",
    authorizationId:"auth-pr22-ratification",
    admissionFingerprint:"0011223344556677",
    shadowEvidenceFingerprint:"1122334455667788",
    transportFenceFingerprint:"2233445566778899",
    durableIntentId:"intent-pr22-ratification",
    sourceMainCommit:MAIN,
    messageId:"msg-pr22-ratification",
    dedupeKey:"dedupe-pr22-ratification",
    workflowId:"wf-pr22-ratification",
    workflowRevision:5,
    recipientCharacterId:"farmer-1",
    recipientSessionId:"session-farmer-1",
    serverRegion:"EU",
    serverIdentifier:"I",
    rosterEpoch:40,
    livenessEpoch:41,
    payloadFingerprint:"33445566778899aa",
    observedAtMs:10000,
    transportExecutionPerformed:true,
    sendCmCallsObserved:1,
    ackEvidenceSatisfied:true,
    settlementEvidenceSatisfied:true,
    ttlAndDedupeEvidenceSatisfied:true,
    rosterSessionEpochEvidenceSatisfied:true,
    productiveEvidenceSatisfied:true,
    productiveRatificationAllowed:false,
    separateProductiveRatificationRequired:true,
    oneShotTransportAuthorityConsumed:true,
    sendCmAuthority:false,
    pr22ProductiveAuthorityIssued:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
    repositoryMutationPerformed:false,
    controlPlaneMutationPerformed:false,
    ...patch,
  };
  return {...basis,productiveEvidenceFingerprint:evidenceFingerprint(basis)};
}

function execution(record=evidenceRecord()) {
  return {
    schemaVersion:1,
    status:"READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_RECORD_ONLY",
    blocker:[],
    authorizationId:record.authorizationId,
    messageId:record.messageId,
    workflowId:record.workflowId,
    workflowRevision:record.workflowRevision,
    authorizationConsumed:true,
    durableIntentPersisted:true,
    transportAttemptObserved:true,
    transportExecutionPerformed:true,
    sendCmCallsObserved:1,
    productiveEvidenceSatisfied:true,
    productiveRatificationAllowed:false,
    pr22ProductiveAuthorityIssued:false,
    oneShotTransportAuthorityConsumed:true,
    sendCmAuthority:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    broadRuntimeGrant:false,
    normalRuntimeAllowed:false,
    repositoryMutationPerformed:false,
    controlPlaneMutationPerformed:false,
    sameIntentRetryAllowed:false,
    blindResumeAfterRestartAllowed:false,
    record,
  };
}

function state(patch={}) {
  return {
    schemaVersion:1,
    currentStage:"PR22",
    currentGate:"PR22_MULTI_CHARACTER_COORDINATION",
    pr21StageStatus:"COMPLETE",
    pr22StageStatus:"IN_PROGRESS",
    pr22ProductiveAuthorityIssued:false,
    ...patch,
  };
}

function cap022(patch={}) {
  return {
    schemaVersion:1,
    status:"CAP022_FULL_CHAIN_BEREIT_NO_WRITE",
    blocker:[],
    requiredFoundationIds:[...REQUIRED_FOUNDATIONS],
    readyFoundationIds:[...REQUIRED_FOUNDATIONS],
    allRequiredFoundationsPresent:true,
    allRequiredFoundationsReady:true,
    currentPr20_9RatificationCredit:false,
    candidateAcquisitionOrMutationAllowedNow:false,
    durableIntentCreated:false,
    productiveCraftAuthorityOpened:false,
    productiveExecutionAllowed:false,
    gameplayAuthority:false,
    rawWriteAuthority:false,
    normalRuntimeAllowed:false,
    ...patch,
  };
}

test("verified productive evidence prepares explicit PR22 ratification draft only",()=>{
  const run=execution();
  const draft=bereitePr22CoordinationProductiveEvidenceRatificationVor({
    schemaVersion:1,
    execution:run,
    currentMainCommit:MAIN,
    currentRepositoryState:state(),
    cap022FullChain:cap022(),
  });

  assert.equal(
    draft.status,
    "AWAITING_EXPLICIT_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_RATIFICATION",
  );
  assert.equal(
    draft.productiveEvidenceFingerprint,
    run.record.productiveEvidenceFingerprint,
  );
  assert.equal(
    draft.requiredConfirmationText,
    pr22CoordinationProductiveEvidenceRatificationConfirmationText(
      run.record.productiveEvidenceFingerprint,
      MAIN,
    ),
  );
  assert.equal(draft.evidenceFingerprintRevalidated,true);
  assert.equal(draft.repositoryStateRevalidated,true);
  assert.equal(draft.cap022FullChainRevalidated,true);
  assert.equal(draft.evidenceStillImmutable,true);
  assert.equal(draft.automaticRatification,false);
  assert.equal(draft.ratified,false);
  assert.equal(draft.gateAdvanced,false);
  assert.equal(draft.separateGateAdvanceRequired,true);
  assert.equal(draft.productiveAuthorityIssued,false);
  assert.equal(draft.sendCmAuthority,false);
  assert.equal(draft.gameplayAuthority,false);
  assert.equal(draft.rawWriteAuthority,false);
  assert.equal(draft.normalRuntimeAllowed,false);
});

test("generic acknowledgement cannot ratify PR22 productive evidence",()=>{
  const draft=bereitePr22CoordinationProductiveEvidenceRatificationVor({
    schemaVersion:1,
    execution:execution(),
    currentMainCommit:MAIN,
    currentRepositoryState:state(),
    cap022FullChain:cap022(),
  });

  for(const confirmation of ["ok","mach weiter","weiter","ratify","ja"]){
    assert.throws(
      ()=>ratifizierePr22CoordinationProductiveEvidence(
        draft,
        confirmation,
        "operator",
        10100,
      ),
      /PR22_RATIFICATION_BESTAETIGUNG_UNGUELTIG/,
      confirmation,
    );
  }
});

test("exact confirmation creates immutable ratification record only",()=>{
  const draft=bereitePr22CoordinationProductiveEvidenceRatificationVor({
    schemaVersion:1,
    execution:execution(),
    currentMainCommit:MAIN,
    currentRepositoryState:state(),
    cap022FullChain:cap022(),
  });
  const record=ratifizierePr22CoordinationProductiveEvidence(
    draft,
    draft.requiredConfirmationText,
    "operator-pr22-ratifier",
    10100,
  );

  assert.equal(
    record.status,
    "RATIFIED_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_RECORD_ONLY",
  );
  assert.equal(record.ratified,true);
  assert.equal(record.evidenceStillImmutable,true);
  assert.equal(record.evidenceFingerprintRevalidated,true);
  assert.equal(record.repositoryStateRevalidated,true);
  assert.equal(record.cap022FullChainRevalidated,true);
  assert.equal(record.gateAdvanced,false);
  assert.equal(record.separateGateAdvanceRequired,true);
  assert.equal(record.productiveAuthorityIssued,false);
  assert.equal(record.sendCmAuthority,false);
  assert.equal(record.gameplayAuthority,false);
  assert.equal(record.rawWriteAuthority,false);
  assert.equal(record.normalRuntimeAllowed,false);
  assert.equal(record.ratifierId,"operator-pr22-ratifier");
  assert.match(record.ratificationFingerprint,/^[0-9a-f]{16}$/);
});

test("evidence drift, stale main, repository drift or CAP-022 drift blocks draft",()=>{
  const valid=evidenceRecord();
  const tampered={...valid,ackEvidenceSatisfied:false};

  const cases=[
    {
      execution:execution(tampered),
      currentMainCommit:MAIN,
      currentRepositoryState:state(),
      cap022FullChain:cap022(),
    },
    {
      execution:execution(),
      currentMainCommit:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      currentRepositoryState:state(),
      cap022FullChain:cap022(),
    },
    {
      execution:execution(),
      currentMainCommit:MAIN,
      currentRepositoryState:state({currentStage:"PR21"}),
      cap022FullChain:cap022(),
    },
    {
      execution:execution(),
      currentMainCommit:MAIN,
      currentRepositoryState:state(),
      cap022FullChain:cap022({
        status:"BLOCKIERT",
        blocker:["missing"],
        allRequiredFoundationsReady:false,
      }),
    },
  ];

  for(const request of cases){
    assert.throws(
      ()=>bereitePr22CoordinationProductiveEvidenceRatificationVor({
        schemaVersion:1,
        ...request,
      }),
      /PR22_RATIFICATION_/,
    );
  }
});

test("ratification contract remains manual, record-only and no-authority",()=>{
  const contract=JSON.parse(fs.readFileSync(
    "grundlage/vertraege/runtime/pr22-coordination-productive-evidence-ratification-boundary.json",
    "utf8",
  ));
  assert.equal(
    contract.status,
    "PREPARED_EXPLICIT_PR22_PRODUCTIVE_EVIDENCE_RATIFICATION_RECORD_ONLY",
  );
  assert.equal(contract.sourceMain,MAIN);
  assert.equal(
    contract.requiredEvidenceStatus,
    "READY_FOR_PR22_COORDINATION_PRODUCTIVE_EVIDENCE_RECORD_ONLY",
  );
  assert.equal(contract.ratification.exactConfirmationRequired,true);
  assert.equal(contract.ratification.automaticRatification,false);
  assert.equal(contract.ratification.evidenceFingerprintRevalidationRequired,true);
  assert.equal(contract.ratification.repositoryStateRevalidationRequired,true);
  assert.equal(contract.ratification.cap022FullChainRevalidationRequired,true);
  assert.equal(contract.ratification.separateGateAdvanceRequired,true);
  assert.equal(contract.safety.gateAdvanced,false);
  assert.equal(contract.safety.productiveAuthorityIssued,false);
  assert.equal(contract.safety.sendCmAuthority,false);
  assert.equal(contract.safety.gameplayAuthority,false);
  assert.equal(contract.safety.rawWriteAuthority,false);
  assert.equal(contract.safety.normalRuntimeAllowed,false);
});

test("ratification source contains no transport, gate or repository mutation backdoor",()=>{
  const source=fs.readFileSync(
    "grundlage/quelle/koordination/pr22-coordination-productive-evidence-ratification-boundary.ts",
    "utf8",
  );
  for(const marker of [
    "send_cm(","socket.emit(",".socket.emit(","smart_move(","attack(",
    "use_skill(","loot(","respawn(","change_server(","writeFile(",
    "writeFileSync(","applyPr22","execute(","mutieren(",
  ]) assert.equal(source.includes(marker),false,marker);
});
