export type Pr23FarmerAction =
  | "MOVEMENT"
  | "COMBAT"
  | "SKILL"
  | "LOOT"
  | "RESPAWN"
  | "AOE";

export interface Pr23FarmerShadowRequest {
  readonly schemaVersion: 1;
  readonly action: Pr23FarmerAction;
  readonly characterId: string;
  readonly sessionFresh: boolean;
  readonly rosterFresh: boolean;
  readonly lifecycleActive: boolean;
  readonly restartReconciled: boolean;
  readonly movementOwnershipFresh: boolean;
  readonly arrivalEvidenceFresh: boolean;
  readonly targetOwnershipFresh: boolean;
  readonly targetEvidenceFresh: boolean;
  readonly skillEvidenceFresh: boolean;
  readonly sharedCooldownReady: boolean;
  readonly equipmentEvidenceFresh: boolean;
  readonly conditionEvidenceFresh: boolean;
  readonly lootEvidenceFresh: boolean;
  readonly respawnEligible: boolean;
  readonly hp: number;
  readonly maxHp: number;
  readonly mp: number;
  readonly maxMp: number;
  readonly aoeTargetCount: number;
  readonly aoeExpectedDps: number;
  readonly aoeMaxTargets: number;
  readonly aoeMaxExpectedDps: number;
  readonly aoeMinHpRatio: number;
  readonly safetyPreempted: boolean;
}

export interface Pr23FarmerShadowAdmission {
  readonly schemaVersion: 1;
  readonly action: Pr23FarmerAction;
  readonly status: "BEREIT_NO_WRITE" | "BLOCKIERT";
  readonly blocker: readonly string[];
  readonly movementAuthority: false;
  readonly combatAuthority: false;
  readonly skillAuthority: false;
  readonly lootAuthority: false;
  readonly respawnAuthority: false;
  readonly gameplayAuthority: false;
  readonly rawWriteAuthority: false;
  readonly blindResumeAllowed: false;
  readonly normalRuntimeAllowed: false;
}

function pruefeNichtnegativ(wert: number, fehler: string): void {
  if (!Number.isFinite(wert) || wert < 0) throw new Error(fehler);
}

export function pruefePr23FarmerShadowAdmission(
  anfrage: Pr23FarmerShadowRequest,
): Pr23FarmerShadowAdmission {
  if (anfrage.schemaVersion !== 1
      || anfrage.characterId.trim().length === 0
      || anfrage.characterId.length > 192) {
    throw new Error("PR23_FARMER_SCHEMA_ODER_CHARACTER_UNGUELTIG");
  }
  for (const [wert, fehler] of [
    [anfrage.hp, "PR23_FARMER_HP_UNGUELTIG"],
    [anfrage.maxHp, "PR23_FARMER_MAX_HP_UNGUELTIG"],
    [anfrage.mp, "PR23_FARMER_MP_UNGUELTIG"],
    [anfrage.maxMp, "PR23_FARMER_MAX_MP_UNGUELTIG"],
    [anfrage.aoeTargetCount, "PR23_FARMER_AOE_TARGETS_UNGUELTIG"],
    [anfrage.aoeExpectedDps, "PR23_FARMER_AOE_DPS_UNGUELTIG"],
    [anfrage.aoeMaxTargets, "PR23_FARMER_AOE_MAX_TARGETS_UNGUELTIG"],
    [anfrage.aoeMaxExpectedDps, "PR23_FARMER_AOE_MAX_DPS_UNGUELTIG"],
    [anfrage.aoeMinHpRatio, "PR23_FARMER_AOE_HP_RATIO_UNGUELTIG"],
  ] as const) pruefeNichtnegativ(wert, fehler);
  if (anfrage.maxHp <= 0 || anfrage.maxMp <= 0
      || anfrage.hp > anfrage.maxHp || anfrage.mp > anfrage.maxMp
      || anfrage.aoeMinHpRatio > 1
      || !Number.isSafeInteger(anfrage.aoeTargetCount)
      || !Number.isSafeInteger(anfrage.aoeMaxTargets)) {
    throw new Error("PR23_FARMER_GRENZEN_UNGUELTIG");
  }

  const blocker: string[] = [];
  if (!anfrage.sessionFresh) blocker.push("PR23_SESSION_STALE");
  if (!anfrage.rosterFresh) blocker.push("PR23_ROSTER_STALE");
  if (!anfrage.restartReconciled) blocker.push("PR23_RESTART_NICHT_RECONCILED");
  if (anfrage.safetyPreempted) blocker.push("PR23_SAFETY_PREEMPTED");

  if (anfrage.action !== "RESPAWN" && !anfrage.lifecycleAktiv) {
    blocker.push("PR23_LIFECYCLE_NICHT_AKTIV");
  }

  if (anfrage.action === "MOVEMENT") {
    if (!anfrage.movementOwnershipFresh) blocker.push("PR23_MOVEMENT_OWNER_STALE");
  }

  if (anfrage.action === "LOOT" && !anfrage.arrivalEvidenceFresh) {
    blocker.push("PR23_ARRIVAL_EVIDENCE_FEHLT");
  }

  if (anfrage.action === "COMBAT" || anfrage.action === "SKILL" || anfrage.action === "AOE") {
    if (!anfrage.targetOwnershipFresh) blocker.push("PR23_TARGET_OWNER_STALE");
    if (!anfrage.targetEvidenceFresh) blocker.push("PR23_TARGET_EVIDENCE_STALE");
    if (!anfrage.equipmentEvidenceFresh) blocker.push("PR23_EQUIPMENT_EVIDENCE_STALE");
    if (!anfrage.conditionEvidenceFresh) blocker.push("PR23_CONDITION_EVIDENCE_STALE");
  }

  if (anfrage.action === "SKILL" || anfrage.action === "AOE") {
    if (!anfrage.skillEvidenceFresh) blocker.push("PR23_SKILL_EVIDENCE_STALE");
    if (!anfrage.sharedCooldownReady) blocker.push("PR23_SHARED_COOLDOWN_NICHT_BEREIT");
  }

  if (anfrage.action === "LOOT" && !anfrage.lootEvidenceFresh) {
    blocker.push("PR23_LOOT_EVIDENCE_STALE");
  }

  if (anfrage.action === "RESPAWN" && !anfrage.respawnEligible) {
    blocker.push("PR23_RESPAWN_NICHT_FREIGEGEBEN");
  }

  if (anfrage.action === "AOE") {
    const hpRatio = anfrage.maxHp === 0 ? 0 : anfrage.hp / anfrage.maxHp;
    if (anfrage.aoeTargetCount > anfrage.aoeMaxTargets) blocker.push("PR23_AOE_TARGET_HARD_CAP");
    if (anfrage.aoeExpectedDps > anfrage.aoeMaxExpectedDps) blocker.push("PR23_AOE_DPS_HARD_CAP");
    if (hpRatio < anfrage.aoeMinHpRatio) blocker.push("PR23_AOE_HP_HARD_CAP");
  }

  return Object.freeze({
    schemaVersion: 1,
    action: anfrage.action,
    status: blocker.length === 0 ? "BEREIT_NO_WRITE" : "BLOCKIERT",
    blocker: Object.freeze(blocker),
    movementAuthority: false,
    combatAuthority: false,
    skillAuthority: false,
    lootAuthority: false,
    respawnAuthority: false,
    gameplayAuthority: false,
    rawWriteAuthority: false,
    blindResumeAllowed: false,
    normalRuntimeAllowed: false,
  });
}
