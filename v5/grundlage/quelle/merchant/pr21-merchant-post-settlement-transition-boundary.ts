import { evidenceFingerprint } from "../zertifizierung/evidence-kette.js";
import {
  bauePr21_28StageLedger,
  replayPr21_28AdvanceChain,
  type Pr21_28StageLedger,
} from "../runtime/pr21-28-stage-state-ledger.js";
import type {
  Pr21MerchantGateApplyExecutionResult,
} from "./pr21-merchant-one-shot-gate-apply-execution-boundary.js";

export interface Pr21MerchantPostSettlementTransitionRequest {
  readonly schemaVersion: 1;
  readonly execution: Pr21MerchantGateApplyExecutionResult;
  readonly ledger: Pr21_28StageLedger;
  readonly currentMainCommit: string;
  readonly preparedAtMs: number;
}

export interface Pr21MerchantPostSettlementTransitionRecordBasis {
  readonly schemaVersion: 1;
  readonly status: "READY_FOR_SEPARATE_STAGE_COMPLETION_APPLY";
  readonly stage: "PR21";
  readonly nextStage: "PR22";
  readonly sourceMainCommit: string;
  readonly transactionFingerprint: string;
  readonly settlementFingerprint: string;
  readonly ledgerFingerprint: string;
  readonly preparedAtMs: number;
  readonly pr21ProductiveEligible: true;
  readonly pr22ProductiveEligibleAtTransition: false;
  readonly freshMainCheckRequiredAtApply: true;
  readonly separateStageCompletionApplyRequired: true;
  readonly pr21StageCompletionApplied: false;
  readonly pr22DevelopmentStageActivated: false;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly roadmapMutationPerformed: false;
  readonly ledgerMutationPerformed: false;
  readonly stageMutationPerformed: false;
  readonly authorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
}

export interface Pr21MerchantPostSettlementTransitionRecord
  extends Pr21MerchantPostSettlementTransitionRecordBasis {
  readonly transitionFingerprint: string;
}

export interface Pr21MerchantPostSettlementTransitionBoundary {
  readonly schemaVersion: 1;
  readonly status: "READY_FOR_SEPARATE_STAGE_COMPLETION_APPLY" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly stage: "PR21";
  readonly nextStage: "PR22";
  readonly record: Pr21MerchantPostSettlementTransitionRecord | null;
  readonly pr21StageCompletionApplied: false;
  readonly pr22DevelopmentStageActivated: false;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly roadmapMutationPerformed: false;
  readonly ledgerMutationPerformed: false;
  readonly stageMutationPerformed: false;
  readonly authorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
}

const STAGE = "PR21" as const;
const NEXT_STAGE = "PR22" as const;

function sha40(value: string, error: string): void {
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error(error);
}

function fp16(value: string, error: string): void {
  if (!/^[0-9a-f]{16}$/.test(value)) throw new Error(error);
}

function time(value: number, error: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(error);
}

function recordFingerprint(
  basis: Pr21MerchantPostSettlementTransitionRecordBasis,
): string {
  return evidenceFingerprint(Object.freeze({ ...basis }));
}

export function bereitePr21MerchantPostSettlementTransitionVor(
  request: Pr21MerchantPostSettlementTransitionRequest,
): Pr21MerchantPostSettlementTransitionBoundary {
  if (request.schemaVersion !== 1) {
    throw new Error("PR21_MERCHANT_POST_SETTLEMENT_SCHEMA_UNGUELTIG");
  }
  sha40(
    request.currentMainCommit,
    "PR21_MERCHANT_POST_SETTLEMENT_MAIN_UNGUELTIG",
  );
  time(request.preparedAtMs, "PR21_MERCHANT_POST_SETTLEMENT_ZEIT_UNGUELTIG");

  const blocker: string[] = [];
  const execution = request.execution;
  const settlement = execution.settlement;
  const reconciliation = execution.reconciliation;

  if (execution.schemaVersion !== 1
      || execution.status !== "APPLIED_VERIFIED_RECORD_ONLY"
      || execution.stage !== STAGE
      || execution.authorizationConsumed !== true
      || execution.durableIntentPersisted !== true
      || execution.mutationAttemptObserved !== true
      || execution.gateMutationPerformed !== true
      || execution.controlPlaneMutationOnly !== true
      || execution.sameIntentRetryAllowed !== false
      || execution.blindResumeAfterRestartAllowed !== false
      || execution.gameplayAuthority !== false
      || execution.rawWriteAuthority !== false
      || execution.broadRuntimeGrant !== false
      || execution.normalRuntimeAllowed !== false
      || settlement === null
      || reconciliation === null) {
    blocker.push("PR21_MERCHANT_POST_SETTLEMENT_EXECUTION_NICHT_VERIFIZIERT");
  }

  if (settlement !== null) {
    if (settlement.schemaVersion !== 1
        || settlement.stage !== STAGE
        || settlement.status !== "APPLIED_VERIFIED_RECORD_ONLY"
        || settlement.transactionFingerprint !== execution.transactionFingerprint
        || settlement.durableIntentObserved !== true
        || settlement.postconditionVerified !== true
        || settlement.terminalSettlementObserved !== true
        || settlement.gateMutationPerformedBySettlement !== false
        || settlement.authorityIssuedBySettlement !== false
        || settlement.broadRuntimeGrant !== false) {
      blocker.push("PR21_MERCHANT_POST_SETTLEMENT_RECORD_UNGUELTIG");
    }
    if (settlement.sourceMainCommit !== request.currentMainCommit) {
      blocker.push("PR21_MERCHANT_POST_SETTLEMENT_MAIN_STALE");
    }
    fp16(
      settlement.settlementFingerprint,
      "PR21_MERCHANT_POST_SETTLEMENT_FP_UNGUELTIG",
    );
  }

  if (reconciliation !== null
      && (reconciliation.schemaVersion !== 1
        || reconciliation.status !== "ALREADY_APPLIED_REQUIRES_RECORD_ONLY"
        || reconciliation.blocker.length !== 0
        || reconciliation.sameIntentRetryAllowed !== false
        || reconciliation.newApplyAttemptAllowed !== false
        || reconciliation.gateMutationPerformedByReconciler !== false
        || reconciliation.authorityIssued !== false
        || reconciliation.broadRuntimeGrant !== false)) {
    blocker.push("PR21_MERCHANT_POST_SETTLEMENT_RECONCILIATION_UNGUELTIG");
  }

  let rebuilt: Pr21_28StageLedger;
  try {
    rebuilt = bauePr21_28StageLedger(
      request.ledger.entries.map(entry => entry.state),
    );
  } catch {
    blocker.push("PR21_MERCHANT_POST_SETTLEMENT_LEDGER_UNGUELTIG");
    rebuilt = request.ledger;
  }

  if (request.ledger.schemaVersion !== 1
      || request.ledger.replayOnly !== true
      || request.ledger.gateMutationPerformed !== false
      || request.ledger.authorityIssued !== false
      || request.ledger.broadRuntimeGrant !== false
      || request.ledger.normalRuntimeAllowed !== false
      || rebuilt.ledgerFingerprint !== request.ledger.ledgerFingerprint
      || rebuilt.entries.length !== request.ledger.entries.length
      || rebuilt.entries.some((entry, index) =>
        entry.entryFingerprint !== request.ledger.entries[index]?.entryFingerprint
      )) {
    blocker.push("PR21_MERCHANT_POST_SETTLEMENT_LEDGER_DRIFT");
  }

  const replay = replayPr21_28AdvanceChain(rebuilt);
  const pr21 = rebuilt.entries.find(entry => entry.stage === STAGE);
  const pr22 = rebuilt.entries.find(entry => entry.stage === NEXT_STAGE);

  if (pr21 === undefined
      || pr21.preparationComplete !== true
      || pr21.productivePrerequisitesComplete !== true
      || pr21.predecessorProductiveComplete !== true
      || pr21.productiveChainEligible !== true
      || pr21.state.liveEvidenceRatified !== true
      || pr21.state.explicitRatificationRecorded !== true
      || pr21.state.gateApplyVerified !== true
      || pr21.cap022FullChainRequired !== false
      || pr21.cap022TerminalSettlementRequired !== false) {
    blocker.push("PR21_MERCHANT_POST_SETTLEMENT_PR21_LEDGER_NICHT_PRODUCTIV");
  }

  if (rebuilt.highestProductiveEligibleStage !== STAGE
      || pr22 === undefined
      || pr22.productiveChainEligible !== false
      || replay.highestProductiveEligibleStage !== STAGE) {
    blocker.push("PR21_MERCHANT_POST_SETTLEMENT_STAGE_FORTSCHRITT_DRIFT");
  }

  const uniqueBlocker = Object.freeze([...new Set(blocker)]);
  let record: Pr21MerchantPostSettlementTransitionRecord | null = null;

  if (uniqueBlocker.length === 0 && settlement !== null) {
    const basis: Pr21MerchantPostSettlementTransitionRecordBasis = Object.freeze({
      schemaVersion: 1,
      status: "READY_FOR_SEPARATE_STAGE_COMPLETION_APPLY",
      stage: STAGE,
      nextStage: NEXT_STAGE,
      sourceMainCommit: settlement.sourceMainCommit,
      transactionFingerprint: settlement.transactionFingerprint,
      settlementFingerprint: settlement.settlementFingerprint,
      ledgerFingerprint: rebuilt.ledgerFingerprint,
      preparedAtMs: request.preparedAtMs,
      pr21ProductiveEligible: true,
      pr22ProductiveEligibleAtTransition: false,
      freshMainCheckRequiredAtApply: true,
      separateStageCompletionApplyRequired: true,
      pr21StageCompletionApplied: false,
      pr22DevelopmentStageActivated: false,
      pr22ProductiveAuthorityIssued: false,
      roadmapMutationPerformed: false,
      ledgerMutationPerformed: false,
      stageMutationPerformed: false,
      authorityIssued: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      broadRuntimeGrant: false,
      normalRuntimeAllowed: false,
    });
    record = Object.freeze({
      ...basis,
      transitionFingerprint: recordFingerprint(basis),
    });
  }

  return Object.freeze({
    schemaVersion: 1,
    status: uniqueBlocker.length === 0
      ? "READY_FOR_SEPARATE_STAGE_COMPLETION_APPLY"
      : "BLOCKIERT",
    blocker: uniqueBlocker,
    stage: STAGE,
    nextStage: NEXT_STAGE,
    record,
    pr21StageCompletionApplied: false,
    pr22DevelopmentStageActivated: false,
    pr22ProductiveAuthorityIssued: false,
    roadmapMutationPerformed: false,
    ledgerMutationPerformed: false,
    stageMutationPerformed: false,
    authorityIssued: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
  });
}
