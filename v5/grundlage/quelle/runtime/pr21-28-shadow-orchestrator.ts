import type { Pr21MerchantIntegrationReadiness } from "../merchant/pr21-merchant-integration-readiness.js";
import type { Pr22CoordinationShadowAdmission } from "../koordination/pr22-coordination-shadow-admission.js";
import type { ProduktionsMaterialAkquisePlan } from "../koordination/production-material-acquisition.js";
import {
  bewerteCap022FoundationChain,
  type Cap022FoundationChainRequest,
} from "./cap022-foundation-chain-readiness.js";
import type { Pr23FarmerShadowAdmission } from "../farmer/pr23-farmer-shadow-admission.js";
import type { Pr24GruppenMatrixErgebnis } from "../gruppe/pr24-group-constellation-matrix.js";
import type { Pr25GruppenLiveEvidencePlan } from "../gruppe/pr25-group-live-evidence-plan.js";
import type { Pr26TaskPartyOptimizerResult } from "../optimierung/pr26-task-party-optimizer.js";
import type { Pr27ProgressionBalancerResult } from "../optimierung/pr27-account-progression-balancer.js";
import type { Pr28WorldAutonomyGateResult } from "../welt/pr28-world-autonomy-gate.js";

export type Pr21_28Stage =
  | "PR21"
  | "PR22"
  | "PR23"
  | "PR24"
  | "PR25"
  | "PR26"
  | "PR27"
  | "PR28";

export interface Pr21_28ShadowOrchestrationRequest {
  readonly schemaVersion: 1;
  readonly pr20ProductiveComplete: boolean;
  readonly materialAcquisition: ProduktionsMaterialAkquisePlan;
  readonly materialFoundationChain: Cap022FoundationChainRequest;
  readonly pr21: Pr21MerchantIntegrationReadiness;
  readonly pr22: Pr22CoordinationShadowAdmission;
  readonly pr23: Pr23FarmerShadowAdmission;
  readonly pr24: Pr24GruppenMatrixErgebnis;
  readonly pr25: Pr25GruppenLiveEvidencePlan;
  readonly pr26: Pr26TaskPartyOptimizerResult;
  readonly pr27: Pr27ProgressionBalancerResult;
  readonly pr28: Pr28WorldAutonomyGateResult;
}

export interface Pr21_28StageSicht {
  readonly stage: Pr21_28Stage;
  readonly foundationReady: boolean;
  readonly productiveDependencySatisfied: boolean;
  readonly shadowPlanReady: boolean;
  readonly productiveExecutionAllowed: false;
}

export interface Pr21_28ShadowOrchestrationResult {
  readonly schemaVersion: 1;
  readonly status: "SHADOW_PIPELINE_BEREIT_NO_WRITE" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly stages: readonly Pr21_28StageSicht[];
  readonly highestPreparedStage: Pr21_28Stage | null;
  readonly allFoundationsConnected: boolean;
  readonly materialAcquisitionFoundationReady: boolean;
  readonly materialFoundationChainReady: boolean;
  readonly materialFoundationChainStatus: "CAP022_FULL_CHAIN_BEREIT_NO_WRITE" | "BLOCKIERT";
  readonly materialFoundationChainBlocker: readonly string[];
  readonly materialAcquisitionProductiveExecutionAllowed: false;
  readonly deferredLiveEvidenceRequired: true;
  readonly gameplayWrites: 0;
  readonly publicFunctionCalls: 0;
  readonly rawWriteCalls: 0;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

function stage(
  name: Pr21_28Stage,
  foundationReady: boolean,
  dependencySatisfied: boolean,
): Pr21_28StageSicht {
  return Object.freeze({
    stage: name,
    foundationReady,
    productiveDependencySatisfied: dependencySatisfied,
    shadowPlanReady: foundationReady,
    productiveExecutionAllowed: false,
  });
}

export function orchestrierePr21_28ShadowPipeline(
  anfrage: Pr21_28ShadowOrchestrationRequest,
): Pr21_28ShadowOrchestrationResult {
  if (anfrage.schemaVersion !== 1) {
    throw new Error("PR21_28_ORCHESTRATOR_SCHEMA_UNGUELTIG");
  }

  const pr21Ready = anfrage.pr21.status === "BEREIT_FUER_INTEGRATIONSTEST_NO_WRITE"
    && anfrage.pr21.liveExecutionAllowed === false
    && anfrage.pr21.gameplayAuthority === false
    && anfrage.pr21.rawWriteAuthority === false
    && anfrage.pr21.normalRuntimeAllowed === false;

  const pr22Ready = anfrage.pr22.status === "BEREIT_NO_WRITE"
    && anfrage.pr22.sendCmAuthority === false
    && anfrage.pr22.gameplayAuthority === false
    && anfrage.pr22.rawWriteAuthority === false
    && anfrage.pr22.blindResumeAllowed === false;

  const pr23Ready = anfrage.pr23.status === "BEREIT_NO_WRITE"
    && anfrage.pr23.gameplayAuthority === false
    && anfrage.pr23.rawWriteAuthority === false
    && anfrage.pr23.blindResumeAllowed === false;

  const pr24Ready = anfrage.pr24.status === "ZULAESSIG_NO_WRITE"
    && anfrage.pr24.fehlendeCapabilities.length === 0
    && anfrage.pr24.erfindetFehlendeCapability === false;

  const pr25Ready = anfrage.pr25.status === "PLAN_BEREIT_NO_WRITE"
    && anfrage.pr25.segmente.length > 0
    && anfrage.pr25.liveExecutionAllowed === false;

  const pr26Ready = anfrage.pr26.status === "AUSWAHL_BEREIT_NO_WRITE"
    && anfrage.pr26.selected !== null
    && anfrage.pr26.learningKannHardFilterNichtLockern === true
    && anfrage.pr26.executionAuthority === false;

  const pr27Ready = anfrage.pr27.status === "AUSWAHL_BEREIT_NO_WRITE"
    && anfrage.pr27.selected !== null
    && anfrage.pr27.safetyVorBalance === true
    && anfrage.pr27.executionAuthority === false;

  const pr28Ready = anfrage.pr28.status === "PLAN_BEREIT_NO_WRITE"
    && anfrage.pr28.worldActionAuthority === false
    && anfrage.pr28.serverHopAuthority === false
    && anfrage.pr28.gameplayAuthority === false
    && anfrage.pr28.rawWriteAuthority === false;

  const materialAcquisitionReady =
    (anfrage.materialAcquisition.status === "BEREIT_NO_WRITE"
      || anfrage.materialAcquisition.status === "KEIN_FARM_BEDARF")
    && anfrage.materialAcquisition.planningOnly === true
    && anfrage.materialAcquisition.ausfuehrungsAutoritaet === false
    && anfrage.materialAcquisition.gameplayAutoritaet === false
    && anfrage.materialAcquisition.rawWriteAutoritaet === false
    && anfrage.materialAcquisition.normalRuntimeAllowed === false
    && anfrage.materialAcquisition.currentPr20_9CandidateAcquisitionAllowed === false
    && anfrage.materialAcquisition.pr22ProduktivGateErforderlich === true
    && anfrage.materialAcquisition.pr23ProduktivGateErforderlich === true;

  const materialFoundationChain =
    bewerteCap022FoundationChain(anfrage.materialFoundationChain);
  const materialFoundationChainReady =
    materialFoundationChain.status === "CAP022_FULL_CHAIN_BEREIT_NO_WRITE"
    && materialFoundationChain.allRequiredFoundationsPresent === true
    && materialFoundationChain.allRequiredFoundationsReady === true
    && materialFoundationChain.currentPr20_9RatificationCredit === false
    && materialFoundationChain.candidateAcquisitionOrMutationAllowedNow === false
    && materialFoundationChain.durableIntentCreated === false
    && materialFoundationChain.productiveCraftAuthorityOpened === false
    && materialFoundationChain.productiveExecutionAllowed === false
    && materialFoundationChain.gameplayAuthority === false
    && materialFoundationChain.rawWriteAuthority === false
    && materialFoundationChain.normalRuntimeAllowed === false;

  const stageRows = Object.freeze([
    stage("PR21", pr21Ready, anfrage.pr20ProductiveComplete),
    stage("PR22", pr22Ready, false),
    stage("PR23", pr23Ready, false),
    stage("PR24", pr24Ready, false),
    stage("PR25", pr25Ready, false),
    stage("PR26", pr26Ready, false),
    stage("PR27", pr27Ready, false),
    stage("PR28", pr28Ready, false),
  ]);

  const blocker: string[] = [];
  for (const row of stageRows) {
    if (!row.foundationReady) blocker.push("PR21_28_FOUNDATION_BLOCKIERT:" + row.stage);
  }
  if (!materialAcquisitionReady) {
    blocker.push("PR21_28_FOUNDATION_BLOCKIERT:CAP022_MATERIAL_ACQUISITION");
  }
  if (!materialFoundationChainReady) {
    blocker.push("PR21_28_FOUNDATION_BLOCKIERT:CAP022_FULL_CHAIN");
    for (const grund of materialFoundationChain.blocker) {
      blocker.push("PR21_28_CAP022_CHAIN:" + grund);
    }
  }

  const readiness = [
    pr21Ready, pr22Ready, pr23Ready, pr24Ready,
    pr25Ready, pr26Ready, pr27Ready, pr28Ready,
  ];
  let highestPreparedStage: Pr21_28Stage | null = null;
  for (let index = 0; index < readiness.length; index += 1) {
    if (!readiness[index]) break;
    highestPreparedStage = stageRows[index]?.stage ?? highestPreparedStage;
  }

  const allFoundationsConnected = readiness.every(Boolean)
    && materialAcquisitionReady
    && materialFoundationChainReady;

  return Object.freeze({
    schemaVersion: 1,
    status: allFoundationsConnected ? "SHADOW_PIPELINE_BEREIT_NO_WRITE" : "BLOCKIERT",
    blocker: Object.freeze(blocker),
    stages: stageRows,
    highestPreparedStage,
    allFoundationsConnected,
    materialAcquisitionFoundationReady: materialAcquisitionReady,
    materialFoundationChainReady,
    materialFoundationChainStatus: materialFoundationChain.status,
    materialFoundationChainBlocker: Object.freeze([...materialFoundationChain.blocker]),
    materialAcquisitionProductiveExecutionAllowed: false,
    deferredLiveEvidenceRequired: true,
    gameplayWrites: 0,
    publicFunctionCalls: 0,
    rawWriteCalls: 0,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}
