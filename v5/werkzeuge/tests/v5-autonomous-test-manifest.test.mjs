import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json", "utf8"));
const packageBytes = fs.readFileSync("werkzeuge/pr20-6-mluck-autonomous-live-5m.js");
const packageSource = packageBytes.toString("utf8");
const v3BootstrapSource = fs.readFileSync("../v3/src/ops/v5-autonomous-test-bootstrap.js", "utf8");
const sha256 = crypto.createHash("sha256").update(packageBytes).digest("hex");

test("V5 Auto-Deploy manifest is narrow, immutable, ingame-owned and normal-runtime closed", () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.enabled, true);
  assert.equal(manifest.repository, "Riflex91/Riflex91-Repo");
  assert.equal(manifest.branch, "main");
  assert.equal(manifest.gate, "PR20.6_MLUCK");
  assert.equal(manifest.testId, "pr20-6-mluck-autonomous-live-5m");
  assert.equal(manifest.coordinatorClass, "merchant");
  assert.equal(manifest.workerDistribution, "PACKAGE_OWNED_COMMAND_CHARACTER");
  assert.equal(manifest.deploymentTransport, "V3_INGAME_BOOTSTRAP");
  assert.match(manifest.sourceCommit, /^[0-9a-f]{40}$/);
  assert.match(manifest.packageSha256, /^[0-9a-f]{64}$/);
  assert.equal(manifest.packagePath, "v5/werkzeuge/pr20-6-mluck-autonomous-live-5m.js");
  assert.equal(manifest.normalRuntimeAllowed, false);
  assert.ok(manifest.maxPackageBytes >= packageBytes.length);
  assert.ok(manifest.maxPackageBytes <= 128 * 1024);
});

test("Manifest SHA-256 matches the exact checked-in PR20.6 package", () => {
  assert.equal(sha256, manifest.packageSha256);
  assert.ok(packageSource.includes(manifest.testId));
  assert.ok(packageSource.includes(manifest.expectedGlobal));
});

test("V3 delivers the V5 test bootstrap without Windows Bridge execution authority", () => {
  for (const marker of [
    "V5_INGAME_TEST_BOOTSTRAP",
    "V3_INGAME_BOOTSTRAP",
    "raw.githubusercontent.com/Riflex91/Riflex91-Repo/main/v5/roadmap/v5-autonomous-test-manifest.json",
    "EVALUATION_BOUNDARY_ENTERED",
    "DEPLOYMENT_UNKNOWN_NO_RETRY",
    "sameIntentRetry: false",
    "AIO_V3_AUTOSTART = false",
    "characterClass(this.root) !== 'merchant'",
    "farmerRepositoryFetch: false"
  ]) assert.ok(v3BootstrapSource.includes(marker), marker);
  assert.equal(v3BootstrapSource.includes("windows-bridge"), false);
  assert.equal(v3BootstrapSource.includes("socket.emit("), false);
});

test("Merchant package distributes only a narrow worker and each farmer stops V3 before V5 heartbeat", () => {
  assert.ok(packageSource.includes("function workerSource()"));
  assert.ok(packageSource.includes("r.command_character(name,src)"));
  assert.ok(packageSource.includes("['ranger','priest','mage'].includes(workerClass)"));
  assert.ok(packageSource.includes("if(!['ranger','priest','mage'].includes(workerClass))return;"));
  assert.ok(packageSource.includes("globalThis.AIO_V3_AUTOSTART=false"));
  assert.ok(packageSource.includes("if(old&&typeof old.stop==='function')old.stop()"));
  assert.equal(packageSource.includes("socket.emit("), false);
  assert.equal(packageSource.includes(".socket.emit("), false);
});
