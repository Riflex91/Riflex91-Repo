import type {
  Pr21MerchantDefaultOffApplyBoundary,
} from "./pr21-merchant-default-off-apply-boundary.js";

export interface Pr21MerchantApplyExecutionAuthorizationDraft {
  readonly schemaVersion: 1;
  readonly status: "AWAITING_EXPLICIT_APPLY_AUTHORIZATION";
  readonly stage: "PR21";
  readonly authorizationId: string;
  readonly transactionId: string;
  readonly operationKey: string;
  readonly transactionFingerprint: string;
  readonly sourceMainCommit: string;
  readonly packageFingerprint: string;
  readonly ratificationFingerprint: string;
  readonly issuedAtMs: number;
  readonly expiresAtMs: number;
  readonly maximumUses: 1;
  readonly requiredConfirmationText: string;
  readonly freshMainCheckRequiredAtExecution: true;
  readonly transactionFingerprintRecheckRequiredAtExecution: true;
  readonly durableIntentRequiredBeforeMutation: true;
  readonly oneShotExecutionRequired: true;
  readonly sameIntentRetryAllowed: false;
  readonly postconditionVerificationRequired: true;
  readonly unknownOutcomeRequiresReconciliation: true;
  readonly applyAdapterInstalled: false;
  readonly executionEnabled: false;
  readonly executionPerformed: false;
  readonly gateMutationPerformed: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
}

export interface Pr21MerchantApplyExecutionAuthorizationRecord
  extends Omit<
    Pr21MerchantApplyExecutionAuthorizationDraft,
    "status" | "requiredConfirmationText"
  > {
  readonly status: "AUTHORIZED_ONE_SHOT_RECORD_ONLY";
  readonly operatorId: string;
  readonly authorizedAtMs: number;
  readonly confirmationText: string;
  readonly applyExecutionAuthorizationIssued: true;
  readonly authorizationConsumed: false;
}

const STAGE = "PR21" as const;

function text(value: string, error: string, maximum = 256): void {
  if (value.trim().length === 0 || value.length > maximum) {
    throw new Error(error);
  }
}

function time(value: number, error: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(error);
}

function sha40(value: string, error: string): void {
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error(error);
}

function fp16(value: string, error: string): void {
  if (!/^[0-9a-f]{16}$/.test(value)) throw new Error(error);
}

function validateBoundary(
  boundary: Pr21MerchantDefaultOffApplyBoundary,
): void {
  if (boundary.schemaVersion !== 1
      || boundary.status !== "READY_DEFAULT_OFF"
      || boundary.blocker.length !== 0
      || boundary.stage !== STAGE
      || boundary.transaction === null
      || boundary.validation === null
      || boundary.transaction.status !== "PREPARED_DEFAULT_OFF"
      || boundary.validation.status !== "READY_DEFAULT_OFF"
      || boundary.applyAdapterInstalled !== false
      || boundary.executionEnabled !== false
      || boundary.gateMutationPerformed !== false
      || boundary.authorityIssued !== false
      || boundary.broadRuntimeGrant !== false
      || boundary.gameplayAuthority !== false
      || boundary.rawWriteAuthority !== false
      || boundary.normalRuntimeAllowed !== false
      || boundary.durableIntentCreated !== false
      || boundary.oneShotApplyPreparedButNotExecuted !== true
      || boundary.separateApplyExecutionRequired !== true) {
    throw new Error(
      "PR21_MERCHANT_APPLY_AUTH_DEFAULT_OFF_BOUNDARY_NICHT_BEREIT",
    );
  }
}

export function pr21MerchantApplyAuthorizationConfirmationText(
  transactionFingerprint: string,
  sourceMainCommit: string,
): string {
  fp16(
    transactionFingerprint,
    "PR21_MERCHANT_APPLY_AUTH_TRANSACTION_FP_UNGUELTIG",
  );
  sha40(sourceMainCommit, "PR21_MERCHANT_APPLY_AUTH_MAIN_UNGUELTIG");
  return "AUTHORIZE PR21 GATE APPLY TRANSACTION "
    + transactionFingerprint
    + " MAIN "
    + sourceMainCommit;
}

export function bereitePr21MerchantApplyExecutionAuthorizationVor(
  boundary: Pr21MerchantDefaultOffApplyBoundary,
  authorizationId: string,
  issuedAtMs: number,
  expiresAtMs: number,
): Pr21MerchantApplyExecutionAuthorizationDraft {
  validateBoundary(boundary);
  text(
    authorizationId,
    "PR21_MERCHANT_APPLY_AUTH_ID_UNGUELTIG",
    192,
  );
  time(issuedAtMs, "PR21_MERCHANT_APPLY_AUTH_ISSUED_AT_UNGUELTIG");
  time(expiresAtMs, "PR21_MERCHANT_APPLY_AUTH_EXPIRES_AT_UNGUELTIG");
  if (expiresAtMs < issuedAtMs || expiresAtMs - issuedAtMs > 1_500) {
    throw new Error("PR21_MERCHANT_APPLY_AUTH_TTL_UNGUELTIG");
  }

  const tx = boundary.transaction;
  if (tx === null) {
    throw new Error(
      "PR21_MERCHANT_APPLY_AUTH_DEFAULT_OFF_BOUNDARY_NICHT_BEREIT",
    );
  }
  sha40(tx.sourceMainCommit, "PR21_MERCHANT_APPLY_AUTH_TX_MAIN_UNGUELTIG");
  fp16(
    tx.transactionFingerprint,
    "PR21_MERCHANT_APPLY_AUTH_TX_FP_UNGUELTIG",
  );
  fp16(
    tx.packageFingerprint,
    "PR21_MERCHANT_APPLY_AUTH_PACKAGE_FP_UNGUELTIG",
  );
  fp16(
    tx.ratificationFingerprint,
    "PR21_MERCHANT_APPLY_AUTH_RATIFICATION_FP_UNGUELTIG",
  );

  return Object.freeze({
    schemaVersion: 1,
    status: "AWAITING_EXPLICIT_APPLY_AUTHORIZATION",
    stage: STAGE,
    authorizationId,
    transactionId: tx.transactionId,
    operationKey: tx.operationKey,
    transactionFingerprint: tx.transactionFingerprint,
    sourceMainCommit: tx.sourceMainCommit,
    packageFingerprint: tx.packageFingerprint,
    ratificationFingerprint: tx.ratificationFingerprint,
    issuedAtMs,
    expiresAtMs,
    maximumUses: 1,
    requiredConfirmationText: pr21MerchantApplyAuthorizationConfirmationText(
      tx.transactionFingerprint,
      tx.sourceMainCommit,
    ),
    freshMainCheckRequiredAtExecution: true,
    transactionFingerprintRecheckRequiredAtExecution: true,
    durableIntentRequiredBeforeMutation: true,
    oneShotExecutionRequired: true,
    sameIntentRetryAllowed: false,
    postconditionVerificationRequired: true,
    unknownOutcomeRequiresReconciliation: true,
    applyAdapterInstalled: false,
    executionEnabled: false,
    executionPerformed: false,
    gateMutationPerformed: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
  });
}

export function erteilePr21MerchantApplyExecutionAuthorization(
  draft: Pr21MerchantApplyExecutionAuthorizationDraft,
  confirmationText: string,
  operatorId: string,
  authorizedAtMs: number,
): Pr21MerchantApplyExecutionAuthorizationRecord {
  if (draft.schemaVersion !== 1
      || draft.status !== "AWAITING_EXPLICIT_APPLY_AUTHORIZATION"
      || draft.stage !== STAGE
      || draft.maximumUses !== 1
      || draft.freshMainCheckRequiredAtExecution !== true
      || draft.transactionFingerprintRecheckRequiredAtExecution !== true
      || draft.durableIntentRequiredBeforeMutation !== true
      || draft.oneShotExecutionRequired !== true
      || draft.sameIntentRetryAllowed !== false
      || draft.postconditionVerificationRequired !== true
      || draft.unknownOutcomeRequiresReconciliation !== true
      || draft.applyAdapterInstalled !== false
      || draft.executionEnabled !== false
      || draft.executionPerformed !== false
      || draft.gateMutationPerformed !== false
      || draft.gameplayAuthority !== false
      || draft.rawWriteAuthority !== false
      || draft.broadRuntimeGrant !== false
      || draft.normalRuntimeAllowed !== false) {
    throw new Error("PR21_MERCHANT_APPLY_AUTH_DRAFT_UNGUELTIG");
  }
  if (confirmationText !== draft.requiredConfirmationText) {
    throw new Error("PR21_MERCHANT_APPLY_AUTH_BESTAETIGUNG_UNGUELTIG");
  }
  text(operatorId, "PR21_MERCHANT_APPLY_AUTH_OPERATOR_UNGUELTIG", 192);
  time(authorizedAtMs, "PR21_MERCHANT_APPLY_AUTH_AUTHORIZED_AT_UNGUELTIG");
  if (authorizedAtMs < draft.issuedAtMs || authorizedAtMs > draft.expiresAtMs) {
    throw new Error("PR21_MERCHANT_APPLY_AUTH_ABGELAUFEN");
  }

  return Object.freeze({
    schemaVersion: 1,
    status: "AUTHORIZED_ONE_SHOT_RECORD_ONLY",
    stage: STAGE,
    authorizationId: draft.authorizationId,
    transactionId: draft.transactionId,
    operationKey: draft.operationKey,
    transactionFingerprint: draft.transactionFingerprint,
    sourceMainCommit: draft.sourceMainCommit,
    packageFingerprint: draft.packageFingerprint,
    ratificationFingerprint: draft.ratificationFingerprint,
    issuedAtMs: draft.issuedAtMs,
    expiresAtMs: draft.expiresAtMs,
    maximumUses: 1,
    freshMainCheckRequiredAtExecution: true,
    transactionFingerprintRecheckRequiredAtExecution: true,
    durableIntentRequiredBeforeMutation: true,
    oneShotExecutionRequired: true,
    sameIntentRetryAllowed: false,
    postconditionVerificationRequired: true,
    unknownOutcomeRequiresReconciliation: true,
    applyAdapterInstalled: false,
    executionEnabled: false,
    executionPerformed: false,
    gateMutationPerformed: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
    operatorId,
    authorizedAtMs,
    confirmationText,
    applyExecutionAuthorizationIssued: true,
    authorizationConsumed: false,
  });
}
