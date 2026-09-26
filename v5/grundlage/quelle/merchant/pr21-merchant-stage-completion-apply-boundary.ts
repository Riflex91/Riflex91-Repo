import { evidenceFingerprint } from "../zertifizierung/evidence-kette.js";
import type {
  Pr21MerchantPostSettlementTransitionBoundary,
  Pr21MerchantPostSettlementTransitionRecord,
  Pr21MerchantPostSettlementTransitionRecordBasis,
} from "./pr21-merchant-post-settlement-transition-boundary.js";

export interface Pr21MerchantStageCompletionApplyRequest {
  readonly schemaVersion: 1;
  readonly transitionBoundary: Pr21MerchantPostSettlementTransitionBoundary;
  readonly transactionId: string;
  readonly currentMainCommit: string;
  readonly preparedAtMs: number;
}

export interface Pr21MerchantStageCompletionApplyTransactionBasis {
  readonly schemaVersion: 1;
  readonly status: "PREPARED_STAGE_COMPLETION_DEFAULT_OFF";
  readonly transactionId: string;
  readonly operationKey: string;
  readonly stage: "PR21";
  readonly nextStage: "PR22";
  readonly sourceMainCommit: string;
  readonly transitionFingerprint: string;
  readonly settlementFingerprint: string;
  readonly ledgerFingerprint: string;
  readonly preparedAtMs: number;
  readonly freshMainCheckRequiredAtExecution: true;
  readonly transitionFingerprintRecheckRequiredAtExecution: true;
  readonly durableIntentRequiredBeforeMutation: true;
  readonly oneShotExecutionRequired: true;
  readonly sameIntentRetryAllowed: false;
  readonly postconditionVerificationRequired: true;
  readonly unknownOutcomeRequiresReconciliation: true;
  readonly stageCompletionAdapterInstalled: false;
  readonly executionEnabled: false;
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

export interface Pr21MerchantStageCompletionApplyTransaction
  extends Pr21MerchantStageCompletionApplyTransactionBasis {
  readonly transactionFingerprint: string;
}

export interface Pr21MerchantStageCompletionApplyBoundary {
  readonly schemaVersion: 1;
  readonly status: "READY_DEFAULT_OFF" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly stage: "PR21";
  readonly nextStage: "PR22";
  readonly transaction: Pr21MerchantStageCompletionApplyTransaction | null;
  readonly transitionFingerprintMatched: boolean;
  readonly currentMainMatched: boolean;
  readonly stageCompletionAdapterInstalled: false;
  readonly executionEnabled: false;
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
  readonly separateExecutionAuthorizationRequired: true;
}

const STAGE = "PR21" as const;
const NEXT_STAGE = "PR22" as const;

function sha40(value: string, error: string): void {
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error(error);
}

function fp16(value: string, error: string): void {
  if (!/^[0-9a-f]{16}$/.test(value)) throw new Error(error);
}

function text(value: string, error: string, maximum = 192): void {
  if (value.trim().length === 0 || value.length > maximum) {
    throw new Error(error);
  }
}

function time(value: number, error: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(error);
}

function transitionBasis(
  record: Pr21MerchantPostSettlementTransitionRecord,
): Pr21MerchantPostSettlementTransitionRecordBasis {
  return Object.freeze({
    schemaVersion: record.schemaVersion,
    status: record.status,
    stage: record.stage,
    nextStage: record.nextStage,
    sourceMainCommit: record.sourceMainCommit,
    transactionFingerprint: record.transactionFingerprint,
    settlementFingerprint: record.settlementFingerprint,
    ledgerFingerprint: record.ledgerFingerprint,
    preparedAtMs: record.preparedAtMs,
    pr21ProductiveEligible: record.pr21ProductiveEligible,
    pr22ProductiveEligibleAtTransition:
      record.pr22ProductiveEligibleAtTransition,
    freshMainCheckRequiredAtApply: record.freshMainCheckRequiredAtApply,
    separateStageCompletionApplyRequired:
      record.separateStageCompletionApplyRequired,
    pr21StageCompletionApplied: record.pr21StageCompletionApplied,
    pr22DevelopmentStageActivated: record.pr22DevelopmentStageActivated,
    pr22ProductiveAuthorityIssued: record.pr22ProductiveAuthorityIssued,
    roadmapMutationPerformed: record.roadmapMutationPerformed,
    ledgerMutationPerformed: record.ledgerMutationPerformed,
    stageMutationPerformed: record.stageMutationPerformed,
    authorityIssued: record.authorityIssued,
    gameplayAuthority: record.gameplayAuthority,
    rawWriteAuthority: record.rawWriteAuthority,
    broadRuntimeGrant: record.broadRuntimeGrant,
    normalRuntimeAllowed: record.normalRuntimeAllowed,
  });
}

function validateTransitionRecord(
  record: Pr21MerchantPostSettlementTransitionRecord,
): boolean {
  if (record.schemaVersion !== 1
      || record.status !== "READY_FOR_SEPARATE_STAGE_COMPLETION_APPLY"
      || record.stage !== STAGE
      || record.nextStage !== NEXT_STAGE
      || record.pr21ProductiveEligible !== true
      || record.pr22ProductiveEligibleAtTransition !== false
      || record.freshMainCheckRequiredAtApply !== true
      || record.separateStageCompletionApplyRequired !== true
      || record.pr21StageCompletionApplied !== false
      || record.pr22DevelopmentStageActivated !== false
      || record.pr22ProductiveAuthorityIssued !== false
      || record.roadmapMutationPerformed !== false
      || record.ledgerMutationPerformed !== false
      || record.stageMutationPerformed !== false
      || record.authorityIssued !== false
      || record.gameplayAuthority !== false
      || record.rawWriteAuthority !== false
      || record.broadRuntimeGrant !== false
      || record.normalRuntimeAllowed !== false) {
    return false;
  }
  sha40(
    record.sourceMainCommit,
    "PR21_MERCHANT_STAGE_COMPLETION_APPLY_TRANSITION_MAIN_UNGUELTIG",
  );
  fp16(
    record.transitionFingerprint,
    "PR21_MERCHANT_STAGE_COMPLETION_APPLY_TRANSITION_FP_UNGUELTIG",
  );
  fp16(
    record.transactionFingerprint,
    "PR21_MERCHANT_STAGE_COMPLETION_APPLY_GATE_TX_FP_UNGUELTIG",
  );
  fp16(
    record.settlementFingerprint,
    "PR21_MERCHANT_STAGE_COMPLETION_APPLY_SETTLEMENT_FP_UNGUELTIG",
  );
  fp16(
    record.ledgerFingerprint,
    "PR21_MERCHANT_STAGE_COMPLETION_APPLY_LEDGER_FP_UNGUELTIG",
  );
  return evidenceFingerprint(transitionBasis(record))
    === record.transitionFingerprint;
}

export function bereitePr21MerchantStageCompletionApplyVor(
  request: Pr21MerchantStageCompletionApplyRequest,
): Pr21MerchantStageCompletionApplyBoundary {
  if (request.schemaVersion !== 1) {
    throw new Error("PR21_MERCHANT_STAGE_COMPLETION_APPLY_SCHEMA_UNGUELTIG");
  }
  sha40(
    request.currentMainCommit,
    "PR21_MERCHANT_STAGE_COMPLETION_APPLY_MAIN_UNGUELTIG",
  );
  text(
    request.transactionId,
    "PR21_MERCHANT_STAGE_COMPLETION_APPLY_TRANSACTION_ID_UNGUELTIG",
  );
  time(
    request.preparedAtMs,
    "PR21_MERCHANT_STAGE_COMPLETION_APPLY_ZEIT_UNGUELTIG",
  );

  const boundary = request.transitionBoundary;
  const record = boundary.record;
  const blocker: string[] = [];

  if (boundary.schemaVersion !== 1
      || boundary.status !== "READY_FOR_SEPARATE_STAGE_COMPLETION_APPLY"
      || boundary.blocker.length !== 0
      || boundary.stage !== STAGE
      || boundary.nextStage !== NEXT_STAGE
      || boundary.pr21StageCompletionApplied !== false
      || boundary.pr22DevelopmentStageActivated !== false
      || boundary.pr22ProductiveAuthorityIssued !== false
      || boundary.roadmapMutationPerformed !== false
      || boundary.ledgerMutationPerformed !== false
      || boundary.stageMutationPerformed !== false
      || boundary.authorityIssued !== false
      || boundary.gameplayAuthority !== false
      || boundary.rawWriteAuthority !== false
      || boundary.broadRuntimeGrant !== false
      || boundary.normalRuntimeAllowed !== false
      || record === null) {
    blocker.push("PR21_MERCHANT_STAGE_COMPLETION_APPLY_TRANSITION_NICHT_BEREIT");
  }

  const transitionFingerprintMatched =
    record !== null && validateTransitionRecord(record);
  if (!transitionFingerprintMatched) {
    blocker.push("PR21_MERCHANT_STAGE_COMPLETION_APPLY_TRANSITION_FP_DRIFT");
  }

  const currentMainMatched =
    record !== null && record.sourceMainCommit === request.currentMainCommit;
  if (!currentMainMatched) {
    blocker.push("PR21_MERCHANT_STAGE_COMPLETION_APPLY_MAIN_STALE");
  }

  let transaction: Pr21MerchantStageCompletionApplyTransaction | null = null;
  if (blocker.length === 0 && record !== null) {
    const operationKey = [
      "pr21-stage-completion",
      STAGE,
      NEXT_STAGE,
      record.transitionFingerprint,
    ].join(":");

    const basis: Pr21MerchantStageCompletionApplyTransactionBasis =
      Object.freeze({
        schemaVersion: 1,
        status: "PREPARED_STAGE_COMPLETION_DEFAULT_OFF",
        transactionId: request.transactionId,
        operationKey,
        stage: STAGE,
        nextStage: NEXT_STAGE,
        sourceMainCommit: record.sourceMainCommit,
        transitionFingerprint: record.transitionFingerprint,
        settlementFingerprint: record.settlementFingerprint,
        ledgerFingerprint: record.ledgerFingerprint,
        preparedAtMs: request.preparedAtMs,
        freshMainCheckRequiredAtExecution: true,
        transitionFingerprintRecheckRequiredAtExecution: true,
        durableIntentRequiredBeforeMutation: true,
        oneShotExecutionRequired: true,
        sameIntentRetryAllowed: false,
        postconditionVerificationRequired: true,
        unknownOutcomeRequiresReconciliation: true,
        stageCompletionAdapterInstalled: false,
        executionEnabled: false,
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

    transaction = Object.freeze({
      ...basis,
      transactionFingerprint: evidenceFingerprint(basis),
    });
  }

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0 ? "READY_DEFAULT_OFF" : "BLOCKIERT",
    blocker: Object.freeze([...new Set(blocker)]),
    stage: STAGE,
    nextStage: NEXT_STAGE,
    transaction,
    transitionFingerprintMatched,
    currentMainMatched,
    stageCompletionAdapterInstalled: false,
    executionEnabled: false,
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
    separateExecutionAuthorizationRequired: true,
  });
}
