import { pruefeLiveLabAdmission } from "./authority-profile.mjs";

const STAGES = Object.freeze([
  "PR21",
  "PR22",
  "PR23",
  "PR24",
  "PR25",
  "PR26",
  "PR27",
  "PR28",
]);

const READY_STATUS = Object.freeze({
  PR21: new Set(["BEREIT_FUER_INTEGRATIONSTEST_NO_WRITE", "BEREIT"]),
  PR22: new Set(["ABGESCHLOSSEN", "BEREIT_NO_WRITE", "BEREIT"]),
  PR23: new Set(["BEREIT_NO_WRITE", "BEREIT"]),
  PR24: new Set(["BEREIT_NO_WRITE", "BESTANDEN", "BEREIT"]),
  PR25: new Set(["BESTANDEN", "BEREIT_NO_WRITE", "BEREIT"]),
  PR26: new Set(["AUSWAHL_BEREIT_NO_WRITE", "PLAN_BEREIT_NO_WRITE", "BEREIT"]),
  PR27: new Set(["AUSWAHL_BEREIT_NO_WRITE", "PLAN_BEREIT_NO_WRITE", "BEREIT"]),
  PR28: new Set(["PLAN_BEREIT_NO_WRITE", "BEREIT"]),
});

const SCOPES = Object.freeze({
  PR21: Object.freeze({
    merchantAuthority: true,
  }),
  PR22: Object.freeze({
    coordinationAuthority: true,
    sendCmAuthority: true,
  }),
  PR23: Object.freeze({
    movementAuthority: true,
    combatAuthority: true,
    skillAuthority: true,
    lootAuthority: true,
    respawnAuthority: true,
  }),
  PR24: Object.freeze({
    groupAuthority: true,
  }),
  PR25: Object.freeze({
    groupAuthority: true,
    liveEvidenceCollectionAuthority: true,
  }),
  PR26: Object.freeze({
    optimizerAuthority: true,
    taskSelectionAuthority: true,
  }),
  PR27: Object.freeze({
    progressionAuthority: true,
  }),
  PR28: Object.freeze({
    worldActionAuthority: true,
    serverHopAuthority: true,
  }),
});

function list(value) {
  return Array.isArray(value) ? value : [];
}

function validateStage(stage) {
  if (!STAGES.includes(stage)) throw new Error("LIVE_LAB_STAGE_INVALID:" + String(stage));
}

function shadowIsReady(stage, shadowDecision) {
  if (!shadowDecision || typeof shadowDecision !== "object") return false;
  if (!READY_STATUS[stage].has(String(shadowDecision.status || ""))) return false;
  if (list(shadowDecision.blocker).length > 0) return false;

  // The official PR21-28 foundations intentionally carry no productive authority.
  // Live Lab treats that as proof that the decision came from the planning/shadow boundary,
  // never as permission by itself.
  if (shadowDecision.rawWriteAuthority === true) return false;
  return true;
}

export function promoteLiveLabStage({
  stage,
  shadowDecision,
  safety = {},
} = {}) {
  validateStage(stage);

  const admission = pruefeLiveLabAdmission(safety);
  const shadowReady = shadowIsReady(stage, shadowDecision);
  const blocker = [...admission.blocker];

  if (!shadowReady) blocker.push("LIVE_LAB_SHADOW_DECISION_NOT_READY:" + stage);

  const admitted = blocker.length === 0;
  const scope = SCOPES[stage];

  return Object.freeze({
    schemaVersion: 1,
    stage,
    status: admitted ? "LIVE_STAGE_ADMITTED" : "BLOCKED",
    blocker: Object.freeze(blocker),
    shadowStatus: shadowDecision?.status ?? null,

    // Requested Live Lab switches.
    liveExecutionAllowed: admitted,
    gameplayAuthority: admitted,
    normalRuntimeAllowed: admitted,

    // Raw transport bypass remains closed.
    rawWriteAuthority: false,

    executionAuthority: admitted,
    movementAuthority: admitted && scope.movementAuthority === true,
    combatAuthority: admitted && scope.combatAuthority === true,
    skillAuthority: admitted && scope.skillAuthority === true,
    lootAuthority: admitted && scope.lootAuthority === true,
    respawnAuthority: admitted && scope.respawnAuthority === true,
    merchantAuthority: admitted && scope.merchantAuthority === true,
    coordinationAuthority: admitted && scope.coordinationAuthority === true,
    sendCmAuthority: admitted && scope.sendCmAuthority === true,
    groupAuthority: admitted && scope.groupAuthority === true,
    liveEvidenceCollectionAuthority:
      admitted && scope.liveEvidenceCollectionAuthority === true,
    optimizerAuthority: admitted && scope.optimizerAuthority === true,
    taskSelectionAuthority: admitted && scope.taskSelectionAuthority === true,
    progressionAuthority: admitted && scope.progressionAuthority === true,
    worldActionAuthority: admitted && scope.worldActionAuthority === true,
    serverHopAuthority: admitted && scope.serverHopAuthority === true,
  });
}

export function promoteLiveLabPipeline({
  stages,
  safety = {},
} = {}) {
  const rows = [];
  const blockers = [];

  for (const stage of STAGES) {
    const decision = stages?.[stage] ?? null;
    const row = promoteLiveLabStage({
      stage,
      shadowDecision: decision,
      safety,
    });
    rows.push(row);
    for (const blocker of row.blocker) {
      blockers.push(stage + ":" + blocker);
    }
  }

  const allAdmitted = rows.every((row) => row.status === "LIVE_STAGE_ADMITTED");

  return Object.freeze({
    schemaVersion: 1,
    status: allAdmitted ? "LIVE_PIPELINE_ADMITTED" : "BLOCKED",
    blocker: Object.freeze(blockers),
    stages: Object.freeze(rows),
    liveExecutionAllowed: allAdmitted,
    gameplayAuthority: allAdmitted,
    normalRuntimeAllowed: allAdmitted,
    rawWriteAuthority: false,
    pr21ThroughPr28Live: allAdmitted,
  });
}

export const LIVE_LAB_STAGE_ORDER = STAGES;
