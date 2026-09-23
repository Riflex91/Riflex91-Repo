import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("werkzeuge/pr20-6-mluck-autonomous-live-5m.js", "utf8");
const plan = JSON.parse(fs.readFileSync("roadmap/pr20-6-mluck-autonomous-test-plan.json", "utf8"));

function occurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

test("PR20.6 autonomous MLuck package is AUTO_ON_LOAD for the 4-character roster", () => {
  assert.equal(plan.autoStart, true);
  assert.equal(plan.operatorInteractionAfterLoad, false);
  assert.equal(plan.coordinatorClass, "merchant");
  assert.deepEqual(plan.workerClasses, ["ranger", "priest", "mage"]);
  assert.equal(plan.testId, "pr20-6-mluck-autonomous-live-5m");
  assert.equal(plan.controllerVersion, "1.0.3");
  assert.equal(plan.stateKey, "AIO_V5_PR20_6_MLUCK_LIVE_5M_V1");
  assert.equal(plan.actorsKey, "AIO_V5_PR20_6_MLUCK_ACTORS_V1");
  assert.ok(source.includes("Promise.resolve().then(run)"));
});

test("PR20.6 auto-starts only owned missing farmer classes before worker distribution", () => {
  assert.equal(plan.characterLifecycle.accountRosterSource, "get_characters");
  assert.equal(plan.characterLifecycle.activeRunnerSource, "get_active_characters");
  assert.equal(plan.characterLifecycle.autoStartMissingOwnedFarmerClasses, true);
  assert.equal(plan.characterLifecycle.startApi, "start_character");
  assert.equal(plan.characterLifecycle.startCodeSlotArgument, null);
  assert.equal(plan.characterLifecycle.mode, "ACCOUNT_ROSTER_AUTOSTART_V2");
  assert.equal(plan.characterLifecycle.maximumStartAttemptsPerClass, 2);
  assert.equal(plan.characterLifecycle.rosterWaitMaximumMs, 120000);
  assert.equal(plan.characterLifecycle.gameplayWritesFromLifecycle, 0);
  assert.equal(plan.characterLifecycle.rawWriteCallsFromLifecycle, 0);
  assert.equal(plan.characterLifecycle.freshActorRegistryDisambiguation, true);
  assert.equal(plan.characterLifecycle.freshActorRegistryRequiresNameClassAccountServerSessionMatch, true);
  assert.equal(plan.characterLifecycle.alreadyRunningRecovery.publicCommandApi, "say");
  assert.equal(plan.characterLifecycle.alreadyRunningRecovery.command, "/disconnect NAME");
  assert.equal(plan.characterLifecycle.alreadyRunningRecovery.directApiCallAllowed, false);
  assert.equal(plan.characterLifecycle.alreadyRunningRecovery.maximumDisconnectAttemptsPerClass, 1);
  assert.equal(plan.characterLifecycle.alreadyRunningRecovery.persistBeforeCommandBoundary, true);
  assert.equal(plan.characterLifecycle.alreadyRunningRecovery.postconditionSource, "get_characters");
  assert.equal(plan.characterLifecycle.alreadyRunningRecovery.postcondition, "online === false");
  assert.equal(plan.characterLifecycle.alreadyRunningRecovery.postconditionMaximumMs, 30000);
  assert.equal(plan.characterLifecycle.alreadyRunningRecovery.restartSafeNoSecondDisconnect, true);
  for (const marker of [
    "ACCOUNT_ROSTER_AUTOSTART_V2",
    "get_characters",
    "start_character",
    "MAX_START_ATTEMPTS_PER_CLASS = 2",
    "ROSTER_WAIT_MAX_MS = 120_000",
    "PR20_6_ROSTER_AUTOSTART_TIMEOUT",
    "ACTIVE_FRESH_ACTOR",
    "PUBLIC_SAY_DISCONNECT_V1",
    "WAITING_OFFLINE_POSTCONDITION",
    "DISCONNECT_POSTCONDITION_MAX_MS = 30_000",
    "'/disconnect '+target.name"
  ]) assert.ok(source.includes(marker), marker);
  assert.ok(source.includes("ACTIVE_CHARACTER_STATES.includes(text(state))"));
  assert.ok(source.includes("TARGET_CLASSES.includes(owned.ctype)"));
});

test("PR20.6 exposes only the narrow one-shot MLuck gameplay write", () => {
  assert.equal(plan.authority.publicFunction, "use_skill");
  assert.equal(plan.authority.skill, "mluck");
  assert.equal(plan.authority.genericUseSkillAuthority, false);
  assert.equal(plan.authority.oneShot, true);
  assert.equal(plan.gameplayWrites, 1);
  assert.equal(plan.rawWriteCalls, 0);
  assert.equal(plan.sameIntentRetry, false);
  assert.equal(occurrences(source, "api.call(root(),'mluck',rv.entity)"), 1);
  assert.ok(source.includes("const api=root().use_skill"));
  assert.equal(source.includes("socket.emit("), false);
  assert.equal(source.includes(".socket.emit("), false);
  assert.equal(source.includes("api_call("), false);
});

test("PR20.6 persists intent before the possible send boundary and never retries UNKNOWN", () => {
  for (const marker of [
    "DURABLE_INTENT",
    "SEND_BOUNDARY_ENTERED",
    "RECOVERY_PENDING",
    "COMMITTED",
    "OPERATOR_REQUIRED",
    "MLUCK_DURABLE_INTENT_ROUNDTRIP_FEHLT",
    "MLUCK_RECOVERY_UNGEKLAERT_KEIN_RETRY",
    "sameIntentRetry:false"
  ]) assert.ok(source.includes(marker), marker);
  assert.equal(plan.authority.durableIntentBeforePossibleSend, true);
  assert.equal(plan.recovery.unknownRequiresReobserveReconcile, true);
  assert.equal(plan.recovery.blindRetry, false);
  assert.equal(plan.recovery.sameIntentRetry, false);
  assert.equal(plan.recovery.unresolvedUnknown, "OPERATOR_REQUIRED");
});

test("PR20.6 live preflight is fail-closed on account, server, instance, range and MLuck ownership", () => {
  for (const marker of [
    "SAME_ACCOUNT_FEHLT",
    "SAME_SERVER_FEHLT",
    "SAME_INSTANCE_FEHLT",
    "TARGET_SESSION_FEHLT",
    "TARGET_EVIDENCE_STALE",
    "TARGET_AUSSER_REICHWEITE",
    "MLUCK_COOLDOWN_AKTIV",
    "MERCHANT_LEVEL_ZU_NIEDRIG",
    "MP_ZU_NIEDRIG",
    "FREMDES_STARKES_MLUCK_DARF_NICHT_UEBERSCHRIEBEN_WERDEN",
    "EIGENES_STARKES_MLUCK_BEREITS_AKTIV",
    "MLUCK_PRE_SEND_REVALIDIERUNG_FEHLGESCHLAGEN"
  ]) assert.ok(source.includes(marker), marker);
  assert.equal(plan.preconditions.merchantLevelAtLeast, 40);
  assert.equal(plan.preconditions.merchantMpAtLeast, 10);
  assert.equal(plan.preconditions.mluckRangeAtMost, 320);
  assert.equal(plan.preconditions.criticalMerchantWorkBlocks, true);
});

test("PR20.6 requires a five-minute committed soak with at least 60 samples", () => {
  assert.ok(source.includes("const SOAK_MS = 5 * 60 * 1000"));
  assert.ok(source.includes("const SOAK_SAMPLE_MS = 5_000"));
  assert.ok(source.includes("const MIN_SOAK_SAMPLES = 60"));
  for (const marker of [
    "INTENT_STATUS_DRIFT",
    "ZUSAETZLICHER_MLUCK_INTENT",
    "GAMEPLAY_WRITE_BUDGET_DRIFT",
    "TARGET_HEARTBEAT_STALE",
    "MLUCK_SETTLEMENT_DRIFT"
  ]) assert.ok(source.includes(marker), marker);
  assert.equal(plan.soak.durationMs, 300000);
  assert.equal(plan.soak.minimumSamples, 60);
  assert.equal(plan.soak.requiresExactlyOneGameplayWrite, true);
  assert.equal(plan.soak.requiresNoSecondIntent, true);
});

test("PR20.6 reuses the observational Windows Bridge telemetry and exposes no secret", () => {
  assert.ok(source.includes("AIO_V3.operations"));
  assert.ok(source.includes("v5AutonomousTest:state"));
  assert.ok(source.includes("WINDOWS_BRIDGE_5S_LOCAL_OBSERVE_60S_AGGREGATE_PLUS_TERMINAL_PUSH"));
  for (const secret of ["service_role", "SUPABASE_SERVICE_ROLE_KEY", "sb_secret_", "Bearer "]) {
    assert.equal(source.includes(secret), false, secret);
  }
  assert.equal(plan.telemetry.localObservationSeconds, 5);
  assert.equal(plan.telemetry.supabaseStatusSeconds, 60);
  assert.equal(plan.telemetry.terminalEventImmediate, true);
});

test("PR20.6 remains gated behind PR20.5 and cannot unlock normal runtime by itself", () => {
  assert.ok(source.includes("BESTANDEN_REAL_INGAME_4CHAR_15M"));
  assert.equal(plan.pr20_5Gate.repoStatus, "BESTANDEN_REAL_INGAME_4CHAR_15M");
  assert.equal(plan.allTestsGate.normalBotRuntimeStartsAfterPr20_6Only, false);
  assert.equal(plan.allTestsGate.normalBotRuntimeRequiresAllRemainingV5TestsBestanden, true);
});


test("PR20.6 performance_trick is mandatory before autonomous execution", () => {
  assert.equal(plan.preconditions.performanceTrickRequired, true);
  assert.equal(plan.preconditions.performanceTrickFunction, "performance_trick");
  assert.equal(plan.preconditions.backgroundExecutionFailClosed, true);
  assert.ok(source.includes("performance_trick"));
  assert.ok(source.includes("PR20_6_PERFORMANCE_TRICK_UNAVAILABLE"));
  assert.ok(source.includes("BACKGROUND_EXECUTION"));
});
