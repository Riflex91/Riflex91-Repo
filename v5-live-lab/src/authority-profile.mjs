export const LIVE_LAB_PROFILE_ID = "V5_LIVE_LAB_PR28";
export const LIVE_LAB_SOURCE_MAIN_SHA = "3fde62bd75aaed495b60cc71b1cfc4c197af4316";

const BASE_AUTHORITY = Object.freeze({
  profileId: LIVE_LAB_PROFILE_ID,
  sourceMainSha: LIVE_LAB_SOURCE_MAIN_SHA,
  liveExecutionAllowed: true,
  gameplayAuthority: true,
  normalRuntimeAllowed: true,
  executionAuthority: true,
  movementAuthority: true,
  combatAuthority: true,
  skillAuthority: true,
  lootAuthority: true,
  respawnAuthority: true,
  merchantAuthority: true,
  worldActionAuthority: true,
  serverHopAuthority: true,

  // Live Lab intentionally keeps direct/raw transport writes closed.
  // Real actions must go through the normal V5 / Adventure Land adapters.
  rawWriteAuthority: false,

  safety: Object.freeze({
    emergencyStopRequired: true,
    capabilityDenyRequired: true,
    sessionFreshnessRequired: true,
    rosterFreshnessRequired: true,
    restartReconciliationRequired: true,
    duplicateEffectProtectionRequired: true,
    ownershipChecksRequired: true,
    aoeHardCapsRequired: true,
    merchantAntiPingpongRequired: true,
    merchantAntiThrashRequired: true,
    worldContentQuarantineRequired: true,
    serverPolicyRequired: true,
    boundedRetryRequired: true,
  }),
});

export function pruefeLiveLabAdmission({
  emergencyStop = false,
  capabilityDenied = false,
  sessionFresh = true,
  rosterFresh = true,
  restartReconciled = true,
  duplicateEffectRisk = false,
  ownershipFresh = true,
  aoeHardCapsPassed = true,
  merchantPingpongDetected = false,
  merchantThrashDetected = false,
  worldContentAllowed = true,
  serverPolicyAllowed = true,
  retryBudgetAvailable = true,
} = {}) {
  const blocker = [];

  if (emergencyStop) blocker.push("LIVE_LAB_EMERGENCY_STOP");
  if (capabilityDenied) blocker.push("LIVE_LAB_CAPABILITY_DENIED");
  if (!sessionFresh) blocker.push("LIVE_LAB_SESSION_STALE");
  if (!rosterFresh) blocker.push("LIVE_LAB_ROSTER_STALE");
  if (!restartReconciled) blocker.push("LIVE_LAB_RESTART_NOT_RECONCILED");
  if (duplicateEffectRisk) blocker.push("LIVE_LAB_DUPLICATE_EFFECT_RISK");
  if (!ownershipFresh) blocker.push("LIVE_LAB_OWNERSHIP_STALE");
  if (!aoeHardCapsPassed) blocker.push("LIVE_LAB_AOE_HARD_CAP");
  if (merchantPingpongDetected) blocker.push("LIVE_LAB_MERCHANT_PINGPONG");
  if (merchantThrashDetected) blocker.push("LIVE_LAB_MERCHANT_THRASH");
  if (!worldContentAllowed) blocker.push("LIVE_LAB_WORLD_CONTENT_BLOCKED");
  if (!serverPolicyAllowed) blocker.push("LIVE_LAB_SERVER_POLICY_BLOCKED");
  if (!retryBudgetAvailable) blocker.push("LIVE_LAB_RETRY_BUDGET_EXHAUSTED");

  const admitted = blocker.length === 0;

  return Object.freeze({
    schemaVersion: 1,
    profileId: LIVE_LAB_PROFILE_ID,
    sourceMainSha: LIVE_LAB_SOURCE_MAIN_SHA,
    status: admitted ? "LIVE_ADMITTED" : "BLOCKED",
    blocker: Object.freeze(blocker),
    liveExecutionAllowed: admitted && BASE_AUTHORITY.liveExecutionAllowed,
    gameplayAuthority: admitted && BASE_AUTHORITY.gameplayAuthority,
    normalRuntimeAllowed: admitted && BASE_AUTHORITY.normalRuntimeAllowed,
    executionAuthority: admitted && BASE_AUTHORITY.executionAuthority,
    movementAuthority: admitted && BASE_AUTHORITY.movementAuthority,
    combatAuthority: admitted && BASE_AUTHORITY.combatAuthority,
    skillAuthority: admitted && BASE_AUTHORITY.skillAuthority,
    lootAuthority: admitted && BASE_AUTHORITY.lootAuthority,
    respawnAuthority: admitted && BASE_AUTHORITY.respawnAuthority,
    merchantAuthority: admitted && BASE_AUTHORITY.merchantAuthority,
    worldActionAuthority: admitted && BASE_AUTHORITY.worldActionAuthority,
    serverHopAuthority: admitted && BASE_AUTHORITY.serverHopAuthority,
    rawWriteAuthority: false,
    safety: BASE_AUTHORITY.safety,
  });
}

export function liveLabBuildIdentity(runtimeSha) {
  if (typeof runtimeSha !== "string" || !/^[0-9a-f]{7,40}$/i.test(runtimeSha)) {
    throw new Error("LIVE_LAB_RUNTIME_SHA_INVALID");
  }
  return Object.freeze({
    profileId: LIVE_LAB_PROFILE_ID,
    sourceMainSha: LIVE_LAB_SOURCE_MAIN_SHA,
    runtimeSha,
    buildId: `${LIVE_LAB_PROFILE_ID}@${runtimeSha.slice(0, 12)}`,
  });
}
