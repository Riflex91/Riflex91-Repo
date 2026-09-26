import { evidenceFingerprint } from "../zertifizierung/evidence-kette.js";
import type {
  Pr21MerchantDefaultOffApplyBoundary,
} from "./pr21-merchant-default-off-apply-boundary.js";

export interface Pr21MerchantApplyAuthorizationDraft {
  readonly schemaVersion: 1;
  readonly status: "AWAITING_EXPLICIT_APPLY_AUTHORIZATION";
  readonly stage: "PR21";
  readonly transactionId: string;
  readonly transactionFingerprint: string;
  readonly operationKey: string;
  readonly sourceMainCommit: string;
  readonly packageFingerprint: string;
  readonly ratificationFingerprint: string;
  readonly requiredConfirmationText: string;
  readonly oneShotApplyAuthorized: false;
  readonly authorizationConsumed: false;
  readonly freshMainCheckRequiredAtExecution: true;
  readonly durableIntentRequiredBeforeExecution: true;
  readonly postconditionVerificationRequired: true;
  readonly unknownOutcomeRequiresReconciliation: true;
  readonly sameIntentRetryAllowed: false;
  readonly executionEnabled: false;
  readonly gateMutationPerformed: false;
  readonly authorityIssued: false;
  readonly broadRuntimeGrant: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

export interface Pr21MerchantApplyAuthorizationRecordBasis {
  readonly schemaVersion: 1;
  readonly status: "AUTHORIZED_ONE_SHOT_APPLY_RECORD_ONLY";
  readonly stage: "PR21";
  readonly transactionId: string;
  readonly transactionFingerprint: string;
  readonly operationKey: string;
  readonly sourceMainCommit: string;
  readonly packageFingerprint: string;
  readonly ratificationFingerprint: string;
  readonly authorizerId: string;
  readonly authorizedAtMs: number;
  readonly confirmationText: string;
  readonly oneShotApplyAuthorized: true;
  readonly authorizationConsumed: false;
  readonly freshMainCheckRequiredAtExecution: true;
  readonly durableIntentRequiredBeforeExecution: true;
  readonly postconditionVerificationRequired: true;
  readonly unknownOutcomeRequiresReconciliation: true;
  readonly sameIntentRetryAllowed: false;
  readonly executionEnabled: false;
  readonly gateMutationPerformed: false;
  readonly authorityIssued: false;
  readonly broadRuntimeGrant: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

export interface Pr21MerchantApplyAuthorizationRecord
  extends Pr21MerchantApplyAuthorizationRecordBasis {
  readonly authorizationFingerprint: string;
}

const STAGE = "PR21" as const;

function text(value: string, error: string, maximum=256): void {
  if (value.trim().length === 0 || value.length > maximum) {
    throw new Error(error);
  }
}

function validateBoundary(
  boundary: Pr21MerchantDefaultOffApplyBoundary,
): NonNullable<Pr21MerchantDefaultOffApplyBoundary["transaction"]> {
  if (boundary.schemaVersion !== 1
      || boundary.status !== "READY_DEFAULT_OFF"
      || boundary.blocker.length !== 0
      || boundary.stage !== STAGE
      || boundary.transaction === null
      || boundary.validation === null
      || boundary.transaction.stage !== STAGE
      || boundary.transaction.status !== "PREPARED_DEFAULT_OFF"
      || boundary.validation.status !== "READY_DEFAULT_OFF"
      || boundary.validation.blocker.length !== 0
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
      || boundary.separateApplyExecutionRequired !== true
      || boundary.transaction.sameIntentRetryAllowed !== false
      || boundary.transaction.durableIntentRequiredBeforeApply !== true
      || boundary.transaction.oneShotApplyRequired !== true
      || boundary.transaction.postconditionVerificationRequired !== true
      || boundary.transaction.unknownOutcomeRequiresReconciliation !== true
      || boundary.transaction.applyAdapterInstalled !== false
      || boundary.transaction.executionEnabled !== false
      || boundary.transaction.gateMutationPerformed !== false
      || boundary.transaction.authorityIssued !== false
      || boundary.transaction.broadRuntimeGrant !== false) {
    throw new Error("PR21_MERCHANT_APPLY_AUTH_DEFAULT_OFF_BOUNDARY_NICHT_BEREIT");
  }
  return boundary.transaction;
}

export function pr21MerchantApplyAuthorizationConfirmationText(
  transactionFingerprint: string,
  sourceMainCommit: string,
): string {
  if (!/^[0-9a-f]{16}$/.test(transactionFingerprint)) {
    throw new Error("PR21_MERCHANT_APPLY_AUTH_TRANSACTION_FP_UNGUELTIG");
  }
  if (!/^[0-9a-f]{40}$/.test(sourceMainCommit)) {
    throw new Error("PR21_MERCHANT_APPLY_AUTH_MAIN_UNGUELTIG");
  }
  return "AUTHORIZE PR21 ONE-SHOT GATE APPLY TX "
    + transactionFingerprint
    + " MAIN "
    + sourceMainCommit;
}

export function bereitePr21MerchantApplyAuthorizationVor(
  boundary: Pr21MerchantDefaultOffApplyBoundary,
): Pr21MerchantApplyAuthorizationDraft {
  const transaction = validateBoundary(boundary);
  return Object.freeze({
    schemaVersion: 1,
    status: "AWAITING_EXPLICIT_APPLY_AUTHORIZATION",
    stage: STAGE,
    transactionId: transaction.transactionId,
    transactionFingerprint: transaction.transactionFingerprint,
    operationKey: transaction.operationKey,
    sourceMainCommit: transaction.sourceMainCommit,
    packageFingerprint: transaction.packageFingerprint,
    ratificationFingerprint: transaction.ratificationFingerprint,
    requiredConfirmationText: pr21MerchantApplyAuthorizationConfirmationText(
      transaction.transactionFingerprint,
      transaction.sourceMainCommit,
    ),
    oneShotApplyAuthorized: false,
    authorizationConsumed: false,
    freshMainCheckRequiredAtExecution: true,
    durableIntentRequiredBeforeExecution: true,
    postconditionVerificationRequired: true,
    unknownOutcomeRequiresReconciliation: true,
    sameIntentRetryAllowed: false,
    executionEnabled: false,
    gateMutationPerformed: false,
    authorityIssued: false,
    broadRuntimeGrant: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}

export function autorisierePr21MerchantOneShotApply(
  draft: Pr21MerchantApplyAuthorizationDraft,
  confirmationText: string,
  authorizerId: string,
  authorizedAtMs: number,
): Pr21MerchantApplyAuthorizationRecord {
  if (draft.schemaVersion !== 1
      || draft.status !== "AWAITING_EXPLICIT_APPLY_AUTHORIZATION"
      || draft.stage !== STAGE
      || draft.oneShotApplyAuthorized !== false
      || draft.authorizationConsumed !== false
      || draft.freshMainCheckRequiredAtExecution !== true
      || draft.durableIntentRequiredBeforeExecution !== true
      || draft.postconditionVerificationRequired !== true
      || draft.unknownOutcomeRequiresReconciliation !== true
      || draft.sameIntentRetryAllowed !== false
      || draft.executionEnabled !== false
      || draft.gateMutationPerformed !== false
      || draft.authorityIssued !== false
      || draft.broadRuntimeGrant !== false
      || draft.gameplayAuthority !== false
      || draft.rawWriteAuthority !== false
      || draft.normalRuntimeAllowed !== false) {
    throw new Error("PR21_MERCHANT_APPLY_AUTH_DRAFT_UNGUELTIG");
  }
  if (confirmationText !== draft.requiredConfirmationText) {
    throw new Error("PR21_MERCHANT_APPLY_AUTH_BESTAETIGUNG_UNGUELTIG");
  }
  text(authorizerId, "PR21_MERCHANT_APPLY_AUTH_AUTORISIERER_UNGUELTIG");
  if (!Number.isSafeInteger(authorizedAtMs) || authorizedAtMs < 0) {
    throw new Error("PR21_MERCHANT_APPLY_AUTH_ZEIT_UNGUELTIG");
  }

  const basis: Pr21MerchantApplyAuthorizationRecordBasis = Object.freeze({
    schemaVersion: 1,
    status: "AUTHORIZED_ONE_SHOT_APPLY_RECORD_ONLY",
    stage: STAGE,
    transactionId: draft.transactionId,
    transactionFingerprint: draft.transactionFingerprint,
    operationKey: draft.operationKey,
    sourceMainCommit: draft.sourceMainCommit,
    packageFingerprint: draft.packageFingerprint,
    ratificationFingerprint: draft.ratificationFingerprint,
    authorizerId,
    authorizedAtMs,
    confirmationText,
    oneShotApplyAuthorized: true,
    authorizationConsumed: false,
    freshMainCheckRequiredAtExecution: true,
    durableIntentRequiredBeforeExecution: true,
    postconditionVerificationRequired: true,
    unknownOutcomeRequiresReconciliation: true,
    sameIntentRetryAllowed: false,
    executionEnabled: false,
    gateMutationPerformed: false,
    authorityIssued: false,
    broadRuntimeGrant: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });

  return Object.freeze({
    ...basis,
    authorizationFingerprint: evidenceFingerprint(basis),
  });
}
