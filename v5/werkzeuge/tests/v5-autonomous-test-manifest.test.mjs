import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("roadmap/v5-autonomous-test-manifest.json", "utf8"));
const packageBytes = fs.readFileSync("werkzeuge/pr20-6-mluck-autonomous-live-5m.js");
const packageSource = packageBytes.toString("utf8");
const sha256 = crypto.createHash("sha256").update(packageBytes).digest("hex");

test("V5 Auto-Deploy manifest is narrow, immutable and normal-runtime closed", () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.enabled, true);
  assert.equal(manifest.repository, "Riflex91/Riflex91-Repo");
  assert.equal(manifest.branch, "main");
  assert.equal(manifest.gate, "PR20.6_MLUCK");
  assert.equal(manifest.testId, "pr20-6-mluck-autonomous-live-5m");
  assert.equal(manifest.coordinatorClass, "merchant");
  assert.equal(manifest.workerDistribution, "PACKAGE_OWNED_COMMAND_CHARACTER");
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

test("Merchant package distributes only a narrow heartbeat worker to farmer classes", () => {
  assert.ok(packageSource.includes("function workerSource()"));
  assert.ok(packageSource.includes("r.command_character(name,src)"));
  assert.ok(packageSource.includes("['ranger','priest','mage'].includes(workerClass)"));
  assert.ok(packageSource.includes("if(!['ranger','priest','mage'].includes(workerClass))return;"));
  assert.equal(packageSource.includes("socket.emit("), false);
  assert.equal(packageSource.includes(".socket.emit("), false);
});
