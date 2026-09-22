import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("werkzeuge/pr20-5-merchant-stability-autonomous-4char.js", "utf8");
const plan = JSON.parse(fs.readFileSync("roadmap/pr20-5-autonomous-4char-test-plan.json", "utf8"));

test("PR20.5 autonomous package starts without operator actions", () => {
  assert.equal(plan.autoStart, true);
  assert.equal(plan.operatorInteractionAfterLoad, false);
  assert.equal(plan.coordinatorClass, "merchant");
  assert.deepEqual(plan.workerClasses, ["ranger", "priest", "mage"]);
  for (const c of ["merchant", "ranger", "priest", "mage"]) assert.ok(source.includes("'" + c + "'"));
});

test("PR20.5 package remains strict NO-WRITE", () => {
  for (const forbidden of [
    "send_item(", "send_gold(", "bank_store(", "bank_retrieve(", "buy(", "sell(",
    "use_skill(", "equip(", "upgrade(", "compound(", "exchange(", "craft(",
    "socket.emit(", ".emit(", "fetch("
  ]) assert.equal(source.includes(forbidden), false, forbidden);
  assert.equal(plan.gameplayWrites, 0);
  assert.equal(plan.rawWriteCalls, 0);
  assert.equal(plan.sameIntentRetry, false);
});

test("PR20.5 accepts merged PR20.4 exit evidence and optional persistent local evidence", () => {
  assert.ok(source.includes("AIO_V5_PR20_4_TRANSFER_STEP_TEST_V1"));
  assert.ok(source.includes("BESTANDEN_REAL_INGAME_16_OF_16"));
  assert.ok(source.includes("MERGED_REPO_EXIT_EVIDENCE"));
  assert.equal(plan.pr20_4Gate.repoStatus, "BESTANDEN_REAL_INGAME_16_OF_16");
});

test("PR20.5 package contains full stability matrix and 15m integration soak", () => {
  for (const marker of [
    "IRREVERSIBLE_MUTATION_OFFEN",
    "KEIN_SICHERER_DURABLER_UNTERBRECHUNGSPUNKT",
    "SCHEDULER_GIBT_KEINEN_VORRANG",
    "SAFETY_PREEMPTION",
    "STARVATION_GRENZE_ERREICHT",
    "MINDEST_HALTEDAUER",
    "WECHSEL_COOLDOWN",
    "WECHSEL_BUDGET_ERSCHOEPFT",
    "STABILER_WECHSEL_ERLAUBT",
    "15 * 60 * 1000"
  ]) assert.ok(source.includes(marker), marker);
});

test("Supabase transport reuses observational bridge and exposes no secret", () => {
  assert.ok(source.includes("AIO_V3.operations"));
  assert.ok(source.includes("WINDOWS_BRIDGE_5S_LOCAL_OBSERVE_60S_AGGREGATE_PLUS_TERMINAL_PUSH"));
  for (const secret of ["service_role", "SUPABASE_SERVICE_ROLE_KEY", "sb_secret_", "Bearer "]) {
    assert.equal(source.includes(secret), false, secret);
  }
  assert.equal(plan.telemetry.monthlyEdgeInvocationLimit, 500000);
  assert.equal(plan.telemetry.safetyReserve, 5000);
});

test("PR20.5 pass alone cannot start normal bot runtime", () => {
  assert.equal(plan.allTestsGate.normalBotRuntimeStartsAfterPr20_5Only, false);
  assert.equal(plan.allTestsGate.normalBotRuntimeRequiresAllRemainingV5TestsBestanden, true);
});

test("PR20.5 telemetry facade preserves an existing operations surface", () => {
  assert.ok(source.includes("__v5Pr205FacadeVersion"));
  assert.ok(source.includes("...(existing || {})"));
  assert.ok(source.includes("existingStatus.bind(existing)"));
  assert.ok(source.includes("existingHeartbeat.bind(existing)"));
  assert.ok(source.includes("existingReconciliation.bind(existing)"));
  assert.ok(source.includes("existingPeekTelemetry.bind(existing)"));
  assert.ok(source.includes("v5AutonomousTest:publicState"));
  assert.equal(source.includes("if (existing && typeof existing.status === 'function') return false;"), false);
});
