import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, "..", "pr20-6-mluck-autonomous-live-5m.js"), "utf8");

function makeStorage() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); }
  };
}

test("PR20.6 starts missing owned ranger/priest/mage and installs workers only after local activation", async () => {
  const storage = makeStorage();
  const active = { Merchant: "self" };
  const rows = [
    { name: "Merchant", ctype: "merchant", online: true },
    { name: "RangerOne", ctype: "ranger", online: false },
    { name: "PriestOne", ctype: "priest", online: false },
    { name: "MageOne", ctype: "mage", online: false }
  ];
  const starts = [];
  const commands = [];
  const timers = [];

  function workerContext(name, ctype) {
    return {
      console,
      Date,
      JSON,
      Object,
      String,
      Number,
      Boolean,
      Math,
      Promise,
      RegExp,
      Error,
      localStorage: storage,
      setInterval(fn) { timers.push(fn); return timers.length; },
      clearInterval() {},
      character: {
        name,
        ctype,
        id: name + "-session",
        map: "main",
        x: 5,
        y: 5,
        real_x: 5,
        real_y: 5,
        hp: 1000,
        mp: 1000,
        level: 80,
        rip: false,
        s: {}
      },
      user_id: "same-account",
      server_region: "EU",
      server_identifier: "I"
    };
  }

  const sandbox = {
    console,
    Date,
    JSON,
    Object,
    String,
    Number,
    Boolean,
    Math,
    Promise,
    RegExp,
    Error,
    localStorage: storage,
    setTimeout,
    clearTimeout,
    setInterval(fn) { timers.push(fn); return timers.length; },
    clearInterval() {},
    character: {
      name: "Merchant",
      ctype: "merchant",
      id: "merchant-session",
      map: "main",
      x: 0,
      y: 0,
      real_x: 0,
      real_y: 0,
      hp: 1000,
      mp: 1000,
      level: 80,
      rip: false,
      s: {}
    },
    user_id: "same-account",
    server_region: "EU",
    server_identifier: "I",
    G: { skills: { mluck: { level: 1, mp: 10, range: 320 } } },
    entities: {
      ranger: { name: "RangerOne", s: {} },
      priest: { name: "PriestOne", s: {} },
      mage: { name: "MageOne", s: {} }
    },
    get_characters() { return rows; },
    get_active_characters() { return { ...active }; },
    async start_character(name) {
      starts.push(name);
      active[name] = "active";
      const row = rows.find(x => x.name === name);
      if (row) row.online = true;
      return { name };
    },
    command_character(name, code) {
      commands.push(name);
      const row = rows.find(x => x.name === name);
      assert.ok(row, "command target must be owned");
      const ctx = workerContext(name, row.ctype);
      vm.runInNewContext(code, ctx, { filename: "worker.js" });
    },
    is_on_cooldown() { return true; },
    use_skill() { throw new Error("use_skill must not be reached in this lifecycle test"); }
  };
  sandbox.parent = sandbox;

  vm.runInNewContext(source, sandbox, { filename: "pr20-6.js" });
  await new Promise(resolve => setTimeout(resolve, 80));

  assert.deepEqual(starts.sort(), ["MageOne", "PriestOne", "RangerOne"]);
  assert.deepEqual([...new Set(commands)].sort(), ["MageOne", "PriestOne", "RangerOne"]);
  assert.ok(commands.length >= 3);
  assert.equal(commands.includes("Merchant"), false);
  assert.equal(commands.every(name => ["MageOne", "PriestOne", "RangerOne"].includes(name)), true);

  const state = sandbox.V5PR206MluckTest.status();
  assert.equal(state.version, "1.0.1");
  assert.equal(state.characterLifecycle.mode, "ACCOUNT_ROSTER_AUTOSTART_V1");
  assert.equal(state.characterLifecycle.startCalls, 3);
  assert.equal(state.roster.ready, true);
  assert.equal(Array.from(state.roster.missing || []).length, 0);
  assert.equal(state.gameplayWrites, 0);
  assert.equal(state.rawWriteCalls, 0);
  assert.equal(state.sameIntentRetry, false);
});

test("PR20.6 does not start ambiguous same-class account characters", async () => {
  const storage = makeStorage();
  const active = { Merchant: "self" };
  const starts = [];

  const sandbox = {
    console, Date, JSON, Object, String, Number, Boolean, Math, Promise, RegExp, Error,
    localStorage: storage,
    setTimeout(fn, ms) { const timer = setTimeout(fn, ms); timer.unref?.(); return timer; },
    clearTimeout,
    setInterval() { return 1; },
    clearInterval() {},
    character: {
      name: "Merchant", ctype: "merchant", id: "m", map: "main",
      x: 0, y: 0, real_x: 0, real_y: 0, hp: 1000, mp: 1000, level: 80, rip: false, s: {}
    },
    user_id: "same-account",
    server_region: "EU",
    server_identifier: "I",
    get_characters() {
      return [
        { name: "Merchant", ctype: "merchant", online: true },
        { name: "R1", ctype: "ranger", online: false },
        { name: "R2", ctype: "ranger", online: false },
        { name: "P1", ctype: "priest", online: false },
        { name: "M1", ctype: "mage", online: false }
      ];
    },
    get_active_characters() { return { ...active }; },
    async start_character(name) { starts.push(name); active[name] = "active"; return { name }; },
    command_character() {},
    is_on_cooldown() { return true; },
    G: { skills: { mluck: { level: 1, mp: 10, range: 320 } } }
  };
  sandbox.parent = sandbox;

  vm.runInNewContext(source, sandbox, { filename: "pr20-6.js" });
  await new Promise(resolve => setTimeout(resolve, 40));

  assert.equal(starts.includes("R1"), false);
  assert.equal(starts.includes("R2"), false);
  const state = sandbox.V5PR206MluckTest.status();
  const ranger = state.characterLifecycle.required.find(x => x.ctype === "ranger");
  assert.equal(ranger.status, "BLOCKED");
  assert.equal(ranger.reason, "ACCOUNT_RANGER_MEHRDEUTIG");
  assert.equal(state.gameplayWrites, 0);
});
