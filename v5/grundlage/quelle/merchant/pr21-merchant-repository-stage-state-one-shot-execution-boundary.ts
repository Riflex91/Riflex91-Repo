import { evidenceFingerprint } from "../zertifizierung/evidence-kette.js";
import type {
  Pr21MerchantRepositoryStageStateApplyTransaction,
  Pr21MerchantRepositoryStageStateApplyTransactionBasis,
  Pr21MerchantRepositoryStageStateSnapshot,
} from "./pr21-merchant-repository-stage-state-apply-boundary.js";
import type {
  Pr21MerchantRepositoryStageStateExecutionAuthorizationRecord,
} from "./pr21-merchant-repository-stage-state-execution-authorization-boundary.js";

export interface Pr21MerchantRepositoryStageStateDurableIntentInput {
  readonly schemaVersion: 1;
  readonly authorizationId: string;
  readonly transactionId: string;
  readonly operationKey: string;
  readonly transactionFingerprint: string;
  readonly repositoryTransitionFingerprint: string;
  readonly completionFingerprint: string;
  readonly sourceMainCommit: string;
  readonly requestedAtMs: number;
}

export interface Pr21MerchantRepositoryStageStateDurableIntentReceipt {
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

export interface Pr21MerchantRepositoryStageStateDurableIntentWriter {
  persistPr21MerchantRepositoryStageStateIntent(
    input: Pr21MerchantRepositoryStageStateDurableIntentInput,
  ): Promise<Pr21MerchantRepositoryStageStateDurableIntentReceipt>;
}

export interface Pr21MerchantRepositoryStageStateMutationResult {
  readonly schemaVersion: 1;
  readonly outcome: "APPLIED" | "NOT_APPLIED" | "UNKNOWN";
  readonly mutationAttempted: true;
  readonly terminalMutationRecordPersisted: boolean;
}

export interface Pr21MerchantRepositoryStageStatePostcondition {
  readonly schemaVersion: 1;
  readonly status: "APPLIED" | "NOT_APPLIED" | "UNKNOWN";
  readonly transactionFingerprint: string | null;
  readonly currentStage: "PR21" | "PR22";
  readonly currentGate:
    | "PR21_MERCHANT_INTEGRATION"
    | "PR22_MULTI_CHARACTER_COORDINATION";
  readonly pr21StageStatus: "IN_PROGRESS" | "COMPLETE";
  readonly pr22StageStatus: "BLOCKED_BY_PR21" | "IN_PROGRESS";
  readonly pr22ProductiveAuthorityIssued: false;
  readonly observedAtMs: number;
}

export interface Pr21MerchantRepositoryStageStateAdapter {
  applyPr21RepositoryStageStateTransition(input: {
    readonly schemaVersion: 1;
    readonly authorizationId: string;
    readonly transactionId: string;
    readonly operationKey: string;
    readonly transactionFingerprint: string;
    readonly repositoryTransitionFingerprint: string;
    readonly completionFingerprint: string;
    readonly durableIntentId: string;
    readonly requiredCurrentStage: "PR21";
    readonly requiredCurrentGate: "PR21_MERCHANT_INTEGRATION";
    readonly requiredPr21StageStatus: "IN_PROGRESS";
    readonly requiredPr22StageStatus: "BLOCKED_BY_PR21";
    readonly targetPr21StageStatus: "COMPLETE";
    readonly targetPr22StageStatus: "IN_PROGRESS";
    readonly targetCurrentStage: "PR22";
    readonly targetCurrentGate: "PR22_MULTI_CHARACTER_COORDINATION";
  }): Promise<Pr21MerchantRepositoryStageStateMutationResult>;

  readPr21RepositoryStageStatePostcondition(input: {
    readonly schemaVersion: 1;
    readonly transactionFingerprint: string;
  }): Promise<Pr21MerchantRepositoryStageStatePostcondition>;
}

export interface Pr21MerchantRepositoryStageStateExecutionRecordBasis {
  readonly schemaVersion: 1;
  readonly status: "APPLIED_VERIFIED_REPOSITORY_STAGE_STATE_RECORD_ONLY";
  readonly authorizationId: string;
  readonly transactionId: string;
  readonly transactionFingerprint: string;
  readonly repositoryTransitionFingerprint: string;
  readonly completionFingerprint: string;
  readonly sourceMainCommit: string;
  readonly durableIntentId: string;
  readonly appliedAtMs: number;
  readonly pr21StageStatus: "COMPLETE";
  readonly pr22StageStatus: "IN_PROGRESS";
  readonly currentStage: "PR22";
  readonly currentGate: "PR22_MULTI_CHARACTER_COORDINATION";
  readonly pr22ProductiveAuthorityIssued: false;
  readonly repositoryStageStateApplied: true;
  readonly roadmapMutationPerformed: true;
  readonly stageArrayMutationPerformed: true;
  readonly currentStageMutationPerformed: true;
  readonly currentGateMutationPerformed: true;
  readonly controlPlaneMutationPerformed: false;
  readonly authorityIssued: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
}

export interface Pr21MerchantRepositoryStageStateExecutionRecord
  extends Pr21MerchantRepositoryStageStateExecutionRecordBasis {
  readonly repositoryExecutionFingerprint: string;
}

export interface Pr21MerchantRepositoryStageStateExecutionRequest {
  readonly schemaVersion: 1;
  readonly authorization:
    Pr21MerchantRepositoryStageStateExecutionAuthorizationRecord;
  readonly transaction: Pr21MerchantRepositoryStageStateApplyTransaction;
  readonly currentMainCommit: string;
  readonly currentTransactionFingerprint: string;
  readonly currentRepositoryTransitionFingerprint: string;
  readonly currentCompletionFingerprint: string;
  readonly currentRepositoryState: Pr21MerchantRepositoryStageStateSnapshot;
  readonly executionAtMs: number;
  readonly restartSinceAuthorization: boolean;
  readonly durableIntentWriter:
    Pr21MerchantRepositoryStageStateDurableIntentWriter;
  readonly repositoryAdapter: Pr21MerchantRepositoryStageStateAdapter;
}

export interface Pr21MerchantRepositoryStageStateExecutionResult {
  readonly schemaVersion: 1;
  readonly status:
    | "APPLIED_VERIFIED_REPOSITORY_STAGE_STATE_RECORD_ONLY"
    | "BLOCKIERT_PRECHECK"
    | "BLOCKIERT_RECONCILIATION_REQUIRED";
  readonly blocker: readonly string[];
  readonly authorizationId: string;
  readonly transactionId: string;
  readonly transactionFingerprint: string;
  readonly authorizationConsumed: boolean;
  readonly durableIntentPersisted: boolean;
  readonly mutationAttemptObserved: boolean;
  readonly repositoryStageStateApplied: boolean;
  readonly roadmapMutationPerformed: boolean;
  readonly stageArrayMutationPerformed: boolean;
  readonly currentStageMutationPerformed: boolean;
  readonly currentGateMutationPerformed: boolean;
  readonly pr21StageStatus: "IN_PROGRESS" | "COMPLETE";
  readonly pr22StageStatus: "BLOCKED_BY_PR21" | "IN_PROGRESS";
  readonly currentStage: "PR21" | "PR22";
  readonly currentGate:
    | "PR21_MERCHANT_INTEGRATION"
    | "PR22_MULTI_CHARACTER_COORDINATION";
  readonly pr22ProductiveAuthorityIssued: false;
  readonly controlPlaneMutationPerformed: false;
  readonly executionRecord:
    Pr21MerchantRepositoryStageStateExecutionRecord
    | null;
  readonly sameIntentRetryAllowed: false;
  readonly blindResumeAfterRestartAllowed: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
}

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
  tx: Pr21MerchantRepositoryStageStateApplyTransaction,
): Pr21MerchantRepositoryStageStateApplyTransactionBasis {
  return Object.freeze({
    schemaVersion: tx.schemaVersion,
    status: tx.status,
    transactionId: tx.transactionId,
    operationKey: tx.operationKey,
    sourceMainCommit: tx.sourceMainCommit,
    repositoryTransitionFingerprint: tx.repositoryTransitionFingerprint,
    completionFingerprint: tx.completionFingerprint,
    preparedAtMs: tx.preparedAtMs,
    requiredCurrentStage: tx.requiredCurrentStage,
    requiredCurrentGate: tx.requiredCurrentGate,
    requiredPr21StageStatus: tx.requiredPr21StageStatus,
    requiredPr22StageStatus: tx.requiredPr22StageStatus,
    targetPr21StageStatus: tx.targetPr21StageStatus,
    targetPr22StageStatus: tx.targetPr22StageStatus,
    targetCurrentStage: tx.targetCurrentStage,
    targetCurrentGate: tx.targetCurrentGate,
    pr22ProductiveAuthorityIssued: tx.pr22ProductiveAuthorityIssued,
    freshMainCheckRequiredAtExecution: tx.freshMainCheckRequiredAtExecution,
    repositoryTransitionFingerprintRecheckRequiredAtExecution:
      tx.repositoryTransitionFingerprintRecheckRequiredAtExecution,
    completionFingerprintRecheckRequiredAtExecution:
      tx.completionFingerprintRecheckRequiredAtExecution,
    repositoryStateRecheckRequiredAtExecution:
      tx.repositoryStateRecheckRequiredAtExecution,
    durableIntentRequiredBeforeRepositoryMutation:
      tx.durableIntentRequiredBeforeRepositoryMutation,
    oneShotExecutionRequired: tx.oneShotExecutionRequired,
    sameIntentRetryAllowed: tx.sameIntentRetryAllowed,
    postconditionVerificationRequired: tx.postconditionVerificationRequired,
    unknownOutcomeRequiresReconciliation:
      tx.unknownOutcomeRequiresReconciliation,
    repositoryApplyAdapterInstalled: tx.repositoryApplyAdapterInstalled,
    executionEnabled: tx.executionEnabled,
    repositoryStageStateApplied: tx.repositoryStageStateApplied,
    roadmapMutationPerformed: tx.roadmapMutationPerformed,
    stageArrayMutationPerformed: tx.stageArrayMutationPerformed,
    currentStageMutationPerformed: tx.currentStageMutationPerformed,
    currentGateMutationPerformed: tx.currentGateMutationPerformed,
    controlPlaneMutationPerformed: tx.controlPlaneMutationPerformed,
    authorityIssued: tx.authorityIssued,
    gameplayAuthority: tx.gameplayAuthority,
    rawWriteAuthority: tx.rawWriteAuthority,
    broadRuntimeGrant: tx.broadRuntimeGrant,
    normalRuntimeAllowed: tx.normalRuntimeAllowed,
  });
}

function blocked(
  request: Pr21MerchantRepositoryStageStateExecutionRequest,
  blocker: readonly string[],
): Pr21MerchantRepositoryStageStateExecutionResult {
  return Object.freeze({
    schemaVersion: 1,
    status: "BLOCKIERT_PRECHECK",
    blocker: Object.freeze([...new Set(blocker)]),
    authorizationId: request.authorization.authorizationId,
    transactionId: request.transaction.transactionId,
    transactionFingerprint: request.transaction.transactionFingerprint,
    authorizationConsumed: false,
    durableIntentPersisted: false,
    mutationAttemptObserved: false,
    repositoryStageStateApplied: false,
    roadmapMutationPerformed: false,
    stageArrayMutationPerformed: false,
    currentStageMutationPerformed: false,
    currentGateMutationPerformed: false,
    pr21StageStatus: "IN_PROGRESS",
    pr22StageStatus: "BLOCKED_BY_PR21",
    currentStage: "PR21",
    currentGate: "PR21_MERCHANT_INTEGRATION",
    pr22ProductiveAuthorityIssued: false,
    controlPlaneMutationPerformed: false,
    executionRecord: null,
    sameIntentRetryAllowed: false,
    blindResumeAfterRestartAllowed: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
  });
}

function reconciliationRequired(
  request: Pr21MerchantRepositoryStageStateExecutionRequest,
  durableIntentPersisted: boolean,
  mutationAttemptObserved: boolean,
  blocker: readonly string[],
): Pr21MerchantRepositoryStageStateExecutionResult {
  return Object.freeze({
    schemaVersion: 1,
    status: "BLOCKIERT_RECONCILIATION_REQUIRED",
    blocker: Object.freeze([
      "PR21_REPOSITORY_STAGE_EXEC_RECONCILIATION_REQUIRED",
      ...new Set(blocker),
    ]),
    authorizationId: request.authorization.authorizationId,
    transactionId: request.transaction.transactionId,
    transactionFingerprint: request.transaction.transactionFingerprint,
    authorizationConsumed: true,
    durableIntentPersisted,
    mutationAttemptObserved,
    repositoryStageStateApplied: false,
    roadmapMutationPerformed: false,
    stageArrayMutationPerformed: false,
    currentStageMutationPerformed: false,
    currentGateMutationPerformed: false,
    pr21StageStatus: "IN_PROGRESS",
    pr22StageStatus: "BLOCKED_BY_PR21",
    currentStage: "PR21",
    currentGate: "PR21_MERCHANT_INTEGRATION",
    pr22ProductiveAuthorityIssued: false,
    controlPlaneMutationPerformed: false,
    executionRecord: null,
    sameIntentRetryAllowed: false,
    blindResumeAfterRestartAllowed: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
  });
}

export async function fuehrePr21MerchantRepositoryStageStateEinmalAus(
  request: Pr21MerchantRepositoryStageStateExecutionRequest,
): Promise<Pr21MerchantRepositoryStageStateExecutionResult> {
  if (request.schemaVersion !== 1) {
    throw new Error("PR21_REPOSITORY_STAGE_EXEC_SCHEMA_UNGUELTIG");
  }
  sha40(request.currentMainCommit,"PR21_REPOSITORY_STAGE_EXEC_MAIN_UNGUELTIG");
  fp16(
    request.currentTransactionFingerprint,
    "PR21_REPOSITORY_STAGE_EXEC_CURRENT_TX_FP_UNGUELTIG",
  );
  fp16(
    request.currentRepositoryTransitionFingerprint,
    "PR21_REPOSITORY_STAGE_EXEC_CURRENT_TRANSITION_FP_UNGUELTIG",
  );
  fp16(
    request.currentCompletionFingerprint,
    "PR21_REPOSITORY_STAGE_EXEC_CURRENT_COMPLETION_FP_UNGUELTIG",
  );
  time(request.executionAtMs,"PR21_REPOSITORY_STAGE_EXEC_ZEIT_UNGUELTIG");

  const auth = request.authorization;
  const tx = request.transaction;
  const blocker: string[] = [];

  if (auth.schemaVersion !== 1
      || auth.status
        !== "AUTHORIZED_REPOSITORY_STAGE_STATE_ONE_SHOT_RECORD_ONLY"
      || auth.repositoryStageStateExecutionAuthorizationIssued !== true
      || auth.authorizationConsumed !== false
      || auth.maximumUses !== 1
      || auth.requiredCurrentStage !== "PR21"
      || auth.requiredCurrentGate !== "PR21_MERCHANT_INTEGRATION"
      || auth.requiredPr21StageStatus !== "IN_PROGRESS"
      || auth.requiredPr22StageStatus !== "BLOCKED_BY_PR21"
      || auth.targetPr21StageStatus !== "COMPLETE"
      || auth.targetPr22StageStatus !== "IN_PROGRESS"
      || auth.targetCurrentStage !== "PR22"
      || auth.targetCurrentGate !== "PR22_MULTI_CHARACTER_COORDINATION"
      || auth.freshMainCheckRequiredAtExecution !== true
      || auth.transactionFingerprintRecheckRequiredAtExecution !== true
      || auth.repositoryTransitionFingerprintRecheckRequiredAtExecution !== true
      || auth.completionFingerprintRecheckRequiredAtExecution !== true
      || auth.repositoryStateRecheckRequiredAtExecution !== true
      || auth.durableIntentRequiredBeforeRepositoryMutation !== true
      || auth.oneShotExecutionRequired !== true
      || auth.sameIntentRetryAllowed !== false
      || auth.postconditionVerificationRequired !== true
      || auth.unknownOutcomeRequiresReconciliation !== true
      || auth.repositoryApplyAdapterInstalled !== false
      || auth.executionEnabled !== false
      || auth.executionPerformed !== false
      || auth.repositoryStageStateApplied !== false
      || auth.roadmapMutationPerformed !== false
      || auth.stageArrayMutationPerformed !== false
      || auth.currentStageMutationPerformed !== false
      || auth.currentGateMutationPerformed !== false
      || auth.controlPlaneMutationPerformed !== false
      || auth.pr22ProductiveAuthorityIssued !== false
      || auth.gameplayAuthority !== false
      || auth.rawWriteAuthority !== false
      || auth.broadRuntimeGrant !== false
      || auth.normalRuntimeAllowed !== false) {
    blocker.push("PR21_REPOSITORY_STAGE_EXEC_AUTHORIZATION_UNGUELTIG");
  }

  if (request.restartSinceAuthorization) {
    blocker.push("PR21_REPOSITORY_STAGE_EXEC_RESTART_REQUIRES_RECONCILIATION");
  }
  if (request.executionAtMs < auth.authorizedAtMs
      || request.executionAtMs > auth.expiresAtMs) {
    blocker.push("PR21_REPOSITORY_STAGE_EXEC_AUTHORIZATION_ABGELAUFEN");
  }

  const transactionFingerprintMatchesBasis =
    evidenceFingerprint(transactionBasis(tx)) === tx.transactionFingerprint;

  if (tx.schemaVersion !== 1
      || tx.status !== "PREPARED_REPOSITORY_STAGE_STATE_DEFAULT_OFF"
      || tx.transactionId !== auth.transactionId
      || tx.operationKey !== auth.operationKey
      || tx.transactionFingerprint !== auth.transactionFingerprint
      || tx.sourceMainCommit !== auth.sourceMainCommit
      || tx.repositoryTransitionFingerprint
        !== auth.repositoryTransitionFingerprint
      || tx.completionFingerprint !== auth.completionFingerprint
      || tx.requiredCurrentStage !== auth.requiredCurrentStage
      || tx.requiredCurrentGate !== auth.requiredCurrentGate
      || tx.requiredPr21StageStatus !== auth.requiredPr21StageStatus
      || tx.requiredPr22StageStatus !== auth.requiredPr22StageStatus
      || tx.targetPr21StageStatus !== auth.targetPr21StageStatus
      || tx.targetPr22StageStatus !== auth.targetPr22StageStatus
      || tx.targetCurrentStage !== auth.targetCurrentStage
      || tx.targetCurrentGate !== auth.targetCurrentGate
      || tx.freshMainCheckRequiredAtExecution !== true
      || tx.repositoryTransitionFingerprintRecheckRequiredAtExecution !== true
      || tx.completionFingerprintRecheckRequiredAtExecution !== true
      || tx.repositoryStateRecheckRequiredAtExecution !== true
      || tx.durableIntentRequiredBeforeRepositoryMutation !== true
      || tx.oneShotExecutionRequired !== true
      || tx.sameIntentRetryAllowed !== false
      || tx.postconditionVerificationRequired !== true
      || tx.unknownOutcomeRequiresReconciliation !== true
      || tx.repositoryApplyAdapterInstalled !== false
      || tx.executionEnabled !== false
      || tx.repositoryStageStateApplied !== false
      || tx.roadmapMutationPerformed !== false
      || tx.stageArrayMutationPerformed !== false
      || tx.currentStageMutationPerformed !== false
      || tx.currentGateMutationPerformed !== false
      || tx.controlPlaneMutationPerformed !== false
      || tx.authorityIssued !== false
      || tx.pr22ProductiveAuthorityIssued !== false
      || tx.gameplayAuthority !== false
      || tx.rawWriteAuthority !== false
      || tx.broadRuntimeGrant !== false
      || tx.normalRuntimeAllowed !== false
      || !transactionFingerprintMatchesBasis) {
    blocker.push("PR21_REPOSITORY_STAGE_EXEC_AUTH_TX_BINDING_DRIFT");
  }

  if (request.currentMainCommit !== auth.sourceMainCommit) {
    blocker.push("PR21_REPOSITORY_STAGE_EXEC_MAIN_STALE");
  }
  if (request.currentTransactionFingerprint !== auth.transactionFingerprint
      || request.currentTransactionFingerprint !== tx.transactionFingerprint) {
    blocker.push("PR21_REPOSITORY_STAGE_EXEC_TRANSACTION_FP_STALE");
  }
  if (request.currentRepositoryTransitionFingerprint
        !== auth.repositoryTransitionFingerprint
      || request.currentRepositoryTransitionFingerprint
        !== tx.repositoryTransitionFingerprint) {
    blocker.push("PR21_REPOSITORY_STAGE_EXEC_TRANSITION_FP_STALE");
  }
  if (request.currentCompletionFingerprint !== auth.completionFingerprint
      || request.currentCompletionFingerprint !== tx.completionFingerprint) {
    blocker.push("PR21_REPOSITORY_STAGE_EXEC_COMPLETION_FP_STALE");
  }

  const state = request.currentRepositoryState;
  if (state.schemaVersion !== 1
      || state.currentStage !== "PR21"
      || state.currentGate !== "PR21_MERCHANT_INTEGRATION"
      || state.pr21StageStatus !== "IN_PROGRESS"
      || state.pr22StageStatus !== "BLOCKED_BY_PR21") {
    blocker.push("PR21_REPOSITORY_STAGE_EXEC_STATE_DRIFT");
  }

  if (blocker.length > 0) return blocked(request,blocker);

  let receipt: Pr21MerchantRepositoryStageStateDurableIntentReceipt;
  try {
    receipt =
      await request.durableIntentWriter
        .persistPr21MerchantRepositoryStageStateIntent(Object.freeze({
          schemaVersion: 1,
          authorizationId: auth.authorizationId,
          transactionId: tx.transactionId,
          operationKey: tx.operationKey,
          transactionFingerprint: tx.transactionFingerprint,
          repositoryTransitionFingerprint: tx.repositoryTransitionFingerprint,
          completionFingerprint: tx.completionFingerprint,
          sourceMainCommit: tx.sourceMainCommit,
          requestedAtMs: request.executionAtMs,
        }));
  } catch {
    return blocked(request,[
      "PR21_REPOSITORY_STAGE_EXEC_DURABLE_INTENT_PERSIST_FAILED",
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
    return reconciliationRequired(request,true,false,[
      "PR21_REPOSITORY_STAGE_EXEC_DURABLE_INTENT_RECEIPT_UNGUELTIG",
    ]);
  }
  if (receipt.status === "ALREADY_PERSISTED_RECONCILIATION_REQUIRED") {
    return reconciliationRequired(request,true,false,[
      "PR21_REPOSITORY_STAGE_EXEC_DURABLE_INTENT_BEREITS_VORHANDEN",
    ]);
  }
  if (receipt.status !== "PERSISTED_NEW") {
    throw new Error("PR21_REPOSITORY_STAGE_EXEC_DURABLE_INTENT_STATUS_UNBEKANNT");
  }

  let mutation: Pr21MerchantRepositoryStageStateMutationResult = Object.freeze({
    schemaVersion: 1,
    outcome: "UNKNOWN",
    mutationAttempted: true,
    terminalMutationRecordPersisted: false,
  });
  try {
    mutation =
      await request.repositoryAdapter.applyPr21RepositoryStageStateTransition(
        Object.freeze({
          schemaVersion: 1,
          authorizationId: auth.authorizationId,
          transactionId: tx.transactionId,
          operationKey: tx.operationKey,
          transactionFingerprint: tx.transactionFingerprint,
          repositoryTransitionFingerprint: tx.repositoryTransitionFingerprint,
          completionFingerprint: tx.completionFingerprint,
          durableIntentId: receipt.durableIntentId,
          requiredCurrentStage: tx.requiredCurrentStage,
          requiredCurrentGate: tx.requiredCurrentGate,
          requiredPr21StageStatus: tx.requiredPr21StageStatus,
          requiredPr22StageStatus: tx.requiredPr22StageStatus,
          targetPr21StageStatus: tx.targetPr21StageStatus,
          targetPr22StageStatus: tx.targetPr22StageStatus,
          targetCurrentStage: tx.targetCurrentStage,
          targetCurrentGate: tx.targetCurrentGate,
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

  let postcondition: Pr21MerchantRepositoryStageStatePostcondition =
    Object.freeze({
      schemaVersion: 1,
      status: "UNKNOWN",
      transactionFingerprint: null,
      currentStage: "PR21",
      currentGate: "PR21_MERCHANT_INTEGRATION",
      pr21StageStatus: "IN_PROGRESS",
      pr22StageStatus: "BLOCKED_BY_PR21",
      pr22ProductiveAuthorityIssued: false,
      observedAtMs: request.executionAtMs,
    });
  try {
    postcondition =
      await request.repositoryAdapter.readPr21RepositoryStageStatePostcondition(
        Object.freeze({
          schemaVersion: 1,
          transactionFingerprint: tx.transactionFingerprint,
        }),
      );
  } catch {
    postcondition = Object.freeze({
      schemaVersion: 1,
      status: "UNKNOWN",
      transactionFingerprint: null,
      currentStage: "PR21",
      currentGate: "PR21_MERCHANT_INTEGRATION",
      pr21StageStatus: "IN_PROGRESS",
      pr22StageStatus: "BLOCKED_BY_PR21",
      pr22ProductiveAuthorityIssued: false,
      observedAtMs: request.executionAtMs,
    });
  }

  const postconditionVerified =
    postcondition.schemaVersion === 1
    && postcondition.status === "APPLIED"
    && postcondition.transactionFingerprint === tx.transactionFingerprint
    && postcondition.currentStage === "PR22"
    && postcondition.currentGate === "PR22_MULTI_CHARACTER_COORDINATION"
    && postcondition.pr21StageStatus === "COMPLETE"
    && postcondition.pr22StageStatus === "IN_PROGRESS"
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
      reasons.push("PR21_REPOSITORY_STAGE_EXEC_POSTCONDITION_NICHT_VERIFIZIERT");
    }
    if (!terminalMutationRecordObserved) {
      reasons.push("PR21_REPOSITORY_STAGE_EXEC_TERMINAL_RECORD_FEHLT");
    }
    return reconciliationRequired(request,true,true,reasons);
  }

  const basis: Pr21MerchantRepositoryStageStateExecutionRecordBasis =
    Object.freeze({
      schemaVersion: 1,
      status: "APPLIED_VERIFIED_REPOSITORY_STAGE_STATE_RECORD_ONLY",
      authorizationId: auth.authorizationId,
      transactionId: tx.transactionId,
      transactionFingerprint: tx.transactionFingerprint,
      repositoryTransitionFingerprint: tx.repositoryTransitionFingerprint,
      completionFingerprint: tx.completionFingerprint,
      sourceMainCommit: tx.sourceMainCommit,
      durableIntentId: receipt.durableIntentId,
      appliedAtMs: postcondition.observedAtMs,
      pr21StageStatus: "COMPLETE",
      pr22StageStatus: "IN_PROGRESS",
      currentStage: "PR22",
      currentGate: "PR22_MULTI_CHARACTER_COORDINATION",
      pr22ProductiveAuthorityIssued: false,
      repositoryStageStateApplied: true,
      roadmapMutationPerformed: true,
      stageArrayMutationPerformed: true,
      currentStageMutationPerformed: true,
      currentGateMutationPerformed: true,
      controlPlaneMutationPerformed: false,
      authorityIssued: false,
      gameplayAuthority: false,
      rawWriteAuthority: false,
      broadRuntimeGrant: false,
      normalRuntimeAllowed: false,
    });
  const executionRecord: Pr21MerchantRepositoryStageStateExecutionRecord =
    Object.freeze({
      ...basis,
      repositoryExecutionFingerprint: evidenceFingerprint(basis),
    });

  return Object.freeze({
    schemaVersion: 1,
    status: "APPLIED_VERIFIED_REPOSITORY_STAGE_STATE_RECORD_ONLY",
    blocker: Object.freeze([]),
    authorizationId: auth.authorizationId,
    transactionId: tx.transactionId,
    transactionFingerprint: tx.transactionFingerprint,
    authorizationConsumed: true,
    durableIntentPersisted: true,
    mutationAttemptObserved: true,
    repositoryStageStateApplied: true,
    roadmapMutationPerformed: true,
    stageArrayMutationPerformed: true,
    currentStageMutationPerformed: true,
    currentGateMutationPerformed: true,
    pr21StageStatus: "COMPLETE",
    pr22StageStatus: "IN_PROGRESS",
    currentStage: "PR22",
    currentGate: "PR22_MULTI_CHARACTER_COORDINATION",
    pr22ProductiveAuthorityIssued: false,
    controlPlaneMutationPerformed: false,
    executionRecord,
    sameIntentRetryAllowed: false,
    blindResumeAfterRestartAllowed: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
  });
}
