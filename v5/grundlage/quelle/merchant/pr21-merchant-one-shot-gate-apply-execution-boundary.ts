import {
  validierePr21_28GateApplyTransaktion,
  type Pr21_28GateApplyTransaction,
} from "../runtime/pr21-28-gate-apply-transaction.js";
import {
  reconcilePr21_28GateApply,
  type Pr21_28GateApplyReconciliation,
} from "../runtime/pr21-28-gate-apply-reconciliation.js";
import {
  recordPr21_28GateSettlement,
  type Pr21_28GateSettlement,
} from "../runtime/pr21-28-gate-settlement-rollback.js";
import type {
  Pr21MerchantApplyExecutionAuthorizationRecord,
} from "./pr21-merchant-apply-execution-authorization-boundary.js";

export interface Pr21MerchantGateApplyDurableIntentInput {
  readonly schemaVersion: 1;
  readonly stage: "PR21";
  readonly authorizationId: string;
  readonly transactionId: string;
  readonly operationKey: string;
  readonly transactionFingerprint: string;
  readonly sourceMainCommit: string;
  readonly packageFingerprint: string;
  readonly ratificationFingerprint: string;
  readonly requestedAtMs: number;
}

export interface Pr21MerchantGateApplyDurableIntentReceipt {
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

export interface Pr21MerchantGateApplyDurableIntentWriter {
  persistPr21MerchantGateApplyIntent(
    input: Pr21MerchantGateApplyDurableIntentInput,
  ): Promise<Pr21MerchantGateApplyDurableIntentReceipt>;
}

export interface Pr21MerchantGateApplyMutationResult {
  readonly schemaVersion: 1;
  readonly outcome: "APPLIED" | "NOT_APPLIED" | "UNKNOWN";
  readonly mutationAttempted: true;
  readonly terminalMutationRecordPersisted: boolean;
}

export interface Pr21MerchantGateApplyPostcondition {
  readonly schemaVersion: 1;
  readonly status: "APPLIED" | "NOT_APPLIED" | "UNKNOWN";
  readonly stage: "PR21";
  readonly transactionFingerprint: string | null;
  readonly observedAtMs: number;
}

export interface Pr21MerchantGateApplyControlPlaneAdapter {
  applyPr21MerchantIntegrationGate(input: {
    readonly schemaVersion: 1;
    readonly stage: "PR21";
    readonly transactionId: string;
    readonly operationKey: string;
    readonly transactionFingerprint: string;
    readonly authorizationId: string;
    readonly durableIntentId: string;
  }): Promise<Pr21MerchantGateApplyMutationResult>;

  readPr21MerchantIntegrationGatePostcondition(input: {
    readonly schemaVersion: 1;
    readonly stage: "PR21";
    readonly transactionFingerprint: string;
  }): Promise<Pr21MerchantGateApplyPostcondition>;
}

export interface Pr21MerchantGateApplyExecutionRequest {
  readonly schemaVersion: 1;
  readonly authorization: Pr21MerchantApplyExecutionAuthorizationRecord;
  readonly transaction: Pr21_28GateApplyTransaction;
  readonly currentMainCommit: string;
  readonly currentTransactionFingerprint: string;
  readonly executionAtMs: number;
  readonly restartSinceAuthorization: boolean;
  readonly durableIntentWriter: Pr21MerchantGateApplyDurableIntentWriter;
  readonly controlPlaneAdapter: Pr21MerchantGateApplyControlPlaneAdapter;
}

export interface Pr21MerchantGateApplyExecutionResult {
  readonly schemaVersion: 1;
  readonly status:
    | "APPLIED_VERIFIED_RECORD_ONLY"
    | "BLOCKIERT_PRECHECK"
    | "BLOCKIERT_RECONCILIATION_REQUIRED";
  readonly blocker: readonly string[];
  readonly stage: "PR21";
  readonly authorizationId: string;
  readonly transactionId: string;
  readonly transactionFingerprint: string;
  readonly authorizationConsumed: boolean;
  readonly durableIntentPersisted: boolean;
  readonly mutationAttemptObserved: boolean;
  readonly gateMutationPerformed: boolean;
  readonly controlPlaneMutationOnly: true;
  readonly settlement: Pr21_28GateSettlement | null;
  readonly reconciliation: Pr21_28GateApplyReconciliation | null;
  readonly sameIntentRetryAllowed: false;
  readonly blindResumeAfterRestartAllowed: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
}

const STAGE = "PR21" as const;

function sha40(value: string, error: string): void {
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error(error);
}

function fp16(value: string, error: string): void {
  if (!/^[0-9a-f]{16}$/.test(value)) throw new Error(error);
}

function time(value: number, error: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(error);
}

function blocked(
  request: Pr21MerchantGateApplyExecutionRequest,
  blocker: readonly string[],
): Pr21MerchantGateApplyExecutionResult {
  return Object.freeze({
    schemaVersion: 1,
    status: "BLOCKIERT_PRECHECK",
    blocker: Object.freeze([...new Set(blocker)]),
    stage: STAGE,
    authorizationId: request.authorization.authorizationId,
    transactionId: request.transaction.transactionId,
    transactionFingerprint: request.transaction.transactionFingerprint,
    authorizationConsumed: false,
    durableIntentPersisted: false,
    mutationAttemptObserved: false,
    gateMutationPerformed: false,
    controlPlaneMutationOnly: true,
    settlement: null,
    reconciliation: null,
    sameIntentRetryAllowed: false,
    blindResumeAfterRestartAllowed: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
  });
}

function reconciliationResult(
  request: Pr21MerchantGateApplyExecutionRequest,
  durableIntentPersisted: boolean,
  mutationAttemptObserved: boolean,
  reconciliation: Pr21_28GateApplyReconciliation,
): Pr21MerchantGateApplyExecutionResult {
  return Object.freeze({
    schemaVersion: 1,
    status: "BLOCKIERT_RECONCILIATION_REQUIRED",
    blocker: Object.freeze([
      "PR21_MERCHANT_GATE_APPLY_RECONCILIATION_REQUIRED",
      ...reconciliation.blocker,
    ]),
    stage: STAGE,
    authorizationId: request.authorization.authorizationId,
    transactionId: request.transaction.transactionId,
    transactionFingerprint: request.transaction.transactionFingerprint,
    authorizationConsumed: true,
    durableIntentPersisted,
    mutationAttemptObserved,
    gateMutationPerformed: false,
    controlPlaneMutationOnly: true,
    settlement: null,
    reconciliation,
    sameIntentRetryAllowed: false,
    blindResumeAfterRestartAllowed: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
  });
}

export async function fuehrePr21MerchantGateApplyEinmalAus(
  request: Pr21MerchantGateApplyExecutionRequest,
): Promise<Pr21MerchantGateApplyExecutionResult> {
  if (request.schemaVersion !== 1) {
    throw new Error("PR21_MERCHANT_GATE_APPLY_EXEC_SCHEMA_UNGUELTIG");
  }
  sha40(request.currentMainCommit, "PR21_MERCHANT_GATE_APPLY_EXEC_MAIN_UNGUELTIG");
  fp16(
    request.currentTransactionFingerprint,
    "PR21_MERCHANT_GATE_APPLY_EXEC_CURRENT_TX_FP_UNGUELTIG",
  );
  time(request.executionAtMs, "PR21_MERCHANT_GATE_APPLY_EXEC_ZEIT_UNGUELTIG");

  const auth = request.authorization;
  const tx = request.transaction;
  const blocker: string[] = [];

  if (auth.schemaVersion !== 1
      || auth.status !== "AUTHORIZED_ONE_SHOT_RECORD_ONLY"
      || auth.stage !== STAGE
      || auth.applyExecutionAuthorizationIssued !== true
      || auth.authorizationConsumed !== false
      || auth.maximumUses !== 1
      || auth.oneShotExecutionRequired !== true
      || auth.sameIntentRetryAllowed !== false
      || auth.durableIntentRequiredBeforeMutation !== true
      || auth.postconditionVerificationRequired !== true
      || auth.unknownOutcomeRequiresReconciliation !== true
      || auth.freshMainCheckRequiredAtExecution !== true
      || auth.transactionFingerprintRecheckRequiredAtExecution !== true
      || auth.gameplayAuthority !== false
      || auth.rawWriteAuthority !== false
      || auth.broadRuntimeGrant !== false
      || auth.normalRuntimeAllowed !== false) {
    blocker.push("PR21_MERCHANT_GATE_APPLY_EXEC_AUTHORIZATION_UNGUELTIG");
  }
  if (request.restartSinceAuthorization) {
    blocker.push("PR21_MERCHANT_GATE_APPLY_EXEC_RESTART_REQUIRES_RECONCILIATION");
  }
  if (request.executionAtMs < auth.authorizedAtMs
      || request.executionAtMs > auth.expiresAtMs) {
    blocker.push("PR21_MERCHANT_GATE_APPLY_EXEC_AUTHORIZATION_ABGELAUFEN");
  }
  if (tx.stage !== STAGE
      || tx.transactionId !== auth.transactionId
      || tx.operationKey !== auth.operationKey
      || tx.transactionFingerprint !== auth.transactionFingerprint
      || tx.sourceMainCommit !== auth.sourceMainCommit
      || tx.packageFingerprint !== auth.packageFingerprint
      || tx.ratificationFingerprint !== auth.ratificationFingerprint) {
    blocker.push("PR21_MERCHANT_GATE_APPLY_EXEC_AUTH_TX_BINDING_DRIFT");
  }
  if (request.currentMainCommit !== auth.sourceMainCommit) {
    blocker.push("PR21_MERCHANT_GATE_APPLY_EXEC_MAIN_STALE");
  }
  if (request.currentTransactionFingerprint !== auth.transactionFingerprint
      || request.currentTransactionFingerprint !== tx.transactionFingerprint) {
    blocker.push("PR21_MERCHANT_GATE_APPLY_EXEC_TRANSACTION_FP_STALE");
  }

  const validation = validierePr21_28GateApplyTransaktion(
    tx,
    request.currentMainCommit,
    STAGE,
    auth.packageFingerprint,
    auth.ratificationFingerprint,
  );
  if (validation.status !== "READY_DEFAULT_OFF") {
    blocker.push(...validation.blocker);
  }

  if (blocker.length > 0) {
    return blocked(request, blocker);
  }

  let receipt: Pr21MerchantGateApplyDurableIntentReceipt;
  try {
    receipt = await request.durableIntentWriter.persistPr21MerchantGateApplyIntent(
      Object.freeze({
        schemaVersion: 1,
        stage: STAGE,
        authorizationId: auth.authorizationId,
        transactionId: tx.transactionId,
        operationKey: tx.operationKey,
        transactionFingerprint: tx.transactionFingerprint,
        sourceMainCommit: tx.sourceMainCommit,
        packageFingerprint: tx.packageFingerprint,
        ratificationFingerprint: tx.ratificationFingerprint,
        requestedAtMs: request.executionAtMs,
      }),
    );
  } catch {
    return blocked(request, [
      "PR21_MERCHANT_GATE_APPLY_EXEC_DURABLE_INTENT_PERSIST_FAILED",
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
    const reconciliation = reconcilePr21_28GateApply({
      schemaVersion: 1,
      transaction: tx,
      observedState: "UNKNOWN",
      mutationAttemptObserved: true,
      durableIntentObserved: true,
      terminalSettlementObserved: false,
    });
    return reconciliationResult(request, true, false, reconciliation);
  }

  if (receipt.status === "ALREADY_PERSISTED_RECONCILIATION_REQUIRED") {
    const reconciliation = reconcilePr21_28GateApply({
      schemaVersion: 1,
      transaction: tx,
      observedState: "UNKNOWN",
      mutationAttemptObserved: true,
      durableIntentObserved: true,
      terminalSettlementObserved: false,
    });
    return reconciliationResult(request, true, false, reconciliation);
  }
  if (receipt.status !== "PERSISTED_NEW") {
    throw new Error("PR21_MERCHANT_GATE_APPLY_EXEC_DURABLE_INTENT_STATUS_UNBEKANNT");
  }

  let mutation: Pr21MerchantGateApplyMutationResult = Object.freeze({
    schemaVersion: 1,
    outcome: "UNKNOWN",
    mutationAttempted: true,
    terminalMutationRecordPersisted: false,
  });
  try {
    mutation = await request.controlPlaneAdapter.applyPr21MerchantIntegrationGate(
      Object.freeze({
        schemaVersion: 1,
        stage: STAGE,
        transactionId: tx.transactionId,
        operationKey: tx.operationKey,
        transactionFingerprint: tx.transactionFingerprint,
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

  let postcondition: Pr21MerchantGateApplyPostcondition = Object.freeze({
    schemaVersion: 1,
    status: "UNKNOWN",
    stage: STAGE,
    transactionFingerprint: null,
    observedAtMs: request.executionAtMs,
  });
  try {
    postcondition =
      await request.controlPlaneAdapter.readPr21MerchantIntegrationGatePostcondition(
        Object.freeze({
          schemaVersion: 1,
          stage: STAGE,
          transactionFingerprint: tx.transactionFingerprint,
        }),
      );
  } catch {
    postcondition = Object.freeze({
      schemaVersion: 1,
      status: "UNKNOWN",
      stage: STAGE,
      transactionFingerprint: null,
      observedAtMs: request.executionAtMs,
    });
  }

  const postconditionVerified =
    postcondition.schemaVersion === 1
    && postcondition.status === "APPLIED"
    && postcondition.stage === STAGE
    && postcondition.transactionFingerprint === tx.transactionFingerprint
    && Number.isSafeInteger(postcondition.observedAtMs)
    && postcondition.observedAtMs >= request.executionAtMs;

  const observedState = postconditionVerified
    ? "POSTCONDITION_TRUE"
    : postcondition.status === "NOT_APPLIED"
      ? "POSTCONDITION_FALSE"
      : "UNKNOWN";

  const terminalSettlementObserved =
    mutation.schemaVersion === 1
    && mutation.mutationAttempted === true
    && mutation.terminalMutationRecordPersisted === true;

  const reconciliation = reconcilePr21_28GateApply({
    schemaVersion: 1,
    transaction: tx,
    observedState,
    mutationAttemptObserved: true,
    durableIntentObserved: true,
    terminalSettlementObserved,
  });

  if (!postconditionVerified
      || !terminalSettlementObserved
      || reconciliation.status !== "ALREADY_APPLIED_REQUIRES_RECORD_ONLY") {
    return reconciliationResult(request, true, true, reconciliation);
  }

  const settlement = recordPr21_28GateSettlement(
    tx,
    postcondition.observedAtMs,
    {
      mutationAttemptObserved: true,
      postconditionVerified: true,
      durableIntentObserved: true,
      terminalSettlementObserved: true,
    },
  );

  return Object.freeze({
    schemaVersion: 1,
    status: "APPLIED_VERIFIED_RECORD_ONLY",
    blocker: Object.freeze([]),
    stage: STAGE,
    authorizationId: auth.authorizationId,
    transactionId: tx.transactionId,
    transactionFingerprint: tx.transactionFingerprint,
    authorizationConsumed: true,
    durableIntentPersisted: true,
    mutationAttemptObserved: true,
    gateMutationPerformed: true,
    controlPlaneMutationOnly: true,
    settlement,
    reconciliation,
    sameIntentRetryAllowed: false,
    blindResumeAfterRestartAllowed: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
  });
}
