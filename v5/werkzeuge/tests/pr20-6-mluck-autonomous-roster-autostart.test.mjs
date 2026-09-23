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

test("PR20.6 resolves parent-only get_characters, starts missing owned farmer classes and installs workers after local activation", async () => {
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
  const workerPerformanceTrickCalls = [];

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
    performance_trick() { workerPerformanceTrickCalls.push(name); return true; },
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
    performance_trick() { return true; },
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
  sandbox.parent = {
    get_characters() { return rows; }
  };

  vm.runInNewContext(source, sandbox, { filename: "pr20-6.js" });
  await new Promise(resolve => setTimeout(resolve, 80));

  assert.deepEqual(starts.sort(), ["MageOne", "PriestOne", "RangerOne"]);
  assert.deepEqual([...new Set(commands)].sort(), ["MageOne", "PriestOne", "RangerOne"]);
  assert.deepEqual([...new Set(workerPerformanceTrickCalls)].sort(), ["MageOne", "PriestOne", "RangerOne"]);
  assert.ok(commands.length >= 3);
  assert.equal(commands.includes("Merchant"), false);
  assert.equal(commands.every(name => ["MageOne", "PriestOne", "RangerOne"].includes(name)), true);

  const state = sandbox.V5PR206MluckTest.status();
  assert.equal(state.version, "1.0.7");
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
    performance_trick() { return true; },
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

  const seededRegistry = JSON.parse(storage.getItem("AIO_V5_PR20_6_MLUCK_ACTORS_V1"));
  for (const [name, ctype] of [["P1", "priest"], ["M1", "mage"]]) {
    seededRegistry.actors[name] = {
      schemaVersion: 1,
      testId: "pr20-6-mluck-autonomous-live-5m",
      name,
      ctype,
      sessionId: name + "-session",
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
    };
  }
  storage.setItem("AIO_V5_PR20_6_MLUCK_ACTORS_V1", JSON.stringify(seededRegistry));

  const sandbox = {
    console, Date, JSON, Object, String, Number, Boolean, Math, Promise, RegExp, Error,
    localStorage: storage,
    performance_trick() { return true; },
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
    performance_trick() { return true; },
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
    performance_trick() { return true; },
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
  assert.equal(state.version, "1.0.7");
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


test("PR20.6 v1.0.7 adopts the exact v1.0.5 separate-tab blocker without repeating lifecycle writes", async () => {
  const store = makeStorage();
  const now = Date.now();
  const account = "same-account";
  const accountKey = accountFingerprint(account);
  const actors = {};
  for (const [name, ctype] of [
    ["My_Ranger1", "ranger"],
    ["My_Priest", "priest"],
    ["My_Mage", "mage"]
  ]) {
    actors[name] = {
      schemaVersion: 1,
      testId: "pr20-6-mluck-autonomous-live-5m",
      name,
      ctype,
      sessionId: name + "-session",
      accountKey,
      serverRegion: "EU",
      serverIdentifier: "I",
      map: "main",
      x: 5,
      y: 5,
      hp: 1000,
      mp: 1000,
      level: 80,
      rip: false,
      mluck: { active: false, source: null, strong: false, remainingMs: null },
      runtimeConflict: null,
      performanceTrick: true,
      observedAtMs: now
    };
  }
  store.setItem("AIO_V5_PR20_6_MLUCK_ACTORS_V1", JSON.stringify({
    schemaVersion: 1,
    actors
  }));

  const recovered = (ctype, name) => ({
    ctype,
    method: "PUBLIC_SAY_DISCONNECT_V1",
    targetName: name,
    boundaryEntered: true,
    commandSettled: true,
    commandResult: "RESOLVED",
    postcondition: "OFFLINE_CONFIRMED",
    sourceStartResult: "already_running",
    offlineConfirmedAtMs: now - 10_000,
    postDisconnectStartBoundaryEntered: true,
    postDisconnectStartRequestedAtMs: now - 9_000,
    postDisconnectStartResult: "RESOLVED",
    updatedAtMs: now - 9_000
  });
  const rangerRecovery = {
    ctype: "ranger",
    method: "PUBLIC_SAY_DISCONNECT_V1",
    targetName: "My_Ranger1",
    boundaryEntered: true,
    commandSettled: true,
    commandResult: "RESOLVED",
    postcondition: "TIMEOUT",
    reason: "DISCONNECT_RANGER_POSTCONDITION_TIMEOUT",
    sourceStartResult: "already_running",
    requestedAtMs: now - 60_000,
    updatedAtMs: now - 30_000
  };

  store.setItem("AIO_V5_PR20_6_MLUCK_LIVE_5M_V1", JSON.stringify({
    schemaVersion: 1,
    testId: "pr20-6-mluck-autonomous-live-5m",
    version: "1.0.5",
    status: "BLOCKIERT",
    phase: "ROSTER",
    terminal: true,
    blocker: [
      "PR20_6_ROSTER_AUTOSTART_TIMEOUT",
      "DISCONNECT_RANGER_POSTCONDITION_TIMEOUT",
      "ROSTER_RANGER_FEHLT",
      "ROSTER_PRIEST_FEHLT",
      "ROSTER_MAGE_FEHLT"
    ],
    intents: [],
    gameplayWrites: 0,
    rawWriteCalls: 0,
    sameIntentRetry: false,
    lifecycleRecovery: {
      ranger: rangerRecovery,
      priest: recovered("priest", "My_Priest"),
      mage: recovered("mage", "My_Mage")
    },
    characterLifecycle: {
      mode: "ACCOUNT_ROSTER_AUTOSTART_V2",
      accountStateAvailable: true,
      activeStateAvailable: true,
      startCalls: 0,
      disconnectCalls: 0,
      blockers: ["DISCONNECT_RANGER_POSTCONDITION_TIMEOUT"],
      required: [
        {
          name: "My_Ranger1",
          ctype: "ranger",
          status: "BLOCKED",
          reason: "DISCONNECT_RANGER_POSTCONDITION_TIMEOUT",
          attempts: 1,
          lastResult: "already_running",
          recovery: rangerRecovery
        },
        {
          name: "My_Priest",
          ctype: "priest",
          status: "POST_DISCONNECT_START_POSTCONDITION_PENDING",
          attempts: 0,
          lastResult: null
        },
        {
          name: "My_Mage",
          ctype: "mage",
          status: "POST_DISCONNECT_START_POSTCONDITION_PENDING",
          attempts: 0,
          lastResult: null
        }
      ]
    }
  }));

  let starts = 0;
  let disconnects = 0;
  const sandbox = {
    console, Date, JSON, Object, String, Number, Boolean, Math, Promise, RegExp, Error,
    localStorage: store,
    performance_trick() { return true; },
    setTimeout(fn, ms) { return setTimeout(fn, Math.min(Number(ms) || 0, 2)); },
    clearTimeout,
    setInterval() { return 1; },
    clearInterval() {},
    character: {
      name: "My_Merchant", ctype: "merchant", id: "merchant-session", map: "main",
      x: 0, y: 0, real_x: 0, real_y: 0, hp: 1000, mp: 1000, level: 80, rip: false, s: {}
    },
    user_id: account,
    server_region: "EU",
    server_identifier: "I",
    G: { skills: { mluck: { level: 1, mp: 10, range: 320 } } },
    entities: {
      ranger: { name: "My_Ranger1", s: {} },
      priest: { name: "My_Priest", s: {} },
      mage: { name: "My_Mage", s: {} }
    },
    get_characters() {
      return [
        { name: "My_Merchant", ctype: "merchant", online: true },
        { name: "My_Ranger1", ctype: "ranger", online: true },
        { name: "My_Priest", ctype: "priest", online: true },
        { name: "My_Mage", ctype: "mage", online: true }
      ];
    },
    get_active_characters() { return { My_Merchant: "self" }; },
    start_character() { starts += 1; throw new Error("start_character must not be repeated"); },
    say() { disconnects += 1; throw new Error("disconnect must not be repeated"); },
    command_character() {},
    is_on_cooldown() { return true; },
    use_skill() { throw new Error("use_skill must not be reached"); }
  };
  sandbox.parent = sandbox;

  vm.runInNewContext(source, sandbox, { filename: "pr20-6-v107-recovery.js" });
  await new Promise(resolve => setTimeout(resolve, 35));

  const state = sandbox.V5PR206MluckTest.status();
  assert.equal(state.version, "1.0.7");
  assert.equal(starts, 0);
  assert.equal(disconnects, 0);
  assert.equal(state.gameplayWrites, 0);
  assert.equal(state.rawWriteCalls, 0);
  assert.equal(state.sameIntentRetry, false);
  assert.equal(state.lifecycleRecovery.ranger.postcondition, "TIMEOUT");
  assert.equal(state.lifecycleRecovery.ranger.targetName, "My_Ranger1");
});
