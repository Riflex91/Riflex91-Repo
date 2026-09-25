import test from "node:test";
import assert from "node:assert/strict";

import {
  LIVE_LAB_STAGE_ORDER,
  promoteLiveLabPipeline,
  promoteLiveLabStage,
} from "../src/stage-authority.mjs";

const ready = Object.freeze({
  PR21: { status: "BEREIT_FUER_INTEGRATIONSTEST_NO_WRITE", blocker: [], rawWriteAuthority: false },
  PR22: { status: "ABGESCHLOSSEN", blocker: [], rawWriteAuthority: false },
  PR23: { status: "BEREIT_NO_WRITE", blocker: [], rawWriteAuthority: false },
  PR24: { status: "BESTANDEN", blocker: [], rawWriteAuthority: false },
  PR25: { status: "BESTANDEN", blocker: [], rawWriteAuthority: false },
  PR26: { status: "AUSWAHL_BEREIT_NO_WRITE", blocker: [], rawWriteAuthority: false },
  PR27: { status: "AUSWAHL_BEREIT_NO_WRITE", blocker: [], rawWriteAuthority: false },
  PR28: { status: "PLAN_BEREIT_NO_WRITE", blocker: [], rawWriteAuthority: false },
});

test("PR21 promotion grants only merchant scope plus common live authority", () => {
  const result = promoteLiveLabStage({
    stage: "PR21",
    shadowDecision: ready.PR21,
  });

  assert.equal(result.status, "LIVE_STAGE_ADMITTED");
  assert.equal(result.liveExecutionAllowed, true);
  assert.equal(result.gameplayAuthority, true);
  assert.equal(result.normalRuntimeAllowed, true);
  assert.equal(result.merchantAuthority, true);
  assert.equal(result.movementAuthority, false);
  assert.equal(result.rawWriteAuthority, false);
});

test("PR23 promotion grants farmer action scopes", () => {
  const result = promoteLiveLabStage({
    stage: "PR23",
    shadowDecision: ready.PR23,
  });

  assert.equal(result.status, "LIVE_STAGE_ADMITTED");
  assert.equal(result.movementAuthority, true);
  assert.equal(result.combatAuthority, true);
  assert.equal(result.skillAuthority, true);
  assert.equal(result.lootAuthority, true);
  assert.equal(result.respawnAuthority, true);
  assert.equal(result.merchantAuthority, false);
});

test("PR28 promotion grants world action and server-hop scope", () => {
  const result = promoteLiveLabStage({
    stage: "PR28",
    shadowDecision: ready.PR28,
  });

  assert.equal(result.status, "LIVE_STAGE_ADMITTED");
  assert.equal(result.worldActionAuthority, true);
  assert.equal(result.serverHopAuthority, true);
  assert.equal(result.rawWriteAuthority, false);
});

test("a shadow blocker keeps the promoted stage closed", () => {
  const result = promoteLiveLabStage({
    stage: "PR23",
    shadowDecision: {
      ...ready.PR23,
      blocker: ["PR23_TARGET_EVIDENCE_STALE"],
    },
  });

  assert.equal(result.status, "BLOCKED");
  assert.equal(result.gameplayAuthority, false);
  assert.equal(result.movementAuthority, false);
  assert.ok(result.blocker.includes("LIVE_LAB_SHADOW_DECISION_NOT_READY:PR23"));
});

test("Live Lab safety failure keeps the promoted stage closed", () => {
  const result = promoteLiveLabStage({
    stage: "PR28",
    shadowDecision: ready.PR28,
    safety: { serverPolicyAllowed: false },
  });

  assert.equal(result.status, "BLOCKED");
  assert.equal(result.worldActionAuthority, false);
  assert.ok(result.blocker.includes("LIVE_LAB_SERVER_POLICY_BLOCKED"));
});

test("complete PR21-PR28 pipeline grants the three requested switches", () => {
  const result = promoteLiveLabPipeline({ stages: ready });

  assert.equal(result.status, "LIVE_PIPELINE_ADMITTED");
  assert.deepEqual(
    result.stages.map((x) => x.stage),
    LIVE_LAB_STAGE_ORDER,
  );
  assert.equal(result.liveExecutionAllowed, true);
  assert.equal(result.gameplayAuthority, true);
  assert.equal(result.normalRuntimeAllowed, true);
  assert.equal(result.rawWriteAuthority, false);
  assert.equal(result.pr21ThroughPr28Live, true);
});

test("one missing stage prevents complete pipeline admission", () => {
  const stages = { ...ready };
  delete stages.PR25;

  const result = promoteLiveLabPipeline({ stages });

  assert.equal(result.status, "BLOCKED");
  assert.equal(result.liveExecutionAllowed, false);
  assert.equal(result.gameplayAuthority, false);
  assert.equal(result.normalRuntimeAllowed, false);
  assert.equal(result.pr21ThroughPr28Live, false);
  assert.ok(result.blocker.some((x) => x.includes("PR25")));
});

test("unknown stage is rejected", () => {
  assert.throws(
    () => promoteLiveLabStage({
      stage: "PR29",
      shadowDecision: { status: "BEREIT", blocker: [] },
    }),
    /LIVE_LAB_STAGE_INVALID/,
  );
});
