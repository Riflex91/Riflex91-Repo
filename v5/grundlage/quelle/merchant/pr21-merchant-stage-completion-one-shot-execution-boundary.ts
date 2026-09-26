import { evidenceFingerprint } from "../zertifizierung/evidence-kette.js";
import type {
  Pr21MerchantStageCompletionApplyTransaction,
  Pr21MerchantStageCompletionApplyTransactionBasis,
} from "./pr21-merchant-stage-completion-apply-boundary.js";
import type {
  Pr21MerchantStageCompletionExecutionAuthorizationRecord,
} from "./pr21-merchant-stage-completion-execution-authorization-boundary.js";

export interface Pr21MerchantStageCompletionDurableIntentInput {
  readonly schemaVersion: 1;
  readonly stage: "PR21";
  readonly nextStage: "PR22";
  readonly authorizationId: string;
  readonly transactionId: string;
  readonly operationKey: string;
  readonly transactionFingerprint: string;
  readonly transitionFingerprint: string;
  readonly settlementFingerprint: string;
  readonly ledgerFingerprint: string;
  readonly sourceMainCommit: string;
  readonly requestedAtMs: number;
}

export interface Pr21MerchantStageCompletionDurableIntentReceipt {
  readonly schemaVersion: 1;
  readonly status:
    | "PERSISTED_NEW"
    | "ALREADY_PERSISTED_RECONCILIATION_REQUIRED";
  readonly durableIntentId: string;
  readonly authorizationId: string;
  readonly transactionId: string;
  readonly operationKey: string;
  readonly transactionFingerprint: string;
  readonly persistedAtMs: number;
}

export interface Pr21MerchantStageCompletionDurableIntentWriter {
  persistPr21MerchantStageCompletionIntent(
    input: Pr21MerchantStageCompletionDurableIntentInput,
  ): Promise<Pr21MerchantStageCompletionDurableIntentReceipt>;
}

export interface Pr21MerchantStageCompletionMutationResult {
  readonly schemaVersion: 1;
  readonly outcome: "APPLIED" | "NOT_APPLIED" | "UNKNOWN";
  readonly mutationAttempted: true;
  readonly terminalMutationRecordPersisted: boolean;
}

export interface Pr21MerchantStageCompletionPostcondition {
  readonly schemaVersion: 1;
  readonly status: "APPLIED" | "NOT_APPLIED" | "UNKNOWN";
  readonly stage: "PR21";
  readonly nextStage: "PR22";
  readonly transactionFingerprint: string | null;
  readonly pr21StageCompletionApplied: boolean;
  readonly pr22DevelopmentStageActivated: boolean;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly observedAtMs: number;
}

export interface Pr21MerchantStageCompletionControlPlaneAdapter {
  applyPr21StageCompletion(input: {
    readonly schemaVersion: 1;
    readonly stage: "PR21";
    readonly nextStage: "PR22";
    readonly transactionId: string;
    readonly operationKey: string;
    readonly transactionFingerprint: string;
    readonly transitionFingerprint: string;
    readonly authorizationId: string;
    readonly durableIntentId: string;
  }): Promise<Pr21MerchantStageCompletionMutationResult>;

  readPr21StageCompletionPostcondition(input: {
    readonly schemaVersion: 1;
    readonly stage: "PR21";
    readonly nextStage: "PR22";
    readonly transactionFingerprint: string;
  }): Promise<Pr21MerchantStageCompletionPostcondition>;
}

export interface Pr21MerchantStageCompletionRecordBasis {
  readonly schemaVersion: 1;
  readonly status: "APPLIED_VERIFIED_STAGE_TRANSITION_RECORD_ONLY";
  readonly stage: "PR21";
  readonly nextStage: "PR22";
  readonly authorizationId: string;
  readonly transactionId: string;
  readonly transactionFingerprint: string;
  readonly transitionFingerprint: string;
  readonly settlementFingerprint: string;
  readonly ledgerFingerprint: string;
  readonly sourceMainCommit: string;
  readonly durableIntentId: string;
  readonly appliedAtMs: number;
  readonly pr21StageCompletionApplied: true;
  readonly pr22DevelopmentStageActivated: true;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly controlPlaneMutationOnly: true;
  readonly roadmapMutationPerformed: false;
  readonly ledgerMutationPerformed: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
}

export interface Pr21MerchantStageCompletionRecord
  extends Pr21MerchantStageCompletionRecordBasis {
  readonly completionFingerprint: string;
}

export interface Pr21MerchantStageCompletionExecutionRequest {
  readonly schemaVersion: 1;
  readonly authorization:
    Pr21MerchantStageCompletionExecutionAuthorizationRecord;
  readonly transaction: Pr21MerchantStageCompletionApplyTransaction;
  readonly currentMainCommit: string;
  readonly currentTransactionFingerprint: string;
  readonly currentTransitionFingerprint: string;
  readonly executionAtMs: number;
  readonly restartSinceAuthorization: boolean;
  readonly durableIntentWriter:
    Pr21MerchantStageCompletionDurableIntentWriter;
  readonly controlPlaneAdapter:
    Pr21MerchantStageCompletionControlPlaneAdapter;
}

export interface Pr21MerchantStageCompletionExecutionResult {
  readonly schemaVersion: 1;
  readonly status:
    | "APPLIED_VERIFIED_STAGE_TRANSITION_RECORD_ONLY"
    | "BLOCKIERT_PRECHECK"
    | "BLOCKIERT_RECONCILIATION_REQUIRED";
  readonly blocker: readonly string[];
  readonly stage: "PR21";
  readonly nextStage: "PR22";
  readonly authorizationId: string;
  readonly transactionId: string;
  readonly transactionFingerprint: string;
  readonly authorizationConsumed: boolean;
  readonly durableIntentPersisted: boolean;
  readonly mutationAttemptObserved: boolean;
  readonly stageMutationPerformed: boolean;
  readonly pr21StageCompletionApplied: boolean;
  readonly pr22DevelopmentStageActivated: boolean;
  readonly pr22ProductiveAuthorityIssued: false;
  readonly controlPlaneMutationOnly: true;
  readonly completionRecord: Pr21MerchantStageCompletionRecord | null;
  readonly sameIntentRetryAllowed: false;
  readonly blindResumeAfterRestartAllowed: false;
  readonly roadmapMutationPerformed: false;
  readonly ledgerMutationPerformed: false;
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

function transactionBasis(
  tx: Pr21MerchantStageCompletionApplyTransaction,
): Pr21MerchantStageCompletionApplyTransactionBasis {
  return Object.freeze({
    schemaVersion: tx.schemaVersion,
    status: tx.status,
    transactionId: tx.transactionId,
    operationKey: tx.operationKey,
    stage: tx.stage,
    nextStage: tx.nextStage,
    sourceMainCommit: tx.sourceMainCommit,
    transitionFingerprint: tx.transitionFingerprint,
    settlementFingerprint: tx.settlementFingerprint,
    ledgerFingerprint: tx.ledgerFingerprint,
    preparedAtMs: tx.preparedAtMs,
    freshMainCheckRequiredAtExecution: tx.freshMainCheckRequiredAtExecution,
    transitionFingerprintRecheckRequiredAtExecution:
      tx.transitionFingerprintRecheckRequiredAtExecution,
    durableIntentRequiredBeforeMutation: tx.durableIntentRequiredBeforeMutation,
    oneShotExecutionRequired: tx.oneShotExecutionRequired,
    sameIntentRetryAllowed: tx.sameIntentRetryAllowed,
    postconditionVerificationRequired: tx.postconditionVerificationRequired,
    unknownOutcomeRequiresReconciliation:
      tx.unknownOutcomeRequiresReconciliation,
    stageCompletionAdapterInstalled: tx.stageCompletionAdapterInstalled,
    executionEnabled: tx.executionEnabled,
    pr21StageCompletionApplied: tx.pr21StageCompletionApplied,
    pr22DevelopmentStageActivated: tx.pr22DevelopmentStageActivated,
    pr22ProductiveAuthorityIssued: tx.pr22ProductiveAuthorityIssued,
    roadmapMutationPerformed: tx.roadmapMutationPerformed,
    ledgerMutationPerformed: tx.ledgerMutationPerformed,
    stageMutationPerformed: tx.stageMutationPerformed,
    authorityIssued: tx.authorityIssued,
    gameplayAuthority: tx.gameplayAuthority,
    rawWriteAuthority: tx.rawWriteAuthority,
    broadRuntimeGrant: tx.broadRuntimeGrant,
    normalRuntimeAllowed: tx.normalRuntimeAllowed,
  });
}

function blocked(
  request: Pr21MerchantStageCompletionExecutionRequest,
  blocker: readonly string[],
): Pr21MerchantStageCompletionExecutionResult {
  return Object.freeze({
    schemaVersion: 1,
    status: "BLOCKIERT_PRECHECK",
    blocker: Object.freeze([...new Set(blocker)]),
    stage: STAGE,
    nextStage: NEXT_STAGE,
    authorizationId: request.authorization.authorizationId,
    transactionId: request.transaction.transactionId,
    transactionFingerprint: request.transaction.transactionFingerprint,
    authorizationConsumed: false,
    durableIntentPersisted: false,
    mutationAttemptObserved: false,
    stageMutationPerformed: false,
    pr21StageCompletionApplied: false,
    pr22DevelopmentStageActivated: false,
    pr22ProductiveAuthorityIssued: false,
    controlPlaneMutationOnly: true,
    completionRecord: null,
    sameIntentRetryAllowed: false,
    blindResumeAfterRestartAllowed: false,
    roadmapMutationPerformed: false,
    ledgerMutationPerformed: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
  });
}

function reconciliationRequired(
  request: Pr21MerchantStageCompletionExecutionRequest,
  durableIntentPersisted: boolean,
  mutationAttemptObserved: boolean,
  blocker: readonly string[],
): Pr21MerchantStageCompletionExecutionResult {
  return Object.freeze({
    schemaVersion: 1,
    status: "BLOCKIERT_RECONCILIATION_REQUIRED",
    blocker: Object.freeze([
      "PR21_MERCHANT_STAGE_COMPLETION_RECONCILIATION_REQUIRED",
      ...new Set(blocker),
    ]),
    stage: STAGE,
    nextStage: NEXT_STAGE,
    authorizationId: request.authorization.authorizationId,
    transactionId: request.transaction.transactionId,
    transactionFingerprint: request.transaction.transactionFingerprint,
    authorizationConsumed: true,
    durableIntentPersisted,
    mutationAttemptObserved,
    stageMutationPerformed: false,
    pr21StageCompletionApplied: false,
    pr22DevelopmentStageActivated: false,
    pr22ProductiveAuthorityIssued: false,
    controlPlaneMutationOnly: true,
    completionRecord: null,
    sameIntentRetryAllowed: false,
    blindResumeAfterRestartAllowed: false,
    roadmapMutationPerformed: false,
    ledgerMutationPerformed: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
  });
}

export async function fuehrePr21MerchantStageCompletionEinmalAus(
  request: Pr21MerchantStageCompletionExecutionRequest,
): Promise<Pr21MerchantStageCompletionExecutionResult> {
  if (request.schemaVersion !== 1) {
    throw new Error("PR21_MERCHANT_STAGE_COMPLETION_EXEC_SCHEMA_UNGUELTIG");
  }
  sha40(
    request.currentMainCommit,
    "PR21_MERCHANT_STAGE_COMPLETION_EXEC_MAIN_UNGUELTIG",
  );
  fp16(
    request.currentTransactionFingerprint,
    "PR21_MERCHANT_STAGE_COMPLETION_EXEC_CURRENT_TX_FP_UNGUELTIG",
  );
  fp16(
    request.currentTransitionFingerprint,
    "PR21_MERCHANT_STAGE_COMPLETION_EXEC_CURRENT_TRANSITION_FP_UNGUELTIG",
  );
  time(
    request.executionAtMs,
    "PR21_MERCHANT_STAGE_COMPLETION_EXEC_ZEIT_UNGUELTIG",
  );

  const auth = request.authorization;
  const tx = request.transaction;
  const blocker: string[] = [];

  if (auth.schemaVersion !== 1
      || auth.status !== "AUTHORIZED_STAGE_COMPLETION_ONE_SHOT_RECORD_ONLY"
      || auth.stage !== STAGE
      || auth.nextStage !== NEXT_STAGE
      || auth.stageCompletionExecutionAuthorizationIssued !== true
      || auth.authorizationConsumed !== false
      || auth.maximumUses !== 1
      || auth.oneShotExecutionRequired !== true
      || auth.sameIntentRetryAllowed !== false
      || auth.durableIntentRequiredBeforeMutation !== true
      || auth.postconditionVerificationRequired !== true
      || auth.unknownOutcomeRequiresReconciliation !== true
      || auth.freshMainCheckRequiredAtExecution !== true
      || auth.transactionFingerprintRecheckRequiredAtExecution !== true
      || auth.transitionFingerprintRecheckRequiredAtExecution !== true
      || auth.stageCompletionAdapterInstalled !== false
      || auth.executionEnabled !== false
      || auth.executionPerformed !== false
      || auth.pr21StageCompletionApplied !== false
      || auth.pr22DevelopmentStageActivated !== false
      || auth.pr22ProductiveAuthorityIssued !== false
      || auth.roadmapMutationPerformed !== false
      || auth.ledgerMutationPerformed !== false
      || auth.stageMutationPerformed !== false
      || auth.gameplayAuthority !== false
      || auth.rawWriteAuthority !== false
      || auth.broadRuntimeGrant !== false
      || auth.normalRuntimeAllowed !== false) {
    blocker.push("PR21_MERCHANT_STAGE_COMPLETION_EXEC_AUTHORIZATION_UNGUELTIG");
  }

  if (request.restartSinceAuthorization) {
    blocker.push(
      "PR21_MERCHANT_STAGE_COMPLETION_EXEC_RESTART_REQUIRES_RECONCILIATION",
    );
  }
  if (request.executionAtMs < auth.authorizedAtMs
      || request.executionAtMs > auth.expiresAtMs) {
    blocker.push(
      "PR21_MERCHANT_STAGE_COMPLETION_EXEC_AUTHORIZATION_ABGELAUFEN",
    );
  }

  const transactionFingerprintMatchesBasis =
    evidenceFingerprint(transactionBasis(tx)) === tx.transactionFingerprint;

  if (tx.schemaVersion !== 1
      || tx.status !== "PREPARED_STAGE_COMPLETION_DEFAULT_OFF"
      || tx.stage !== STAGE
      || tx.nextStage !== NEXT_STAGE
      || tx.transactionId !== auth.transactionId
      || tx.operationKey !== auth.operationKey
      || tx.transactionFingerprint !== auth.transactionFingerprint
      || tx.sourceMainCommit !== auth.sourceMainCommit
      || tx.transitionFingerprint !== auth.transitionFingerprint
      || tx.settlementFingerprint !== auth.settlementFingerprint
      || tx.ledgerFingerprint !== auth.ledgerFingerprint
      || tx.freshMainCheckRequiredAtExecution !== true
      || tx.transitionFingerprintRecheckRequiredAtExecution !== true
      || tx.durableIntentRequiredBeforeMutation !== true
      || tx.oneShotExecutionRequired !== true
      || tx.sameIntentRetryAllowed !== false
      || tx.postconditionVerificationRequired !== true
      || tx.unknownOutcomeRequiresReconciliation !== true
      || tx.stageCompletionAdapterInstalled !== false
      || tx.executionEnabled !== false
      || tx.pr21StageCompletionApplied !== false
      || tx.pr22DevelopmentStageActivated !== false
      || tx.pr22ProductiveAuthorityIssued !== false
      || tx.roadmapMutationPerformed !== false
      || tx.ledgerMutationPerformed !== false
      || tx.stageMutationPerformed !== false
      || tx.authorityIssued !== false
      || tx.gameplayAuthority !== false
      || tx.rawWriteAuthority !== false
      || tx.broadRuntimeGrant !== false
      || tx.normalRuntimeAllowed !== false
      || !transactionFingerprintMatchesBasis) {
    blocker.push("PR21_MERCHANT_STAGE_COMPLETION_EXEC_AUTH_TX_BINDING_DRIFT");
  }

  if (request.currentMainCommit !== auth.sourceMainCommit) {
    blocker.push("PR21_MERCHANT_STAGE_COMPLETION_EXEC_MAIN_STALE");
  }
  if (request.currentTransactionFingerprint !== auth.transactionFingerprint
      || request.currentTransactionFingerprint !== tx.transactionFingerprint) {
    blocker.push("PR21_MERCHANT_STAGE_COMPLETION_EXEC_TRANSACTION_FP_STALE");
  }
  if (request.currentTransitionFingerprint !== auth.transitionFingerprint
      || request.currentTransitionFingerprint !== tx.transitionFingerprint) {
    blocker.push("PR21_MERCHANT_STAGE_COMPLETION_EXEC_TRANSITION_FP_STALE");
  }

  if (blocker.length > 0) {
    return blocked(request, blocker);
  }

  let receipt: Pr21MerchantStageCompletionDurableIntentReceipt;
  try {
    receipt =
      await request.durableIntentWriter.persistPr21MerchantStageCompletionIntent(
        Object.freeze({
          schemaVersion: 1,
          stage: STAGE,
          nextStage: NEXT_STAGE,
          authorizationId: auth.authorizationId,
          transactionId: tx.transactionId,
          operationKey: tx.operationKey,
          transactionFingerprint: tx.transactionFingerprint,
          transitionFingerprint: tx.transitionFingerprint,
          settlementFingerprint: tx.settlementFingerprint,
          ledgerFingerprint: tx.ledgerFingerprint,
          sourceMainCommit: tx.sourceMainCommit,
          requestedAtMs: request.executionAtMs,
        }),
      );
  } catch {
    return blocked(request, [
      "PR21_MERCHANT_STAGE_COMPLETION_EXEC_DURABLE_INTENT_PERSIST_FAILED",
    ]);
  }

  const receiptValid =
    receipt.schemaVersion === 1
    && receipt.authorizationId === auth.authorizationId
    && receipt.transactionId === tx.transactionId
    && receipt.operationKey === tx.operationKey
    && receipt.transactionFingerprint === tx.transactionFingerprint
    && Number.isSafeInteger(receipt.persistedAtMs)
    && receipt.persistedAtMs >= request.executionAtMs
    && receipt.persistedAtMs <= auth.expiresAtMs
    && receipt.durableIntentId.trim().length > 0
    && receipt.durableIntentId.length <= 192;

  if (!receiptValid) {
    return reconciliationRequired(
      request,
      true,
      false,
      ["PR21_MERCHANT_STAGE_COMPLETION_EXEC_DURABLE_INTENT_RECEIPT_UNGUELTIG"],
    );
  }
  if (receipt.status === "ALREADY_PERSISTED_RECONCILIATION_REQUIRED") {
    return reconciliationRequired(
      request,
      true,
      false,
      ["PR21_MERCHANT_STAGE_COMPLETION_EXEC_DURABLE_INTENT_BEREITS_VORHANDEN"],
    );
  }
  if (receipt.status !== "PERSISTED_NEW") {
    throw new Error(
      "PR21_MERCHANT_STAGE_COMPLETION_EXEC_DURABLE_INTENT_STATUS_UNBEKANNT",
    );
  }

  let mutation: Pr21MerchantStageCompletionMutationResult = Object.freeze({
    schemaVersion: 1,
    outcome: "UNKNOWN",
    mutationAttempted: true,
    terminalMutationRecordPersisted: false,
  });
  try {
    mutation = await request.controlPlaneAdapter.applyPr21StageCompletion(
      Object.freeze({
        schemaVersion: 1,
        stage: STAGE,
        nextStage: NEXT_STAGE,
        transactionId: tx.transactionId,
        operationKey: tx.operationKey,
        transactionFingerprint: tx.transactionFingerprint,
        transitionFingerprint: tx.transitionFingerprint,
        authorizationId: auth.authorizationId,
        durableIntentId: receipt.durableIntentId,
      }),
    );
  } catch {
    mutation = Object.freeze({
      schemaVersion: 1,
      outcome: "UNKNOWN",
      mutationAttempted: true,
      terminalMutationRecordPersisted: false,
    });
  }

  let postcondition: Pr21MerchantStageCompletionPostcondition = Object.freeze({
    schemaVersion: 1,
    status: "UNKNOWN",
    stage: STAGE,
    nextStage: NEXT_STAGE,
    transactionFingerprint: null,
    pr21StageCompletionApplied: false,
    pr22DevelopmentStageActivated: false,
    pr22ProductiveAuthorityIssued: false,
    observedAtMs: request.executionAtMs,
  });
  try {
    postcondition =
      await request.controlPlaneAdapter.readPr21StageCompletionPostcondition(
        Object.freeze({
          schemaVersion: 1,
          stage: STAGE,
          nextStage: NEXT_STAGE,
          transactionFingerprint: tx.transactionFingerprint,
        }),
      );
  } catch {
    postcondition = Object.freeze({
      schemaVersion: 1,
      status: "UNKNOWN",
      stage: STAGE,
      nextStage: NEXT_STAGE,
      transactionFingerprint: null,
      pr21StageCompletionApplied: false,
      pr22DevelopmentStageActivated: false,
      pr22ProductiveAuthorityIssued: false,
      observedAtMs: request.executionAtMs,
    });
  }

  const postconditionVerified =
    postcondition.schemaVersion === 1
    && postcondition.status === "APPLIED"
    && postcondition.stage === STAGE
    && postcondition.nextStage === NEXT_STAGE
    && postcondition.transactionFingerprint === tx.transactionFingerprint
    && postcondition.pr21StageCompletionApplied === true
    && postcondition.pr22DevelopmentStageActivated === true
    && postcondition.pr22ProductiveAuthorityIssued === false
    && Number.isSafeInteger(postcondition.observedAtMs)
    && postcondition.observedAtMs >= request.executionAtMs;

  const terminalMutationRecordObserved =
    mutation.schemaVersion === 1
    && mutation.mutationAttempted === true
    && mutation.terminalMutationRecordPersisted === true;

  if (!postconditionVerified || !terminalMutationRecordObserved) {
    const reasons: string[] = [];
    if (!postconditionVerified) {
      reasons.push(
        "PR21_MERCHANT_STAGE_COMPLETION_EXEC_POSTCONDITION_NICHT_VERIFIZIERT",
      );
    }
    if (!terminalMutationRecordObserved) {
      reasons.push(
        "PR21_MERCHANT_STAGE_COMPLETION_EXEC_TERMINAL_RECORD_FEHLT",
      );
    }
    return reconciliationRequired(request, true, true, reasons);
  }

  const basis: Pr21MerchantStageCompletionRecordBasis = Object.freeze({
    schemaVersion: 1,
    status: "APPLIED_VERIFIED_STAGE_TRANSITION_RECORD_ONLY",
    stage: STAGE,
    nextStage: NEXT_STAGE,
    authorizationId: auth.authorizationId,
    transactionId: tx.transactionId,
    transactionFingerprint: tx.transactionFingerprint,
    transitionFingerprint: tx.transitionFingerprint,
    settlementFingerprint: tx.settlementFingerprint,
    ledgerFingerprint: tx.ledgerFingerprint,
    sourceMainCommit: tx.sourceMainCommit,
    durableIntentId: receipt.durableIntentId,
    appliedAtMs: postcondition.observedAtMs,
    pr21StageCompletionApplied: true,
    pr22DevelopmentStageActivated: true,
    pr22ProductiveAuthorityIssued: false,
    controlPlaneMutationOnly: true,
    roadmapMutationPerformed: false,
    ledgerMutationPerformed: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
  });
  const completionRecord: Pr21MerchantStageCompletionRecord = Object.freeze({
    ...basis,
    completionFingerprint: evidenceFingerprint(basis),
  });

  return Object.freeze({
    schemaVersion: 1,
    status: "APPLIED_VERIFIED_STAGE_TRANSITION_RECORD_ONLY",
    blocker: Object.freeze([]),
    stage: STAGE,
    nextStage: NEXT_STAGE,
    authorizationId: auth.authorizationId,
    transactionId: tx.transactionId,
    transactionFingerprint: tx.transactionFingerprint,
    authorizationConsumed: true,
    durableIntentPersisted: true,
    mutationAttemptObserved: true,
    stageMutationPerformed: true,
    pr21StageCompletionApplied: true,
    pr22DevelopmentStageActivated: true,
    pr22ProductiveAuthorityIssued: false,
    controlPlaneMutationOnly: true,
    completionRecord,
    sameIntentRetryAllowed: false,
    blindResumeAfterRestartAllowed: false,
    roadmapMutationPerformed: false,
    ledgerMutationPerformed: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
  });
}
