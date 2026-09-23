import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, "..", "pr20-6-mluck-worker-heartbeat.js"), "utf8");

function storage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function runWorker(name, ctype) {
  const store = storage();
  let performanceCalls = 0;
  const timers = [];
  const sandbox = {
    console, Date, JSON, Object, String, Number, Boolean, Math, Promise, RegExp, Error,
    localStorage: store,
    performance_trick() { performanceCalls += 1; return true; },
    setInterval(fn) { timers.push(fn); return timers.length; },
    clearInterval() {},
    character: {
      name, ctype, id: name + "-session", map: "main",
      x: 5, y: 6, real_x: 5, real_y: 6,
      hp: 1000, mp: 900, level: 80, rip: false, s: {}
    },
    user_id: "same-account",
    server_region: "EU",
    server_identifier: "I"
  };
  sandbox.parent = sandbox;
  vm.runInNewContext(source, sandbox, { filename: "pr20-6-mluck-worker-heartbeat.js" });
  return { sandbox, store, performanceCalls, timers };
}

test("PR20.6 bridge worker is exact-name pinned, no-write and performance_trick gated", () => {
  for (const [name, ctype] of [
    ["My_Ranger1", "ranger"],
    ["My_Priest", "priest"],
    ["My_Mage", "mage"]
  ]) {
    const { sandbox, store, performanceCalls } = runWorker(name, ctype);
    assert.equal(performanceCalls, 1);
    const status = sandbox.V5PR206MluckWorker.status();
    assert.equal(status.testId, "pr20-6-mluck-autonomous-live-5m");
    assert.equal(status.version, "1.0.2");
    assert.equal(status.status, "WORKER");
    assert.equal(status.performanceTrick, true);
    assert.equal(status.gameplayWrites, 0);
    assert.equal(status.rawWriteCalls, 0);
    assert.equal(status.sameIntentRetry, false);
    const registry = JSON.parse(store.getItem("AIO_V5_PR20_6_MLUCK_ACTORS_V1"));
    assert.equal(registry.actors[name].name, name);
    assert.equal(registry.actors[name].ctype, ctype);
    assert.equal(registry.actors[name].performanceTrick, true);
  }
});

test("PR20.6 bridge worker rejects unexpected farmer identity without heartbeat publication", () => {
  const { sandbox, store, performanceCalls } = runWorker("My_Ranger2", "ranger");
  assert.equal(performanceCalls, 0);
  const status = sandbox.V5PR206MluckWorker.status();
  assert.equal(status.status, "BLOCKIERT");
  assert.equal(status.blocker, "PR20_6_WORKER_IDENTITY_NOT_ALLOWED");
  assert.equal(store.getItem("AIO_V5_PR20_6_MLUCK_ACTORS_V1"), null);
});

test("PR20.6 bridge worker exposes no gameplay/raw API authority", () => {
  for (const forbidden of ["use_skill(", "socket.emit(", ".socket.emit(", "api_call(", "start_character(", "/disconnect "]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.ok(source.includes("performance_trick"));
  assert.ok(source.includes("My_Ranger1"));
  assert.ok(source.includes("My_Priest"));
  assert.ok(source.includes("My_Mage"));
});
