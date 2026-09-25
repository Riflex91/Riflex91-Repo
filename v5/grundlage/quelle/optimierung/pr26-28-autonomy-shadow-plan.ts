import type { Pr26TaskPartyOptimizerResult } from "./pr26-task-party-optimizer.js";
import type { Pr27ProgressionBalancerResult } from "./pr27-account-progression-balancer.js";
import type { Pr28WorldAutonomyGateResult } from "../welt/pr28-world-autonomy-gate.js";

export interface Pr26_28AutonomyShadowRequest {
  readonly schemaVersion: 1;
  readonly optimizer: Pr26TaskPartyOptimizerResult;
  readonly progression: Pr27ProgressionBalancerResult;
  readonly world: Pr28WorldAutonomyGateResult;
  readonly expectedTaskId: string;
  readonly expectedPartyId: string;
  readonly expectedCharacterId: string;
  readonly worldTaskRequired: boolean;
}

export interface Pr26_28AutonomyShadowPlan {
  readonly schemaVersion: 1;
  readonly status: "PLAN_BEREIT_NO_WRITE" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly taskId: string | null;
  readonly partyId: string | null;
  readonly progressionCharacterId: string | null;
  readonly worldTaskId: string | null;
  readonly hardFilterBeforeRanking: true;
  readonly safetyBeforeProgression: true;
  readonly worldRevalidationBeforeAction: true;
  readonly learningCanRelaxHardFilter: false;
  readonly discoveryCanReleaseQuarantine: false;
  readonly executionAuthority: false;
  readonly worldActionAuthority: false;
  readonly serverHopAuthority: false;
  readonly movementAuthority: false;
  readonly combatAuthority: false;
  readonly merchantAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly normalRuntimeAllowed: false;
}

function text(wert: string, fehler: string): void {
  if (wert.trim().length === 0 || wert.length > 192) throw new Error(fehler);
}

export function planePr26_28AutonomyShadow(
  anfrage: Pr26_28AutonomyShadowRequest,
): Pr26_28AutonomyShadowPlan {
  if (anfrage.schemaVersion !== 1) throw new Error("PR26_28_SHADOW_SCHEMA_UNGUELTIG");
  for (const wert of [
    anfrage.expectedTaskId,
    anfrage.expectedPartyId,
    anfrage.expectedCharacterId,
  ]) text(wert, "PR26_28_SHADOW_EXPECTED_BINDING_UNGUELTIG");

  const blocker: string[] = [];
  const selected = anfrage.optimizer.selected;
  const progression = anfrage.progression.selected;

  if (anfrage.optimizer.status !== "AUSWAHL_BEREIT_NO_WRITE" || selected === null) {
    blocker.push("PR26_28_OPTIMIZER_KEINE_ZULAESSIGE_AUSWAHL");
  } else {
    if (selected.taskId !== anfrage.expectedTaskId) blocker.push("PR26_28_TASK_BINDING_DRIFT");
    if (selected.partyId !== anfrage.expectedPartyId) blocker.push("PR26_28_PARTY_BINDING_DRIFT");
  }
  if (anfrage.optimizer.learningKannHardFilterNichtLockern !== true) {
    blocker.push("PR26_28_LEARNING_HARD_FILTER_UNBESTAETIGT");
  }
  if (anfrage.optimizer.executionAuthority !== false) {
    blocker.push("PR26_28_OPTIMIZER_AUTHORITY_UNSAFE");
  }

  if (anfrage.progression.status !== "AUSWAHL_BEREIT_NO_WRITE" || progression === null) {
    blocker.push("PR26_28_PROGRESSION_KEINE_ZULAESSIGE_AUSWAHL");
  } else if (progression.characterId !== anfrage.expectedCharacterId) {
    blocker.push("PR26_28_CHARACTER_BINDING_DRIFT");
  }
  if (anfrage.progression.safetyVorBalance !== true
      || anfrage.progression.executionAuthority !== false) {
    blocker.push("PR26_28_PROGRESSION_SAFETY_UNBESTAETIGT");
  }

  if (anfrage.worldTaskRequired) {
    if (anfrage.world.status !== "PLAN_BEREIT_NO_WRITE") {
      blocker.push("PR26_28_WORLD_GATE_BLOCKIERT");
    }
    if (anfrage.world.taskId !== anfrage.expectedTaskId) {
      blocker.push("PR26_28_WORLD_TASK_BINDING_DRIFT");
    }
  }
  if (anfrage.world.worldActionAuthority !== false
      || anfrage.world.serverHopAuthority !== false
      || anfrage.world.gameplayAuthority !== false
      || anfrage.world.rawWriteAuthority !== false) {
    blocker.push("PR26_28_WORLD_AUTHORITY_UNSAFE");
  }

  return Object.freeze({
    schemaVersion: 1,
    status: blocker.length === 0 ? "PLAN_BEREIT_NO_WRITE" : "BLOCKIERT",
    blocker: Object.freeze(blocker),
    taskId: selected?.taskId ?? null,
    partyId: selected?.partyId ?? null,
    progressionCharacterId: progression?.characterId ?? null,
    worldTaskId: anfrage.worldTaskRequired ? anfrage.world.taskId : null,
    hardFilterBeforeRanking: true,
    safetyBeforeProgression: true,
    worldRevalidationBeforeAction: true,
    learningCanRelaxHardFilter: false,
    discoveryCanReleaseQuarantine: false,
    executionAuthority: false,
    worldActionAuthority: false,
    serverHopAuthority: false,
    movementAuthority: false,
    combatAuthority: false,
    merchantAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    normalRuntimeAllowed: false,
  });
}
