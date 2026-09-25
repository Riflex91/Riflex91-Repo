import test from "node:test";
import assert from "node:assert/strict";

import {
  LIVE_LAB_PROFILE_ID,
  LIVE_LAB_SOURCE_MAIN_SHA,
  liveLabBuildIdentity,
  pruefeLiveLabAdmission,
} from "../src/authority-profile.mjs";

test("safe Live Lab admission enables requested runtime authorities", () => {
  const result = pruefeLiveLabAdmission();

  assert.equal(result.status, "LIVE_ADMITTED");
  assert.equal(result.profileId, LIVE_LAB_PROFILE_ID);
  assert.equal(result.sourceMainSha, LIVE_LAB_SOURCE_MAIN_SHA);
  assert.deepEqual(result.blocker, []);

  assert.equal(result.liveExecutionAllowed, true);
  assert.equal(result.gameplayAuthority, true);
  assert.equal(result.normalRuntimeAllowed, true);

  assert.equal(result.executionAuthority, true);
  assert.equal(result.movementAuthority, true);
  assert.equal(result.combatAuthority, true);
  assert.equal(result.skillAuthority, true);
  assert.equal(result.lootAuthority, true);
  assert.equal(result.respawnAuthority, true);
  assert.equal(result.merchantAuthority, true);
  assert.equal(result.worldActionAuthority, true);
  assert.equal(result.serverHopAuthority, true);

  assert.equal(result.rawWriteAuthority, false);
});

test("emergency stop fails closed and strips live authority", () => {
  const result = pruefeLiveLabAdmission({ emergencyStop: true });

  assert.equal(result.status, "BLOCKED");
  assert.ok(result.blocker.includes("LIVE_LAB_EMERGENCY_STOP"));
  assert.equal(result.liveExecutionAllowed, false);
  assert.equal(result.gameplayAuthority, false);
  assert.equal(result.normalRuntimeAllowed, false);
  assert.equal(result.rawWriteAuthority, false);
});

test("stale or unreconciled runtime state fails closed", () => {
  const result = pruefeLiveLabAdmission({
    sessionFresh: false,
    rosterFresh: false,
    restartReconciled: false,
    ownershipFresh: false,
  });

  assert.equal(result.status, "BLOCKED");
  assert.ok(result.blocker.includes("LIVE_LAB_SESSION_STALE"));
  assert.ok(result.blocker.includes("LIVE_LAB_ROSTER_STALE"));
  assert.ok(result.blocker.includes("LIVE_LAB_RESTART_NOT_RECONCILED"));
  assert.ok(result.blocker.includes("LIVE_LAB_OWNERSHIP_STALE"));
  assert.equal(result.gameplayAuthority, false);
});

test("merchant anti-pingpong and anti-thrash remain hard gates", () => {
  const result = pruefeLiveLabAdmission({
    merchantPingpongDetected: true,
    merchantThrashDetected: true,
  });

  assert.equal(result.status, "BLOCKED");
  assert.ok(result.blocker.includes("LIVE_LAB_MERCHANT_PINGPONG"));
  assert.ok(result.blocker.includes("LIVE_LAB_MERCHANT_THRASH"));
  assert.equal(result.merchantAuthority, false);
});

test("world/server safety and retry bounds remain hard gates", () => {
  const result = pruefeLiveLabAdmission({
    worldContentAllowed: false,
    serverPolicyAllowed: false,
    retryBudgetAvailable: false,
  });

  assert.equal(result.status, "BLOCKED");
  assert.ok(result.blocker.includes("LIVE_LAB_WORLD_CONTENT_BLOCKED"));
  assert.ok(result.blocker.includes("LIVE_LAB_SERVER_POLICY_BLOCKED"));
  assert.ok(result.blocker.includes("LIVE_LAB_RETRY_BUDGET_EXHAUSTED"));
  assert.equal(result.worldActionAuthority, false);
  assert.equal(result.serverHopAuthority, false);
});

test("build identity is stable and embeds runtime commit", () => {
  const id = liveLabBuildIdentity("200791a4f019f8e951f4121c5b329a75c42fcca5");

  assert.equal(id.profileId, LIVE_LAB_PROFILE_ID);
  assert.equal(id.sourceMainSha, LIVE_LAB_SOURCE_MAIN_SHA);
  assert.equal(id.runtimeSha, "200791a4f019f8e951f4121c5b329a75c42fcca5");
  assert.equal(id.buildId, "V5_LIVE_LAB_PR28@200791a4f019");
});

test("invalid runtime commit cannot produce a Live Lab build identity", () => {
  assert.throws(
    () => liveLabBuildIdentity("not-a-sha"),
    /LIVE_LAB_RUNTIME_SHA_INVALID/,
  );
});
