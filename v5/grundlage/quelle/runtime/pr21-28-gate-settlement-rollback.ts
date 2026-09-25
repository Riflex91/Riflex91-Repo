import { evidenceFingerprint } from "../zertifizierung/evidence-kette.js";
import type { Pr21_28GateApplyTransaction } from "./pr21-28-gate-apply-transaction.js";
import type { Pr21_28GateStage } from "./pr21-28-feature-gates.js";

export interface Pr21_28GateSettlementBasis {
  readonly schemaVersion: 1;
  readonly transactionFingerprint: string;
  readonly transactionId: string;
  readonly stage: Pr21_28GateStage;
  readonly sourceMainCommit: string;
  readonly settledAtMs: number;
  readonly status: "APPLIED_VERIFIED_RECORD_ONLY" | "ABORTED_NO_MUTATION";
  readonly durableIntentObserved: boolean;
  readonly postconditionVerified: boolean;
  readonly terminalSettlementObserved: boolean;
  readonly gateMutationPerformedBySettlement: false;
  readonly authorityIssuedBySettlement: false;
  readonly broadRuntimeGrant: false;
}

export interface Pr21_28GateSettlement extends Pr21_28GateSettlementBasis {
  readonly settlementFingerprint: string;
}

export interface Pr21_28RollbackPlan {
  readonly schemaVersion: 1;
  readonly stage: Pr21_28GateStage;
  readonly settlementFingerprint: string;
  readonly reason: string;
  readonly status: "PREPARED_DEFAULT_OFF";
  readonly freshMainCheckRequired: true;
  readonly currentPostconditionVerificationRequired: true;
  readonly durableRollbackIntentRequired: true;
  readonly oneShotRollbackRequired: true;
  readonly sameIntentRetryAllowed: false;
  readonly rollbackAdapterInstalled: false;
  readonly rollbackExecutionEnabled: false;
  readonly rollbackMutationPerformed: false;
  readonly authorityIssued: false;
  readonly broadRuntimeGrant: false;
}

function text(value:string,error:string):void{
  if(value.trim().length===0||value.length>256) throw new Error(error);
}

function basisFingerprint(basis:Pr21_28GateSettlementBasis):string{
  return evidenceFingerprint(Object.freeze({...basis}));
}

export function recordPr21_28GateSettlement(
  transaction:Pr21_28GateApplyTransaction,
  settledAtMs:number,
  observed:{
    mutationAttemptObserved:boolean;
    postconditionVerified:boolean;
    durableIntentObserved:boolean;
    terminalSettlementObserved:boolean;
  },
):Pr21_28GateSettlement{
  if(transaction.schemaVersion!==1
      || transaction.status!=="PREPARED_DEFAULT_OFF"
      || transaction.sameIntentRetryAllowed!==false
      || !Number.isSafeInteger(settledAtMs)
      || settledAtMs<transaction.preparedAtMs){
    throw new Error("PR21_28_GATE_SETTLEMENT_INPUT_UNGUELTIG");
  }

  let status:Pr21_28GateSettlementBasis["status"];
  if(!observed.mutationAttemptObserved){
    if(observed.postconditionVerified||observed.durableIntentObserved||observed.terminalSettlementObserved){
      throw new Error("PR21_28_GATE_SETTLEMENT_NO_MUTATION_DRIFT");
    }
    status="ABORTED_NO_MUTATION";
  }else{
    if(!observed.postconditionVerified
        || !observed.durableIntentObserved
        || !observed.terminalSettlementObserved){
      throw new Error("PR21_28_GATE_SETTLEMENT_UNVERIFIED_MUTATION");
    }
    status="APPLIED_VERIFIED_RECORD_ONLY";
  }

  const basis:Object = Object.freeze({
    schemaVersion:1,
    transactionFingerprint:transaction.transactionFingerprint,
    transactionId:transaction.transactionId,
    stage:transaction.stage,
    sourceMainCommit:transaction.sourceMainCommit,
    settledAtMs,
    status,
    durableIntentObserved:observed.durableIntentObserved,
    postconditionVerified:observed.postconditionVerified,
    terminalSettlementObserved:observed.terminalSettlementObserved,
    gateMutationPerformedBySettlement:false,
    authorityIssuedBySettlement:false,
    broadRuntimeGrant:false,
  });
  const typed=basis as Pr21_28GateSettlementBasis;
  return Object.freeze({...typed,settlementFingerprint:basisFingerprint(typed)});
}

export function planePr21_28GateRollback(
  settlement:Pr21_28GateSettlement,
  reason:string,
):Pr21_28RollbackPlan{
  if(settlement.schemaVersion!==1
      || settlement.status!=="APPLIED_VERIFIED_RECORD_ONLY"
      || settlement.durableIntentObserved!==true
      || settlement.postconditionVerified!==true
      || settlement.terminalSettlementObserved!==true
      || settlement.gateMutationPerformedBySettlement!==false
      || settlement.authorityIssuedBySettlement!==false
      || settlement.broadRuntimeGrant!==false){
    throw new Error("PR21_28_ROLLBACK_SETTLEMENT_NICHT_BEREIT");
  }
  text(reason,"PR21_28_ROLLBACK_REASON_UNGUELTIG");
  return Object.freeze({
    schemaVersion:1,
    stage:settlement.stage,
    settlementFingerprint:settlement.settlementFingerprint,
    reason,
    status:"PREPARED_DEFAULT_OFF",
    freshMainCheckRequired:true,
    currentPostconditionVerificationRequired:true,
    durableRollbackIntentRequired:true,
    oneShotRollbackRequired:true,
    sameIntentRetryAllowed:false,
    rollbackAdapterInstalled:false,
    rollbackExecutionEnabled:false,
    rollbackMutationPerformed:false,
    authorityIssued:false,
    broadRuntimeGrant:false,
  });
}
