import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const manifest = JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json", "utf8"));
const allowedPackages = Object.freeze({
  "pr20-8-compound-productive-one-write-live": Object.freeze({
    path: "v5/werkzeuge/pr20-8-compound-productive-one-write-live.js",
    expectedGlobal: "V5PR208CompoundProductiveOneWriteLive",
    gate: "PR20.8_WERTMUTATIONEN"
  }),
  "pr20-8-compound-live-5m": Object.freeze({
    path: "v5/werkzeuge/pr20-8-compound-live-5m-v1-0-2.js",
    expectedGlobal: "V5PR208CompoundLive5m",
    gate: "PR20.8_WERTMUTATIONEN"
  }),
  "pr20-8-upgrade-productive-one-write-live": Object.freeze({
    path: "v5/werkzeuge/pr20-8-upgrade-productive-one-write-live-v1-0-3.js",
    expectedGlobal: "V5PR208UpgradeProductiveOneWriteLive",
    gate: "PR20.8_WERTMUTATIONEN"
  }),
  "pr20-8-native-updater-recovery-bootstrap-v1": Object.freeze({
    path: "v5/werkzeuge/pr20-8-updater-recovery-bootstrap-v1.js",
    expectedGlobal: "V5PR208UpdaterRecoveryBootstrap",
    gate: "PR20.8_WERTMUTATIONEN"
  }),
  "pr20-8-native-updater-recovery-bootstrap-v2": Object.freeze({
    path: "v5/werkzeuge/pr20-8-updater-recovery-bootstrap-v2.js",
    expectedGlobal: "V5PR208UpdaterRecoveryBootstrap",
    gate: "PR20.8_WERTMUTATIONEN"
  }),
  "pr20-8-bridge-handshake-probe-v1": Object.freeze({
    path: "v5/werkzeuge/pr20-8-bridge-handshake-probe-v1-0-1.js",
    expectedGlobal: "V5PR208BridgeHandshakeProbe",
    gate: "PR20.8_WERTMUTATIONEN"
  }),
  "pr20-8-upgrade-durable-shadow-no-write": Object.freeze({
    path: "v5/werkzeuge/pr20-8-upgrade-durable-shadow-no-write.js",
    expectedGlobal: "V5PR208UpgradeDurableShadowNoWrite",
    gate: "PR20.8_WERTMUTATIONEN"
  }),
  "pr20-8-compound-durable-shadow-no-write": Object.freeze({
    path: "v5/werkzeuge/pr20-8-compound-durable-shadow-no-write.js",
    expectedGlobal: "V5PR208CompoundDurableShadowNoWrite",
    gate: "PR20.8_WERTMUTATIONEN"
  }),
  "pr20-8-wertmutation-live-candidate-readonly": Object.freeze({
    path: "v5/werkzeuge/pr20-8-wertmutation-live-candidate-readonly-v1-0-6.js",
    expectedGlobal: "V5PR208ValueMutationLiveCandidateReadonly",
    gate: "PR20.8_WERTMUTATIONEN"
  }),
  "pr20-8-exchange-candidate-acquisition-readonly": Object.freeze({
    path: "v5/werkzeuge/pr20-8-exchange-candidate-acquisition-readonly-v1-0-1.js",
    expectedGlobal: "V5PR208ExchangeCandidateAcquisitionReadonly",
    gate: "PR20.8_WERTMUTATIONEN"
  }),
  "pr20-8-exchange-candidate-bank-mount": Object.freeze({
    path: "v5/werkzeuge/pr20-8-exchange-candidate-bank-mount-v1-0-0.js",
    expectedGlobal: "V5PR208ExchangeCandidateBankMount",
    gate: "PR20.8_WERTMUTATIONEN"
  }),
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
    path: "v5/werkzeuge/pr20-7-weapon-offhand-acquisition-read-only-v1-0-2-autonomous.js",
    expectedGlobal: "V5PR207WeaponOffhandAcquisitionReadOnly",
    gate: "PR20.7_GEAR"
  }),
  "pr20-7-gear-weapon-offhand-acquisition-durable-shadow-no-write": Object.freeze({
    path: "v5/werkzeuge/pr20-7-weapon-offhand-acquisition-shadow-no-write-v1-0-1-autonomous.js",
    expectedGlobal: "V5PR207WeaponOffhandAcquisitionShadow",
    gate: "PR20.7_GEAR"
  }),
  "pr20-7-gear-weapon-offhand-acquisition-live-5m": Object.freeze({
    path: "v5/werkzeuge/pr20-7-weapon-offhand-acquisition-live-5m.js",
    expectedGlobal: "V5PR207WeaponOffhandAcquisitionLiveTest",
    gate: "PR20.7_GEAR"
  }),
  "pr20-7-gear-weapon-offhand-equip-live-5m": Object.freeze({
    path: "v5/werkzeuge/pr20-7-weapon-offhand-equip-live-5m.js",
    expectedGlobal: "V5PR207WeaponOffhandEquipLiveTest",
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

test("PR20.8 updater persistence bootstrap is exact, self-persisting and gameplay-no-write", () => {
  if (manifest.testId !== "pr20-8-native-updater-recovery-bootstrap-v1") return;
  assert.equal(manifest.controllerVersion, "1.0.0");
  assert.equal(
    manifest.sourceCommit,
    "e6a52aafcacb5c23c4a2cdfef88250cbb0e3fe2e",
  );
  assert.equal(
    manifest.packageSha256,
    "0745b836e660c1f6a1bd96a4418908c2822556542ca09e7876e624800d2888fb",
  );
  assert.equal(manifest.normalRuntimeAllowed, false);
  assert.ok(packageSource.includes("function installPr208UpdaterRecoveryBootstrapV1()"));
  assert.ok(packageSource.includes("const UPDATER_VERSION = '1.0.8'"));
  assert.ok(packageSource.includes("cleanBundleSource"));
  assert.ok(packageSource.includes("upload_code"));
  assert.ok(packageSource.includes("load_code"));
  assert.ok(packageSource.includes("codeSlotWrites"));
  assert.ok(packageSource.includes("codeSlotReloads"));
  assert.ok(packageSource.includes("gameplayWrites: 0"));
  assert.ok(packageSource.includes("publicFunctionCalls: 0"));
  assert.ok(packageSource.includes("rawWriteCalls: 0"));
  assert.ok(packageSource.includes("sameIntentRetry: false"));
  for (const marker of [
    "socket.emit(", ".socket.emit(", "api_call(", "use_skill(",
    "upgrade(", "compound(", "exchange(", "craft(", "buy(", "sell(",
    "send_item(", "send_gold("
  ]) assert.equal(packageSource.includes(marker), false, marker);
});

test("PR20.8 updater persistence bootstrap v2 fixes split-context handshake and stays gameplay-no-write", () => {
  if (manifest.testId !== "pr20-8-native-updater-recovery-bootstrap-v2") return;
  assert.equal(manifest.controllerVersion, "1.0.0");
  assert.equal(
    manifest.sourceCommit,
    "5f791fc3daa6a173d553d07ac08c7589519df610",
  );
  assert.equal(
    manifest.packageSha256,
    "3ebaf86cd8e454eccab0713035c6a40f2fe0dfd890ee92d59bf1a4e8c01f6e84",
  );
  assert.equal(manifest.normalRuntimeAllowed, false);
  assert.ok(packageSource.includes("function installPr208UpdaterRecoveryBootstrapV2()"));
  assert.ok(packageSource.includes("function installObservabilityBridgeOn(owner)"));
  assert.ok(packageSource.includes("function runtimeRoots()"));
  assert.ok(packageSource.includes("const UPDATER_VERSION = '1.0.8'"));
  assert.ok(packageSource.includes("cleanBundleSource"));
  assert.ok(packageSource.includes("upload_code"));
  assert.ok(packageSource.includes("load_code"));
  assert.ok(packageSource.includes("codeSlotWrites"));
  assert.ok(packageSource.includes("codeSlotReloads"));
  assert.ok(packageSource.includes("gameplayWrites: 0"));
  assert.ok(packageSource.includes("publicFunctionCalls: 0"));
  assert.ok(packageSource.includes("rawWriteCalls: 0"));
  assert.ok(packageSource.includes("sameIntentRetry: false"));
  for (const marker of [
    "socket.emit(", ".socket.emit(", "api_call(", "use_skill(",
    "upgrade(", "compound(", "exchange(", "craft(", "buy(", "sell(",
    "send_item(", "send_gold("
  ]) assert.equal(packageSource.includes(marker), false, marker);
});


test("PR20.8 bridge handshake probe terminal recovery is exact, synchronous, local+parent and zero-write", () => {
  if (manifest.testId !== "pr20-8-bridge-handshake-probe-v1") return;
  assert.equal(manifest.controllerVersion, "1.0.1");
  assert.equal(
    manifest.sourceCommit,
    "fe38f784d9d8bfeac3d9b30874a453716bd9e3bc",
  );
  assert.equal(
    manifest.packageSha256,
    "08d21dde622ed1cf2dd56438225e4274478263908363a5692bcb6c548b58303b",
  );
  assert.equal(manifest.normalRuntimeAllowed, false);
  assert.ok(packageSource.includes('const TEST_ID = "pr20-8-bridge-handshake-probe-v1"'));
  assert.ok(packageSource.includes('const VERSION = "1.0.1"'));
  assert.ok(packageSource.includes('const API_NAME = "V5PR208BridgeHandshakeProbe"'));
  assert.ok(packageSource.includes('status: "BESTANDEN"'));
  assert.ok(packageSource.includes('phase: "BRIDGE_HANDSHAKE_PROBE_COMPLETE"'));
  assert.ok(packageSource.includes("terminal: true"));
  assert.ok(packageSource.includes("synchronous: true"));
  assert.ok(packageSource.includes("diagnosticCompletion: true"));
  assert.ok(packageSource.includes("updaterInstall: false"));
  assert.ok(packageSource.includes("codeSlotPersistence: false"));
  assert.ok(packageSource.includes("gameplayMutation: false"));
  assert.ok(packageSource.includes("function roots()"));
  assert.ok(packageSource.includes("globalThis.parent"));
  assert.ok(packageSource.includes("function installFacade(owner)"));
  assert.ok(packageSource.includes("for (const owner of roots())"));
  assert.ok(packageSource.includes("gameplayWrites: 0"));
  assert.ok(packageSource.includes("publicFunctionCalls: 0"));
  assert.ok(packageSource.includes("rawWriteCalls: 0"));
  for (const marker of [
    "upload_code", "load_code", "upgrade(", "compound(", "exchange(",
    "buy(", "sell(", "send_item(", "send_gold(", "socket.emit(", ".socket.emit(",
    "api_call("
  ]) assert.equal(packageSource.includes(marker), false, marker);
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
  assert.ok(packageSource.includes("const VERSION = '1.0.5'"));
  assert.ok(packageSource.includes("existingFacadeIsCurrent"));
  assert.ok(packageSource.includes("current.testId === TEST_ID"));
  assert.ok(packageSource.includes("current.version === VERSION"));
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
  assert.equal(manifest.controllerVersion, "1.0.1");
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
  assert.equal(manifest.controllerVersion, "1.0.2");
  assert.equal(manifest.sourceCommit, "0228da63fe01e8717ef7aebb85af24bb3b35478b");
  assert.equal(manifest.packagePath, "v5/werkzeuge/pr20-7-weapon-offhand-acquisition-read-only-v1-0-2-autonomous.js");
  assert.equal(manifest.packageSha256, "1931312bfe6b15a2dd0764e774c52c84e6db09c376ee3fd33205b20cc5c9938c");
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
  assert.ok(packageSource.includes("sellDistanceEvidence"));
  assert.ok(packageSource.includes("PR20_7_ACQUISITION_BUY_WITH_GOLD_FEHLT"));
  assert.ok(packageSource.includes("PR20_7_ACQUISITION_SELL_DIST_UNGUELTIG"));
  assert.ok(packageSource.includes("PR20_7_ACQUISITION_VENDOR_NICHT_ERREICHBAR"));
  assert.ok(packageSource.includes("SOURCE_PINNED_SELL_DISTANCE = 400"));
  assert.ok(packageSource.includes("OFFICIAL_SERVER_SOURCE_COMMIT = '90052162eb3ebda36c893e1eb4af643913c8f984'"));
  assert.ok(packageSource.includes("PR20_7_ACQUISITION_SELL_DIST_DRIFT"));
  assert.ok(packageSource.includes("PR20_7_ACQUISITION_SERVER_BINDUNG_DRIFT"));
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


test("PR20.7 offhand acquisition live manifest is exact one-shot purchase", () => {
  if (manifest.testId !== "pr20-7-gear-weapon-offhand-acquisition-live-5m") return;
  assert.equal(manifest.controllerVersion, "1.0.0");
  assert.equal(manifest.sourceCommit, "5efa5e2c92c258e1502ee388e84ba96d4c844027");
  assert.equal(manifest.packagePath,
    "v5/werkzeuge/pr20-7-weapon-offhand-acquisition-live-5m.js");
  assert.equal(manifest.packageSha256,
    "5cecc5a3ca36c2d75e4a6629c36991417b508e364a965c1a945a790aac8bd930");
  assert.equal(manifest.expectedGlobal,
    "V5PR207WeaponOffhandAcquisitionLiveTest");
  assert.equal("workerVersion" in manifest, false);
  assert.equal("workerPackagePath" in manifest, false);
  assert.equal("workerPackageSha256" in manifest, false);
  assert.equal("workerExpectedGlobal" in manifest, false);
  assert.equal("workerTargets" in manifest, false);
  assert.ok(packageSource.includes('const ITEM_NAME = "wshield"'));
  assert.ok(packageSource.includes('const TARGET_SLOT = "offhand"'));
  assert.ok(packageSource.includes("const EXACT_COST = 4800"));
  assert.ok(packageSource.includes("const MIN_GOLD_RESERVE = 1000"));
  assert.ok(packageSource.includes("SOURCE_PINNED_SELL_DISTANCE = 400"));
  assert.ok(packageSource.includes("Object.keys(merchantClass.offhand || {})"));
  assert.ok(packageSource.includes("Object.keys(merchantClass.doublehand || {})"));
  assert.ok(packageSource.includes('"AL-ACTION-BUY-WITH-GOLD"'));
  assert.ok(packageSource.includes('"character:My_Merchant:gold"'));
  assert.ok(packageSource.includes('"character:My_Merchant:inventory"'));
  assert.ok(packageSource.includes('"character:My_Merchant:action_channel:buy"'));
  assert.ok(packageSource.includes('"character:My_Merchant:socket_call_budget"'));
  assert.ok(packageSource.includes("planBudgetReserved: 100"));
  assert.ok(packageSource.includes("serverReserveUntouched: 100"));
  assert.ok(packageSource.includes('sendBoundaryState: "MOEGLICH_GESENDET"'));
  assert.ok(packageSource.includes("possibleSend: true"));
  assert.ok(packageSource.includes("sameIntentRetry: false"));
  assert.ok(packageSource.includes("const SOAK_SAMPLES = 60"));
  assert.equal((packageSource.match(/r\.buy_with_gold\(/g) || []).length, 1);
  for (const marker of [
    "equip(", "unequip(", "sell(", "bank_retrieve(", "bank_store(",
    "send_item(", "send_gold(", "use_skill(", "start_character(",
    "command_character(", "api_call(", "socket.emit(", ".socket.emit(",
    "/disconnect "
  ]) assert.equal(packageSource.includes(marker), false, marker);
});

test("PR20.7 offhand equip live manifest is exact one-shot wshield equip", () => {
  if (manifest.testId !== "pr20-7-gear-weapon-offhand-equip-live-5m") return;
  assert.equal(manifest.controllerVersion, "1.0.0");
  assert.equal(manifest.sourceCommit, "e633cbe60ba4c98e4c61424ff900c542e688090f");
  assert.equal(manifest.packagePath,
    "v5/werkzeuge/pr20-7-weapon-offhand-equip-live-5m.js");
  assert.equal(manifest.packageSha256,
    "381559606c016880921fdb9ee0c50776275a5ceb962c35d91bc1c86529deb3b0");
  assert.equal(manifest.expectedGlobal, "V5PR207WeaponOffhandEquipLiveTest");
  assert.equal("workerVersion" in manifest, false);
  assert.equal("workerPackagePath" in manifest, false);
  assert.equal("workerPackageSha256" in manifest, false);
  assert.equal("workerExpectedGlobal" in manifest, false);
  assert.equal("workerTargets" in manifest, false);
  assert.ok(packageSource.includes('characterName: "My_Merchant"'));
  assert.ok(packageSource.includes('slot: "offhand"'));
  assert.ok(packageSource.includes('candidateName: "wshield"'));
  assert.ok(packageSource.includes('mainhandName: "staff"'));
  assert.ok(packageSource.includes("Object.keys(merchantClass.offhand || {})"));
  assert.ok(packageSource.includes("Object.keys(merchantClass.doublehand || {})"));
  assert.ok(packageSource.includes("exactEmptyOffhandPrestate:true"));
  assert.ok(packageSource.includes("oppositeHandPinned:true"));
  assert.ok(packageSource.includes("durableIntentReadback:true"));
  assert.ok(packageSource.includes('sendBoundaryState:"MOEGLICH_GESENDET"'));
  assert.ok(packageSource.includes('reconciliation:"COMMITTED"'));
  assert.ok(packageSource.includes('settlement:"BESTAETIGT"'));
  assert.ok(packageSource.includes("sameIntentRetry:false"));
  assert.ok(packageSource.includes("const SOAK_SAMPLES = 60"));
  assert.equal((packageSource.match(/r\.equip\(/g) || []).length, 1);
  for (const marker of [
    "unequip(", "buy_with_gold(", "buy(", "sell(", "bank_retrieve(",
    "bank_store(", "send_item(", "send_gold(", "use_skill(",
    "start_character(", "command_character(", "api_call(", "socket.emit(",
    ".socket.emit(", "/disconnect "
  ]) assert.equal(packageSource.includes(marker), false, marker);
});

test("PR20.7 offhand acquisition durable shadow manifest is exact no-send preparation", () => {
  if (manifest.testId !== "pr20-7-gear-weapon-offhand-acquisition-durable-shadow-no-write") return;
  assert.equal(manifest.controllerVersion, "1.0.1");
  assert.equal(manifest.sourceCommit, "0b92ce4002438ef4282622699019b5148da58184");
  assert.equal(manifest.packagePath, "v5/werkzeuge/pr20-7-weapon-offhand-acquisition-shadow-no-write-v1-0-1-autonomous.js");
  assert.equal(manifest.packageSha256, "11c666638c111a3acd04e550bf33b52eb7611f53a0f8f02547b4b199df73793d");
  assert.equal(manifest.expectedGlobal, "V5PR207WeaponOffhandAcquisitionShadow");
  assert.equal("workerVersion" in manifest, false);
  assert.equal("workerPackagePath" in manifest, false);
  assert.equal("workerPackageSha256" in manifest, false);
  assert.equal("workerExpectedGlobal" in manifest, false);
  assert.equal("workerTargets" in manifest, false);
  assert.ok(packageSource.includes("performance_trick"));
  assert.ok(packageSource.includes("ITEM_NAME = 'wshield'"));
  assert.ok(packageSource.includes("TARGET_SLOT = 'offhand'"));
  assert.ok(packageSource.includes("EXACT_COST = 4800"));
  assert.ok(packageSource.includes("MIN_GOLD_RESERVE = 1000"));
  assert.ok(packageSource.includes("SOURCE_PINNED_SELL_DISTANCE = 400"));
  assert.ok(packageSource.includes("Object.keys(merchantClass.offhand || {})"));
  assert.ok(packageSource.includes("Object.keys(merchantClass.doublehand || {})"));
  assert.ok(packageSource.includes("AL-ACTION-BUY-WITH-GOLD"));
  assert.ok(packageSource.includes("character:My_Merchant:gold"));
  assert.ok(packageSource.includes("character:My_Merchant:inventory"));
  assert.ok(packageSource.includes("character:My_Merchant:action_channel:buy"));
  assert.ok(packageSource.includes("character:My_Merchant:socket_call_budget"));
  assert.ok(packageSource.includes("planBudgetReserved: 100"));
  assert.ok(packageSource.includes("serverReserveUntouched: 100"));
  assert.ok(packageSource.includes("ACQUISITION_DURABLE_SHADOW_INTENT_NO_GAMEPLAY_WRITE"));
  assert.ok(packageSource.includes("journalTerminalArt: 'ABBRUCH'"));
  assert.ok(packageSource.includes("sendBoundaryState: 'NICHT_GESENDET'"));
  assert.ok(packageSource.includes("reconciliationClassification: 'NOT_APPLIED'"));
  assert.ok(packageSource.includes("oneShotMaximumUses: 1"));
  assert.ok(packageSource.includes("oneShotPurchaseAuthorityIssued: false"));
  assert.ok(packageSource.includes("gameplayWrites: 0"));
  assert.ok(packageSource.includes("publicFunctionCalls: 0"));
  assert.ok(packageSource.includes("rawWriteCalls: 0"));
  assert.ok(packageSource.includes("sameIntentRetry: false"));
  assert.ok(packageSource.includes("normalRuntimeAllowed: false"));
  for (const marker of [
    "buy_with_gold(", "buy(", "equip(", "unequip(", "sell(",
    "bank_retrieve(", "bank_store(", "send_item(", "send_gold(",
    "use_skill(", "start_character(", "command_character(",
    "api_call(", "socket.emit(", ".socket.emit(", "/disconnect "
  ]) assert.equal(packageSource.includes(marker), false, marker);
});

test("PR20.8 candidate discovery v1.0.6 rescan manifest is exact read-only and special-path closed", () => {
  if (manifest.testId !== "pr20-8-wertmutation-live-candidate-readonly") return;
  assert.equal(manifest.controllerVersion, "1.0.6");
  assert.equal(manifest.sourceCommit, "a5fd67cc9c587b2a20b163915936717c7b4e8321");
  assert.equal(manifest.packagePath,
    "v5/werkzeuge/pr20-8-wertmutation-live-candidate-readonly-v1-0-6.js");
  assert.equal(manifest.packageSha256,
    "fb2395104beee0e611e5150c44183c95976eab188e451c23401271d1ae02e387");
  assert.equal(manifest.expectedGlobal,
    "V5PR208ValueMutationLiveCandidateReadonly");
  assert.equal("workerVersion" in manifest, false);
  assert.equal("workerPackagePath" in manifest, false);
  assert.equal("workerPackageSha256" in manifest, false);
  assert.equal("workerExpectedGlobal" in manifest, false);
  assert.equal("workerTargets" in manifest, false);
  assert.ok(packageSource.includes("const VERSION = '1.0.6'"));
  assert.ok(packageSource.includes("existingFacadeIsCurrent"));
  assert.ok(packageSource.includes("current.testId === TEST_ID"));
  assert.ok(packageSource.includes("current.version === VERSION"));
  assert.ok(packageSource.includes("publish();"));
  assert.ok(packageSource.indexOf("publish();") < packageSource.indexOf("Promise.resolve().then(run)"));
  assert.ok(packageSource.includes("for (const owner of roots())"));
  const publishStart = packageSource.indexOf("function publish()");
  const publishEnd = packageSource.indexOf("\n  }", publishStart);
  assert.equal(packageSource.slice(publishStart, publishEnd).includes("root()"), false);
  assert.ok(packageSource.includes("EXPECTED_CHARACTER = 'My_Merchant'"));
  assert.ok(packageSource.includes("EXPECTED_SERVER_REGION = 'EU'"));
  assert.ok(packageSource.includes("EXPECTED_SERVER_IDENTIFIER = 'I'"));
  assert.ok(packageSource.includes("MAX_UPGRADE_BASE_GOLD = 10000"));
  assert.ok(packageSource.includes("MAX_COMPOUND_BASE_GOLD = 30000"));
  assert.ok(packageSource.includes("MAX_EXCHANGE_BASE_GOLD = 50000"));
  assert.ok(packageSource.includes("SPECIAL_EXCHANGE_NAMES"));
  assert.ok(packageSource.includes("state.selectedCandidates.COMPOUND"));
  assert.ok(packageSource.includes("state.selectedCandidates.EXCHANGE"));
  assert.ok(packageSource.includes("PR20_8_CANDIDATE_KEIN_COMPOUND_ODER_EXCHANGE_NORMALKANDIDAT"));
  assert.ok(packageSource.includes("massExchangeAllowed:false"));
  assert.ok(packageSource.includes("recursiveDropAuthority:false"));
  assert.ok(packageSource.includes("specialMultiOutputAuthority:false"));
  assert.ok(packageSource.includes("gameplayWrites: 0"));
  assert.ok(packageSource.includes("publicFunctionCalls: 0"));
  assert.ok(packageSource.includes("rawWriteCalls: 0"));
  assert.ok(packageSource.includes("sameIntentRetry: false"));
  assert.ok(packageSource.includes("normalRuntimeAllowed: false"));
  for (const marker of [
    "upgrade(", "compound(", "exchange(", "buy(", "buy_with_gold(",
    "equip(", "unequip(", "sell(", "bank_retrieve(", "bank_store(",
    "send_item(", "send_gold(", "use_skill(", "start_character(",
    "command_character(", "api_call(", "socket.emit(", ".socket.emit("
  ]) assert.equal(packageSource.includes(marker), false, marker);
});


test("PR20.8 upgrade durable shadow manifest is exact no-send and service-bound", () => {
  if (manifest.testId !== "pr20-8-upgrade-durable-shadow-no-write") return;
  assert.equal(manifest.controllerVersion, "1.0.1");
  assert.equal(manifest.sourceCommit,
    "6d611de7fadf7a5cb3945ec25f3bc761acb14e3c");
  assert.equal(manifest.packagePath,
    "v5/werkzeuge/pr20-8-upgrade-durable-shadow-no-write.js");
  assert.equal(manifest.packageSha256,
    "7703cff2fa837c19c1febffc064c44084494effa142c3e0fb560feec1af5a9ff");
  assert.equal(manifest.expectedGlobal,
    "V5PR208UpgradeDurableShadowNoWrite");
  assert.equal("workerVersion" in manifest, false);
  assert.equal("workerPackagePath" in manifest, false);
  assert.ok(packageSource.includes("ITEM_NAME = 'gloves'"));
  assert.ok(packageSource.includes("ITEM_LEVEL = 0"));
  assert.ok(packageSource.includes("SCROLL_NAME = 'scroll0'"));
  assert.ok(packageSource.includes("SOURCE_PINNED_SELL_DISTANCE = 400"));
  assert.ok(packageSource.includes("SERVICE_REACHABILITY_SAFETY_MAX = 300"));
  assert.ok(packageSource.includes("publishTelemetryFacades()"));
  assert.ok(packageSource.includes("installTelemetryFacade(owner)"));
  assert.ok(packageSource.includes("recoveredExistingTerminal"));
  assert.ok(packageSource.includes("PR20_8_UPGRADE_SHADOW_TERMINAL_INTENT_DRIFT"));
  assert.ok(packageSource.includes("journalTerminalArt:'ABBRUCH'"));
  assert.ok(packageSource.includes("sendBoundaryState:'NICHT_GESENDET'"));
  assert.ok(packageSource.includes("reconciliationClassification:'NOT_APPLIED'"));
  assert.ok(packageSource.includes("upgradeAuthorityIssued:false"));
  assert.ok(packageSource.includes("normalUpgradeWriteRatification:false"));
  assert.ok(packageSource.includes("gameplayWrites:0"));
  assert.ok(packageSource.includes("publicFunctionCalls:0"));
  assert.ok(packageSource.includes("rawWriteCalls:0"));
  assert.ok(packageSource.includes("sameIntentRetry:false"));
  assert.ok(packageSource.includes("normalRuntimeAllowed:false"));
  for (const marker of [
    "upgrade(", "compound(", "exchange(", "buy(", "buy_with_gold(",
    "equip(", "unequip(", "sell(", "bank_retrieve(", "bank_store(",
    "send_item(", "send_gold(", "use_skill(", "start_character(",
    "command_character(", "api_call(", "socket.emit(", ".socket.emit("
  ]) assert.equal(packageSource.includes(marker), false, marker);
});



test("PR20.8 Compound durable shadow manifest is exact no-send and three-input bound", () => {
  if (manifest.testId !== "pr20-8-compound-durable-shadow-no-write") return;
  assert.equal(manifest.controllerVersion, "1.0.0");
  assert.equal(manifest.sourceCommit,
    "5577a45443db03a8cc0617ce61e0ec4b427d4aea");
  assert.equal(manifest.packagePath,
    "v5/werkzeuge/pr20-8-compound-durable-shadow-no-write.js");
  assert.equal(manifest.packageSha256,
    "94685bc0d439eb86b3a31763ffa0a06854c06572d875f55584a7558c9c368547");
  assert.equal(manifest.expectedGlobal,
    "V5PR208CompoundDurableShadowNoWrite");
  assert.equal("workerVersion" in manifest, false);
  assert.equal("workerPackagePath" in manifest, false);
  assert.equal("workerPackageSha256" in manifest, false);
  assert.equal("workerExpectedGlobal" in manifest, false);
  assert.equal("workerTargets" in manifest, false);
  assert.ok(packageSource.includes("ITEM_NAME = 'hpamulet'"));
  assert.ok(packageSource.includes("ITEM_LEVEL = 0"));
  assert.ok(packageSource.includes("ITEM_BASE_GOLD = 20000"));
  assert.ok(packageSource.includes("SCROLL_NAME = 'cscroll0'"));
  assert.ok(packageSource.includes("DREI_KANDIDATEN_ERFORDERLICH"));
  assert.ok(packageSource.includes("ref?.c_mid"));
  assert.ok(packageSource.includes("Number(scrollDef.g) !== 6400"));
  assert.ok(packageSource.includes("publishTelemetryFacades()"));
  assert.ok(packageSource.includes("installTelemetryFacade(owner)"));
  assert.ok(packageSource.includes("recoveredExistingTerminal"));
  assert.ok(packageSource.includes("PR20_8_COMPOUND_SHADOW_TERMINAL_INTENT_DRIFT"));
  assert.ok(packageSource.includes("journalTerminalArt:'ABBRUCH'"));
  assert.ok(packageSource.includes("sendBoundaryState:'NICHT_GESENDET'"));
  assert.ok(packageSource.includes("reconciliationClassification:'NOT_APPLIED'"));
  assert.ok(packageSource.includes("compoundAuthorityIssued:false"));
  assert.ok(packageSource.includes("normalCompoundWriteRatification:false"));
  assert.ok(packageSource.includes("gameplayWrites:0"));
  assert.ok(packageSource.includes("publicFunctionCalls:0"));
  assert.ok(packageSource.includes("rawWriteCalls:0"));
  assert.ok(packageSource.includes("sameIntentRetry:false"));
  assert.ok(packageSource.includes("normalRuntimeAllowed:false"));
  for (const marker of [
    "upgrade(", "compound(", "exchange(", "buy(", "buy_with_gold(",
    "equip(", "unequip(", "sell(", "bank_retrieve(", "bank_store(",
    "send_item(", "send_gold(", "use_skill(", "start_character(",
    "command_character(", "api_call(", "socket.emit(", ".socket.emit("
  ]) assert.equal(packageSource.includes(marker), false, marker);
});


test("PR20.8 productive Upgrade one-write manifest is exact, one-shot and runtime-closed", () => {
  if (manifest.testId !== "pr20-8-upgrade-productive-one-write-live") return;
  assert.equal(manifest.controllerVersion, "1.0.3");
  assert.equal(
    manifest.sourceCommit,
    "a4f58c98edc4d794a23346183d6f2375dceb5308",
  );
  assert.equal(
    manifest.packageSha256,
    "1290b72479eb5683ebab2c1202d09a2d5918a7a1bbf1a1fd190e48f0e2bab3a1",
  );
  assert.equal("workerVersion" in manifest, false);
  assert.equal("workerPackagePath" in manifest, false);
  assert.equal("workerPackageSha256" in manifest, false);
  assert.equal("workerExpectedGlobal" in manifest, false);
  assert.equal("workerTargets" in manifest, false);
  assert.ok(packageSource.includes(
    'const VERSION = "1.0.3"',
  ));
  assert.ok(packageSource.includes(
    'const TEST_ID = "pr20-8-upgrade-productive-one-write-live"',
  ));
  assert.ok(packageSource.includes("function reusableIncumbentState(value)"));
  assert.ok(packageSource.includes("function validUpgradeDefinition(def)"));
  assert.ok(packageSource.includes("upgradeDefinitionKind"));
  assert.ok(packageSource.includes("upgradeDefinitionMaterial"));
  assert.ok(packageSource.includes("const RUNTIME_LEASE_STALE_NO_INTENT_MS = 120000"));
  assert.ok(packageSource.includes("function terminalZeroWriteDuplicateBlockedState(value)"));
  assert.ok(packageSource.includes("function persistedMutationGuardStatePresent()"));
  assert.ok(packageSource.includes("function canReclaimStaleRuntimeLease(r, existing)"));
  assert.ok(packageSource.includes('"PR20_8_UPGRADE_LIVE_STALE_RUNTIME_LEASE_RECLAIMED"'));
  assert.ok(packageSource.includes("safeZeroWriteNoIntentFailure"));
  assert.ok(packageSource.includes('"Pr208UpgradeOneShotAuthority"'));
  assert.ok(packageSource.includes(
    'sendBoundaryState: "SEND_MOEGLICH_ODER_VERSUCHT"',
  ));
  assert.ok(packageSource.includes("function acquireRuntimeLease()"));
  assert.ok(packageSource.includes("function assertFences(txId)"));
  assert.ok(packageSource.includes("upgradeEffectsFingerprintSha256"));
  assert.ok(packageSource.includes("item?.giveaway === true"));
  assert.ok(packageSource.includes("item?.list === true"));
  assert.ok(packageSource.includes(
    "const PUBLIC_FUNCTION_PROMISE_TIMEOUT_MS = 2000",
  ));
  assert.ok(packageSource.includes('"RECOVERY_PENDING"'));
  assert.ok(packageSource.includes("sameIntentRetry: false"));
  assert.ok(packageSource.includes("normalRuntimeAllowed: false"));
  assert.equal((packageSource.match(/globalThis\.upgrade\(/g) || []).length, 1);
  assert.equal(packageSource.includes("globalThis.compound("), false);
  assert.equal(packageSource.includes("globalThis.exchange("), false);
  assert.equal(packageSource.includes(".socket.emit("), false);
  assert.equal(packageSource.includes("api_call("), false);
});


test("PR20.8 productive Compound one-write manifest is exact, one-shot and runtime-closed", () => {
  if (manifest.testId !== "pr20-8-compound-productive-one-write-live") return;
  assert.equal(manifest.controllerVersion, "1.0.0");
  assert.equal(manifest.sourceCommit, "31edc5c7ce29bb64086be211b703f4f18dd3772b");
  assert.equal(manifest.packagePath, "v5/werkzeuge/pr20-8-compound-productive-one-write-live.js");
  assert.equal(manifest.packageSha256, "c57c6cc38618392f1f26b7c91e0ea10163a8f8bfc33063eaea2785e39b56100c");
  assert.equal(manifest.expectedGlobal, "V5PR208CompoundProductiveOneWriteLive");
  assert.equal(manifest.normalRuntimeAllowed, false);
  assert.equal("workerVersion" in manifest, false);
  assert.equal("workerPackagePath" in manifest, false);
  assert.equal("workerPackageSha256" in manifest, false);
  assert.equal("workerExpectedGlobal" in manifest, false);
  assert.equal("workerTargets" in manifest, false);
  assert.ok(packageSource.includes('const VERSION = "1.0.0"'));
  assert.ok(packageSource.includes('const TEST_ID = "pr20-8-compound-productive-one-write-live"'));
  assert.ok(packageSource.includes('"Pr208CompoundOneShotAuthority"'));
  assert.ok(packageSource.includes('sendBoundaryState: "SEND_MOEGLICH_ODER_VERSUCHT"'));
  assert.ok(packageSource.includes("function acquireRuntimeLease()"));
  assert.ok(packageSource.includes("function assertFences(txId)"));
  assert.ok(packageSource.includes("compoundEffectsFingerprintSha256"));
  assert.ok(packageSource.includes("massproduction"));
  assert.ok(packageSource.includes("massproductionpp"));
  assert.ok(packageSource.includes("compoundDefinitionExact"));
  assert.ok(packageSource.includes("Number(compoundDef.hp) === 240"));
  assert.ok(packageSource.includes("safeZeroWriteNoIntentFailure"));
  assert.ok(packageSource.includes("sameIntentRetry: false"));
  assert.ok(packageSource.includes("normalRuntimeAllowed: false"));
  assert.ok(packageSource.includes('"RECOVERY_PENDING"'));
  assert.equal((packageSource.match(/globalThis\.compound\(/g) || []).length, 1);
  assert.equal(packageSource.includes("globalThis.upgrade("), false);
  assert.equal(packageSource.includes("globalThis.exchange("), false);
  assert.equal(packageSource.includes(".socket.emit("), false);
  assert.equal(packageSource.includes("api_call("), false);
});

test("PR20.8 Compound 5m notification identity recovery manifest is exact and zero-write", () => {
  if (manifest.testId !== "pr20-8-compound-live-5m") return;
  assert.equal(manifest.controllerVersion, "1.0.2");
  assert.equal(
    manifest.sourceCommit,
    "18568cbc9689bd7e27c5a26a4342901d470b72c0",
  );
  assert.equal(
    manifest.packagePath,
    "v5/werkzeuge/pr20-8-compound-live-5m-v1-0-2.js",
  );
  assert.equal(
    manifest.packageSha256,
    "4d9083bf163d98f15d842d64ecfc49ae4c9b8c3452b0b31a499d4b0b5687c849",
  );
  assert.equal(manifest.expectedGlobal, "V5PR208CompoundLive5m");
  assert.equal(manifest.normalRuntimeAllowed, false);
  assert.equal("workerVersion" in manifest, false);
  assert.equal("workerPackagePath" in manifest, false);
  assert.equal("workerPackageSha256" in manifest, false);
  assert.equal("workerExpectedGlobal" in manifest, false);
  assert.equal("workerTargets" in manifest, false);

  for (const marker of [
    'const VERSION = "1.0.2"',
    'const PREVIOUS_VERSION = "1.0.1"',
    'startedAtMs: Date.now()',
    'function validPreviousTerminalProgress(value)',
    'telemetryIdentityRecoveredFromVersion: PREVIOUS_VERSION',
    'startedAtMs: Number(progress.soakStartedAtMs)',
    'const TEST_ID = "pr20-8-compound-live-5m"',
    'const API_NAME = "V5PR208CompoundLive5m"',
    'const SOAK_SAMPLES = 60',
    'const SOAK_INTERVAL_MS = 5000',
    'const SOAK_MIN_DURATION_MS = 299000',
    'sourceSendCount: 1',
    'additionalGameplayWrites: 0',
    'additionalPublicFunctionCalls: 0',
    'additionalRawWriteCalls: 0',
    'noResendPathPresent: true',
    'compoundLive5mTested: true',
    'mayAdvanceToPr20_9: false',
    'normalRuntimeAllowed: false',
  ]) assert.ok(packageSource.includes(marker), marker);

  for (const forbidden of [
    "globalThis.compound(",
    "compound(",
    "upgrade(",
    "exchange(",
    ".socket.emit(",
    "api_call(",
    "sameIntentRetry: true",
    "normalRuntimeAllowed: true",
  ]) assert.equal(packageSource.includes(forbidden), false, forbidden);
});


test("PR20.8 Exchange acquisition discovery manifest remains exact zero-write discovery", () => {
  if (manifest.testId !== "pr20-8-exchange-candidate-acquisition-readonly") return;
  assert.equal(manifest.controllerVersion, "1.0.1");
  assert.equal(
    manifest.sourceCommit,
    "3182b137957416b253dde303bbba54dd800f8b14",
  );
  assert.equal(
    manifest.packageSha256,
    "1acc8253cef6b02b33a6a5de289ce5a7095066d36bc727f9cffa77647e8778ec",
  );
  assert.equal(packageBytes.length, 12605);
  assert.equal(manifest.normalRuntimeAllowed, false);
  assert.ok(packageSource.includes('const TEST_ID = "pr20-8-exchange-candidate-acquisition-readonly"'));
  assert.ok(packageSource.includes('const VERSION = "1.0.1"'));
  assert.ok(packageSource.includes('const API_NAME = "V5PR208ExchangeCandidateAcquisitionReadonly"'));
  assert.ok(packageSource.includes('gameplayWrites: 0'));
  assert.ok(packageSource.includes('publicFunctionCalls: 0'));
  assert.ok(packageSource.includes('rawWriteCalls: 0'));
  assert.ok(packageSource.includes('bankRetrieve: false'));
  assert.ok(packageSource.includes('buy: false'));
  assert.ok(packageSource.includes('farm: false'));
  assert.ok(packageSource.includes('exchange: false'));
  assert.ok(packageSource.includes('normalRuntimeAllowed: false'));
  for (const marker of [
    "bank_retrieve(", "bank_store(", "smart_move(", "buy(", "buy_with_gold(",
    "exchange(", "attack(", "use_skill(", "socket.emit(", ".socket.emit(", "api_call("
  ]) assert.equal(packageSource.includes(marker), false, marker);
});


test("PR20.8 Exchange bank mount manifest pin is exact and retrieve-disabled", () => {
  if (manifest.testId !== "pr20-8-exchange-candidate-bank-mount") return;
  assert.equal(manifest.controllerVersion, "1.0.0");
  assert.equal(manifest.sourceCommit, "5c84fc95b7fed97c3591462faba0a1315289fdce");
  assert.equal(
    manifest.packageSha256,
    "94c053183363c0394922df4f6e422bede3260989e668a3b0942f3e876dbbdc54",
  );
  assert.equal(packageBytes.length, 15430);
  assert.equal(manifest.normalRuntimeAllowed, false);
  assert.ok(packageSource.includes('const TEST_ID = "pr20-8-exchange-candidate-bank-mount"'));
  assert.ok(packageSource.includes('const VERSION = "1.0.0"'));
  assert.ok(packageSource.includes('const API_NAME = "V5PR208ExchangeCandidateBankMount"'));
  assert.ok(packageSource.includes('const TARGET = "bank"'));
  assert.equal((packageSource.match(/smartMove\(TARGET\)/g) ?? []).length, 1);
  for (const marker of [
    "bank_retrieve(",
    "bank_store(",
    "buy(",
    "buy_with_gold(",
    "exchange(",
    "compound(",
    "upgrade(",
    "socket.emit(",
    ".socket.emit(",
  ]) assert.equal(packageSource.includes(marker), false, marker);
});
