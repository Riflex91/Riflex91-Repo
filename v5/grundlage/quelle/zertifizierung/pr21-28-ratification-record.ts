import { evidenceFingerprint } from "./evidence-kette.js";
import type {
  Pr21_28ResultPackage,
} from "./pr21-28-result-package.js";
import type { Pr21_28CheckpointId } from "./pr21-28-milestone-runner.js";

export interface Pr21_28RatificationDraft {
  readonly schemaVersion: 1;
  readonly status: "AWAITING_EXPLICIT_RATIFICATION";
  readonly checkpointId: Pr21_28CheckpointId;
  readonly packageId: string;
  readonly packageFingerprint: string;
  readonly sourceMainCommit: string;
  readonly cap022FullChainRequired: boolean;
  readonly cap022FullChainSatisfied: true;
  readonly cap022FullChainBoundToPackage: true;
  readonly requiredConfirmationText: string;
  readonly automaticRatification: false;
  readonly gateAdvanced: false;
  readonly authorityIssued: false;
  readonly broadRuntimeGrant: false;
  readonly gesamtfreigabeRequiredSeparately: true;
}

export interface Pr21_28RatificationRecordBasis {
  readonly schemaVersion: 1;
  readonly status: "RATIFIED_RECORD_ONLY";
  readonly checkpointId: Pr21_28CheckpointId;
  readonly packageId: string;
  readonly packageFingerprint: string;
  readonly sourceMainCommit: string;
  readonly ratifierId: string;
  readonly ratifiedAtMs: number;
  readonly confirmationText: string;
  readonly cap022FullChainRequired: boolean;
  readonly cap022FullChainSatisfied: true;
  readonly cap022FullChainBoundToPackage: true;
  readonly ratified: true;
  readonly gateAdvanced: false;
  readonly authorityIssued: false;
  readonly broadRuntimeGrant: false;
  readonly gesamtfreigabeRequiredSeparately: true;
  readonly resultPackageStillImmutable: true;
}

export interface Pr21_28RatificationRecord
  extends Pr21_28RatificationRecordBasis {
  readonly ratificationFingerprint: string;
}

function text(value: string, error: string, maximum=256): void {
  if (value.trim().length === 0 || value.length > maximum) {
    throw new Error(error);
  }
}

export function pr21_28RatificationConfirmationText(
  checkpointId: Pr21_28CheckpointId,
  packageFingerprint: string,
): string {
  if (!/^[0-9a-f]{16}$/.test(packageFingerprint)) {
    throw new Error("PR21_28_RATIFICATION_PACKAGE_FP_UNGUELTIG");
  }
  return "RATIFY PR21-28 CHECKPOINT "
    + checkpointId
    + " PACKAGE "
    + packageFingerprint;
}

export function bereitePr21_28RatificationVor(
  resultPackage: Pr21_28ResultPackage,
): Pr21_28RatificationDraft {
  if (resultPackage.schemaVersion !== 1
      || resultPackage.status !== "READY_FOR_MANUAL_RATIFICATION"
      || resultPackage.manualRatificationRequired !== true
      || resultPackage.ratifiedByPackageBuilder !== false
      || resultPackage.authorityIssuedByPackageBuilder !== false
      || resultPackage.gameplayAuthority !== false
      || resultPackage.rawWriteAuthority !== false
      || resultPackage.normalRuntimeAllowed !== false) {
    throw new Error("PR21_28_RATIFICATION_RESULT_PACKAGE_NICHT_BEREIT");
  }
  if (!/^[0-9a-f]{40}$/.test(resultPackage.sourceMainCommit)
      || !/^[0-9a-f]{16}$/.test(resultPackage.packageFingerprint)) {
    throw new Error("PR21_28_RATIFICATION_RESULT_PACKAGE_PIN_UNGUELTIG");
  }
  const cap022FullChainRequired =
    resultPackage.checkpointId === "POST_PR24_25_GROUP_CHECKPOINT";
  if (resultPackage.cap022FullChainBoundToPackage !== true
      || resultPackage.cap022FullChainRequired !== cap022FullChainRequired
      || resultPackage.cap022FullChainSatisfied !== true) {
    throw new Error("PR21_28_RATIFICATION_CAP022_BINDING_UNGUELTIG");
  }
  text(resultPackage.packageId, "PR21_28_RATIFICATION_PACKAGE_ID_UNGUELTIG");

  return Object.freeze({
    schemaVersion: 1,
    status: "AWAITING_EXPLICIT_RATIFICATION",
    checkpointId: resultPackage.checkpointId,
    packageId: resultPackage.packageId,
    packageFingerprint: resultPackage.packageFingerprint,
    sourceMainCommit: resultPackage.sourceMainCommit,
    cap022FullChainRequired: resultPackage.cap022FullChainRequired,
    cap022FullChainSatisfied: true,
    cap022FullChainBoundToPackage: true,
    requiredConfirmationText: pr21_28RatificationConfirmationText(
      resultPackage.checkpointId,
      resultPackage.packageFingerprint,
    ),
    automaticRatification: false,
    gateAdvanced: false,
    authorityIssued: false,
    broadRuntimeGrant: false,
    gesamtfreigabeRequiredSeparately: true,
  });
}

function freezeBasis(
  basis: Pr21_28RatificationRecordBasis,
): Pr21_28RatificationRecordBasis {
  return Object.freeze({ ...basis });
}

export function ratifizierePr21_28ResultPackage(
  draft: Pr21_28RatificationDraft,
  confirmationText: string,
  ratifierId: string,
  ratifiedAtMs: number,
): Pr21_28RatificationRecord {
  if (draft.schemaVersion !== 1
      || draft.status !== "AWAITING_EXPLICIT_RATIFICATION"
      || draft.automaticRatification !== false
      || draft.gateAdvanced !== false
      || draft.authorityIssued !== false
      || draft.broadRuntimeGrant !== false
      || draft.gesamtfreigabeRequiredSeparately !== true
      || draft.cap022FullChainSatisfied !== true
      || draft.cap022FullChainBoundToPackage !== true) {
    throw new Error("PR21_28_RATIFICATION_DRAFT_UNGUELTIG");
  }
  text(ratifierId, "PR21_28_RATIFICATION_RATIFIER_UNGUELTIG");
  if (!Number.isSafeInteger(ratifiedAtMs) || ratifiedAtMs < 0) {
    throw new Error("PR21_28_RATIFICATION_ZEIT_UNGUELTIG");
  }
  if (confirmationText !== draft.requiredConfirmationText) {
    throw new Error("PR21_28_RATIFICATION_BESTAETIGUNG_UNGUELTIG");
  }

  const basis = freezeBasis({
    schemaVersion: 1,
    status: "RATIFIED_RECORD_ONLY",
    checkpointId: draft.checkpointId,
    packageId: draft.packageId,
    packageFingerprint: draft.packageFingerprint,
    sourceMainCommit: draft.sourceMainCommit,
    ratifierId,
    ratifiedAtMs,
    confirmationText,
    cap022FullChainRequired: draft.cap022FullChainRequired,
    cap022FullChainSatisfied: true,
    cap022FullChainBoundToPackage: true,
    ratified: true,
    gateAdvanced: false,
    authorityIssued: false,
    broadRuntimeGrant: false,
    gesamtfreigabeRequiredSeparately: true,
    resultPackageStillImmutable: true,
  });

  return Object.freeze({
    ...basis,
    ratificationFingerprint: evidenceFingerprint(basis),
  });
}
