import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json", "utf8"));
const allowedPackages = Object.freeze({
  "pr20-6-mluck-autonomous-live-5m": Object.freeze({
    path: "v5/werkzeuge/pr20-6-mluck-autonomous-live-5m.js",
    expectedGlobal: "V5PR206MluckTest"
  }),
  "pr20-6-native-updater-recovery-bootstrap-v1": Object.freeze({
    path: "v5/werkzeuge/pr20-6-updater-recovery-bootstrap.js",
    expectedGlobal: "V5PR206UpdaterRecoveryBootstrap"
  }),
  "pr20-6-native-updater-recovery-bootstrap-v2": Object.freeze({
    path: "v5/werkzeuge/pr20-6-updater-recovery-bootstrap.js",
    expectedGlobal: "V5PR206UpdaterRecoveryBootstrap"
  }),
  "pr20-6-native-updater-recovery-bootstrap-v3": Object.freeze({
    path: "v5/werkzeuge/pr20-6-updater-recovery-bootstrap.js",
    expectedGlobal: "V5PR206UpdaterRecoveryBootstrap"
  })
});
const selected = allowedPackages[manifest.testId];
const packageFile = String(manifest.packagePath || "").replace(/^v5\//, "");
const packageBytes = fs.readFileSync(packageFile);
const packageSource = packageBytes.toString("utf8");
const sha256 = crypto.createHash("sha256").update(packageBytes).digest("hex");

test("V5 Auto-Deploy manifest is narrow, immutable and normal-runtime closed", () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.enabled, true);
  assert.equal(manifest.repository, "Riflex91/Riflex91-Repo");
  assert.equal(manifest.branch, "main");
  assert.equal(manifest.gate, "PR20.6_MLUCK");
  assert.ok(selected, "manifest testId must be an explicitly allowed PR20.6 package");
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
  assert.ok(["1.0.0", "1.0.1", "1.0.2"].includes(manifest.controllerVersion));
  assert.equal(packageSource.includes("gameplayWrites: 0"), true);
  assert.equal(packageSource.includes("rawWriteCalls: 0"), true);
  assert.equal(packageSource.includes("sameIntentRetry: false"), true);
  assert.equal(packageSource.includes("normalRuntimeAllowed: false"), true);
  assert.equal(packageSource.includes("use_skill("), false);
  assert.equal(packageSource.includes("start_character("), false);
});
