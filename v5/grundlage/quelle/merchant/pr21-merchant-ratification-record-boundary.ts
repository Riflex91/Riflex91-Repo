import {
  ratifizierePr21_28ResultPackage,
  type Pr21_28RatificationDraft,
  type Pr21_28RatificationRecord,
} from "../zertifizierung/pr21-28-ratification-record.js";
import type { Pr21MerchantFreezeEvaluationHandoff } from "./pr21-merchant-freeze-evaluation-handoff.js";

export interface Pr21MerchantRatificationBoundary {
  readonly schemaVersion: 1;
  readonly status: "AWAITING_EXPLICIT_RATIFICATION";
  readonly checkpointId: "PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT";
  readonly packageId: string;
  readonly packageFingerprint: string;
  readonly sourceMainCommit: string;
  readonly requiredConfirmationText: string;
  readonly resultPackageStillImmutable: true;
  readonly automaticRatification: false;
  readonly gateAdvanced: false;
  readonly authorityIssued: false;
  readonly broadRuntimeGrant: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

const CHECKPOINT = "PR20_COMPLETE_MERCHANT_INTEGRATION_CHECKPOINT" as const;

function validateDraft(
  handoff: Pr21MerchantFreezeEvaluationHandoff,
): Pr21_28RatificationDraft {
  if (handoff.schemaVersion !== 1
      || handoff.status !== "READY_FOR_EXPLICIT_MANUAL_RATIFICATION"
      || handoff.blocker.length !== 0
      || handoff.checkpointId !== CHECKPOINT
      || handoff.resultPackage === null
      || handoff.ratificationDraft === null
      || handoff.resultPackage.status !== "READY_FOR_MANUAL_RATIFICATION"
      || handoff.ratificationDraft.status !== "AWAITING_EXPLICIT_RATIFICATION"
      || handoff.ratificationDraft.checkpointId !== CHECKPOINT
      || handoff.resultPackage.checkpointId !== CHECKPOINT
      || handoff.ratificationDraft.packageId !== handoff.resultPackage.packageId
      || handoff.ratificationDraft.packageFingerprint !== handoff.resultPackage.packageFingerprint
      || handoff.ratificationDraft.sourceMainCommit !== handoff.sourceMainCommit
      || handoff.automaticRatification !== false
      || handoff.gateMutationPerformed !== false
      || handoff.authorityIssued !== false
      || handoff.broadRuntimeGrant !== false
      || handoff.gameplayAuthority !== false
      || handoff.rawWriteAuthority !== false
      || handoff.normalRuntimeAllowed !== false) {
    throw new Error("PR21_MERCHANT_RATIFICATION_BOUNDARY_HANDOFF_NICHT_BEREIT");
  }
  return handoff.ratificationDraft;
}

export function bereitePr21MerchantRatificationBoundaryVor(
  handoff: Pr21MerchantFreezeEvaluationHandoff,
): Pr21MerchantRatificationBoundary {
  const draft = validateDraft(handoff);
  return Object.freeze({
    schemaVersion: 1,
    status: "AWAITING_EXPLICIT_RATIFICATION",
    checkpointId: CHECKPOINT,
    packageId: draft.packageId,
    packageFingerprint: draft.packageFingerprint,
    sourceMainCommit: draft.sourceMainCommit,
    requiredConfirmationText: draft.requiredConfirmationText,
    resultPackageStillImmutable: true,
    automaticRatification: false,
    gateAdvanced: false,
    authorityIssued: false,
    broadRuntimeGrant: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}

export function erzeugePr21MerchantRatificationRecord(
  handoff: Pr21MerchantFreezeEvaluationHandoff,
  confirmationText: string,
  ratifierId: string,
  ratifiedAtMs: number,
): Pr21_28RatificationRecord {
  const draft = validateDraft(handoff);
  if (confirmationText !== draft.requiredConfirmationText) {
    throw new Error("PR21_MERCHANT_RATIFICATION_BESTAETIGUNG_UNGUELTIG");
  }

  const record = ratifizierePr21_28ResultPackage(
    draft,
    confirmationText,
    ratifierId,
    ratifiedAtMs,
  );

  if (record.checkpointId !== CHECKPOINT
      || record.packageId !== draft.packageId
      || record.packageFingerprint !== draft.packageFingerprint
      || record.sourceMainCommit !== draft.sourceMainCommit
      || record.status !== "RATIFIED_RECORD_ONLY"
      || record.ratified !== true
      || record.gateAdvanced !== false
      || record.authorityIssued !== false
      || record.broadRuntimeGrant !== false
      || record.gesamtfreigabeRequiredSeparately !== true
      || record.resultPackageStillImmutable !== true) {
    throw new Error("PR21_MERCHANT_RATIFICATION_RECORD_BOUNDARY_DRIFT");
  }

  return record;
}
