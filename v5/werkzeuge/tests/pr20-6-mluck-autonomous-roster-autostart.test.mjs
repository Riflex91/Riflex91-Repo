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
  assert.equal(state.version, "1.0.2");
  assert.equal(state.characterLifecycle.mode, "ACCOUNT_ROSTER_AUTOSTART_V2");
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


function accountFingerprint(raw) {
  const input = JSON.stringify({ account: raw });
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

test("PR20.6 resolves ambiguous ranger only from one fresh exact actor-registry match", async () => {
  const storage = makeStorage();
  const active = { Merchant: "self", P1: "active", M1: "active" };
  const starts = [];
  const commands = [];
  const account = "same-account";
  const observedAtMs = Date.now();

  storage.setItem("AIO_V5_PR20_6_MLUCK_ACTORS_V1", JSON.stringify({
    schemaVersion: 1,
    actors: {
      R2: {
        schemaVersion: 1,
        testId: "pr20-6-mluck-autonomous-live-5m",
        name: "R2",
        ctype: "ranger",
        sessionId: "r2-session",
        accountKey: accountFingerprint(account),
        serverRegion: "EU",
        serverIdentifier: "I",
        map: "main",
        x: 5,
        y: 5,
        hp: 1000,
        mp: 1000,
        level: 80,
        rip: false,
        runtimeConflict: null,
        observedAtMs
      }
    }
  }));

  const sandbox = {
    console, Date, JSON, Object, String, Number, Boolean, Math, Promise, RegExp, Error,
    localStorage: storage,
    setTimeout(fn, ms) { return setTimeout(fn, Math.min(Number(ms) || 0, 2)); },
    clearTimeout,
    setInterval() { return 1; },
    clearInterval() {},
    character: {
      name: "Merchant", ctype: "merchant", id: "merchant-session", map: "main",
      x: 0, y: 0, real_x: 0, real_y: 0, hp: 1000, mp: 1000, level: 80, rip: false, s: {}
    },
    user_id: account,
    server_region: "EU",
    server_identifier: "I",
    get_characters() {
      return [
        { name: "Merchant", ctype: "merchant", online: true },
        { name: "R1", ctype: "ranger", online: false },
        { name: "R2", ctype: "ranger", online: true },
        { name: "P1", ctype: "priest", online: true },
        { name: "M1", ctype: "mage", online: true }
      ];
    },
    get_active_characters() { return { ...active }; },
    async start_character(name) { starts.push(name); return { name }; },
    command_character(name) { commands.push(name); },
    is_on_cooldown() { return true; },
    G: { skills: { mluck: { level: 1, mp: 10, range: 320 } } }
  };
  sandbox.parent = sandbox;

  vm.runInNewContext(source, sandbox, { filename: "pr20-6.js" });
  await new Promise(resolve => setTimeout(resolve, 30));

  assert.equal(starts.includes("R1"), false);
  assert.equal(starts.includes("R2"), false);
  const state = sandbox.V5PR206MluckTest.status();
  const ranger = state.characterLifecycle.required.find(x => x.ctype === "ranger");
  assert.equal(ranger.status, "ACTIVE_FRESH_ACTOR");
  assert.equal(ranger.name, "R2");
  assert.equal(ranger.sessionId, "r2-session");
  assert.equal(state.gameplayWrites, 0);
  assert.equal(state.rawWriteCalls, 0);
  assert.equal(state.sameIntentRetry, false);
});

test("PR20.6 recovers exact already_running priest/mage through one official disconnect each and verified offline state", async () => {
  const storage = makeStorage();
  const active = { Merchant: "self", RangerOne: "active" };
  const rows = [
    { name: "Merchant", ctype: "merchant", online: true },
    { name: "RangerOne", ctype: "ranger", online: true },
    { name: "PriestOne", ctype: "priest", online: true },
    { name: "MageOne", ctype: "mage", online: true }
  ];
  const starts = [];
  const disconnects = [];
  const commands = [];

  function runWorker(name, ctype, code) {
    const ctx = {
      console, Date, JSON, Object, String, Number, Boolean, Math, Promise, RegExp, Error,
      localStorage: storage,
      setInterval() { return 1; },
      clearInterval() {},
      character: {
        name, ctype, id: name + "-session", map: "main",
        x: 5, y: 5, real_x: 5, real_y: 5, hp: 1000, mp: 1000, level: 80, rip: false, s: {}
      },
      user_id: "same-account",
      server_region: "EU",
      server_identifier: "I"
    };
    vm.runInNewContext(code, ctx, { filename: "worker.js" });
  }

  const startAttempts = new Map();
  const sandbox = {
    console, Date, JSON, Object, String, Number, Boolean, Math, Promise, RegExp, Error,
    localStorage: storage,
    setTimeout(fn, ms) { return setTimeout(fn, Math.min(Number(ms) || 0, 2)); },
    clearTimeout,
    setInterval() { return 1; },
    clearInterval() {},
    character: {
      name: "Merchant", ctype: "merchant", id: "merchant-session", map: "main",
      x: 0, y: 0, real_x: 0, real_y: 0, hp: 1000, mp: 1000, level: 80, rip: false, s: {}
    },
    user_id: "same-account",
    server_region: "EU",
    server_identifier: "I",
    G: { skills: { mluck: { level: 1, mp: 10, range: 320 } } },
    entities: {},
    get_characters() { return rows.map(row => ({ ...row })); },
    get_active_characters() { return { ...active }; },
    async start_character(name) {
      starts.push(name);
      const count = (startAttempts.get(name) || 0) + 1;
      startAttempts.set(name, count);
      if ((name === "PriestOne" || name === "MageOne") && count === 1) {
        throw { reason: "already_running", name };
      }
      active[name] = "active";
      const row = rows.find(x => x.name === name);
      if (row) row.online = true;
      return { name };
    },
    say(message) {
      assert.match(message, /^\/disconnect [A-Za-z0-9_]{1,40}$/);
      const name = message.slice("/disconnect ".length);
      disconnects.push(name);
      const row = rows.find(x => x.name === name);
      assert.ok(row, "disconnect target must be an owned roster character");
      row.online = false;
      return undefined;
    },
    command_character(name, code) {
      commands.push(name);
      const row = rows.find(x => x.name === name);
      assert.ok(row, "worker target must be an owned roster character");
      runWorker(name, row.ctype, code);
    },
    is_on_cooldown() { return true; },
    use_skill() { throw new Error("use_skill must not be reached in lifecycle recovery test"); }
  };
  sandbox.parent = sandbox;

  vm.runInNewContext(source, sandbox, { filename: "pr20-6.js" });
  await new Promise(resolve => setTimeout(resolve, 80));

  assert.deepEqual(disconnects.sort(), ["MageOne", "PriestOne"]);
  assert.equal(disconnects.filter(name => name === "PriestOne").length, 1);
  assert.equal(disconnects.filter(name => name === "MageOne").length, 1);
  assert.equal(starts.filter(name => name === "PriestOne").length, 2);
  assert.equal(starts.filter(name => name === "MageOne").length, 2);

  const state = sandbox.V5PR206MluckTest.status();
  assert.equal(state.version, "1.0.2");
  assert.equal(state.characterLifecycle.mode, "ACCOUNT_ROSTER_AUTOSTART_V2");
  assert.equal(state.roster.ready, true);
  assert.equal(state.lifecycleRecovery.priest.postcondition, "OFFLINE_CONFIRMED");
  assert.equal(state.lifecycleRecovery.mage.postcondition, "OFFLINE_CONFIRMED");
  assert.equal(state.lifecycleRecovery.priest.method, "PUBLIC_SAY_DISCONNECT_V1");
  assert.equal(state.lifecycleRecovery.mage.method, "PUBLIC_SAY_DISCONNECT_V1");
  assert.equal(state.gameplayWrites, 0);
  assert.equal(state.rawWriteCalls, 0);
  assert.equal(state.sameIntentRetry, false);
  assert.deepEqual(Array.from(state.intents), []);
});
