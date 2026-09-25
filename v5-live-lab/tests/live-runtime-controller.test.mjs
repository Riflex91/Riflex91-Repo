import test from "node:test";
import assert from "node:assert/strict";

import { V5LiveLabRuntimeController } from "../src/live-runtime-controller.mjs";

const ready = Object.freeze({
  PR21: { status: "BEREIT_FUER_INTEGRATIONSTEST_NO_WRITE", blocker: [], rawWriteAuthority: false },
  PR22: { status: "ABGESCHLOSSEN", blocker: [], rawWriteAuthority: false },
  PR23: { status: "BEREIT_NO_WRITE", blocker: [], rawWriteAuthority: false },
  PR28: { status: "PLAN_BEREIT_NO_WRITE", blocker: [], rawWriteAuthority: false },
});

function controller(overrides = {}) {
  let now = 1000;
  const calls = [];
  const ports = {
    smartMove: async (...args) => calls.push(["smartMove", ...args]),
    move: async (...args) => calls.push(["move", ...args]),
    attack: async (...args) => calls.push(["attack", ...args]),
    useSkill: async (...args) => calls.push(["useSkill", ...args]),
    loot: async (...args) => calls.push(["loot", ...args]),
    respawn: async (...args) => calls.push(["respawn", ...args]),
    sendCm: async (...args) => calls.push(["sendCm", ...args]),
    buy: async (...args) => calls.push(["buy", ...args]),
    sell: async (...args) => calls.push(["sell", ...args]),
    exchange: async (...args) => calls.push(["exchange", ...args]),
    upgrade: async (...args) => calls.push(["upgrade", ...args]),
    compound: async (...args) => calls.push(["compound", ...args]),
    craft: async (...args) => calls.push(["craft", ...args]),
    sendItem: async (...args) => calls.push(["sendItem", ...args]),
    sendGold: async (...args) => calls.push(["sendGold", ...args]),
    bankStore: async (...args) => calls.push(["bankStore", ...args]),
    bankRetrieve: async (...args) => calls.push(["bankRetrieve", ...args]),
    bankSwap: async (...args) => calls.push(["bankSwap", ...args]),
    changeServer: async (...args) => calls.push(["changeServer", ...args]),
    ...overrides,
  };

  const runtime = new V5LiveLabRuntimeController({
    ports,
    clock: () => ++now,
  });

  return { runtime, calls };
}

test("PR23 movement executes through bounded public port", async () => {
  const { runtime, calls } = controller();

  const result = await runtime.execute(
    { kind: "SMART_MOVE", args: [{ map: "main", x: 10, y: 20 }] },
    { shadowDecision: ready.PR23 },
  );

  assert.equal(result.ok, true);
  assert.equal(result.stage, "PR23");
  assert.equal(result.authority.liveExecutionAllowed, true);
  assert.equal(result.authority.gameplayAuthority, true);
  assert.equal(result.authority.normalRuntimeAllowed, true);
  assert.equal(result.authority.rawWriteAuthority, false);
  assert.deepEqual(calls, [["smartMove", { map: "main", x: 10, y: 20 }]]);
});

test("PR21 irreversible mutation requires intent id and commits once", async () => {
  const { runtime, calls } = controller();

  await runtime.execute(
    { kind: "EXCHANGE", intentId: "exchange:anniversarygift:slot7:1", args: [7] },
    { shadowDecision: ready.PR21 },
  );

  assert.deepEqual(calls, [["exchange", 7]]);
  assert.equal(
    runtime.getIntentState("exchange:anniversarygift:slot7:1").status,
    "COMMITTED",
  );

  await assert.rejects(
    runtime.execute(
      { kind: "EXCHANGE", intentId: "exchange:anniversarygift:slot7:1", args: [7] },
      { shadowDecision: ready.PR21 },
    ),
    /LIVE_LAB_DUPLICATE_OR_UNKNOWN_IRREVERSIBLE_INTENT/,
  );

  assert.equal(calls.length, 1);
});

test("thrown irreversible call becomes UNKNOWN and cannot auto-retry", async () => {
  const { runtime } = controller({
    sendGold: async () => {
      throw new Error("NETWORK_UNKNOWN");
    },
  });

  await assert.rejects(
    runtime.execute(
      { kind: "SEND_GOLD", intentId: "gold:merchant:ranger:1000", args: ["Ranger", 1000] },
      { shadowDecision: ready.PR21 },
    ),
    /NETWORK_UNKNOWN/,
  );

  assert.equal(
    runtime.getIntentState("gold:merchant:ranger:1000").status,
    "UNKNOWN",
  );

  await assert.rejects(
    runtime.execute(
      { kind: "SEND_GOLD", intentId: "gold:merchant:ranger:1000", args: ["Ranger", 1000] },
      { shadowDecision: ready.PR21 },
    ),
    /LIVE_LAB_DUPLICATE_OR_UNKNOWN_IRREVERSIBLE_INTENT/,
  );
});

test("safety blocker prevents port call", async () => {
  const { runtime, calls } = controller();

  await assert.rejects(
    runtime.execute(
      { kind: "ATTACK", args: [{ id: "goo-1" }] },
      {
        shadowDecision: ready.PR23,
        safety: { sessionFresh: false },
      },
    ),
    /LIVE_LAB_INTENT_NOT_AUTHORIZED/,
  );

  assert.deepEqual(calls, []);
});

test("shadow blocker prevents port call", async () => {
  const { runtime, calls } = controller();

  await assert.rejects(
    runtime.execute(
      { kind: "LOOT", args: [] },
      {
        shadowDecision: {
          ...ready.PR23,
          blocker: ["PR23_LOOT_EVIDENCE_STALE"],
        },
      },
    ),
    /LIVE_LAB_INTENT_NOT_AUTHORIZED/,
  );

  assert.deepEqual(calls, []);
});

test("server hop requires PR28 and gets irreversible duplicate protection", async () => {
  const { runtime, calls } = controller();

  await runtime.execute(
    {
      kind: "SERVER_HOP",
      intentId: "hop:EU:I",
      args: ["EU", "I"],
    },
    { shadowDecision: ready.PR28 },
  );

  assert.deepEqual(calls, [["changeServer", "EU", "I"]]);
  assert.equal(runtime.getIntentState("hop:EU:I").status, "COMMITTED");
});

test("runtime logs include begin and terminal action records", async () => {
  const { runtime } = controller();

  await runtime.execute(
    { kind: "SEND_CM", args: ["Merchant", { type: "heartbeat" }] },
    { shadowDecision: ready.PR22 },
  );

  const logs = runtime.exportLogs();
  assert.equal(logs.length, 2);
  assert.equal(logs[0].event, "ACTION_BEGIN");
  assert.equal(logs[1].event, "ACTION_COMMIT");
  assert.equal(logs[0].stage, "PR22");
  assert.equal(runtime.status().rawWriteAuthority, false);
});
