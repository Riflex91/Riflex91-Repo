import { evidenceFingerprint } from "../zertifizierung/evidence-kette.js";
import type { Pr21_28GateStage } from "./pr21-28-feature-gates.js";
import type { Pr21_28GateSettlement } from "./pr21-28-gate-settlement-rollback.js";

export interface Pr21_28StagePreparationState {
  readonly stage: Pr21_28GateStage;
  readonly foundationPrepared: boolean;
  readonly orchestrationPrepared: boolean;
  readonly featureGatePrepared: boolean;
  readonly cap022FullChainReady: boolean;
  readonly milestoneRunnerPrepared: boolean;
  readonly checkpointRunbookPrepared: boolean;
  readonly ratificationRecordPrepared: boolean;
  readonly gateApplyTransactionPrepared: boolean;
  readonly gateSettlementPrepared: boolean;
  readonly liveEvidenceRatified: boolean;
  readonly explicitRatificationRecorded: boolean;
  readonly gateApplyVerified: boolean;
  readonly gateSettlement: Pr21_28GateSettlement | null;
}

export interface Pr21_28StageLedgerEntryBasis {
  readonly schemaVersion: 1;
  readonly stage: Pr21_28GateStage;
  readonly stageIndex: number;
  readonly state: Pr21_28StagePreparationState;
  readonly preparationComplete: boolean;
  readonly cap022FullChainRequired: boolean;
  readonly cap022FullChainSatisfied: boolean;
  readonly gateSettlementEvidenceRequired: boolean;
  readonly gateSettlementEvidenceSatisfied: boolean;
  readonly productivePrerequisitesComplete: boolean;
  readonly predecessorProductiveComplete: boolean;
  readonly productiveChainEligible: boolean;
  readonly gateMutationPerformedByLedger: false;
  readonly authorityIssuedByLedger: false;
  readonly broadRuntimeGrant: false;
}

export interface Pr21_28StageLedgerEntry extends Pr21_28StageLedgerEntryBasis {
  readonly entryFingerprint: string;
}

export interface Pr21_28StageLedger {
  readonly schemaVersion: 1;
  readonly entries: readonly Pr21_28StageLedgerEntry[];
  readonly highestPreparationCompleteStage: Pr21_28GateStage | null;
  readonly highestProductiveEligibleStage: Pr21_28GateStage | null;
  readonly allPreparationComplete: boolean;
  readonly allProductiveEligible: boolean;
  readonly replayOnly: true;
  readonly gateMutationPerformed: false;
  readonly authorityIssued: false;
  readonly broadRuntimeGrant: false;
  readonly normalRuntimeAllowed: false;
  readonly ledgerFingerprint: string;
}

const ORDER: readonly Pr21_28GateStage[] = Object.freeze([
  "PR21","PR22","PR23","PR24","PR25","PR26","PR27","PR28",
]);

function freezeState(state: Pr21_28StagePreparationState): Pr21_28StagePreparationState {
  return Object.freeze({
    ...state,
    gateSettlement: state.gateSettlement === null
      ? null
      : Object.freeze({ ...state.gateSettlement }),
  });
}

function settlementEvidenceSatisfied(
  stage: Pr21_28GateStage,
  state: Pr21_28StagePreparationState,
): boolean {
  if (state.gateApplyVerified !== true || state.gateSettlement === null) {
    return false;
  }
  const settlement = state.gateSettlement;
  const cap022Required = stage === "PR22" || stage === "PR23";
  return settlement.schemaVersion === 1
    && settlement.stage === stage
    && settlement.status === "APPLIED_VERIFIED_RECORD_ONLY"
    && settlement.durableIntentObserved === true
    && settlement.postconditionVerified === true
    && settlement.terminalSettlementObserved === true
    && settlement.cap022FullChainRequired === cap022Required
    && settlement.cap022FullChainSatisfied === true
    && settlement.gateMutationPerformedBySettlement === false
    && settlement.authorityIssuedBySettlement === false
    && settlement.broadRuntimeGrant === false
    && /^[0-9a-f]{16}$/.test(settlement.settlementFingerprint);
}

function basisFingerprint(basis: Pr21_28StageLedgerEntryBasis): string {
  return evidenceFingerprint(Object.freeze({
    ...basis,
    state: freezeState(basis.state),
  }));
}

export function bauePr21_28StageLedger(
  states: readonly Pr21_28StagePreparationState[],
): Pr21_28StageLedger {
  if (states.length !== ORDER.length) {
    throw new Error("PR21_28_STAGE_LEDGER_UNVOLLSTAENDIG");
  }
  const byStage = new Map<Pr21_28GateStage, Pr21_28StagePreparationState>();
  for (const state of states) {
    if (!ORDER.includes(state.stage)) {
      throw new Error("PR21_28_STAGE_LEDGER_STAGE_UNBEKANNT");
    }
    if (byStage.has(state.stage)) {
      throw new Error("PR21_28_STAGE_LEDGER_STAGE_DOPPELT");
    }
    byStage.set(state.stage, freezeState(state));
  }

  const entries: Pr21_28StageLedgerEntry[] = [];
  let predecessorProductiveComplete = true;
  let highestPreparationCompleteStage: Pr21_28GateStage | null = null;
  let highestProductiveEligibleStage: Pr21_28GateStage | null = null;

  for (let index = 0; index < ORDER.length; index += 1) {
    const stage = ORDER[index];
    if (stage === undefined) {
      throw new Error("PR21_28_STAGE_LEDGER_ORDER_DRIFT");
    }
    const state = byStage.get(stage);
    if (state === undefined) {
      throw new Error("PR21_28_STAGE_LEDGER_STAGE_FEHLT:" + stage);
    }

    const cap022FullChainRequired = stage === "PR22" || stage === "PR23";
    const cap022FullChainSatisfied =
      !cap022FullChainRequired || state.cap022FullChainReady === true;

    const preparationComplete =
      state.foundationPrepared
      && state.orchestrationPrepared
      && state.featureGatePrepared
      && cap022FullChainSatisfied
      && state.milestoneRunnerPrepared
      && state.checkpointRunbookPrepared
      && state.ratificationRecordPrepared
      && state.gateApplyTransactionPrepared
      && state.gateSettlementPrepared;

    const gateSettlementEvidenceRequired = state.gateApplyVerified === true;
    const gateSettlementEvidenceSatisfied =
      settlementEvidenceSatisfied(stage, state);

    const productivePrerequisitesComplete =
      preparationComplete
      && state.liveEvidenceRatified
      && state.explicitRatificationRecorded
      && state.gateApplyVerified
      && gateSettlementEvidenceSatisfied;

    const productiveChainEligible =
      productivePrerequisitesComplete && predecessorProductiveComplete;

    const basis: Pr21_28StageLedgerEntryBasis = Object.freeze({
      schemaVersion: 1,
      stage,
      stageIndex: index,
      state,
      preparationComplete,
      cap022FullChainRequired,
      cap022FullChainSatisfied,
      gateSettlementEvidenceRequired,
      gateSettlementEvidenceSatisfied,
      productivePrerequisitesComplete,
      predecessorProductiveComplete,
      productiveChainEligible,
      gateMutationPerformedByLedger: false,
      authorityIssuedByLedger: false,
      broadRuntimeGrant: false,
    });

    const entry = Object.freeze({
      ...basis,
      entryFingerprint: basisFingerprint(basis),
    });
    entries.push(entry);

    if (preparationComplete) {
      highestPreparationCompleteStage = stage;
    }
    if (productiveChainEligible) {
      highestProductiveEligibleStage = stage;
    } else {
      predecessorProductiveComplete = false;
    }
  }

  const frozenEntries = Object.freeze(entries);
  const ledgerBase = Object.freeze({
    schemaVersion: 1,
    entryFingerprints: frozenEntries.map(x => x.entryFingerprint),
    highestPreparationCompleteStage,
    highestProductiveEligibleStage,
  });

  return Object.freeze({
    schemaVersion: 1,
    entries: frozenEntries,
    highestPreparationCompleteStage,
    highestProductiveEligibleStage,
    allPreparationComplete: frozenEntries.every(x => x.preparationComplete),
    allProductiveEligible: frozenEntries.every(x => x.productiveChainEligible),
    replayOnly: true,
    gateMutationPerformed: false,
    authorityIssued: false,
    broadRuntimeGrant: false,
    normalRuntimeAllowed: false,
    ledgerFingerprint: evidenceFingerprint(ledgerBase),
  });
}

export interface Pr21_28AdvanceChainReplay {
  readonly schemaVersion: 1;
  readonly status:
    | "PREPARATION_COMPLETE_PRODUCTIVE_CHAIN_CLOSED"
    | "PRODUCTIVE_CHAIN_REPLAY_ELIGIBLE"
    | "PREPARATION_INCOMPLETE";
  readonly blocker: readonly string[];
  readonly stages: readonly Readonly<{
    stage: Pr21_28GateStage;
    preparationComplete: boolean;
    productiveChainEligible: boolean;
    requiresCap022FullChain: boolean;
    requiresLiveEvidence: boolean;
    requiresExplicitRatification: boolean;
    requiresVerifiedGateApply: boolean;
  }>[];
  readonly highestPreparationCompleteStage: Pr21_28GateStage | null;
  readonly highestProductiveEligibleStage: Pr21_28GateStage | null;
  readonly replayMutatedGate: false;
  readonly replayIssuedAuthority: false;
  readonly broadRuntimeGrant: false;
}

export function replayPr21_28AdvanceChain(
  ledger: Pr21_28StageLedger,
): Pr21_28AdvanceChainReplay {
  if (ledger.schemaVersion !== 1
      || ledger.replayOnly !== true
      || ledger.gateMutationPerformed !== false
      || ledger.authorityIssued !== false
      || ledger.broadRuntimeGrant !== false) {
    throw new Error("PR21_28_ADVANCE_REPLAY_LEDGER_UNGUELTIG");
  }

  const blocker: string[] = [];
  for (const entry of ledger.entries) {
    if (entry.cap022FullChainRequired && !entry.cap022FullChainSatisfied) {
      blocker.push(entry.stage + "_CAP022_FULL_CHAIN_REQUIRED");
    }
    if (!entry.preparationComplete) {
      blocker.push(entry.stage + "_PREPARATION_INCOMPLETE");
    } else if (!entry.productiveChainEligible) {
      if (!entry.state.liveEvidenceRatified) {
        blocker.push(entry.stage + "_LIVE_EVIDENCE_REQUIRED");
      }
      if (!entry.state.explicitRatificationRecorded) {
        blocker.push(entry.stage + "_EXPLICIT_RATIFICATION_REQUIRED");
      }
      if (!entry.state.gateApplyVerified) {
        blocker.push(entry.stage + "_VERIFIED_GATE_APPLY_REQUIRED");
      } else if (!entry.gateSettlementEvidenceSatisfied) {
        blocker.push(entry.stage + "_VERIFIED_GATE_SETTLEMENT_REQUIRED");
      }
      if (!entry.predecessorProductiveComplete) {
        blocker.push(entry.stage + "_PREDECESSOR_CHAIN_CLOSED");
      }
    }
  }

  const status =
    !ledger.allPreparationComplete
      ? "PREPARATION_INCOMPLETE"
      : ledger.allProductiveEligible
        ? "PRODUCTIVE_CHAIN_REPLAY_ELIGIBLE"
        : "PREPARATION_COMPLETE_PRODUCTIVE_CHAIN_CLOSED";

  return Object.freeze({
    schemaVersion: 1,
    status,
    blocker: Object.freeze([...new Set(blocker)]),
    stages: Object.freeze(ledger.entries.map(entry => Object.freeze({
      stage: entry.stage,
      preparationComplete: entry.preparationComplete,
      productiveChainEligible: entry.productiveChainEligible,
      requiresCap022FullChain:
        entry.cap022FullChainRequired && !entry.cap022FullChainSatisfied,
      requiresLiveEvidence: !entry.state.liveEvidenceRatified,
      requiresExplicitRatification: !entry.state.explicitRatificationRecorded,
      requiresVerifiedGateApply: !entry.state.gateApplyVerified,
      requiresVerifiedGateSettlement:
        entry.state.gateApplyVerified && !entry.gateSettlementEvidenceSatisfied,
    }))),
    highestPreparationCompleteStage: ledger.highestPreparationCompleteStage,
    highestProductiveEligibleStage: ledger.highestProductiveEligibleStage,
    replayMutatedGate: false,
    replayIssuedAuthority: false,
    broadRuntimeGrant: false,
  });
}
