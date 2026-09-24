import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const manifest = JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json", "utf8"));
const allowedPackages = Object.freeze({
  "pr20-6-mluck-autonomous-live-5m": Object.freeze({
    path: "v5/werkzeuge/pr20-6-mluck-autonomous-live-5m.js",
    expectedGlobal: "V5PR206MluckTest",
    gate: "PR20.6_MLUCK"
  }),
  "pr20-7-gear-occupied-slot-read-only-preflight": Object.freeze({
    path: "v5/werkzeuge/pr20-7-gear-read-only-autonomous.js",
    expectedGlobal: "V5PR207GearReadOnlyTest",
    gate: "PR20.7_GEAR"
  }),
  "pr20-7-gear-occupied-slot-shadow-no-write": Object.freeze({
    path: "v5/werkzeuge/pr20-7-gear-shadow-no-write-autonomous.js",
    expectedGlobal: "V5PR207GearShadowTest",
    gate: "PR20.7_GEAR"
  }),
  "pr20-7-gear-account-weapon-candidate-discovery": Object.freeze({
    path: "v5/werkzeuge/pr20-7-account-weapon-candidate-discovery.js",
    expectedGlobal: "V5PR207AccountWeaponCandidateDiscovery",
    gate: "PR20.7_GEAR"
  }),
  "pr20-7-gear-account-weapon-candidate-discovery-v2": Object.freeze({
    path: "v5/werkzeuge/pr20-7-account-weapon-candidate-discovery.js",
    expectedGlobal: "V5PR207AccountWeaponCandidateDiscovery",
    gate: "PR20.7_GEAR"
  }),
  "pr20-7-gear-weapon-offhand-acquisition-read-only-preflight": Object.freeze({
    path: "v5/werkzeuge/pr20-7-weapon-offhand-acquisition-read-only-v1-0-1-autonomous.js",
    expectedGlobal: "V5PR207WeaponOffhandAcquisitionReadOnly",
    gate: "PR20.7_GEAR"
  }),
  "pr20-7-gear-weapon-offhand-read-only-preflight": Object.freeze({
    path: "v5/werkzeuge/pr20-7-weapon-offhand-read-only-autonomous.js",
    expectedGlobal: "V5PR207WeaponOffhandReadOnlyTest",
    gate: "PR20.7_GEAR"
  }),
  "pr20-7-gear-occupied-slot-live-5m": Object.freeze({
    path: "v5/werkzeuge/pr20-7-gear-occupied-slot-live-5m.js",
    expectedGlobal: "V5PR207GearOccupiedLiveTest",
    gate: "PR20.7_GEAR"
  }),
  "pr20-6-native-updater-recovery-bootstrap-v1": Object.freeze({
    path: "v5/werkzeuge/pr20-6-updater-recovery-bootstrap.js",
    expectedGlobal: "V5PR206UpdaterRecoveryBootstrap",
    gate: "PR20.6_MLUCK"
  }),
  "pr20-6-native-updater-recovery-bootstrap-v2": Object.freeze({
    path: "v5/werkzeuge/pr20-6-updater-recovery-bootstrap.js",
    expectedGlobal: "V5PR206UpdaterRecoveryBootstrap",
    gate: "PR20.6_MLUCK"
  }),
  "pr20-6-native-updater-recovery-bootstrap-v3": Object.freeze({
    path: "v5/werkzeuge/pr20-6-updater-recovery-bootstrap.js",
    expectedGlobal: "V5PR206UpdaterRecoveryBootstrap",
    gate: "PR20.6_MLUCK"
  }),
  "pr20-6-native-updater-recovery-bootstrap-v4": Object.freeze({
    path: "v5/werkzeuge/pr20-6-updater-recovery-bootstrap.js",
    expectedGlobal: "V5PR206UpdaterRecoveryBootstrap",
    gate: "PR20.6_MLUCK"
  }),
  "pr20-6-native-updater-recovery-bootstrap-v5": Object.freeze({
    path: "v5/werkzeuge/pr20-6-updater-recovery-bootstrap-v5.js",
    expectedGlobal: "V5PR206UpdaterRecoveryBootstrap",
    gate: "PR20.6_MLUCK"
  }),
  "pr20-6-account-roster-x-recovery-v1": Object.freeze({
    path: "v5/werkzeuge/pr20-6-account-roster-x-recovery.js",
    expectedGlobal: "V5PR206AccountRosterXRecovery",
    gate: "PR20.6_MLUCK"
  }),
  "pr20-6-account-roster-x-recovery-v2": Object.freeze({
    path: "v5/werkzeuge/pr20-6-account-roster-x-recovery.js",
    expectedGlobal: "V5PR206AccountRosterXRecovery",
    gate: "PR20.6_MLUCK"
  })
});
const selected = allowedPackages[manifest.testId];
const packageFile = String(manifest.packagePath || "").replace(/^v5\//, "");
const packageBytes = fs.readFileSync(packageFile);
const packageSource = packageBytes.toString("utf8");
const sha256 = crypto.createHash("sha256").update(packageBytes).digest("hex");
const workerPackageFile = manifest.workerPackagePath
  ? String(manifest.workerPackagePath).replace(/^v5\//, "")
  : null;
const workerPackageBytes = workerPackageFile ? fs.readFileSync(workerPackageFile) : null;
const workerPackageSource = workerPackageBytes ? workerPackageBytes.toString("utf8") : null;
const workerSha256 = workerPackageBytes
  ? crypto.createHash("sha256").update(workerPackageBytes).digest("hex")
  : null;

test("V5 Auto-Deploy manifest is narrow, immutable and normal-runtime closed", () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.enabled, true);
  assert.equal(manifest.repository, "Riflex91/Riflex91-Repo");
  assert.equal(manifest.branch, "main");
  assert.ok(selected, "manifest testId must be explicitly allowlisted");
  assert.equal(manifest.gate, selected.gate);
  assert.equal(manifest.coordinatorClass, "merchant");
  assert.equal(manifest.workerDistribution, "PACKAGE_OWNED_COMMAND_CHARACTER");
  assert.match(manifest.sourceCommit, /^[0-9a-f]{40}$/);
  assert.match(manifest.packageSha256, /^[0-9a-f]{64}$/);
  assert.equal(manifest.packagePath, selected.path);
  assert.equal(manifest.expectedGlobal, selected.expectedGlobal);
  assert.equal(manifest.normalRuntimeAllowed, false);
  assert.ok(manifest.maxPackageBytes >= packageBytes.length);
  assert.ok(manifest.maxPackageBytes <= 128 * 1024);
});

test("Manifest SHA-256 matches the exact checked-in selected package", () => {
  assert.equal(sha256, manifest.packageSha256);
  assert.ok(packageSource.includes(manifest.testId));
  assert.ok(packageSource.includes(manifest.expectedGlobal));
});

test("Manifest sourceCommit contains the exact SHA-pinned package", () => {
  const pinnedBytes = execFileSync(
    "git",
    ["show", manifest.sourceCommit + ":" + manifest.packagePath],
    { encoding: null, maxBuffer: 256 * 1024 },
  );
  const pinnedSha256 = crypto.createHash("sha256")
    .update(pinnedBytes)
    .digest("hex");
  assert.equal(pinnedSha256, manifest.packageSha256);
  assert.deepEqual(pinnedBytes, packageBytes);
});

test("selected autonomous package keeps raw socket/API bypasses closed", () => {
  assert.equal(packageSource.includes("socket.emit("), false);
  assert.equal(packageSource.includes(".socket.emit("), false);
  assert.equal(packageSource.includes("api_call("), false);
});

test("PR20.6 MLuck package distributes only a narrow heartbeat worker to farmer classes", () => {
  if (manifest.testId !== "pr20-6-mluck-autonomous-live-5m") return;
  assert.ok(packageSource.includes("function workerSource()"));
  assert.ok(packageSource.includes("r.command_character(name,src)"));
  assert.ok(packageSource.includes("['ranger','priest','mage'].includes(workerClass)"));
  assert.ok(packageSource.includes("if(!['ranger','priest','mage'].includes(workerClass))return;"));
});

test("updater recovery bootstrap is terminal no-write only", () => {
  if (!manifest.testId.startsWith("pr20-6-native-updater-recovery-bootstrap-v")) return;
  assert.ok(["1.0.0", "1.0.1", "1.0.2", "1.0.3", "1.0.5"].includes(manifest.controllerVersion));
  assert.equal(packageSource.includes("gameplayWrites: 0"), true);
  assert.equal(packageSource.includes("rawWriteCalls: 0"), true);
  assert.equal(packageSource.includes("sameIntentRetry: false"), true);
  assert.equal(packageSource.includes("normalRuntimeAllowed: false"), true);
  assert.equal(packageSource.includes("use_skill("), false);
  assert.equal(packageSource.includes("start_character("), false);
});

test("account roster X recovery is read-only, performance-trick gated and exact-ranger pinned", () => {
  if (!manifest.testId.startsWith("pr20-6-account-roster-x-recovery-v")) return;
  assert.ok(["1.0.0", "1.0.1"].includes(manifest.controllerVersion));
  assert.equal(packageSource.includes("owner?.X?.characters"), true);
  assert.equal(packageSource.includes("performance_trick"), true);
  assert.equal(packageSource.includes("gameplayWrites: 0"), true);
  assert.equal(packageSource.includes("rawWriteCalls: 0"), true);
  assert.equal(packageSource.includes("sameIntentRetry: false"), true);
  assert.equal(packageSource.includes("normalRuntimeAllowed: false"), true);
  assert.equal(packageSource.includes("use_skill("), false);
  assert.equal(packageSource.includes("start_character("), false);
  assert.equal(packageSource.includes("/disconnect "), false);
  if (manifest.testId === "pr20-6-account-roster-x-recovery-v2") {
    assert.equal(packageSource.includes("OPERATOR_RANGER_NAME = 'My_Ranger1'"), true);
    assert.equal(packageSource.includes("ACCOUNT_MY_RANGER1_FEHLT"), true);
    assert.equal(packageSource.includes("text(row.name) === OPERATOR_RANGER_NAME"), true);
  }
});


test("bootstrap v4 keeps the legacy Windows-Bridge handshake compatible without changing package authority", () => {
  if (manifest.testId !== "pr20-6-native-updater-recovery-bootstrap-v4") return;
  assert.equal(manifest.controllerVersion, "1.0.5");
  assert.ok(packageSource.includes("const TEST_ID = 'pr20-6-native-updater-recovery-bootstrap-v4'"));
  assert.ok(packageSource.includes("const VERSION = '1.0.3'"));
  assert.ok(packageSource.includes("updaterVersion: '1.0.6'"));
  assert.equal(packageSource.includes("use_skill("), false);
  assert.equal(packageSource.includes("start_character("), false);
});


test("bootstrap v5 restores only the minimal Windows-Bridge observational contract", () => {
  if (manifest.testId !== "pr20-6-native-updater-recovery-bootstrap-v5") return;
  assert.equal(manifest.controllerVersion, "1.0.5");
  assert.ok(packageSource.includes("hostHeartbeat"));
  assert.ok(packageSource.includes("reconciliationStatus"));
  assert.ok(packageSource.includes("peekTelemetry"));
  assert.ok(packageSource.includes("updaterVersion: '1.0.6'"));
  assert.equal(packageSource.includes("use_skill("), false);
  assert.equal(packageSource.includes("start_character("), false);
  assert.equal(packageSource.includes("/disconnect "), false);
});

test("PR20.6 final manifest pins the bridge worker fallback to exact no-write farmer targets", () => {
  if (manifest.testId !== "pr20-6-mluck-autonomous-live-5m") return;
  assert.equal(manifest.controllerVersion, "1.0.7");
  assert.equal(manifest.workerVersion, "1.0.0");
  assert.equal(manifest.workerPackagePath, "v5/werkzeuge/pr20-6-mluck-worker.js");
  assert.equal(manifest.workerExpectedGlobal, "V5PR206MluckWorker");
  assert.deepEqual(manifest.workerTargets, [
    "My_Ranger1:ranger",
    "My_Priest:priest",
    "My_Mage:mage"
  ]);
  assert.equal(workerSha256, manifest.workerPackageSha256);
  assert.ok(workerPackageSource.includes("performance_trick"));
  assert.equal(workerPackageSource.includes("use_skill("), false);
  assert.equal(workerPackageSource.includes("api_call("), false);
  assert.equal(workerPackageSource.includes("socket.emit("), false);
  assert.equal(workerPackageSource.includes("start_character("), false);
  assert.equal(workerPackageSource.includes("/disconnect "), false);
});


test("PR20.7 Gear package is terminal read-only and does not touch farmer lifecycle", () => {
  if (manifest.testId !== "pr20-7-gear-occupied-slot-read-only-preflight") return;
  assert.equal(manifest.controllerVersion, "1.0.0");
  assert.equal("workerVersion" in manifest, false);
  assert.equal("workerPackagePath" in manifest, false);
  assert.equal("workerPackageSha256" in manifest, false);
  assert.equal("workerExpectedGlobal" in manifest, false);
  assert.equal("workerTargets" in manifest, false);
  assert.ok(packageSource.includes("performance_trick"));
  assert.ok(packageSource.includes("stableDoubleObservation"));
  assert.ok(packageSource.includes("gameplayWrites: 0"));
  assert.ok(packageSource.includes("rawWriteCalls: 0"));
  assert.ok(packageSource.includes("publicFunctionCalls: 0"));
  assert.ok(packageSource.includes("startCalls: 0"));
  assert.ok(packageSource.includes("disconnectCalls: 0"));
  assert.ok(packageSource.includes("farmerWorkersInstalled: 0"));
  assert.ok(packageSource.includes("normalRuntimeAllowed: false"));
  assert.ok(packageSource.includes("__v5Pr207AccountDiscoveryFacadeVersion"));
  assert.ok(packageSource.includes("v5AutonomousTest: clone(state)"));
  assert.ok(packageSource.includes("peekTelemetry: () => []"));
  assert.ok(packageSource.includes("await performanceStatus()"));
  assert.ok(packageSource.includes("await sleep(350)"));
  assert.ok(packageSource.includes("await sleep(150)"));
  assert.ok(packageSource.includes("globalThis.parent"));
  assert.equal(packageSource.includes("use_skill("), false);
  assert.equal(packageSource.includes("start_character("), false);
  assert.equal(packageSource.includes("command_character("), false);
  assert.equal(packageSource.includes("/disconnect "), false);
  assert.equal(packageSource.includes("equip("), false);
  assert.equal(packageSource.includes("unequip("), false);
  assert.equal(packageSource.includes("send_item("), false);
});


test("PR20.7 Gear shadow manifest stays merchant-only, durable-shadow and zero-write", () => {
  if (manifest.testId !== "pr20-7-gear-occupied-slot-shadow-no-write") return;
  assert.equal(manifest.controllerVersion, "1.0.0");
  assert.equal("workerVersion" in manifest, false);
  assert.equal("workerPackagePath" in manifest, false);
  assert.equal("workerPackageSha256" in manifest, false);
  assert.equal("workerExpectedGlobal" in manifest, false);
  assert.equal("workerTargets" in manifest, false);
  assert.ok(packageSource.includes("performance_trick"));
  assert.ok(packageSource.includes("SHADOW_DURABLE_INTENT_NO_GAMEPLAY_WRITE"));
  assert.ok(packageSource.includes("durableReadback: true"));
  assert.ok(packageSource.includes("sendBoundaryState: 'NICHT_GESENDET'"));
  assert.ok(packageSource.includes("reconciliationClassification: 'NOT_APPLIED'"));
  assert.ok(packageSource.includes("gameplayWrites: 0"));
  assert.ok(packageSource.includes("rawWriteCalls: 0"));
  assert.ok(packageSource.includes("publicFunctionCalls: 0"));
  assert.ok(packageSource.includes("startCalls: 0"));
  assert.ok(packageSource.includes("disconnectCalls: 0"));
  assert.ok(packageSource.includes("farmerWorkersInstalled: 0"));
  assert.ok(packageSource.includes("normalRuntimeAllowed: false"));
  assert.equal(packageSource.includes("use_skill("), false);
  assert.equal(packageSource.includes("start_character("), false);
  assert.equal(packageSource.includes("command_character("), false);
  assert.equal(packageSource.includes("/disconnect "), false);
  assert.equal(packageSource.includes("equip("), false);
  assert.equal(packageSource.includes("unequip("), false);
  assert.equal(packageSource.includes("send_item("), false);
});


test("PR20.7 occupied-slot live manifest permits exactly one public equip and no bypass", () => {
  if (manifest.testId !== "pr20-7-gear-occupied-slot-live-5m") return;
  assert.equal(manifest.controllerVersion, "1.0.0");
  assert.equal("workerVersion" in manifest, false);
  assert.equal("workerPackagePath" in manifest, false);
  assert.equal("workerPackageSha256" in manifest, false);
  assert.equal("workerExpectedGlobal" in manifest, false);
  assert.equal("workerTargets" in manifest, false);
  assert.ok(packageSource.includes("performance_trick"));
  assert.ok(packageSource.includes('candidateName: "wcap"'));
  assert.ok(packageSource.includes('slot: "helmet"'));
  assert.ok(packageSource.includes("completionStatus:\"BESTANDEN\""));
  assert.ok(packageSource.includes("restartReconciliation"));
  assert.ok(packageSource.includes("resendAttempted:false"));
  assert.equal((packageSource.match(/r\.equip\(/g) || []).length, 1);
  assert.equal(packageSource.includes("unequip("), false);
  assert.equal(packageSource.includes("use_skill("), false);
  assert.equal(packageSource.includes("start_character("), false);
  assert.equal(packageSource.includes("command_character("), false);
  assert.equal(packageSource.includes("/disconnect "), false);
  assert.equal(packageSource.includes("send_item("), false);
  assert.equal(packageSource.includes("api_call("), false);
  assert.equal(packageSource.includes("socket.emit("), false);
});

test("PR20.7 weapon/offhand read-only manifest stays explicit-slot, class-bound and zero-write", () => {
  if (manifest.testId !== "pr20-7-gear-weapon-offhand-read-only-preflight") return;
  assert.equal(manifest.controllerVersion, "1.0.0");
  assert.equal("workerVersion" in manifest, false);
  assert.equal("workerPackagePath" in manifest, false);
  assert.equal("workerPackageSha256" in manifest, false);
  assert.equal("workerExpectedGlobal" in manifest, false);
  assert.equal("workerTargets" in manifest, false);
  assert.ok(packageSource.includes("performance_trick"));
  assert.ok(packageSource.includes("mainhand"));
  assert.ok(packageSource.includes("offhand"));
  assert.ok(packageSource.includes("doublehandWtypes"));
  assert.ok(packageSource.includes("oppositeHandPinned: true"));
  assert.ok(packageSource.includes("classRulesVerified: true"));
  assert.ok(packageSource.includes("gameplayWrites: 0"));
  assert.ok(packageSource.includes("rawWriteCalls: 0"));
  assert.ok(packageSource.includes("publicFunctionCalls: 0"));
  assert.ok(packageSource.includes("normalRuntimeAllowed: false"));
  assert.equal(packageSource.includes("equip("), false);
  assert.equal(packageSource.includes("unequip("), false);
  assert.equal(packageSource.includes("use_skill("), false);
  assert.equal(packageSource.includes("start_character("), false);
  assert.equal(packageSource.includes("command_character("), false);
  assert.equal(packageSource.includes("/disconnect "), false);
  assert.equal(packageSource.includes("send_item("), false);
  assert.equal(packageSource.includes("api_call("), false);
  assert.equal(packageSource.includes("socket.emit("), false);
});

test("PR20.7 account weapon discovery manifest remains merchant-only and zero-write", () => {
  if (!["pr20-7-gear-account-weapon-candidate-discovery", "pr20-7-gear-account-weapon-candidate-discovery-v2"].includes(manifest.testId)) return;
  assert.ok(["1.0.2", "1.0.3"].includes(manifest.controllerVersion));
  if (manifest.testId.endsWith("-v2")) assert.ok(packageSource.includes("candidate-discovery-v2"));
  assert.equal("workerVersion" in manifest, false);
  assert.equal("workerPackagePath" in manifest, false);
  assert.equal("workerPackageSha256" in manifest, false);
  assert.equal("workerExpectedGlobal" in manifest, false);
  assert.equal("workerTargets" in manifest, false);
  assert.ok(packageSource.includes("get_characters"));
  assert.ok(packageSource.includes("X?.characters"));
  if (manifest.controllerVersion === "1.0.3") {
    assert.ok(packageSource.includes("sourceCandidates"));
    assert.ok(packageSource.includes("richFarmerRows"));
    assert.ok(packageSource.includes("X.characters"));
  }
  assert.ok(packageSource.includes("exactLiveSessionPreflightStillRequired: true"));
  assert.ok(packageSource.includes("gameplayWrites: 0"));
  assert.ok(packageSource.includes("publicFunctionCalls: 0"));
  assert.ok(packageSource.includes("rawWriteCalls: 0"));
  assert.ok(packageSource.includes("normalRuntimeAllowed: false"));
  for (const marker of ["equip(", "unequip(", "buy(", "bank_retrieve(", "send_item(", "send_cm(", "use_skill(", "start_character(", "command_character(", "api_call(", "socket.emit("]) {
    assert.equal(packageSource.includes(marker), false, marker);
  }
});


test("PR20.7 offhand acquisition manifest is exact wshield read-only source preflight", () => {
  if (manifest.testId !== "pr20-7-gear-weapon-offhand-acquisition-read-only-preflight") return;
  assert.equal(manifest.controllerVersion, "1.0.1");
  assert.equal(manifest.sourceCommit, "bfcbc3186b1fe374fe37d0dd43d5677511480f5d");
  assert.equal(manifest.packagePath, "v5/werkzeuge/pr20-7-weapon-offhand-acquisition-read-only-v1-0-1-autonomous.js");
  assert.equal(manifest.packageSha256, "0d1378a0bca4ff0665dc14ab67920a15a0532f20ab141c6428edac414c0c3c72");
  assert.equal("workerVersion" in manifest, false);
  assert.equal("workerPackagePath" in manifest, false);
  assert.equal("workerPackageSha256" in manifest, false);
  assert.equal("workerExpectedGlobal" in manifest, false);
  assert.equal("workerTargets" in manifest, false);
  assert.ok(packageSource.includes("performance_trick"));
  assert.ok(packageSource.includes("ITEM_NAME = 'wshield'"));
  assert.ok(packageSource.includes("TARGET_SLOT = 'offhand'"));
  assert.ok(packageSource.includes("EXPECTED_UNIT_PRICE = 4800"));
  assert.ok(packageSource.includes("VENDOR_ID = 'basics'"));
  assert.ok(packageSource.includes("buyWithGoldAvailable"));
  assert.ok(packageSource.includes("observedSellDistance"));
  assert.ok(packageSource.includes("PR20_7_ACQUISITION_BUY_WITH_GOLD_FEHLT"));
  assert.ok(packageSource.includes("PR20_7_ACQUISITION_SELL_DIST_FEHLT"));
  assert.ok(packageSource.includes("PR20_7_ACQUISITION_VENDOR_NICHT_ERREICHBAR"));
  assert.ok(packageSource.includes("goldBudgetLedgerReservationRequired: true"));
  assert.ok(packageSource.includes("goldBudgetLedgerReservationSatisfied: false"));
  assert.ok(packageSource.includes("purchaseAuthority: false"));
  assert.ok(packageSource.includes("gameplayWrites: 0"));
  assert.ok(packageSource.includes("publicFunctionCalls: 0"));
  assert.ok(packageSource.includes("rawWriteCalls: 0"));
  assert.ok(packageSource.includes("startCalls: 0"));
  assert.ok(packageSource.includes("disconnectCalls: 0"));
  assert.ok(packageSource.includes("normalRuntimeAllowed: false"));
  for (const marker of [
    "buy_with_gold(", "buy(", "equip(", "unequip(", "sell(",
    "bank_retrieve(", "bank_store(", "send_item(", "send_gold(",
    "use_skill(", "start_character(", "command_character(",
    "api_call(", "socket.emit(", ".socket.emit(", "/disconnect "
  ]) assert.equal(packageSource.includes(marker), false, marker);
});
